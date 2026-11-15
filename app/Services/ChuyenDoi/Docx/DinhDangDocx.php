<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMElement;

/**
 * Đọc định dạng ký tự (w:rPr), đoạn (w:pPr), viền và nền của WordprocessingML sang SFDT.
 *
 * Như dịch vụ .NET, SFDT chỉ ghi thuộc tính có khai báo trực tiếp trong XML; phần còn lại bộ soạn tự lấy từ kiểu
 * (style) và mặc định của tài liệu. Thứ tự khóa theo thứ tự .NET ghi.
 */
final class DinhDangDocx
{
    /**
     * Thứ tự khóa characterFormat như .NET ghi.
     *
     * @var list<string>
     */
    private const THU_TU_KY_TU = [
        'bold', 'italic', 'underline', 'strikethrough', 'baselineAlignment', 'highlightColor', 'fontSize', 'fontFamily',
        'fontColor', 'styleName', 'bidi', 'boldBidi', 'italicBidi', 'fontSizeBidi', 'fontFamilyBidi', 'allCaps',
    ];

    /**
     * Thứ tự khóa paragraphFormat như .NET ghi.
     *
     * @var list<string>
     */
    private const THU_TU_DOAN = [
        'leftIndent', 'rightIndent', 'firstLineIndent', 'beforeSpacing', 'afterSpacing', 'lineSpacing', 'lineSpacingType',
        'outlineLevel', 'textAlignment', 'styleName', 'listFormat', 'tabs', 'contextualSpacing', 'bidi',
    ];

    /**
     * w:u sang underline của SFDT.
     *
     * @var array<string, string>
     */
    private const GACH_CHAN = [
        'single' => 'Single', 'words' => 'Words', 'double' => 'Double', 'thick' => 'Thick', 'dotted' => 'Dotted',
        'dottedHeavy' => 'DottedHeavy', 'dash' => 'Dash', 'dashedHeavy' => 'DashHeavy', 'dashLong' => 'DashLong',
        'dashLongHeavy' => 'DashLongHeavy', 'dotDash' => 'DotDash', 'dashDotHeavy' => 'DotDashHeavy',
        'dotDotDash' => 'DotDotDash', 'dashDotDotHeavy' => 'DotDotDashHeavy', 'wave' => 'Wavy', 'wavyHeavy' => 'WavyHeavy',
        'wavyDouble' => 'WavyDouble', 'none' => 'None',
    ];

    /**
     * w:highlight sang highlightColor của SFDT.
     *
     * @var array<string, string>
     */
    private const TO_SANG = [
        'yellow' => 'Yellow', 'green' => 'BrightGreen', 'cyan' => 'Turquoise', 'magenta' => 'Pink', 'blue' => 'Blue',
        'red' => 'Red', 'darkBlue' => 'DarkBlue', 'darkCyan' => 'Teal', 'darkGreen' => 'Green', 'darkMagenta' => 'Violet',
        'darkRed' => 'DarkRed', 'darkYellow' => 'DarkYellow', 'darkGray' => 'Gray50', 'lightGray' => 'Gray25',
        'black' => 'Black', 'none' => 'NoColor',
    ];

    /**
     * Viền không nét đặt tường minh ("none") và viền không khai báo.
     *
     * @var array<string, mixed>
     */
    private const VIEN_NONE = ['lineStyle' => 'None', 'lineWidth' => 0.0, 'shadow' => false, 'space' => 0.0, 'hasNoneStyle' => true];

    /**
     * @var array<string, mixed>
     */
    private const VIEN_TRONG = ['lineStyle' => 'None', 'lineWidth' => 0.0, 'shadow' => false, 'space' => 0.0, 'hasNoneStyle' => false];

