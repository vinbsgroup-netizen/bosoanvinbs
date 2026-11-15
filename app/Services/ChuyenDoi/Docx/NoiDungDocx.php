<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMElement;

/**
 * Nội dung văn bản (w:body, đầu trang, chân trang, ô bảng) sang khối SFDT: đoạn, bảng, phần (section).
 *
 * Bám theo dịch vụ .NET: mỗi phần tử của run (chữ, tab, ngắt dòng, ngắt trang) là một inline riêng; trường
 * (fldSimple, fldChar, hyperlink) thành bộ ba fieldType 0/2/1 với mã trường là chữ thường; ô gộp dọc bị bỏ và ô đầu
 * mang rowSpan; ảnh nổi (wp:anchor) được đưa về ảnh trong dòng (isInlineImage = false như .NET).
 */
final class NoiDungDocx
{
    /**
     * Hình dựng sẵn (a:prstGeom) sang autoShapeType của SFDT.
     *
     * @var array<string, string>
     */
    private const LOAI_HINH = ['rect' => 'Rectangle', 'straightConnector1' => 'StraightConnector'];

    /**
     * relativeFrom của wp:positionH/V sang gốc vị trí của SFDT.
     *
     * @var array<string, string>
     */
    private const GOC_VI_TRI = [
        'paragraph' => 'Paragraph', 'page' => 'Page', 'margin' => 'Margin', 'line' => 'Line', 'column' => 'Column',
        'character' => 'Character', 'topMargin' => 'TopMargin', 'bottomMargin' => 'BottomMargin',
        'leftMargin' => 'LeftMargin', 'rightMargin' => 'RightMargin', 'insideMargin' => 'InsideMargin',
        'outsideMargin' => 'OutsideMargin',
    ];

    /**
     * Phần (part) đang đọc, để tra quan hệ của ảnh và liên kết.
     */
    private string $phan;

    /**
     * Tên bookmark theo w:id.
     *
     * @var array<string, string>
     */
    private array $tenBookmark = [];

    /**
     * Inline đang gom của đoạn hiện tại.
     *
     * @var list<array<string, mixed>>
     */
    private array $inlines = [];

    /**
     * Bookmark nằm giữa các đoạn, chờ gắn vào đầu đoạn kế tiếp.
     *
     * @var list<array<string, mixed>>
     */
    private array $choGan = [];

    public function __construct(private readonly NguCanhDocx $nguCanh)
    {
        $this->phan = $nguCanh->phanTaiLieu;
    }

    /**
     * Các section của w:body: đoạn có w:pPr/w:sectPr khép một section, w:sectPr cuối body là section cuối.
     *
     * @return list<array<string, mixed>>
     */
    public function cacSection(DOMElement $body): array
    {
        $cacSection = [];
        $khoi = [];

        foreach ($this->phangHoa($body) as $phanTu) {
            if ($phanTu->localName === 'sectPr') {
                $cacSection[] = $this->section($khoi, $phanTu);
                $khoi = [];

                continue;
            }

            $this->themKhoi($phanTu, $khoi);
            $sectPr = $phanTu->localName === 'p' ? $this->dd()->conTen($this->dd()->conTen($phanTu, 'pPr'), 'sectPr') : null;

            if ($sectPr !== null) {
                $cacSection[] = $this->section($khoi, $sectPr);
                $khoi = [];
            }
        }

        if ($khoi !== [] || $cacSection === []) {
            $cacSection[] = $this->section($khoi, null);
        }

        return $cacSection;
    }

    /**
     * Khối của một vùng chứa (ô bảng, đầu trang, chân trang).
     *
     * @return list<array<string, mixed>>
     */
    public function cacKhoi(DOMElement $cha): array
    {
        $khoi = [];

        foreach ($this->phangHoa($cha) as $phanTu) {
            if ($phanTu->localName !== 'sectPr') {
                $this->themKhoi($phanTu, $khoi);
            }
        }

        return $khoi;
    }

