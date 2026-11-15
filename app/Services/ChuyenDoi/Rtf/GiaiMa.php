<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Giải mã byte chữ của RTF sang UTF-8 theo bảng mã (code page) của phông hoặc của tài liệu (\ansicpg).
 *
 * Bảng mã một byte dùng bảng tra 128 ký tự cao dựng một lần bằng iconv (không phụ thuộc //IGNORE vốn khác nhau giữa
 * các hệ điều hành); bảng mã hai byte (Nhật, Trung, Hàn) dùng mbstring.
 */
final class GiaiMa
{
    /**
     * Bảng mã Windows ứng với \fcharsetN. Phông ký hiệu (\fcharset2: Symbol, Wingdings) đọc theo 1252 như .NET;
     * trình duyệt trên Windows tự vẽ bằng hình của phông ký hiệu.
     *
     * @var array<int, int>
     */
    private const THEO_CHARSET = [
        0 => 1252, 2 => 1252, 77 => 10000, 128 => 932, 129 => 949, 130 => 1361, 134 => 936, 136 => 950,
        161 => 1253, 162 => 1254, 163 => 1258, 177 => 1255, 178 => 1256, 186 => 1257, 204 => 1251, 222 => 874,
        238 => 1250, 254 => 437, 255 => 850,
    ];

    /**
     * Bảng mã hai byte và tên tương ứng của mbstring.
     *
     * @var array<int, string>
     */
    private const HAI_BYTE = [932 => 'SJIS-win', 936 => 'CP936', 949 => 'UHC', 950 => 'CP950'];

    /**
     * Bảng tra byte cao (0x80-0xFF) sang UTF-8 theo bảng mã.
     *
     * @var array<int, array<string, string>>
     */
    private static array $bangTra = [];

    /**
     * Bảng mã của \fcharsetN; null khi charset mặc định (1) hoặc không biết, lúc đó dùng \ansicpg của tài liệu.
     */
    public static function maTrangTheoCharset(int $charset): ?int
    {
        return self::THEO_CHARSET[$charset] ?? null;
    }

    /**
     * Đổi chuỗi byte sang UTF-8. Byte không có trong bảng mã bị bỏ, kết quả luôn là UTF-8 hợp lệ.
     */
    public static function sangUtf8(string $byte, int $maTrang): string
    {
        if ($byte === '' || ! preg_match('/[\x80-\xFF]/', $byte)) {
            return $byte;
        }

        if ($maTrang === 65001) {
            return mb_scrub($byte, 'UTF-8');
        }

        if (isset(self::HAI_BYTE[$maTrang])) {
            return mb_scrub((string) @mb_convert_encoding($byte, 'UTF-8', self::HAI_BYTE[$maTrang]), 'UTF-8');
        }

        return strtr($byte, self::bangTra($maTrang));
    }

    /**
     * Đổi mã \uN (số 16 bit có dấu) sang ký tự UTF-8; nửa cặp surrogate lẻ thành U+FFFD.
     */
    public static function kyTu(int $ma): string
    {
        if ($ma < 0) {
            $ma += 65536;
        }

        if ($ma < 0 || $ma > 0x10FFFF || ($ma >= 0xD800 && $ma <= 0xDFFF)) {
            return "\u{FFFD}";
        }

        return mb_chr($ma, 'UTF-8') ?: "\u{FFFD}";
    }

    /**
     * @return array<string, string>
     */
    private static function bangTra(int $maTrang): array
    {
        if (isset(self::$bangTra[$maTrang])) {
            return self::$bangTra[$maTrang];
        }

        $ten = $maTrang === 10000 ? 'MACINTOSH' : 'CP'.$maTrang;

        if (@iconv($ten, 'UTF-8', 'a') !== 'a') {
            return self::$bangTra[$maTrang] = $maTrang === 1252 ? self::bang1252() : self::bangTra(1252);
        }

        $bang = [];

        for ($ma = 0x80; $ma <= 0xFF; $ma++) {
            $kyTu = @iconv($ten, 'UTF-8', chr($ma));
            $bang[chr($ma)] = is_string($kyTu) ? $kyTu : '';
        }

        return self::$bangTra[$maTrang] = $bang;
    }

    /**
     * Bảng 1252 dự phòng khi máy không có iconv cho 1252.
     *
     * @return array<string, string>
     */
    private static function bang1252(): array
    {
        $bang = [];

        for ($ma = 0x80; $ma <= 0xFF; $ma++) {
            $bang[chr($ma)] = mb_scrub((string) @mb_convert_encoding(chr($ma), 'UTF-8', 'Windows-1252'), 'UTF-8');
        }

        return $bang;
    }
}
