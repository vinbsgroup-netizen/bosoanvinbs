<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Pool;
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
            $taiLieu = $this->tachTaiLieuRtf($noiDung);

            if (count($taiLieu) > 1) {
                return $this->nhapNhieuTaiLieuRtf(array_map(fn (string $rtf): string => $this->maHoaRtfUnicode($rtf), $taiLieu));
            }

            $noiDung = $this->maHoaRtfUnicode($noiDung);
        }

        return $this->goiDichVu('Import', fn () => Http::connectTimeout(5)
            ->timeout(120)
            ->attach('files', $noiDung, $tep->getClientOriginalName() ?: 'van-ban.docx')
            ->post(config('bo_soan.dich_vu_syncfusion').'Import'));
    }

    /**
     * Phần mềm khách (hợp đồng V3 của dotary) dựng văn bản bằng cách nối RTF của từng điều khoản: {\rtf1 ...}{\rtf1 ...}.
     * Dịch vụ Import chỉ đọc tài liệu đầu tiên, nên mở từng tài liệu rồi gộp SFDT theo đúng thứ tự.
     *
     * @param  list<string>  $taiLieu
     */
    private function nhapNhieuTaiLieuRtf(array $taiLieu): Response
    {
        $url = config('bo_soan.dich_vu_syncfusion').'Import';

        $cacPhanHoi = Http::pool(fn (Pool $pool): array => array_map(
            fn (string $rtf) => $pool->connectTimeout(5)->timeout(120)->attach('files', $rtf, 'van-ban.rtf')->post($url),
            $taiLieu,
        ), concurrency: 6);
        ksort($cacPhanHoi);

        $cacSfdt = [];

        foreach ($cacPhanHoi as $thuTu => $phanHoi) {
            if (! $phanHoi instanceof PhanHoiDichVu) {
                Log::warning('Không kết nối được dịch vụ soạn thảo.', ['hanh_dong' => 'Import', 'tai_lieu' => $thuTu]);

                return response('Không kết nối được dịch vụ soạn thảo.', 502);
            }

            $sfdt = json_decode($phanHoi->body());

            if (! $phanHoi->successful() || ! is_object($sfdt) || ! isset($sfdt->sections)) {
                Log::warning('Dịch vụ soạn thảo trả lỗi.', ['hanh_dong' => 'Import', 'tai_lieu' => $thuTu, 'trang_thai' => $phanHoi->status()]);

                return response('Dịch vụ soạn thảo không xử lý được yêu cầu.', 502);
            }

            $cacSfdt[] = $sfdt;
        }

        return response(json_encode($this->gopSfdt($cacSfdt), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION), 200)
            ->header('Content-Type', 'application/json; charset=utf-8');
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
     * Đổi DOCX bộ soạn vừa tạo sang RTF, cho phần mềm khách còn lưu RTF như thời TX (điều khoản V3 của dotary:
     * máy chủ nối RTF các điều khoản và điền ^mã tiểu mục^ ngay trong RTF).
     */
    public function xuatRtf(Request $request): Response
    {
        $tep = $request->file('files') ?? $request->file('file');

        if (! $tep instanceof UploadedFile || ! $tep->isValid() || ! $this->laFileDocx($tep)) {
            return response('Cần gửi file DOCX.', 422);
        }

        if ($tep->getSize() > config('bo_soan.kich_thuoc_file_toi_da') * 1024) {
            return response('File quá lớn.', 422);
        }

        return $this->goiDichVu('Export', fn () => Http::connectTimeout(5)
            ->timeout(120)
            ->attach('files', $tep->get(), 'van-ban.docx')
            ->post(config('bo_soan.dich_vu_syncfusion').'Export', ['filename' => 'van-ban.rtf']));
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
