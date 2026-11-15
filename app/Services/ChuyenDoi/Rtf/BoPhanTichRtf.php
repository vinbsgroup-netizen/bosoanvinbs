<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Đọc RTF (TX Text Control, Word, Syncfusion DocIO...) thành cây SFDT.
 *
 * Đọc tuần tự từng từ điều khiển, nhóm { } giữ trạng thái (đích, định dạng ký tự, định dạng đoạn, \uc) trên chồng.
 * Nhóm đích lạ có \* và các nhóm không hiển thị được bỏ qua nguyên khối (kể cả dữ liệu \binN).
 */
final class BoPhanTichRtf
{
    /**
     * Một mẩu RTF: 1 từ điều khiển, 2 tham số, 3 \'xx, 4 ký hiệu điều khiển, 5 {, 6 }, 7 chữ.
     */
    private const MAU_MAU = '/\G(?:\\\\([a-zA-Z]{1,32})(-?\d{1,10})?[ ]?|\\\\\'([0-9a-fA-F]{2})|\\\\([^a-zA-Z\'])|(\{)|(\})|([^\\\\{}\r\n]+)|[\r\n]+|\\\\\'?)/';

    /**
     * Đích có \* mà bộ đọc hiểu; các đích \* khác bỏ qua.
     *
     * @var array<string, true>
     */
    private const DICH_SAO_HIEU = [
        'fldinst' => true, 'shppict' => true, 'nesttableprops' => true, 'listtable' => true, 'listoverridetable' => true,
        'bkmkstart' => true, 'bkmkend' => true, 'formfield' => true, 'ffname' => true, 'ffdeftext' => true, 'ffformat' => true,
        'ffhelptext' => true, 'ffstattext' => true, 'ffl' => true, 'ud' => true, 'shpinst' => true, 'cs' => true, 'ts' => true,
        'ds' => true, 'defpap' => true,
    ];

    /**
     * Nhóm không có nội dung hiển thị (hoặc là bản thay thế cho bộ đọc cũ): bỏ qua cả nhóm.
     *
     * @var array<string, true>
     */
    private const DICH_BO_QUA = [
        'info' => true, 'pntext' => true, 'listtext' => true, 'nonshppict' => true, 'shprslt' => true, 'nonesttables' => true,
        'xe' => true, 'tc' => true, 'tcn' => true, 'footnote' => true, 'annotation' => true, 'atnid' => true, 'atnauthor' => true,
        'atntime' => true, 'atnref' => true, 'atndate' => true, 'atnicn' => true, 'ftnsep' => true, 'ftnsepc' => true,
        'ftncn' => true, 'aftnsep' => true, 'aftnsepc' => true, 'aftncn' => true, 'filetbl' => true, 'revtbl' => true,
        'template' => true, 'author' => true, 'operator' => true, 'title' => true, 'subject' => true, 'doccomm' => true,
        'comment' => true, 'keywords' => true, 'company' => true, 'manager' => true, 'category' => true, 'creatim' => true,
        'revtim' => true, 'printim' => true, 'buptim' => true, 'objdata' => true, 'objclass' => true, 'objname' => true,
        'levelnumbers' => true, 'pn' => true, 'pnseclvl' => true, 'shptxt' => true, 'lfolevel' => true, 'listname' => true,
        'picprop' => true, 'falt' => true, 'panose' => true, 'datafield' => true, 'docvar' => true, 'userprops' => true,
        'hlinkbase' => true, 'nextfile' => true,
    ];

    /**
     * Ký tự đặc biệt dạng từ điều khiển.
     *
     * @var array<string, string>
     */
    private const KY_TU_DAC_BIET = [
        'emdash' => "\u{2014}", 'endash' => "\u{2013}", 'bullet' => "\u{2022}", 'lquote' => "\u{2018}", 'rquote' => "\u{2019}", 'ldblquote' => "\u{201C}", 'rdblquote' => "\u{201D}",
        'zwj' => "\u{200D}", 'zwnj' => "\u{200C}", 'zwbo' => "\u{200B}",
    ];

    /**
     * Kiểu gạch chân RTF sang SFDT.
     *
     * @var array<string, string>
     */
    private const GACH_CHAN = [
        'ul' => 'Single', 'uld' => 'Dotted', 'uldash' => 'Dash', 'uldashd' => 'DotDash', 'uldashdd' => 'DotDotDash',
        'uldb' => 'Double', 'ulhwave' => 'WavyHeavy', 'ulldash' => 'DashLong', 'ulth' => 'Thick', 'ulthd' => 'DottedHeavy',
        'ulthdash' => 'DashHeavy', 'ulthdashd' => 'DotDashHeavy', 'ulthdashdd' => 'DotDotDashHeavy', 'ulthldash' => 'DashLongHeavy',
        'ululdbwave' => 'WavyDouble', 'ulw' => 'Words', 'ulwave' => 'Wavy',
    ];

    /**
     * Đầu/chân trang RTF sang khóa headersFooters của SFDT.
     *
     * @var array<string, string>
     */
    private const DAU_CHAN = [
        'header' => 'header', 'headerr' => 'header', 'headerl' => 'evenHeader', 'headerf' => 'firstPageHeader',
        'footer' => 'footer', 'footerr' => 'footer', 'footerl' => 'evenFooter', 'footerf' => 'firstPageFooter',
    ];

    private string $rtf;

    private int $doDai;

    private int $viTri = 0;

    private TaiNguyenRtf $tn;

    private TaiLieuSfdt $tl;

    private DanhSachRtf $ds;

    /**
     * Trạng thái nhóm hiện tại: dich, nhom, uc, kt, pd và vài cờ.
     *
     * @var array<string, mixed>
     */
    private array $st;

    /**
     * @var list<array<string, mixed>>
     */
    private array $ngan = [];

    /**
     * Trạng thái nhóm gốc {\rtf1 ...} lúc đóng: định dạng của đoạn cuối chưa có \par.
     *
     * @var array<string, mixed>|null
     */
    private ?array $stGoc = null;

    /**
     * Gặp \* : từ điều khiển kế tiếp quyết định có bỏ cả nhóm hay không.
     */
    private bool $sao = false;

    /**
     * Số ký tự thay thế còn phải bỏ sau \uN.
     */
    private int $boQuaSauU = 0;

    /**
     * Nửa đầu cặp surrogate của \uN đang chờ nửa sau.
     */
    private ?int $surrogateCao = null;

    /**
     * Byte chữ chờ giải mã theo bảng mã của phông hiện tại.
     */
    private string $byteCho = '';

    /**
     * RTF chứa UTF-8 thô (phần mềm khách ghép chữ thẳng vào mẫu): byte cao ngoài \'xx đọc theo UTF-8.
     */
    private bool $utf8Tho = false;

    /**
     * Thuộc tính tài liệu (\paperw, \margl, \facingp, \deftab...).
     *
     * @var array<string, mixed>
     */
    private array $taiLieu = ['facingp' => false, 'deftab' => 720];

    /**
     * Thuộc tính section hiện tại (\pgwsxn, \titlepg...); null là lấy theo tài liệu.
     *
     * @var array<string, mixed>
     */
    private array $phan;

    /**
     * Định dạng đoạn mặc định của tài liệu ({\*\defpap ...}), chỉ thuộc tính được khai báo.
     *
     * @var array<string, mixed>
     */
    private array $doanTaiLieu = [];

    /**
     * Định nghĩa hàng hiện hành theo độ sâu bảng.
     *
     * @var array<int, array<string, mixed>>
     */
    private array $dinhNghiaHang = [];

    private int $doSauDinhNghia = 1;

    /**
     * Viền đang nhận \brdr*: [nơi, cạnh] với nơi là hang, o hoặc doan (bỏ qua).
     *
     * @var array{string, string}|null
     */
    private ?array $vienDangDat = null;

    /**
     * Tab dừng đang khai báo (\tqr, \tldot ... trước \tx).
     *
     * @var array{string, string}
     */
    private array $tabCho = ['Left', 'None'];

    /**
     * @var array{id: ?int, cp: ?int, ten: string, xong: bool}|null
     */
    private ?array $phongDangDoc = null;

    /**
     * @var array{r: ?int, g: ?int, b: ?int}
     */
    private array $mauDangDoc = ['r' => null, 'g' => null, 'b' => null];

    /**
     * @var array{loai: string, id: int, dua: ?int, tiep: ?int, ten: string}
     */
    private array $kieuDangDoc = ['loai' => 'Paragraph', 'id' => 0, 'dua' => null, 'tiep' => null, 'ten' => ''];

