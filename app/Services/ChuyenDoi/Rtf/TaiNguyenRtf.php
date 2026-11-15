<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Bảng phông, bảng màu, bảng kiểu của tài liệu RTF và cách đổi định dạng nội bộ sang định dạng SFDT.
 *
 * Định dạng ký tự nội bộ (mảng $kt): f (chỉ số phông), fs (nửa point), b, i, ul (kiểu gạch chân SFDT hoặc null),
 * st (strikethrough SFDT), bl (baselineAlignment SFDT), cf (chỉ số màu chữ), hl (chỉ số màu tô sáng), cs (kiểu ký tự),
 * caps, v (ẩn), af, afs, ab, ai (bản bidi).
 * Định dạng đoạn nội bộ (mảng $pd): s, q, li, ri, fi, sb, sa, sl, slm (twip), tabs, intbl, itap, ls, ilvl, ol, ctx, bidi.
 */
final class TaiNguyenRtf
{
    /**
     * Màu tô sáng của SFDT và giá trị RGB tương ứng.
     *
     * @var array<string, array{int, int, int}>
     */
    private const MAU_TO_SANG = [
        'Yellow' => [255, 255, 0], 'BrightGreen' => [0, 255, 0], 'Turquoise' => [0, 255, 255], 'Pink' => [255, 0, 255],
        'Blue' => [0, 0, 255], 'Red' => [255, 0, 0], 'DarkBlue' => [0, 0, 128], 'Teal' => [0, 128, 128],
        'Green' => [0, 128, 0], 'Violet' => [128, 0, 128], 'DarkRed' => [128, 0, 0], 'DarkYellow' => [128, 128, 0],
        'Gray50' => [128, 128, 128], 'Gray25' => [192, 192, 192], 'Black' => [0, 0, 0],
    ];

    /**
     * @var array<int, array{ten: string, cp: ?int}>
     */
    public array $phong = [];

    /**
     * Bảng màu; null là màu tự động.
     *
     * @var list<?array{int, int, int}>
     */
    public array $mau = [];

    /**
     * @var array<int, array{loai: string, ten: string, dua: ?int, tiep: ?int, kt: array<string, mixed>, pd: array<string, mixed>}>
     */
    public array $kieu = [];

    public int $phongMacDinh = 0;

    public int $maTrang = 1252;

    /**
     * Bộ nhớ đệm định dạng ký tự SFDT theo khóa của $kt.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $demKyTu = [];

    /**
     * Tên kiểu dựng sẵn của Word, viết hoa đúng như .NET và bộ soạn dùng (RTF hay ghi chữ thường: "header").
     *
     * @var list<string>
     */
    private const KIEU_DUNG_SAN = [
        'Normal', 'Header', 'Footer', 'Title', 'Subtitle', 'Hyperlink', 'FollowedHyperlink', 'Default Paragraph Font',
        'Page Number', 'Footnote Text', 'Footnote Reference', 'Endnote Text', 'Endnote Reference', 'List Paragraph',
        'Table Grid', 'Normal Table', 'No List', 'No Spacing', 'Caption', 'Balloon Text', 'Body Text', 'Body Text Indent',
        'Strong', 'Emphasis', 'Quote', 'Intense Quote', 'Comment Text', 'Line Number', 'Normal (Web)',
    ];

    /**
     * Chuẩn hóa tên kiểu dựng sẵn ("heading 1" thành "Heading 1", "header" thành "Header").
     */
    public static function tenKieuChuan(string $ten): string
    {
        if (preg_match('/^(heading|toc) ([1-9])$/i', $ten, $m)) {
            return ucfirst(strtolower($m[1])).' '.$m[2];
        }

        foreach (self::KIEU_DUNG_SAN as $chuan) {
            if (strcasecmp($chuan, $ten) === 0) {
                return $chuan;
            }
        }

        return $ten;
    }

    /**
     * Twip (1/20 point) sang point.
     */
    public static function diem(int|float $twip): float
    {
        return round($twip / 20, 4);
    }

