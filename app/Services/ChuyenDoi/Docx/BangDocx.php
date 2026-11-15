<?php

namespace App\Services\ChuyenDoi\Docx;

use Closure;
use DOMElement;

/**
 * Một bảng (w:tbl) sang khối bảng SFDT.
 *
 * Như dịch vụ .NET: viền bảng lấy từ w:tblBorders trực tiếp chồng lên viền của kiểu bảng; hàng mang lại viền và lề ô
 * trực tiếp của bảng; ô gộp dọc (w:vMerge) bị bỏ, ô đầu có rowSpan; cellWidth là tổng độ rộng các cột lưới ô phủ.
 */
final class BangDocx
{
    /**
     * Cạnh viền của WordprocessingML sang khóa SFDT.
     *
     * @var array<string, list<string>>
     */
    private const CANH = [
        'left' => ['left', 'start'], 'right' => ['right', 'end'], 'top' => ['top'], 'bottom' => ['bottom'],
        'vertical' => ['insideV'], 'horizontal' => ['insideH'], 'diagonalDown' => ['tl2br'], 'diagonalUp' => ['tr2bl'],
    ];

    private readonly ?DOMElement $tblPr;

    /**
     * w:tcPr của định dạng có điều kiện (w:tblStylePr) theo loại, null khi chưa đọc.
     *
     * @var array<string, list<DOMElement>>|null
     */
    private ?array $dieuKien = null;

    /**
     * Độ rộng cột lưới (twip).
     *
     * @var list<float>
     */
    private array $luoi = [];

