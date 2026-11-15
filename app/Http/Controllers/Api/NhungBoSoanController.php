<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

/**
 * Script nhúng bộ soạn của bo-soan (Office kit Syncfusion) vào trang của phần mềm khác, ví dụ dotary.
 *
 * Phần mềm khách chỉ cần một thẻ script; danh sách file và phiên bản do bo-soan quyết định,
 * nên khi bo-soan cập nhật bộ soạn, trang nhúng tự nhận bản mới mà không phải sửa gì.
 */
class NhungBoSoanController extends Controller
{
    /**
     * File của bộ soạn trong public/office-kit.
     *
     * @var list<string>
     */
    private const TEP_BO_SOAN = ['material.css', 'index.css', 'print.min.css', 'print.min.js', 'ej2.min.js', 'office-kit.js', 'bo-soan.js'];

    /**
     * Mỗi file kèm phiên bản theo thời điểm sửa, để trình duyệt không dùng bản cũ trong bộ nhớ đệm.
     */
    public function __invoke(): Response
    {
        $phienBan = collect(self::TEP_BO_SOAN)
            ->mapWithKeys(fn (string $tep): array => [$tep => filemtime(public_path('office-kit/'.$tep))])
            ->all();

        return response()
            ->view('nhung-bo-soan', ['phienBan' => $phienBan])
            ->header('Content-Type', 'application/javascript; charset=utf-8')
            ->header('Cache-Control', 'public, max-age=300');
    }
}