    /**
     * Kiểu viền của WordprocessingML sang lineStyle của SFDT.
     *
     * @var array<string, string>
     */
    public const KIEU_VIEN = [
        'single' => 'Single', 'thick' => 'Thick', 'double' => 'Double', 'dotted' => 'Dot', 'dashed' => 'DashLargeGap',
        'dashSmallGap' => 'DashSmallGap', 'dotDash' => 'DashDot', 'dotDotDash' => 'DashDotDot', 'triple' => 'Triple',
        'thinThickSmallGap' => 'ThinThickSmallGap', 'thickThinSmallGap' => 'ThickThinSmallGap',
        'thinThickThinSmallGap' => 'ThinThickThinSmallGap', 'thinThickMediumGap' => 'ThinThickMediumGap',
        'thickThinMediumGap' => 'ThickThinMediumGap', 'thinThickThinMediumGap' => 'ThinThickThinMediumGap',
        'thinThickLargeGap' => 'ThinThickLargeGap', 'thickThinLargeGap' => 'ThickThinLargeGap',
        'thinThickThinLargeGap' => 'ThinThickThinLargeGap', 'wave' => 'SingleWavy', 'doubleWave' => 'DoubleWavy',
        'dashDotStroked' => 'DashDotStroked', 'threeDEmboss' => 'Emboss3D', 'threeDEngrave' => 'Engrave3D',
        'outset' => 'Outset', 'inset' => 'Inset', 'none' => 'None', 'nil' => 'Cleared',
    ];

    /**
     * @param  array<string, string>  $phongChuDe  phông của theme: minorHAnsi, majorHAnsi, minorBidi...
     */
    public function __construct(private readonly NguCanhDocx $nguCanh, private readonly array $phongChuDe) {}

    /**
     * w:rPr sang characterFormat.
     *
     * @return array<string, mixed>
     */
    public function kyTu(?DOMElement $rPr): array
    {
        if ($rPr === null) {
            return [];
        }

        $ketQua = [];
        $gachNgang = null;

        foreach ($this->con($rPr) as $phanTu) {
            switch ($phanTu->localName) {
                case 'rStyle':
                    $ten = $this->nguCanh->kieu->tenKieu($this->val($phanTu));
                    if ($ten !== null) {
                        $ketQua['styleName'] = $ten;
                    }
                    break;
                case 'rFonts':
                    $this->phong($phanTu, $ketQua);
                    break;
                case 'b':
                    $ketQua['bold'] = DonVi::bat($phanTu);
                    break;
                case 'bCs':
                    $ketQua['boldBidi'] = DonVi::bat($phanTu);
                    break;
                case 'i':
                    $ketQua['italic'] = DonVi::bat($phanTu);
                    break;
                case 'iCs':
                    $ketQua['italicBidi'] = DonVi::bat($phanTu);
                    break;
                case 'u':
                    // w:u="none" .NET không ghi ra.
                    if ($this->val($phanTu) !== 'none') {
                        $ketQua['underline'] = self::GACH_CHAN[$this->val($phanTu) ?? 'single'] ?? 'Single';
                    }
                    break;
                case 'strike':
                    $gachNgang = DonVi::bat($phanTu) ? 'SingleStrike' : ($gachNgang ?? 'None');
                    break;
                case 'dstrike':
                    $gachNgang = DonVi::bat($phanTu) ? 'DoubleStrike' : ($gachNgang ?? 'None');
                    break;
                case 'vertAlign':
                    $ketQua['baselineAlignment'] = match ($this->val($phanTu)) {
                        'superscript' => 'Superscript',
                        'subscript' => 'Subscript',
                        default => 'Normal',
                    };
                    break;
                case 'highlight':
                    $ketQua['highlightColor'] = self::TO_SANG[$this->val($phanTu) ?? 'none'] ?? 'NoColor';
                    break;
                case 'sz':
                    $ketQua['fontSize'] = DonVi::so($this->val($phanTu)) / 2;
                    break;
                case 'szCs':
                    $ketQua['fontSizeBidi'] = DonVi::so($this->val($phanTu)) / 2;
                    break;
                case 'color':
                    $mau = DonVi::mau($this->val($phanTu));
                    if ($mau !== null) {
                        $ketQua['fontColor'] = $mau;
                    }
                    break;
                case 'caps':
                    $ketQua['allCaps'] = DonVi::bat($phanTu);
                    break;
                case 'rtl':
                    $ketQua['bidi'] = DonVi::bat($phanTu);
                    break;
            }
        }

        if ($gachNgang !== null) {
            $ketQua['strikethrough'] = $gachNgang;
        }

        return self::sapXep($ketQua, self::THU_TU_KY_TU);
    }

