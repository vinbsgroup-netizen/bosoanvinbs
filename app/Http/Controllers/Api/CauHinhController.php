<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CauHinhKhachResource;
use App\Models\CauHinhKhach;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CauHinhController extends Controller
{
    /**
     * Xem cấu hình bộ soạn của khách đang gọi API. Chưa cấu hình thì url_dich_vu là null.
     */
    public function show(Request $request): CauHinhKhachResource
    {
        $cauHinh = CauHinhKhach::firstOrNew(['ten_khach' => $request->attributes->get('khach')]);

        return new CauHinhKhachResource($cauHinh);
    }

    /**
     * Ghi cấu hình bộ soạn của khách đang gọi API. Chỉ ghi các trường được gửi lên.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url_dich_vu' => ['nullable', 'url:http,https', 'max:2048'],
        ]);

        $cauHinh = CauHinhKhach::updateOrCreate(
            ['ten_khach' => $request->attributes->get('khach')],
            ['url_dich_vu' => $this->chuanHoaUrl($validated['url_dich_vu'] ?? null)],
        );

        return (new CauHinhKhachResource($cauHinh))->response()->setStatusCode(200);
    }

    /**
     * Dịch vụ bộ soạn được gọi theo thư mục, nên luôn kết thúc bằng dấu "/".
     */
    private function chuanHoaUrl(?string $url): ?string
    {
        return $url === null ? null : rtrim($url, '/').'/';
    }
}
