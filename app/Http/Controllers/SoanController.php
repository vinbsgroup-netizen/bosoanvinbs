<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Api\PhienSoanController as ApiPhienSoan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Contracts\View\View;

class SoanController extends Controller
{
    /**
     * Mở bộ soạn với nội dung của phiên. Mã phiên là bí mật, nên không cần đăng nhập thêm.
     */
    public function show(string $ma): View
    {
        $phien = $this->timPhien($ma);

        return view('editor', [
            'phien' => [
                'ma' => $ma,
                'tieu_de' => $phien['tieu_de'],
                'noi_dung' => $phien['noi_dung'],
                'ket_qua_url' => route('phien-soan.ket-qua', ['ma' => $ma]),
            ],
        ]);
    }

    /**
     * Nhận nội dung khách vừa soạn xong và ghi đè vào phiên, giữ nguyên thời gian hết hạn.
     */
    public function luuKetQua(Request $request, string $ma): JsonResponse
    {
        $phien = $this->timPhien($ma);

        $validated = $request->validate([
            'noi_dung' => ['required', 'array'],
            'noi_dung.type' => ['required', 'in:doc'],
            'noi_dung.content' => ['present', 'array'],
            'noi_dung.hf' => ['nullable', 'array'],
        ]);

        Cache::put(ApiPhienSoan::khoaCache($ma), [...$phien, 'noi_dung' => $validated['noi_dung']], $phien['het_han']);

        return response()->json(['message' => 'Đã nhận kết quả.']);
    }

    private function timPhien(string $ma): array
    {
        $phien = Cache::get(ApiPhienSoan::khoaCache($ma));

        abort_unless($phien, 404);

        return $phien;
    }
}