    /**
     * @var array{id: ?int, muc: list<array<string, mixed>>}|null
     */
    private ?array $danhSachDangDoc = null;

    /**
     * @var array{listId: ?int, ls: ?int}
     */
    private array $ghiDeDangDoc = ['listId' => null, 'ls' => null];

    /**
     * Chồng trường đang mở.
     *
     * @var list<array<string, mixed>>
     */
    private array $truong = [];

    /**
     * Dữ liệu trường biểu mẫu đang đọc ({\*\formfield ...}).
     *
     * @var array<string, mixed>
     */
    private array $bieuMau = [];

    /**
     * Chữ thu cho đích dạng tên (dấu trang, tên thuộc tính hình, tên trường biểu mẫu).
     */
    private string $tenDem = '';

    /**
     * Tên thuộc tính hình (\sn) gần nhất.
     */
    private string $thuocTinhHinh = '';

    /**
     * Ảnh đang đọc ({\pict ...}).
     *
     * @var array<string, mixed>
     */
    private array $anh = [];

    public function __construct(string $rtf)
    {
        $this->rtf = $rtf;
        $this->doDai = strlen($rtf);
        $this->utf8Tho = preg_match('/[\x80-\xFF]/', $rtf) === 1 && mb_check_encoding($rtf, 'UTF-8');
        $this->tn = new TaiNguyenRtf;
        $this->tl = new TaiLieuSfdt($this->tn);
        $this->ds = new DanhSachRtf;
        $this->phan = self::phanMacDinh();
        $this->st = [
            'dich' => 'noi_dung', 'nhom' => null, 'uc' => 1, 'kt' => $this->tn->kyTuMacDinh(), 'pd' => TaiNguyenRtf::doanMacDinh(),
            'hinh' => false, 'bangLong' => false,
        ];
    }

    /**
     * Đọc hết RTF và trả tài liệu SFDT dạng mảng.
     *
     * @return array<string, mixed>
     */
    public function phanTich(): array
    {
        $this->doc();

        while ($this->ngan !== []) {
            $this->dongNhom();
        }

        $this->xaByteCho();
        $cuoi = $this->stGoc ?? $this->st;
        $pd = $cuoi['pd'] + TaiNguyenRtf::doanMacDinh();
        $kt = $cuoi['kt'] + $this->tn->kyTuMacDinh();
        $sections = $this->tl->ketQua(
            $this->dinhDangPhan(),
            $this->tn->doan($pd, $this->danhSachCuaDoan($pd)),
            $this->tn->kyTuDauDoan($kt),
        );

        $sfdt = ['sections' => $sections, 'paragraphFormat' => $this->doanMacDinhTaiLieu()];

        if ($this->ds->coDanhSach()) {
            $sfdt += $this->ds->sfdt($this->tn);
        }

        return $sfdt + [
            'background' => ['color' => '#FFFFFFFF'],
            'styles' => $this->tn->dsKieu(),
            'defaultTabWidth' => TaiNguyenRtf::diem(max(1, (int) $this->taiLieu['deftab'])),
            'formatting' => false,
            'trackChanges' => false,
            'protectionType' => 'NoProtection',
            'enforcement' => false,
            'dontUseHTMLParagraphAutoSpacing' => true,
        ];
    }

    /**
     * Lấy chữ thuần từ RTF (dùng khi không đọc được cấu trúc): bỏ nhóm \*, từ điều khiển, giữ xuống dòng ở \par.
     */
    public static function chuThuan(string $rtf): string
    {
        $chu = preg_replace('/\{\\\\\*[^{}]*\}/', '', $rtf) ?? '';
        $chu = preg_replace('/\\\\(par|line|row)\b ?/', "\n", $chu) ?? '';
        $chu = preg_replace('/\\\\(cell|tab)\b ?/', "\t", $chu) ?? '';
        $chu = preg_replace_callback('/\\\\u(-?\d+) ?\??/', fn (array $m): string => GiaiMa::kyTu((int) $m[1]), $chu) ?? '';
        $chu = preg_replace_callback("/\\\\'([0-9a-fA-F]{2})/", fn (array $m): string => GiaiMa::sangUtf8(chr((int) hexdec($m[1])), 1252), $chu) ?? '';
        $chu = preg_replace('/\\\\[a-zA-Z]+-?\d* ?|[{}]|\\\\./', '', $chu) ?? '';

        return mb_scrub($chu, 'UTF-8');
    }

    /**
     * paragraphFormat mức tài liệu: lấy từ {\*\defpap ...}, không có thì theo kiểu Normal (\s0), như .NET.
     *
     * @return array<string, mixed>
     */
    private function doanMacDinhTaiLieu(): array
    {
        $pd = $this->doanTaiLieu !== [] ? $this->doanTaiLieu : ($this->tn->kieu[0]['pd'] ?? []);
        $dd = ['leftIndent' => TaiNguyenRtf::diem($pd['li'] ?? 0), 'rightIndent' => TaiNguyenRtf::diem($pd['ri'] ?? 0)];

        if (isset($pd['sb'])) {
            $dd['beforeSpacing'] = TaiNguyenRtf::diem($pd['sb']);
        }

        if (isset($pd['sa'])) {
            $dd['afterSpacing'] = TaiNguyenRtf::diem($pd['sa']);
        }

        if (! empty($pd['sl'])) {
            [$dd['lineSpacing'], $dd['lineSpacingType']] = TaiNguyenRtf::gianDong((int) $pd['sl'], (int) ($pd['slm'] ?? 0));
        }

        return $dd + ['textAlignment' => $pd['q'] ?? 'Left', 'bidi' => false];
    }

    /**
     * @return array<string, mixed>
     */
    private static function phanMacDinh(): array
    {
        return [
            'pgw' => null, 'pgh' => null, 'ml' => null, 'mr' => null, 'mt' => null, 'mb' => null, 'hy' => null, 'fy' => null,
            'titlepg' => false, 'pgnrestart' => false, 'pgnstarts' => null, 'ngang' => false,
        ];
    }

    /**
     * Vòng đọc chính.
     */
    private function doc(): void
    {
        $rtf = $this->rtf;

        while ($this->viTri < $this->doDai) {
            if (! preg_match(self::MAU_MAU, $rtf, $m, 0, $this->viTri)) {
                $this->viTri++;

                continue;
            }

            $this->viTri += strlen($m[0]);

            if (isset($m[7]) && $m[7] !== '') {
                $this->chu($m[7]);
            } elseif (isset($m[1]) && $m[1] !== '') {
                $this->tu($m[1], ($m[2] ?? '') === '' ? null : (int) $m[2]);
            } elseif (isset($m[5]) && $m[5] !== '') {
                $this->moNhom();
            } elseif (isset($m[6]) && $m[6] !== '') {
                $this->dongNhom();
            } elseif (isset($m[3]) && $m[3] !== '') {
                $this->hex((int) hexdec($m[3]));
            } elseif (isset($m[4]) && $m[4] !== '') {
                $this->kyHieu($m[4]);
            }
        }
    }

    private function moNhom(): void
    {
        $this->xaByteCho();
        $this->boQuaSauU = 0;
        $this->sao = false;
        $this->ngan[] = $this->st;
        $this->st['nhom'] = null;
        $laBangPhong = ! empty($this->st['bangPhong']);
        $this->st['bangPhong'] = false;

        switch ($this->st['dich']) {
            case 'stylesheet':
                $this->st['dich'] = 'kieu';
                $this->st['nhom'] = 'kieu';
                $this->st['kt'] = [];
                $this->st['pd'] = [];
                $this->kieuDangDoc = ['loai' => 'Paragraph', 'id' => 0, 'dua' => null, 'tiep' => null, 'ten' => ''];
                break;
            case 'fonttbl':
                // Chỉ nhóm con trực tiếp của \fonttbl là một phông; nhóm sâu hơn ({\*\panose}, {\*\falt}) thuộc phông đó.
                if ($laBangPhong) {
                    $this->st['nhom'] = 'phong';
                    $this->phongDangDoc = ['id' => null, 'cp' => null, 'ten' => '', 'xong' => false];
                }
                break;
        }
    }