    /**
     * Định dạng ký tự mặc định của \plain.
     *
     * @return array<string, mixed>
     */
    public function kyTuMacDinh(): array
    {
        return [
            'f' => $this->phongMacDinh, 'fs' => 24, 'b' => false, 'i' => false, 'ul' => null, 'st' => 'None', 'bl' => 'Normal',
            'cf' => null, 'hl' => null, 'cs' => null, 'caps' => false, 'v' => false, 'af' => null, 'afs' => null, 'ab' => false, 'ai' => false,
        ];
    }

    /**
     * Định dạng đoạn mặc định của \pard.
     *
     * @return array<string, mixed>
     */
    public static function doanMacDinh(): array
    {
        return [
            's' => 0, 'q' => 'Left', 'li' => 0, 'ri' => 0, 'fi' => 0, 'sb' => 0, 'sa' => 0, 'sl' => 0, 'slm' => 0,
            'tabs' => [], 'intbl' => false, 'itap' => null, 'ls' => null, 'ilvl' => 0, 'ol' => null, 'ctx' => false, 'bidi' => false,
        ];
    }

    public function tenPhong(?int $chiSo): string
    {
        $chiSo ??= $this->phongMacDinh;

        return $this->phong[$chiSo]['ten'] ?? $this->phong[$this->phongMacDinh]['ten'] ?? 'Times New Roman';
    }

    /**
     * Bảng mã để giải chữ của phông; phông không ghi charset dùng \ansicpg.
     */
    public function maTrangCuaPhong(?int $chiSo): int
    {
        return $this->phong[$chiSo ?? $this->phongMacDinh]['cp'] ?? $this->maTrang;
    }

    /**
     * Màu dạng #RRGGBBAA của SFDT; màu tự động là #00000000.
     */
    public function mauHex(?int $chiSo): string
    {
        $rgb = $chiSo === null ? null : ($this->mau[$chiSo] ?? null);

        return $rgb === null ? '#00000000' : sprintf('#%02X%02X%02XFF', $rgb[0], $rgb[1], $rgb[2]);
    }

    public function coMau(?int $chiSo): bool
    {
        return $chiSo !== null && isset($this->mau[$chiSo]);
    }

    /**
     * Màu tô sáng SFDT gần nhất với màu trong bảng màu; trắng hoặc không có là không tô.
     */
    public function mauToSang(?int $chiSo): ?string
    {
        $rgb = $chiSo === null ? null : ($this->mau[$chiSo] ?? null);

        if ($rgb === null || $rgb === [255, 255, 255]) {
            return null;
        }

        $ganNhat = null;
        $khoangCach = PHP_INT_MAX;

        foreach (self::MAU_TO_SANG as $ten => $mau) {
            $d = ($mau[0] - $rgb[0]) ** 2 + ($mau[1] - $rgb[1]) ** 2 + ($mau[2] - $rgb[2]) ** 2;

            if ($d < $khoangCach) {
                $khoangCach = $d;
                $ganNhat = $ten;
            }
        }

        return $ganNhat;
    }

    /**
     * Tên kiểu theo chỉ số, null nếu không có hoặc khác loại.
     */
    public function tenKieu(?int $chiSo, string $loai): ?string
    {
        if ($chiSo === null || ! isset($this->kieu[$chiSo]) || $this->kieu[$chiSo]['loai'] !== $loai) {
            return null;
        }

        return $this->kieu[$chiSo]['ten'];
    }

    /**
     * Định dạng ký tự SFDT của một đoạn chữ (theo thứ tự thuộc tính dịch vụ .NET xuất).
     *
     * @param  array<string, mixed>  $kt
     * @return array<string, mixed>
     */
    public function kyTu(array $kt): array
    {
        $khoa = serialize($kt);

        if (isset($this->demKyTu[$khoa])) {
            return $this->demKyTu[$khoa];
        }

        $dd = ['bold' => (bool) $kt['b'], 'italic' => (bool) $kt['i']];

        if ($kt['ul'] !== null) {
            $dd['underline'] = $kt['ul'];
        }

        $dd['strikethrough'] = $kt['st'];

        if ($kt['bl'] !== 'Normal') {
            $dd['baselineAlignment'] = $kt['bl'];
        }

        $toSang = $this->mauToSang($kt['hl']);

        if ($toSang !== null) {
            $dd['highlightColor'] = $toSang;
        }

        $dd['fontSize'] = round($kt['fs'] / 2, 2);
        $dd['fontFamily'] = $this->tenPhong($kt['f']);
        $dd['fontColor'] = $this->mauHex($kt['cf']);

        $tenKieu = $this->tenKieu($kt['cs'], 'Character');

        if ($tenKieu !== null) {
            $dd['styleName'] = $tenKieu;
        }

        if ($kt['caps']) {
            $dd['allCaps'] = true;
        }

        $dd['bidi'] = false;

        if ($kt['ab']) {
            $dd['boldBidi'] = true;
        }

        if ($kt['ai']) {
            $dd['italicBidi'] = true;
        }

        $dd['fontSizeBidi'] = round(($kt['afs'] ?? $kt['fs']) / 2, 2);
        $dd['fontFamilyBidi'] = $this->tenPhong($kt['af'] ?? $kt['f']);

        return $this->demKyTu[$khoa] = $dd;
    }

