<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhienSoanApiTest extends TestCase
{
    use RefreshDatabase;

    private function noiDung(): array
    {
        return ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Xin chào']]]]];
    }

    public function test_request_without_a_valid_license_is_rejected(): void
    {
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()])->assertUnauthorized();
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], ['Authorization' => 'Bearer sai'])->assertUnauthorized();
    }

    public function test_creating_a_session_returns_an_editor_link(): void
    {
        $response = $this->postJson('/api/v1/phien-soan', ['tieu_de' => 'Giấy ủy quyền', 'noi_dung' => $this->noiDung()], $this->banQuyenHeaders('Khách A'));

        $response->assertCreated()->assertJsonStructure(['ma_phien', 'lien_ket', 'het_han']);
        $this->assertStringContainsString('/soan/', $response->json('lien_ket'));
    }

    public function test_the_session_content_can_be_read_back_by_its_owner(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $headers)->json('ma_phien');

        $this->getJson("/api/v1/phien-soan/{$ma}", $headers)
            ->assertOk()
            ->assertJsonPath('noi_dung.type', 'doc');
    }

    public function test_another_customer_cannot_read_or_delete_the_session(): void
    {
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $this->banQuyenHeaders('Khách A'))->json('ma_phien');

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->banQuyenHeaders('Khách B'))->assertNotFound();
        $this->deleteJson("/api/v1/phien-soan/{$ma}", [], $this->banQuyenHeaders('Khách B'))->assertNotFound();
    }

    public function test_deleting_a_session_removes_it(): void
    {
        $headers = $this->banQuyenHeaders('Khách A');
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $headers)->json('ma_phien');

        $this->deleteJson("/api/v1/phien-soan/{$ma}", [], $headers)->assertOk();
        $this->getJson("/api/v1/phien-soan/{$ma}", $headers)->assertNotFound();
    }

    public function test_content_without_a_doc_type_is_rejected(): void
    {
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => ['type' => 'html']], $this->banQuyenHeaders('Khách A'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['noi_dung.type']);
    }
}
