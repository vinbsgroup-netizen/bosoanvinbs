<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SoanPageTest extends TestCase
{
    use RefreshDatabase;

    private const SFDT_CU = '{"sections":[{"blocks":[{"inlines":[{"text":"Nội dung cũ"}]}]}]}';

    private function taoPhien(string $noiDung = self::SFDT_CU): string
    {
        return $this->postJson('/api/v1/phien-soan', ['noi_dung' => $noiDung], $this->banQuyenHeaders('Khách A'))
            ->json('ma_phien');
    }

    public function test_the_editor_page_opens_with_the_session_content(): void
    {
        $ma = $this->taoPhien();

        $this->get("/soan/{$ma}")
            ->assertOk()
            ->assertSee('office-kit/office-kit.js', false)
            ->assertSee(trim(json_encode(self::SFDT_CU, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT), '"'), false)
            ->assertSee(str_replace('/', '\/', "/soan/{$ma}/ket-qua"), false);
    }

    public function test_an_unknown_session_returns_not_found(): void
    {
        $this->get('/soan/khong-ton-tai')->assertNotFound();
    }

    public function test_submitted_result_replaces_the_session_content(): void
    {
        $ma = $this->taoPhien();
        $ketQua = '{"sections":[{"blocks":[{"inlines":[{"text":"Nội dung mới"}]}]}]}';

        $this->postJson("/soan/{$ma}/ket-qua", ['noi_dung' => $ketQua])->assertOk();

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->banQuyenHeaders('Khách A'))
            ->assertJsonPath('dinh_dang', 'sfdt')
            ->assertJsonPath('noi_dung', $ketQua);
    }

    public function test_the_result_is_saved_when_sessions_live_in_the_database_cache(): void
    {
        // Production dùng cache database, nơi nội dung phiên được tuần tự hóa; cache mảng của test thì không.
        config(['cache.default' => 'database']);
        $ma = $this->taoPhien();
        $ketQua = '{"sections":[{"blocks":[{"inlines":[{"text":"Đã lưu qua cache database"}]}]}]}';

        $this->postJson("/soan/{$ma}/ket-qua", ['noi_dung' => $ketQua])->assertOk();

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->banQuyenHeaders('Khách A'))
            ->assertJsonPath('noi_dung', $ketQua);
    }

    public function test_a_result_that_is_not_sfdt_is_rejected(): void
    {
        $ma = $this->taoPhien();

        $this->postJson("/soan/{$ma}/ket-qua", ['noi_dung' => '{\rtf1 Nội dung}'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['noi_dung' => 'Nội dung phải là SFDT của bộ soạn.']);
    }

    public function test_the_root_editor_loads_the_office_kit_without_a_session(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('office-kit/office-kit.js', false)
            ->assertDontSee('id="submit-noidung"', false);
    }
}
