<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * Mã hóa chữ và số đo cho RTF chỉ dùng ASCII.
 */
final class MaRtf
{
    /**
     * Chữ thường sang RTF: \ { } được thoát, ký tự ngoài ASCII viết \uN? (N là số 16 bit có dấu, ký tự ngoài BMP thành
     * cặp surrogate), tab, ngắt dòng, ngắt trang và các ký tự điều khiển của SFDT đổi sang từ điều khiển RTF.
     */
    public static function chu(string $chu): string
    {
        $ketQua = '';
        $doDai = strlen($chu);

        for ($i = 0; $i < $doDai; $i++) {
            $byte = ord($chu[$i]);

            if ($byte < 0x80) {
                $ketQua .= match ($byte) {
                    0x5C => '\\\\',
                    0x7B => '\\{',
                    0x7D => '\\}',
                    0x09 => '\\tab ',
                    0x0B, 0x0A, 0x0D => '\\line ',
                    0x0C => '\\page ',
                    0x1E => '\\_',
                    0x1F => '\\-',
                    default => $byte < 0x20 ? '' : $chu[$i],
                };

                continue;
            }

            $soByte = $byte >= 0xF0 ? 4 : ($byte >= 0xE0 ? 3 : ($byte >= 0xC0 ? 2 : 1));
            $kyTu = substr($chu, $i, $soByte);
            $i += $soByte - 1;
            $ma = mb_check_encoding($kyTu, 'UTF-8') ? mb_ord($kyTu, 'UTF-8') : 0xFFFD;

            if ($ma === 0xA0) {
                $ketQua .= '\\~';

                continue;
            }

            $ketQua .= self::unicode($ma);
        }

        return $ketQua;
    }

    /**
     * Một mã Unicode sang \uN? (cặp surrogate nếu ngoài BMP).
     */
    public static function unicode(int $ma): string
    {
        $donVi = $ma > 0xFFFF
            ? [0xD800 + (($ma - 0x10000) >> 10), 0xDC00 + (($ma - 0x10000) & 0x3FF)]
            : [$ma];

        return implode('', array_map(fn (int $u): string => '\\u'.($u > 32767 ? $u - 65536 : $u).'?', $donVi));
    }

    /**
     * Tên (phông, kiểu, bookmark) trong bảng của RTF: như chữ nhưng bỏ dấu ";" kết thúc mục.
     */
    public static function ten(string $ten): string
    {
        return self::chu(str_replace(';', ',', $ten));
    }

    /**
     * Điểm sang twip.
     */
    public static function twip(float|int|null $diem): int
    {
        return (int) round(((float) $diem) * 20);
    }
}
