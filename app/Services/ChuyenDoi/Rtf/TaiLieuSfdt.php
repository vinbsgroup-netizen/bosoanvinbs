<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Dựng cây SFDT (sections, blocks, inlines, bảng, đầu/chân trang) từ các sự kiện bộ phân tích RTF gửi tới.
 *
 * "Truyện" là nơi đang ghi: thân của section hiện tại hoặc một đầu/chân trang. Mỗi truyện có đoạn đang dở (inlines)
 * và chồng bảng đang mở theo độ sâu lồng (1 là bảng ngoài cùng).
 */
final class TaiLieuSfdt
{
    /**
     * Độ sâu bảng lồng tối đa, sâu hơn thì gộp vào mức này để RTF hỏng không làm cây quá sâu.
     */
    private const DO_SAU_TOI_DA = 16;

    /**
     * @var list<array<string, mixed>>
     */
    private array $sections = [];

    /**
     * @var array{khoi: list<array<string, mixed>>, inlines: list<array<string, mixed>>, ktCuoi: ?array<string, mixed>, bang: list<array<string, mixed>>}
     */
    private array $truyen;

    /**
     * Truyện thân section khi đang ghi đầu/chân trang.
     *
     * @var list<array{truyen: array<string, mixed>, loai: string}>
     */
    private array $nganTruyen = [];

    /**
     * Đầu/chân trang của section hiện tại.
     *
     * @var array<string, array{blocks: list<array<string, mixed>>}>
     */
    private array $dauChan = [];

    public function __construct(private readonly TaiNguyenRtf $tn)
    {
        $this->truyen = self::truyenMoi();
    }

    /**
     * @return array{khoi: list<array<string, mixed>>, inlines: list<array<string, mixed>>, ktCuoi: ?array<string, mixed>, bang: list<array<string, mixed>>}
     */
    private static function truyenMoi(): array
    {
        return ['khoi' => [], 'inlines' => [], 'ktCuoi' => null, 'bang' => []];
    }

    /**
     * Thêm chữ vào đoạn đang dở; gộp với inline chữ liền trước nếu cùng định dạng.
     *
     * @param  array<string, mixed>  $kt
     */
    public function themChu(string $chu, array $kt, bool $rieng = false): void
    {
        if ($chu === '') {
            return;
        }

        if (! $rieng && $this->truyen['ktCuoi'] === $kt) {
            $this->truyen['inlines'][count($this->truyen['inlines']) - 1]['text'] .= $chu;

            return;
        }

        $this->truyen['inlines'][] = ['text' => $chu, 'characterFormat' => $this->tn->kyTu($kt + $this->tn->kyTuMacDinh())];
        $this->truyen['ktCuoi'] = $rieng ? null : $kt;
    }

    /**
     * Thêm inline không phải chữ (trường, ảnh, dấu trang).
     *
     * @param  array<string, mixed>  $inline
     */
    public function themInline(array $inline): void
    {
        $this->truyen['inlines'][] = $inline;
        $this->truyen['ktCuoi'] = null;
    }

    /**
     * Đặt ký tự ngắt trang vào đầu đoạn đang dở (giả lập \pagebb), trừ khi đoạn đã ở đầu trang: đầu section,
     * đầu đầu/chân trang hoặc ngay sau một ngắt trang.
     *
     * @param  array<string, mixed>  $kt
     */
    public function ngatTrangDauDoan(array $kt): void
    {
        $khoi = $this->truyen['khoi'];
        $cuoi = $khoi === [] ? null : $khoi[count($khoi) - 1];
        $inlineCuoi = $cuoi === null || isset($cuoi['rows']) ? null : ($cuoi['inlines'][count($cuoi['inlines']) - 1] ?? null);

        if ($this->nganTruyen !== [] || ($cuoi === null && $this->truyen['bang'] === []) || ($inlineCuoi['text'] ?? null) === "\f") {
            return;
        }

        array_unshift($this->truyen['inlines'], ['text' => "\f", 'characterFormat' => $this->tn->kyTu($kt + $this->tn->kyTuMacDinh())]);

        if (count($this->truyen['inlines']) === 1) {
            $this->truyen['ktCuoi'] = null;
        }
    }

    public function coNoiDungDoDang(): bool
    {
        return $this->truyen['inlines'] !== [];
    }

    /**
     * Số bảng đang mở trong truyện hiện tại.
     */
    public function doSauBang(): int
    {
        return count($this->truyen['bang']);
    }

