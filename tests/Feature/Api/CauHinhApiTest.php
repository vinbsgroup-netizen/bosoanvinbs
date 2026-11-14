<?php

namespace Tests\Feature\Api;

use App\Models\CauHinhKhach;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CauHinhApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_without_a_valid_license_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh')->assertUnauthorized();
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], ['Authorization' => 'Bearer sai'])
            ->assertUnauthorized();
    }

    public function test_a_customer_without_configuration_gets_a_null_service_url(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Khách A'))
            ->assertOk()
            ->assertExactJson(['ma_giay_phep' => 'Khách A', 'url_dich_vu' => null]);
    }

    public function test_saved_service_url_is_returned_with_a_trailing_slash(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://dich-vu.example.com/api/documenteditor'], $headers)
            ->assertOk()
            ->assertJsonPath('url_dich_vu', 'https://dich-vu.example.com/api/documenteditor/');

        $this->getJson('/api/v1/cau-hinh', $headers)
            ->assertJsonPath('url_dich_vu', 'https://dich-vu.example.com/api/documenteditor/');
    }

    public function test_each_customer_keeps_its_own_configuration(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], $this->banQuyenHeaders('Khách A'))->assertOk();

        $this->getJson('/api/v1/cau-hinh', $this->banQuyenHeaders('Khách B'))
            ->assertJsonPath('url_dich_vu', null);
        $this->assertSame(1, CauHinhKhach::query()->where('ma_giay_phep', 'Khách A')->count());
    }

    public function test_updating_twice_overwrites_the_same_row(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://mot.example.com/'], $headers)->assertOk();
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://hai.example.com/'], $headers)->assertOk();

        $this->assertSame(1, CauHinhKhach::query()->count());
        $this->getJson('/api/v1/cau-hinh', $headers)
            ->assertJsonPath('url_dich_vu', 'https://hai.example.com/');
    }

    public function test_sending_null_clears_the_service_url(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], $headers)->assertOk();

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => null], $headers)
            ->assertOk()
            ->assertJsonPath('url_dich_vu', null);
    }

    public function test_a_url_that_is_not_http_or_https_is_rejected(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'ftp://a.example.com/'], $headers)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url_dich_vu']);

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'khong-phai-url'], $headers)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url_dich_vu']);
    }
}
