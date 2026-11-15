<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * Ghi khối SFDT (đoạn, bảng) sang RTF: đoạn ghi định dạng hiệu lực tường minh, mỗi inline là một nhóm {\plain ...};
 * trường thành {\field{\*\fldinst ...}{\fldrslt ...}}; bảng theo \trowd ... \cell ... \row (bảng lồng dùng \itap,
 * \nestcell, \nestrow); ảnh thành \pict\pngblip hoặc \jpegblip.
 */
final class GhiKhoi
{
    /**
     * Số trường đang mở và trường đã có phần kết quả hay chưa.
     *
     * @var list<bool>
     */
    private array $truongMo = [];

    /**
     * Chỉ số kiểu đoạn (\sN) theo tên.
     *
     * @var array<string, int>
     */
    private array $maKieuDoan = [];

    /**
     * Chỉ số kiểu ký tự (\csN) theo tên.
     *
     * @var array<string, int>
     */
    private array $maKieuKyTu = [];

    public function __construct(
        private readonly KieuSfdt $kieu,
        private readonly DinhDangRtf $dinhDang,
        private readonly TaiNguyenRtf $taiNguyen,
        private readonly DanhSachSfdt $danhSach,
    ) {}

    /**
     * @param  array<string, int>  $maKieuDoan
     * @param  array<string, int>  $maKieuKyTu
     */
    public function datMaKieu(array $maKieuDoan, array $maKieuKyTu): void
    {
        $this->maKieuDoan = $maKieuDoan;
        $this->maKieuKyTu = $maKieuKyTu;
    }

    /**
     * Ghi các khối của một vùng (thân section, đầu/chân trang). Trường còn mở ở cuối vùng được đóng lại.
     *
     * Đoạn cuối của section (khi còn section sau) không ghi \par: \sect đã kết thúc đoạn đó, như Word ghi.
     *
     * @param  list<array<string, mixed>>  $khoi
     */
    public function vung(array $khoi, bool $boParCuoi = false): string
    {
        $ketQua = '';

        foreach ($this->trai($khoi) as $mot) {
            $ketQua .= $this->khoi($mot, 0, false);
        }

        $ketQua .= $this->dongTruong();

        return $boParCuoi && str_ends_with($ketQua, '\\par') ? substr($ketQua, 0, -4) : $ketQua;
    }

    /**
     * Gỡ lớp bao khối (contentControlProperties có blocks) thành dãy đoạn và bảng.
     *
     * @param  list<mixed>  $khoi
     * @return list<array<string, mixed>>
     */
    private function trai(array $khoi): array
    {
        $ketQua = [];

        foreach ($khoi as $mot) {
            if (! is_array($mot)) {
                continue;
            }

            if (isset($mot['inlines']) || isset($mot['rows'])) {
                $ketQua[] = $mot;
            } elseif (isset($mot['blocks']) && is_array($mot['blocks'])) {
                array_push($ketQua, ...$this->trai($mot['blocks']));
            }
        }

        return $ketQua;
    }

    /**
     * @param  array<string, mixed>  $khoi
     */
    private function khoi(array $khoi, int $muc, bool $cuoiO): string
    {
        return isset($khoi['rows']) ? $this->bang($khoi, $muc + 1) : $this->doan($khoi, $muc, $cuoiO);
    }