    /**
     * Gỡ các lớp bao cấp khối (w:sdt, w:customXml, w:ins...) thành dãy phần tử p, tbl, sectPr, bookmark.
     *
     * @return list<DOMElement>
     */
    private function phangHoa(DOMElement $cha): array
    {
        $ketQua = [];

        foreach ($this->dd()->con($cha) as $phanTu) {
            switch ($phanTu->localName) {
                case 'p':
                case 'tbl':
                case 'sectPr':
                case 'bookmarkStart':
                case 'bookmarkEnd':
                    $ketQua[] = $phanTu;
                    break;
                case 'sdt':
                    $noiDung = $this->dd()->conTen($phanTu, 'sdtContent');
                    if ($noiDung !== null) {
                        array_push($ketQua, ...$this->phangHoa($noiDung));
                    }
                    break;
                case 'customXml':
                case 'ins':
                case 'moveTo':
                case 'smartTag':
                    array_push($ketQua, ...$this->phangHoa($phanTu));
                    break;
                case 'AlternateContent':
                    $chon = $this->dd()->conTen($phanTu, 'Choice') ?? $this->dd()->conTen($phanTu, 'Fallback');
                    if ($chon !== null) {
                        array_push($ketQua, ...$this->phangHoa($chon));
                    }
                    break;
            }
        }

        return $ketQua;
    }

    /**
     * @param  list<array<string, mixed>>  $khoi
     */
    private function themKhoi(DOMElement $phanTu, array &$khoi): void
    {
        switch ($phanTu->localName) {
            case 'p':
                $khoi[] = $this->doan($phanTu);
                break;
            case 'tbl':
                $bang = $this->bang($phanTu);
                if ($bang !== null) {
                    $khoi[] = $bang;
                }
                break;
            case 'bookmarkStart':
            case 'bookmarkEnd':
                $danhDau = $this->bookmark($phanTu);
                $cuoi = array_key_last($khoi);

                // Như .NET: điểm cuối bookmark nằm giữa hai khối gắn vào cuối đoạn trước (đoạn cuối của bảng trước),
                // điểm đầu gắn vào đầu đoạn sau.
                if ($danhDau !== null && $phanTu->localName === 'bookmarkEnd' && $cuoi !== null && $this->ganCuoi($khoi[$cuoi], $danhDau)) {
                    break;
                }

                if ($danhDau !== null) {
                    $this->choGan[] = $danhDau;
                }
                break;
        }
    }

    /**
     * Gắn inline vào cuối đoạn cuối cùng của khối (đi sâu vào ô cuối của bảng).
     *
     * @param  array<string, mixed>  $khoi
     * @param  array<string, mixed>  $inline
     */
    private function ganCuoi(array &$khoi, array $inline): bool
    {
        if (isset($khoi['inlines'])) {
            $khoi['inlines'][] = $inline;

            return true;
        }

        $hang = isset($khoi['rows']) ? array_key_last($khoi['rows']) : null;
        $o = $hang === null ? null : array_key_last($khoi['rows'][$hang]['cells']);
        $con = $o === null ? null : array_key_last($khoi['rows'][$hang]['cells'][$o]['blocks']);

        return $con !== null && $this->ganCuoi($khoi['rows'][$hang]['cells'][$o]['blocks'][$con], $inline);
    }

    /**
     * Một đoạn: characterFormat (dấu đoạn), paragraphFormat, inlines.
     *
     * @return array<string, mixed>
     */
    private function doan(DOMElement $p): array
    {
        $pPr = $this->dd()->conTen($p, 'pPr');
        $doan = [];
        $kyTu = $this->dd()->kyTu($this->dd()->conTen($pPr, 'rPr'));

        if ($kyTu !== []) {
            $doan['characterFormat'] = $kyTu;
        }

        $dinhDang = $this->dd()->doan($pPr);
        $dinhDang['styleName'] ??= $this->nguCanh->kieu->tenDoanMacDinh();
        $doan['paragraphFormat'] = DinhDangDocx::sapXep($dinhDang, [
            'leftIndent', 'rightIndent', 'firstLineIndent', 'beforeSpacing', 'afterSpacing', 'lineSpacing',
            'lineSpacingType', 'outlineLevel', 'textAlignment', 'styleName', 'listFormat', 'tabs', 'contextualSpacing', 'bidi',
        ]);

        $inlinesNgoai = $this->inlines;
        $this->inlines = $this->choGan;
        $this->choGan = [];
        $this->noiDungDong($p);
        $doan['inlines'] = $this->inlines;
        $this->inlines = $inlinesNgoai;

        return $doan;
    }

