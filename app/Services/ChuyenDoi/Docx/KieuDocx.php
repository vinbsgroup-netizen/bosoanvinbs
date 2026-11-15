<?php

namespace App\Services\ChuyenDoi\Docx;

use DOMDocument;
use DOMElement;

/**
 * Kiểu (styles.xml): docDefaults thành định dạng mặc định của tài liệu; kiểu đoạn và kiểu ký tự thành styles của SFDT.
 *
 * Như dịch vụ .NET: kiểu bảng và kiểu danh sách không ghi ra; tên kiểu dựng sẵn của Word ("heading 1", "header")
 * đổi sang tên chuẩn ("Heading 1", "Header"); kiểu đoạn không khai báo w:next thì next là chính nó.
 */
final class KieuDocx
{
    /**
     * Tên kiểu dựng sẵn viết thường (như Word lưu) sang tên .NET ghi.
     *
     * @var array<string, string>
     */
    private const TEN_DUNG_SAN = [
        'normal' => 'Normal', 'header' => 'Header', 'footer' => 'Footer', 'caption' => 'Caption', 'macro' => 'Macro Text',
        'title' => 'Title', 'subtitle' => 'Subtitle', 'footnote text' => 'Footnote Text', 'footnote reference' => 'Footnote Reference',
        'endnote text' => 'Endnote Text', 'endnote reference' => 'Endnote Reference', 'annotation text' => 'Comment Text',
        'annotation reference' => 'Comment Reference', 'annotation subject' => 'Comment Subject', 'page number' => 'Page Number',
        'line number' => 'Line Number', 'table of figures' => 'Table of Figures', 'table of authorities' => 'Table of Authorities',
        'toa heading' => 'TOA Heading', 'index heading' => 'Index Heading', 'envelope address' => 'Envelope Address',
        'envelope return' => 'Envelope Return', 'normal indent' => 'Normal Indent', 'plain text' => 'Plain Text',
        'balloon text' => 'Balloon Text', 'hyperlink' => 'Hyperlink', 'followedhyperlink' => 'FollowedHyperlink',
        'list paragraph' => 'List Paragraph', 'no spacing' => 'No Spacing', 'body text' => 'Body Text',
        'html preformatted' => 'HTML Preformatted', 'normal (web)' => 'Normal (Web)', 'default paragraph font' => 'Default Paragraph Font',
        'strong' => 'Strong', 'emphasis' => 'Emphasis', 'block text' => 'Block Text', 'document map' => 'Document Map',
    ];

    /**
     * Kiểu theo styleId.
     *
     * @var array<string, array{loai: string, ten: string, phanTu: DOMElement}>
     */
    private array $theoMa = [];

    /**
     * styleId viết thường sang styleId (Word so khớp styleId không phân biệt hoa thường).
     *
     * @var array<string, string>
     */
    private array $maThuong = [];

    private ?string $maDoanMacDinh = null;

    private ?DOMElement $rPrMacDinh = null;

    private ?DOMElement $pPrMacDinh = null;

    public function __construct(private readonly NguCanhDocx $nguCanh, ?DOMDocument $xml)
    {
        foreach ($xml?->documentElement->childNodes ?? [] as $nut) {
            if (! $nut instanceof DOMElement) {
                continue;
            }

            if ($nut->localName === 'docDefaults') {
                $this->rPrMacDinh = $this->dd()->conTen($this->dd()->conTen($nut, 'rPrDefault'), 'rPr');
                $this->pPrMacDinh = $this->dd()->conTen($this->dd()->conTen($nut, 'pPrDefault'), 'pPr');
            } elseif ($nut->localName === 'style') {
                $ma = (string) DonVi::thuocTinh($nut, 'styleId');
                $loai = DonVi::thuocTinh($nut, 'type') ?? 'paragraph';
                $tenGoc = ($ten = $this->dd()->conTen($nut, 'name')) !== null ? (string) $this->dd()->val($ten) : $ma;

                if (isset($this->theoMa[$ma])) {
                    continue;
                }

                $this->theoMa[$ma] = ['loai' => $loai, 'ten' => self::tenChuan($tenGoc), 'phanTu' => $nut];
                $this->maThuong[strtolower($ma)] = $ma;

                if ($loai === 'paragraph' && $this->maDoanMacDinh === null && in_array(DonVi::thuocTinh($nut, 'default'), ['1', 'true', 'on'], true)) {
                    $this->maDoanMacDinh = $ma;
                }
            }
        }
    }

    /**
     * Tên kiểu theo styleId; null nếu không có kiểu đó.
     */
    public function tenKieu(?string $ma): ?string
    {
        if ($ma === null) {
            return null;
        }

        $ma = $this->maThuong[strtolower($ma)] ?? null;

        return $ma === null ? null : $this->theoMa[$ma]['ten'];
    }