    private function dongNhom(): void
    {
        $this->xaByteCho();
        $this->boQuaSauU = 0;
        $this->sao = false;

        if ($this->ngan === []) {
            return;
        }

        $cu = $this->st;
        $this->st = array_pop($this->ngan);

        if ($cu['nhom'] !== null) {
            $this->ketThucNhom($cu['nhom'], $cu);
        }

        if ($this->ngan === [] && $cu['dich'] === 'noi_dung') {
            $this->stGoc = $cu;
        }
    }

    /**
     * Bỏ phần còn lại của nhóm hiện tại (tới dấu } khớp), không xử lý gì bên trong.
     */
    private function boQuaNhom(): void
    {
        $rtf = $this->rtf;
        $i = $this->viTri;
        $doSau = 1;

        while ($i < $this->doDai) {
            $i += strcspn($rtf, '\\{}', $i);

            if ($i >= $this->doDai) {
                break;
            }

            $kyTu = $rtf[$i];

            if ($kyTu === '\\') {
                if (preg_match('/\Gbin(\d{1,10}) ?/', $rtf, $m, 0, $i + 1)) {
                    $i += 1 + strlen($m[0]) + (int) $m[1];
                } else {
                    $i += 2;
                }
            } elseif ($kyTu === '{') {
                $doSau++;
                $i++;
            } else {
                $i++;

                if (--$doSau === 0) {
                    break;
                }
            }
        }

        $this->viTri = min($i, $this->doDai);
        $this->sao = false;
        $this->boQuaSauU = 0;

        if ($this->ngan !== []) {
            $this->st = array_pop($this->ngan);
        }
    }

    /**
     * Chữ thường (không qua \'xx).
     */
    private function chu(string $chu): void
    {
        $this->sao = false;

        if ($this->boQuaSauU > 0) {
            $boDi = $this->utf8Tho ? mb_substr($chu, 0, $this->boQuaSauU, 'UTF-8') : substr($chu, 0, $this->boQuaSauU);
            $this->boQuaSauU -= $this->utf8Tho ? mb_strlen($boDi, 'UTF-8') : strlen($boDi);
            $chu = (string) substr($chu, strlen($boDi));

            if ($chu === '') {
                return;
            }
        }

        switch ($this->st['dich']) {
            case 'pict':
                $this->anh['hex'] .= $chu;

                return;
            case 'leveltext':
                $this->xaByteCho();
                $this->ds->mucDangDoc['text'][] = ['c', $chu];

                return;
            case 'bo_qua':
            case 'shpinst':
            case 'upr':
                return;
        }

        if ($this->utf8Tho && preg_match('/[\x80-\xFF]/', $chu)) {
            $this->xaByteCho();
            $this->xuatChu(mb_scrub($chu, 'UTF-8'));

            return;
        }

        $this->byteCho .= $chu;
    }

    /**
     * Byte \'xx.
     */
    private function hex(int $byte): void
    {
        $this->sao = false;

        if ($this->boQuaSauU > 0) {
            $this->boQuaSauU--;

            return;
        }

        if ($this->st['dich'] === 'leveltext') {
            $this->ds->mucDangDoc['text'][] = ['b', $byte];

            return;
        }

        if ($this->st['dich'] === 'pict') {
            $this->anh['hex'] .= sprintf('%02x', $byte);

            return;
        }

        $this->byteCho .= chr($byte);
    }

    /**
     * Giải mã byte đang chờ và đưa vào đích hiện tại.
     */
    private function xaByteCho(): void
    {
        if ($this->byteCho === '') {
            return;
        }

        $byte = $this->byteCho;
        $this->byteCho = '';
        $maTrang = match ($this->st['dich']) {
            'fonttbl' => $this->phongDangDoc['cp'] ?? $this->tn->maTrang,
            default => $this->tn->maTrangCuaPhong($this->st['kt']['f'] ?? null),
        };
        $this->xuatChu(GiaiMa::sangUtf8($byte, $maTrang));
    }

    /**
     * Đưa chữ (UTF-8) vào đích hiện tại.
     */
    private function xuatChu(string $chu, bool $rieng = false): void
    {
        switch ($this->st['dich']) {
            case 'noi_dung':
                if (! empty($this->st['kt']['v'])) {
                    return;
                }

                $chu = preg_replace('/[\x00-\x08\x0E-\x1F\x7F]/', '', $chu) ?? '';
                $this->tl->themChu($chu, $this->st['kt'], $rieng);

                return;
            case 'fldinst':
                $chiSo = count($this->truong) - 1;

                if ($chiSo >= 0 && ! $this->truong[$chiSo]['daMo']) {
                    $this->truong[$chiSo]['lenh'] .= $chu;
                } elseif ($chiSo >= 0) {
                    $this->tl->themChu($chu, $this->st['kt'], $rieng);
                }

                return;
            case 'fonttbl':
                $this->themTenPhong($chu);

                return;
            case 'colortbl':
                $soDau = substr_count($chu, ';');

                for ($k = 0; $k < $soDau; $k++) {
                    $m = $this->mauDangDoc;
                    $this->tn->mau[] = $m['r'] === null && $m['g'] === null && $m['b'] === null ? null : [(int) $m['r'], (int) $m['g'], (int) $m['b']];
                    $this->mauDangDoc = ['r' => null, 'g' => null, 'b' => null];
                }

                return;
            case 'kieu':
                $this->kieuDangDoc['ten'] .= $chu;

                return;
            case 'ten':
                $this->tenDem .= $chu;

                return;
        }
    }

    private function themTenPhong(string $chu): void
    {
        if ($this->phongDangDoc === null) {
            $this->phongDangDoc = ['id' => null, 'cp' => null, 'ten' => '', 'xong' => false];
        }

        $phan = explode(';', $chu);
        $this->phongDangDoc['ten'] .= array_shift($phan);

        foreach ($phan as $sau) {
            $this->chotPhong();
            $this->phongDangDoc = ['id' => $this->phongDangDoc['id'], 'cp' => $this->phongDangDoc['cp'], 'ten' => $sau, 'xong' => false];
        }
    }

    private function chotPhong(): void
    {
        $p = $this->phongDangDoc;

        if ($p === null || $p['xong'] || $p['id'] === null) {
            return;
        }

        $ten = trim($p['ten']);

        if (! isset($this->tn->phong[$p['id']]) || $this->tn->phong[$p['id']]['ten'] === '') {
            $this->tn->phong[$p['id']] = ['ten' => $ten === '' ? 'Times New Roman' : $ten, 'cp' => $p['cp']];
        }

        $this->phongDangDoc['xong'] = true;
    }

    /**
     * Ký hiệu điều khiển \x.
     */
    private function kyHieu(string $kyHieu): void
    {
        if ($kyHieu === '*') {
            $this->xaByteCho();
            $this->sao = true;

            return;
        }

        $this->sao = false;

        switch ($kyHieu) {
            case '\\':
            case '{':
            case '}':
                $this->chu($kyHieu);

                return;
            case '~':
                $this->xaByteCho();
                $this->xuatChu("\u{00A0}");

                return;
            case '-':
            case '_':
                // Như .NET (và Word): gạch nối tùy chọn là ký tự 31, gạch nối không ngắt là ký tự 30.
                $this->xaByteCho();

                if ($this->st['dich'] === 'noi_dung' && empty($this->st['kt']['v'])) {
                    $this->tl->themChu($kyHieu === '-' ? "\x1F" : "\x1E", $this->st['kt']);
                }

                return;
            case "\n":
            case "\r":
                $this->tu('par', null);

                return;
            case "\t":
                $this->tu('tab', null);

                return;
        }
    }