    /**
     * Định dạng dấu đoạn (characterFormat của khối đoạn), như .NET: có thêm baselineAlignment, highlightColor.
     *
     * @param  array<string, mixed>  $kt
     * @return array<string, mixed>
     */
    public function kyTuDauDoan(array $kt): array
    {
        $dd = $this->kyTu($kt);
        $dd += ['baselineAlignment' => 'Normal'];

        return $dd;
    }

    /**
     * Định dạng đoạn SFDT.
     *
     * @param  array<string, mixed>  $pd
     * @param  ?array{listLevelNumber: int, listId: int}  $danhSach
     * @return array<string, mixed>
     */
    public function doan(array $pd, ?array $danhSach): array
    {
        $dd = [
            'leftIndent' => self::diem($pd['li']),
            'rightIndent' => self::diem($pd['ri']),
            'firstLineIndent' => self::diem($pd['fi']),
            'beforeSpacing' => self::diem($pd['sb']),
            'afterSpacing' => self::diem($pd['sa']),
        ];

        [$dd['lineSpacing'], $dd['lineSpacingType']] = self::gianDong((int) $pd['sl'], (int) $pd['slm']);
        $dd['outlineLevel'] = $pd['ol'] === null || $pd['ol'] < 0 || $pd['ol'] > 8 ? 'BodyText' : 'Level'.($pd['ol'] + 1);
        $dd['textAlignment'] = $pd['q'];
        $dd['styleName'] = $this->tenKieu($pd['s'], 'Paragraph') ?? 'Normal';

        if ($danhSach !== null) {
            $dd['listFormat'] = $danhSach;
        }

        if ($pd['tabs'] !== []) {
            $dd['tabs'] = self::tabs($pd['tabs']);
        }

        $dd['bidi'] = (bool) $pd['bidi'];
        $dd['contextualSpacing'] = (bool) $pd['ctx'];

        return $dd;
    }

    /**
     * Giãn dòng: \slN\slmult1 là bội số (N/240), \slmult0 với N dương là "ít nhất", N âm là "chính xác".
     *
     * @return array{float, string}
     */
    public static function gianDong(int $sl, int $slMult): array
    {
        if ($sl === 0) {
            return [1.0, 'Multiple'];
        }

        if ($slMult === 1) {
            return [round(abs($sl) / 240, 4), 'Multiple'];
        }

        return $sl < 0 ? [self::diem(-$sl), 'Exactly'] : [self::diem($sl), 'AtLeast'];
    }

    /**
     * @param  list<array{int, string, string}>  $tabs
     * @return list<array<string, mixed>>
     */
    public static function tabs(array $tabs): array
    {
        return array_map(fn (array $tab): array => [
            'tabJustification' => $tab[1],
            'position' => self::diem($tab[0]),
            'tabLeader' => $tab[2],
            'deletePosition' => 0.0,
        ], $tabs);
    }

