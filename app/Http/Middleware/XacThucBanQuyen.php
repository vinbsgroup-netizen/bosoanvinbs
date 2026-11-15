<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Chỉ cho phép yêu cầu có token bản quyền vi-sos hợp lệ, còn hạn, và gói có chức năng bộ soạn.
 *
 * Token được kiểm tra bằng public key của sản phẩm ghi trong claim "aud". Khóa lấy từ vi-sos
 * (GET {may_chu}/api/license/public-key/{san_pham}) và lưu cache, nên sản phẩm nào được vi-sos cấp gói
 * có bộ soạn thì dùng được ngay, không cần khai báo trong .env. Khóa khai báo trong config (nếu có) được ưu tiên.
 * Mã giấy phép (claim "sub") được gắn vào request dưới khóa "khach" để phân quyền dữ liệu.
 */
class XacThucBanQuyen
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) $request->bearerToken();

        if ($token === '') {
            return $this->loi(401, 'Thiếu token bản quyền.');
        }

        $claims = $this->kiemTraToken($token);

        if ($claims === null) {
            return $this->loi(401, 'Token bản quyền không hợp lệ hoặc đã hết hạn.');
        }

        if (! in_array(config('license.chuc_nang'), (array) data_get($claims, 'limits.tinh_nang', []), true)) {
            return $this->loi(403, 'Gói dịch vụ của văn phòng không có bộ soạn.');
        }

        $request->attributes->set('khach', (string) ($claims['sub'] ?? ''));
        $request->attributes->set('giay_phep', $claims);

        return $next($request);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function kiemTraToken(string $token): ?array
    {
        $phan = explode('.', $token);

        if (count($phan) !== 3) {
            return null;
        }

        [$phanDau, $phanNoiDung, $phanChuKy] = $phan;
        $dau = $this->giaiMaJson($phanDau);

        // Chỉ chấp nhận RS256 để chặn tấn công đổi thuật toán (alg "none", HS256...).
        if (($dau['alg'] ?? null) !== 'RS256') {
            return null;
        }

        // "aud" chỉ dùng để chọn khóa; chữ ký được xác minh bằng khóa của đúng sản phẩm đó trước khi tin claims.
        $claims = $this->giaiMaJson($phanNoiDung);
        $chuKy = $this->giaiMaBase64Url($phanChuKy);

        foreach ($this->cacSanPham($claims) as $sanPham) {
            $khoaPem = $this->khoaCuaSanPham($sanPham);

            if ($khoaPem === '') {
                continue;
            }

            $khoaCongKhai = openssl_pkey_get_public(str_replace('\\n', "\n", $khoaPem));

            if ($khoaCongKhai !== false
                && openssl_verify($phanDau.'.'.$phanNoiDung, $chuKy, $khoaCongKhai, OPENSSL_ALGO_SHA256) === 1) {
                return $this->claimsConHieuLuc($claims) ? $claims : null;
            }
        }

        return null;
    }

    /**
     * Mã sản phẩm trong claim "aud" (chuỗi hoặc mảng), chỉ giữ mã hợp lệ để không gọi vi-sos với dữ liệu lạ.
     *
     * @param  array<string, mixed>  $claims
     * @return list<string>
     */
    private function cacSanPham(array $claims): array
    {
        return array_values(array_filter(
            (array) ($claims['aud'] ?? []),
            fn (mixed $sanPham): bool => is_string($sanPham) && preg_match('/^[a-z0-9][a-z0-9_-]{0,99}$/', $sanPham) === 1,
        ));
    }

    /**
     * Public key PEM của sản phẩm: khai báo trong config nếu có, không thì lấy từ vi-sos (cache 1 ngày,
     * sản phẩm vi-sos không biết thì nhớ 10 phút để không gọi lại liên tục). Chuỗi rỗng khi không có khóa.
     */
    private function khoaCuaSanPham(string $sanPham): string
    {
        $khoaCauHinh = $sanPham === config('license.product')
            ? config('license.public_key')
            : (config('license.san_pham_khac', [])[$sanPham] ?? null);

        if (is_string($khoaCauHinh) && trim($khoaCauHinh) !== '') {
            return $khoaCauHinh;
        }

        $khoaCache = 'ban_quyen.khoa.'.$sanPham;
        $khoa = Cache::get($khoaCache);

        if (is_string($khoa)) {
            return $khoa;
        }

        $khoa = $this->layKhoaTuViSos($sanPham);
        Cache::put($khoaCache, $khoa, $khoa === '' ? now()->addMinutes(10) : now()->addDay());

        return $khoa;
    }

    private function layKhoaTuViSos(string $sanPham): string
    {
        try {
            $phanHoi = Http::acceptJson()
                ->connectTimeout(5)
                ->timeout(10)
                ->get(config('license.may_chu').'/api/license/public-key/'.$sanPham);
        } catch (Throwable) {
            return '';
        }

        if (! $phanHoi->successful()
            || $phanHoi->json('product') !== $sanPham
            || $phanHoi->json('issuer') !== config('license.issuer')) {
            return '';
        }

        $khoa = $phanHoi->json('public_key');

        return is_string($khoa) && str_contains($khoa, 'PUBLIC KEY') ? $khoa : '';
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function claimsConHieuLuc(array $claims): bool
    {
        if (($claims['iss'] ?? null) !== config('license.issuer')) {
            return false;
        }

        if (! is_string($claims['jti'] ?? null) || $claims['jti'] === '') {
            return false;
        }

        $leeway = (int) config('license.leeway', 60);
        $bayGio = time();

        if (isset($claims['nbf']) && is_numeric($claims['nbf']) && $bayGio + $leeway < (int) $claims['nbf']) {
            return false;
        }

        return is_numeric($claims['exp'] ?? null) && $bayGio - $leeway <= (int) $claims['exp'];
    }

    /**
     * @return array<string, mixed>
     */
    private function giaiMaJson(string $phan): array
    {
        $duLieu = json_decode($this->giaiMaBase64Url($phan), true);

        return is_array($duLieu) ? $duLieu : [];
    }

    private function giaiMaBase64Url(string $duLieu): string
    {
        $phanDu = strlen($duLieu) % 4;

        if ($phanDu !== 0) {
            $duLieu .= str_repeat('=', 4 - $phanDu);
        }

        return (string) base64_decode(strtr($duLieu, '-_', '+/'), true);
    }

    private function loi(int $maLoi, string $thongBao): JsonResponse
    {
        return response()->json(['message' => $thongBao], $maLoi);
    }
}
