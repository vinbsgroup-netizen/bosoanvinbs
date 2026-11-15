<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMDocument;
use DOMElement;

/**
 * Những gì dùng chung khi đổi một DOCX: gói, kiểu, đánh số, bộ đọc định dạng và cài đặt tài liệu.
 */
final class NguCanhDocx
{
    public readonly DinhDangDocx $dinhDang;

    public readonly KieuDocx $kieu;

    public readonly DanhSachDocx $danhSach;

    public readonly ?DOMDocument $caiDat;

    public function __construct(public readonly GoiDocx $goi, public readonly string $phanTaiLieu)
    {
        $this->dinhDang = new DinhDangDocx($this, $this->phongChuDe());
        $this->kieu = new KieuDocx($this, $this->phanTheoLoai('styles'));
        $this->danhSach = new DanhSachDocx($this, $this->phanTheoLoai('numbering'));
        $this->caiDat = $this->phanTheoLoai('settings');
    }

    /**
     * Phần XML có quan hệ loại cho trước từ tài liệu chính (styles, numbering, settings, theme...).
     */
    public function phanTheoLoai(string $loai): ?DOMDocument
    {
        foreach ($this->goi->quanHe($this->phanTaiLieu) as $quanHe) {
            if (! $quanHe['ngoai'] && str_ends_with($quanHe['loai'], '/'.$loai)) {
                return $this->goi->xml($quanHe['dich']);
            }
        }

        return null;
    }

    /**
     * Phần tử con cấp một của settings.xml theo tên cục bộ.
     */
    public function caiDat(string $ten): ?DOMElement
    {
        return $this->caiDat === null ? null : $this->dinhDang->conTen($this->caiDat->documentElement, $ten);
    }

    /**
     * Phông của theme (word/theme/theme1.xml): minorHAnsi, majorBidi... sang tên phông.
     * Phông cs của theme để trống thì dùng phông cho chữ Ả Rập (như .NET).
     *
     * @return array<string, string>
     */
    private function phongChuDe(): array
    {
        $theme = null;

        foreach ($this->goi->quanHe($this->phanTaiLieu) as $quanHe) {
            if (! $quanHe['ngoai'] && str_ends_with($quanHe['loai'], '/theme')) {
                try {
                    $theme = $this->goi->xml($quanHe['dich']);
                } catch (LoiDocx) {
                    $theme = null;
                }
            }
        }

        if ($theme === null) {
            return [];
        }

        $ketQua = [];

        foreach (['majorFont' => 'major', 'minorFont' => 'minor'] as $tenThe => $tienTo) {
            $nhom = $theme->getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', $tenThe)->item(0);

            if (! $nhom instanceof DOMElement) {
                continue;
            }

            $phong = ['latin' => '', 'ea' => '', 'cs' => '', 'Arab' => ''];

            foreach ($nhom->childNodes as $con) {
                if (! $con instanceof DOMElement) {
                    continue;
                }

                if (in_array($con->localName, ['latin', 'ea', 'cs'], true)) {
                    $phong[$con->localName] = $con->getAttribute('typeface');
                } elseif ($con->localName === 'font' && $con->getAttribute('script') === 'Arab') {
                    $phong['Arab'] = $con->getAttribute('typeface');
                }
            }

            $ketQua[$tienTo.'HAnsi'] = $ketQua[$tienTo.'Ascii'] = $phong['latin'];
            $ketQua[$tienTo.'EastAsia'] = $phong['ea'];
            $ketQua[$tienTo.'Bidi'] = $phong['cs'] !== '' ? $phong['cs'] : $phong['Arab'];
        }

        return array_filter($ketQua, fn (string $ten): bool => $ten !== '');
    }
}