    /**
     * Danh sách kiểu SFDT; luôn có Normal và Default Paragraph Font như .NET.
     *
     * @return list<array<string, mixed>>
     */
    public function dsKieu(): array
    {
        $ketQua = [];
        $daCo = [];

        foreach ($this->kieu as $kieu) {
            if ($kieu['ten'] === '' || isset($daCo[$kieu['ten']]) || $kieu['loai'] === 'Table') {
                continue;
            }

            $daCo[$kieu['ten']] = true;
            $muc = ['type' => $kieu['loai'], 'name' => $kieu['ten']];
            $dua = $kieu['dua'] !== null && isset($this->kieu[$kieu['dua']]) ? $this->kieu[$kieu['dua']]['ten'] : null;

            if ($dua !== null && $dua !== $kieu['ten']) {
                $muc['basedOn'] = $dua;
            }

            if ($kieu['loai'] === 'Paragraph') {
                $muc['next'] = $kieu['tiep'] !== null && isset($this->kieu[$kieu['tiep']]) ? $this->kieu[$kieu['tiep']]['ten'] : $kieu['ten'];
            }

            if ($kieu['ten'] === 'Default Paragraph Font' && $kieu['kt'] === []) {
                $ketQua[] = $muc;

                continue;
            }

            $muc['characterFormat'] = $this->kyTuKieu($kieu['kt']);

            if ($kieu['loai'] === 'Paragraph') {
                $muc['paragraphFormat'] = $this->doanKieu($kieu['pd']);
            }

            $ketQua[] = $muc;
        }

        if (! isset($daCo['Normal'])) {
            array_unshift($ketQua, [
                'type' => 'Paragraph', 'name' => 'Normal', 'next' => 'Normal',
                'characterFormat' => $this->kyTuKieu(['f' => $this->phongMacDinh, 'fs' => 24]),
                'paragraphFormat' => $this->doanKieu([]),
            ]);
        }

        if (! isset($daCo['Default Paragraph Font'])) {
            $ketQua[] = ['type' => 'Character', 'name' => 'Default Paragraph Font'];
        }

        return $ketQua;
    }

    /**
     * Định dạng ký tự của kiểu: chỉ thuộc tính kiểu khai báo, cộng các thuộc tính .NET luôn ghi.
     *
     * @param  array<string, mixed>  $kt
     * @return array<string, mixed>
     */
    private function kyTuKieu(array $kt): array
    {
        $dd = ['bold' => (bool) ($kt['b'] ?? false), 'italic' => (bool) ($kt['i'] ?? false)];

        if (($kt['ul'] ?? null) !== null) {
            $dd['underline'] = $kt['ul'];
        }

        $dd['strikethrough'] = $kt['st'] ?? 'None';

        if (isset($kt['fs'])) {
            $dd['fontSize'] = round($kt['fs'] / 2, 2);
        }

        if (array_key_exists('f', $kt)) {
            $dd['fontFamily'] = $this->tenPhong($kt['f']);
        }

        $dd['fontColor'] = $this->mauHex($kt['cf'] ?? null);
        $dd['bidi'] = false;

        if (isset($kt['fs'])) {
            $dd['fontSizeBidi'] = round(($kt['afs'] ?? $kt['fs']) / 2, 2);
        }

        if (array_key_exists('f', $kt)) {
            $dd['fontFamilyBidi'] = $this->tenPhong($kt['af'] ?? $kt['f']);
        }

        return $dd;
    }

    /**
     * @param  array<string, mixed>  $pd
     * @return array<string, mixed>
     */
    private function doanKieu(array $pd): array
    {
        $dd = ['leftIndent' => self::diem($pd['li'] ?? 0), 'rightIndent' => self::diem($pd['ri'] ?? 0)];

        if (isset($pd['fi']) && $pd['fi'] !== 0) {
            $dd['firstLineIndent'] = self::diem($pd['fi']);
        }

        if (isset($pd['sb'])) {
            $dd['beforeSpacing'] = self::diem($pd['sb']);
        }

        if (isset($pd['sa'])) {
            $dd['afterSpacing'] = self::diem($pd['sa']);
        }

        if (! empty($pd['sl'])) {
            [$dd['lineSpacing'], $dd['lineSpacingType']] = self::gianDong((int) $pd['sl'], (int) ($pd['slm'] ?? 0));
        }

        $dd['textAlignment'] = $pd['q'] ?? 'Left';

        if (! empty($pd['tabs'])) {
            $dd['tabs'] = self::tabs($pd['tabs']);
        }

        $dd['bidi'] = false;

        return $dd;
    }
}
