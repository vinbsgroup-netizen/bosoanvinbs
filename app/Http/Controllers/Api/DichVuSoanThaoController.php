<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response as PhanHoiDichVu;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Chuyển tiếp yêu cầu của bộ soạn Office kit (Syncfusion) sang dịch vụ .NET DocumentEditor và DocToPDF.
 *
 * Trang soạn gọi cùng tên miền nên không vướng CORS hay mixed content (trang HTTPS, dịch vụ HTTP).
 * Địa chỉ dịch vụ chỉ lấy từ cấu hình, không nhận từ client, để endpoint không bị dùng gọi tới máy chủ khác.
 * Office kit đọc phản hồi dạng văn bản, nên lỗi cũng trả về văn bản thường.
 */
class DichVuSoanThaoController extends Controller
{
    /**
     * Thao tác JSON của dịch vụ .NET được phép chuyển tiếp.
     *
     * @var list<string>
     */
    public const HANH_DONG_JSON = ['SystemClipboard', 'RestrictEditing', 'SpellCheck', 'SpellCheckByPage'];

    /**
     * Mở file Word (.doc, .docx), RTF hoặc văn bản thuần (.txt, UTF-8): dịch vụ Import đổi sang SFDT để bộ soạn mở.
     * File chỉ được chuyển tiếp, không lưu lại trên máy chủ.
     */
    public function nhapFile(Request $request): Response
    {
        $tep = $request->file('files') ?? $request->file('file');

        $kiemTra = Validator::make(['tep' => $tep], [
            'tep' => ['required', 'file', 'extensions:doc,docx,rtf,txt', 'max:'.config('bo_soan.kich_thuoc_file_toi_da')],
        ]);

        if ($kiemTra->fails()) {
            return response('Chỉ mở được file Word (.doc, .docx), RTF hoặc văn bản (.txt).', 422);
        }

        $noiDung = $tep->get();

        if (str_starts_with(ltrim($noiDung), '{\rtf')) {
            $noiDung = $this->maHoaRtfUnicode($noiDung);
        }

        return $this->goiDichVu('Import', fn () => Http::connectTimeout(5)
            ->timeout(120)
            ->attach('files', $noiDung, $tep->getClientOriginalName() ?: 'van-ban.docx')
            ->post(config('bo_soan.dich_vu_syncfusion').'Import'));
    }

    /**
     * Phần mềm khách ghép chữ vào mẫu RTF (str_replace) nên RTF có thể chứa thẳng byte UTF-8, trong khi dịch vụ Import
     * đọc RTF theo bảng mã ANSI: "Nguyễn" thành "Nguyá»…n". Đổi mọi ký tự ngoài ASCII sang mã \uN? của RTF.
     * RTF ANSI thật (byte cao không phải UTF-8 hợp lệ) giữ nguyên.
     */
    private function maHoaRtfUnicode(string $rtf): string
    {
        if (! preg_match('/[^\x00-\x7F]/', $rtf) || ! mb_check_encoding($rtf, 'UTF-8')) {
            return $rtf;
        }

        return preg_replace_callback('/[^\x00-\x7F]/u', function (array $kyTu): string {
            $ma = mb_ord($kyTu[0], 'UTF-8');
            // \u của RTF là số 16 bit có dấu; ký tự ngoài BMP ghi thành cặp surrogate.
            $donVi = $ma > 0xFFFF
                ? [0xD800 + (($ma - 0x10000) >> 10), 0xDC00 + (($ma - 0x10000) & 0x3FF)]
                : [$ma];

            return implode('', array_map(fn (int $u): string => '\\u'.($u > 32767 ? $u - 65536 : $u).'?', $donVi));
        }, $rtf);
    }

    /**
     * Chuyển tiếp nguyên thân yêu cầu JSON (dán giữ định dạng, bảo vệ tài liệu, kiểm tra chính tả).
     */
    public function chuyenTiep(Request $request, string $hanhDong): Response
    {
        return $this->goiDichVu($hanhDong, fn () => Http::connectTimeout(5)
            ->timeout(60)
            ->withBody($request->getContent(), $request->header('Content-Type', 'application/json'))
            ->post(config('bo_soan.dich_vu_syncfusion').$hanhDong));
    }

    /**
     * In và xuất PDF: nhận file DOCX bộ soạn vừa tạo, trả nội dung PDF dạng base64.
     */
    public function docxSangPdf(Request $request): Response
    {
        $tep = $request->file('file');

        if (! $tep instanceof UploadedFile || ! $tep->isValid() || ! $this->laFileDocx($tep)) {
            return response('Cần gửi file DOCX.', 422);
        }

        if ($tep->getSize() > config('bo_soan.kich_thuoc_file_toi_da') * 1024) {
            return response('File quá lớn.', 422);
        }

        try {
            $phanHoi = Http::connectTimeout(5)
                ->timeout(120)
                ->attach('file', $tep->get(), 'van-ban.docx')
                ->post(config('bo_soan.doc_to_pdf'));
        } catch (ConnectionException $loi) {
            Log::warning('Không kết nối được dịch vụ DocToPDF.', ['loi' => $loi->getMessage()]);

            return response('Không kết nối được dịch vụ chuyển PDF.', 502);
        }

        $base64 = trim($phanHoi->body(), " \t\n\r\0\x0B\"");

        if (! $phanHoi->successful() || $base64 === '') {
            Log::warning('Dịch vụ DocToPDF trả lỗi.', ['trang_thai' => $phanHoi->status(), 'noi_dung' => mb_substr($phanHoi->body(), 0, 300)]);

            return response('Không chuyển được văn bản sang PDF.', 502);
        }

        return response($base64, 200)->header('Content-Type', 'text/plain; charset=utf-8');
    }

    /**
     * Gọi dịch vụ .NET và trả nguyên phản hồi; lỗi kết nối hoặc phản hồi rỗng thành 502.
     *
     * @param  callable(): PhanHoiDichVu  $goi
     */
    private function goiDichVu(string $hanhDong, callable $goi): Response
    {
        try {
            $phanHoi = $goi();
        } catch (ConnectionException $loi) {
            Log::warning('Không kết nối được dịch vụ soạn thảo.', ['hanh_dong' => $hanhDong, 'loi' => $loi->getMessage()]);

            return response('Không kết nối được dịch vụ soạn thảo.', 502);
        }

        if ($phanHoi->serverError() || trim($phanHoi->body()) === '') {
            Log::warning('Dịch vụ soạn thảo trả lỗi.', [
                'hanh_dong' => $hanhDong,
                'trang_thai' => $phanHoi->status(),
                'noi_dung' => mb_substr($phanHoi->body(), 0, 300),
            ]);

            return response('Dịch vụ soạn thảo không xử lý được yêu cầu.', 502);
        }

        return response($phanHoi->body(), $phanHoi->status())
            ->header('Content-Type', $phanHoi->header('Content-Type') ?: 'application/json; charset=utf-8');
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
