<?php

namespace App\Services\ChuyenDoi;

use App\Services\ChuyenDoi\Docx\DonVi;
use App\Services\ChuyenDoi\Docx\GoiDocx;
use App\Services\ChuyenDoi\Docx\LoiDocx;
use App\Services\ChuyenDoi\Docx\NguCanhDocx;
use App\Services\ChuyenDoi\Docx\NoiDungDocx;
use DOMElement;
use JsonException;

/**
 * Đổi file Word (DOCX) sang SFDT để bộ soạn Syncfusion DocumentEditor (EJ2 v19.1) mở, thay cho dịch vụ .NET Import.
 *
 * Cấu trúc và giá trị bám theo SFDT mà dịch vụ .NET (Syncfusion.EJ2.DocumentEditor 18.2) sinh ra cho cùng file.
 */
final class DocxSangSfdt
{
    /**
     * @param  string  $docx  nội dung nhị phân của file DOCX
     * @return string JSON SFDT
     *
     * @throws LoiDocx file không phải DOCX hoặc bị hỏng
     */
    public function chuyen(string $docx): string
    {
        try {
            return json_encode($this->chuyenThanhMang($docx), JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_THROW_ON_ERROR);
        } catch (JsonException $loi) {
            throw new LoiDocx('Không ghi được SFDT từ file DOCX: '.$loi->getMessage(), previous: $loi);
        }
    }

    /**
     * SFDT dạng mảng PHP (chưa mã hóa JSON). Dùng khi đổi tiếp sang RTF (SfdtSangRtf::chuyenTuMang) để khỏi mã hóa
     * rồi giải mã lại JSON với văn bản lớn.
     *
     * @return array<string, mixed>
     *
     * @throws LoiDocx file không phải DOCX hoặc bị hỏng
     */
    public function chuyenThanhMang(string $docx): array
    {
        $goi = GoiDocx::tuNoiDung($docx);
        $nguCanh = new NguCanhDocx($goi, $goi->phanTaiLieu());
        $taiLieu = $goi->xml($nguCanh->phanTaiLieu);
        $body = $taiLieu === null ? null : $nguCanh->dinhDang->conTen($taiLieu->documentElement, 'body');

        if (! $body instanceof DOMElement) {
            throw new LoiDocx('File DOCX không có phần nội dung (w:body).');
        }

        $sfdt = ['sections' => (new NoiDungDocx($nguCanh))->cacSection($body)];
        $kyTu = $nguCanh->kieu->kyTuMacDinh();
        $sfdt['characterFormat'] = $kyTu === [] ? (object) [] : $kyTu;
        $doan = $nguCanh->kieu->doanMacDinh();

        if ($doan !== []) {
            $sfdt['paragraphFormat'] = $doan;
        }

        $cacKieu = $nguCanh->kieu->cacKieu();
        $lists = $nguCanh->danhSach->cacList();

        if ($lists !== []) {
            $sfdt['lists'] = $lists;
            $sfdt['abstractLists'] = $nguCanh->danhSach->cacAbstractList();
        }

        $sfdt['background'] = ['color' => $this->mauNen($nguCanh, $taiLieu->documentElement)];

        if ($cacKieu !== []) {
            $sfdt['styles'] = $cacKieu;
        }

        return $sfdt + $this->caiDat($nguCanh);
    }

    /**
     * Màu nền trang (w:background), mặc định trắng.
     */
    private function mauNen(NguCanhDocx $nguCanh, DOMElement $goc): string
    {
        $nen = $nguCanh->dinhDang->conTen($goc, 'background');
        $mau = $nen === null ? null : DonVi::mau(DonVi::thuocTinh($nen, 'color'));

        return $mau === null || $mau === '#00000000' ? '#FFFFFFFF' : $mau;
    }

    /**
     * Cài đặt tài liệu (settings.xml): độ rộng tab mặc định, bảo vệ, theo dõi thay đổi.
     *
     * @return array<string, mixed>
     */
    private function caiDat(NguCanhDocx $nguCanh): array
    {
        $tab = $nguCanh->caiDat('defaultTabStop');
        $baoVe = $nguCanh->caiDat('documentProtection');
        $theoDoi = $nguCanh->caiDat('trackRevisions');
        $khongTuDong = $nguCanh->caiDat('doNotUseHTMLParagraphAutoSpacing')
            ?? $nguCanh->dinhDang->conTen($nguCanh->caiDat('compat'), 'doNotUseHTMLParagraphAutoSpacing');
        $batBaoVe = $baoVe !== null && in_array(strtolower((string) DonVi::thuocTinh($baoVe, 'enforcement')), ['1', 'true', 'on'], true);

        return [
            'defaultTabWidth' => $tab === null ? 36.0 : DonVi::twip(DonVi::thuocTinh($tab, 'val')),
            'formatting' => $baoVe !== null && in_array(strtolower((string) DonVi::thuocTinh($baoVe, 'formatting')), ['1', 'true', 'on'], true),
            'trackChanges' => $theoDoi !== null && DonVi::bat($theoDoi),
            'protectionType' => match ($baoVe === null ? null : DonVi::thuocTinh($baoVe, 'edit')) {
                'readOnly' => 'ReadOnly',
                'comments' => 'CommentsOnly',
                'forms' => 'FormFieldsOnly',
                'trackedChanges' => 'RevisionsOnly',
                default => 'NoProtection',
            },
            'enforcement' => $batBaoVe,
            'dontUseHTMLParagraphAutoSpacing' => $khongTuDong !== null && DonVi::bat($khongTuDong),
        ];
    }
}
