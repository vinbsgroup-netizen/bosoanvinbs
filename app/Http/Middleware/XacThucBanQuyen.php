<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chỉ cho phép yêu cầu có token bản quyền vi-sos hợp lệ, còn hạn, và gói có chức năng bộ soạn.
 *
 * Token được kiểm tra offline bằng public key của sản phẩm, cùng cách làm của client vi-sos.
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

        $khoaCongKhai = openssl_pkey_get_public(str_replace('\\n', "\n", (string) config('license.public_key')));

        if ($khoaCongKhai === false) {
            return null;
        }

        $chuKy = $this->giaiMaBase64Url($phanChuKy);

        if (openssl_verify($phanDau.'.'.$phanNoiDung, $chuKy, $khoaCongKhai, OPENSSL_ALGO_SHA256) !== 1) {
            return null;
        }

        $claims = $this->giaiMaJson($phanNoiDung);

        return $this->claimsConHieuLuc($claims) ? $claims : null;
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function claimsConHieuLuc(array $claims): bool
    {
        $sanPham = config('license.product');
        $aud = $claims['aud'] ?? null;
        $dungSanPham = is_array($aud) ? in_array($sanPham, $aud, true) : $aud === $sanPham;

        if (! $dungSanPham || ($claims['iss'] ?? null) !== config('license.issuer')) {
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