    /**
     * Một đoạn. $muc là độ lồng bảng (0 là ngoài bảng); đoạn cuối của ô kết thúc bằng \cell (\nestcell khi lồng).
     *
     * @param  array<string, mixed>  $khoi
     */
    private function doan(array $khoi, int $muc, bool $cuoiO): string
    {
        $doan = $this->kieu->doan(is_array($khoi['paragraphFormat'] ?? null) ? $khoi['paragraphFormat'] : null);
        $tenKieu = (string) $doan['styleName'];
        $ketQua = "\n\\pard\\plain";

        if ($muc > 0) {
            $ketQua .= '\\intbl'.($muc > 1 ? '\\itap'.$muc : '');
        }

        if (isset($this->maKieuDoan[$tenKieu])) {
            $ketQua .= '\\s'.$this->maKieuDoan[$tenKieu];
        }

        $ketQua .= $this->dinhDang->doan($doan);
        $listId = (int) ($doan['listFormat']['listId'] ?? -1);
        $ls = $listId >= 0 ? $this->danhSach->soLs($listId) : null;

        if ($ls !== null) {
            $ketQua .= '\\ls'.$ls.'\\ilvl'.max(0, min(8, (int) ($doan['listFormat']['listLevelNumber'] ?? 0)));
        }

        $dauDoan = $this->kieu->kyTu(is_array($khoi['characterFormat'] ?? null) ? $khoi['characterFormat'] : null, $tenKieu);
        $ketQua .= $this->dinhDang->kyTu($dauDoan).' ';
        $nhomTruoc = null;

        foreach ($khoi['inlines'] ?? [] as $inline) {
            if (! is_array($inline)) {
                continue;
            }

            $manh = $this->inline($inline, $tenKieu, $muc > 0);

            // Hai đoạn chữ liền nhau cùng định dạng gộp vào một nhóm cho RTF gọn.
            if ($nhomTruoc !== null && preg_match('/^(\{\\\\plain[^ ]* )(.*)\}$/s', $manh, $khop) && $khop[1] === $nhomTruoc) {
                $ketQua = substr($ketQua, 0, -1).$khop[2].'}';

                continue;
            }

            $nhomTruoc = preg_match('/^(\{\\\\plain[^ {]* )[^{}]*\}$/s', $manh, $khop) ? $khop[1] : null;
            $ketQua .= $manh;
        }

        if ($muc > 0 && $cuoiO) {
            return $ketQua.$this->dongTruong().($muc > 1 ? '\\nestcell' : '\\cell');
        }

        return $ketQua.'\\par';
    }

    /**
     * Một inline: chữ, ảnh, ký tự trường, bookmark; lớp bao (contentControlProperties có inlines) được gỡ.
     *
     * @param  array<string, mixed>  $inline
     */
    private function inline(array $inline, string $tenKieu, bool $trongBang): string
    {
        if (isset($inline['inlines']) && is_array($inline['inlines'])) {
            $ketQua = '';
            foreach ($inline['inlines'] as $con) {
                if (is_array($con)) {
                    $ketQua .= $this->inline($con, $tenKieu, $trongBang);
                }
            }

            return $ketQua;
        }

        if (array_key_exists('text', $inline)) {
            $chu = (string) $inline['text'];

            // Ngắt trang trong ô bảng không có nghĩa (bộ soạn cũng bỏ).
            if ($trongBang) {
                $chu = str_replace("\f", '', $chu);
            }

            if ($chu === '') {
                return '';
            }

            return '{\\plain'.$this->kyTuInline($inline, $tenKieu).' '.MaRtf::chu($chu).'}';
        }

        if (isset($inline['imageString'])) {
            return $this->anh($inline, $tenKieu);
        }

        if (isset($inline['bookmarkType'], $inline['name'])) {
            return '{\\*\\bkmk'.((int) $inline['bookmarkType'] === 1 ? 'end' : 'start').' '.MaRtf::ten((string) $inline['name']).'}';
        }

        if (array_key_exists('hasFieldEnd', $inline) || (isset($inline['fieldType']) && (int) $inline['fieldType'] === 0)) {
            $this->truongMo[] = false;

            return '{\\field{\\*\\fldinst '.$this->bieuMau($inline['formFieldData'] ?? null);
        }

        if (isset($inline['fieldType']) && (int) $inline['fieldType'] === 2 && $this->truongMo !== []) {
            if ($this->truongMo[array_key_last($this->truongMo)]) {
                return '';
            }

            $this->truongMo[array_key_last($this->truongMo)] = true;

            return '}{\\fldrslt ';
        }

        if (isset($inline['fieldType']) && (int) $inline['fieldType'] === 1 && $this->truongMo !== []) {
            $coKetQua = array_pop($this->truongMo);

            return $coKetQua ? '}}' : '}{\\fldrslt }}';
        }

        return '';
    }

    /**
     * Định dạng hiệu lực của inline (sau \plain), kèm \csN nếu có kiểu ký tự.
     *
     * @param  array<string, mixed>  $inline
     */
    private function kyTuInline(array $inline, string $tenKieu): string
    {
        $kyTu = is_array($inline['characterFormat'] ?? null) ? $inline['characterFormat'] : null;
        $ketQua = '';
        $tenKieuKyTu = $kyTu['styleName'] ?? null;

        if ($tenKieuKyTu !== null && isset($this->maKieuKyTu[$tenKieuKyTu])) {
            $ketQua .= '\\cs'.$this->maKieuKyTu[$tenKieuKyTu];
        }

        return $ketQua.$this->dinhDang->kyTu($this->kieu->kyTu($kyTu, $tenKieu));
    }

