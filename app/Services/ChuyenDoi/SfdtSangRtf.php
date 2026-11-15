<?php

namespace App\Services\ChuyenDoi;

use App\Services\ChuyenDoi\SfdtRtf\DanhSachSfdt;
use App\Services\ChuyenDoi\SfdtRtf\DinhDangRtf;
use App\Services\ChuyenDoi\SfdtRtf\GhiKhoi;
use App\Services\ChuyenDoi\SfdtRtf\KieuSfdt;
use App\Services\ChuyenDoi\SfdtRtf\LoiSfdt;
use App\Services\ChuyenDoi\SfdtRtf\MaRtf;
use App\Services\ChuyenDoi\SfdtRtf\TaiNguyenRtf;

/**
 * Đổi SFDT (bộ soạn Syncfusion DocumentEditor) sang RTF cho phần mềm khách còn lưu RTF (dotary V3), thay cho dịch vụ
 * .NET Export.
 *
 * RTF là một nhóm {\rtf1 ...} chỉ gồm ASCII (ký tự khác viết \uN? với \uc1) để máy chủ dotary nối nhiều RTF và điền chữ
 * ngay trong RTF được. Định dạng hiệu lực (kiểu + trực tiếp) được ghi tường minh ở từng đoạn và từng đoạn chữ.
 */
final class SfdtSangRtf
{
    /**
     * @param  string  $sfdt  JSON SFDT
     * @return string RTF
     *
     * @throws LoiSfdt SFDT không đọc được
     */
    public function chuyen(string $sfdt): string
    {
        $taiLieu = json_decode($sfdt, true, 1024);

        return $this->chuyenTuMang(is_array($taiLieu) ? $taiLieu : []);
    }

    /**
     * Như chuyen() nhưng nhận SFDT dạng mảng (json_decode kết hợp, hoặc DocxSangSfdt::chuyenThanhMang).
     *
     * @param  array<string, mixed>  $taiLieu
     *
     * @throws LoiSfdt SFDT không có sections
     */
    public function chuyenTuMang(array $taiLieu): string
    {
        if (! isset($taiLieu['sections']) || ! is_array($taiLieu['sections'])) {
            throw new LoiSfdt('Nội dung không phải SFDT hợp lệ (không đọc được JSON hoặc thiếu sections).');
        }

        $kieu = new KieuSfdt($taiLieu);
        $macDinh = $kieu->kyTu(null, null);
        $taiNguyen = new TaiNguyenRtf((string) $macDinh['fontFamily']);
        $dinhDang = new DinhDangRtf($taiNguyen);
        $danhSach = new DanhSachSfdt($taiLieu, $dinhDang);
        $ghi = new GhiKhoi($kieu, $dinhDang, $taiNguyen, $danhSach);
        [$bangKieu, $maDoan, $maKyTu] = $this->bangKieu($kieu, $dinhDang);
        $ghi->datMaKieu($maDoan, $maKyTu);

        $than = '';
        $cacSection = array_values(array_filter($taiLieu['sections'], 'is_array'));
        $doiTrangChanLe = false;

        foreach ($cacSection as $thuTu => $section) {
            $dinhDangSection = is_array($section['sectionFormat'] ?? null) ? $section['sectionFormat'] : [];
            $doiTrangChanLe = $doiTrangChanLe || ! empty($dinhDangSection['differentOddAndEvenPages']);
            $than .= ($thuTu > 0 ? "\n\\sect" : '')."\n\\sectd".$this->section($dinhDangSection);
            $than .= $this->dauChanTrang(is_array($section['headersFooters'] ?? null) ? $section['headersFooters'] : [], ! empty($dinhDangSection['differentOddAndEvenPages']), $ghi);
            $than .= $ghi->vung(is_array($section['blocks'] ?? null) ? $section['blocks'] : [], $thuTu < count($cacSection) - 1);
        }

        $dau = $cacSection[0]['sectionFormat'] ?? [];
        $thuocTinhTaiLieu = '\\paperw'.MaRtf::twip((float) ($dau['pageWidth'] ?? 612)).'\\paperh'.MaRtf::twip((float) ($dau['pageHeight'] ?? 792))
            .'\\margl'.MaRtf::twip((float) ($dau['leftMargin'] ?? 72)).'\\margr'.MaRtf::twip((float) ($dau['rightMargin'] ?? 72))
            .'\\margt'.MaRtf::twip((float) ($dau['topMargin'] ?? 72)).'\\margb'.MaRtf::twip((float) ($dau['bottomMargin'] ?? 72))
            .'\\deftab'.MaRtf::twip((float) ($taiLieu['defaultTabWidth'] ?? 36)).'\\widowctrl\\ftnbj\\aenddoc'
            .($doiTrangChanLe ? '\\facingp' : '');

        $macDinhKyTu = '{\\*\\defchp '.$dinhDang->kyTu($macDinh).'}';
        $doanMacDinh = array_merge(KieuSfdt::DOAN_MAC_DINH, is_array($taiLieu['paragraphFormat'] ?? null) ? $taiLieu['paragraphFormat'] : []);
        $macDinhDoan = '{\\*\\defpap '.$dinhDang->doan(array_diff_key($doanMacDinh, ['tabs' => true, 'listFormat' => true, 'styleName' => true])).'}';
        $danhSachRtf = $danhSach->bang();

        return '{\\rtf1\\ansi\\ansicpg1252\\uc1\\deff0'
            ."\n".$taiNguyen->bangPhong()
            ."\n".$taiNguyen->bangMau()
            ."\n".$macDinhKyTu.$macDinhDoan
            ."\n".$bangKieu
            ."\n".$danhSachRtf
            .'{\\*\\generator bo-soan;}'
            ."\n".$thuocTinhTaiLieu
            .$than
            ."\n}";
    }