    /**
     * Từ điều khiển \tenN.
     */
    private function tu(string $tu, ?int $so): void
    {
        $this->xaByteCho();

        if ($this->sao) {
            $this->sao = false;

            if (! isset(self::DICH_SAO_HIEU[$tu])) {
                $this->boQuaNhom();

                return;
            }
        }

        if ($tu !== 'u') {
            $this->boQuaSauU = 0;

            if ($this->surrogateCao !== null) {
                $this->surrogateCao = null;
                $this->xuatChu("\u{FFFD}");
            }
        }

        if (isset(self::DICH_BO_QUA[$tu])) {
            $this->boQuaNhom();

            return;
        }

        $dich = $this->st['dich'];

        if ($dich === 'bo_qua') {
            return;
        }

        if ($this->tuKyTu($tu, $so) || $this->tuDoan($tu, $so) || $this->tuBang($tu, $so)) {
            return;
        }

        switch ($tu) {
            case 'u':
                $this->unicode($so ?? 0);
                break;
            case 'uc':
                $this->st['uc'] = max(0, $so ?? 1);
                break;
            case 'bin':
                $this->nhiPhan(max(0, $so ?? 0));
                break;
            case 'par':
                if ($dich === 'noi_dung') {
                    $this->ketThucDoan(null);
                }
                break;
            case 'line':
                $this->xuatChu("\u{000B}", true);
                break;
            case 'tab':
                $this->xuatChu("\t", true);
                break;
            case 'page':
                $this->xuatChu("\f", true);
                break;
            case 'sect':
                if ($dich === 'noi_dung') {
                    $this->ngatPhan();
                }
                break;
            case 'chpgn':
                $this->truongDonGian(' PAGE ', '1');
                break;
            case 'ansi':
                $this->tn->maTrang = 1252;
                break;
            case 'mac':
                $this->tn->maTrang = 10000;
                break;
            case 'pc':
                $this->tn->maTrang = 437;
                break;
            case 'pca':
                $this->tn->maTrang = 850;
                break;
            case 'ansicpg':
                if ($so !== null && $so > 0) {
                    $this->tn->maTrang = $so;
                }
                break;
            case 'deff':
                $this->tn->phongMacDinh = max(0, $so ?? 0);

                if ($this->ngan === [] || $this->st['dich'] === 'noi_dung') {
                    $this->st['kt']['f'] = $this->tn->phongMacDinh;
                }
                break;
            case 'deftab':
                $this->taiLieu['deftab'] = $so ?? 720;
                break;
            case 'fonttbl':
                $this->st['dich'] = 'fonttbl';
                $this->st['nhom'] = 'phong';
                $this->st['bangPhong'] = true;
                $this->phongDangDoc = null;
                break;
            case 'fcharset':
                if ($dich === 'fonttbl' && $this->phongDangDoc !== null) {
                    $this->phongDangDoc['cp'] ??= GiaiMa::maTrangTheoCharset($so ?? 0);
                }
                break;
            case 'cpg':
                if ($dich === 'fonttbl' && $this->phongDangDoc !== null && $so) {
                    $this->phongDangDoc['cp'] = $so;
                }
                break;
            case 'colortbl':
                $this->st['dich'] = 'colortbl';
                break;
            case 'red':
            case 'green':
            case 'blue':
                if ($dich === 'colortbl') {
                    $this->mauDangDoc[$tu[0]] = max(0, min(255, $so ?? 0));
                }
                break;
            case 'stylesheet':
                $this->st['dich'] = 'stylesheet';
                break;
            case 'sbasedon':
                if ($dich === 'kieu') {
                    $this->kieuDangDoc['dua'] = $so;
                }
                break;
            case 'snext':
                if ($dich === 'kieu') {
                    $this->kieuDangDoc['tiep'] = $so;
                }
                break;
            case 'ts':
            case 'ds':
                if ($dich === 'kieu') {
                    $this->kieuDangDoc['loai'] = $tu === 'ts' ? 'Table' : 'Section';
                    $this->kieuDangDoc['id'] = 1_000_000 + ($so ?? 0);
                }
                break;
            case 'listtable':
                $this->st['dich'] = 'listtable';
                break;
            case 'list':
                if ($dich === 'listtable') {
                    $this->st['nhom'] = 'list';
                    $this->danhSachDangDoc = ['id' => null, 'muc' => []];
                }
                break;
            case 'listlevel':
                if ($dich === 'listtable' && $this->danhSachDangDoc !== null) {
                    $this->st['nhom'] = 'listlevel';
                    $this->st['kt'] = [];
                    $this->st['pd'] = [];
                    $this->ds->mucDangDoc = DanhSachRtf::mucMoi();
                }
                break;
            case 'leveltext':
                if ($dich === 'listtable') {
                    $this->st['dich'] = 'leveltext';
                    $this->ds->mucDangDoc['text'] = [];
                }
                break;
            case 'levelnfc':
            case 'levelnfcn':
                $this->ds->mucDangDoc['nfc'] = $so ?? 0;
                break;
            case 'levelfollow':
                $this->ds->mucDangDoc['follow'] = $so ?? 0;
                break;
            case 'levelstartat':
                $this->ds->mucDangDoc['start'] = $so ?? 1;
                break;
            case 'listid':
                if ($dich === 'listtable' && $this->danhSachDangDoc !== null) {
                    $this->danhSachDangDoc['id'] = $so;
                } elseif ($dich === 'listoverridetable') {
                    $this->ghiDeDangDoc['listId'] = $so;
                }
                break;
            case 'listoverridetable':
                $this->st['dich'] = 'listoverridetable';
                break;
            case 'listoverride':
                if ($dich === 'listoverridetable') {
                    $this->st['nhom'] = 'listoverride';
                    $this->ghiDeDangDoc = ['listId' => null, 'ls' => null];
                }
                break;
            case 'paperw':
            case 'paperh':
            case 'margl':
            case 'margr':
            case 'margt':
            case 'margb':
                $this->taiLieu[$tu] = $so;
                break;
            case 'facingp':
                $this->taiLieu['facingp'] = true;
                break;
            case 'landscape':
                $this->taiLieu['ngang'] = true;
                break;
            case 'lndscpsxn':
                $this->phan['ngang'] = true;
                break;
            case 'sectd':
                $this->phan = self::phanMacDinh();
                break;
            case 'pgwsxn':
                $this->phan['pgw'] = $so;
                break;
            case 'pghsxn':
                $this->phan['pgh'] = $so;
                break;
            case 'marglsxn':
                $this->phan['ml'] = $so;
                break;
            case 'margrsxn':
                $this->phan['mr'] = $so;
                break;
            case 'margtsxn':
                $this->phan['mt'] = $so;
                break;
            case 'margbsxn':
                $this->phan['mb'] = $so;
                break;
            case 'headery':
                $this->phan['hy'] = $so;
                break;
            case 'footery':
                $this->phan['fy'] = $so;
                break;
            case 'titlepg':
                $this->phan['titlepg'] = $so !== 0;
                break;
            case 'pgnrestart':
                $this->phan['pgnrestart'] = true;
                break;
            case 'pgncont':
                $this->phan['pgnrestart'] = false;
                break;
            case 'pgnstarts':
                $this->phan['pgnstarts'] = $so;
                break;
            case 'header':
            case 'headerl':
            case 'headerr':
            case 'headerf':
            case 'footer':
            case 'footerl':
            case 'footerr':
            case 'footerf':
                if ($dich === 'noi_dung') {
                    $this->st['nhom'] = 'dauchan';
                    $this->tl->batDauDauChan(self::DAU_CHAN[$tu]);
                } else {
                    $this->boQuaNhom();
                }
                break;
            case 'field':
                if ($dich === 'noi_dung' || $dich === 'fldinst') {
                    $this->moTruongChaNeuCan();
                    $this->st['nhom'] = 'field';
                    $this->st['dich'] = 'noi_dung';
                    $this->truong[] = ['lenh' => '', 'ktLenh' => null, 'daMo' => false, 'daTach' => false, 'form' => null];
                }
                break;
            case 'fldinst':
                if ($this->truong === []) {
                    $this->truong[] = ['lenh' => '', 'ktLenh' => null, 'daMo' => false, 'daTach' => false, 'form' => null];
                }

                $this->st['nhom'] = 'fldinst';
                $this->st['dich'] = 'fldinst';
                $this->truong[count($this->truong) - 1]['ktLenh'] = $this->st['kt'];
                break;
            case 'fldrslt':
                if ($this->truong !== []) {
                    $chiSo = count($this->truong) - 1;
                    $this->moTruong($chiSo);

                    if (! $this->truong[$chiSo]['daTach']) {
                        $this->truong[$chiSo]['daTach'] = true;
                        $this->tl->themInline(['fieldType' => 2]);
                    }
                }

                $this->st['dich'] = 'noi_dung';
                break;
            case 'formfield':
                $this->st['nhom'] = 'formfield';
                $this->st['dich'] = 'formfield';
                $this->bieuMau = ['loai' => 0, 'res' => 25, 'defres' => 0, 'hps' => 20, 'size' => 0, 'maxlen' => 0, 'kieuChu' => 0, 'ten' => '', 'mac' => '', 'dinhDang' => '', 'goiY' => '', 'trangThai' => '', 'ds' => []];
                break;
            case 'fftype':
                $this->bieuMau['loai'] = $so ?? 0;
                break;
            case 'ffres':
                $this->bieuMau['res'] = $so ?? 25;
                break;
            case 'ffdefres':
                $this->bieuMau['defres'] = $so ?? 0;
                break;
            case 'ffhps':
                $this->bieuMau['hps'] = $so ?? 20;
                break;
            case 'ffsize':
                $this->bieuMau['size'] = $so ?? 0;
                break;
            case 'ffmaxlen':
                $this->bieuMau['maxlen'] = $so ?? 0;
                break;
            case 'fftypetxt':
                $this->bieuMau['kieuChu'] = $so ?? 0;
                break;
            case 'ffname':
            case 'ffdeftext':
            case 'ffformat':
            case 'ffhelptext':
            case 'ffstattext':
            case 'ffl':
            case 'bkmkstart':
            case 'bkmkend':
            case 'sn':
                $this->st['nhom'] = $tu;
                $this->st['dich'] = 'ten';
                $this->tenDem = '';
                break;
            case 'pict':
                $this->st['nhom'] = 'pict';
                $this->st['dich'] = 'pict';
                $this->anh = ['loai' => '', 'hex' => '', 'bin' => '', 'picw' => 0, 'pich' => 0, 'goalw' => 0, 'goalh' => 0, 'sx' => 100, 'sy' => 100];
                break;
            case 'pngblip':
                $this->anh['loai'] = 'png';
                break;
            case 'jpegblip':
                $this->anh['loai'] = 'jpeg';
                break;
            case 'emfblip':
            case 'wmetafile':
            case 'macpict':
            case 'dibitmap':
            case 'wbitmap':
            case 'pmmetafile':
                $this->anh['loai'] = $tu;
                break;
            case 'picw':
            case 'pich':
                $this->anh[$tu] = $so ?? 0;
                break;
            case 'picwgoal':
                $this->anh['goalw'] = $so ?? 0;
                break;
            case 'pichgoal':
                $this->anh['goalh'] = $so ?? 0;
                break;
            case 'picscalex':
                $this->anh['sx'] = $so ?? 100;
                break;
            case 'picscaley':
                $this->anh['sy'] = $so ?? 100;
                break;
            case 'shpinst':
                $this->st['dich'] = 'shpinst';
                $this->st['hinh'] = true;
                break;
            case 'sp':
                $this->thuocTinhHinh = '';
                break;
            case 'sv':
                $this->st['dich'] = $this->thuocTinhHinh === 'pib' ? 'noi_dung' : 'bo_qua';

                if ($this->st['dich'] === 'bo_qua') {
                    $this->boQuaNhom();
                }
                break;
            case 'nesttableprops':
                $this->st['bangLong'] = true;
                break;
            case 'defpap':
                $this->st['nhom'] = 'defpap';
                $this->st['dich'] = 'mac_dinh';
                $this->st['pd'] = [];
                break;
            case 'upr':
                $this->st['dichTruocUpr'] = $dich;
                $this->st['dich'] = 'upr';
                break;
            case 'ud':
                $this->st['dich'] = $this->st['dichTruocUpr'] ?? 'noi_dung';
                break;
            default:
                if (isset(self::KY_TU_DAC_BIET[$tu])) {
                    $this->xuatChu(self::KY_TU_DAC_BIET[$tu]);
                }
        }
    }

