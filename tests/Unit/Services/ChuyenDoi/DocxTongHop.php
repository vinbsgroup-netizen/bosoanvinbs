<?php

namespace Tests\Unit\Services\ChuyenDoi;

use ZipArchive;

/**
 * Dựng file DOCX tổng hợp cho test: document.xml từ đoạn body, kèm styles, numbering, settings, đầu/chân trang và ảnh.
 */
final class DocxTongHop
{
    public const KHONG_GIAN_TEN = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        .'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        .'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        .'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" '
        .'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        .'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        .'xmlns:v="urn:schemas-microsoft-com:vml"';

    /**
     * Ảnh PNG 2x2 điểm ảnh.
     */
    public const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANBAEB3fOq3QAAAABJRU5ErkJggg==';

    /**
     * Phần (đường dẫn => nội dung) và quan hệ của document.xml (Id => [loại, đích, ngoài]).
     *
     * @var array<string, string>
     */
    private array $phan = [];

    /**
     * @var array<string, array{0: string, 1: string, 2: bool}>
     */
    private array $quanHe = [];

    public function __construct(private readonly string $body) {}

    public static function voiBody(string $body): self
    {
        return new self($body);
    }

    public function kieu(string $noiDungStyles): self
    {
        return $this->them('word/styles.xml', '<w:styles '.self::KHONG_GIAN_TEN.'>'.$noiDungStyles.'</w:styles>', 'rIdKieu', 'styles');
    }

    public function danhSach(string $noiDungNumbering): self
    {
        return $this->them('word/numbering.xml', '<w:numbering '.self::KHONG_GIAN_TEN.'>'.$noiDungNumbering.'</w:numbering>', 'rIdSo', 'numbering');
    }

    public function caiDat(string $noiDungSettings): self
    {
        return $this->them('word/settings.xml', '<w:settings '.self::KHONG_GIAN_TEN.'>'.$noiDungSettings.'</w:settings>', 'rIdCaiDat', 'settings');
    }

    public function dauTrang(string $ma, string $noiDung): self
    {
        return $this->them('word/header-'.$ma.'.xml', '<w:hdr '.self::KHONG_GIAN_TEN.'>'.$noiDung.'</w:hdr>', $ma, 'header');
    }

    public function chanTrang(string $ma, string $noiDung): self
    {
        return $this->them('word/footer-'.$ma.'.xml', '<w:ftr '.self::KHONG_GIAN_TEN.'>'.$noiDung.'</w:ftr>', $ma, 'footer');
    }

    public function anh(string $ma, string $duLieu): self
    {
        return $this->them('word/media/'.$ma.'.bin', $duLieu, $ma, 'image');
    }

    public function lienKetNgoai(string $ma, string $diaChi): self
    {
        $this->quanHe[$ma] = ['hyperlink', $diaChi, true];

        return $this;
    }

    /**
     * Nội dung nhị phân của file DOCX.
     */
    public function noiDung(): string
    {
        $tep = tempnam(sys_get_temp_dir(), 'docx-test');
        $zip = new ZipArchive;
        $zip->open($tep, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document '.self::KHONG_GIAN_TEN.'><w:body>'.$this->body.'</w:body></w:document>');

        $rels = '';
        foreach ($this->quanHe as $ma => [$loai, $dich, $ngoai]) {
            $rels .= '<Relationship Id="'.$ma.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'.$loai.'" Target="'.htmlspecialchars($dich).'"'.($ngoai ? ' TargetMode="External"' : '').'/>';
        }

        $zip->addFromString('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'.$rels.'</Relationships>');

        foreach ($this->phan as $duong => $noiDung) {
            $zip->addFromString($duong, $noiDung);
        }

        $zip->close();
        $ketQua = (string) file_get_contents($tep);
        @unlink($tep);

        return $ketQua;
    }

    private function them(string $duong, string $noiDung, string $ma, string $loai): self
    {
        $this->phan[$duong] = $noiDung;
        $this->quanHe[$ma] = [$loai, substr($duong, 5), false];

        return $this;
    }
}
