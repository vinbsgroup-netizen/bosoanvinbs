<?php

namespace Tests\Unit\Services\ChuyenDoi;

use App\Services\ChuyenDoi\DocxSangSfdt;
use App\Services\ChuyenDoi\SfdtRtf\LoiSfdt;
use App\Services\ChuyenDoi\SfdtSangRtf;
use PHPUnit\Framework\TestCase;

class SfdtSangRtfTest extends TestCase
{
    /**
     * @param  list<array<string, mixed>>  $khoi
     * @param  array<string, mixed>  $them
     */
    private function rtf(array $khoi, array $them = []): string
    {
        $sfdt = ['sections' => [['blocks' => $khoi, 'sectionFormat' => ['pageWidth' => 595.3, 'pageHeight' => 841.9]]]] + $them;

        return (new SfdtSangRtf)->chuyen(json_encode($sfdt, JSON_THROW_ON_ERROR));
    }

    /**
     * @param  list<array<string, mixed>>  $inlines
     * @param  array<string, mixed>  $doan
     * @return array<string, mixed>
     */
    private function doan(array $inlines, array $doan = []): array
    {
        return ['paragraphFormat' => $doan, 'inlines' => $inlines];
    }

    /**
     * Số ngoặc nhọn mở trừ đóng (bỏ qua ngoặc được thoát) và độ sâu nhỏ nhất trước ký tự cuối.
     *
     * @return array{0: int, 1: int}
     */
    private function canBangNgoac(string $rtf): array
    {
        $sau = 0;
        $nhoNhat = PHP_INT_MAX;

        for ($i = 0; $i < strlen($rtf); $i++) {
            if ($rtf[$i] === '\\') {
                $i++;
            } elseif ($rtf[$i] === '{') {
                $sau++;
            } elseif ($rtf[$i] === '}') {
                $sau--;
                if ($i < strlen($rtf) - 1) {
                    $nhoNhat = min($nhoNhat, $sau);
                }
            }
        }

        return [$sau, $nhoNhat];
    }

    public function test_output_is_one_balanced_ascii_rtf_group_with_signed_unicode_escapes(): void
    {
        $rtf = $this->rtf([$this->doan([['text' => 'Nguyễn Văn 𝐀 {a} \\ ']])]);

        $this->assertStringStartsWith('{\\rtf1\\ansi\\ansicpg1252\\uc1', $rtf);
        $this->assertStringEndsWith('}', $rtf);
        $this->assertSame(0, preg_match('/[^\x00-\x7F]/', $rtf));
        $this->assertSame([0, 1], $this->canBangNgoac($rtf));
        $this->assertStringContainsString('Nguy\\u7877?n V\\u259?n \\u-10187?\\u-9216? \\{a\\} \\\\ ', $rtf);
        $this->assertStringContainsString('{\\fonttbl', $rtf);
        $this->assertStringContainsString('{\\colortbl;', $rtf);
        $this->assertStringContainsString('{\\stylesheet', $rtf);
    }

    public function test_effective_formatting_from_styles_and_direct_formatting_is_written_explicitly(): void
    {
        $rtf = $this->rtf(
            [$this->doan([['text' => 'Điều 1', 'characterFormat' => ['italic' => true, 'fontColor' => '#FF0000FF']]], ['styleName' => 'Tiêu đề', 'leftIndent' => 36, 'lineSpacing' => 1.5, 'lineSpacingType' => 'Multiple'])],
            [
                'characterFormat' => ['fontFamily' => 'Times New Roman', 'fontSize' => 13],
                'styles' => [
                    ['type' => 'Paragraph', 'name' => 'Normal', 'next' => 'Normal'],
                    ['type' => 'Paragraph', 'name' => 'Tiêu đề', 'basedOn' => 'Normal', 'characterFormat' => ['bold' => true, 'fontSize' => 14], 'paragraphFormat' => ['textAlignment' => 'Center', 'afterSpacing' => 6]],
                ],
            ],
        );

        $this->assertStringContainsString('{\\s1\\qc\\sa120\\fs28\\b\\sbasedon0\\snext1 Ti\\u234?u \\u273?\\u7873?;}', $rtf);
        $this->assertStringContainsString('\\pard\\plain\\s1\\qc\\li720\\ri0\\fi0\\sb0\\sa120\\sl360\\slmult1', $rtf);
        $this->assertStringContainsString('{\\plain\\f0\\fs28\\b\\i\\cf1 \\u272?i\\u7873?u 1}', $rtf);
        $this->assertStringContainsString('{\\colortbl;\\red255\\green0\\blue0;}', $rtf);
    }