    /**
     * Gom inline từ các phần tử con của đoạn (hoặc lớp bao trong đoạn).
     */
    private function noiDungDong(DOMElement $cha): void
    {
        foreach ($this->dd()->con($cha) as $phanTu) {
            switch ($phanTu->localName) {
                case 'r':
                    $this->run($phanTu);
                    break;
                case 'hyperlink':
                    $this->lienKet($phanTu);
                    break;
                case 'fldSimple':
                    $this->truongDon($phanTu);
                    break;
                case 'bookmarkStart':
                case 'bookmarkEnd':
                    $danhDau = $this->bookmark($phanTu);
                    if ($danhDau !== null) {
                        $this->inlines[] = $danhDau;
                    }
                    break;
                case 'ins':
                case 'moveTo':
                case 'smartTag':
                case 'customXml':
                case 'dir':
                case 'bdo':
                    $this->noiDungDong($phanTu);
                    break;
                case 'sdt':
                    $noiDung = $this->dd()->conTen($phanTu, 'sdtContent');
                    if ($noiDung !== null) {
                        $this->noiDungDong($noiDung);
                    }
                    break;
                case 'AlternateContent':
                    $chon = $this->dd()->conTen($phanTu, 'Choice') ?? $this->dd()->conTen($phanTu, 'Fallback');
                    if ($chon !== null) {
                        $this->noiDungDong($chon);
                    }
                    break;
            }
        }
    }

