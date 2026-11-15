<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Định nghĩa hàng, ô của bảng RTF (\trowd ... \cellx) và dựng khối bảng SFDT từ các hàng đã đọc.
 *
 * Như dịch vụ .NET: cột của bảng là lưới mọi mép ô của mọi hàng, columnSpan đếm số cột lưới ô phủ, gridBefore là số cột
 * lưới trước mép trái của hàng; ô gộp dọc (\clvmrg) bị bỏ, ô đầu (\clvmgf) có rowSpan.
 */
final class BangRtf
{
    /**
     * Kiểu viền RTF sang lineStyle của SFDT.
     *
     * @var array<string, string>
     */
    public const KIEU_VIEN = [
        'brdrs' => 'Single', 'brdrsh' => 'Single', 'brdrhair' => 'Single', 'brdrth' => 'Thick', 'brdrdb' => 'Double',
        'brdrdot' => 'Dot', 'brdrdash' => 'DashLargeGap', 'brdrdashsm' => 'DashSmallGap', 'brdrdashd' => 'DashDot',
        'brdrdashdd' => 'DashDotDot', 'brdrtriple' => 'Triple', 'brdrtnthsg' => 'ThinThickSmallGap',
        'brdrthtnsg' => 'ThickThinSmallGap', 'brdrtnthtnsg' => 'ThinThickThinSmallGap', 'brdrtnthmg' => 'ThinThickMediumGap',
        'brdrthtnmg' => 'ThickThinMediumGap', 'brdrtnthtnmg' => 'ThinThickThinMediumGap', 'brdrtnthlg' => 'ThinThickLargeGap',
        'brdrthtnlg' => 'ThickThinLargeGap', 'brdrtnthtnlg' => 'ThinThickThinLargeGap', 'brdrwavy' => 'SingleWavy',
        'brdrwavydb' => 'DoubleWavy', 'brdrdashdotstr' => 'DashDotStroked', 'brdremboss' => 'Emboss3D',
        'brdrengrave' => 'Engrave3D', 'brdroutset' => 'Outset', 'brdrinset' => 'Inset', 'brdrnone' => 'None', 'brdrnil' => 'None',
    ];

    /**
     * Định nghĩa hàng mới (\trowd).
     *
     * @return array<string, mixed>
     */
    public static function hangMoi(): array
    {
        return [
            'trgaph' => null, 'trleft' => 0, 'tblind' => null, 'trrh' => 0, 'canh' => 'Left', 'tieuDe' => false, 'giu' => false,
            'tuDong' => false, 'vien' => [], 'padd' => [], 'o' => [], 'oMoi' => self::oMoi(),
        ];
    }

    /**
     * Thụt trái của bảng/hàng (twip) theo cách .NET đọc: RTF kiểu Word mới (\tblind) lấy \trleft (mép ô), RTF cũ
     * như TX lấy \trleft + \trgaph (mép chữ).
     *
     * @param  array<string, mixed>  $dn
     */
    public static function thutTrai(array $dn): int
    {
        if ($dn['tblind'] !== null) {
            return $dn['trgaph'] !== null ? (int) $dn['trleft'] : (int) $dn['tblind'];
        }

        return (int) $dn['trleft'] + (int) ($dn['trgaph'] ?? 0);
    }

    /**
     * Định nghĩa ô đang khai báo, chốt lại ở \cellx.
     *
     * @return array<string, mixed>
     */
    public static function oMoi(): array
    {
        return [
            'x' => 0, 'vmgf' => false, 'vmrg' => false, 'mgf' => false, 'mrg' => false, 'canhDoc' => 'Top',
            'vien' => [], 'nen' => null, 'pad' => [], 'fts' => 0, 'w' => 0,
        ];
    }