    public function test_lists_are_written_to_the_list_tables_and_paragraphs_point_to_them(): void
    {
        $rtf = $this->rtf(
            [$this->doan([['text' => 'a']], ['listFormat' => ['listId' => 3, 'listLevelNumber' => 1]])],
            [
                'lists' => [['listId' => 3, 'abstractListId' => 0, 'levelOverrides' => [['levelNumber' => 0, 'startAt' => 4]]]],
                'abstractLists' => [['abstractListId' => 0, 'levels' => [
                    ['listLevelPattern' => 'Bullet', 'numberFormat' => "\u{F0B7}", 'characterFormat' => ['fontFamily' => 'Symbol'], 'paragraphFormat' => ['leftIndent' => 36, 'firstLineIndent' => -18]],
                    ['listLevelPattern' => 'LowLetter', 'startAt' => 1, 'numberFormat' => '%1.%2)', 'followCharacter' => 'Space'],
                ]]],
            ],
        );

        $this->assertStringContainsString('{\\*\\listtable', $rtf);
        $this->assertStringContainsString('{\\listlevel\\levelnfc23\\levelnfcn23\\leveljc0\\leveljcn0\\levelfollow0\\levelstartat1\\levelspace0\\levelindent0{\\leveltext\\\'01\\u-3913?;}{\\levelnumbers;}\\li720\\fi-360\\f1}', $rtf);
        $this->assertStringContainsString('{\\listlevel\\levelnfc4\\levelnfcn4\\leveljc0\\leveljcn0\\levelfollow1\\levelstartat1\\levelspace0\\levelindent0{\\leveltext\\\'04\\\'00.\\\'01);}{\\levelnumbers\\\'01\\\'03;}', $rtf);
        $this->assertStringContainsString('{\\listoverride\\listid1\\listoverridecount1{\\lfolevel\\listoverridestartat\\levelstartat4}\\ls4}', $rtf);
        $this->assertStringContainsString('\\ls4\\ilvl1', $rtf);
    }

    public function test_tables_with_merged_cells_are_written_as_rows_with_cell_boundaries(): void
    {
        $o = fn (string $chu, float $rong, array $them = []): array => [
            'blocks' => [$this->doan([['text' => $chu]])],
            'cellFormat' => $them + ['cellWidth' => $rong, 'preferredWidth' => $rong, 'preferredWidthType' => 'Point', 'columnSpan' => 1, 'rowSpan' => 1],
        ];
        $rtf = $this->rtf([
            ['rows' => [
                ['rowFormat' => ['height' => 20, 'heightType' => 'Exactly', 'isHeader' => true], 'cells' => [$o('A', 100, ['rowSpan' => 2]), $o('B', 200, ['columnSpan' => 2])]],
                ['rowFormat' => [], 'cells' => [$o('C', 200, ['columnSpan' => 2])]],
            ], 'tableFormat' => ['leftIndent' => 0, 'tableAlignment' => 'Center', 'borders' => ['top' => ['lineStyle' => 'Single', 'lineWidth' => 0.5]]]],
            $this->doan([]),
        ]);

        $this->assertSame(2, substr_count($rtf, '\\trowd'));
        $this->assertSame(2, substr_count($rtf, '\\row'));
        $this->assertSame(4, preg_match_all('/\\\\cell(?![a-z])/', $rtf));
        $this->assertMatchesRegularExpression('/\\\\trowd[^\n]*\\\\trqc[^\n]*\\\\trbrdrt\\\\brdrs\\\\brdrw10[^\n]*\\\\trrh-400\\\\trhdr[^\n]*\\\\clvmgf[^\n]*\\\\cellx2000[^\n]*\\\\cellx6000/', $rtf);
        $this->assertMatchesRegularExpression('/\\\\trowd\\\\irow1[^\n]*\\\\clvmrg[^\n]*\\\\cellx2000[^\n]*\\\\cellx6000/', $rtf);
    }

    public function test_nested_tables_use_the_nesting_control_words(): void
    {
        $long = ['rows' => [['rowFormat' => [], 'cells' => [['blocks' => [$this->doan([['text' => 'N']])], 'cellFormat' => ['cellWidth' => 50]]]]], 'tableFormat' => []];
        $rtf = $this->rtf([
            ['rows' => [['rowFormat' => [], 'cells' => [['blocks' => [$long, $this->doan([])], 'cellFormat' => ['cellWidth' => 100]]]]], 'tableFormat' => []],
            $this->doan([]),
        ]);

        $this->assertStringContainsString('\\intbl\\itap2', $rtf);
        $this->assertStringContainsString('\\nestcell', $rtf);
        $this->assertStringContainsString('{\\*\\nesttableprops\\trowd', $rtf);
        $this->assertStringContainsString('\\nestrow}{\\nonesttables\\par}', $rtf);
        $this->assertSame([0, 1], $this->canBangNgoac($rtf));
    }

