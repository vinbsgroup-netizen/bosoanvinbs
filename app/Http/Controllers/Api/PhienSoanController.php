<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PhienSoanController extends Controller
{
    /**
     * Tạo phiên soạn từ nội dung JSON của TipTap. Trả về liên kết mở bộ soạn.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tieu_de' => ['nullable', 'string', 'max:255'],
            'noi_dung' => ['required', 'array'],
            'noi_dung.type' => ['required', 'in:doc'],
            'noi_dung.content' => ['present', 'array'],
            'noi_dung.hf' => ['nullable', 'array'],
        ]);

        $ma = Str::random(40);
        $thoiGian = now()->addMinutes((int) config('bo_soan.thoi_gian_phien'));
        Cache::put($this->khoaCache($ma), [
            'khach' => $request->attributes->get('khach'),
            'tieu_de' => $validated['tieu_de'] ?? 'Văn bản chưa đặt tên',
            'noi_dung' => $validated['noi_dung'],
            'het_han' => $thoiGian,
        ], $thoiGian);

        return response()->json([
            'ma_phien' => $ma,
            'lien_ket' => route('phien-soan.mo', ['ma' => $ma]),
            'het_han' => $thoiGian->toIso8601String(),
        ], 201);
    }

    /**
     * Lấy nội dung hiện tại của phiên (kể cả kết quả khách đã soạn xong).
     */
    public function show(Request $request, string $ma): JsonResponse
    {
        $phien = $this->timPhien($request, $ma);

        return response()->json([
            'ma_phien' => $ma,
            'tieu_de' => $phien['tieu_de'],
            'noi_dung' => $phien['noi_dung'],
        ]);
    }

    /**
     * Huỷ phiên ngay khi khách không còn cần nữa.
     */
    public function destroy(Request $request, string $ma): JsonResponse
    {
        $this->timPhien($request, $ma);
        Cache::forget($this->khoaCache($ma));

        return response()->json(['message' => 'Đã huỷ phiên.']);
    }

    private function timPhien(Request $request, string $ma): array
    {
        $phien = Cache::get($this->khoaCache($ma));

        abort_unless($phien && $phien['khach'] === $request->attributes->get('khach'), 404);

        return $phien;
    }

    /**
     * Khóa cache, dùng chung với trang soạn (xem PhienSoanController ở web).
     */
    public static function khoaCache(string $ma): string
    {
        return 'phien_soan:'.$ma;
    }
}