    /**
     * w:pPr sang paragraphFormat (không gồm định dạng dấu đoạn w:rPr và w:sectPr).
     *
     * @return array<string, mixed>
     */
    public function doan(?DOMElement $pPr): array
    {
        if ($pPr === null) {
            return [];
        }

        $ketQua = [];

        foreach ($this->con($pPr) as $phanTu) {
            switch ($phanTu->localName) {
                case 'pStyle':
                    $ten = $this->nguCanh->kieu->tenKieu($this->val($phanTu));
                    if ($ten !== null) {
                        $ketQua['styleName'] = $ten;
                    }
                    break;
                case 'ind':
                    $this->thut($phanTu, $ketQua);
                    break;
                case 'spacing':
                    $this->khoangCach($phanTu, $ketQua);
                    break;
                case 'jc':
                    $ketQua['textAlignment'] = match ($this->val($phanTu)) {
                        'center' => 'Center',
                        'right', 'end' => 'Right',
                        'both', 'distribute', 'lowKashida', 'mediumKashida', 'highKashida', 'thaiDistribute' => 'Justify',
                        default => 'Left',
                    };
                    break;
                case 'outlineLvl':
                    $muc = (int) $this->val($phanTu);
                    $ketQua['outlineLevel'] = $muc >= 0 && $muc < 9 ? 'Level'.($muc + 1) : 'BodyText';
                    break;
                case 'contextualSpacing':
                    $ketQua['contextualSpacing'] = DonVi::bat($phanTu);
                    break;
                case 'bidi':
                    $ketQua['bidi'] = DonVi::bat($phanTu);
                    break;
                case 'tabs':
                    $ketQua['tabs'] = $this->tabs($phanTu);
                    break;
                case 'numPr':
                    $danhSach = $this->danhSach($phanTu);
                    if ($danhSach !== []) {
                        $ketQua['listFormat'] = $danhSach;
                    }
                    break;
            }
        }

        return self::sapXep($ketQua, self::THU_TU_DOAN);
    }

    /**
     * w:numPr sang listFormat: w:ilvl là listLevelNumber, w:numId đổi sang listId của SFDT.
     *
     * @return array<string, int>
     */
    public function danhSach(DOMElement $numPr): array
    {
        $ketQua = [];
        $cap = $this->conTen($numPr, 'ilvl');
        $ma = $this->conTen($numPr, 'numId');

        if ($cap !== null) {
            $ketQua['listLevelNumber'] = max(0, min(8, (int) $this->val($cap)));
        }

        if ($ma !== null) {
            $ketQua['listId'] = $this->nguCanh->danhSach->maList((int) $this->val($ma));
        }

        return $ketQua;
    }

    /**
     * w:tabs sang danh sách tab. Tab xóa (w:val="clear") ghi vào deletePosition.
     *
     * @return list<array<string, mixed>>
     */
    public function tabs(DOMElement $tabs): array
    {
        $ketQua = [];

        foreach ($this->con($tabs) as $tab) {
            if ($tab->localName !== 'tab') {
                continue;
            }

            $kieu = $this->val($tab);
            $viTri = DonVi::twip(DonVi::thuocTinh($tab, 'pos'));

            if ($kieu === 'clear') {
                $ketQua[] = ['tabJustification' => 'Left', 'position' => 0.0, 'tabLeader' => 'None', 'deletePosition' => $viTri];

                continue;
            }

            $ketQua[] = [
                'tabJustification' => match ($kieu) {
                    'center' => 'Center',
                    'right', 'end' => 'Right',
                    'decimal' => 'Decimal',
                    'bar' => 'Bar',
                    'num' => 'List',
                    default => 'Left',
                },
                'position' => $viTri,
                'tabLeader' => match (DonVi::thuocTinh($tab, 'leader')) {
                    'dot' => 'Dot',
                    'hyphen' => 'Hyphen',
                    'underscore', 'heavy' => 'Underscore',
                    'middleDot' => 'Dot',
                    default => 'None',
                },
                'deletePosition' => 0.0,
            ];
        }

        return $ketQua;
    }

