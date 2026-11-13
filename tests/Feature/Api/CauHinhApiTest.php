<?php

namespace Tests\Feature\Api;

use App\Models\CauHinhKhach;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CauHinhApiTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private array $headersKhachA = ['Authorization' => 'Bearer khoa-a'];

    /** @var array<string, string> */
    private array $headersKhachB = ['Authorization' => 'Bearer khoa-b'];

    protected function setUp(): void
    {
        parent::setUp();

        config(['bo_soan.khach' => [
            ['ten' => 'Khách A', 'khoa' => 'khoa-a'],
            ['ten' => 'Khách B', 'khoa' => 'khoa-b'],
        ]]);
    }

    public function test_request_without_a_valid_key_is_rejected(): void
    {
        $this->getJson('/api/v1/cau-hinh')->assertUnauthorized();
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], ['Authorization' => 'Bearer sai'])
            ->assertUnauthorized();
    }

    public function test_a_customer_without_configuration_gets_a_null_service_url(): void
    {
        $this->getJson('/api/v1/cau-hinh', $this->headersKhachA)
            ->assertOk()
            ->assertExactJson(['ten_khach' => 'Khách A', 'url_dich_vu' => null]);
    }

    public function test_saved_service_url_is_returned_with_a_trailing_slash(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://dich-vu.example.com/api/documenteditor'], $this->headersKhachA)
            ->assertOk()
            ->assertJsonPath('url_dich_vu', 'https://dich-vu.example.com/api/documenteditor/');

        $this->getJson('/api/v1/cau-hinh', $this->headersKhachA)
            ->assertJsonPath('url_dich_vu', 'https://dich-vu.example.com/api/documenteditor/');
    }

    public function test_each_customer_keeps_its_own_configuration(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], $this->headersKhachA)->assertOk();

        $this->getJson('/api/v1/cau-hinh', $this->headersKhachB)
            ->assertJsonPath('url_dich_vu', null);
        $this->assertSame(1, CauHinhKhach::query()->where('ten_khach', 'Khách A')->count());
    }

    public function test_updating_twice_overwrites_the_same_row(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://mot.example.com/'], $this->headersKhachA)->assertOk();
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://hai.example.com/'], $this->headersKhachA)->assertOk();

        $this->assertSame(1, CauHinhKhach::query()->count());
        $this->getJson('/api/v1/cau-hinh', $this->headersKhachA)
            ->assertJsonPath('url_dich_vu', 'https://hai.example.com/');
    }

    public function test_sending_null_clears_the_service_url(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'https://a.example.com/'], $this->headersKhachA)->assertOk();

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => null], $this->headersKhachA)
            ->assertOk()
            ->assertJsonPath('url_dich_vu', null);
    }

    public function test_a_url_that_is_not_http_or_https_is_rejected(): void
    {
        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'ftp://a.example.com/'], $this->headersKhachA)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url_dich_vu']);

        $this->putJson('/api/v1/cau-hinh', ['url_dich_vu' => 'khong-phai-url'], $this->headersKhachA)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url_dich_vu']);
    }
}
