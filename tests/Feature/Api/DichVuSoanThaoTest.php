<?php

namespace Tests\Feature\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;
use Tests\Unit\Services\ChuyenDoi\DocxTongHop;

/**
 * Mở RTF/DOCX/văn bản thuần và xuất RTF đều chạy trong bo-soan: không yêu cầu nào được gửi ra ngoài.
 */
class DichVuSoanThaoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();
    }

    private function fileDocx(string $chu = 'Hợp đồng mua bán'): UploadedFile
    {
        $docx = DocxTongHop::voiBody('<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>'.$chu.'</w:t></w:r></w:p>')->noiDung();

        return UploadedFile::fake()->createWithContent('hop-dong.docx', $docx);
    }

    public function test_a_word_file_opens_without_any_service(): void
    {
        $phanHoi = $this->post('/api/documenteditor/import-vinbs', [
            'files' => $this->fileDocx(),
            'document_editor_service_url' => 'http://may-chu-khac.test/',
        ])->assertOk()->assertHeader('Content-Type', 'application/json; charset=utf-8');

        $this->assertContains('Hợp đồng mua bán', $this->chuCacDoan($phanHoi));
        $this->assertTrue($phanHoi->json('sections.0.blocks.0.inlines.0.characterFormat.bold'));
        Http::assertNothingSent();
    }

    public function test_a_damaged_word_file_is_rejected_with_a_readable_message(): void
    {
        $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('hong.docx', "PK\x03\x04khong-phai-zip")])
            ->assertUnprocessable();
    }

    public function test_an_old_word_97_file_asks_to_save_it_as_docx(): void
    {
        $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('cu.doc', "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1noi-dung")])
            ->assertUnprocessable()
            ->assertContent('File Word 97–2003 (.doc) chưa mở được: mở bằng Word, lưu thành .docx rồi mở lại.');
    }

    public function test_a_plain_text_file_opens_one_paragraph_per_line(): void
    {
        $phanHoi = $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('ghi-chu.txt', "Xin chào\r\nDòng hai")])
            ->assertOk();

        $this->assertSame(['Xin chào', 'Dòng hai'], $this->chuCacDoan($phanHoi));
    }

    /**
     * Chữ của tất cả đoạn trong SFDT trả về, theo thứ tự.
     *
     * @return list<string>
     */
    private function chuCacDoan(TestResponse $phanHoi): array
    {
        $cacDoan = [];

        foreach ($phanHoi->json('sections') as $section) {
            foreach ($section['blocks'] ?? [] as $khoi) {
                $cacDoan[] = implode('', array_column($khoi['inlines'] ?? [], 'text'));
            }
        }

        return $cacDoan;
    }

    public function test_an_rtf_with_vietnamese_written_in_raw_utf8_opens_without_any_service(): void
    {
        $rtf = '{\rtf1\ansi\f0 Bên A: Nguyễn Văn An\par}';

        $phanHoi = $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('hop-dong.rtf', $rtf)])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json; charset=utf-8');

        $this->assertContains('Bên A: Nguyễn Văn An', $this->chuCacDoan($phanHoi));
        Http::assertNothingSent();
    }

    public function test_an_ansi_rtf_with_unicode_escapes_opens_with_vietnamese_text(): void
    {
        $rtf = str_replace('|', chr(92), "{|rtf1|ansi|ansicpg1252|uc1 Caf\xE9 Nguy|u7877?n|par}");

        $phanHoi = $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('cu.rtf', $rtf)])
            ->assertOk();

        $this->assertContains('Café Nguyễn', $this->chuCacDoan($phanHoi));
    }

    public function test_rtf_documents_joined_together_open_as_one_whole_document(): void
    {
        // Hợp đồng V3 của dotary nối RTF của từng điều khoản; "\}" trong điều khoản đầu là ngoặc đã thoát.
        $rtfNoi = '{\rtf1\ansi Dieu 1 \} ghi chu\par}'."\r\n".'{\rtf1\ansi Dieu 2\par}';

        $phanHoi = $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('hop-dong.rtf', $rtfNoi)])
            ->assertOk();

        $this->assertCount(1, $phanHoi->json('sections'));
        $cacDoan = array_values(array_filter($this->chuCacDoan($phanHoi), fn (string $chu): bool => $chu !== ''));
        $this->assertSame(['Dieu 1 } ghi chu', 'Dieu 2'], $cacDoan);
    }

    public function test_a_broken_rtf_still_opens_instead_of_failing(): void
    {
        $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('hong.rtf', '{\rtf1\ansi Noi dung bi cat {\b dam')])
            ->assertOk()
            ->assertJsonStructure(['sections']);
    }

    public function test_a_file_that_is_not_word_rtf_or_text_is_rejected(): void
    {
        $this->post('/api/documenteditor/Import', ['files' => UploadedFile::fake()->create('anh.png', 10)])
            ->assertUnprocessable()
            ->assertContent('Chỉ mở được file Word (.docx), RTF hoặc văn bản (.txt).');

        Http::assertNothingSent();
    }

    public function test_a_page_on_another_domain_may_call_the_editor_services(): void
    {
        // Bộ soạn nhúng trong dotary gọi thẳng dịch vụ mở file của bo-soan từ tên miền của dotary.
        $this->call('OPTIONS', '/api/documenteditor/import-vinbs', server: [
            'HTTP_ORIGIN' => 'https://dotary.example.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
        ])->assertHeader('Access-Control-Allow-Origin', '*');

        Http::assertNothingSent();
    }

    public function test_paste_and_pdf_are_no_longer_sent_to_a_server_service(): void
    {
        // Dán giữ định dạng và tạo PDF nay chạy trên trình duyệt; các đường chuyển tiếp sang .NET đã bỏ.
        $this->postJson('/api/documenteditor/SystemClipboard', ['content' => '<p>Đoạn dán</p>', 'type' => '.html'])->assertNotFound();
        $this->post('/api/get-file', ['file' => $this->fileDocx()])->assertNotFound();

        Http::assertNothingSent();
    }

    public function test_a_docx_is_exported_to_an_rtf_that_opens_back_with_the_same_text(): void
    {
        // Điều khoản V3 của dotary lưu RTF có mã tiểu mục ^12^; máy chủ dotary điền mã này ngay trong RTF.
        $rtf = $this->post('/api/documenteditor/Export', ['files' => $this->fileDocx('Điều 1: ^12^ thỏa thuận'), 'filename' => 'khac.html'])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/rtf')
            ->getContent();

        $this->assertStringStartsWith('{\rtf1', $rtf);
        $this->assertStringContainsString('^12^', $rtf);
        $this->assertDoesNotMatchRegularExpression('/[^\x00-\x7F]/', $rtf);

        $moLai = $this->post('/api/documenteditor/import-vinbs', ['files' => UploadedFile::fake()->createWithContent('dieu-khoan.rtf', $rtf)])
            ->assertOk();
        $this->assertContains('Điều 1: ^12^ thỏa thuận', $this->chuCacDoan($moLai));
        Http::assertNothingSent();
    }

    public function test_rtf_export_rejects_a_file_that_is_not_docx(): void
    {
        $this->post('/api/documenteditor/Export', ['files' => UploadedFile::fake()->createWithContent('a.docx', 'khong phai docx')])
            ->assertUnprocessable()
            ->assertContent('Cần gửi file DOCX.');

        Http::assertNothingSent();
    }
}
