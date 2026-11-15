<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChuyenDoi\Docx\LoiDocx;
use App\Services\ChuyenDoi\DocxSangSfdt;
use App\Services\ChuyenDoi\RtfSangSfdt;
use App\Services\ChuyenDoi\SfdtRtf\LoiSfdt;
use App\Services\ChuyenDoi\SfdtSangRtf;
use App\Services\ChuyenDoi\VanBanThuanSangSfdt;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

/**
 * Dịch vụ của bộ soạn Office kit (Syncfusion): mở RTF, DOCX, văn bản thuần (đổi sang SFDT) và xuất RTF.
 * Mọi chuyển đổi chạy ngay trong bo-soan (app/Services/ChuyenDoi), không gọi dịch vụ .NET nào;
 * In, tạo PDF và dán giữ định dạng chạy trên trình duyệt (public/office-kit/office-kit.js).
 *
 * Office kit đọc phản hồi dạng văn bản, nên lỗi cũng trả về văn bản thường. File chỉ được đọc, không lưu lại.
 */
class DichVuSoanThaoController extends Controller
{
    /** Chữ ký file OLE (Word 97–2003 .doc). */
    private const DAU_FILE_DOC = "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1";

    /**
     * Mở file Word (.docx), RTF hoặc văn bản thuần (.txt, UTF-8): đổi sang SFDT để bộ soạn mở.
     * Loại file nhận theo nội dung (trình duyệt có thể gửi blob không đúng đuôi).
     */
    public function nhapFile(
        Request $request,
        RtfSangSfdt $rtfSangSfdt,
        DocxSangSfdt $docxSangSfdt,
        VanBanThuanSangSfdt $vanBanThuanSangSfdt,
    ): Response {
        $tep = $request->file('files') ?? $request->file('file');

        $kiemTra = Validator::make(['tep' => $tep], [
            'tep' => ['required', 'file', 'extensions:doc,docx,rtf,txt', 'max:'.config('bo_soan.kich_thuoc_file_toi_da')],
        ]);

        if ($kiemTra->fails()) {
            return response('Chỉ mở được file Word (.docx), RTF hoặc văn bản (.txt).', 422);
        }

        $noiDung = $tep->get();

        if (str_starts_with(ltrim($noiDung), '{\rtf')) {
            return $this->traSfdt($this->moRtf(ltrim($noiDung), $rtfSangSfdt));
        }

        if (str_starts_with($noiDung, "PK\x03\x04")) {
            try {
                return $this->traSfdt($docxSangSfdt->chuyen($noiDung));
            } catch (LoiDocx $loi) {
                return response($loi->getMessage(), 422);
            }
        }

        if (str_starts_with($noiDung, self::DAU_FILE_DOC) || strtolower($tep->getClientOriginalExtension()) === 'doc') {
            return response('File Word 97–2003 (.doc) chưa mở được: mở bằng Word, lưu thành .docx rồi mở lại.', 422);
        }

        return $this->traSfdt($vanBanThuanSangSfdt->chuyen($noiDung));
    }