    /**
     * Kết thúc đoạn đang dở và đặt vào đúng chỗ: thân truyện (độ sâu 0) hoặc ô đang mở của bảng ở độ sâu đó.
     *
     * @param  array<string, mixed>  $doan  paragraphFormat SFDT
     * @param  array<string, mixed>  $dauDoan  characterFormat SFDT của dấu đoạn
     */
    public function ketThucDoan(array $doan, array $dauDoan, int $doSau): void
    {
        $khoi = ['characterFormat' => $dauDoan, 'paragraphFormat' => $doan, 'inlines' => $this->truyen['inlines']];
        $this->truyen['inlines'] = [];
        $this->truyen['ktCuoi'] = null;
        $this->datKhoi($khoi, $doSau);
    }

    /**
     * Bỏ đoạn đang dở (chỉ dùng khi không có chữ).
     */
    public function boDoanDoDang(): void
    {
        $this->truyen['inlines'] = [];
        $this->truyen['ktCuoi'] = null;
    }

    /**
     * \cell, \nestcell: chốt ô đang mở ở độ sâu đó.
     */
    public function ketThucO(int $doSau): void
    {
        $doSau = $this->chuanDoSau($doSau);
        $this->moBangDen($doSau);
        $this->dongBangSauHon($doSau);
        $ngu = &$this->truyen['bang'][$doSau - 1];
        $ngu['oDangCo'][] = $ngu['khoi'];
        $ngu['khoi'] = [];
    }

    /**
     * \row, \nestrow: chốt hàng với định nghĩa hàng hiện hành của độ sâu đó.
     *
     * @param  array<string, mixed>  $dinhNghia
     */
    public function ketThucHang(int $doSau, array $dinhNghia): void
    {
        $doSau = $this->chuanDoSau($doSau);
        $this->moBangDen($doSau);
        $this->dongBangSauHon($doSau);
        $ngu = &$this->truyen['bang'][$doSau - 1];

        if ($ngu['khoi'] !== []) {
            $ngu['oDangCo'][] = $ngu['khoi'];
            $ngu['khoi'] = [];
        }

        if ($ngu['oDangCo'] !== []) {
            $ngu['hang'][] = ['dn' => $dinhNghia, 'o' => $ngu['oDangCo']];
            $ngu['oDangCo'] = [];
        }

        $ngu['dnCuoi'] = $dinhNghia;
    }

    /**
     * \sect: chốt section hiện tại (kể cả đầu/chân trang) với định dạng section đã tính. Như Word, \sect kết thúc
     * đoạn đang dở (tạo đoạn trống nếu chưa có chữ).
     *
     * @param  array<string, mixed>  $dinhDangPhan
     * @param  array<string, mixed>  $doanCuoi  paragraphFormat SFDT của đoạn bị \sect kết thúc
     * @param  array<string, mixed>  $dauDoanCuoi  characterFormat SFDT của dấu đoạn đó
     */
    public function ngatPhan(array $dinhDangPhan, array $doanCuoi, array $dauDoanCuoi): void
    {
        while ($this->nganTruyen !== []) {
            $this->ketThucDauChan($doanCuoi, $dauDoanCuoi);
        }

        $this->ketThucDoan($doanCuoi, $dauDoanCuoi, 0);
        $this->sections[] = [
            'blocks' => $this->khoiCuaTruyen($this->truyen, $doanCuoi, $dauDoanCuoi),
            'headersFooters' => (object) $this->dauChan,
            'sectionFormat' => $dinhDangPhan,
        ];
        $this->truyen = self::truyenMoi();
        $this->dauChan = [];
    }

    /**
     * Bắt đầu ghi đầu/chân trang (header, footer, firstPageHeader...).
     */
    public function batDauDauChan(string $loai): void
    {
        $this->nganTruyen[] = ['truyen' => $this->truyen, 'loai' => $loai];
        $this->truyen = self::truyenMoi();
    }

    /**
     * Kết thúc đầu/chân trang: đoạn dở còn chữ thì thành đoạn cuối.
     *
     * @param  array<string, mixed>  $doan
     * @param  array<string, mixed>  $dauDoan
     */
    public function ketThucDauChan(array $doan, array $dauDoan): void
    {
        if ($this->nganTruyen === []) {
            return;
        }

        if ($this->truyen['inlines'] !== []) {
            $this->ketThucDoan($doan, $dauDoan, 0);
        }

        $khoi = $this->khoiCuaTruyen($this->truyen, $doan, $dauDoan);
        ['truyen' => $truyen, 'loai' => $loai] = array_pop($this->nganTruyen);
        $this->truyen = $truyen;
        $this->dauChan[$loai] = ['blocks' => $khoi];
    }

