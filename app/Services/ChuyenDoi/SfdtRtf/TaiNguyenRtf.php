<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * Bảng phông (\fonttbl) và bảng màu (\colortbl) của RTF, gom dần khi ghi nội dung.
 */
final class TaiNguyenRtf
{
    /**
     * Màu tô sáng (highlightColor của SFDT) sang RGB.
     *
     * @var array<string, string>
     */
    public const MAU_TO_SANG = [
        'Yellow' => 'FFFF00', 'BrightGreen' => '00FF00', 'Turquoise' => '00FFFF', 'Pink' => 'FF00FF', 'Blue' => '0000FF',
        'Red' => 'FF0000', 'DarkBlue' => '000080', 'Teal' => '008080', 'Green' => '008000', 'Violet' => '800080',
        'DarkRed' => '800000', 'DarkYellow' => '808000', 'Gray50' => '808080', 'Gray25' => 'C0C0C0', 'Black' => '000000',
        'White' => 'FFFFFF',
    ];

    /**
     * Tên phông theo chỉ số \fN.
     *
     * @var list<string>
     */
    private array $phong = [];

    /**
     * RRGGBB theo chỉ số \cfN - 1 (chỉ số 0 là màu tự động).
     *
     * @var list<string>
     */
    private array $mau = [];

    public function __construct(string $phongMacDinh)
    {
        $this->phong($phongMacDinh);
    }

    /**
     * Chỉ số phông, thêm vào bảng nếu chưa có.
     */
    public function phong(?string $ten): int
    {
        $ten = trim((string) $ten) === '' ? 'Times New Roman' : trim((string) $ten);
        $chiSo = array_search($ten, $this->phong, true);

        if ($chiSo === false) {
            $this->phong[] = $ten;

            return count($this->phong) - 1;
        }

        return $chiSo;
    }

    /**
     * Chỉ số màu (\cfN) của màu SFDT (#RRGGBB hoặc #RRGGBBAA); 0 là màu tự động.
     */
    public function mau(?string $mau): int
    {
        $rgb = self::rgb($mau);

        if ($rgb === null) {
            return 0;
        }

        $chiSo = array_search($rgb, $this->mau, true);

        if ($chiSo === false) {
            $this->mau[] = $rgb;

            return count($this->mau);
        }

        return $chiSo + 1;
    }

    /**
     * RRGGBB của màu SFDT; null nếu là màu tự động hoặc trong suốt (#00000000, "empty").
     */
    public static function rgb(?string $mau): ?string
    {
        $hex = strtoupper(ltrim(trim((string) $mau), '#'));

        if (! preg_match('/^[0-9A-F]{6}([0-9A-F]{2})?$/', $hex)) {
            return null;
        }

        if (strlen($hex) === 8 && substr($hex, 6, 2) === '00') {
            return null;
        }

        return substr($hex, 0, 6);
    }

    public function bangPhong(): string
    {
        $ketQua = '{\\fonttbl';

        foreach ($this->phong as $chiSo => $ten) {
            $ho = preg_match('/symbol|wingdings|webdings/i', $ten) ? '\\ftech\\fcharset2' : '\\fnil\\fcharset0';
            $ketQua .= '{\\f'.$chiSo.$ho.' '.MaRtf::ten($ten).';}';
        }

        return $ketQua.'}';
    }

    public function bangMau(): string
    {
        $ketQua = '{\\colortbl;';

        foreach ($this->mau as $rgb) {
            $ketQua .= '\\red'.hexdec(substr($rgb, 0, 2)).'\\green'.hexdec(substr($rgb, 2, 2)).'\\blue'.hexdec(substr($rgb, 4, 2)).';';
        }

        return $ketQua.'}';
    }
}