    public function test_images_fields_bookmarks_and_breaks_are_written(): void
    {
        $png = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANBAEB3fOq3QAAAABJRU5ErkJggg==';
        $rtf = $this->rtf([$this->doan([
            ['name' => 'dau', 'bookmarkType' => 0],
            ['imageString' => 'data:image/png;base64,'.$png, 'width' => 20, 'height' => 10, 'isInlineImage' => true],
            ['hasFieldEnd' => true, 'fieldType' => 0], ['text' => ' PAGE '], ['fieldType' => 2], ['text' => '1'], ['fieldType' => 1],
            ['name' => 'dau', 'bookmarkType' => 1],
            ['text' => "a\tb\vc\fd"],
        ])]);

        $this->assertStringContainsString('{\\*\\bkmkstart dau}', $rtf);
        $this->assertStringContainsString('{\\pict\\pngblip\\picw2\\pich2\\picwgoal400\\pichgoal200'."\n".rtrim(chunk_split(bin2hex(base64_decode($png)), 128, "\n")).'}', $rtf);
        $this->assertMatchesRegularExpression('/\{\\\\field\{\\\\\*\\\\fldinst \{\\\\plain[^ ]*  PAGE \}\}\{\\\\fldrslt \{\\\\plain[^ ]* 1\}\}\}/', $rtf);
        $this->assertStringContainsString('{\\*\\bkmkend dau}', $rtf);
        $this->assertStringContainsString(' a\\tab b\\line c\\page d}', $rtf);
    }

    public function test_sections_page_setup_and_headers_are_written(): void
    {
        $sfdt = ['sections' => [
            [
                'blocks' => [$this->doan([['text' => 'Một']])],
                'headersFooters' => ['header' => ['blocks' => [$this->doan([['text' => 'Đầu']])]], 'firstPageFooter' => ['blocks' => [$this->doan([['text' => 'Chân']])]]],
                'sectionFormat' => ['pageWidth' => 841.9, 'pageHeight' => 595.3, 'leftMargin' => 85.05, 'rightMargin' => 42.5, 'topMargin' => 56.7, 'bottomMargin' => 56.7, 'headerDistance' => 35.4, 'footerDistance' => 35.4, 'differentFirstPage' => true, 'restartPageNumbering' => true, 'pageStartingNumber' => 3],
            ],
            ['blocks' => [$this->doan([['text' => 'Hai']])], 'sectionFormat' => ['pageWidth' => 595.3, 'pageHeight' => 841.9]],
        ]];

        $rtf = (new SfdtSangRtf)->chuyen(json_encode($sfdt, JSON_THROW_ON_ERROR));

        $this->assertStringContainsString('\\paperw16838\\paperh11906\\margl1701\\margr850\\margt1134\\margb1134', $rtf);
        $this->assertStringContainsString('\\sectd\\sbkpage\\pgwsxn16838\\pghsxn11906\\marglsxn1701\\margrsxn850\\margtsxn1134\\margbsxn1134\\headery708\\footery708\\lndscpsxn\\titlepg\\pgnrestart\\pgnstarts3', $rtf);
        $this->assertMatchesRegularExpression('/\{\\\\header\s*\\\\pard\\\\plain[^{]*\{\\\\plain[^ ]* \\\\u272\?\\\\u7847\?u\}\\\\par\s*\}/', $rtf);
        $this->assertStringContainsString('{\\footerf', $rtf);
        $this->assertMatchesRegularExpression('/M\\\\u7897\?t\}\s*\\\\sect\s*\\\\sectd/', $rtf);
        $this->assertStringContainsString('\\pgwsxn11906\\pghsxn16838', $rtf);
    }

    public function test_the_array_entry_point_writes_the_same_rtf_as_the_json_entry_point(): void
    {
        $docx = DocxTongHop::voiBody('<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Hợp đồng</w:t></w:r></w:p>')->noiDung();

        $quaJson = (new SfdtSangRtf)->chuyen((new DocxSangSfdt)->chuyen($docx));
        $quaMang = (new SfdtSangRtf)->chuyenTuMang((new DocxSangSfdt)->chuyenThanhMang($docx));

        $this->assertSame($quaJson, $quaMang);
    }

    public function test_content_that_is_not_sfdt_is_rejected_with_a_readable_message(): void
    {
        $this->expectException(LoiSfdt::class);
        $this->expectExceptionMessage('Nội dung không phải SFDT hợp lệ');

        (new SfdtSangRtf)->chuyen('{"khong":"phai sfdt"}');
    }
}