    /**
     * Dữ liệu trường biểu mẫu (formFieldData) sang {\*\formfield ...}.
     */
    private function bieuMau(mixed $duLieu): string
    {
        if (! is_array($duLieu)) {
            return '';
        }

        $ten = '{\\*\\ffname '.MaRtf::ten((string) ($duLieu['name'] ?? '')).'}';

        if (isset($duLieu['checkBox']) && is_array($duLieu['checkBox'])) {
            $hop = $duLieu['checkBox'];
            $chon = ! empty($hop['checked']) ? 1 : 0;

            return '{\\*\\formfield{\\fftype1\\ffres'.$chon.'\\ffprot0\\ffsize'.(($hop['sizeType'] ?? 'Auto') === 'Auto' ? 0 : 1)
                .'\\ffhps'.((int) ($hop['size'] ?? 10) * 2).'\\ffdefres'.(! empty($hop['defaultValue']) ? 1 : 0).$ten.'}}';
        }

        if (isset($duLieu['dropDownList']) && is_array($duLieu['dropDownList'])) {
            $danhSach = $duLieu['dropDownList'];
            $cacMuc = implode('', array_map(fn (mixed $muc): string => '{\\*\\ffl '.MaRtf::ten((string) $muc).'}', $danhSach['dropDownItems'] ?? []));

            return '{\\*\\formfield{\\fftype2\\ffres'.(int) ($danhSach['selectedIndex'] ?? 0).'\\ffprot0'.$ten.$cacMuc.'}}';
        }

        $nhap = is_array($duLieu['textInput'] ?? null) ? $duLieu['textInput'] : [];
        $loai = match ($nhap['type'] ?? 'Text') {
            'Number' => 1,
            'Date' => 2,
            'Calculation' => 5,
            default => 0,
        };

        return '{\\*\\formfield{\\fftype0\\fftypetxt'.$loai.'\\ffprot0\\ffmaxlen'.(int) ($nhap['maxLength'] ?? 0).$ten
            .'{\\*\\ffdeftext '.MaRtf::chu((string) ($nhap['defaultValue'] ?? '')).'}'
            .'{\\*\\ffformat '.MaRtf::chu((string) ($nhap['format'] ?? '')).'}}}';
    }

    /**
     * Ảnh: PNG và JPEG nhúng nguyên; GIF, BMP đổi sang PNG bằng GD. Kích thước đích theo width/height (điểm).
     *
     * @param  array<string, mixed>  $inline
     */
    private function anh(array $inline, string $tenKieu): string
    {
        if (! preg_match('/^data:[^;,]*(?:;[^,]*)?,(.*)$/s', (string) $inline['imageString'], $khop)) {
            return '';
        }

        $duLieu = base64_decode($khop[1], true);

        if ($duLieu === false || $duLieu === '') {
            return '';
        }

        if (str_starts_with($duLieu, "\x89PNG")) {
            $loai = '\\pngblip';
        } elseif (str_starts_with($duLieu, "\xFF\xD8")) {
            $loai = '\\jpegblip';
        } else {
            $duLieu = $this->doiSangPng($duLieu);
            $loai = '\\pngblip';

            if ($duLieu === null) {
                return '';
            }
        }

        $kichThuoc = @getimagesizefromstring($duLieu) ?: [0, 0];
        $rong = MaRtf::twip((float) ($inline['width'] ?? 0));
        $cao = MaRtf::twip((float) ($inline['height'] ?? 0));
        $rongPx = (int) ($kichThuoc[0] ?: max(1, round($rong / 15)));
        $caoPx = (int) ($kichThuoc[1] ?: max(1, round($cao / 15)));
        $rong = $rong > 0 ? $rong : $rongPx * 15;
        $cao = $cao > 0 ? $cao : $caoPx * 15;

        return '{\\plain'.$this->kyTuInline($inline, $tenKieu).'{\\pict'.$loai.'\\picw'.$rongPx.'\\pich'.$caoPx
            .'\\picwgoal'.$rong.'\\pichgoal'.$cao."\n".rtrim(chunk_split(bin2hex($duLieu), 128, "\n")).'}}';
    }