    /**
     * Dựng khối bảng SFDT.
     *
     * @param  list<array{dn: array<string, mixed>, o: list<list<array<string, mixed>>>}>  $hang
     * @param  array<string, mixed>  $doanTrong  khối đoạn rỗng cho ô thiếu nội dung
     * @return array<string, mixed>
     */
    public static function dung(array $hang, TaiNguyenRtf $tn, array $doanTrong): array
    {
        $luoi = [];
        $cacHang = [];

        foreach ($hang as $h) {
            $cacO = self::oCuaHang($h['dn'], $h['o'], $doanTrong);

            foreach ($cacO as $o) {
                $luoi[$o['trai']] = true;
                $luoi[$o['phai']] = true;
            }

            $cacHang[] = ['dn' => $h['dn'], 'o' => $cacO];
        }

        self::gopDoc($cacHang);

        // Như .NET: lưới tính từ lề trái (0) khi mọi hàng bắt đầu sau lề, nên hàng thụt vào có gridBefore.
        if ($luoi !== [] && min(array_keys($luoi)) > 0) {
            $luoi[0] = true;
        }

        ksort($luoi);
        $viTri = array_flip(array_keys($luoi));

        $dauBang = $cacHang[0]['dn'];
        $rows = [];

        foreach ($cacHang as $h) {
            $dn = $h['dn'];
            $cells = [];

            foreach ($h['o'] as $o) {
                if ($o['boDi']) {
                    continue;
                }

                $cells[] = [
                    'blocks' => $o['khoi'],
                    'cellFormat' => self::dinhDangO($o, $dn, $tn, max(1, $viTri[$o['phai']] - $viTri[$o['trai']])),
                ];
            }

            if ($cells === []) {
                continue;
            }

            $rowFormat = [
                'allowBreakAcrossPages' => ! $dn['giu'],
                'isHeader' => $dn['tieuDe'],
                'height' => TaiNguyenRtf::diem(abs($dn['trrh'])),
                'heightType' => $dn['trrh'] < 0 ? 'Exactly' : 'AtLeast',
                'borders' => self::vienBang($dn['vien'], $tn),
            ];

            $truoc = $viTri[$h['o'][0]['trai']] ?? 0;

            if ($truoc > 0) {
                $rowFormat['gridBefore'] = $truoc;
            }

            $rowFormat += self::lePhanHang($dn);

            if (self::thutTrai($dn) > 0) {
                $rowFormat['leftIndent'] = TaiNguyenRtf::diem(self::thutTrai($dn));
            }

            $rows[] = ['rowFormat' => $rowFormat, 'cells' => $cells];
        }

        if ($rows === []) {
            $rows[] = ['rowFormat' => ['allowBreakAcrossPages' => true, 'isHeader' => false, 'height' => 0.0, 'heightType' => 'AtLeast'], 'cells' => [
                ['blocks' => [$doanTrong], 'cellFormat' => ['columnSpan' => 1, 'rowSpan' => 1, 'preferredWidthType' => 'Auto', 'cellWidth' => 72.0]],
            ]];
        }

        $le = self::lePhanHang($dauBang);

        return [
            'rows' => $rows,
            'title' => null,
            'description' => null,
            'tableFormat' => [
                'allowAutoFit' => $dauBang['tuDong'],
                'leftMargin' => $le['leftMargin'],
                'rightMargin' => $le['rightMargin'],
                'topMargin' => $le['topMargin'],
                'bottomMargin' => $le['bottomMargin'],
                'leftIndent' => TaiNguyenRtf::diem(self::thutTrai($dauBang)),
                'tableAlignment' => $dauBang['canh'],
                'preferredWidthType' => 'Auto',
                'borders' => self::vienBang($dauBang['vien'], $tn),
                'bidi' => false,
            ],
        ];
    }

    /**
     * Ghép nội dung ô với định nghĩa ô (theo thứ tự), tính mép trái/phải và gộp ngang (\clmgf, \clmrg).
     *
     * @param  array<string, mixed>  $dn
     * @param  list<list<array<string, mixed>>>  $noiDung
     * @param  array<string, mixed>  $doanTrong
     * @return list<array<string, mixed>>
     */
    private static function oCuaHang(array $dn, array $noiDung, array $doanTrong): array
    {
        $dinhNghia = $dn['o'];
        $soO = max(count($dinhNghia), count($noiDung), 1);
        $trai = (int) $dn['trleft'];
        $cacO = [];

        for ($i = 0; $i < $soO; $i++) {
            $d = $dinhNghia[$i] ?? null;

            if ($d === null) {
                // Ô thừa so với \cellx (RTF hỏng): rộng bằng ô trước, hoặc 1 inch.
                $rongTruoc = $cacO === [] ? 1440 : max(1, $cacO[count($cacO) - 1]['phai'] - $cacO[count($cacO) - 1]['trai']);
                $d = ['x' => $trai + $rongTruoc] + self::oMoi();
            }

            $phai = max((int) $d['x'], $trai + 1);
            $khoi = $noiDung[$i] ?? [];

            if ($khoi === []) {
                $khoi = [$doanTrong];
            }

            if ($d['mrg'] && $cacO !== [] && ! $d['mgf']) {
                $truoc = &$cacO[count($cacO) - 1];
                $truoc['phai'] = $phai;
                $truoc['gopNgang'] = true;

                if (self::coChu($khoi)) {
                    array_push($truoc['khoi'], ...$khoi);
                }

                unset($truoc);
                $trai = $phai;

                continue;
            }

            $cacO[] = ['trai' => $trai, 'phai' => $phai, 'dn' => $d, 'khoi' => $khoi, 'gopNgang' => false, 'rowSpan' => 1, 'boDi' => false];
            $trai = $phai;
        }

        return $cacO;
    }

