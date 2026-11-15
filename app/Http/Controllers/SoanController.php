<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Api\PhienSoanController as ApiPhienSoan;
use App\Rules\NoiDungVanBan;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;

class SoanController extends Controller
{
    /**
     * Mở bộ soạn với nội dung của phiên. Mã phiên là bí mật, nên không cần đăng nhập thêm.
     */
    public function show(string $ma): View
    {
        $phien = $this->timPhien($ma);

        return view('office-kit', [
            'phien' => [
                'ma' => $ma,
                'tieu_de' => $phien['tieu_de'],
                'dinh_dang' => NoiDungVanBan::dinhDang($phien['noi_dung']),
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
            'noi_dung' => ['required', new NoiDungVanBan(chiNhanSfdt: true)],
        ]);

        Cache::put(
            ApiPhienSoan::khoaCache($ma),
            [...$phien, 'noi_dung' => NoiDungVanBan::chuanHoa($validated['noi_dung'])],
            Date::createFromTimestamp($phien['het_han']),
        );

        return response()->json(['message' => 'Đã nhận kết quả.']);
    }

    private function timPhien(string $ma): array
    {
        $phien = Cache::get(ApiPhienSoan::khoaCache($ma));

        abort_unless($phien, 404);

        return $phien;
    }
}
