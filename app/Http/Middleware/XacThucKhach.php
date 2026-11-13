<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class XacThucKhach
{
    /**
     * Chỉ cho phép yêu cầu có khóa API hợp lệ của một khách hàng.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $khoa = (string) $request->bearerToken();

        foreach (config('bo_soan.khach') as $khach) {
            if ($khoa !== '' && hash_equals($khach['khoa'], $khoa)) {
                $request->attributes->set('khach', $khach['ten']);

                return $next($request);
            }
        }

        return response()->json(['message' => 'Khóa API không hợp lệ.'], 401);
    }
}