    /**
     * Từ điều khiển định dạng ký tự; true nếu đã xử lý.
     */
    private function tuKyTu(string $tu, ?int $so): bool
    {
        $bat = $so !== 0;

        switch ($tu) {
            case 'plain':
                $this->st['kt'] = $this->dangBatKieu() ? [] : $this->tn->kyTuMacDinh();

                return true;
            case 'b':
                $this->st['kt']['b'] = $bat;

                return true;
            case 'i':
                $this->st['kt']['i'] = $bat;

                return true;
            case 'ulnone':
                $this->st['kt']['ul'] = null;

                return true;
            case 'strike':
                $this->st['kt']['st'] = $bat ? 'SingleStrike' : 'None';

                return true;
            case 'striked':
                $this->st['kt']['st'] = $bat ? 'DoubleStrike' : 'None';

                return true;
            case 'super':
                $this->st['kt']['bl'] = 'Superscript';

                return true;
            case 'sub':
                $this->st['kt']['bl'] = 'Subscript';

                return true;
            case 'nosupersub':
                $this->st['kt']['bl'] = 'Normal';

                return true;
            case 'caps':
                $this->st['kt']['caps'] = $bat;

                return true;
            case 'v':
                $this->st['kt']['v'] = $bat;

                return true;
            case 'f':
                if ($this->st['dich'] === 'fonttbl') {
                    $this->chotPhong();
                    $this->phongDangDoc = ['id' => $so ?? 0, 'cp' => null, 'ten' => '', 'xong' => false];
                } else {
                    $this->st['kt']['f'] = $so ?? 0;
                }

                return true;
            case 'fs':
                if ($so !== null && $so > 0) {
                    $this->st['kt']['fs'] = min($so, 3276);
                }

                return true;
            case 'cf':
                $this->st['kt']['cf'] = $so ?? 0;

                return true;
            case 'highlight':
                $this->st['kt']['hl'] = $so ?: null;

                return true;
            case 'cs':
                if ($this->st['dich'] === 'kieu') {
                    $this->kieuDangDoc['loai'] = 'Character';
                    $this->kieuDangDoc['id'] = $so ?? 0;
                } else {
                    $this->st['kt']['cs'] = $so;
                }

                return true;
            case 'ab':
                $this->st['kt']['ab'] = $bat;

                return true;
            case 'ai':
                $this->st['kt']['ai'] = $bat;

                return true;
            case 'af':
                $this->st['kt']['af'] = $so ?? 0;

                return true;
            case 'afs':
                if ($so !== null && $so > 0) {
                    $this->st['kt']['afs'] = min($so, 3276);
                }

                return true;
        }

        if (isset(self::GACH_CHAN[$tu])) {
            $this->st['kt']['ul'] = $bat ? self::GACH_CHAN[$tu] : null;

            return true;
        }

        return false;
    }

    /**
     * Từ điều khiển định dạng đoạn; true nếu đã xử lý.
     */
    private function tuDoan(string $tu, ?int $so): bool
    {
        switch ($tu) {
            case 'pard':
                $this->st['pd'] = $this->dangBatKieu() ? [] : TaiNguyenRtf::doanMacDinh();
                $this->tabCho = ['Left', 'None'];

                return true;
            case 's':
                if ($this->st['dich'] === 'kieu') {
                    $this->kieuDangDoc['loai'] = 'Paragraph';
                    $this->kieuDangDoc['id'] = $so ?? 0;
                } else {
                    $this->st['pd']['s'] = $so ?? 0;
                }

                return true;
            case 'ql':
            case 'qd':
                $this->st['pd']['q'] = 'Left';

                return true;
            case 'qc':
                $this->st['pd']['q'] = 'Center';

                return true;
            case 'qr':
                $this->st['pd']['q'] = 'Right';

                return true;
            case 'qj':
            case 'qt':
                $this->st['pd']['q'] = 'Justify';

                return true;
            case 'li':
            case 'lin':
                $this->st['pd']['li'] = $so ?? 0;

                return true;
            case 'ri':
            case 'rin':
                $this->st['pd']['ri'] = $so ?? 0;

                return true;
            case 'fi':
                $this->st['pd']['fi'] = $so ?? 0;

                return true;
            case 'sb':
                $this->st['pd']['sb'] = max(0, $so ?? 0);

                return true;
            case 'sa':
                $this->st['pd']['sa'] = max(0, $so ?? 0);

                return true;
            case 'sl':
                $this->st['pd']['sl'] = $so ?? 0;

                return true;
            case 'slmult':
                $this->st['pd']['slm'] = $so ?? 0;

                return true;
            case 'intbl':
                $this->st['pd']['intbl'] = true;

                return true;
            case 'itap':
                $this->st['pd']['itap'] = max(0, $so ?? 1);

                return true;
            case 'tqr':
                $this->tabCho[0] = 'Right';

                return true;
            case 'tqc':
                $this->tabCho[0] = 'Center';

                return true;
            case 'tqdec':
                $this->tabCho[0] = 'Decimal';

                return true;
            case 'tldot':
            case 'tlmdot':
                $this->tabCho[1] = 'Dot';

                return true;
            case 'tlhyph':
            case 'tleq':
                $this->tabCho[1] = 'Hyphen';

                return true;
            case 'tlul':
            case 'tlth':
                $this->tabCho[1] = 'Underscore';

                return true;
            case 'tx':
                $this->st['pd']['tabs'][] = [$so ?? 0, $this->tabCho[0], $this->tabCho[1]];
                $this->tabCho = ['Left', 'None'];

                return true;
            case 'tb':
                $this->tabCho = ['Left', 'None'];

                return true;
            case 'ls':
                if ($this->st['dich'] === 'listoverridetable') {
                    $this->ghiDeDangDoc['ls'] = $so;
                } else {
                    $this->st['pd']['ls'] = $so;
                }

                return true;
            case 'ilvl':
                $this->st['pd']['ilvl'] = max(0, min(8, $so ?? 0));

                return true;
            case 'outlinelevel':
                $this->st['pd']['ol'] = $so;

                return true;
            case 'contextualspace':
                $this->st['pd']['ctx'] = true;

                return true;
            case 'pagebb':
                $this->st['pd']['pagebb'] = $so !== 0;

                return true;
            case 'rtlpar':
                $this->st['pd']['bidi'] = true;

                return true;
            case 'ltrpar':
                $this->st['pd']['bidi'] = false;

                return true;
            case 'brdrt':
            case 'brdrb':
            case 'brdrl':
            case 'brdrr':
            case 'brdrbtw':
            case 'brdrbar':
            case 'box':
                $this->vienDangDat = ['doan', ''];

                return true;
        }

        return false;
    }

