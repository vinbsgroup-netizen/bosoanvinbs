<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * Tính định dạng hiệu lực của SFDT như bộ soạn: mặc định tài liệu, kiểu đoạn (theo basedOn), cấp danh sách,
 * kiểu ký tự rồi định dạng trực tiếp. RTF ghi định dạng hiệu lực tường minh để mọi bộ đọc RTF hiển thị như nhau.
 */
final class KieuSfdt
{
    /**
     * Mặc định của bộ soạn khi tài liệu không khai báo.
     *
     * @var array<string, mixed>
     */
    public const KY_TU_MAC_DINH = [
        'bold' => false, 'italic' => false, 'underline' => 'None', 'strikethrough' => 'None', 'baselineAlignment' => 'Normal',
        'highlightColor' => 'NoColor', 'fontSize' => 11.0, 'fontFamily' => 'Calibri', 'fontColor' => '#00000000',
        'allCaps' => false, 'bidi' => false,
    ];

    /**
     * @var array<string, mixed>
     */
    public const DOAN_MAC_DINH = [
        'leftIndent' => 0.0, 'rightIndent' => 0.0, 'firstLineIndent' => 0.0, 'textAlignment' => 'Left', 'beforeSpacing' => 0.0,
        'afterSpacing' => 0.0, 'lineSpacing' => 1.0, 'lineSpacingType' => 'Multiple', 'outlineLevel' => 'BodyText',
        'contextualSpacing' => false, 'bidi' => false,
    ];

    /**
     * Kiểu theo tên và loại ("Paragraph", "Character").
     *
     * @var array<string, array<string, mixed>>
     */
    private array $kieu = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $boNhoKyTu = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $boNhoDoan = [];

    /**
     * Danh sách theo listId và abstractList theo abstractListId.
     *
     * @var array<int, array<string, mixed>>
     */
    private array $list = [];

    /**
     * @var array<int, array<string, mixed>>
     */
    private array $abstractList = [];