    /**
     * Một run: mỗi phần tử con thành một inline.
     */
    private function run(DOMElement $r): void
    {
        $kyTu = $this->dd()->kyTu($this->dd()->conTen($r, 'rPr'));

        foreach ($this->dd()->con($r) as $phanTu) {
            switch ($phanTu->localName) {
                case 't':
                case 'instrText':
                    // .NET giữ cả w:t rỗng thành inline chữ rỗng.
                    $this->chu($phanTu->textContent, $kyTu, true);
                    break;
                case 'tab':
                case 'ptab':
                    $this->chu("\t", $kyTu);
                    break;
                case 'br':
                    $this->chu(DonVi::thuocTinh($phanTu, 'type') === 'page' ? "\f" : "\v", $kyTu);
                    break;
                case 'cr':
                    $this->chu("\v", $kyTu);
                    break;
                case 'noBreakHyphen':
                    $this->chu("\u{1E}", $kyTu);
                    break;
                case 'softHyphen':
                    $this->chu("\u{1F}", $kyTu);
                    break;
                case 'footnoteRef':
                case 'endnoteRef':
                    $this->chu("\u{2}", $kyTu);
                    break;
                case 'sym':
                    $this->kyHieu($phanTu, $kyTu);
                    break;
                case 'fldChar':
                    $this->kyTuTruong($phanTu);
                    break;
                case 'drawing':
                    $this->hinhVe($phanTu);
                    break;
                case 'pict':
                case 'object':
                    $this->hinhVml($phanTu);
                    break;
                case 'AlternateContent':
                    // Như .NET: đọc mc:Choice (hình DrawingML), và nếu mc:Fallback cũng là DrawingML thì đọc thêm.
                    $chon = $this->dd()->conTen($phanTu, 'Choice');
                    $duPhong = $this->dd()->conTen($phanTu, 'Fallback');
                    if ($chon !== null) {
                        $this->run($chon);
                    }
                    if ($duPhong !== null && ($chon === null || $this->dd()->conTen($duPhong, 'drawing') !== null)) {
                        $this->run($duPhong);
                    }
                    break;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $kyTu
     */
    private function chu(string $chu, array $kyTu, bool $giuRong = false): void
    {
        if ($chu === '' && ! $giuRong) {
            return;
        }

        $inline = ['text' => $chu];

        if ($kyTu !== []) {
            $inline['characterFormat'] = $kyTu;
        }

        $this->inlines[] = $inline;
    }

    /**
     * w:sym: ký tự của phông ký hiệu (Wingdings, Symbol...) ghi thành chữ với phông đó.
     *
     * @param  array<string, mixed>  $kyTu
     */
    private function kyHieu(DOMElement $sym, array $kyTu): void
    {
        $ma = hexdec((string) DonVi::thuocTinh($sym, 'char'));
        $phong = DonVi::thuocTinh($sym, 'font');

        if ($ma <= 0) {
            return;
        }

        if ($phong !== null && $phong !== '') {
            $kyTu['fontFamily'] = $phong;
            $kyTu = DinhDangDocx::sapXep($kyTu, ['bold', 'italic', 'underline', 'strikethrough', 'baselineAlignment', 'highlightColor', 'fontSize', 'fontFamily']);
        }

        $this->chu(mb_chr($ma, 'UTF-8'), $kyTu);
    }

    /**
     * w:fldChar begin/separate/end. Trường biểu mẫu (w:ffData) kèm formFieldData.
     */
    private function kyTuTruong(DOMElement $fldChar): void
    {
        $loai = DonVi::thuocTinh($fldChar, 'fldCharType');

        if ($loai === 'begin') {
            $batDau = ['hasFieldEnd' => true];
            $bieuMau = $this->duLieuBieuMau($this->dd()->conTen($fldChar, 'ffData'));

            if ($bieuMau !== null) {
                $batDau['formFieldData'] = $bieuMau;
            }

            $batDau['fieldType'] = 0;
            $this->inlines[] = $batDau;
        } elseif ($loai === 'separate') {
            $this->inlines[] = ['fieldType' => 2];
        } elseif ($loai === 'end') {
            $this->inlines[] = ['fieldType' => 1];
        }
    }

    /**
     * w:ffData sang formFieldData (ô nhập chữ, ô đánh dấu, danh sách chọn).
     *
     * @return array<string, mixed>|null
     */
    private function duLieuBieuMau(?DOMElement $ffData): ?array
    {
        if ($ffData === null) {
            return null;
        }

        $giaTri = function (string $ten, string $macDinh = '') use ($ffData): string {
            $con = $this->dd()->conTen($ffData, $ten);

            return $con === null ? $macDinh : (string) ($this->dd()->val($con) ?? $macDinh);
        };

        $ketQua = [
            'name' => $giaTri('name'),
            'enabled' => ($batTat = $this->dd()->conTen($ffData, 'enabled')) === null || DonVi::bat($batTat),
            'helpText' => $giaTri('helpText'),
            'statusText' => $giaTri('statusText'),
        ];

        if (($hop = $this->dd()->conTen($ffData, 'checkBox')) !== null) {
            $coSize = $this->dd()->conTen($hop, 'size');
            $macDinh = $this->dd()->conTen($hop, 'default');
            $daChon = $this->dd()->conTen($hop, 'checked');
            $ketQua['checkBox'] = [
                'sizeType' => $coSize === null ? 'Auto' : 'Exactly',
                'size' => $coSize === null ? 20 : (int) round(DonVi::so($this->dd()->val($coSize)) / 2),
                'defaultValue' => $macDinh !== null && DonVi::bat($macDinh),
                'checked' => $daChon !== null ? DonVi::bat($daChon) : ($macDinh !== null && DonVi::bat($macDinh)),
            ];
        } elseif (($chon = $this->dd()->conTen($ffData, 'ddList')) !== null) {
            $cacMuc = [];
            foreach ($this->dd()->con($chon) as $muc) {
                if ($muc->localName === 'listEntry') {
                    $cacMuc[] = (string) $this->dd()->val($muc);
                }
            }
            $daChon = $this->dd()->conTen($chon, 'result') ?? $this->dd()->conTen($chon, 'default');
            $ketQua['dropDownList'] = ['dropDownItems' => $cacMuc, 'selectedIndex' => $daChon === null ? 0 : (int) $this->dd()->val($daChon)];
        } else {
            $nhap = $this->dd()->conTen($ffData, 'textInput');
            $ketQua['textInput'] = [
                'type' => match (($loai = $this->dd()->conTen($nhap, 'type')) === null ? 'regular' : $this->dd()->val($loai)) {
                    'number' => 'Number',
                    'date', 'currentDate' => 'Date',
                    'currentTime' => 'Time',
                    'calculated' => 'Calculation',
                    default => 'Text',
                },
                'maxLength' => ($dai = $this->dd()->conTen($nhap, 'maxLength')) === null ? 0 : (int) $this->dd()->val($dai),
                'defaultValue' => ($md = $this->dd()->conTen($nhap, 'default')) === null ? '' : (string) $this->dd()->val($md),
                'format' => ($dd = $this->dd()->conTen($nhap, 'format')) === null ? '' : (string) $this->dd()->val($dd),
            ];
        }

        return $ketQua;
    }

    /**
     * w:hyperlink thành trường HYPERLINK: "url" (liên kết ngoài) hoặc \l "bookmark" (liên kết trong).
     */
    private function lienKet(DOMElement $lienKet): void
    {
        $ma = DonVi::thuocTinh($lienKet, 'id');
        $neo = DonVi::thuocTinh($lienKet, 'anchor');
        $dich = $ma === null ? null : ($this->nguCanh->goi->quanHe($this->phan)[$ma]['dich'] ?? null);

        if ($dich === null && $neo === null) {
            $this->noiDungDong($lienKet);

            return;
        }

        $this->inlines[] = ['hasFieldEnd' => true, 'fieldType' => 0];
        $this->inlines[] = ['text' => $dich !== null ? 'HYPERLINK "'.$dich.($neo !== null ? '#'.$neo : '').'" ' : 'HYPERLINK \\l "'.$neo.'"'];
        $this->inlines[] = ['fieldType' => 2];
        $this->noiDungDong($lienKet);
        $this->inlines[] = ['fieldType' => 1];
    }

    /**
     * w:fldSimple: mã trường là chữ, nội dung là kết quả.
     */
    private function truongDon(DOMElement $truong): void
    {
        $this->inlines[] = ['hasFieldEnd' => true, 'fieldType' => 0];
        $this->chu((string) DonVi::thuocTinh($truong, 'instr'), []);
        $this->inlines[] = ['fieldType' => 2];
        $this->noiDungDong($truong);
        $this->inlines[] = ['fieldType' => 1];
    }

    /**
     * w:bookmarkStart/w:bookmarkEnd thành inline bookmarkType 0/1.
     *
     * @return array<string, mixed>|null
     */
    private function bookmark(DOMElement $phanTu): ?array
    {
        $ma = (string) DonVi::thuocTinh($phanTu, 'id');

        if ($phanTu->localName === 'bookmarkStart') {
            // Tên bookmark của Word không có dấu "-", .NET đổi thành "_".
            $ten = str_replace('-', '_', (string) DonVi::thuocTinh($phanTu, 'name'));
            $this->tenBookmark[$ma] = $ten;

            return ['name' => $ten, 'bookmarkType' => 0];
        }

        $ten = $this->tenBookmark[$ma] ?? null;

        return $ten === null ? null : ['name' => $ten, 'bookmarkType' => 1];
    }

    /**
     * w:drawing: ảnh DrawingML (wp:inline hoặc wp:anchor). Hình vẽ không phải ảnh bị bỏ.
     */
    private function hinhVe(DOMElement $drawing): void
    {
        foreach ($this->dd()->con($drawing) as $khung) {
            if ($khung->localName !== 'inline' && $khung->localName !== 'anchor') {
                continue;
            }

            $kichThuoc = $this->dd()->conTen($khung, 'extent');
            $duLieu = $this->dd()->conTen($this->dd()->conTen($khung, 'graphic'), 'graphicData');

            if ($kichThuoc === null || $duLieu === null) {
                continue;
            }

            // Ảnh (pic:pic) ngay trong graphicData; hình trong nhóm (wpg), biểu đồ, SmartArt bị bỏ như .NET.
            $hinh = $this->dd()->conTen($duLieu, 'pic');
            $blip = $hinh?->getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'blip')->item(0);

            if ($blip instanceof DOMElement) {
                $this->anh(
                    DonVi::thuocTinh($blip, 'embed') ?? DonVi::thuocTinh($blip, 'link'),
                    DonVi::emu(DonVi::thuocTinh($kichThuoc, 'cx')),
                    DonVi::emu(DonVi::thuocTinh($kichThuoc, 'cy')),
                    $khung->localName === 'inline',
                );
            } elseif ($khung->localName === 'anchor' && ($wsp = $this->dd()->conTen($duLieu, 'wsp')) !== null) {
                $this->hinhKhoi($khung, $kichThuoc, $wsp);
            }
        }
    }

    /**
     * Hình vẽ nổi (wps:wsp) thành inline hình của SFDT. Bám theo những hình .NET giữ lại: đường nối thẳng
     * (straightConnector1) và khung chữ nhật/hộp chữ trong thân văn bản; đường kẻ (line), hình tự do và hộp chữ ở
     * đầu/chân trang bị bỏ.
     */
    private function hinhKhoi(DOMElement $khung, DOMElement $kichThuoc, DOMElement $wsp): void
    {
        $spPr = $this->dd()->conTen($wsp, 'spPr');
        $dang = $this->dd()->conTen($spPr, 'prstGeom');
        $loai = $dang === null ? null : (self::LOAI_HINH[(string) DonVi::thuocTinh($dang, 'prst')] ?? null);

        if ($loai === null || ($loai === 'Rectangle' && $this->phan !== $this->nguCanh->phanTaiLieu)) {
            return;
        }

        $nhan = $this->dd()->conTen($khung, 'docPr');
        $vien = $this->dd()->conTen($spPr, 'ln');
        $mauVien = $vien?->getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 'srgbClr')->item(0);
        $kieuNet = $this->dd()->conTen($vien, 'prstDash');
        $ngang = $this->dd()->conTen($khung, 'positionH');
        $doc = $this->dd()->conTen($khung, 'positionV');
        $hop = $this->dd()->conTen($wsp, 'txbx');
        $than = $this->dd()->conTen($wsp, 'bodyPr');
        $leMacDinh = $hop === null ? [7.087, 3.685] : [7.2, 3.6];
        $le = fn (string $ten, float $macDinh): float => ($giaTri = DonVi::thuocTinh($than ?? $wsp, $ten)) === null ? $macDinh : DonVi::so($giaTri) / 12700;
        $noiDung = $this->dd()->conTen($hop, 'txbxContent');

        $this->inlines[] = [
            'shapeId' => (int) DonVi::thuocTinh($nhan ?? $khung, 'id'),
            'name' => (string) DonVi::thuocTinh($nhan ?? $khung, 'name'),
            'alternativeText' => DonVi::thuocTinh($nhan ?? $khung, 'descr'),
            'title' => DonVi::thuocTinh($nhan ?? $khung, 'title'),
            'visible' => ! in_array(DonVi::thuocTinh($nhan ?? $khung, 'hidden'), ['1', 'true'], true),
            'width' => DonVi::so(DonVi::thuocTinh($kichThuoc, 'cx')) / 12700,
            'height' => DonVi::so(DonVi::thuocTinh($kichThuoc, 'cy')) / 12700,
            'widthScale' => 100.0,
            'heightScale' => 100.0,
            'lineFormat' => [
                'lineFormatType' => $this->dd()->conTen($vien, 'noFill') !== null ? 'None' : 'Solid',
                'color' => $mauVien instanceof DOMElement ? (DonVi::mau(DonVi::thuocTinh($mauVien, 'val')) ?? '#000000FF') : '#000000FF',
                'weight' => ($rong = DonVi::thuocTinh($vien ?? $wsp, 'w')) === null ? 0.75 : DonVi::so($rong) / 12700,
                'lineStyle' => match ($kieuNet === null ? 'solid' : $this->dd()->val($kieuNet)) {
                    'dash', 'sysDash', 'lgDash' => 'Dash',
                    'dot', 'sysDot' => 'Dot',
                    'dashDot', 'sysDashDot', 'lgDashDot' => 'DashDot',
                    default => 'Solid',
                },
            ],
            'verticalPosition' => $this->viTri($doc),
            'verticalOrigin' => self::GOC_VI_TRI[(string) ($doc === null ? 'paragraph' : DonVi::thuocTinh($doc, 'relativeFrom'))] ?? 'Paragraph',
            'verticalAlignment' => $this->canhViTri($doc),
            'horizontalPosition' => $this->viTri($ngang),
            'horizontalOrigin' => self::GOC_VI_TRI[(string) ($ngang === null ? 'column' : DonVi::thuocTinh($ngang, 'relativeFrom'))] ?? 'Column',
            'horizontalAlignment' => $this->canhViTri($ngang),
            'zOrderPosition' => (int) DonVi::thuocTinh($khung, 'relativeHeight'),
            'allowOverlap' => in_array(DonVi::thuocTinh($khung, 'allowOverlap'), ['1', 'true'], true),
            'layoutInCell' => in_array(DonVi::thuocTinh($khung, 'layoutInCell'), ['1', 'true'], true),
            'lockAnchor' => in_array(DonVi::thuocTinh($khung, 'locked'), ['1', 'true'], true),
            'autoShapeType' => $loai,
            'textFrame' => [
                'textVerticalAlignment' => match (DonVi::thuocTinh($than ?? $wsp, 'anchor')) {
                    'ctr' => 'Middle',
                    'b' => 'Bottom',
                    default => 'Top',
                },
                'leftMargin' => $le('lIns', $leMacDinh[0]),
                'rightMargin' => $le('rIns', $leMacDinh[0]),
                'topMargin' => $le('tIns', $leMacDinh[1]),
                'bottomMargin' => $le('bIns', $leMacDinh[1]),
                'blocks' => $noiDung === null ? [] : $this->cacKhoi($noiDung),
            ],
        ];
    }

    private function viTri(?DOMElement $viTri): float
    {
        $lech = $this->dd()->conTen($viTri, 'posOffset');

        return $lech === null ? 0.0 : DonVi::so($lech->textContent) / 12700;
    }

    private function canhViTri(?DOMElement $viTri): string
    {
        $canh = $this->dd()->conTen($viTri, 'align');

        return $canh === null ? 'None' : ucfirst(trim($canh->textContent));
    }

    /**
     * w:pict, w:object: ảnh VML (v:imagedata) với kích thước lấy từ style của v:shape.
     */
    private function hinhVml(DOMElement $pict): void
    {
        $duLieu = $pict->getElementsByTagNameNS('urn:schemas-microsoft-com:vml', 'imagedata')->item(0);

        if (! $duLieu instanceof DOMElement) {
            return;
        }

        $hinh = $duLieu->parentNode;
        $kieu = $hinh instanceof DOMElement ? $hinh->getAttribute('style') : '';
        preg_match('/(?:^|;)\s*width\s*:\s*([^;]+)/i', $kieu, $rong);
        preg_match('/(?:^|;)\s*height\s*:\s*([^;]+)/i', $kieu, $cao);
        $ma = $duLieu->getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?: null;

        // Ảnh VML đặt tuyệt đối (hình mờ của đầu trang...) .NET bỏ qua.
        if (preg_match('/position\s*:\s*absolute/i', $kieu)) {
            return;
        }

        $this->anh(
            $ma,
            DonVi::f32(DonVi::so(trim($rong[1] ?? '0')) / 20),
            DonVi::f32(DonVi::so(trim($cao[1] ?? '0')) / 20),
            true,
        );
    }

    /**
     * Inline ảnh: PNG, JPEG, GIF, BMP nhúng base64. Ảnh liên kết ngoài hoặc định dạng trình duyệt không vẽ được bị bỏ.
     */
    private function anh(?string $ma, float $rong, float $cao, bool $trongDong): void
    {
        $quanHe = $ma === null ? null : ($this->nguCanh->goi->quanHe($this->phan)[$ma] ?? null);

        if ($quanHe === null || $quanHe['ngoai']) {
            return;
        }

        $duLieu = $this->nguCanh->goi->nhiPhan($quanHe['dich']);
        $loai = $duLieu === null ? null : self::loaiAnh($duLieu);

        if ($loai === null) {
            return;
        }

        $this->inlines[] = [
            'imageString' => 'data:'.$loai.';base64,'.base64_encode($duLieu),
            'length' => 1,
            'width' => $rong,
            'height' => $cao,
            'isInlineImage' => $trongDong,
            'isMetaFile' => false,
        ];
    }

    /**
     * Kiểu MIME của ảnh theo chữ ký đầu file.
     */
    public static function loaiAnh(string $duLieu): ?string
    {
        return match (true) {
            str_starts_with($duLieu, "\x89PNG") => 'image/png',
            str_starts_with($duLieu, "\xFF\xD8") => 'image/jpeg',
            str_starts_with($duLieu, 'GIF8') => 'image/gif',
            str_starts_with($duLieu, 'BM') => 'image/bmp',
            default => null,
        };
    }

    /**
     * Bảng: tableFormat, rows (rowFormat, cells); ô gộp dọc (w:vMerge) chỉ giữ ô đầu với rowSpan.
     *
     * @return array<string, mixed>|null
     */
    private function bang(DOMElement $tbl): ?array
    {
        $bang = new BangDocx($this->nguCanh, $tbl, $this->cacKhoi(...), $this->bookmark(...));

        return $bang->dung();
    }

    /**
     * Một section: blocks, headersFooters, sectionFormat.
     *
     * @param  list<array<string, mixed>>  $khoi
     * @return array<string, mixed>
     */
    private function section(array $khoi, ?DOMElement $sectPr): array
    {
        if ($this->choGan !== []) {
            $khoi[] = ['paragraphFormat' => ['styleName' => $this->nguCanh->kieu->tenDoanMacDinh()], 'inlines' => $this->choGan];
            $this->choGan = [];
        }

        $phanCu = $this->phan;
        $dauChan = [];

        foreach ([
            ['headerReference', 'default', 'header'], ['footerReference', 'default', 'footer'],
            ['headerReference', 'even', 'evenHeader'], ['footerReference', 'even', 'evenFooter'],
            ['headerReference', 'first', 'firstPageHeader'], ['footerReference', 'first', 'firstPageFooter'],
        ] as [$the, $loai, $khoa]) {
            foreach ($sectPr === null ? [] : $this->dd()->con($sectPr) as $thamChieu) {
                if ($thamChieu->localName !== $the || (DonVi::thuocTinh($thamChieu, 'type') ?? 'default') !== $loai) {
                    continue;
                }

                $quanHe = $this->nguCanh->goi->quanHe($phanCu)[(string) DonVi::thuocTinh($thamChieu, 'id')] ?? null;
                $xml = $quanHe === null || $quanHe['ngoai'] ? null : $this->nguCanh->goi->xml($quanHe['dich']);

                if ($xml !== null) {
                    $this->phan = $quanHe['dich'];
                    $dauChan[$khoa] = ['blocks' => $this->cacKhoi($xml->documentElement)];
                    $this->phan = $phanCu;
                }

                break;
            }
        }

        return [
            'blocks' => $khoi,
            'headersFooters' => $dauChan,
            'sectionFormat' => $this->dinhDangSection($sectPr),
        ];
    }

    /**
     * w:sectPr sang sectionFormat. Thiếu w:pgSz, w:pgMar thì dùng khổ Letter và lề 1 inch như Word.
     *
     * @return array<string, mixed>
     */
    private function dinhDangSection(?DOMElement $sectPr): array
    {
        $kho = $this->dd()->conTen($sectPr, 'pgSz');
        $le = $this->dd()->conTen($sectPr, 'pgMar');
        $soTrang = $this->dd()->conTen($sectPr, 'pgNumType');
        $batDau = $soTrang === null ? null : DonVi::thuocTinh($soTrang, 'start');
        $chanLe = $this->nguCanh->caiDat('evenAndOddHeaders');
        $leThuoc = fn (string $ten, float $macDinh): float => $le === null || DonVi::thuocTinh($le, $ten) === null
            ? $macDinh
            : DonVi::twip(DonVi::thuocTinh($le, $ten));

        return [
            'headerDistance' => $leThuoc('header', 36.0),
            'footerDistance' => $leThuoc('footer', 36.0),
            'pageWidth' => $kho === null ? 612.0 : DonVi::twip(DonVi::thuocTinh($kho, 'w') ?? 12240),
            'pageHeight' => $kho === null ? 792.0 : DonVi::twip(DonVi::thuocTinh($kho, 'h') ?? 15840),
            'leftMargin' => $leThuoc('left', 72.0),
            'rightMargin' => $leThuoc('right', 72.0),
            'topMargin' => abs($leThuoc('top', 72.0)),
            'bottomMargin' => abs($leThuoc('bottom', 72.0)),
            'differentFirstPage' => ($trangDau = $this->dd()->conTen($sectPr, 'titlePg')) !== null && DonVi::bat($trangDau),
            'differentOddAndEvenPages' => $chanLe !== null && DonVi::bat($chanLe),
            'bidi' => ($phai = $this->dd()->conTen($sectPr, 'bidi')) !== null && DonVi::bat($phai),
            'restartPageNumbering' => $batDau !== null,
            'pageStartingNumber' => $batDau === null ? 0 : (int) $batDau,
        ];
    }

    private function dd(): DinhDangDocx
    {
        return $this->nguCanh->dinhDang;
    }
}