    /**
     * Từ điều khiển của bảng (hàng, ô, viền); true nếu đã xử lý.
     */
    private function tuBang(string $tu, ?int $so): bool
    {
        if (isset(BangRtf::KIEU_VIEN[$tu])) {
            $this->datVien('kieu', BangRtf::KIEU_VIEN[$tu]);

            return true;
        }

        switch ($tu) {
            case 'brdrw':
                $this->datVien('rong', max(0, $so ?? 0));

                return true;
            case 'brdrcf':
                $this->datVien('mau', $so ?? 0);

                return true;
            case 'trowd':
                $this->doSauDinhNghia = $this->st['bangLong'] ? max(2, (int) ($this->st['pd']['itap'] ?? 0), $this->tl->doSauBang()) : 1;
                $this->dinhNghiaHang[$this->doSauDinhNghia] = BangRtf::hangMoi();
                $this->vienDangDat = null;

                return true;
            case 'cell':
                $this->ketThucO(max(1, $this->doSauDoan($this->st['pd'])));

                return true;
            case 'nestcell':
                $this->ketThucO(max(2, $this->doSauDoan($this->st['pd'])));

                return true;
            case 'row':
                $this->ketThucHang(1);

                return true;
            case 'nestrow':
                $this->ketThucHang(max(2, $this->tl->doSauBang()));

                return true;
        }

        if (! isset($this->dinhNghiaHang[$this->doSauDinhNghia])) {
            if (! in_array($tu, ['trgaph', 'trleft', 'cellx'], true) && ! str_starts_with($tu, 'cl') && ! str_starts_with($tu, 'tr')) {
                return false;
            }

            $this->dinhNghiaHang[$this->doSauDinhNghia] = BangRtf::hangMoi();
        }

        $hang = &$this->dinhNghiaHang[$this->doSauDinhNghia];

        switch ($tu) {
            case 'trgaph':
                $hang['trgaph'] = $so ?? 0;

                return true;
            case 'tblind':
                $hang['tblind'] = $so ?? 0;

                return true;
            case 'trleft':
                $hang['trleft'] = $so ?? 0;

                return true;
            case 'trrh':
                $hang['trrh'] = $so ?? 0;

                return true;
            case 'trql':
                $hang['canh'] = 'Left';

                return true;
            case 'trqc':
                $hang['canh'] = 'Center';

                return true;
            case 'trqr':
                $hang['canh'] = 'Right';

                return true;
            case 'trhdr':
                $hang['tieuDe'] = true;

                return true;
            case 'trkeep':
                $hang['giu'] = true;

                return true;
            case 'trautofit':
                $hang['tuDong'] = $so !== 0;

                return true;
            case 'trpaddl':
            case 'trpaddt':
            case 'trpaddr':
            case 'trpaddb':
                $hang['padd'][$tu[6]] = $so ?? 0;

                return true;
            case 'trpaddfl':
            case 'trpaddft':
            case 'trpaddfr':
            case 'trpaddfb':
                if ($so === 0) {
                    unset($hang['padd'][$tu[7]]);
                }

                return true;
            case 'trbrdrt':
            case 'trbrdrl':
            case 'trbrdrb':
            case 'trbrdrr':
            case 'trbrdrh':
            case 'trbrdrv':
                $hang['vien'][$tu[6]] = ['kieu' => 'None', 'rong' => 0, 'mau' => null];
                $this->vienDangDat = ['hang', $tu[6]];

                return true;
            case 'clbrdrt':
            case 'clbrdrl':
            case 'clbrdrb':
            case 'clbrdrr':
                $hang['oMoi']['vien'][$tu[6]] = ['kieu' => null, 'rong' => 0, 'mau' => null];
                $this->vienDangDat = ['o', $tu[6]];

                return true;
            case 'clvmgf':
            case 'clvmrg':
            case 'clmgf':
            case 'clmrg':
                $hang['oMoi'][substr($tu, 2)] = true;

                return true;
            case 'clvertalt':
                $hang['oMoi']['canhDoc'] = 'Top';

                return true;
            case 'clvertalc':
                $hang['oMoi']['canhDoc'] = 'Center';

                return true;
            case 'clvertalb':
                $hang['oMoi']['canhDoc'] = 'Bottom';

                return true;
            case 'clcbpat':
                $hang['oMoi']['nen'] = $so;

                return true;
            case 'clpadl':
            case 'clpadt':
            case 'clpadr':
            case 'clpadb':
                $hang['oMoi']['pad'][$tu[5]] = $so ?? 0;

                return true;
            case 'clpadfl':
            case 'clpadft':
            case 'clpadfr':
            case 'clpadfb':
                if ($so === 0) {
                    unset($hang['oMoi']['pad'][$tu[6]]);
                }

                return true;
            case 'clftsWidth':
                $hang['oMoi']['fts'] = $so ?? 0;

                return true;
            case 'clwWidth':
                $hang['oMoi']['w'] = $so ?? 0;

                return true;
            case 'cellx':
                $hang['oMoi']['x'] = $so ?? 0;
                $hang['o'][] = $hang['oMoi'];
                $hang['oMoi'] = BangRtf::oMoi();
                $this->vienDangDat = null;

                return true;
        }

        return false;
    }

    /**
     * Gán thuộc tính cho viền đang khai báo (\brdrs, \brdrw, \brdrcf sau \clbrdrt, \trbrdrl...).
     */
    private function datVien(string $khoa, mixed $giaTri): void
    {
        if ($this->vienDangDat === null || $this->vienDangDat[0] === 'doan' || ! isset($this->dinhNghiaHang[$this->doSauDinhNghia])) {
            return;
        }

        [$noi, $canh] = $this->vienDangDat;
        $hang = &$this->dinhNghiaHang[$this->doSauDinhNghia];

        if ($noi === 'hang' && isset($hang['vien'][$canh])) {
            $hang['vien'][$canh][$khoa] = $giaTri;
        } elseif ($noi === 'o' && isset($hang['oMoi']['vien'][$canh])) {
            $hang['oMoi']['vien'][$canh][$khoa] = $giaTri;
        }
    }

    /**
     * Đang đọc định nghĩa kiểu hoặc mức danh sách: định dạng chỉ ghi thuộc tính được khai báo.
     */
    private function dangBatKieu(): bool
    {
        return in_array($this->st['nhom'], ['kieu', 'listlevel', 'defpap'], true)
            || in_array($this->st['dich'], ['kieu', 'listtable', 'mac_dinh'], true);
    }

    /**
     * Độ sâu bảng của đoạn: \itapN, hoặc 1 nếu chỉ có \intbl.
     *
     * @param  array<string, mixed>  $pd
     */
    private function doSauDoan(array $pd): int
    {
        $itap = $pd['itap'] ?? null;

        if (! empty($pd['intbl'])) {
            return max(1, (int) ($itap ?? 1));
        }

        return $itap !== null && $itap > 0 ? (int) $itap : 0;
    }

