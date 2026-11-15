<?php

namespace App\Services\ChuyenDoi\DoiChieu;

use App\Services\ChuyenDoi\SfdtRtf\KieuSfdt;

/**
 * Chỉ số so khớp của một SFDT: chữ hiển thị từng đoạn (chuẩn hóa khoảng trắng), căn lề, các đoạn định dạng
 * (đậm, nghiêng, gạch chân, cỡ chữ) và số đoạn, bảng, hàng, ô, ảnh, trường, mục danh sách.
 *
 * Dùng để đối chiếu bộ chuyển đổi PHP với dịch vụ .NET; định dạng tính theo giá trị hiệu lực (kiểu + trực tiếp)
 * nên hai SFDT ghi khác nhau nhưng hiển thị như nhau vẫn khớp.
 */
final class ChiSoSfdt
{
    /**
     * Số lượng theo loại: doan, bang, hang, o, anh, truong, mucDanhSach.
     *
     * @var array<string, int>
     */
    public array $dem = ['doan' => 0, 'bang' => 0, 'hang' => 0, 'o' => 0, 'anh' => 0, 'truong' => 0, 'mucDanhSach' => 0];

    /**
     * Đoạn theo vùng (than, header, footer...): chữ, căn lề, các đoạn định dạng.
     *
     * @var array<string, list<array{chu: string, canh: string, dinhDang: list<string>}>>
     */
    public array $vung = [];

    private KieuSfdt $kieu;

    /**
     * Danh sách có định nghĩa (listId).
     *
     * @var array<int, true>
     */
    private array $listCo = [];

    /**
     * @param  array<string, mixed>  $sfdt
     */
    public function __construct(array $sfdt)
    {
        $this->kieu = new KieuSfdt($sfdt);

        foreach ($sfdt['lists'] ?? [] as $list) {
            $this->listCo[(int) ($list['listId'] ?? -1)] = true;
        }

        foreach ($sfdt['sections'] ?? [] as $section) {
            $this->khoi($section['blocks'] ?? [], 'than', true);

            foreach (['header', 'footer', 'evenHeader', 'evenFooter', 'firstPageHeader', 'firstPageFooter'] as $khoa) {
                if (isset($section['headersFooters'][$khoa]['blocks'])) {
                    $this->khoi($section['headersFooters'][$khoa]['blocks'], $khoa, false);
                }
            }
        }
    }

    public static function tuJson(string $json): ?self
    {
        $sfdt = json_decode($json, true, 1024);

        return is_array($sfdt) && isset($sfdt['sections']) ? new self($sfdt) : null;
    }

    /**
     * Các loại khác biệt giữa hai bộ chỉ số (rỗng là khớp). Không chứa nội dung văn bản.
     *
     * @return array{chu: list<string>, cauTruc: list<string>, dinhDang: list<string>}
     */
    public function soVoi(self $khac): array
    {
        $ketQua = ['chu' => [], 'cauTruc' => [], 'dinhDang' => []];

        foreach ($this->dem as $loai => $so) {
            if ($so !== $khac->dem[$loai]) {
                $ketQua['cauTruc'][] = 'so-'.$loai;
            }
        }

        foreach (array_unique([...array_keys($this->vung), ...array_keys($khac->vung)]) as $vung) {
            $a = $this->vung[$vung] ?? [];
            $b = $khac->vung[$vung] ?? [];

            if (array_column($a, 'chu') !== array_column($b, 'chu')) {
                $ketQua['chu'][] = 'chu-'.$vung;

                continue;
            }

            foreach ($a as $i => $doan) {
                if ($doan['canh'] !== $b[$i]['canh']) {
                    $ketQua['dinhDang'][] = 'can-le';
                }

                foreach ($this->khacDinhDang($doan['dinhDang'], $b[$i]['dinhDang']) as $loai) {
                    $ketQua['dinhDang'][] = $loai;
                }
            }
        }

        return array_map(fn (array $ds): array => array_values(array_unique($ds)), $ketQua);
    }

