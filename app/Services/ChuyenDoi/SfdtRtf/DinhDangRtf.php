<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * characterFormat, paragraphFormat và viền của SFDT sang từ điều khiển RTF.
 */
final class DinhDangRtf
{
    /**
     * underline của SFDT sang từ điều khiển gạch chân.
     *
     * @var array<string, string>
     */
    private const GACH_CHAN = [
        'Single' => '\\ul', 'Words' => '\\ulw', 'Double' => '\\uldb', 'Dotted' => '\\uld', 'Dash' => '\\uldash',
        'DashLong' => '\\ulldash', 'DotDash' => '\\uldashd', 'DotDotDash' => '\\uldashdd', 'Thick' => '\\ulth',
        'Wavy' => '\\ulwave', 'WavyDouble' => '\\ululdbwave', 'WavyHeavy' => '\\ulhwave', 'DottedHeavy' => '\\ulthd',
        'DashHeavy' => '\\ulthdash', 'DashLongHeavy' => '\\ulthldash', 'DotDashHeavy' => '\\ulthdashd',
        'DotDotDashHeavy' => '\\ulthdashdd',
    ];

    /**
     * lineStyle của SFDT sang kiểu viền RTF.
     *
     * @var array<string, string>
     */
    private const KIEU_VIEN = [
        'Single' => '\\brdrs', 'Thick' => '\\brdrth', 'Double' => '\\brdrdb', 'Dot' => '\\brdrdot', 'DashLargeGap' => '\\brdrdash',
        'DashSmallGap' => '\\brdrdashsm', 'DashDot' => '\\brdrdashd', 'DashDotDot' => '\\brdrdashdd', 'Triple' => '\\brdrtriple',
        'ThinThickSmallGap' => '\\brdrtnthsg', 'ThickThinSmallGap' => '\\brdrthtnsg', 'ThinThickThinSmallGap' => '\\brdrtnthtnsg',
        'ThinThickMediumGap' => '\\brdrtnthmg', 'ThickThinMediumGap' => '\\brdrthtnmg', 'ThinThickThinMediumGap' => '\\brdrtnthtnmg',
        'ThinThickLargeGap' => '\\brdrtnthlg', 'ThickThinLargeGap' => '\\brdrthtnlg', 'ThinThickThinLargeGap' => '\\brdrtnthtnlg',
        'SingleWavy' => '\\brdrwavy', 'DoubleWavy' => '\\brdrwavydb', 'DashDotStroked' => '\\brdrdashdotstr',
        'Emboss3D' => '\\brdremboss', 'Engrave3D' => '\\brdrengrave', 'Outset' => '\\brdroutset', 'Inset' => '\\brdrinset',
    ];

    public function __construct(private readonly TaiNguyenRtf $taiNguyen) {}

    /**
     * Định dạng ký tự. Đầy đủ (dùng sau \plain): luôn ghi phông, cỡ chữ và mọi thuộc tính bật.
     * Không đầy đủ (bảng kiểu): chỉ ghi các khóa có trong characterFormat, kể cả trạng thái tắt.
     *
     * @param  array<string, mixed>  $kyTu
     */
    public function kyTu(array $kyTu, bool $dayDu = true): string
    {
        $ketQua = '';
        $co = fn (string $khoa): bool => $dayDu || array_key_exists($khoa, $kyTu);

        if ($co('fontFamily') && isset($kyTu['fontFamily'])) {
            $ketQua .= '\\f'.$this->taiNguyen->phong((string) $kyTu['fontFamily']);
        }

        if ($co('fontSize') && isset($kyTu['fontSize'])) {
            $ketQua .= '\\fs'.(int) round((float) $kyTu['fontSize'] * 2);
        }

        if (array_key_exists('fontFamilyBidi', $kyTu) && $kyTu['fontFamilyBidi'] !== null) {
            $ketQua .= '\\af'.$this->taiNguyen->phong((string) $kyTu['fontFamilyBidi']);
        }

        if (array_key_exists('fontSizeBidi', $kyTu) && $kyTu['fontSizeBidi'] !== null) {
            $ketQua .= '\\afs'.(int) round((float) $kyTu['fontSizeBidi'] * 2);
        }

        foreach (['bold' => '\\b', 'italic' => '\\i', 'allCaps' => '\\caps'] as $khoa => $tu) {
            if (! empty($kyTu[$khoa])) {
                $ketQua .= $tu;
            } elseif (! $dayDu && array_key_exists($khoa, $kyTu)) {
                $ketQua .= $tu.'0';
            }
        }

        $gachChan = (string) ($kyTu['underline'] ?? 'None');
        if (isset(self::GACH_CHAN[$gachChan])) {
            $ketQua .= self::GACH_CHAN[$gachChan];
        } elseif (! $dayDu && array_key_exists('underline', $kyTu)) {
            $ketQua .= '\\ulnone';
        }

        $gachNgang = (string) ($kyTu['strikethrough'] ?? 'None');
        if ($gachNgang === 'SingleStrike') {
            $ketQua .= '\\strike';
        } elseif ($gachNgang === 'DoubleStrike') {
            $ketQua .= '\\striked1';
        } elseif (! $dayDu && array_key_exists('strikethrough', $kyTu)) {
            $ketQua .= '\\strike0\\striked0';
        }

        $viTri = (string) ($kyTu['baselineAlignment'] ?? 'Normal');
        if ($viTri === 'Superscript') {
            $ketQua .= '\\super';
        } elseif ($viTri === 'Subscript') {
            $ketQua .= '\\sub';
        } elseif (! $dayDu && array_key_exists('baselineAlignment', $kyTu)) {
            $ketQua .= '\\nosupersub';
        }

        if ($co('fontColor') && array_key_exists('fontColor', $kyTu)) {
            $mau = $this->taiNguyen->mau(is_string($kyTu['fontColor']) ? $kyTu['fontColor'] : null);
            if ($mau > 0 || ! $dayDu) {
                $ketQua .= '\\cf'.$mau;
            }
        }

        $toSang = TaiNguyenRtf::MAU_TO_SANG[(string) ($kyTu['highlightColor'] ?? '')] ?? null;
        if ($toSang !== null) {
            $ketQua .= '\\highlight'.$this->taiNguyen->mau('#'.$toSang);
        }

        if (! empty($kyTu['bidi'])) {
            $ketQua .= '\\rtlch';
        }

        return $ketQua;
    }