    /**
     * Một viền (w:top, w:left, w:insideH...) sang border của SFDT.
     *
     * @return array<string, mixed>
     */
    public function vien(?DOMElement $phanTu): array
    {
        if ($phanTu === null) {
            return self::vienTrong(false);
        }

        $kieu = $this->val($phanTu) ?? 'none';
        $kieuSfdt = self::KIEU_VIEN[$kieu] ?? 'Single';
        $ketQua = [];
        $mau = DonVi::mau(DonVi::thuocTinh($phanTu, 'color'));

        if ($mau !== null && $kieuSfdt !== 'None' && $kieuSfdt !== 'Cleared') {
            $ketQua['color'] = $mau === '#00000000' ? '#000000FF' : $mau;
        }

        $ketQua['lineStyle'] = $kieuSfdt;
        $ketQua['lineWidth'] = in_array($kieuSfdt, ['None', 'Cleared'], true) ? 0.0 : DonVi::f32(DonVi::so(DonVi::thuocTinh($phanTu, 'sz')) / 8);
        $ketQua['shadow'] = ($bong = DonVi::thuocTinh($phanTu, 'shadow')) !== null && ! in_array($bong, ['0', 'false', 'off'], true);
        $ketQua['space'] = DonVi::so(DonVi::thuocTinh($phanTu, 'space'));
        $ketQua['hasNoneStyle'] = $kieuSfdt === 'None';

        return $ketQua;
    }

    /**
     * Viền rỗng (không khai báo) hoặc viền "none".
     *
     * @return array<string, mixed>
     */
    public static function vienTrong(bool $coKieuNone): array
    {
        // Hằng mảng dùng chung, không cấp phát lại cho từng ô của bảng lớn.
        return $coKieuNone ? self::VIEN_NONE : self::VIEN_TRONG;
    }

    /**
     * w:shd sang shading của SFDT.
     *
     * @return array<string, mixed>|null
     */
    public function nen(?DOMElement $shd): ?array
    {
        if ($shd === null) {
            return null;
        }

        $ketQua = [];
        $mauNen = DonVi::mau(DonVi::thuocTinh($shd, 'fill'));
        $ketQua['texture'] = match ($this->val($shd)) {
            'solid' => 'TextureSolid',
            'pct5' => 'Texture5Percent',
            'pct10' => 'Texture10Percent',
            'pct12' => 'Texture12Pt5Percent',
            'pct15' => 'Texture15Percent',
            'pct20' => 'Texture20Percent',
            'pct25' => 'Texture25Percent',
            'pct30' => 'Texture30Percent',
            'pct35' => 'Texture35Percent',
            'pct40' => 'Texture40Percent',
            'pct50' => 'Texture50Percent',
            'pct60' => 'Texture60Percent',
            'pct70' => 'Texture70Percent',
            'pct75' => 'Texture75Percent',
            'pct80' => 'Texture80Percent',
            'pct90' => 'Texture90Percent',
            default => 'TextureNone',
        };

        if ($mauNen !== null && $mauNen !== '#00000000') {
            $ketQua['backgroundColor'] = $mauNen;
        }

        return $ketQua;
    }

    /**
     * Độ rộng ưu tiên (w:tblW, w:tcW...) sang [preferredWidth, preferredWidthType].
     *
     * @return array{0: float, 1: string}
     */
    public function doRong(DOMElement $phanTu): array
    {
        $giaTri = (string) DonVi::thuocTinh($phanTu, 'w');
        $kieu = DonVi::thuocTinh($phanTu, 'type') ?? 'dxa';

        if (str_ends_with($giaTri, '%')) {
            return [DonVi::f32((float) rtrim($giaTri, '%')), 'Percent'];
        }

        return match ($kieu) {
            'pct' => [DonVi::f32(DonVi::so($giaTri) / 50), 'Percent'],
            'auto', 'nil' => [0.0, 'Auto'],
            default => [DonVi::twip($giaTri), 'Point'],
        };
    }

    /**
     * Sắp các khóa theo thứ tự .NET; khóa lạ để cuối.
     *
     * @param  array<string, mixed>  $mang
     * @param  list<string>  $thuTu
     * @return array<string, mixed>
     */
    public static function sapXep(array $mang, array $thuTu): array
    {
        $ketQua = [];

        foreach ($thuTu as $khoa) {
            if (array_key_exists($khoa, $mang)) {
                $ketQua[$khoa] = $mang[$khoa];
                unset($mang[$khoa]);
            }
        }

        return $ketQua + $mang;
    }

