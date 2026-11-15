<?php

namespace App\Services\ChuyenDoi\Rtf;

/**
 * Danh sách đánh số/gạch đầu dòng: \listtable (mỗi \list thành một abstractList) và \listoverridetable
 * (mỗi \listoverride thành một list, \lsN của đoạn trỏ tới list đó).
 */
final class DanhSachRtf
{
    /**
     * \levelnfcN sang listLevelPattern của SFDT.
     *
     * @var array<int, string>
     */
    private const KIEU_SO = [
        0 => 'Arabic', 1 => 'UpRoman', 2 => 'LowRoman', 3 => 'UpLetter', 4 => 'LowLetter', 5 => 'Ordinal', 6 => 'Number',
        7 => 'OrdinalText', 22 => 'LeadingZero', 23 => 'Bullet', 255 => 'None',
    ];

    /**
     * Các \list theo thứ tự xuất hiện.
     *
     * @var list<array{id: ?int, muc: list<array<string, mixed>>}>
     */
    public array $danhSach = [];

    /**
     * Các \listoverride theo thứ tự xuất hiện.
     *
     * @var list<array{listId: ?int, ls: ?int}>
     */
    public array $ghiDe = [];

    /**
     * Mức đang đọc (trong {\listlevel ...}).
     *
     * @var array<string, mixed>
     */
    public array $mucDangDoc = [];

    /**
     * \lsN sang listId SFDT.
     *
     * @var array<int, int>|null
     */
    private ?array $theoLs = null;

    /**
     * Mức danh sách mới: nfc (\levelnfc), follow (\levelfollow), start (\levelstartat), text (các mẩu \leveltext:
     * ['b', byte] hoặc ['c', chữ]), kt và pd (định dạng khai báo trong mức).
     *
     * @return array{nfc: int, follow: int, start: int, text: list<array{string, int|string}>, kt: array<string, mixed>, pd: array<string, mixed>}
     */
    public static function mucMoi(): array
    {
        return ['nfc' => 0, 'follow' => 0, 'start' => 1, 'text' => [], 'kt' => [], 'pd' => []];
    }

    /**
     * listId SFDT của \lsN, null nếu không có.
     */
    public function listId(?int $ls): ?int
    {
        if ($ls === null) {
            return null;
        }

        return $this->bangLs()[$ls] ?? null;
    }

    public function coDanhSach(): bool
    {
        return $this->bangLs() !== [];
    }

    /**
     * Như .NET: mỗi \listoverride có list và abstractList riêng (chép mức của \list nó trỏ tới), nên mỗi \lsN
     * đánh số độc lập.
     *
     * @return array{lists: list<array<string, int>>, abstractLists: list<array<string, mixed>>}
     */
    public function sfdt(TaiNguyenRtf $tn): array
    {
        $lists = [];
        $abstractLists = [];
        $daDung = [];

        foreach ($this->ghiDe as $gd) {
            $chiSoDs = $this->chiSoDanhSach($gd['listId']);

            if ($gd['ls'] === null || $chiSoDs === null || isset($daDung[$gd['ls']])) {
                continue;
            }

            $daDung[$gd['ls']] = true;
            $ds = $this->danhSach[$chiSoDs];
            $levels = [];

            for ($muc = 0; $muc < 9; $muc++) {
                $levels[] = isset($ds['muc'][$muc])
                    ? $this->mucSfdt($ds['muc'][$muc], $muc, $tn)
                    : $this->mucMacDinh($muc, ($ds['muc'][0]['nfc'] ?? 0) === 23);
            }

            $id = count($lists);
            $lists[] = ['listId' => $id, 'abstractListId' => $id];
            $abstractLists[] = ['abstractListId' => $id, 'levels' => $levels];
        }

        return ['lists' => $lists, 'abstractLists' => $abstractLists];
    }

    /**
     * \lsN sang listId, cùng thứ tự với sfdt().
     *
     * @return array<int, int>
     */
    private function bangLs(): array
    {
        if ($this->theoLs !== null) {
            return $this->theoLs;
        }

        $this->theoLs = [];

        foreach ($this->ghiDe as $gd) {
            if ($gd['ls'] !== null && ! isset($this->theoLs[$gd['ls']]) && $this->chiSoDanhSach($gd['listId']) !== null) {
                $this->theoLs[$gd['ls']] = count($this->theoLs);
            }
        }

        return $this->theoLs;
    }