    private function doiSangPng(string $duLieu): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            return null;
        }

        $anh = @imagecreatefromstring($duLieu);

        if ($anh === false) {
            return null;
        }

        ob_start();
        imagepng($anh);

        return (string) ob_get_clean() ?: null;
    }

    /**
     * Đóng các trường còn mở (trường hỏng hoặc vắt qua ranh giới ô).
     */
    private function dongTruong(): string
    {
        $ketQua = '';

        while ($this->truongMo !== []) {
            $ketQua .= array_pop($this->truongMo) ? '}}' : '}{\\fldrslt }}';
        }

        return $ketQua;
    }

    /**
     * Một bảng ở độ lồng $muc (1 là bảng ngoài cùng).
     *
     * @param  array<string, mixed>  $bang
     */
    private function bang(array $bang, int $muc): string
    {
        $dinhDangBang = is_array($bang['tableFormat'] ?? null) ? $bang['tableFormat'] : [];
        $cacHang = array_values(array_filter($bang['rows'] ?? [], fn (mixed $hang): bool => is_array($hang) && ! empty($hang['cells'])));
        $ketQua = '';
        $mang = [];

        foreach ($cacHang as $chiSo => $hang) {
            $cacO = $this->xepO($hang, $mang);
            $dinhNghia = $this->dinhNghiaHang($hang, $chiSo, count($cacHang), $cacO, $dinhDangBang);
            $noiDung = '';

            foreach ($cacO as $o) {
                $khoi = $o['gop'] ? [] : $this->trai($o['o']['blocks'] ?? []);

                if ($khoi === [] || isset($khoi[array_key_last($khoi)]['rows'])) {
                    $khoi[] = ['paragraphFormat' => ['styleName' => 'Normal'], 'inlines' => []];
                }

                foreach ($khoi as $thuTu => $mot) {
                    $noiDung .= $this->khoi($mot, $muc, $thuTu === array_key_last($khoi));
                }
            }

            $ketQua .= $muc === 1
                ? "\n".$dinhNghia.$noiDung.'\\row'
                : $noiDung."\n{\\*\\nesttableprops".$dinhNghia.'\\nestrow}{\\nonesttables\\par}';
        }

        return $ketQua."\n\\pard\\plain ";
    }

    /**
     * Xếp ô của hàng theo cột lưới; chèn ô gộp dọc (\clvmrg) vào chỗ ô rowSpan của hàng trên còn phủ.
     *
     * @param  array<string, mixed>  $hang
     * @param  array<int, array{con: int, nhip: int, o: array<string, mixed>}>  $mang  ô rowSpan đang phủ xuống, theo cột
     * @return list<array{o: array<string, mixed>, gop: bool, dauGop: bool}>
     */
    private function xepO(array $hang, array &$mang): array
    {
        $ketQua = [];
        $cot = (int) ($hang['rowFormat']['gridBefore'] ?? 0);
        $chenPhu = function () use (&$cot, &$mang, &$ketQua): void {
            while (isset($mang[$cot])) {
                $phu = $mang[$cot];
                $ketQua[] = ['o' => $phu['o'], 'gop' => true, 'dauGop' => false];
                $cot += $phu['nhip'];
            }
        };

        $phuMoi = [];

        foreach ($hang['cells'] as $o) {
            if (! is_array($o)) {
                continue;
            }

            $chenPhu();
            $nhip = max(1, (int) ($o['cellFormat']['columnSpan'] ?? 1));
            $soHang = max(1, (int) ($o['cellFormat']['rowSpan'] ?? 1));
            $ketQua[] = ['o' => $o, 'gop' => false, 'dauGop' => $soHang > 1];

            if ($soHang > 1) {
                $phuMoi[$cot] = ['con' => $soHang - 1, 'nhip' => $nhip, 'o' => $o];
            }

            $cot += $nhip;
        }

        ksort($mang);
        foreach ($mang as $cotPhu => $phu) {
            if ($cotPhu >= $cot) {
                $cot = $cotPhu;
                $chenPhu();
            }
        }

        foreach ($mang as $cotPhu => $phu) {
            if ($phu['con'] > 1) {
                $phuMoi[$cotPhu] = ['con' => $phu['con'] - 1] + $phu;
            }
        }

        $mang = $phuMoi;

        return $ketQua;
    }

    /**
     * \trowd ... \cellx của một hàng.
     *
     * @param  array<string, mixed>  $hang
     * @param  list<array{o: array<string, mixed>, gop: bool, dauGop: bool}>  $cacO
     * @param  array<string, mixed>  $dinhDangBang
     */
    private function dinhNghiaHang(array $hang, int $chiSo, int $soHang, array $cacO, array $dinhDangBang): string
    {
        $dinhDangHang = is_array($hang['rowFormat'] ?? null) ? $hang['rowFormat'] : [];
        $le = fn (string $canh, float $macDinh): float => (float) ($dinhDangHang[$canh.'Margin'] ?? $dinhDangBang[$canh.'Margin'] ?? $macDinh);
        $leTrai = $le('left', 5.4);
        $thut = MaRtf::twip((float) ($dinhDangBang['leftIndent'] ?? 0));
        $ketQua = '\\trowd\\irow'.$chiSo.'\\irowband'.$chiSo.'\\trgaph'.MaRtf::twip($leTrai).'\\trleft'.$thut;

        $ketQua .= match ($dinhDangBang['tableAlignment'] ?? 'Left') {
            'Center' => '\\trqc',
            'Right' => '\\trqr',
            default => '\\trql',
        };

        $vienBang = is_array($dinhDangBang['borders'] ?? null) ? $dinhDangBang['borders'] : [];
        foreach (['top' => 't', 'left' => 'l', 'bottom' => 'b', 'right' => 'r', 'horizontal' => 'h', 'vertical' => 'v'] as $canh => $ma) {
            if (DinhDangRtf::coNet($vienBang[$canh] ?? null)) {
                $ketQua .= '\\trbrdr'.$ma.$this->dinhDang->vien($vienBang[$canh]);
            }
        }

        $cao = (float) ($dinhDangHang['height'] ?? 0);
        if ($cao > 0) {
            $ketQua .= '\\trrh'.(($dinhDangHang['heightType'] ?? 'AtLeast') === 'Exactly' ? -MaRtf::twip($cao) : MaRtf::twip($cao));
        }

        if (! empty($dinhDangHang['isHeader'])) {
            $ketQua .= '\\trhdr';
        }

        if (array_key_exists('allowBreakAcrossPages', $dinhDangHang) && ! $dinhDangHang['allowBreakAcrossPages']) {
            $ketQua .= '\\trkeep';
        }

        $ketQua .= $this->doRong('\\trftsWidth', '\\trwWidth', $dinhDangBang['preferredWidthType'] ?? 'Auto', (float) ($dinhDangBang['preferredWidth'] ?? 0));

        $truoc = MaRtf::twip((float) ($dinhDangHang['gridBeforeWidth'] ?? 0));
        if ((int) ($dinhDangHang['gridBefore'] ?? 0) > 0 && $truoc > 0) {
            $ketQua .= '\\trftsWidthB3\\trwWidthB'.$truoc;
        }

        $sau = MaRtf::twip((float) ($dinhDangHang['gridAfterWidth'] ?? 0));
        if ((int) ($dinhDangHang['gridAfter'] ?? 0) > 0 && $sau > 0) {
            $ketQua .= '\\trftsWidthA3\\trwWidthA'.$sau;
        }

        $ketQua .= '\\trautofit'.(($dinhDangBang['allowAutoFit'] ?? true) ? 1 : 0);
        $ketQua .= '\\trpaddl'.MaRtf::twip($leTrai).'\\trpaddr'.MaRtf::twip($le('right', 5.4))
            .'\\trpaddt'.MaRtf::twip($le('top', 0)).'\\trpaddb'.MaRtf::twip($le('bottom', 0))
            .'\\trpaddfl3\\trpaddfr3\\trpaddft3\\trpaddfb3';

        $khoangCach = (float) ($dinhDangBang['cellSpacing'] ?? 0);
        if ($khoangCach > 0) {
            $tw = MaRtf::twip($khoangCach);
            $ketQua .= '\\trspdl'.$tw.'\\trspdt'.$tw.'\\trspdb'.$tw.'\\trspdr'.$tw.'\\trspdfl3\\trspdft3\\trspdfb3\\trspdfr3';
        }

        if (! empty($dinhDangBang['bidi'])) {
            $ketQua .= '\\taprtl';
        }

        $x = $thut + $truoc;
        $soO = count($cacO);

        foreach ($cacO as $thuTu => $o) {
            $dinhDangO = is_array($o['o']['cellFormat'] ?? null) ? $o['o']['cellFormat'] : [];
            $ketQua .= $o['gop'] ? '\\clvmrg' : ($o['dauGop'] ? '\\clvmgf' : '');
            $ketQua .= match ($dinhDangO['verticalAlignment'] ?? 'Top') {
                'Center' => '\\clvertalc',
                'Bottom' => '\\clvertalb',
                default => '\\clvertalt',
            };

            $ketQua .= $this->vienO($dinhDangO, $dinhDangHang, $vienBang, $chiSo, $soHang, $thuTu, $soO);
            $nen = TaiNguyenRtf::rgb(is_string($dinhDangO['shading']['backgroundColor'] ?? null) ? $dinhDangO['shading']['backgroundColor'] : null);

            if ($nen !== null) {
                $ketQua .= '\\clcbpat'.$this->taiNguyen->mau('#'.$nen);
            }

            if (empty($dinhDangO['isSamePaddingAsTable']) && isset($dinhDangO['leftMargin'])) {
                $ketQua .= '\\clpadl'.MaRtf::twip((float) $dinhDangO['leftMargin']).'\\clpadfl3'
                    .'\\clpadr'.MaRtf::twip((float) ($dinhDangO['rightMargin'] ?? $le('right', 5.4))).'\\clpadfr3';
            }

            $ketQua .= $this->doRong('\\clftsWidth', '\\clwWidth', $dinhDangO['preferredWidthType'] ?? 'Point', (float) ($dinhDangO['preferredWidth'] ?? $dinhDangO['cellWidth'] ?? 0));
            $rong = MaRtf::twip((float) ($dinhDangO['cellWidth'] ?? 0));

            if ($rong <= 0) {
                $rong = ($dinhDangO['preferredWidthType'] ?? '') === 'Point' && (float) ($dinhDangO['preferredWidth'] ?? 0) > 0
                    ? MaRtf::twip((float) $dinhDangO['preferredWidth'])
                    : 1440;
            }

            $x += $rong;
            $ketQua .= '\\cellx'.$x;
        }

        return $ketQua;
    }

    /**
     * \trftsWidth/\clftsWidth: 1 tự động, 2 phần trăm (đơn vị 1/50 %), 3 twip.
     */
    private function doRong(string $tuKieu, string $tuGiaTri, string $kieu, float $giaTri): string
    {
        return match ($kieu) {
            'Percent' => $tuKieu.'2'.$tuGiaTri.(int) round($giaTri * 50),
            'Point' => $giaTri > 0 ? $tuKieu.'3'.$tuGiaTri.MaRtf::twip($giaTri) : $tuKieu.'1',
            default => $tuKieu.'1',
        };
    }

    /**
     * Viền hiệu lực của ô: viền riêng của ô nếu có nét hoặc đặt "không viền", ngược lại viền hàng rồi viền bảng
     * (cạnh ngoài dùng viền ngoài, cạnh trong dùng viền trong).
     *
     * @param  array<string, mixed>  $dinhDangO
     * @param  array<string, mixed>  $dinhDangHang
     * @param  array<string, mixed>  $vienBang
     */
    private function vienO(array $dinhDangO, array $dinhDangHang, array $vienBang, int $hang, int $soHang, int $o, int $soO): string
    {
        $vienO = is_array($dinhDangO['borders'] ?? null) ? $dinhDangO['borders'] : [];
        $vienHang = is_array($dinhDangHang['borders'] ?? null) ? $dinhDangHang['borders'] : [];
        $ketQua = '';

        foreach ([
            'top' => ['t', $hang === 0 ? 'top' : 'horizontal'],
            'left' => ['l', $o === 0 ? 'left' : 'vertical'],
            'bottom' => ['b', $hang === $soHang - 1 ? 'bottom' : 'horizontal'],
            'right' => ['r', $o === $soO - 1 ? 'right' : 'vertical'],
        ] as $canh => [$ma, $canhBang]) {
            $rieng = $vienO[$canh] ?? null;
            $vien = match (true) {
                DinhDangRtf::coNet($rieng) || ! empty($rieng['hasNoneStyle']) || ($rieng['lineStyle'] ?? null) === 'Cleared' => $rieng,
                DinhDangRtf::coNet($vienHang[$canhBang] ?? null) => $vienHang[$canhBang],
                default => $vienBang[$canhBang] ?? null,
            };

            $ketQua .= '\\clbrdr'.$ma.$this->dinhDang->vien(is_array($vien) ? $vien : null);
        }

        return $ketQua;
    }
}
