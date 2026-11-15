<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMDocument;
use DOMElement;

/**
 * Đánh số (numbering.xml): w:abstractNum thành abstractLists, w:num thành lists của SFDT.
 *
 * Như dịch vụ .NET: abstractListId là thứ tự của w:abstractNum trong file; w:num không ghi đè cấp nào dùng chung
 * listId với abstractList của nó, w:num có w:lvlOverride được listId mới (đếm tiếp sau số abstractNum); mỗi
 * abstractList đủ 9 cấp; chỉ ghi các danh sách có đoạn hoặc kiểu dùng tới.
 */
final class DanhSachDocx
{
    /**
     * w:numFmt sang listLevelPattern.
     *
     * @var array<string, string>
     */
    private const KIEU_SO = [
        'decimal' => 'Arabic', 'upperRoman' => 'UpRoman', 'lowerRoman' => 'LowRoman', 'upperLetter' => 'UpLetter',
        'lowerLetter' => 'LowLetter', 'ordinal' => 'Ordinal', 'cardinalText' => 'Number', 'ordinalText' => 'OrdinalText',
        'decimalZero' => 'LeadingZero', 'bullet' => 'Bullet', 'none' => 'None',
    ];

    /**
     * Các w:abstractNum theo thứ tự trong file.
     *
     * @var list<DOMElement>
     */
    private array $truuTuong = [];

    /**
     * w:num theo numId: listId, abstractListId và các phần tử w:lvlOverride.
     *
     * @var array<int, array{listId: int, abstractListId: int, ghiDe: list<DOMElement>}>
     */
    private array $theoMa = [];

    /**
     * listId đã được dùng.
     *
     * @var array<int, int>
     */
    private array $daDung = [];

    public function __construct(private readonly NguCanhDocx $nguCanh, ?DOMDocument $xml)
    {
        $cacNum = [];
        $chiSoTheoMa = [];

        foreach ($xml?->documentElement->childNodes ?? [] as $nut) {
            if (! $nut instanceof DOMElement) {
                continue;
            }

            if ($nut->localName === 'abstractNum') {
                $chiSoTheoMa[(string) DonVi::thuocTinh($nut, 'abstractNumId')] = count($this->truuTuong);
                $this->truuTuong[] = $nut;
            } elseif ($nut->localName === 'num') {
                $cacNum[] = $nut;
            }
        }

        $maMoi = count($this->truuTuong);

        foreach ($cacNum as $num) {
            $maTruuTuong = $this->dd()->conTen($num, 'abstractNumId');
            $chiSo = $maTruuTuong === null ? null : ($chiSoTheoMa[(string) $this->dd()->val($maTruuTuong)] ?? null);

            if ($chiSo === null) {
                continue;
            }

            $ghiDe = array_values(array_filter($this->dd()->con($num), fn (DOMElement $con): bool => $con->localName === 'lvlOverride'));
            $this->theoMa[(int) DonVi::thuocTinh($num, 'numId')] = [
                'listId' => $ghiDe === [] ? $chiSo : $maMoi++,
                'abstractListId' => $chiSo,
                'ghiDe' => $ghiDe,
            ];
        }
    }

    /**
     * listId của SFDT cho numId của DOCX; numId 0 hoặc không có là -1 (bỏ đánh số).
     */
    public function maList(int $numId): int
    {
        if (! isset($this->theoMa[$numId])) {
            return -1;
        }

        $num = $this->theoMa[$numId];
        $this->daDung[$num['listId']] = $numId;

        return $num['listId'];
    }

    /**
     * lists của SFDT (chỉ danh sách đã dùng, theo listId).
     *
     * @return list<array<string, mixed>>
     */
    public function cacList(): array
    {
        $ketQua = [];
        ksort($this->daDung);

        foreach ($this->daDung as $listId => $numId) {
            $num = $this->theoMa[$numId];
            $mot = ['listId' => $listId, 'abstractListId' => $num['abstractListId']];
            $ghiDe = [];

            foreach ($num['ghiDe'] as $phanTu) {
                $capGhiDe = [];
                $batDau = $this->dd()->conTen($phanTu, 'startOverride');
                $cap = $this->dd()->conTen($phanTu, 'lvl');

                if ($cap !== null) {
                    $capGhiDe = $this->cap($cap, (int) DonVi::thuocTinh($phanTu, 'ilvl'));
                }

                if ($batDau !== null) {
                    $capGhiDe['startAt'] = (int) $this->dd()->val($batDau);
                }

                $capGhiDe['levelNumber'] = (int) DonVi::thuocTinh($phanTu, 'ilvl');
                $ghiDe[] = $capGhiDe;
            }

            if ($ghiDe !== []) {
                $mot['levelOverrides'] = $ghiDe;
            }

            $ketQua[] = $mot;
        }

        return $ketQua;
    }