    /**
     * @param  array<string, mixed>  $sfdt
     */
    public function __construct(private readonly array $sfdt)
    {
        foreach ($sfdt['styles'] ?? [] as $kieu) {
            if (is_array($kieu) && isset($kieu['name'])) {
                $this->kieu[($kieu['type'] ?? 'Paragraph').'|'.$kieu['name']] ??= $kieu;
            }
        }

        foreach ($sfdt['lists'] ?? [] as $list) {
            if (isset($list['listId'])) {
                $this->list[(int) $list['listId']] = $list;
            }
        }

        foreach ($sfdt['abstractLists'] ?? [] as $abstractList) {
            if (isset($abstractList['abstractListId'])) {
                $this->abstractList[(int) $abstractList['abstractListId']] = $abstractList;
            }
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function cacKieu(): array
    {
        return $this->kieu;
    }

    /**
     * Kiểu theo tên, ưu tiên loại cho trước.
     *
     * @return array<string, mixed>|null
     */
    public function kieu(?string $ten, string $loai): ?array
    {
        if ($ten === null) {
            return null;
        }

        return $this->kieu[$loai.'|'.$ten] ?? $this->kieu[($loai === 'Paragraph' ? 'Character' : 'Paragraph').'|'.$ten] ?? null;
    }

    /**
     * characterFormat hiệu lực của một inline (hoặc dấu đoạn) trong đoạn có kiểu cho trước.
     *
     * @param  array<string, mixed>|null  $kyTu
     * @return array<string, mixed>
     */
    public function kyTu(?array $kyTu, ?string $kieuDoan): array
    {
        $kyTu ??= [];
        $kieuKyTu = $kyTu['styleName'] ?? null;
        $khoa = ($kieuDoan ?? '').'|'.($kieuKyTu ?? '');

        if (! isset($this->boNhoKyTu[$khoa])) {
            $nen = array_merge(self::KY_TU_MAC_DINH, $this->locNull($this->sfdt['characterFormat'] ?? []));

            foreach ($this->chuoi($kieuDoan, 'Paragraph') as $kieu) {
                $nen = array_merge($nen, $this->locNull($kieu['characterFormat'] ?? []));
            }

            foreach ($this->chuoi($kieuKyTu, 'Character') as $kieu) {
                $nen = array_merge($nen, $this->locNull($kieu['characterFormat'] ?? []));
            }

            unset($nen['styleName']);
            $this->boNhoKyTu[$khoa] = $nen;
        }

        $ketQua = array_merge($this->boNhoKyTu[$khoa], $this->locNull($kyTu));
        unset($ketQua['styleName']);

        return $ketQua;
    }

    /**
     * paragraphFormat hiệu lực: mặc định, kiểu đoạn, cấp danh sách, trực tiếp. Tab gộp theo vị trí.
     *
     * @param  array<string, mixed>|null  $doan
     * @return array<string, mixed>
     */
    public function doan(?array $doan): array
    {
        $doan ??= [];
        $tenKieu = $doan['styleName'] ?? 'Normal';

        if (! isset($this->boNhoDoan[$tenKieu])) {
            $nen = array_merge(self::DOAN_MAC_DINH, $this->locNull($this->sfdt['paragraphFormat'] ?? []));
            $tabs = [];
            $danhSach = [];

            foreach ($this->chuoi($tenKieu, 'Paragraph') as $kieu) {
                $dinhDang = $this->locNull($kieu['paragraphFormat'] ?? []);
                $tabs = $this->gopTab($tabs, $dinhDang['tabs'] ?? []);
                $danhSach = array_merge($danhSach, $this->locNull($dinhDang['listFormat'] ?? []));
                unset($dinhDang['tabs'], $dinhDang['listFormat']);
                $nen = array_merge($nen, $dinhDang);
            }

            $nen['tabs'] = $tabs;
            $nen['listFormat'] = $danhSach;
            $this->boNhoDoan[$tenKieu] = $nen;
        }

        $ketQua = $this->boNhoDoan[$tenKieu];
        $truc = $this->locNull($doan);
        $danhSach = array_merge($ketQua['listFormat'], $this->locNull($truc['listFormat'] ?? []));
        $cap = $this->capDanhSach($danhSach);

        if ($cap !== null) {
            $dinhDangCap = $this->locNull($cap['paragraphFormat'] ?? []);
            unset($dinhDangCap['tabs'], $dinhDangCap['listFormat'], $dinhDangCap['styleName']);
            $ketQua = array_merge($ketQua, $dinhDangCap);
        }

        $tabs = $this->gopTab($ketQua['tabs'], $truc['tabs'] ?? []);
        unset($truc['tabs'], $truc['listFormat']);
        $ketQua = array_merge($ketQua, $truc);
        $ketQua['tabs'] = $tabs;
        $ketQua['listFormat'] = $danhSach;
        $ketQua['styleName'] = $tenKieu;

        return $ketQua;
    }

    /**
     * Cấp danh sách của listFormat (abstractList, áp levelOverrides), null nếu không thuộc danh sách.
     *
     * @param  array<string, mixed>  $danhSach
     * @return array<string, mixed>|null
     */
    public function capDanhSach(array $danhSach): ?array
    {
        $listId = (int) ($danhSach['listId'] ?? -1);
        $so = (int) ($danhSach['listLevelNumber'] ?? 0);
        $list = $this->list[$listId] ?? null;

        if ($list === null) {
            return null;
        }

        $cap = $this->abstractList[(int) ($list['abstractListId'] ?? -1)]['levels'][$so] ?? null;

        foreach ($list['levelOverrides'] ?? [] as $ghiDe) {
            if ((int) ($ghiDe['levelNumber'] ?? -1) === $so) {
                $cap = array_merge($cap ?? [], $ghiDe);
            }
        }

        return $cap;
    }

    /**
     * Chuỗi kiểu từ gốc tới kiểu cho trước (theo basedOn), gốc trước.
     *
     * @return list<array<string, mixed>>
     */
    private function chuoi(?string $ten, string $loai): array
    {
        $ketQua = [];
        $daGap = [];

        while ($ten !== null && ! isset($daGap[$ten]) && ($kieu = $this->kieu($ten, $loai)) !== null) {
            $daGap[$ten] = true;
            array_unshift($ketQua, $kieu);
            $ten = $kieu['basedOn'] ?? null;
        }

        return $ketQua;
    }

    /**
     * Gộp tab: tab mới thêm hoặc thay theo vị trí, tab có deletePosition xóa tab ở vị trí đó.
     *
     * @param  list<array<string, mixed>>  $cu
     * @param  list<array<string, mixed>>  $moi
     * @return list<array<string, mixed>>
     */
    private function gopTab(array $cu, array $moi): array
    {
        $theoViTri = [];

        foreach ($cu as $tab) {
            $theoViTri[(string) round((float) ($tab['position'] ?? 0), 2)] = $tab;
        }

        foreach ($moi as $tab) {
            $xoa = (float) ($tab['deletePosition'] ?? 0);

            if ($xoa > 0) {
                unset($theoViTri[(string) round($xoa, 2)]);
            }

            if ((float) ($tab['position'] ?? 0) > 0 || $xoa <= 0) {
                $theoViTri[(string) round((float) ($tab['position'] ?? 0), 2)] = $tab;
            }
        }

        ksort($theoViTri, SORT_NUMERIC);

        return array_values(array_filter($theoViTri, fn (array $tab): bool => (float) ($tab['position'] ?? 0) > 0 || ($tab['tabJustification'] ?? '') === 'List'));
    }

    /**
     * Bỏ các khóa có giá trị null.
     *
     * @param  array<string, mixed>  $mang
     * @return array<string, mixed>
     */
    private function locNull(mixed $mang): array
    {
        return is_array($mang) ? array_filter($mang, fn (mixed $giaTri): bool => $giaTri !== null) : [];
    }
}
