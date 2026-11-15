<?php

namespace Tests\Unit\Services\ChuyenDoi;

use App\Services\ChuyenDoi\VanBanThuanSangSfdt;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class VanBanThuanSangSfdtTest extends TestCase
{
    /**
     * Chữ của từng đoạn (nối các inline).
     *
     * @return list<string>
     */
    private function cacDoan(string $text): array
    {
        $sfdt = json_decode((new VanBanThuanSangSfdt)->chuyen($text), true, 512, JSON_THROW_ON_ERROR);

        return array_map(
            fn (array $khoi): string => implode('', array_column($khoi['inlines'], 'text')),
            $sfdt['sections'][0]['blocks'],
        );
    }

    /**
     * @return array<string, array{string, list<string>}>
     */
    public static function cacKieuXuongDong(): array
    {
        return [
            'CRLF' => ["Dòng một\r\nDòng hai", ['Dòng một', 'Dòng hai']],
            'LF' => ["Dòng một\nDòng hai", ['Dòng một', 'Dòng hai']],
            'CR' => ["Dòng một\rDòng hai", ['Dòng một', 'Dòng hai']],
            'dòng trống giữa' => ["a\n\nb", ['a', '', 'b']],
            'xuống dòng cuối file' => ["a\nb\n", ['a', 'b']],
            'BOM UTF-8' => ["\xEF\xBB\xBFXin chào", ['Xin chào']],
            'file rỗng' => ['', ['']],
        ];
    }

    /**
     * @param  list<string>  $doanMongDoi
     */
    #[DataProvider('cacKieuXuongDong')]
    public function test_each_line_becomes_one_paragraph(string $text, array $doanMongDoi): void
    {
        $this->assertSame($doanMongDoi, $this->cacDoan($text));
    }

    public function test_tabs_are_separate_inlines_and_control_characters_are_dropped(): void
    {
        $sfdt = json_decode((new VanBanThuanSangSfdt)->chuyen("\tMục 1\x07:\tgiá trị"), true);

        $this->assertSame(
            [['text' => "\t"], ['text' => 'Mục 1:'], ['text' => "\t"], ['text' => 'giá trị']],
            $sfdt['sections'][0]['blocks'][0]['inlines'],
        );
    }

    public function test_utf16_text_with_a_byte_order_mark_is_read(): void
    {
        $utf16 = "\xFF\xFE".mb_convert_encoding("Bên A\r\nBên B", 'UTF-16LE', 'UTF-8');

        $this->assertSame(['Bên A', 'Bên B'], $this->cacDoan($utf16));
    }

    public function test_invalid_utf8_bytes_do_not_break_the_json(): void
    {
        $this->assertSame(['ab?c'], $this->cacDoan("ab\xFFc"));
    }
}
