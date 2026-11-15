<?php

namespace App\Services\ChuyenDoi\SfdtRtf;

/**
 * abstractLists và lists của SFDT sang \listtable và \listoverridetable của RTF.
 *
 * Mỗi abstractList là một \list (\listidN với N = abstractListId + 1); mỗi list là một \listoverride với \lsM,
 * M = listId + 1 (RTF bắt đầu từ 1). Đoạn trỏ tới danh sách bằng \lsM\ilvlN.
 */
final class DanhSachSfdt
{
    /**
     * listLevelPattern sang \levelnfc.
     *
     * @var array<string, int>
     */
    private const KIEU_SO = [
        'Arabic' => 0, 'UpRoman' => 1, 'LowRoman' => 2, 'UpLetter' => 3, 'LowLetter' => 4, 'Ordinal' => 5, 'Number' => 6,
        'OrdinalText' => 7, 'LeadingZero' => 22, 'Bullet' => 23, 'None' => 255,
    ];

    /**
     * @param  array<string, mixed>  $sfdt
     */
    public function __construct(
        private readonly array $sfdt,
        private readonly DinhDangRtf $dinhDang,
    ) {}

    /**
     * Số \ls của một listId; null nếu tài liệu không định nghĩa danh sách đó.
     */
    public function soLs(int $listId): ?int
    {
        foreach ($this->sfdt['lists'] ?? [] as $list) {
            if ((int) ($list['listId'] ?? -2) === $listId && $this->abstractList((int) ($list['abstractListId'] ?? -1)) !== null) {
                return $listId + 1;
            }
        }

        return null;
    }

    /**
     * {\*\listtable ...}{\*\listoverridetable ...}; chuỗi rỗng nếu không có danh sách.
     */
    public function bang(): string
    {
        $cacList = array_values(array_filter(
            $this->sfdt['lists'] ?? [],
            fn (mixed $list): bool => is_array($list) && isset($list['listId']) && $this->abstractList((int) ($list['abstractListId'] ?? -1)) !== null,
        ));

        if ($cacList === []) {
            return '';
        }

        $bang = '{\\*\\listtable';

        foreach ($this->sfdt['abstractLists'] ?? [] as $abstractList) {
            if (! isset($abstractList['abstractListId'])) {
                continue;
            }

            $ma = (int) $abstractList['abstractListId'] + 1;
            $bang .= "\n{\\list\\listtemplateid".$ma;
            $cacCap = $abstractList['levels'] ?? [];
            $bang .= count($cacCap) <= 1 ? '\\listsimple1' : '\\listhybrid';

            for ($so = 0; $so < 9; $so++) {
                $bang .= $this->cap($cacCap[$so] ?? null, $so);
            }

            $bang .= '{\\listname ;}\\listid'.$ma.'}';
        }

        $bang .= "}\n{\\*\\listoverridetable";

        foreach ($cacList as $list) {
            $ghiDe = $list['levelOverrides'] ?? [];
            $bang .= "\n{\\listoverride\\listid".((int) $list['abstractListId'] + 1).'\\listoverridecount'.count($ghiDe);

            foreach ($ghiDe as $mot) {
                $bang .= '{\\lfolevel'.(isset($mot['startAt']) ? '\\listoverridestartat\\levelstartat'.(int) $mot['startAt'] : '').'}';
            }

            $bang .= '\\ls'.((int) $list['listId'] + 1).'}';
        }

        return $bang."}\n";
    }

    /**
     * Một \listlevel: kiểu số, số bắt đầu, ký tự theo sau, mẫu số (\leveltext, \levelnumbers), thụt lề và phông.
     *
     * @param  array<string, mixed>|null  $cap
     */
    private function cap(?array $cap, int $so): string
    {
        $cap ??= ['listLevelPattern' => 'Arabic', 'startAt' => 1, 'numberFormat' => '%'.($so + 1).'.'];
        $kieu = (string) ($cap['listLevelPattern'] ?? 'Arabic');
        $nfc = self::KIEU_SO[$kieu] ?? 0;
        $mau = (string) ($cap['numberFormat'] ?? ($kieu === 'Bullet' ? "\u{2022}" : '%'.($so + 1).'.'));
        [$chu, $viTriSo] = $this->mauSo($mau);
        $theoSau = match ($cap['followCharacter'] ?? 'Tab') {
            'Space' => 1,
            'None' => 2,
            default => 0,
        };

        $ketQua = '{\\listlevel\\levelnfc'.$nfc.'\\levelnfcn'.$nfc.'\\leveljc0\\leveljcn0\\levelfollow'.$theoSau
            .'\\levelstartat'.(int) ($cap['startAt'] ?? ($kieu === 'Bullet' ? 1 : 0)).'\\levelspace0\\levelindent0'
            .'{\\leveltext\\\''.sprintf('%02x', $this->doDai($chu)).$chu.';}'
            .'{\\levelnumbers'.implode('', array_map(fn (int $vt): string => '\\\''.sprintf('%02x', $vt), $viTriSo)).';}';

        $doan = is_array($cap['paragraphFormat'] ?? null) ? $cap['paragraphFormat'] : [];
        $ketQua .= $this->dinhDang->doan(array_intersect_key($doan, array_flip(['leftIndent', 'firstLineIndent', 'tabs'])), false);
        $kyTu = is_array($cap['characterFormat'] ?? null) ? $cap['characterFormat'] : [];
        $ketQua .= $this->dinhDang->kyTu($kyTu, false);

        return $ketQua.'}';
    }

    /**
     * Mẫu số "%1.%2." sang nội dung \leveltext (số cấp viết \'0N) và vị trí các số trong chuỗi (\levelnumbers).
     *
     * @return array{0: string, 1: list<int>}
     */
    private function mauSo(string $mau): array
    {
        $chu = '';
        $viTri = [];
        $dem = 0;

        foreach (preg_split('/(%[1-9])/', $mau, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY) as $phan) {
            if (preg_match('/^%([1-9])$/', $phan, $khop)) {
                $chu .= '\\\''.sprintf('%02x', (int) $khop[1] - 1);
                $dem++;
                $viTri[] = $dem;

                continue;
            }

            $chu .= MaRtf::chu($phan);
            $dem += mb_strlen($phan, 'UTF-8');
        }

        return [$chu, $viTri];
    }

    /**
     * Số ký tự của nội dung \leveltext đã mã hóa (mỗi \'NN, \uN? hay ký tự thường là một).
     */
    private function doDai(string $chu): int
    {
        return preg_match_all('/\\\\\'[0-9a-f]{2}|\\\\u-?\d+\?|\\\\[\\\\{}]|\\\\[a-z]+ ?|[^\\\\]/', $chu);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function abstractList(int $ma): ?array
    {
        foreach ($this->sfdt['abstractLists'] ?? [] as $abstractList) {
            if ((int) ($abstractList['abstractListId'] ?? -2) === $ma) {
                return $abstractList;
            }
        }

        return null;
    }
}