    /**
     * abstractLists của SFDT (chỉ các abstractList mà danh sách đã dùng trỏ tới).
     *
     * @return list<array<string, mixed>>
     */
    public function cacAbstractList(): array
    {
        $dung = [];

        foreach ($this->daDung as $numId) {
            $dung[$this->theoMa[$numId]['abstractListId']] = true;
        }

        ksort($dung);
        $ketQua = [];

        foreach (array_keys($dung) as $chiSo) {
            $cacCap = [];

            foreach ($this->dd()->con($this->nguonCap($this->truuTuong[$chiSo])) as $lvl) {
                if ($lvl->localName === 'lvl') {
                    $so = (int) DonVi::thuocTinh($lvl, 'ilvl');
                    if ($so >= 0 && $so < 9 && ! isset($cacCap[$so])) {
                        $cacCap[$so] = $this->cap($lvl, $so);
                    }
                }
            }

            $levels = [];
            for ($so = 0; $so < 9; $so++) {
                $levels[] = $cacCap[$so] ?? ['startAt' => 0, 'restartLevel' => $so, 'listLevelPattern' => 'Arabic', 'followCharacter' => 'Tab'];
            }

            $ketQua[] = ['abstractListId' => $chiSo, 'levels' => $levels];
        }

        return $ketQua;
    }

    /**
     * Một cấp (w:lvl) của danh sách.
     *
     * @return array<string, mixed>
     */
    private function cap(DOMElement $lvl, int $so): array
    {
        $dinhDang = $this->dd()->conTen($lvl, 'numFmt');
        $kieu = $dinhDang === null ? 'Arabic' : (self::KIEU_SO[(string) $this->dd()->val($dinhDang)] ?? 'Arabic');

        if ($this->dd()->conTen($lvl, 'lvlPicBulletId') !== null) {
            $kieu = 'Bullet';
        }

        $ketQua = [];

        if ($kieu !== 'Bullet') {
            $batDau = $this->dd()->conTen($lvl, 'start');
            $khoiLai = $this->dd()->conTen($lvl, 'lvlRestart');
            $ketQua['startAt'] = $batDau === null ? 0 : (int) $this->dd()->val($batDau);
            $ketQua['restartLevel'] = $khoiLai === null ? $so : max(0, (int) $this->dd()->val($khoiLai) - 1);
        }

        $ketQua['listLevelPattern'] = $kieu;
        $ketQua['followCharacter'] = match (($hauTo = $this->dd()->conTen($lvl, 'suff')) === null ? 'tab' : $this->dd()->val($hauTo)) {
            'space' => 'Space',
            'nothing' => 'None',
            default => 'Tab',
        };

        // Cấp đánh số mà mẫu không chứa số của chính cấp đó (%n+1) thì .NET không ghi numberFormat.
        $chu = $this->dd()->conTen($lvl, 'lvlText');
        $mau = $chu === null ? null : (string) $this->dd()->val($chu);
        if ($mau !== null && ($kieu === 'Bullet' || $kieu === 'None' || str_contains($mau, '%'.($so + 1)))) {
            $ketQua['numberFormat'] = $mau;
        }

        $kyTu = $this->dd()->kyTu($this->dd()->conTen($lvl, 'rPr'));
        if ($kyTu !== []) {
            $ketQua['characterFormat'] = $kyTu;
        }

        $doan = $this->dd()->doan($this->dd()->conTen($lvl, 'pPr'));
        unset($doan['styleName'], $doan['listFormat']);
        if ($doan !== []) {
            $ketQua['paragraphFormat'] = $doan;
        }

        return $ketQua;
    }

    /**
     * abstractNum chỉ trỏ tới kiểu danh sách (w:numStyleLink) lấy các cấp của abstractNum định nghĩa kiểu đó (w:styleLink).
     */
    private function nguonCap(DOMElement $truuTuong): DOMElement
    {
        $lienKet = $this->dd()->conTen($truuTuong, 'numStyleLink');

        if ($lienKet === null || $this->dd()->conTen($truuTuong, 'lvl') !== null) {
            return $truuTuong;
        }

        foreach ($this->truuTuong as $khac) {
            $dinhNghia = $this->dd()->conTen($khac, 'styleLink');
            if ($dinhNghia !== null && $this->dd()->val($dinhNghia) === $this->dd()->val($lienKet)) {
                return $khac;
            }
        }

        return $truuTuong;
    }

    private function dd(): DinhDangDocx
    {
        return $this->nguCanh->dinhDang;
    }
}