    /**
     * Kết thúc tài liệu.
     *
     * @param  array<string, mixed>  $dinhDangPhan
     * @param  array<string, mixed>  $doanCuoi
     * @param  array<string, mixed>  $dauDoanCuoi
     * @return list<array<string, mixed>>
     */
    public function ketQua(array $dinhDangPhan, array $doanCuoi, array $dauDoanCuoi): array
    {
        while ($this->nganTruyen !== []) {
            $this->ketThucDauChan($doanCuoi, $dauDoanCuoi);
        }

        if ($this->truyen['inlines'] !== []) {
            $this->ketThucDoan($doanCuoi, $dauDoanCuoi, 0);
        }

        $sections = $this->sections;
        $trong = $this->truyen['khoi'] === [] && $this->truyen['bang'] === [];

        if ($trong && $sections !== [] && $this->dauChan === []) {
            // Sau \sect cuối không còn gì: không thêm section rỗng.
            return $sections;
        }

        // Tài liệu không có đoạn nào vẫn có một đoạn trống: .NET trả blocks rỗng và bộ soạn v19 lỗi khi mở.
        $sections[] = [
            'blocks' => $this->khoiCuaTruyen($this->truyen, $doanCuoi, $dauDoanCuoi),
            'headersFooters' => (object) $this->dauChan,
            'sectionFormat' => $dinhDangPhan,
        ];

        return $sections;
    }

    /**
     * Khối đoạn rỗng.
     *
     * @param  array<string, mixed>  $doan
     * @param  array<string, mixed>  $dauDoan
     * @return array<string, mixed>
     */
    public function doanTrong(array $doan, array $dauDoan): array
    {
        return ['characterFormat' => $dauDoan, 'paragraphFormat' => $doan, 'inlines' => []];
    }

    /**
     * Đóng mọi bảng của truyện, trả các khối; luôn kết thúc bằng một đoạn như Word yêu cầu.
     *
     * @param  array<string, mixed>  $truyen
     * @param  array<string, mixed>  $doan
     * @param  array<string, mixed>  $dauDoan
     * @return list<array<string, mixed>>
     */
    private function khoiCuaTruyen(array $truyen, array $doan, array $dauDoan): array
    {
        $luu = $this->truyen;
        $this->truyen = $truyen;
        $this->dongBangSauHon(0);
        $khoi = $this->truyen['khoi'];
        $this->truyen = $luu;

        if ($khoi === [] || isset($khoi[count($khoi) - 1]['rows'])) {
            $khoi[] = $this->doanTrong($doan, $dauDoan);
        }

        return $khoi;
    }

    /**
     * @param  array<string, mixed>  $khoi
     */
    private function datKhoi(array $khoi, int $doSau): void
    {
        $doSau = $doSau > 0 ? $this->chuanDoSau($doSau) : 0;
        $this->dongBangSauHon($doSau);

        if ($doSau === 0) {
            $this->truyen['khoi'][] = $khoi;

            return;
        }

        $this->moBangDen($doSau);
        $this->truyen['bang'][$doSau - 1]['khoi'][] = $khoi;
    }

    private function chuanDoSau(int $doSau): int
    {
        return max(1, min($doSau, self::DO_SAU_TOI_DA));
    }

    private function moBangDen(int $doSau): void
    {
        while (count($this->truyen['bang']) < $doSau) {
            $this->truyen['bang'][] = ['hang' => [], 'oDangCo' => [], 'khoi' => [], 'dnCuoi' => null];
        }
    }

    /**
     * Đóng các bảng sâu hơn $doSau: bảng thành khối của ô cha (hoặc của thân truyện).
     */
    private function dongBangSauHon(int $doSau): void
    {
        while (count($this->truyen['bang']) > $doSau) {
            $ngu = array_pop($this->truyen['bang']);
            $dinhNghia = $ngu['dnCuoi'] ?? BangRtf::hangMoi();

            if ($ngu['khoi'] !== []) {
                $ngu['oDangCo'][] = $ngu['khoi'];
            }

            if ($ngu['oDangCo'] !== []) {
                $ngu['hang'][] = ['dn' => $dinhNghia, 'o' => $ngu['oDangCo']];
            }

            if ($ngu['hang'] === []) {
                continue;
            }

            $doanTrong = $this->doanTrong(
                $this->tn->doan(TaiNguyenRtf::doanMacDinh(), null),
                $this->tn->kyTuDauDoan($this->tn->kyTuMacDinh()),
            );

            foreach ($ngu['hang'] as &$hang) {
                foreach ($hang['o'] as &$o) {
                    if ($o !== [] && isset($o[count($o) - 1]['rows'])) {
                        $o[] = $doanTrong;
                    }
                }
                unset($o);
            }
            unset($hang);

            $bang = BangRtf::dung($ngu['hang'], $this->tn, $doanTrong);
            $cha = count($this->truyen['bang']);

            if ($cha === 0) {
                $this->truyen['khoi'][] = $bang;
            } else {
                $this->truyen['bang'][$cha - 1]['khoi'][] = $bang;
            }
        }
    }
}
