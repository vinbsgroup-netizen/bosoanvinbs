<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SoanPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['bo_soan.khach' => [['ten' => 'Khách A', 'khoa' => 'khoa-a']]]);
    }

    private function taoPhien(): string
    {
        $noiDung = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Nội dung cũ']]]]];

        return $this->withHeaders(['Authorization' => 'Bearer khoa-a'])
            ->postJson('/api/v1/phien-soan', ['noi_dung' => $noiDung])
            ->json('ma_phien');
    }

    public function test_the_editor_page_opens_with_the_session_content(): void
    {
        $ma = $this->taoPhien();

        $this->get("/soan/{$ma}")
            ->assertOk()
            ->assertSee(json_encode('Nội dung cũ'), false)
            ->assertSee(str_replace('/', '\/', "/soan/{$ma}/ket-qua"), false);
    }

    public function test_an_unknown_session_returns_not_found(): void
    {
        $this->get('/soan/khong-ton-tai')->assertNotFound();
    }

    public function test_submitted_result_replaces_the_session_content(): void
    {
        $ma = $this->taoPhien();
        $ketQua = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Nội dung mới']]]]];

        $this->postJson("/soan/{$ma}/ket-qua", ['noi_dung' => $ketQua])->assertOk();

        $this->withHeaders(['Authorization' => 'Bearer khoa-a'])
            ->getJson("/api/v1/phien-soan/{$ma}")
            ->assertJsonPath('noi_dung.content.0.content.0.text', 'Nội dung mới');
    }

    public function test_the_root_editor_still_works_without_a_session(): void
    {
        $this->get('/')->assertOk()->assertSee('bo-soan', false);
    }
}