    /**
     * @param  list<mixed>  $khoi
     */
    private function khoi(array $khoi, string $vung, bool $dem): void
    {
        foreach ($khoi as $mot) {
            if (! is_array($mot)) {
                continue;
            }

            if (isset($mot['rows'])) {
                $this->dem['bang']++;

                foreach ($mot['rows'] as $hang) {
                    $this->dem['hang']++;

                    foreach ($hang['cells'] ?? [] as $o) {
                        $this->dem['o']++;
                        $this->khoi($o['blocks'] ?? [], $vung, $dem);
                    }
                }
            } elseif (isset($mot['inlines'])) {
                $this->doan($mot, $vung, $dem);
            } elseif (isset($mot['blocks'])) {
                $this->khoi($mot['blocks'], $vung, $dem);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $khoi
     */
    private function doan(array $khoi, string $vung, bool $dem): void
    {
        $doan = $this->kieu->doan(is_array($khoi['paragraphFormat'] ?? null) ? $khoi['paragraphFormat'] : null);
        $tenKieu = (string) $doan['styleName'];
        $chu = '';
        $dinhDang = [];
        $trongMaTruong = 0;

        foreach ($this->trai($khoi['inlines'] ?? []) as $inline) {
            if (isset($inline['fieldType'])) {
                $loai = (int) $inline['fieldType'];
                $trongMaTruong += $loai === 0 ? 1 : ($loai === 2 || $loai === 1 ? -1 : 0);
                $trongMaTruong = max(0, $trongMaTruong);
                $this->dem['truong'] += $loai === 0 ? 1 : 0;

                continue;
            }

            if (isset($inline['imageString'])) {
                $this->dem['anh']++;

                continue;
            }

            if (! isset($inline['text']) || $trongMaTruong > 0) {
                continue;
            }

            $chuInline = preg_replace('/[\x00-\x08\x0E-\x1F]/', '', (string) $inline['text']);
            $kyTu = $this->kieu->kyTu(is_array($inline['characterFormat'] ?? null) ? $inline['characterFormat'] : null, $tenKieu);
            $ma = (! empty($kyTu['bold']) ? 'B' : '-').(! empty($kyTu['italic']) ? 'I' : '-')
                .(($kyTu['underline'] ?? 'None') !== 'None' ? 'U' : '-').round((float) ($kyTu['fontSize'] ?? 11) * 2) / 2;

            // Định dạng chỉ tính trên ký tự nhìn thấy (khoảng trắng mang định dạng nào cũng như nhau).
            foreach (preg_split('//u', $chuInline, -1, PREG_SPLIT_NO_EMPTY) as $kyTuChu) {
                if (trim($kyTuChu, " \t\n\r\v\f\u{A0}") !== '') {
                    $dinhDang[] = $ma;
                }
            }

            $chu .= $chuInline;
        }

        $this->vung[$vung][] = [
            'chu' => trim(preg_replace('/[\s\x{A0}]+/u', ' ', $chu)),
            'canh' => (string) ($doan['textAlignment'] ?? 'Left'),
            'dinhDang' => $this->gopDoan($dinhDang),
        ];

        if ($dem) {
            $this->dem['doan']++;
        }

        if (($doan['listFormat']['listId'] ?? -1) >= 0 && isset($this->listCo[(int) $doan['listFormat']['listId']])) {
            $this->dem['mucDanhSach']++;
        }
    }

    /**
     * Gỡ lớp bao inline (contentControlProperties).
     *
     * @param  list<mixed>  $inlines
     * @return list<array<string, mixed>>
     */
    private function trai(array $inlines): array
    {
        $ketQua = [];

        foreach ($inlines as $inline) {
            if (is_array($inline) && isset($inline['inlines']) && is_array($inline['inlines'])) {
                array_push($ketQua, ...$this->trai($inline['inlines']));
            } elseif (is_array($inline)) {
                $ketQua[] = $inline;
            }
        }

        return $ketQua;
    }

    /**
     * Mã định dạng từng ký tự gộp thành các đoạn "mã×số ký tự".
     *
     * @param  list<string>  $ma
     * @return list<string>
     */
    private function gopDoan(array $ma): array
    {
        $ketQua = [];
        $truoc = null;
        $so = 0;

        foreach ($ma as $mot) {
            if ($mot !== $truoc && $truoc !== null) {
                $ketQua[] = $truoc.'x'.$so;
                $so = 0;
            }

            $truoc = $mot;
            $so++;
        }

        if ($truoc !== null) {
            $ketQua[] = $truoc.'x'.$so;
        }

        return $ketQua;
    }

    /**
     * Loại khác biệt định dạng giữa hai dãy đoạn định dạng: dam, nghieng, gach-chan, co-chu.
     *
     * @param  list<string>  $a
     * @param  list<string>  $b
     * @return list<string>
     */
    private function khacDinhDang(array $a, array $b): array
    {
        if ($a === $b) {
            return [];
        }

        $moRong = function (array $doan): array {
            $kq = [];
            foreach ($doan as $mot) {
                [$ma, $so] = explode('x', $mot);
                array_push($kq, ...array_fill(0, (int) $so, $ma));
            }

            return $kq;
        };

        $x = $moRong($a);
        $y = $moRong($b);
        $ketQua = [];

        foreach ($x as $i => $ma) {
            $khac = $y[$i] ?? '';

            if ($ma === $khac) {
                continue;
            }

            foreach (['dam' => 0, 'nghieng' => 1, 'gach-chan' => 2] as $loai => $viTri) {
                if (($ma[$viTri] ?? '') !== ($khac[$viTri] ?? '')) {
                    $ketQua[$loai] = true;
                }
            }

            if (substr($ma, 3) !== substr($khac, 3)) {
                $ketQua['co-chu'] = true;
            }
        }

        return array_keys($ketQua);
    }
}
