<?php

namespace Tests\Feature\Api;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as YeuCauDichVu;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DichVuSoanThaoTest extends TestCase
{
    private const DICH_VU = 'http://dich-vu-soan.test/api/documenteditor/';

    private const DOC_TO_PDF = 'http://doc-to-pdf.test/api/documenteditorservice/DocToPDF';

    private const SFDT = '{"sections":[{"blocks":[]}]}';

    protected function setUp(): void
    {
        parent::setUp();

        config(['bo_soan.dich_vu_syncfusion' => self::DICH_VU, 'bo_soan.doc_to_pdf' => self::DOC_TO_PDF]);
        Http::preventStrayRequests();
    }

    private function fileDocx(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('hop-dong.docx', "PK\x03\x04noi-dung-docx");
    }

    public function test_opening_a_word_file_forwards_it_to_the_configured_import_service(): void
    {
        Http::fake([self::DICH_VU.'Import' => Http::response(self::SFDT)]);

        $this->post('/api/documenteditor/import-vinbs', [
            'files' => $this->fileDocx(),
            'document_editor_service_url' => 'http://may-chu-khac.test/',
        ])->assertOk()->assertContent(self::SFDT);

        Http::assertSent(fn (YeuCauDichVu $yeuCau) => $yeuCau->url() === self::DICH_VU.'Import' && $yeuCau->isMultipart());
        Http::assertSentCount(1);
    }

    public function test_a_file_that_is_not_word_or_rtf_is_rejected(): void
    {
        $this->post('/api/documenteditor/Import', ['files' => UploadedFile::fake()->create('anh.png', 10)])
            ->assertUnprocessable()
            ->assertContent('Chỉ mở được file Word (.doc, .docx) hoặc RTF.');

        Http::assertNothingSent();
    }

    public function test_an_unreachable_import_service_returns_bad_gateway(): void
    {
        Http::fake([self::DICH_VU.'Import' => fn () => throw new ConnectionException('Hết thời gian chờ.')]);

        $this->post('/api/documenteditor/Import', ['files' => $this->fileDocx()])
            ->assertStatus(502)
            ->assertContent('Không kết nối được dịch vụ soạn thảo.');
    }

    public function test_an_import_service_error_returns_bad_gateway(): void
    {
        Http::fake([self::DICH_VU.'Import' => Http::response('Lỗi máy chủ', 500)]);

        $this->post('/api/documenteditor/Import', ['files' => $this->fileDocx()])
            ->assertStatus(502)
            ->assertContent('Dịch vụ soạn thảo không xử lý được yêu cầu.');
    }

    public function test_formatted_paste_is_forwarded_with_its_body(): void
    {
        Http::fake([self::DICH_VU.'SystemClipboard' => Http::response(self::SFDT)]);
        $noiDungDan = ['content' => '<p>Đoạn dán</p>', 'type' => '.html'];

        $this->postJson('/api/documenteditor/SystemClipboard', $noiDungDan)
            ->assertOk()
            ->assertContent(self::SFDT);

        Http::assertSent(fn (YeuCauDichVu $yeuCau) => $yeuCau->url() === self::DICH_VU.'SystemClipboard' && $yeuCau->data() === $noiDungDan);
    }

    public function test_an_action_outside_the_allowed_list_is_not_forwarded(): void
    {
        $this->postJson('/api/documenteditor/XoaDuLieu', [])->assertNotFound();

        Http::assertNothingSent();
    }

    public function test_a_docx_is_converted_to_pdf_base64_without_quotes(): void
    {
        Http::fake([self::DOC_TO_PDF => Http::response('"JVBERi0xLjQ="')]);

        $this->post('/api/get-file', ['file' => $this->fileDocx()])
            ->assertOk()
            ->assertContent('JVBERi0xLjQ=');

        Http::assertSent(fn (YeuCauDichVu $yeuCau) => $yeuCau->url() === self::DOC_TO_PDF && $yeuCau->isMultipart());
    }

    public function test_pdf_conversion_rejects_a_file_that_is_not_docx(): void
    {
        $this->post('/api/get-file', ['file' => UploadedFile::fake()->createWithContent('blob', 'khong phai docx')])
            ->assertUnprocessable()
            ->assertContent('Cần gửi file DOCX.');

        Http::assertNothingSent();
    }

    public function test_an_unreachable_pdf_service_returns_bad_gateway(): void
    {
        Http::fake([self::DOC_TO_PDF => fn () => throw new ConnectionException('Hết thời gian chờ.')]);

        $this->post('/api/get-file', ['file' => $this->fileDocx()])
            ->assertStatus(502)
            ->assertContent('Không kết nối được dịch vụ chuyển PDF.');
    }
}