    private function chiSoDanhSach(?int $listId): ?int
    {
        foreach ($this->danhSach as $chiSo => $ds) {
            if ($ds['id'] === $listId) {
                return $chiSo;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $muc
     * @return array<string, mixed>
     */
    private function mucSfdt(array $muc, int $soMuc, TaiNguyenRtf $tn): array
    {
        $kieu = self::KIEU_SO[$muc['nfc']] ?? 'Arabic';
        $sfdt = [];

        if ($kieu !== 'Bullet') {
            $sfdt['startAt'] = (int) $muc['start'];
            $sfdt['restartLevel'] = $soMuc;
        }

        $sfdt['listLevelPattern'] = $kieu;
        $sfdt['followCharacter'] = match ((int) $muc['follow']) {
            1 => 'Space',
            2 => 'None',
            default => 'Tab',
        };
        $sfdt['numberFormat'] = $this->dangSo($muc, $tn);

        $kt = $muc['kt'];
        $ktSfdt = [];

        if (isset($kt['b'])) {
            $ktSfdt['bold'] = (bool) $kt['b'];
        }

        if (isset($kt['i'])) {
            $ktSfdt['italic'] = (bool) $kt['i'];
        }

        if (array_key_exists('ul', $kt) && $kt['ul'] !== null) {
            $ktSfdt['underline'] = $kt['ul'];
        }

        if (isset($kt['st'])) {
            $ktSfdt['strikethrough'] = $kt['st'];
        }

        if (isset($kt['fs'])) {
            $ktSfdt['fontSize'] = round($kt['fs'] / 2, 2);
        }

        if (array_key_exists('f', $kt)) {
            $ktSfdt['fontFamily'] = $tn->tenPhong($kt['f']);
        }

        if (array_key_exists('cf', $kt)) {
            $ktSfdt['fontColor'] = $tn->mauHex($kt['cf']);
        }

        $sfdt['characterFormat'] = $ktSfdt;

        $pd = $muc['pd'];
        $pdSfdt = ['leftIndent' => TaiNguyenRtf::diem($pd['li'] ?? 0), 'firstLineIndent' => TaiNguyenRtf::diem($pd['fi'] ?? 0)];
        // .NET luôn ghi một tab trái ở 0 cho mức danh sách (không ảnh hưởng vị trí số).
        $pdSfdt['tabs'] = TaiNguyenRtf::tabs(! empty($pd['tabs']) ? $pd['tabs'] : [[0, 'Left', 'None']]);

        $sfdt['paragraphFormat'] = $pdSfdt;

        return $sfdt;
    }

    /**
     * Chuỗi \leveltext thành numberFormat: byte đầu là độ dài, byte 0..8 là chỗ số của mức tương ứng (%1..%9).
     *
     * @param  array<string, mixed>  $muc
     */
    private function dangSo(array $muc, TaiNguyenRtf $tn): string
    {
        $phan = $muc['text'];

        if ($phan === []) {
            return '';
        }

        $doDai = null;

        if ($phan[0][0] === 'b') {
            $doDai = $phan[0][1];
            array_shift($phan);
        }

        $ketQua = '';
        $dem = 0;
        $maTrang = $tn->maTrangCuaPhong($muc['kt']['f'] ?? null);
        $kyTu = [];

        foreach ($phan as [$loai, $giaTri]) {
            if ($loai === 'b') {
                $kyTu[] = $giaTri < 9 ? '%'.($giaTri + 1) : GiaiMa::sangUtf8(chr($giaTri), $maTrang);
            } else {
                array_push($kyTu, ...mb_str_split($giaTri, 1, 'UTF-8'));
            }
        }

        foreach ($kyTu as $mot) {
            if ($doDai !== null && $dem >= $doDai) {
                break;
            }

            $dem++;
            $ketQua .= $mot;
        }

        return $doDai === null ? rtrim($ketQua, ';') : $ketQua;
    }

    /**
     * Mức .NET tự thêm cho đủ 9 mức.
     *
     * @return array<string, mixed>
     */
    private function mucMacDinh(int $soMuc, bool $gachDauDong): array
    {
        $thut = ['leftIndent' => 36.0 * ($soMuc + 1)];

        if ($gachDauDong) {
            [$kyTu, $phong] = [["\u{F0B7}", 'Symbol'], ['o', 'Courier New'], ["\u{F0A7}", 'Wingdings']][$soMuc % 3];

            return [
                'listLevelPattern' => 'Bullet', 'followCharacter' => 'Tab', 'numberFormat' => $kyTu,
                'characterFormat' => ['fontFamily' => $phong], 'paragraphFormat' => $thut,
            ];
        }

        return [
            'startAt' => 1, 'restartLevel' => $soMuc, 'listLevelPattern' => ['Arabic', 'LowLetter', 'LowRoman'][$soMuc % 3],
            'followCharacter' => 'Tab', 'numberFormat' => '%'.($soMuc + 1).'.', 'paragraphFormat' => $thut,
        ];
    }
}