    private function ketThucDoan(?int $doSau): void
    {
        $pd = $this->st['pd'] + TaiNguyenRtf::doanMacDinh();
        $kt = $this->st['kt'] + $this->tn->kyTuMacDinh();
        $doSau ??= $this->doSauDoan($pd);

        if (! empty($pd['pagebb']) && $doSau === 0) {
            // SFDT v19 không có pageBreakBefore: thay bằng ký tự ngắt trang ở đầu đoạn (trừ đoạn đầu section).
            $this->tl->ngatTrangDauDoan($this->st['kt']);
        }

        $this->tl->ketThucDoan($this->tn->doan($pd, $this->danhSachCuaDoan($pd)), $this->tn->kyTuDauDoan($kt), $doSau);
    }

    private function ketThucO(int $doSau): void
    {
        if ($this->st['dich'] !== 'noi_dung') {
            return;
        }

        $this->ketThucDoan($doSau);
        $this->tl->ketThucO($doSau);
        // Như .NET: ô sau không có \pard thì giữ định dạng đoạn nhưng về kiểu Normal.
        $this->st['pd']['s'] = 0;
    }

    private function ketThucHang(int $doSau): void
    {
        if ($this->tl->coNoiDungDoDang()) {
            $this->ketThucDoan($doSau);
        } else {
            $this->tl->boDoanDoDang();
        }

        $dinhNghia = $this->dinhNghiaHang[$doSau] ?? $this->dinhNghiaHang[$this->doSauDinhNghia] ?? BangRtf::hangMoi();
        $this->tl->ketThucHang($doSau, $dinhNghia);
    }

    private function ngatPhan(): void
    {
        $pd = $this->st['pd'] + TaiNguyenRtf::doanMacDinh();

        if (! $this->tl->coNoiDungDoDang()) {
            // Đoạn trống \sect tự sinh (sau \par) không thuộc danh sách, như .NET.
            $pd['ls'] = null;
        }

        $kt = $this->st['kt'] + $this->tn->kyTuMacDinh();
        $this->tl->ngatPhan($this->dinhDangPhan(), $this->tn->doan($pd, $this->danhSachCuaDoan($pd)), $this->tn->kyTuDauDoan($kt));
    }

    /**
     * @param  array<string, mixed>  $pd
     * @return ?array{listLevelNumber: int, listId: int}
     */
    private function danhSachCuaDoan(array $pd): ?array
    {
        $listId = $this->ds->listId($pd['ls'] ?? null);

        return $listId === null ? null : ['listLevelNumber' => (int) ($pd['ilvl'] ?? 0), 'listId' => $listId];
    }

    /**
     * sectionFormat SFDT; giá trị thiếu lấy theo tài liệu, rồi theo mặc định của dịch vụ .NET (A4).
     * Trang ngang (\lndscpsxn, \landscape) mà khổ ghi theo chiều dọc thì đổi chiều.
     *
     * @return array<string, mixed>
     */
    private function dinhDangPhan(): array
    {
        $p = $this->phan;
        $t = $this->taiLieu;
        $rong = self::duong($p['pgw'] ?? $t['paperw'] ?? null, 11906);
        $cao = self::duong($p['pgh'] ?? $t['paperh'] ?? null, 16838);

        $ngang = $p['ngang'] || ($p['pgw'] === null && $p['pgh'] === null && ! empty($t['ngang']));

        if ($ngang && $rong < $cao) {
            [$rong, $cao] = [$cao, $rong];
        }

        return [
            'headerDistance' => TaiNguyenRtf::diem(max(0, $p['hy'] ?? 720)),
            'footerDistance' => TaiNguyenRtf::diem(max(0, $p['fy'] ?? 720)),
            'pageWidth' => TaiNguyenRtf::diem($rong),
            'pageHeight' => TaiNguyenRtf::diem($cao),
            'leftMargin' => TaiNguyenRtf::diem(max(0, $p['ml'] ?? $t['margl'] ?? 1000)),
            'rightMargin' => TaiNguyenRtf::diem(max(0, $p['mr'] ?? $t['margr'] ?? 400)),
            'topMargin' => TaiNguyenRtf::diem(abs($p['mt'] ?? $t['margt'] ?? 400)),
            'bottomMargin' => TaiNguyenRtf::diem(abs($p['mb'] ?? $t['margb'] ?? 400)),
            'differentFirstPage' => (bool) $p['titlepg'],
            'differentOddAndEvenPages' => (bool) $t['facingp'],
            'bidi' => false,
            'restartPageNumbering' => (bool) $p['pgnrestart'],
            'pageStartingNumber' => (int) ($p['pgnstarts'] ?? 0),
        ];
    }

    private static function duong(?int $giaTri, int $macDinh): int
    {
        return $giaTri !== null && $giaTri > 0 ? $giaTri : $macDinh;
    }

    /**
     * \uN: ký tự Unicode, sau đó bỏ \ucN ký tự thay thế. Cặp surrogate ghép thành một ký tự.
     */
    private function unicode(int $ma): void
    {
        if ($ma < 0) {
            $ma += 65536;
        }

        $chu = null;

        if ($ma >= 0xD800 && $ma <= 0xDBFF) {
            $this->surrogateCao = $ma;
        } elseif ($ma >= 0xDC00 && $ma <= 0xDFFF && $this->surrogateCao !== null) {
            $chu = mb_chr(0x10000 + (($this->surrogateCao - 0xD800) << 10) + ($ma - 0xDC00), 'UTF-8') ?: "\u{FFFD}";
            $this->surrogateCao = null;
        } else {
            if ($this->surrogateCao !== null) {
                $this->surrogateCao = null;
                $this->xuatChu("\u{FFFD}");
            }

            $chu = GiaiMa::kyTu($ma);
        }

        if ($chu !== null) {
            if ($this->st['dich'] === 'leveltext') {
                $this->ds->mucDangDoc['text'][] = ['c', $chu];
            } else {
                $this->xuatChu($chu);
            }
        }

        $this->boQuaSauU = (int) $this->st['uc'];
    }

    /**
     * \binN: N byte nhị phân ngay sau; trong ảnh thì là dữ liệu ảnh, chỗ khác bỏ qua.
     */
    private function nhiPhan(int $soByte): void
    {
        $soByte = min($soByte, $this->doDai - $this->viTri);

        if ($this->st['dich'] === 'pict') {
            $this->anh['bin'] .= substr($this->rtf, $this->viTri, $soByte);
        }

        $this->viTri += $soByte;
    }

    /**
     * Trường cha đang đọc lệnh mà gặp trường con: mở trường cha trước để giữ đúng thứ tự.
     */
    private function moTruongChaNeuCan(): void
    {
        if ($this->st['dich'] === 'fldinst' && $this->truong !== []) {
            $this->moTruong(count($this->truong) - 1);
        }
    }

    /**
     * Ghi fieldBegin (kèm dữ liệu biểu mẫu nếu có) và mã lệnh của trường.
     */
    private function moTruong(int $chiSo): void
    {
        $truong = $this->truong[$chiSo];

        if ($truong['daMo']) {
            return;
        }

        $batDau = ['hasFieldEnd' => true];

        if ($truong['form'] !== null) {
            $batDau['formFieldData'] = $truong['form'];
        }

        $batDau['fieldType'] = 0;
        $this->tl->themInline($batDau);

        if ($truong['lenh'] !== '') {
            $this->tl->themChu($truong['lenh'], $truong['ktLenh'] ?? $this->st['kt'], true);
        }

        $this->truong[$chiSo]['daMo'] = true;
        $this->truong[$chiSo]['lenh'] = '';
    }

    private function truongDonGian(string $lenh, string $ketQua): void
    {
        if ($this->st['dich'] !== 'noi_dung') {
            return;
        }

        $this->tl->themInline(['hasFieldEnd' => true, 'fieldType' => 0]);
        $this->tl->themChu($lenh, $this->st['kt'], true);
        $this->tl->themInline(['fieldType' => 2]);
        $this->tl->themChu($ketQua, $this->st['kt'], true);
        $this->tl->themInline(['fieldType' => 1]);
    }

