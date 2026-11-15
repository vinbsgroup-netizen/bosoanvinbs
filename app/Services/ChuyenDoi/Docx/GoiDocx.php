<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMDocument;
use ZipArchive;

/**
 * Gói DOCX (ZIP theo Open Packaging Conventions): đọc phần XML, quan hệ (.rels) và dữ liệu nhị phân (ảnh).
 *
 * ZipArchive chỉ mở được file, nên nội dung được ghi ra file tạm và xóa ngay khi đọc xong.
 */
final class GoiDocx
{
    /**
     * Nội dung từng phần trong gói, theo đường dẫn không có "/" đầu.
     *
     * @var array<string, string>
     */
    private array $cacPhan = [];

    /**
     * Tên phần viết thường sang tên thật (đường dẫn trong ZIP không phân biệt hoa thường theo OPC).
     *
     * @var array<string, string>
     */
    private array $tenThuong = [];

    /**
     * @var array<string, array<string, array{dich: string, loai: string, ngoai: bool}>>
     */
    private array $quanHeDaDoc = [];

    private function __construct() {}

    /**
     * Mở gói từ nội dung nhị phân của file DOCX.
     *
     * @throws LoiDocx
     */
    public static function tuNoiDung(string $docx): self
    {
        if (! str_starts_with($docx, "PK\x03\x04")) {
            throw new LoiDocx('File không phải DOCX (không phải gói ZIP).');
        }

        $tepTam = tempnam(sys_get_temp_dir(), 'docx');

        if ($tepTam === false || file_put_contents($tepTam, $docx) === false) {
            throw new LoiDocx('Không tạo được file tạm để đọc DOCX.');
        }

        $goi = new self;

        try {
            $zip = new ZipArchive;

            if ($zip->open($tepTam, ZipArchive::RDONLY) !== true) {
                throw new LoiDocx('File DOCX bị hỏng (không mở được gói ZIP).');
            }

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $ten = (string) $zip->getNameIndex($i);

                if ($ten === '' || str_ends_with($ten, '/')) {
                    continue;
                }

                $noiDung = $zip->getFromIndex($i);

                if ($noiDung === false) {
                    throw new LoiDocx('File DOCX bị hỏng (không giải nén được '.$ten.').');
                }

                $ten = ltrim(str_replace('\\', '/', $ten), '/');
                $goi->cacPhan[$ten] = $noiDung;
                $goi->tenThuong[strtolower($ten)] = $ten;
            }

            $zip->close();
        } finally {
            @unlink($tepTam);
        }

        return $goi;
    }

    /**
     * Đường dẫn phần tài liệu chính (thường là word/document.xml), theo _rels/.rels.
     *
     * @throws LoiDocx
     */
    public function phanTaiLieu(): string
    {
        foreach ($this->quanHe('') as $quanHe) {
            if (str_ends_with($quanHe['loai'], '/officeDocument') && $this->co($quanHe['dich'])) {
                return $quanHe['dich'];
            }
        }

        if ($this->co('word/document.xml')) {
            return $this->tenThat('word/document.xml');
        }

        throw new LoiDocx('File DOCX không có nội dung văn bản (thiếu word/document.xml).');
    }

    public function co(string $duong): bool
    {
        return isset($this->tenThuong[strtolower(ltrim($duong, '/'))]);
    }

    /**
     * Nội dung nhị phân của một phần, null nếu không có.
     */
    public function nhiPhan(string $duong): ?string
    {
        $ten = $this->tenThuong[strtolower(ltrim($duong, '/'))] ?? null;

        return $ten === null ? null : $this->cacPhan[$ten];
    }

    /**
     * Đọc một phần XML. Phần không có trả null; XML hỏng ném lỗi.
     *
     * @throws LoiDocx
     */
    public function xml(string $duong): ?DOMDocument
    {
        $noiDung = $this->nhiPhan($duong);

        if ($noiDung === null) {
            return null;
        }

        $tai = new DOMDocument;
        $loiCu = libxml_use_internal_errors(true);

        try {
            $doc = $tai->loadXML($noiDung, LIBXML_NONET | LIBXML_COMPACT | LIBXML_PARSEHUGE | LIBXML_NOCDATA);
            libxml_clear_errors();
        } finally {
            libxml_use_internal_errors($loiCu);
        }

        if (! $doc || $tai->documentElement === null) {
            throw new LoiDocx('File DOCX bị hỏng (phần '.$duong.' không phải XML hợp lệ).');
        }

        return $tai;
    }

    /**
     * Các quan hệ của một phần (từ <thư mục>/_rels/<tên>.rels), theo Id. Phần rỗng ('') là quan hệ của gói.
     *
     * @return array<string, array{dich: string, loai: string, ngoai: bool}>
     */
    public function quanHe(string $phan): array
    {
        if (isset($this->quanHeDaDoc[$phan])) {
            return $this->quanHeDaDoc[$phan];
        }

        $thuMuc = str_contains($phan, '/') ? substr($phan, 0, strrpos($phan, '/')) : '';
        $tepRels = ($thuMuc === '' ? '' : $thuMuc.'/').'_rels/'.($phan === '' ? '' : basename($phan)).'.rels';
        $ketQua = [];

        try {
            $xml = $this->xml($tepRels);
        } catch (LoiDocx) {
            $xml = null;
        }

        foreach ($xml?->documentElement->childNodes ?? [] as $nut) {
            if (! $nut instanceof \DOMElement || $nut->localName !== 'Relationship') {
                continue;
            }

            $ngoai = strtolower($nut->getAttribute('TargetMode')) === 'external';
            $dich = $nut->getAttribute('Target');
            $ketQua[$nut->getAttribute('Id')] = [
                'dich' => $ngoai ? $dich : $this->giaiDuongDan($thuMuc, $dich),
                'loai' => $nut->getAttribute('Type'),
                'ngoai' => $ngoai,
            ];
        }

        return $this->quanHeDaDoc[$phan] = $ketQua;
    }

    /**
     * Ghép đường dẫn đích của quan hệ với thư mục của phần nguồn, xử lý "/" đầu và "..".
     */
    private function giaiDuongDan(string $thuMuc, string $dich): string
    {
        $dich = rawurldecode(str_replace('\\', '/', $dich));
        $duong = str_starts_with($dich, '/') ? ltrim($dich, '/') : ($thuMuc === '' ? $dich : $thuMuc.'/'.$dich);
        $cacDoan = [];

        foreach (explode('/', $duong) as $doan) {
            if ($doan === '..') {
                array_pop($cacDoan);
            } elseif ($doan !== '' && $doan !== '.') {
                $cacDoan[] = $doan;
            }
        }

        return $this->tenThat(implode('/', $cacDoan));
    }

    private function tenThat(string $duong): string
    {
        return $this->tenThuong[strtolower($duong)] ?? $duong;
    }
}