    /**
     * @param  Closure(DOMElement): list<array<string, mixed>>  $khoiCuaO  khối nội dung của một ô
     * @param  Closure(DOMElement): ?array<string, mixed>  $danhDau  inline bookmark của w:bookmarkStart/End
     */
    public function __construct(
        private readonly NguCanhDocx $nguCanh,
        private readonly DOMElement $tbl,
        private readonly Closure $khoiCuaO,
        private readonly Closure $danhDau,
    ) {
        $this->tblPr = $this->dd()->conTen($tbl, 'tblPr');

        foreach ($this->dd()->con($this->dd()->conTen($tbl, 'tblGrid') ?? $tbl) as $cot) {
            if ($cot->localName === 'gridCol') {
                $this->luoi[] = DonVi::so(DonVi::thuocTinh($cot, 'w'));
            }
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function dung(): ?array
    {
        $cacHang = $this->cacHang();

        if ($cacHang === []) {
            return null;
        }

        $vienTrucTiep = $this->canhVien($this->dd()->conTen($this->tblPr, 'tblBorders'));
        $vienKieu = [];

        foreach (array_reverse($this->chuoiKieu()) as $kieu) {
            $vienKieu = $this->canhVien($this->dd()->conTen($this->dd()->conTen($kieu, 'tblPr'), 'tblBorders')) + $vienKieu;
        }

        $vienBang = $vienTrucTiep + $vienKieu;
        $leBang = $this->le($this->dd()->conTen($this->tblPr, 'tblCellMar'));
        $dongMo = [];

        foreach ($cacHang as $chiSo => $hang) {
            $dongMo[] = $this->hang($hang, $chiSo, $cacHang, $vienTrucTiep, $vienKieu !== [], $leBang);
        }

        return [
            'rows' => $dongMo,
            'title' => null,
            'description' => null,
            'tableFormat' => $this->dinhDangBang($vienBang, $leBang),
        ];
    }

    /**
     * Các w:tr (gỡ lớp bao w:sdt, w:customXml), mỗi hàng kèm danh sách ô với cột lưới bắt đầu.
     *
     * @return list<array{tr: DOMElement, o: list<array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}>}>
     */
    private function cacHang(): array
    {
        $ketQua = [];
        $choDau = [];

        foreach ($this->boBao($this->tbl, 'tr') as $tr) {
            if ($tr->localName !== 'tr') {
                $khongCoO = [];
                $this->xepBookmark($tr, $ketQua, $khongCoO, $choDau);

                continue;
            }

            $trPr = $this->dd()->conTen($tr, 'trPr');
            $truoc = $this->soCotLe($trPr, 'gridBefore', 'wBefore');
            $cot = abs($truoc);
            $cacO = [];

            foreach ($this->boBao($tr, 'tc') as $tc) {
                if ($tc->localName !== 'tc') {
                    $this->xepBookmark($tc, $ketQua, $cacO, $choDau);

                    continue;
                }

                $tcPr = $this->dd()->conTen($tc, 'tcPr');
                $nhip = max(1, (int) (($gop = $this->dd()->conTen($tcPr, 'gridSpan')) === null ? 1 : $this->dd()->val($gop)));
                $gopDoc = $this->dd()->conTen($tcPr, 'vMerge');
                $cacO[] = [
                    'tc' => $tc,
                    'cot' => $cot,
                    'nhip' => $nhip,
                    'nhipSfdt' => $nhip,
                    'gopDoc' => $gopDoc === null ? null : ($this->dd()->val($gopDoc) === 'restart' ? 'restart' : 'continue'),
                    'dau' => $choDau,
                    'cuoi' => [],
                ];
                $choDau = [];
                $cot += $nhip;
            }

            $ketQua[] = ['tr' => $tr, 'o' => $cacO, 'truoc' => $truoc, 'sau' => $this->soCotLe($trPr, 'gridAfter', 'wAfter')];
        }

        if ($choDau !== [] && $ketQua !== [] && $ketQua[array_key_last($ketQua)]['o'] !== []) {
            $hang = array_key_last($ketQua);
            $o = array_key_last($ketQua[$hang]['o']);
            array_push($ketQua[$hang]['o'][$o]['cuoi'], ...$choDau);
        }

        return $this->nhapCotTrong($ketQua);
    }

    /**
     * Như .NET: cột lưới bỏ trống không có độ rộng (gridBefore/gridAfter với w:wBefore/w:wAfter rỗng) mà hàng khác có ô
     * phủ thì nhập vào ô kề bên (columnSpan tăng); cột không ô nào phủ thì bị bỏ.
     *
     * @param  list<array{tr: DOMElement, o: list<array<string, mixed>>, truoc: int, sau: int}>  $cacHang
     * @return list<array{tr: DOMElement, o: list<array<string, mixed>>, truoc: int, sau: int}>
     */
    private function nhapCotTrong(array $cacHang): array
    {
        $coO = [];

        foreach ($cacHang as $hang) {
            foreach ($hang['o'] as $o) {
                for ($c = $o['cot']; $c < $o['cot'] + $o['nhip']; $c++) {
                    $coO[$c] = true;
                }
            }
        }

        $dem = function (int $tu, int $so) use ($coO): int {
            $ketQua = 0;
            for ($c = $tu; $c < $tu + $so; $c++) {
                $ketQua += isset($coO[$c]) ? 1 : 0;
            }

            return $ketQua;
        };

        foreach ($cacHang as &$hang) {
            if ($hang['o'] === []) {
                continue;
            }

            if ($hang['truoc'] < 0) {
                $hang['o'][0]['nhipSfdt'] += $dem(0, -$hang['truoc']);
            }

            if ($hang['sau'] < 0) {
                $cuoi = array_key_last($hang['o']);
                $hang['o'][$cuoi]['nhipSfdt'] += $dem($hang['o'][$cuoi]['cot'] + $hang['o'][$cuoi]['nhip'], -$hang['sau']);
            }
        }

        return $cacHang;
    }

    /**
     * Bookmark nằm giữa các ô hoặc các hàng: điểm cuối gắn vào cuối ô trước (như .NET), điểm đầu chờ gắn vào đầu ô sau.
     *
     * @param  list<array{tr: DOMElement, o: list<array<string, mixed>>}>  $cacHang
     * @param  list<array<string, mixed>>  $cacO  các ô đã đọc của hàng đang đọc
     * @param  list<DOMElement>  $choDau
     */
    private function xepBookmark(DOMElement $danhDau, array &$cacHang, array &$cacO, array &$choDau): void
    {
        if ($danhDau->localName === 'bookmarkEnd' && $cacO !== []) {
            $cacO[array_key_last($cacO)]['cuoi'][] = $danhDau;
        } elseif ($danhDau->localName === 'bookmarkEnd' && $cacHang !== [] && $cacHang[array_key_last($cacHang)]['o'] !== []) {
            $hang = array_key_last($cacHang);
            $cacHang[$hang]['o'][array_key_last($cacHang[$hang]['o'])]['cuoi'][] = $danhDau;
        } else {
            $choDau[] = $danhDau;
        }
    }

    /**
     * Số cột lưới bỏ trống ở đầu (gridBefore) hoặc cuối (gridAfter) hàng. Như .NET, cột trống không có độ rộng
     * (w:wBefore rỗng hoặc 0) được nhập vào ô kề bên: trả số âm để báo điều đó.
     */
    private function soCotLe(?DOMElement $trPr, string $tenLuoi, string $tenRong): int
    {
        $phanTu = $this->dd()->conTen($trPr, $tenLuoi);
        $so = $phanTu === null ? 0 : (int) $this->dd()->val($phanTu);

        if ($so <= 0) {
            return 0;
        }

        $rong = $this->dd()->conTen($trPr, $tenRong);

        return $rong === null || DonVi::so(DonVi::thuocTinh($rong, 'w')) <= 0 ? -$so : $so;
    }

    /**
     * Phần tử con tên cho trước, gỡ các lớp bao (w:sdt/w:sdtContent, w:customXml).
     *
     * @return list<DOMElement>
     */
    private function boBao(DOMElement $cha, string $ten): array
    {
        $ketQua = [];

        foreach ($this->dd()->con($cha) as $con) {
            if ($con->localName === $ten || $con->localName === 'bookmarkStart' || $con->localName === 'bookmarkEnd') {
                $ketQua[] = $con;
            } elseif ($con->localName === 'sdt') {
                $noiDung = $this->dd()->conTen($con, 'sdtContent');
                if ($noiDung !== null) {
                    array_push($ketQua, ...$this->boBao($noiDung, $ten));
                }
            } elseif (in_array($con->localName, ['customXml', 'ins', 'moveTo'], true)) {
                array_push($ketQua, ...$this->boBao($con, $ten));
            }
        }

        return $ketQua;
    }

    /**
     * @param  array{tr: DOMElement, o: list<array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}>}  $hang
     * @param  list<array{tr: DOMElement, o: list<array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}>}>  $cacHang
     * @param  array<string, DOMElement>  $vienTrucTiep
     * @param  array<string, float>  $leBang
     * @return array<string, mixed>
     */
    private function hang(array $hang, int $chiSo, array $cacHang, array $vienTrucTiep, bool $coVienKieu, array $leBang): array
    {
        $trPr = $this->dd()->conTen($hang['tr'], 'trPr');
        $tblPrEx = $this->dd()->conTen($hang['tr'], 'tblPrEx');
        $chieuCao = $this->dd()->conTen($trPr, 'trHeight');
        $dinhDang = [
            'allowBreakAcrossPages' => ($khongTach = $this->dd()->conTen($trPr, 'cantSplit')) === null || ! DonVi::bat($khongTach),
            'isHeader' => ($tieuDe = $this->dd()->conTen($trPr, 'tblHeader')) !== null && DonVi::bat($tieuDe),
            'height' => $chieuCao === null ? 0.0 : DonVi::twip($this->dd()->val($chieuCao)),
            'heightType' => $chieuCao !== null && DonVi::thuocTinh($chieuCao, 'hRule') === 'exact' ? 'Exactly' : 'AtLeast',
        ];

        $vienHang = $this->canhVien($this->dd()->conTen($tblPrEx, 'tblBorders')) + $vienTrucTiep;
        $dinhDang['borders'] = $this->cacVien($vienHang, $vienTrucTiep !== [] || ! $coVienKieu);

        foreach (['gridBefore' => 'wBefore', 'gridAfter' => 'wAfter'] as $luoi => $rong) {
            $so = $this->soCotLe($trPr, $luoi, $rong);
            if ($so > 0) {
                $dinhDang[$luoi] = $so;
                [$giaTri, $kieu] = $this->dd()->doRong($this->dd()->conTen($trPr, $rong));
                $dinhDang[$luoi.'Width'] = $giaTri;
                $dinhDang[$luoi.'WidthType'] = $kieu;
            }
        }

        $leHang = $this->le($this->dd()->conTen($tblPrEx, 'tblCellMar')) + $leBang;
        foreach (['left', 'right', 'top', 'bottom'] as $canh) {
            if (isset($leHang[$canh])) {
                $dinhDang[$canh.'Margin'] = $leHang[$canh];
            }
        }

        // Thụt lề bảng bằng 0 hoặc âm thì .NET không ghi vào hàng.
        $thut = $this->dd()->conTen($tblPrEx, 'tblInd') ?? $this->dd()->conTen($this->tblPr, 'tblInd');
        if ($thut !== null && DonVi::so(DonVi::thuocTinh($thut, 'w')) > 0) {
            $dinhDang['leftIndent'] = DonVi::so(DonVi::thuocTinh($thut, 'w')) / 20;
        }

        $cacO = [];
        $soO = count($hang['o']);

        foreach ($hang['o'] as $thuTu => $o) {
            if ($o['gopDoc'] === 'continue') {
                continue;
            }

            $dieuKien = $this->tcPrDieuKien($chiSo, count($cacHang), $thuTu, $soO);
            $cacO[] = $this->o($o, $this->soHangGop($o, $chiSo, $cacHang), $leHang, $dieuKien);
        }

        return ['rowFormat' => $dinhDang, 'cells' => $cacO];
    }

    /**
     * w:tcPr của định dạng có điều kiện trong kiểu bảng (w:tblStylePr) áp cho ô ở vị trí cho trước, theo thứ tự
     * ưu tiên tăng dần như Word: cả bảng, dải cột, dải hàng, cột đầu/cuối, hàng đầu/cuối, ô góc. Bật/tắt theo w:tblLook.
     *
     * @return list<DOMElement>
     */
    private function tcPrDieuKien(int $hang, int $soHang, int $o, int $soO): array
    {
        if ($this->dieuKien === null) {
            $this->dieuKien = [];

            foreach (array_reverse($this->chuoiKieu()) as $kieu) {
                foreach ($this->dd()->con($kieu) as $con) {
                    $tcPr = $con->localName === 'tblStylePr' ? $this->dd()->conTen($con, 'tcPr') : null;
                    if ($tcPr !== null) {
                        $this->dieuKien[(string) DonVi::thuocTinh($con, 'type')][] = $tcPr;
                    }
                }
            }
        }

        if ($this->dieuKien === []) {
            return [];
        }

        $nhin = $this->dd()->conTen($this->tblPr, 'tblLook');
        $mat = $nhin === null ? 0x04A0 : (int) hexdec((string) (DonVi::thuocTinh($nhin, 'val') ?? '0'));
        $co = fn (string $ten, int $bit): bool => ($giaTri = $nhin === null ? null : DonVi::thuocTinh($nhin, $ten)) !== null
            ? in_array($giaTri, ['1', 'true', 'on'], true)
            : ($mat & $bit) !== 0;
        $hangDau = $co('firstRow', 0x0020) && $hang === 0;
        $hangCuoi = $co('lastRow', 0x0040) && $hang === $soHang - 1;
        $cotDau = $co('firstColumn', 0x0080) && $o === 0;
        $cotCuoi = $co('lastColumn', 0x0100) && $o === $soO - 1;
        $dai = ($hang - ($co('firstRow', 0x0020) ? 1 : 0)) % 2 === 0 ? 'band1Horz' : 'band2Horz';
        $daiCot = ($o - ($co('firstColumn', 0x0080) ? 1 : 0)) % 2 === 0 ? 'band1Vert' : 'band2Vert';
        $loai = ['wholeTable'];

        if (! $co('noVBand', 0x0400) && ! $cotDau && ! $cotCuoi) {
            $loai[] = $daiCot;
        }

        if (! $co('noHBand', 0x0200) && ! $hangDau && ! $hangCuoi) {
            $loai[] = $dai;
        }

        array_push($loai, ...array_keys(array_filter([
            'firstCol' => $cotDau, 'lastCol' => $cotCuoi, 'firstRow' => $hangDau, 'lastRow' => $hangCuoi,
            'neCell' => $hangDau && $cotCuoi, 'nwCell' => $hangDau && $cotDau, 'seCell' => $hangCuoi && $cotCuoi, 'swCell' => $hangCuoi && $cotDau,
        ])));

        $ketQua = [];
        foreach ($loai as $ten) {
            array_push($ketQua, ...($this->dieuKien[$ten] ?? []));
        }

        return $ketQua;
    }

    /**
     * Phần tử con của tcPr có điều kiện ưu tiên cao nhất có khai báo.
     *
     * @param  list<DOMElement>  $dieuKien
     */
    private function theoDieuKien(array $dieuKien, string $ten): ?DOMElement
    {
        foreach (array_reverse($dieuKien) as $tcPr) {
            $con = $this->dd()->conTen($tcPr, $ten);
            if ($con !== null) {
                return $con;
            }
        }

        return null;
    }

    /**
     * Số hàng ô phủ: 1 cộng số hàng kế tiếp có ô gộp dọc tiếp nối tại cùng cột lưới.
     *
     * @param  array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}  $o
     * @param  list<array{tr: DOMElement, o: list<array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}>}>  $cacHang
     */
    private function soHangGop(array $o, int $chiSo, array $cacHang): int
    {
        if ($o['gopDoc'] !== 'restart') {
            return 1;
        }

        $so = 1;

        for ($i = $chiSo + 1; $i < count($cacHang); $i++) {
            $tiep = null;

            foreach ($cacHang[$i]['o'] as $khac) {
                if ($khac['cot'] === $o['cot']) {
                    $tiep = $khac;
                    break;
                }
            }

            if ($tiep === null || $tiep['gopDoc'] !== 'continue') {
                break;
            }

            $so++;
        }

        return $so;
    }

    /**
     * Một ô: cellFormat và blocks.
     *
     * @param  array{tc: DOMElement, cot: int, nhip: int, gopDoc: ?string}  $o
     * @param  array<string, float>  $leBang
     * @param  list<DOMElement>  $dieuKien  tcPr có điều kiện của kiểu bảng, ưu tiên tăng dần
     * @return array<string, mixed>
     */
    private function o(array $o, int $soHang, array $leBang, array $dieuKien = []): array
    {
        $tcPr = $this->dd()->conTen($o['tc'], 'tcPr');
        $dinhDang = [];
        $tcMar = $this->dd()->conTen($tcPr, 'tcMar');

        if ($tcMar !== null) {
            $le = $this->le($tcMar) + $leBang;
            foreach (['left', 'right', 'top', 'bottom'] as $canh) {
                if (isset($le[$canh])) {
                    $dinhDang[$canh.'Margin'] = DonVi::f32($le[$canh]);
                }
            }
        }

        $dinhDang['columnSpan'] = $o['nhipSfdt'] ?? $o['nhip'];
        $dinhDang['rowSpan'] = $soHang;
        $rong = $this->dd()->conTen($tcPr, 'tcW');
        [$giaTri, $kieu] = $rong === null ? [0.0, 'Auto'] : $this->dd()->doRong($rong);

        if ($kieu !== 'Auto' && $giaTri > 0) {
            $dinhDang['preferredWidth'] = $giaTri;
        }

        $dinhDang['preferredWidthType'] = $kieu;
        $canhDoc = $this->dd()->conTen($tcPr, 'vAlign') ?? $this->theoDieuKien($dieuKien, 'vAlign');
        $dinhDang['verticalAlignment'] = match ($canhDoc === null ? 'top' : $this->dd()->val($canhDoc)) {
            'center' => 'Center',
            'bottom' => 'Bottom',
            default => 'Top',
        };
        $dinhDang['isSamePaddingAsTable'] = $tcMar === null;
        $vien = $this->canhVien($this->dd()->conTen($tcPr, 'tcBorders'));

        foreach ($dieuKien as $tcPrKieu) {
            $vien = $this->canhVien($this->dd()->conTen($tcPrKieu, 'tcBorders')) + $vien;
        }

        $dinhDang['borders'] = $this->cacVien($this->canhVien($this->dd()->conTen($tcPr, 'tcBorders')) + $vien, false);
        $nen = $this->dd()->nen($this->dd()->conTen($tcPr, 'shd'));
        $nenKieu = $nen === null ? $this->dd()->nen($this->theoDieuKien($dieuKien, 'shd')) : null;

        if ($nen !== null) {
            $dinhDang['shading'] = $nen;
        } elseif (isset($nenKieu['backgroundColor'])) {
            // Nền từ kiểu bảng .NET chỉ ghi màu nền.
            $dinhDang['shading'] = ['backgroundColor' => $nenKieu['backgroundColor']];
        }

        $dinhDang['cellWidth'] = $this->rongLuoi($o['cot'], $o['nhip']) ?? ($kieu === 'Point' ? $giaTri : 0.0);
        $dau = array_values(array_filter(array_map($this->danhDau, $o['dau'] ?? [])));
        $khoi = ($this->khoiCuaO)($o['tc']);
        $cuoi = array_values(array_filter(array_map($this->danhDau, $o['cuoi'] ?? [])));

        if ($khoi === []) {
            $khoi[] = ['paragraphFormat' => ['styleName' => $this->nguCanh->kieu->tenDoanMacDinh()], 'inlines' => []];
        }

        if ($dau !== [] && isset($khoi[0]['inlines'])) {
            $khoi[0]['inlines'] = [...$dau, ...$khoi[0]['inlines']];
        }

        if ($cuoi !== [] && isset($khoi[array_key_last($khoi)]['inlines'])) {
            array_push($khoi[array_key_last($khoi)]['inlines'], ...$cuoi);
        }

        return ['blocks' => $khoi, 'cellFormat' => $dinhDang];
    }

    /**
     * Tổng độ rộng (điểm) các cột lưới từ cột cho trước; null nếu lưới thiếu cột.
     */
    private function rongLuoi(int $tu, int $so): ?float
    {
        if ($tu < 0 || $tu + $so > count($this->luoi)) {
            return null;
        }

        return DonVi::twip(array_sum(array_slice($this->luoi, $tu, $so)));
    }

    /**
     * @param  array<string, DOMElement>  $vien
     * @param  array<string, float>  $le
     * @return array<string, mixed>
     */
    private function dinhDangBang(array $vien, array $le): array
    {
        $dinhDang = [
            'allowAutoFit' => ($bo = $this->dd()->conTen($this->tblPr, 'tblLayout')) === null || DonVi::thuocTinh($bo, 'type') !== 'fixed',
        ];

        foreach (['left', 'right', 'top', 'bottom'] as $canh) {
            if (isset($le[$canh])) {
                $dinhDang[$canh.'Margin'] = DonVi::f32($le[$canh]);
            }
        }

        $thut = $this->thuocTinhBang('tblInd');
        $dinhDang['leftIndent'] = $thut === null ? 0.0 : DonVi::twip(DonVi::thuocTinh($thut, 'w'));
        $dinhDang['tableAlignment'] = match (($canh = $this->thuocTinhBang('jc')) === null ? 'left' : $this->dd()->val($canh)) {
            'center' => 'Center',
            'right', 'end' => 'Right',
            default => 'Left',
        };
        $rong = $this->dd()->conTen($this->tblPr, 'tblW');
        [$giaTri, $kieu] = $rong === null ? [0.0, 'Auto'] : $this->dd()->doRong($rong);

        if ($kieu !== 'Auto' && $giaTri > 0) {
            $dinhDang['preferredWidth'] = $giaTri;
        }

        $dinhDang['preferredWidthType'] = $kieu;
        $dinhDang['borders'] = $this->cacVien($vien, $vien === []);
        $nen = $this->dd()->nen($this->dd()->conTen($this->tblPr, 'shd'));

        if ($nen !== null && isset($nen['backgroundColor'])) {
            $dinhDang['shading'] = $nen;
        }

        $khoangCach = $this->dd()->conTen($this->tblPr, 'tblCellSpacing');
        if ($khoangCach !== null && DonVi::so(DonVi::thuocTinh($khoangCach, 'w')) > 0) {
            $dinhDang['cellSpacing'] = DonVi::twip(DonVi::thuocTinh($khoangCach, 'w'));
        }

        $dinhDang['bidi'] = ($phai = $this->dd()->conTen($this->tblPr, 'bidiVisual')) !== null && DonVi::bat($phai);

        return $dinhDang;
    }

    /**
     * Thuộc tính bảng trực tiếp, không có thì lấy từ kiểu bảng (gần nhất trước).
     */
    private function thuocTinhBang(string $ten): ?DOMElement
    {
        $truc = $this->dd()->conTen($this->tblPr, $ten);

        if ($truc !== null) {
            return $truc;
        }

        foreach ($this->chuoiKieu() as $kieu) {
            $tuKieu = $this->dd()->conTen($this->dd()->conTen($kieu, 'tblPr'), $ten);
            if ($tuKieu !== null) {
                return $tuKieu;
            }
        }

        return null;
    }

    /**
     * @return list<DOMElement>
     */
    private function chuoiKieu(): array
    {
        $kieu = $this->dd()->conTen($this->tblPr, 'tblStyle');

        return $this->nguCanh->kieu->chuoiKieu($kieu === null ? $this->nguCanh->kieu->maBangMacDinh() : $this->dd()->val($kieu));
    }

    /**
     * Các cạnh viền có khai báo trong một nhóm viền (w:tblBorders, w:tcBorders), theo khóa SFDT.
     *
     * @return array<string, DOMElement>
     */
    private function canhVien(?DOMElement $nhom): array
    {
        $ketQua = [];

        foreach (self::CANH as $khoa => $cacTen) {
            foreach ($cacTen as $ten) {
                $phanTu = $this->dd()->conTen($nhom, $ten);
                if ($phanTu !== null) {
                    $ketQua[$khoa] = $phanTu;
                    break;
                }
            }
        }

        return $ketQua;
    }

    /**
     * Đủ tám cạnh viền SFDT; cạnh không khai báo là "None" (hasNoneStyle theo tham số, trừ hai đường chéo).
     *
     * @param  array<string, DOMElement>  $vien
     * @return array<string, array<string, mixed>>
     */
    private function cacVien(array $vien, bool $thieuLaNone): array
    {
        $ketQua = [];

        foreach (array_keys(self::CANH) as $khoa) {
            $ketQua[$khoa] = isset($vien[$khoa])
                ? $this->vienSfdt($vien[$khoa])
                : DinhDangDocx::vienTrong($thieuLaNone && ! str_starts_with($khoa, 'diagonal'));
        }

        return $ketQua;
    }

    /**
     * Viền SFDT theo thứ tự khóa của .NET (màu ghi sau cùng).
     *
     * @return array<string, mixed>
     */
    private function vienSfdt(DOMElement $phanTu): array
    {
        $vien = $this->dd()->vien($phanTu);
        unset($vien['color']);
        $mauGoc = DonVi::thuocTinh($phanTu, 'color');

        // Như .NET: có w:color thì giữ (kể cả viền "none"), "auto" thì bỏ; không khai báo màu thì viền có nét là đen.
        $mau = match (true) {
            $mauGoc === null => in_array($vien['lineStyle'], ['None', 'Cleared'], true) ? null : '#000000FF',
            strtolower($mauGoc) === 'auto' => null,
            default => DonVi::mau($mauGoc),
        };

        if ($mau !== null) {
            $vien['color'] = $mau;
        }

        return $vien;
    }

    /**
     * Lề ô (w:tblCellMar, w:tcMar) theo điểm.
     *
     * @return array<string, float>
     */
    private function le(?DOMElement $nhom): array
    {
        $ketQua = [];

        foreach (['left' => ['left', 'start'], 'right' => ['right', 'end'], 'top' => ['top'], 'bottom' => ['bottom']] as $khoa => $cacTen) {
            foreach ($cacTen as $ten) {
                $phanTu = $this->dd()->conTen($nhom, $ten);
                if ($phanTu !== null) {
                    $ketQua[$khoa] = DonVi::so(DonVi::thuocTinh($phanTu, 'w')) / 20;
                    break;
                }
            }
        }

        return $ketQua;
    }

    private function dd(): DinhDangDocx
    {
        return $this->nguCanh->dinhDang;
    }
}
