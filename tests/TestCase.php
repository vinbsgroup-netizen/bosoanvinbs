<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** @var array{private: string, public: string}|null */
    private static ?array $capKhoaThu = null;

    /**
     * Header Authorization với token bản quyền ký bằng khóa thử. Gọi hàm này sẽ đặt public key tương ứng vào config.
     *
     * @param  array<string, mixed>  $ghiDe  claim cần thay đổi (ví dụ exp đã qua, aud khác)
     * @param  list<string>  $tinhNang
     * @return array<string, string>
     */
    protected function banQuyenHeaders(string $maGiayPhep = 'Văn phòng A', array $ghiDe = [], array $tinhNang = ['bo_soan']): array
    {
        $khoa = $this->capKhoaThu();
        config(['license.public_key' => $khoa['public']]);

        $claims = array_replace_recursive([
            'iss' => config('license.issuer'),
            'aud' => config('license.product'),
            'sub' => $maGiayPhep,
            'jti' => 'jti-'.uniqid(),
            'customer' => 'Khách hàng '.$maGiayPhep,
            'nbf' => time() - 10,
            'exp' => time() + 3600,
            'limits' => ['tinh_nang' => $tinhNang],
        ], $ghiDe);

        return ['Authorization' => 'Bearer '.$this->kyToken($claims, $khoa['private'])];
    }

    /**
     * @return array{private: string, public: string}
     */
    private function capKhoaThu(): array
    {
        if (self::$capKhoaThu === null) {
            $cauHinh = ['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA];

            if ($duongDanCauHinh = env('OPENSSL_CONF_PATH')) {
                $cauHinh['config'] = $duongDanCauHinh;
            }

            $khoa = openssl_pkey_new($cauHinh);
            openssl_pkey_export($khoa, $khoaRiengTu, null, $cauHinh);

            self::$capKhoaThu = [
                'private' => $khoaRiengTu,
                'public' => openssl_pkey_get_details($khoa)['key'],
            ];
        }

        return self::$capKhoaThu;
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function kyToken(array $claims, string $khoaRiengTu): string
    {
        $base64Url = fn (string $duLieu): string => rtrim(strtr(base64_encode($duLieu), '+/', '-_'), '=');

        $phanDau = $base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $phanNoiDung = $base64Url((string) json_encode($claims));

        openssl_sign($phanDau.'.'.$phanNoiDung, $chuKy, $khoaRiengTu, OPENSSL_ALGO_SHA256);

        return $phanDau.'.'.$phanNoiDung.'.'.$base64Url($chuKy);
    }
}
