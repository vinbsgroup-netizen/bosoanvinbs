<?php

namespace Tests\Feature\Console;

use App\Services\ChuyenDoi\DocxSangSfdt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tests\Unit\Services\ChuyenDoi\DocxTongHop;

class DoiChieuDocxTest extends TestCase
{
    private string $thuMuc;

    protected function setUp(): void
    {
        parent::setUp();

        $this->thuMuc = sys_get_temp_dir().'/doi-chieu-'.uniqid();
        File::ensureDirectoryExists($this->thuMuc);
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->thuMuc);

        parent::tearDown();
    }

    public function test_reports_match_rates_without_printing_document_text(): void
    {
        $docx = DocxTongHop::voiBody('<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bí mật khách hàng</w:t></w:r></w:p>')->noiDung();
        file_put_contents($this->thuMuc.'/hop-dong.docx', $docx);
        $sfdt = (new DocxSangSfdt)->chuyen($docx);
        Http::fake([
            '*/Import' => Http::response($sfdt),
            '*/Export' => Http::response('{\\rtf1 x}'),
        ]);

        $this->artisan('bo-soan:doi-chieu-docx', ['thu_muc' => $this->thuMuc])
            ->expectsOutputToContain('1/1 (100.0%)')
            ->doesntExpectOutputToContain('Bí mật')
            ->assertSuccessful();

        Http::assertSentCount(4);
    }

    public function test_lists_the_kind_of_difference_when_the_service_answer_differs(): void
    {
        file_put_contents($this->thuMuc.'/van-ban.docx', DocxTongHop::voiBody('<w:p><w:r><w:t>Một</w:t></w:r></w:p>')->noiDung());
        $khac = '{"sections":[{"blocks":[{"inlines":[{"text":"Hai"}]},{"inlines":[]}]}]}';
        Http::fake([
            '*/Import' => Http::response($khac),
            '*/Export' => Http::response('{\\rtf1 x}'),
        ]);

        $this->artisan('bo-soan:doi-chieu-docx', ['thu_muc' => $this->thuMuc, '--chi-tiet' => true])
            ->expectsOutputToContain('van-ban.docx: chu-than, so-doan')
            ->assertSuccessful();
    }

    public function test_fails_when_the_folder_does_not_exist(): void
    {
        $this->artisan('bo-soan:doi-chieu-docx', ['thu_muc' => $this->thuMuc.'/khong-co'])
            ->expectsOutputToContain('Không có thư mục')
            ->assertFailed();
    }
}
