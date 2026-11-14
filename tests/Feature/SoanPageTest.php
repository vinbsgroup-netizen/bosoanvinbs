<?php

namespace Tests\Feature;

use Tests\TestCase;

class SoanPageTest extends TestCase
{
    private function taoPhien(): string
    {
        $noiDung = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Nội dung cũ']]]]];

        return $this->postJson('/api/v1/phien-soan', ['noi_dung' => $noiDung], $this->banQuyenHeaders('Khách A'))
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

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->banQuyenHeaders('Khách A'))
            ->assertJsonPath('noi_dung.content.0.content.0.text', 'Nội dung mới');
    }

    public function test_the_root_editor_still_works_without_a_session(): void
    {
        $this->get('/')->assertOk()->assertSee('bo-soan', false);
    }
}
