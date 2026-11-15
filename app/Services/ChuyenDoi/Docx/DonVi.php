<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMElement;

/**
 * Đổi đơn vị và đọc giá trị thuộc tính của WordprocessingML sang giá trị SFDT.
 *
 * Dịch vụ .NET giữ số đo dạng float 32 bit (11906 twip thành 595.29998779296875), nên các số đo cũng làm tròn
 * qua float 32 bit để SFDT giống hệt.
 */
final class DonVi
{
    /**
     * Làm tròn qua float 32 bit.
     */
    public static function f32(float $giaTri): float
    {
        return unpack('g', pack('g', $giaTri))[1];
    }

    /**
     * Twip (1/20 điểm) sang điểm. Bộ soạn có thể ghi twip lẻ (4648.999938964844).
     */
    public static function twip(string|float|int|null $giaTri): float
    {
        return self::f32(self::so($giaTri) / 20);
    }

    /**
     * EMU (1/12700 điểm) sang điểm.
     */
    public static function emu(string|float|int|null $giaTri): float
    {
        return self::f32(self::so($giaTri) / 12700);
    }

    /**
     * Đọc số từ chuỗi thuộc tính; chuỗi rỗng hoặc không phải số là 0. Bỏ đơn vị viết kèm (12pt, 1.5in...).
     */
    public static function so(string|float|int|null $giaTri): float
    {
        if (is_int($giaTri) || is_float($giaTri)) {
            return (float) $giaTri;
        }

        $giaTri = trim((string) $giaTri);

        if (preg_match('/^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(pt|in|cm|mm|pc|pi)$/', $giaTri, $khop)) {
            $heSo = ['pt' => 20, 'in' => 1440, 'cm' => 566.9291338, 'mm' => 56.69291338, 'pc' => 240, 'pi' => 240][$khop[2]];

            return (float) $khop[1] * $heSo;
        }

        return is_numeric($giaTri) ? (float) $giaTri : 0.0;
    }

    /**
     * Thuộc tính bật/tắt (w:b, w:i...): không có w:val là bật; "0", "false", "off", "none" là tắt.
     */
    public static function bat(DOMElement $phanTu): bool
    {
        $giaTri = self::thuocTinh($phanTu, 'val');

        return $giaTri === null || ! in_array(strtolower($giaTri), ['0', 'false', 'off', 'none'], true);
    }

    /**
     * Đọc thuộc tính theo tên cục bộ, bất kể tiền tố (w:val, val).
     */
    public static function thuocTinh(DOMElement $phanTu, string $ten): ?string
    {
        if ($phanTu->hasAttributeNS($phanTu->namespaceURI, $ten)) {
            return $phanTu->getAttributeNS($phanTu->namespaceURI, $ten);
        }

        if ($phanTu->hasAttribute($ten)) {
            return $phanTu->getAttribute($ten);
        }

        foreach ($phanTu->attributes as $thuocTinh) {
            if ($thuocTinh->localName === $ten) {
                return $thuocTinh->value;
            }
        }

        return null;
    }

    /**
     * Màu RRGGBB của WordprocessingML sang #RRGGBBAA của SFDT; "auto" là màu tự động (#00000000).
     */
    public static function mau(?string $giaTri): ?string
    {
        if ($giaTri === null || $giaTri === '') {
            return null;
        }

        if (strtolower($giaTri) === 'auto') {
            return '#00000000';
        }

        return preg_match('/^[0-9a-fA-F]{6}$/', $giaTri) ? '#'.strtoupper($giaTri).'FF' : null;
    }
}