    /**
     * Xử lý khi đóng nhóm đã đánh dấu (bảng phông, kiểu, danh sách, trường, ảnh...).
     *
     * @param  array<string, mixed>  $cu  trạng thái của nhóm vừa đóng
     */
    private function ketThucNhom(string $nhom, array $cu): void
    {
        switch ($nhom) {
            case 'phong':
                $this->chotPhong();
                break;
            case 'kieu':
                $k = $this->kieuDangDoc;
                $ten = TaiNguyenRtf::tenKieuChuan(trim(rtrim(trim($k['ten']), ';')));
                $this->tn->kieu[$k['id']] ??= [
                    'loai' => $k['loai'], 'ten' => $ten, 'dua' => $k['dua'], 'tiep' => $k['tiep'], 'kt' => $cu['kt'], 'pd' => $cu['pd'],
                ];
                break;
            case 'list':
                if ($this->danhSachDangDoc !== null) {
                    $this->ds->danhSach[] = $this->danhSachDangDoc;
                    $this->danhSachDangDoc = null;
                }
                break;
            case 'listlevel':
                if ($this->danhSachDangDoc !== null) {
                    $muc = $this->ds->mucDangDoc;
                    $muc['kt'] = $cu['kt'];
                    $muc['pd'] = $cu['pd'];
                    $this->danhSachDangDoc['muc'][] = $muc;
                }
                break;
            case 'listoverride':
                $this->ds->ghiDe[] = $this->ghiDeDangDoc;
                break;
            case 'dauchan':
                $pd = $cu['pd'] + TaiNguyenRtf::doanMacDinh();
                $kt = $cu['kt'] + $this->tn->kyTuMacDinh();
                $this->tl->ketThucDauChan($this->tn->doan($pd, $this->danhSachCuaDoan($pd)), $this->tn->kyTuDauDoan($kt));
                break;
            case 'fldinst':
                if ($this->truong !== [] && ! $this->truong[count($this->truong) - 1]['daMo']) {
                    $this->moTruong(count($this->truong) - 1);
                }
                break;
            case 'field':
                $truong = array_pop($this->truong);

                if ($truong !== null && $truong['daMo']) {
                    if (! $truong['daTach']) {
                        $this->tl->themInline(['fieldType' => 2]);
                    }

                    $this->tl->themInline(['fieldType' => 1]);
                } elseif ($truong !== null && $truong['lenh'] !== '') {
                    $this->truong[] = $truong;
                    $this->moTruong(count($this->truong) - 1);
                    array_pop($this->truong);
                    $this->tl->themInline(['fieldType' => 2]);
                    $this->tl->themInline(['fieldType' => 1]);
                }
                break;
            case 'formfield':
                if ($this->truong !== []) {
                    $this->truong[count($this->truong) - 1]['form'] = $this->duLieuBieuMau();
                }
                break;
            case 'ffname':
                $this->bieuMau['ten'] = trim($this->tenDem);
                break;
            case 'ffdeftext':
                $this->bieuMau['mac'] = $this->tenDem;
                break;
            case 'ffformat':
                $this->bieuMau['dinhDang'] = $this->tenDem;
                break;
            case 'ffhelptext':
                $this->bieuMau['goiY'] = $this->tenDem;
                break;
            case 'ffstattext':
                $this->bieuMau['trangThai'] = $this->tenDem;
                break;
            case 'ffl':
                $this->bieuMau['ds'][] = $this->tenDem;
                break;
            case 'bkmkstart':
            case 'bkmkend':
                if ($cu['dich'] === 'ten' && trim($this->tenDem) !== '' && $this->st['dich'] === 'noi_dung') {
                    $this->tl->themInline(['name' => trim($this->tenDem), 'bookmarkType' => $nhom === 'bkmkstart' ? 0 : 1]);
                }
                break;
            case 'sn':
                $this->thuocTinhHinh = trim($this->tenDem);
                break;
            case 'defpap':
                $this->doanTaiLieu = $cu['pd'];
                break;
            case 'pict':
                $this->themAnh($cu['hinh']);
                break;
        }
    }

    /**
     * formFieldData của SFDT từ {\*\formfield ...}.
     *
     * @return array<string, mixed>
     */
    private function duLieuBieuMau(): array
    {
        $b = $this->bieuMau;
        $du = ['name' => $b['ten'], 'enabled' => true, 'helpText' => $b['goiY'], 'statusText' => $b['trangThai']];

        if ($b['loai'] === 1) {
            $chon = $b['res'] === 25 ? $b['defres'] === 1 : $b['res'] === 1;
            $du['checkBox'] = [
                'sizeType' => $b['size'] === 1 ? 'Exactly' : 'Auto',
                'size' => $b['size'] === 1 ? round($b['hps'] / 2, 2) : 0,
                'defaultValue' => $b['defres'] === 1,
                'checked' => $chon,
            ];
        } elseif ($b['loai'] === 2) {
            $du['dropDownList'] = ['dropDownItems' => $b['ds'], 'selectedIndex' => $b['res'] === 25 ? $b['defres'] : $b['res']];
        } else {
            $du['textInput'] = [
                'type' => match ($b['kieuChu']) {
                    1 => 'Number',
                    2 => 'Date',
                    default => 'Text',
                },
                'maxLength' => $b['maxlen'],
                'defaultValue' => $b['mac'],
                'format' => $b['dinhDang'],
            ];
        }

        return $du;
    }

    /**
     * Ảnh PNG/JPEG thành inline ảnh SFDT; WMF/EMF/BMP không hiển thị được trên trình duyệt nên bỏ.
     */
    private function themAnh(bool $trongHinh): void
    {
        $a = $this->anh;

        if (! in_array($a['loai'], ['png', 'jpeg'], true)) {
            return;
        }

        $duLieu = $a['bin'];

        if ($duLieu === '') {
            $hex = preg_replace('/[^0-9a-fA-F]/', '', $a['hex']) ?? '';
            $duLieu = (string) hex2bin(strlen($hex) % 2 === 1 ? substr($hex, 0, -1) : $hex);
        }

        if ($duLieu === '') {
            return;
        }

        $loaiThat = str_starts_with($duLieu, "\x89PNG") ? 'png' : (str_starts_with($duLieu, "\xFF\xD8") ? 'jpeg' : null);

        if ($loaiThat === null) {
            return;
        }

        [$rong, $cao] = $this->kichThuocAnh($a, $duLieu, $loaiThat);
        $this->tl->themInline([
            'imageString' => 'data:image/'.$loaiThat.';base64,'.base64_encode($duLieu),
            'length' => 1,
            'width' => $rong,
            'height' => $cao,
            'isInlineImage' => ! $trongHinh,
            'isMetaFile' => false,
        ]);
    }

    /**
     * Kích thước hiển thị (point): \picwgoal × \picscalex, thiếu thì theo điểm ảnh (96 dpi).
     *
     * @param  array<string, mixed>  $a
     * @return array{float, float}
     */
    private function kichThuocAnh(array $a, string $duLieu, string $loai): array
    {
        $rong = (float) $a['goalw'];
        $cao = (float) $a['goalh'];

        if ($rong <= 0 || $cao <= 0) {
            [$diemRong, $diemCao] = self::diemAnh($duLieu, $loai) ?? [$a['picw'], $a['pich']];
            $rong = $rong > 0 ? $rong : $diemRong * 15;
            $cao = $cao > 0 ? $cao : $diemCao * 15;
        }

        // Như .NET: tính theo twip nguyên rồi đổi ra point.
        $rong = round($rong * max(1, (int) $a['sx']) / 100);
        $cao = round($cao * max(1, (int) $a['sy']) / 100);

        return [max(TaiNguyenRtf::diem($rong), 1.0), max(TaiNguyenRtf::diem($cao), 1.0)];
    }

    /**
     * Số điểm ảnh đọc từ đầu file PNG/JPEG.
     *
     * @return ?array{int, int}
     */
    private static function diemAnh(string $duLieu, string $loai): ?array
    {
        if ($loai === 'png' && strlen($duLieu) >= 24) {
            $kt = unpack('Nrong/Ncao', substr($duLieu, 16, 8));

            return $kt === false ? null : [(int) $kt['rong'], (int) $kt['cao']];
        }

        $doDai = strlen($duLieu);

        for ($i = 2; $i + 9 < $doDai;) {
            if (ord($duLieu[$i]) !== 0xFF) {
                return null;
            }

            $loaiDoan = ord($duLieu[$i + 1]);
            $doDaiDoan = (ord($duLieu[$i + 2]) << 8) + ord($duLieu[$i + 3]);

            if ($loaiDoan >= 0xC0 && $loaiDoan <= 0xCF && ! in_array($loaiDoan, [0xC4, 0xC8, 0xCC], true)) {
                return [(ord($duLieu[$i + 7]) << 8) + ord($duLieu[$i + 8]), (ord($duLieu[$i + 5]) << 8) + ord($duLieu[$i + 6])];
            }

            $i += 2 + $doDaiDoan;
        }

        return null;
    }
}