    /**
     * Gộp dọc: ô \clvmgf nhận rowSpan bằng số hàng liền dưới có ô \clvmrg cùng mép trái; các ô đó bị bỏ cả nội dung.
     *
     * @param  list<array{dn: array<string, mixed>, o: list<array<string, mixed>>}>  $cacHang
     */
    private static function gopDoc(array &$cacHang): void
    {
        $soHang = count($cacHang);

        for ($r = 0; $r < $soHang; $r++) {
            foreach ($cacHang[$r]['o'] as $c => $o) {
                if ($o['boDi'] || ! ($o['dn']['vmgf'] || $o['dn']['vmrg'])) {
                    continue;
                }

                for ($k = $r + 1; $k < $soHang; $k++) {
                    $duoi = self::timO($cacHang[$k]['o'], $o['trai']);

                    if ($duoi === null || ! $cacHang[$k]['o'][$duoi]['dn']['vmrg'] || $cacHang[$k]['o'][$duoi]['dn']['vmgf']) {
                        break;
                    }

                    // Như Word và .NET: chữ trong ô bị gộp dọc không hiển thị (DocIO còn chép trùng nội dung vào đó).
                    $cacHang[$k]['o'][$duoi]['boDi'] = true;
                    $cacHang[$r]['o'][$c]['rowSpan']++;
                }
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $cacO
     */
    private static function timO(array $cacO, int $trai): ?int
    {
        foreach ($cacO as $c => $o) {
            if (! $o['boDi'] && abs($o['trai'] - $trai) <= 20) {
                return $c;
            }
        }

        return null;
    }

    /**
     * @param  list<array<string, mixed>>  $khoi
     */
    private static function coChu(array $khoi): bool
    {
        foreach ($khoi as $k) {
            if (isset($k['rows']) || ($k['inlines'] ?? []) !== []) {
                return true;
            }
        }

        return false;
    }

    /**
     * Lề trong ô mặc định của hàng: \trpadd*, thiếu thì nửa khoảng cách ô \trgaph.
     *
     * @param  array<string, mixed>  $dn
     * @return array{leftMargin: float, rightMargin: float, topMargin: float, bottomMargin: float}
     */
    private static function lePhanHang(array $dn): array
    {
        return [
            'leftMargin' => TaiNguyenRtf::diem($dn['padd']['l'] ?? $dn['trgaph'] ?? 0),
            'rightMargin' => TaiNguyenRtf::diem($dn['padd']['r'] ?? $dn['trgaph'] ?? 0),
            'topMargin' => TaiNguyenRtf::diem($dn['padd']['t'] ?? 0),
            'bottomMargin' => TaiNguyenRtf::diem($dn['padd']['b'] ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $o
     * @param  array<string, mixed>  $dn
     * @return array<string, mixed>
     */
    private static function dinhDangO(array $o, array $dn, TaiNguyenRtf $tn, int $soCot): array
    {
        $d = $o['dn'];
        $dd = [];

        if ($d['pad'] !== []) {
            $le = self::lePhanHang($dn);
            // Word ghi lệch: \clpadl là lề trên, \clpadt là lề trái.
            $dd['leftMargin'] = isset($d['pad']['t']) ? TaiNguyenRtf::diem($d['pad']['t']) : $le['leftMargin'];
            $dd['rightMargin'] = isset($d['pad']['r']) ? TaiNguyenRtf::diem($d['pad']['r']) : $le['rightMargin'];
            $dd['topMargin'] = isset($d['pad']['l']) ? TaiNguyenRtf::diem($d['pad']['l']) : $le['topMargin'];
            $dd['bottomMargin'] = isset($d['pad']['b']) ? TaiNguyenRtf::diem($d['pad']['b']) : $le['bottomMargin'];
        }

        $rongTheoMep = TaiNguyenRtf::diem($o['phai'] - $o['trai']);
        $dd['columnSpan'] = $soCot;
        $dd['rowSpan'] = $o['rowSpan'];

        if ($d['fts'] === 2 && $d['w'] > 0) {
            $dd['preferredWidth'] = round($d['w'] / 50, 2);
            $dd['preferredWidthType'] = 'Percent';
        } else {
            // Không có \clwWidth thì lấy độ rộng theo \cellx: .NET để Auto làm bộ soạn kéo bảng ra hết trang và vẽ sai bảng lồng.
            $dd['preferredWidth'] = $d['fts'] === 3 && $d['w'] > 0 && ! $o['gopNgang'] ? TaiNguyenRtf::diem($d['w']) : $rongTheoMep;
            $dd['preferredWidthType'] = 'Point';
        }

        $dd['verticalAlignment'] = $d['canhDoc'];
        $dd['isSamePaddingAsTable'] = $d['pad'] === [];
        $dd['borders'] = self::vienO($d['vien'], $tn);
        $dd['shading'] = ['texture' => 'TextureNone'];

        if ($tn->coMau($d['nen'])) {
            $dd['shading']['backgroundColor'] = $tn->mauHex($d['nen']);
        }

        $dd['cellWidth'] = ($d['fts'] === 3 && $d['w'] > 0 && ! $o['gopNgang']) ? TaiNguyenRtf::diem($d['w']) : $rongTheoMep;

        return $dd;
    }

    /**
     * Viền bảng và hàng: cạnh không khai báo là None (hasNoneStyle).
     *
     * @param  array<string, array{kieu: ?string, rong: int, mau: ?int}>  $vien
     * @return array<string, array<string, mixed>>
     */
    private static function vienBang(array $vien, TaiNguyenRtf $tn): array
    {
        $ketQua = [];

        foreach (['left' => 'l', 'right' => 'r', 'top' => 't', 'bottom' => 'b', 'vertical' => 'v', 'horizontal' => 'h'] as $canh => $ma) {
            $ketQua[$canh] = isset($vien[$ma]) ? self::motVien($vien[$ma], $tn) : self::vienRong('None', true);
        }

        $ketQua['diagonalDown'] = self::vienRong('None', false);
        $ketQua['diagonalUp'] = self::vienRong('None', false);

        return $ketQua;
    }

    /**
     * Viền ô: cạnh không khai báo là Cleared (lấy theo bảng).
     *
     * @param  array<string, array{kieu: ?string, rong: int, mau: ?int}>  $vien
     * @return array<string, array<string, mixed>>
     */
    private static function vienO(array $vien, TaiNguyenRtf $tn): array
    {
        $ketQua = [];

        foreach (['left' => 'l', 'right' => 'r', 'top' => 't', 'bottom' => 'b'] as $canh => $ma) {
            $ketQua[$canh] = isset($vien[$ma]) ? self::motVien($vien[$ma], $tn) : self::vienRong('Cleared', false);
        }

        $ketQua['vertical'] = self::vienRong('None', false);
        $ketQua['horizontal'] = self::vienRong('None', false);
        $ketQua['diagonalDown'] = self::vienRong('None', true);
        $ketQua['diagonalUp'] = self::vienRong('None', true);

        return $ketQua;
    }

    /**
     * Một cạnh viền. Cạnh khai báo mà không có kiểu (\clbrdrt liền \clbrdrb, như DocIO ghi) là Cleared như .NET.
     *
     * @param  array{kieu: ?string, rong: int, mau: ?int}  $vien
     * @return array<string, mixed>
     */
    private static function motVien(array $vien, TaiNguyenRtf $tn): array
    {
        if ($vien['kieu'] === null) {
            return self::vienRong('Cleared', false) + ($tn->coMau($vien['mau']) ? ['color' => $tn->mauHex($vien['mau'])] : []);
        }

        if ($vien['kieu'] === 'None') {
            return self::vienRong('None', true);
        }

        return [
            'lineStyle' => $vien['kieu'],
            'lineWidth' => TaiNguyenRtf::diem($vien['rong']),
            'shadow' => false,
            'space' => 0.0,
            'hasNoneStyle' => false,
            'color' => $tn->coMau($vien['mau']) ? $tn->mauHex($vien['mau']) : '#000000FF',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function vienRong(string $kieu, bool $khongVien): array
    {
        return ['lineStyle' => $kieu, 'lineWidth' => 0.0, 'shadow' => false, 'space' => 0.0, 'hasNoneStyle' => $khongVien];
    }
}
