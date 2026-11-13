<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhienSoanApiTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private array $headersKhachA = ['Authorization' => 'Bearer khoa-a'];

    private array $headersKhachB = ['Authorization' => 'Bearer khoa-b'];

    protected function setUp(): void
    {
        parent::setUp();

        config(['bo_soan.khach' => [
            ['ten' => 'Khách A', 'khoa' => 'khoa-a'],
            ['ten' => 'Khách B', 'khoa' => 'khoa-b'],
        ]]);
    }

    private function noiDung(): array
    {
        return ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Xin chào']]]]];
    }

    public function test_request_without_a_valid_key_is_rejected(): void
    {
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()])->assertUnauthorized();
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], ['Authorization' => 'Bearer sai'])->assertUnauthorized();
    }

    public function test_creating_a_session_returns_an_editor_link(): void
    {
        $response = $this->postJson('/api/v1/phien-soan', ['tieu_de' => 'Giấy ủy quyền', 'noi_dung' => $this->noiDung()], $this->headersKhachA);

        $response->assertCreated()->assertJsonStructure(['ma_phien', 'lien_ket', 'het_han']);
        $this->assertStringContainsString('/soan/', $response->json('lien_ket'));
    }

    public function test_the_session_content_can_be_read_back_by_its_owner(): void
    {
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $this->headersKhachA)->json('ma_phien');

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->headersKhachA)
            ->assertOk()
            ->assertJsonPath('noi_dung.type', 'doc');
    }

    public function test_another_customer_cannot_read_or_delete_the_session(): void
    {
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $this->headersKhachA)->json('ma_phien');

        $this->getJson("/api/v1/phien-soan/{$ma}", $this->headersKhachB)->assertNotFound();
        $this->deleteJson("/api/v1/phien-soan/{$ma}", [], $this->headersKhachB)->assertNotFound();
    }

    public function test_deleting_a_session_removes_it(): void
    {
        $ma = $this->postJson('/api/v1/phien-soan', ['noi_dung' => $this->noiDung()], $this->headersKhachA)->json('ma_phien');

        $this->deleteJson("/api/v1/phien-soan/{$ma}", [], $this->headersKhachA)->assertOk();
        $this->getJson("/api/v1/phien-soan/{$ma}", $this->headersKhachA)->assertNotFound();
    }

    public function test_content_without_a_doc_type_is_rejected(): void
    {
        $this->postJson('/api/v1/phien-soan', ['noi_dung' => ['type' => 'html']], $this->headersKhachA)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['noi_dung.type']);
    }
}