    /**
     * Các phần tử con trực tiếp.
     *
     * @return list<DOMElement>
     */
    public function con(DOMElement $cha): array
    {
        $ketQua = [];

        foreach ($cha->childNodes as $nut) {
            if ($nut instanceof DOMElement) {
                $ketQua[] = $nut;
            }
        }

        return $ketQua;
    }

    /**
     * Phần tử con đầu tiên có tên cục bộ cho trước.
     */
    public function conTen(?DOMElement $cha, string $ten): ?DOMElement
    {
        foreach ($cha?->childNodes ?? [] as $nut) {
            if ($nut instanceof DOMElement && $nut->localName === $ten) {
                return $nut;
            }
        }

        return null;
    }

    public function val(DOMElement $phanTu): ?string
    {
        return DonVi::thuocTinh($phanTu, 'val');
    }

    /**
     * w:rFonts: phông ASCII (hoặc phông theme) là fontFamily, phông cs là fontFamilyBidi.
     *
     * @param  array<string, mixed>  $ketQua
     */
    private function phong(DOMElement $rFonts, array &$ketQua): void
    {
        $phong = DonVi::thuocTinh($rFonts, 'ascii')
            ?? $this->phongTheme(DonVi::thuocTinh($rFonts, 'asciiTheme'))
            ?? DonVi::thuocTinh($rFonts, 'hAnsi')
            ?? $this->phongTheme(DonVi::thuocTinh($rFonts, 'hAnsiTheme'));

        if ($phong !== null && $phong !== '') {
            $ketQua['fontFamily'] = $phong;
        }

        $phongCs = DonVi::thuocTinh($rFonts, 'cs') ?? $this->phongTheme(DonVi::thuocTinh($rFonts, 'cstheme'));

        if ($phongCs !== null && $phongCs !== '') {
            $ketQua['fontFamilyBidi'] = $phongCs;
        }
    }

    private function phongTheme(?string $ten): ?string
    {
        return $ten === null ? null : ($this->phongChuDe[$ten] ?? null);
    }

    /**
     * w:ind: left/start, right/end, firstLine, hanging (thụt treo là firstLineIndent âm).
     *
     * @param  array<string, mixed>  $ketQua
     */
    private function thut(DOMElement $ind, array &$ketQua): void
    {
        $trai = DonVi::thuocTinh($ind, 'left') ?? DonVi::thuocTinh($ind, 'start');
        $phai = DonVi::thuocTinh($ind, 'right') ?? DonVi::thuocTinh($ind, 'end');
        $dauDong = DonVi::thuocTinh($ind, 'firstLine');
        $treo = DonVi::thuocTinh($ind, 'hanging');

        if ($trai !== null) {
            $ketQua['leftIndent'] = DonVi::twip($trai);
        }

        if ($phai !== null) {
            $ketQua['rightIndent'] = DonVi::twip($phai);
        }

        if ($treo !== null) {
            $ketQua['firstLineIndent'] = -DonVi::twip($treo);
        } elseif ($dauDong !== null) {
            $ketQua['firstLineIndent'] = DonVi::twip($dauDong);
        }
    }

    /**
     * w:spacing: before, after (twip), line + lineRule (auto: bội số của 240; exact, atLeast: twip).
     *
     * @param  array<string, mixed>  $ketQua
     */
    private function khoangCach(DOMElement $spacing, array &$ketQua): void
    {
        $truoc = DonVi::thuocTinh($spacing, 'before');
        $sau = DonVi::thuocTinh($spacing, 'after');
        $dong = DonVi::thuocTinh($spacing, 'line');

        if ($truoc !== null) {
            $ketQua['beforeSpacing'] = DonVi::twip($truoc);
        }

        if ($sau !== null) {
            $ketQua['afterSpacing'] = DonVi::twip($sau);
        }

        if ($dong !== null) {
            $quyTac = DonVi::thuocTinh($spacing, 'lineRule') ?? 'auto';

            if ($quyTac === 'auto') {
                $ketQua['lineSpacing'] = DonVi::f32(DonVi::so($dong) / 240);
                $ketQua['lineSpacingType'] = 'Multiple';
            } else {
                $ketQua['lineSpacing'] = DonVi::twip($dong);
                $ketQua['lineSpacingType'] = $quyTac === 'exact' ? 'Exactly' : 'AtLeast';
            }
        }
    }
}