    /**
     * \stylesheet: kiểu đoạn \sN (Normal là \s0), kiểu ký tự \*\csN \additive; mỗi kiểu ghi định dạng riêng của nó.
     *
     * @return array{0: string, 1: array<string, int>, 2: array<string, int>}
     */
    private function bangKieu(KieuSfdt $kieu, DinhDangRtf $dinhDang): array
    {
        $cacKieu = $kieu->cacKieu();
        $maDoan = ['Normal' => 0];
        $maKyTu = [];
        $so = 1;

        foreach ($cacKieu as $mot) {
            $ten = (string) $mot['name'];

            if (($mot['type'] ?? 'Paragraph') === 'Character') {
                $maKyTu[$ten] ??= $so++;
            } elseif (! isset($maDoan[$ten])) {
                $maDoan[$ten] = $so++;
            }
        }

        $ketQua = '{\\stylesheet';

        if (! isset($cacKieu['Paragraph|Normal'])) {
            $ketQua .= '{\\s0\\snext0 Normal;}';
        }

        foreach ($cacKieu as $mot) {
            $ten = (string) $mot['name'];
            $laKyTu = ($mot['type'] ?? 'Paragraph') === 'Character';
            $kyTu = is_array($mot['characterFormat'] ?? null) ? $mot['characterFormat'] : [];
            $doan = is_array($mot['paragraphFormat'] ?? null) ? $mot['paragraphFormat'] : [];
            $coSo = $mot['basedOn'] ?? null;

            if ($laKyTu) {
                $ketQua .= "\n{\\*\\cs".$maKyTu[$ten].'\\additive'.$dinhDang->kyTu($kyTu, false)
                    .($coSo !== null && isset($maKyTu[$coSo]) ? '\\sbasedon'.$maKyTu[$coSo] : '')
                    .' '.MaRtf::ten($ten).';}';

                continue;
            }

            $tiep = $mot['next'] ?? $ten;
            $ketQua .= "\n{\\s".$maDoan[$ten].$dinhDang->doan(array_diff_key($doan, ['listFormat' => true]), false).$dinhDang->kyTu($kyTu, false)
                .($coSo !== null && isset($maDoan[$coSo]) ? '\\sbasedon'.$maDoan[$coSo] : '')
                .'\\snext'.($maDoan[$tiep] ?? $maDoan[$ten])
                .' '.MaRtf::ten($ten).';}';
        }

        return [$ketQua.'}', $maDoan, $maKyTu];
    }

    /**
     * Thuộc tính section: khổ giấy, hướng, lề, khoảng cách đầu/chân trang, trang đầu khác, đánh số trang.
     *
     * @param  array<string, mixed>  $dinhDang
     */
    private function section(array $dinhDang): string
    {
        $rong = (float) ($dinhDang['pageWidth'] ?? 612);
        $cao = (float) ($dinhDang['pageHeight'] ?? 792);
        $ketQua = '\\sbkpage\\pgwsxn'.MaRtf::twip($rong).'\\pghsxn'.MaRtf::twip($cao)
            .'\\marglsxn'.MaRtf::twip((float) ($dinhDang['leftMargin'] ?? 72)).'\\margrsxn'.MaRtf::twip((float) ($dinhDang['rightMargin'] ?? 72))
            .'\\margtsxn'.MaRtf::twip((float) ($dinhDang['topMargin'] ?? 72)).'\\margbsxn'.MaRtf::twip((float) ($dinhDang['bottomMargin'] ?? 72))
            .'\\headery'.MaRtf::twip((float) ($dinhDang['headerDistance'] ?? 36)).'\\footery'.MaRtf::twip((float) ($dinhDang['footerDistance'] ?? 36));

        if ($rong > $cao) {
            $ketQua .= '\\lndscpsxn';
        }

        if (! empty($dinhDang['differentFirstPage'])) {
            $ketQua .= '\\titlepg';
        }

        if (! empty($dinhDang['restartPageNumbering'])) {
            $ketQua .= '\\pgnrestart\\pgnstarts'.max(0, (int) ($dinhDang['pageStartingNumber'] ?? 1));
        }

        if (! empty($dinhDang['bidi'])) {
            $ketQua .= '\\rtlsect';
        }

        return $ketQua;
    }

    /**
     * Đầu và chân trang: \header/\footer (trang lẻ \headerr khi chẵn lẻ khác nhau), \headerl/\footerl (trang chẵn),
     * \headerf/\footerf (trang đầu).
     *
     * @param  array<string, mixed>  $dauChan
     */
    private function dauChanTrang(array $dauChan, bool $chanLe, GhiKhoi $ghi): string
    {
        $ketQua = '';

        foreach ([
            'header' => $chanLe ? 'headerr' : 'header', 'footer' => $chanLe ? 'footerr' : 'footer',
            'evenHeader' => 'headerl', 'evenFooter' => 'footerl', 'firstPageHeader' => 'headerf', 'firstPageFooter' => 'footerf',
        ] as $khoa => $tu) {
            $khoi = $dauChan[$khoa]['blocks'] ?? null;

            if (is_array($khoi) && $khoi !== []) {
                $ketQua .= "\n{\\".$tu.$ghi->vung($khoi)."\n}";
            }
        }

        return $ketQua;
    }
}