    /**
     * RTF đổi sang SFDT ngay trong bo-soan. Phần mềm khách (hợp đồng V3 của dotary) dựng văn bản bằng cách nối RTF
     * của từng điều khoản {\rtf1 ...}{\rtf1 ...}: mở từng tài liệu rồi gộp SFDT theo đúng thứ tự.
     * RTF hỏng (thiếu ngoặc đóng) không tách được thì đọc cả chuỗi như một tài liệu.
     */
    private function moRtf(string $noiDung, RtfSangSfdt $rtfSangSfdt): string
    {
        $taiLieu = $this->tachTaiLieuRtf($noiDung);

        if (count($taiLieu) <= 1) {
            return $rtfSangSfdt->chuyen($taiLieu[0] ?? $noiDung);
        }

        $cacSfdt = array_map(fn (string $rtf): object => json_decode($rtfSangSfdt->chuyen($rtf)), $taiLieu);

        return (string) json_encode($this->gopSfdt($cacSfdt), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    }

    private function traSfdt(string $sfdt): Response
    {
        return response($sfdt, 200)->header('Content-Type', 'application/json; charset=utf-8');
    }

    /**
     * Tách chuỗi gồm nhiều tài liệu RTF nối liền thành từng tài liệu, theo các nhóm ngoài cùng { ... }.
     * Bỏ qua ngoặc được thoát (\{ \}) và dữ liệu nhị phân \binN.
     *
     * @return list<string>
     */
    private function tachTaiLieuRtf(string $noiDung): array
    {
        $taiLieu = [];
        $doSau = 0;
        $batDau = 0;
        $doDai = strlen($noiDung);

        for ($i = 0; $i < $doDai; $i++) {
            $kyTu = $noiDung[$i];

            if ($kyTu === '\\') {
                $i += preg_match('/\Gbin(\d+) ?/', $noiDung, $khop, 0, $i + 1) ? strlen($khop[0]) + (int) $khop[1] : 1;
            } elseif ($kyTu === '{') {
                $batDau = $doSau === 0 ? $i : $batDau;
                $doSau++;
            } elseif ($kyTu === '}' && $doSau > 0 && --$doSau === 0) {
                $taiLieu[] = substr($noiDung, $batDau, $i - $batDau + 1);
            }
        }

        return array_values(array_filter($taiLieu, fn (string $nhom): bool => str_starts_with($nhom, '{\rtf')));
    }

    /**
     * Gộp nhiều SFDT: nối khối nội dung vào section cuối của tài liệu đầu (giữ khổ giấy, đầu và chân trang của tài liệu
     * đầu, liền mạch như TX hiển thị), thêm kiểu chữ còn thiếu, đánh lại mã danh sách đánh số để không trùng.
     * SFDT đọc dạng đối tượng để {} không thành [] khi ghi lại.
     *
     * @param  non-empty-list<object>  $cacSfdt
     */
    private function gopSfdt(array $cacSfdt): object
    {
        $goc = array_shift($cacSfdt);
        $goc->styles ??= [];
        $goc->lists ??= [];
        $goc->abstractLists ??= [];
        $sectionCuoi = end($goc->sections);
        $sectionCuoi->blocks ??= [];

        foreach ($cacSfdt as $sfdt) {
            $this->doiMaDanhSach(
                $sfdt,
                $this->maLonNhat($goc->lists, 'listId') + 1,
                $this->maLonNhat($goc->abstractLists, 'abstractListId') + 1,
            );

            array_push($goc->lists, ...($sfdt->lists ?? []));
            array_push($goc->abstractLists, ...($sfdt->abstractLists ?? []));

            $tenKieu = array_column($goc->styles, 'name');
            foreach ($sfdt->styles ?? [] as $kieu) {
                if (! in_array($kieu->name ?? null, $tenKieu, true)) {
                    $goc->styles[] = $kieu;
                }
            }

            foreach ($sfdt->sections as $section) {
                array_push($sectionCuoi->blocks, ...($section->blocks ?? []));
            }
        }

        return $goc;
    }

    /**
     * @param  list<object>  $cacMuc
     */
    private function maLonNhat(array $cacMuc, string $khoa): int
    {
        return max([-1, ...array_map(fn (object $muc): int => (int) ($muc->{$khoa} ?? -1), $cacMuc)]);
    }

    /**
     * Cộng độ lệch vào mọi listId, abstractListId (từ 0 trở lên) trong tài liệu sắp gộp.
     */
    private function doiMaDanhSach(mixed $nut, int $lechList, int $lechAbstract): void
    {
        if (is_array($nut)) {
            foreach ($nut as $con) {
                $this->doiMaDanhSach($con, $lechList, $lechAbstract);
            }

            return;
        }

        if (! is_object($nut)) {
            return;
        }

        foreach (get_object_vars($nut) as $khoa => $giaTri) {
            if ($khoa === 'listId' && is_int($giaTri) && $giaTri >= 0) {
                $nut->listId = $giaTri + $lechList;
            } elseif ($khoa === 'abstractListId' && is_int($giaTri) && $giaTri >= 0) {
                $nut->abstractListId = $giaTri + $lechAbstract;
            } else {
                $this->doiMaDanhSach($giaTri, $lechList, $lechAbstract);
            }
        }
    }

    /**
     * Đổi DOCX bộ soạn vừa tạo sang RTF, cho phần mềm khách còn lưu RTF như thời TX (điều khoản V3 của dotary:
     * máy chủ nối RTF các điều khoản và điền ^mã tiểu mục^ ngay trong RTF).
     */
    public function xuatRtf(Request $request, DocxSangSfdt $docxSangSfdt, SfdtSangRtf $sfdtSangRtf): Response
    {
        $tep = $request->file('files') ?? $request->file('file');

        if (! $tep instanceof UploadedFile || ! $tep->isValid() || ! $this->laFileDocx($tep)) {
            return response('Cần gửi file DOCX.', 422);
        }

        if ($tep->getSize() > config('bo_soan.kich_thuoc_file_toi_da') * 1024) {
            return response('File quá lớn.', 422);
        }

        // Đi đường mảng (không mã hóa rồi giải mã JSON ở giữa) để văn bản lớn tốn ít bộ nhớ.
        try {
            $rtf = $sfdtSangRtf->chuyenTuMang($docxSangSfdt->chuyenThanhMang($tep->get()));
        } catch (LoiDocx|LoiSfdt $loi) {
            return response($loi->getMessage(), 422);
        }

        return response($rtf, 200)->header('Content-Type', 'application/rtf');
    }

    /**
     * DOCX là gói ZIP: bốn byte đầu là "PK\x03\x04". Trình duyệt gửi blob không có tên file nên không dựa vào đuôi file.
     */
    private function laFileDocx(UploadedFile $tep): bool
    {
        $dau = (string) file_get_contents($tep->getRealPath(), false, null, 0, 4);

        return $dau === "PK\x03\x04";
    }
}