    /**
     * Tên kiểu đoạn mặc định (đoạn không có w:pStyle).
     */
    public function tenDoanMacDinh(): string
    {
        return $this->tenKieu($this->maDoanMacDinh) ?? 'Normal';
    }

    /**
     * Phần tử w:style của kiểu bảng (đi theo basedOn từ kiểu đã cho tới gốc), kiểu đầu là kiểu gần nhất.
     *
     * @return list<DOMElement>
     */
    public function chuoiKieu(?string $ma): array
    {
        $ketQua = [];
        $daGap = [];

        while ($ma !== null && ($ma = $this->maThuong[strtolower($ma)] ?? null) !== null && ! isset($daGap[$ma])) {
            $daGap[$ma] = true;
            $phanTu = $this->theoMa[$ma]['phanTu'];
            $ketQua[] = $phanTu;
            $coSo = $this->dd()->conTen($phanTu, 'basedOn');
            $ma = $coSo === null ? null : $this->dd()->val($coSo);
        }

        return $ketQua;
    }

    /**
     * Mã kiểu bảng mặc định (w:default="1" loại table), thường là TableNormal.
     */
    public function maBangMacDinh(): ?string
    {
        foreach ($this->theoMa as $ma => $kieu) {
            if ($kieu['loai'] === 'table' && in_array(DonVi::thuocTinh($kieu['phanTu'], 'default'), ['1', 'true', 'on'], true)) {
                return $ma;
            }
        }

        return null;
    }

    /**
     * characterFormat mặc định của tài liệu (docDefaults/rPrDefault).
     *
     * @return array<string, mixed>
     */
    public function kyTuMacDinh(): array
    {
        return $this->dd()->kyTu($this->rPrMacDinh);
    }

    /**
     * paragraphFormat mặc định của tài liệu (docDefaults/pPrDefault).
     *
     * @return array<string, mixed>
     */
    public function doanMacDinh(): array
    {
        return $this->dd()->doan($this->pPrMacDinh);
    }

    /**
     * Danh sách styles của SFDT: kiểu đoạn và kiểu ký tự theo thứ tự trong styles.xml.
     *
     * @return list<array<string, mixed>>
     */
    public function cacKieu(): array
    {
        $ketQua = [];

        foreach ($this->theoMa as $kieu) {
            if (! in_array($kieu['loai'], ['paragraph', 'character'], true)) {
                continue;
            }

            $phanTu = $kieu['phanTu'];
            $laDoan = $kieu['loai'] === 'paragraph';
            $mot = ['type' => $laDoan ? 'Paragraph' : 'Character', 'name' => $kieu['ten']];

            // Kiểu ký tự không khai báo basedOn được .NET cho dựa trên "Default Paragraph Font".
            $coSo = $this->tenTheoPhanTu($phanTu, 'basedOn')
                ?? ($laDoan || $kieu['ten'] === 'Default Paragraph Font' ? null : 'Default Paragraph Font');
            if ($coSo !== null) {
                $mot['basedOn'] = $coSo;
            }

            if ($laDoan) {
                $mot['next'] = $this->tenTheoPhanTu($phanTu, 'next') ?? $kieu['ten'];
                $lienKet = $this->tenTheoPhanTu($phanTu, 'link');
                if ($lienKet !== null) {
                    $mot['link'] = $lienKet;
                }
            }

            $kyTu = $this->dd()->kyTu($this->dd()->conTen($phanTu, 'rPr'));
            if ($kyTu !== []) {
                $mot['characterFormat'] = $kyTu;
            }

            if ($laDoan) {
                $doan = $this->dd()->doan($this->dd()->conTen($phanTu, 'pPr'));
                unset($doan['styleName']);
                if ($doan !== []) {
                    $mot['paragraphFormat'] = $doan;
                }
            }

            $ketQua[] = $mot;
        }

        return $ketQua;
    }

    /**
     * Tên chuẩn của kiểu: tên dựng sẵn viết thường đổi như .NET, "heading N" thành "Heading N", "toc N" thành "TOC N".
     */
    public static function tenChuan(string $ten): string
    {
        $thuong = strtolower(trim($ten));

        if (isset(self::TEN_DUNG_SAN[$thuong])) {
            return self::TEN_DUNG_SAN[$thuong];
        }

        if (preg_match('/^(heading|toc|index) ([1-9])$/', $thuong, $khop)) {
            return ($khop[1] === 'toc' ? 'TOC' : ucfirst($khop[1])).' '.$khop[2];
        }

        return $ten;
    }

    private function tenTheoPhanTu(DOMElement $kieu, string $tenCon): ?string
    {
        $con = $this->dd()->conTen($kieu, $tenCon);

        return $con === null ? null : $this->tenKieu($this->dd()->val($con));
    }

    private function dd(): DinhDangDocx
    {
        return $this->nguCanh->dinhDang;
    }
}
