<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class XacThucBanQuyenTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_license_for_a_plan_with_the_editor_is_accepted(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A'))
            ->assertOk()
            ->assertJsonPath('ma_giay_phep', 'Văn phòng A');
    }

    public function test_a_license_for_another_product_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', ['aud' => 'dotary']))
            ->assertUnauthorized();
    }

    public function test_a_license_from_another_issuer_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', ['iss' => 'gia-mao.example.com']))
            ->assertUnauthorized();
    }

    public function test_an_expired_license_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', ['exp' => time() - 3600]))
            ->assertUnauthorized();
    }

    public function test_a_license_that_is_not_yet_valid_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', ['nbf' => time() + 3600]))
            ->assertUnauthorized();
    }

    public function test_a_token_without_a_jti_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', ['jti' => '']))
            ->assertUnauthorized();
    }

    public function test_a_plan_without_the_editor_gets_forbidden(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Văn phòng A', [], ['tep_hinh']))
            ->assertForbidden()
            ->assertJsonPath('message', 'Gói dịch vụ của văn phòng không có bộ soạn.');
    }

    public function test_a_token_with_a_tampered_payload_is_rejected(): void
    {
        $headers = $this->banQuyenHeaders('Văn phòng A');
        [$dau, $noiDung, $chuKy] = explode('.', substr($headers['Authorization'], strlen('Bearer ')));

        $noiDungSua = rtrim(strtr(base64_encode((string) json_encode([
            'iss' => 'vi-sos.com', 'aud' => 'vinbs', 'sub' => '1', 'jti' => 'gia',
            'customer' => 'Văn phòng A', 'exp' => time() + 3600,
            'limits' => ['tinh_nang' => ['bo_soan']],
        ])), '+/', '-_'), '=');

        $this->getJson('/api/v1/cau-hinh', ['Authorization' => "Bearer {$dau}.{$noiDungSua}.{$chuKy}"])
            ->assertUnauthorized();
    }

    public function test_a_token_using_an_unexpected_algorithm_is_rejected(): void
    {
        $base64Url = fn (string $duLieu): string => rtrim(strtr(base64_encode($duLieu), '+/', '-_'), '=');
        $token = $base64Url((string) json_encode(['alg' => 'none', 'typ' => 'JWT'])).'.'
            .$base64Url((string) json_encode(['iss' => 'vi-sos.com', 'aud' => 'vinbs', 'jti' => 'x', 'exp' => time() + 3600])).'.';

        $this->banQuyenHeaders('Văn phòng A');
        $this->getJson('/api/v1/cau-hinh', ['Authorization' => "Bearer {$token}"])->assertUnauthorized();
    }

    public function test_a_token_signed_by_another_key_is_rejected(): void
    {
        $cauHinh = ['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA];

        if ($duongDanCauHinh = env('OPENSSL_CONF_PATH')) {
            $cauHinh['config'] = $duongDanCauHinh;
        }

        $khoaGia = openssl_pkey_new($cauHinh);
        openssl_pkey_export($khoaGia, $khoaGiaRiengTu, null, $cauHinh);

        $base64Url = fn (string $duLieu): string => rtrim(strtr(base64_encode($duLieu), '+/', '-_'), '=');
        $phanDau = $base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $phanNoiDung = $base64Url((string) json_encode([
            'iss' => 'vi-sos.com', 'aud' => 'vinbs', 'sub' => '1', 'jti' => 'gia', 'customer' => 'Văn phòng A',
            'exp' => time() + 3600, 'limits' => ['tinh_nang' => ['bo_soan']],
        ]));
        openssl_sign($phanDau.'.'.$phanNoiDung, $chuKy, $khoaGiaRiengTu, OPENSSL_ALGO_SHA256);

        $this->banQuyenHeaders('Văn phòng A');
        $this->getJson('/api/v1/cau-hinh', ['Authorization' => 'Bearer '.$phanDau.'.'.$phanNoiDung.'.'.$base64Url($chuKy)])
            ->assertUnauthorized();
    }
}