    /**
     * Định dạng đoạn: căn lề, thụt, khoảng cách, giãn dòng, tab.
     *
     * @param  array<string, mixed>  $doan
     */
    public function doan(array $doan, bool $dayDu = true): string
    {
        $ketQua = '';
        $co = fn (string $khoa): bool => $dayDu || array_key_exists($khoa, $doan);

        if ($co('textAlignment')) {
            $ketQua .= match ($doan['textAlignment'] ?? 'Left') {
                'Center' => '\\qc',
                'Right' => '\\qr',
                'Justify' => '\\qj',
                default => '\\ql',
            };
        }

        foreach (['leftIndent' => '\\li', 'rightIndent' => '\\ri', 'firstLineIndent' => '\\fi', 'beforeSpacing' => '\\sb', 'afterSpacing' => '\\sa'] as $khoa => $tu) {
            if ($co($khoa)) {
                $ketQua .= $tu.MaRtf::twip((float) ($doan[$khoa] ?? 0));
            }
        }

        if ($co('lineSpacing') && isset($doan['lineSpacing'])) {
            $gian = (float) $doan['lineSpacing'];
            $ketQua .= match ($doan['lineSpacingType'] ?? 'Multiple') {
                'Exactly' => '\\sl-'.abs(MaRtf::twip($gian)).'\\slmult0',
                'AtLeast' => '\\sl'.MaRtf::twip($gian).'\\slmult0',
                default => '\\sl'.(int) round($gian * 240).'\\slmult1',
            };
        }

        if (! empty($doan['contextualSpacing'])) {
            $ketQua .= '\\contextualspace';
        }

        if (isset($doan['outlineLevel']) && preg_match('/^Level([1-9])$/', (string) $doan['outlineLevel'], $khop)) {
            $ketQua .= '\\outlinelevel'.((int) $khop[1] - 1);
        }

        if (! empty($doan['bidi'])) {
            $ketQua .= '\\rtlpar';
        }

        if (array_key_exists('keepWithNext', $doan) && $doan['keepWithNext']) {
            $ketQua .= '\\keepn';
        }

        if (array_key_exists('keepLinesTogether', $doan) && $doan['keepLinesTogether']) {
            $ketQua .= '\\keep';
        }

        foreach (is_array($doan['tabs'] ?? null) ? $doan['tabs'] : [] as $tab) {
            $viTri = (float) ($tab['position'] ?? 0);

            if ($viTri <= 0) {
                continue;
            }

            $ketQua .= match ($tab['tabLeader'] ?? 'None') {
                'Dot' => '\\tldot',
                'Hyphen' => '\\tlhyph',
                'Underscore' => '\\tlul',
                'Single' => '\\tlth',
                default => '',
            };

            $canh = $tab['tabJustification'] ?? 'Left';
            $ketQua .= match ($canh) {
                'Center' => '\\tqc',
                'Right' => '\\tqr',
                'Decimal' => '\\tqdec',
                'List' => '\\jclisttab',
                default => '',
            };
            $ketQua .= ($canh === 'Bar' ? '\\tb' : '\\tx').MaRtf::twip($viTri);
        }

        return $ketQua;
    }

    /**
     * Một viền: kiểu, độ dày (twip), khoảng cách, màu. Viền "None" hoặc "Cleared" là \brdrnone, \brdrnil.
     *
     * @param  array<string, mixed>|null  $vien
     */
    public function vien(?array $vien): string
    {
        $kieu = (string) ($vien['lineStyle'] ?? 'None');

        if (! isset(self::KIEU_VIEN[$kieu])) {
            return $kieu === 'Cleared' ? '\\brdrnil' : '\\brdrnone';
        }

        $ketQua = self::KIEU_VIEN[$kieu].'\\brdrw'.max(1, MaRtf::twip((float) ($vien['lineWidth'] ?? 0.5)));

        if ((float) ($vien['space'] ?? 0) > 0) {
            $ketQua .= '\\brsp'.MaRtf::twip((float) $vien['space']);
        }

        $mau = $this->taiNguyen->mau(is_string($vien['color'] ?? null) ? $vien['color'] : null);

        return $ketQua.($mau > 0 ? '\\brdrcf'.$mau : '');
    }

    /**
     * Viền có nét thật hay không (để chọn giữa viền ô, hàng và bảng).
     *
     * @param  array<string, mixed>|null  $vien
     */
    public static function coNet(?array $vien): bool
    {
        return isset(self::KIEU_VIEN[(string) ($vien['lineStyle'] ?? 'None')]);
    }
}
