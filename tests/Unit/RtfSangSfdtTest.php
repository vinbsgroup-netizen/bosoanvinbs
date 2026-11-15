<?php

namespace Tests\Unit;

use App\Services\ChuyenDoi\RtfSangSfdt;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * RTF tổng hợp (tự viết, không dùng dữ liệu thật) đổi sang SFDT.
 */
class RtfSangSfdtTest extends TestCase
{
    /**
     * Đầu RTF chung: phông 0 Times New Roman, phông 1 Arial, phông 2 VNI-like cp1258; màu 1 đỏ, 2 xanh, 3 vàng.
     */
    private const DAU = '{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0\froman\fcharset0{\*\panose 02020603050405020304}Times New Roman;}'
        .'{\f1\fswiss\fcharset0 Arial;}{\f2\froman\fcharset163 Times New Roman Viet;}}'
        .'{\colortbl;\red255\green0\blue0;\red0\green0\blue255;\red255\green255\blue0;}';

    /**
     * Ảnh PNG 1x1 điểm ảnh.
     */
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    /**
     * @return array<string, mixed>
     */
    private function chuyen(string $rtf): array
    {
        $json = (new RtfSangSfdt)->chuyen($rtf);
        $sfdt = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        $this->assertIsArray($sfdt['sections'] ?? null);

        return $sfdt;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function khoi(array $sfdt, int $section = 0): array
    {
        return $sfdt['sections'][$section]['blocks'];
    }

    /**
     * Chữ hiển thị của đoạn (bỏ mã lệnh trường).
     *
     * @param  array<string, mixed>  $doan
     */
    private function chu(array $doan): string
    {
        $chu = '';
        $trongMa = false;

        foreach ($doan['inlines'] as $inline) {
            if (isset($inline['fieldType'])) {
                $trongMa = $inline['fieldType'] === 0;

                continue;
            }

            if (! $trongMa) {
                $chu .= $inline['text'] ?? '';
            }
        }

        return $chu;
    }

    /**
     * Inline chữ đầu tiên chứa chuỗi cần tìm.
     *
     * @param  array<string, mixed>  $doan
     * @return array<string, mixed>
     */
    private function inlineCo(array $doan, string $chu): array
    {
        foreach ($doan['inlines'] as $inline) {
            if (str_contains($inline['text'] ?? '', $chu)) {
                return $inline;
            }
        }

        $this->fail("Không có inline chứa \"$chu\".");
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function cachGhiTiengViet(): array
    {
        return [
            '\uN với \uc1 bỏ ký tự thay thế' => ['{\rtf1\ansi\uc1 Ngh\u297 ?a v\\u7909 ?\par}', 'Nghĩa vụ'],
            '\uc2 bỏ hai byte thay thế' => ['{\rtf1\ansi\uc2 \\u7853\\\'61\\\'62n\par}', 'ận'],
            '\uc0 không bỏ gì' => ['{\rtf1\ansi\uc0 \\u7853 x\par}', 'ậx'],
            '\\\'xx theo cp1252' => ['{\rtf1\ansi\ansicpg1252 C\\\'d4NG\par}', 'CÔNG'],
            '\\\'xx theo phông \fcharset163 (cp1258)' => ['{\rtf1\ansi{\fonttbl{\f0\fcharset163 X;}}\f0 t\\\'fd\par}', 'tư'],
            'UTF-8 thô do phần mềm khách ghép' => ['{\\rtf1\\ansi\\uc1 Hợp đồng \\u7889 ?n\\par}', 'Hợp đồng ốn'],
            'cặp surrogate' => ['{\rtf1\ansi\uc1 \u-10179 ?\u-8704 ?\par}', "\u{1F600}"],
            'ký tự đặc biệt' => ['{\rtf1\ansi a\emdash b\endash c\lquote d\rquote\ldblquote e\rdblquote\bullet\~f\par}', "a—b–c‘d’“e”•\u{00A0}f"],
            'ngoặc và gạch chéo thoát' => ['{\rtf1\ansi \{a\}\\\\b\par}', '{a}\\b'],
        ];
    }

    #[DataProvider('cachGhiTiengViet')]
    public function test_decodes_text_written_in_each_rtf_encoding(string $rtf, string $chuMongDoi): void
    {
        $this->assertSame($chuMongDoi, $this->chu($this->khoi($this->chuyen($rtf))[0]));
    }

    public function test_maps_character_formatting(): void
    {
        $sfdt = $this->chuyen(self::DAU.'\pard\plain\fs24 '
            .'{\b dam}{\i nghieng}{\ul don}{\uldb kep}{\ulwave song}{\strike gach}{\striked kepgach}{\super tren}{\sub duoi}'
            .'{\fs32 to}{\f1 arial}{\cf1 maudo}{\highlight3 vang}{\caps hoa}{\v an}\par}');
        $doan = $this->khoi($sfdt)[0];

        $this->assertTrue($this->inlineCo($doan, 'dam')['characterFormat']['bold']);
        $this->assertTrue($this->inlineCo($doan, 'nghieng')['characterFormat']['italic']);
        $this->assertSame('Single', $this->inlineCo($doan, 'don')['characterFormat']['underline']);
        $this->assertSame('Double', $this->inlineCo($doan, 'kep')['characterFormat']['underline']);
        $this->assertSame('Wavy', $this->inlineCo($doan, 'song')['characterFormat']['underline']);
        $this->assertSame('SingleStrike', $this->inlineCo($doan, 'gach')['characterFormat']['strikethrough']);
        $this->assertSame('DoubleStrike', $this->inlineCo($doan, 'kepgach')['characterFormat']['strikethrough']);
        $this->assertSame('Superscript', $this->inlineCo($doan, 'tren')['characterFormat']['baselineAlignment']);
        $this->assertSame('Subscript', $this->inlineCo($doan, 'duoi')['characterFormat']['baselineAlignment']);
        $this->assertSame(16.0, $this->inlineCo($doan, 'to')['characterFormat']['fontSize']);
        $this->assertSame(12.0, $this->inlineCo($doan, 'dam')['characterFormat']['fontSize']);
        $this->assertSame('Arial', $this->inlineCo($doan, 'arial')['characterFormat']['fontFamily']);
        $this->assertSame('Times New Roman', $this->inlineCo($doan, 'dam')['characterFormat']['fontFamily']);
        $this->assertSame('#FF0000FF', $this->inlineCo($doan, 'maudo')['characterFormat']['fontColor']);
        $this->assertSame('#00000000', $this->inlineCo($doan, 'dam')['characterFormat']['fontColor']);
        $this->assertSame('Yellow', $this->inlineCo($doan, 'vang')['characterFormat']['highlightColor']);
        $this->assertTrue($this->inlineCo($doan, 'hoa')['characterFormat']['allCaps']);
        $this->assertStringNotContainsString('QQAN', $this->chu($doan), 'Chữ ẩn (\v) không hiển thị.');
    }

    public function test_merges_adjacent_text_with_the_same_formatting_into_one_inline(): void
    {
        $doan = $this->khoi($this->chuyen('{\rtf1\ansi\uc1 C\\u7896 ?NG\loch\f0  H\hich\f0 \\u210 ?A\par}'))[0];

        $this->assertCount(1, $doan['inlines']);
        $this->assertSame('CỘNG HÒA', $doan['inlines'][0]['text']);
    }

    public function test_maps_paragraph_formatting(): void
    {
        $khoi = $this->khoi($this->chuyen(self::DAU
            .'\pard\qc\li720\ri360\fi-360\sb240\sa120\sl360\slmult1 a\par'
            .'\pard\qj\sl-300\slmult0 b\par'
            .'\pard\qr\sl300\slmult0\tx720\tqc\tx2880\tqr\tldot\tx5000 c\par'
            .'\pard\outlinelevel1\contextualspace d\par}'));

        $this->assertSame([
            'leftIndent' => 36.0, 'rightIndent' => 18.0, 'firstLineIndent' => -18.0, 'beforeSpacing' => 12.0, 'afterSpacing' => 6.0,
            'lineSpacing' => 1.5, 'lineSpacingType' => 'Multiple', 'textAlignment' => 'Center',
        ], array_intersect_key($khoi[0]['paragraphFormat'], array_flip([
            'leftIndent', 'rightIndent', 'firstLineIndent', 'beforeSpacing', 'afterSpacing', 'lineSpacing', 'lineSpacingType', 'textAlignment',
        ])));
        $this->assertSame(['Justify', 15.0, 'Exactly'], [
            $khoi[1]['paragraphFormat']['textAlignment'], $khoi[1]['paragraphFormat']['lineSpacing'], $khoi[1]['paragraphFormat']['lineSpacingType'],
        ]);
        $this->assertSame(['Right', 'AtLeast'], [$khoi[2]['paragraphFormat']['textAlignment'], $khoi[2]['paragraphFormat']['lineSpacingType']]);
        $this->assertSame([
            ['tabJustification' => 'Left', 'position' => 36.0, 'tabLeader' => 'None', 'deletePosition' => 0.0],
            ['tabJustification' => 'Center', 'position' => 144.0, 'tabLeader' => 'None', 'deletePosition' => 0.0],
            ['tabJustification' => 'Right', 'position' => 250.0, 'tabLeader' => 'Dot', 'deletePosition' => 0.0],
        ], $khoi[2]['paragraphFormat']['tabs']);
        $this->assertSame('Level2', $khoi[3]['paragraphFormat']['outlineLevel']);
        $this->assertTrue($khoi[3]['paragraphFormat']['contextualSpacing']);
        $this->assertSame('Left', $khoi[3]['paragraphFormat']['textAlignment'], '\pard đưa định dạng đoạn về mặc định.');
    }

    public function test_writes_tab_line_and_page_breaks_as_separate_inlines(): void
    {
        $doan = $this->khoi($this->chuyen('{\rtf1\ansi a\tab b\line c\page d\-e\_f\par}'))[0];

        $this->assertSame(['a', "\t", 'b', "\u{000B}", 'c', "\f", "d\x1Fe\x1Ef"], array_column($doan['inlines'], 'text'));
    }

    public function test_page_break_before_starts_the_paragraph_on_a_new_page_except_at_section_start(): void
    {
        $khoi = $this->khoi($this->chuyen('{\rtf1\ansi\pard\pagebb Dau\par\pard Giua\par\pard\pagebb Chuong\par\pard Sau\par}'));

        $this->assertSame([['Dau'], ['Giua'], ["\f", 'Chuong'], ['Sau']], array_map(
            fn (array $doan): array => array_column($doan['inlines'], 'text'),
            $khoi,
        ));
    }

    public function test_maps_page_setup_headers_footers_and_section_breaks(): void
    {
        $sfdt = $this->chuyen(self::DAU.'\paperw12240\paperh15840\margl1440\margr1440\margt1440\margb1440'
            .'\sectd\pgwsxn11906\pghsxn16838\marglsxn1701\margrsxn1134\margtsxn1134\margbsxn1134\headery567\footery680\titlepg\pgnrestart\pgnstarts1'
            .'{\header\pard\qc Dau trang\par}{\footer\pard\qr Trang {\field{\*\fldinst{ PAGE }}{\fldrslt{1}}}/{\field{\*\fldinst NUMPAGES}{\fldrslt 2}}\par}'
            .'{\headerf\pard Trang dau\par}'
            .'\pard Phan mot\par\sect\sectd\lndscpsxn\pgwsxn11906\pghsxn16838 \pard Phan hai\par}');

        $this->assertCount(2, $sfdt['sections']);
        $this->assertSame([
            'headerDistance' => 28.35, 'footerDistance' => 34.0, 'pageWidth' => 595.3, 'pageHeight' => 841.9, 'leftMargin' => 85.05,
            'rightMargin' => 56.7, 'topMargin' => 56.7, 'bottomMargin' => 56.7, 'differentFirstPage' => true,
            'differentOddAndEvenPages' => false, 'bidi' => false, 'restartPageNumbering' => true, 'pageStartingNumber' => 1,
        ], $sfdt['sections'][0]['sectionFormat']);
        $this->assertSame(['header', 'footer', 'firstPageHeader'], array_keys($sfdt['sections'][0]['headersFooters']));
        $this->assertSame(['Phan mot', ''], array_map($this->chu(...), $this->khoi($sfdt)), '\sect kết thúc đoạn như Word.');

        $chanTrang = $sfdt['sections'][0]['headersFooters']['footer']['blocks'][0];
        $this->assertSame('Trang 1/2', $this->chu($chanTrang));
        $this->assertSame(
            [['hasFieldEnd' => true, 'fieldType' => 0], ' PAGE ', ['fieldType' => 2], '1', ['fieldType' => 1]],
            array_map(fn (array $inline): mixed => $inline['text'] ?? $inline, array_slice($chanTrang['inlines'], 1, 5)),
        );

        // \lndscpsxn với khổ ghi theo chiều dọc: đổi thành trang ngang.
        $phanHai = $sfdt['sections'][1]['sectionFormat'];
        $this->assertSame([841.9, 595.3, 72.0, false], [$phanHai['pageWidth'], $phanHai['pageHeight'], $phanHai['leftMargin'], $phanHai['differentFirstPage']]);
        $this->assertSame('Phan hai', $this->chu($this->khoi($sfdt, 1)[0]));
    }

    public function test_builds_tables_with_widths_merges_borders_and_shading(): void
    {
        $sfdt = $this->chuyen(self::DAU.'\pard Truoc\par'
            .'\trowd\trgaph108\trleft-108\trrh400\trpaddl108\trpaddr108\trpaddfl3\trpaddfr3'
            .'\clvmgf\clvertalc\clbrdrt\brdrs\brdrw10\brdrcf2\clcbpat3\cellx3000\clmgf\cellx6000\clmrg\cellx9000'
            .'\pard\intbl A1\cell B1\cell\cell\row'
            .'\trowd\trgaph108\trleft-108\clvmrg\cellx3000\clpadt200\clpadft3\cellx6000\cellx9000'
            .'\pard\intbl Ban sao\cell B2\cell C2\cell\row'
            .'\pard Sau\par}');
        $khoi = $this->khoi($sfdt);

        $this->assertSame(['Truoc', 'Sau'], [$this->chu($khoi[0]), $this->chu($khoi[2])]);
        $bang = $khoi[1];
        $this->assertCount(2, $bang['rows']);
        $this->assertSame(5.4, $bang['tableFormat']['leftMargin']);
        $this->assertSame(0.0, $bang['tableFormat']['leftIndent']);

        [$hang1, $hang2] = $bang['rows'];
        $this->assertSame(20.0, $hang1['rowFormat']['height']);
        $this->assertSame('AtLeast', $hang1['rowFormat']['heightType']);
        $this->assertCount(2, $hang1['cells'], 'Ô \clmrg gộp vào ô \clmgf.');

        $o = $hang1['cells'][0]['cellFormat'];
        $this->assertSame([2, 1, 155.4, 'Center'], [$o['rowSpan'], $o['columnSpan'], $o['cellWidth'], $o['verticalAlignment']]);
        $this->assertSame(['Single', 0.5, '#0000FFFF'], [$o['borders']['top']['lineStyle'], $o['borders']['top']['lineWidth'], $o['borders']['top']['color']]);
        $this->assertSame('Cleared', $o['borders']['left']['lineStyle']);
        $this->assertSame('#FFFF00FF', $o['shading']['backgroundColor']);
        $this->assertSame([2, 300.0, 'B1'], [
            $hang1['cells'][1]['cellFormat']['columnSpan'], $hang1['cells'][1]['cellFormat']['cellWidth'], $this->chu($hang1['cells'][1]['blocks'][0]),
        ]);

        $this->assertSame(['B2', 'C2'], array_map(fn (array $o): string => $this->chu($o['blocks'][0]), $hang2['cells']), 'Ô \clvmrg bị bỏ.');
        $this->assertSame(['A1'], array_map($this->chu(...), $hang1['cells'][0]['blocks']), 'Chữ trong ô \clvmrg không hiển thị, như Word.');
        $this->assertSame([10.0, false], [$hang2['cells'][0]['cellFormat']['leftMargin'], $hang2['cells'][0]['cellFormat']['isSamePaddingAsTable']]);
    }

    public function test_keeps_nested_tables_inside_the_outer_cell(): void
    {
        $khoi = $this->khoi($this->chuyen('{\rtf1\ansi \pard Truoc\par'
            .'\trowd\cellx4000\cellx8000\pard\intbl Ngoai A\par'
            .'\pard\intbl\itap2 Trong 1\nestcell Trong 2\nestcell{\*\nesttableprops\trowd\cellx1000\cellx2000\nestrow}{\nonesttables\par}'
            .'\pard\intbl\itap1 Sau long\cell Ngoai B\cell\trowd\cellx4000\cellx8000\row\pard Sau\par}'));

        $this->assertCount(3, $khoi);
        $o = $khoi[1]['rows'][0]['cells'];
        $this->assertCount(2, $o);
        $this->assertSame('Ngoai A', $this->chu($o[0]['blocks'][0]));
        $this->assertSame(['Trong 1', 'Trong 2'], array_map(
            fn (array $c): string => $this->chu($c['blocks'][0]),
            $o[0]['blocks'][1]['rows'][0]['cells'],
        ));
        $this->assertSame('Sau long', $this->chu($o[0]['blocks'][2]));
        $this->assertSame('Ngoai B', $this->chu($o[1]['blocks'][0]));
        $this->assertSame('Sau', $this->chu($khoi[2]));
    }

    public function test_converts_list_table_to_lists_and_skips_list_text(): void
    {
        $sfdt = $this->chuyen(self::DAU.'{\*\listtable'
            .'{\list\listtemplateid1{\listlevel\levelnfc0\levelfollow0\levelstartat3{\leveltext\\\'02\\\'00.;}{\levelnumbers\\\'01;}\b\fi-360\li720}'
            .'{\listlevel\levelnfc4\levelstartat1{\leveltext\\\'03\\\'00.\\\'01;}{\levelnumbers\\\'01\\\'03;}\fi-360\li1440}\listid10}'
            .'{\list\listtemplateid2\listsimple{\listlevel\levelnfc23{\leveltext\\\'01\u-3913 ?;}{\levelnumbers;}\f1\fi-360\li720}\listid20}}'
            .'{\*\listoverridetable{\listoverride\listid10\listoverridecount0\ls1}{\listoverride\listid20\listoverridecount0\ls2}}'
            .'\pard\ls1\ilvl0{\listtext 3.\tab}Mot\par\pard\ls1\ilvl1{\listtext 3.a\tab}Hai\par\pard\ls2{\pntext x\tab}Ba\par\pard Thuong\par}');
        $khoi = $this->khoi($sfdt);

        $this->assertSame(['Mot', 'Hai', 'Ba', 'Thuong'], array_map($this->chu(...), $khoi));
        $this->assertSame(['listLevelNumber' => 0, 'listId' => 0], $khoi[0]['paragraphFormat']['listFormat']);
        $this->assertSame(['listLevelNumber' => 1, 'listId' => 0], $khoi[1]['paragraphFormat']['listFormat']);
        $this->assertSame(['listLevelNumber' => 0, 'listId' => 1], $khoi[2]['paragraphFormat']['listFormat']);
        $this->assertArrayNotHasKey('listFormat', $khoi[3]['paragraphFormat']);
        $this->assertSame([['listId' => 0, 'abstractListId' => 0], ['listId' => 1, 'abstractListId' => 1]], $sfdt['lists']);

        $mucSo = $sfdt['abstractLists'][0]['levels'];
        $this->assertCount(9, $mucSo);
        $this->assertSame(['Arabic', '%1.', 3, true, 36.0, -18.0], [
            $mucSo[0]['listLevelPattern'], $mucSo[0]['numberFormat'], $mucSo[0]['startAt'], $mucSo[0]['characterFormat']['bold'],
            $mucSo[0]['paragraphFormat']['leftIndent'], $mucSo[0]['paragraphFormat']['firstLineIndent'],
        ]);
        $this->assertSame(['LowLetter', '%1.%2'], [$mucSo[1]['listLevelPattern'], $mucSo[1]['numberFormat']]);

        $gachDauDong = $sfdt['abstractLists'][1]['levels'][0];
        $this->assertSame(['Bullet', "\u{F0B7}", 'Arial'], [
            $gachDauDong['listLevelPattern'], $gachDauDong['numberFormat'], $gachDauDong['characterFormat']['fontFamily'],
        ]);
    }

    public function test_embeds_png_images_and_skips_metafiles(): void
    {
        $hex = bin2hex(base64_decode(self::PNG));
        $doan = $this->khoi($this->chuyen('{\rtf1\ansi a{\pict{\*\picprop{\sp{\sn x}{\sv 1}}}\pngblip\picw1\pich1\picwgoal300\pichgoal150\picscalex200\picscaley100 '
            .chunk_split($hex, 64, "\r\n").'}b{\pict\wmetafile8\picw10\pich10 0102030405}'
            .'{\*\shppict{\pict\pngblip\picwgoal20\pichgoal20 '.$hex.'}}{\nonshppict{\pict\wmetafile8 0102}}c\par}'))[0];

        $anh = array_values(array_filter($doan['inlines'], fn (array $i): bool => isset($i['imageString'])));
        $this->assertCount(2, $anh);
        $this->assertSame('data:image/png;base64,'.self::PNG, $anh[0]['imageString']);
        $this->assertSame([30.0, 7.5, true], [$anh[0]['width'], $anh[0]['height'], $anh[0]['isInlineImage']]);
        $this->assertSame('abc', $this->chu($doan));
    }

    public function test_reads_styles_bookmarks_and_skips_unknown_destinations(): void
    {
        $sfdt = $this->chuyen(self::DAU.'{\stylesheet{\s0\ql\f0\fs24 Normal;}{\*\cs10\additive Default Paragraph Font;}'
            .'{\s1\qc\b\f1\fs28\sbasedon0\snext0 heading 1;}{\*\cs2\i\additive\sbasedon10 Nhan;}}'
            .'{\info{\title An}{\author An}}{\*\generator An;}{\*\rsidtbl \rsid1}'
            .'\pard\s1{\*\bkmkstart Moc}Tieu de{\*\bkmkend Moc}\par'
            .'\pard\s0 Chu {\cs2 nhan}{\*\unknowndest an}{\*\txfieldtext an}{\xe an}{\pntext an} {\*\x \bin5 }}}}}} tiep\bin3 abc\par}');
        $khoi = $this->khoi($sfdt);

        $this->assertSame(['Tieu de', 'Chu nhan  tiep'], array_map($this->chu(...), $khoi));
        $this->assertSame('Heading 1', $khoi[0]['paragraphFormat']['styleName']);
        $this->assertSame(['name' => 'Moc', 'bookmarkType' => 0], $khoi[0]['inlines'][0]);
        $this->assertSame('Nhan', $this->inlineCo($khoi[1], 'nhan')['characterFormat']['styleName']);

        $kieu = array_column($sfdt['styles'], null, 'name');
        $this->assertSame(['Paragraph', 'Normal', 'Normal'], [$kieu['Heading 1']['type'], $kieu['Heading 1']['basedOn'], $kieu['Heading 1']['next']]);
        $this->assertSame(['Center', true, 14.0, 'Arial'], [
            $kieu['Heading 1']['paragraphFormat']['textAlignment'], $kieu['Heading 1']['characterFormat']['bold'],
            $kieu['Heading 1']['characterFormat']['fontSize'], $kieu['Heading 1']['characterFormat']['fontFamily'],
        ]);
        $this->assertSame('Character', $kieu['Nhan']['type']);
        $this->assertSame(['type' => 'Character', 'name' => 'Default Paragraph Font'], $kieu['Default Paragraph Font']);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function rtfHong(): array
    {
        return [
            'chuỗi rỗng' => [''],
            'không phải RTF' => ['Xin chào, đây không phải RTF'],
            'thiếu ngoặc đóng' => ['{\rtf1\ansi {\b dở dang\par \trowd\cellx100\pard\intbl ô'],
            'thừa ngoặc đóng' => ['{\rtf1\ansi a}}}}\par b}'],
            '\bin vượt quá cuối' => ['{\rtf1\ansi a\bin999999 xyz'],
            'byte rác và \u lạ' => ["{\\rtf1\\ansi \x00\x01\xFF\xFE \\u999999 \\u-999999 \\'zz \\'\\cell\\row\\nestrow\\nestcell}"],
            'hàng không có \cellx' => ['{\rtf1\ansi\pard\intbl a\cell b\cell\row}'],
            'trường lồng không kết thúc' => ['{\rtf1\ansi{\field{\*\fldinst{\field{\*\fldinst PAGE'],
            'bảng lồng quá sâu' => ['{\rtf1\ansi\pard\intbl\itap40 sau\nestcell\nestrow\row}'],
        ];
    }

    #[DataProvider('rtfHong')]
    public function test_broken_rtf_still_returns_valid_sfdt(string $rtf): void
    {
        $sfdt = $this->chuyen($rtf);

        $this->assertNotEmpty($sfdt['sections']);
        $this->assertArrayHasKey('blocks', $sfdt['sections'][0]);
        $this->assertArrayHasKey('sectionFormat', $sfdt['sections'][0]);
    }

    public function test_document_without_any_paragraph_still_has_one_empty_paragraph_so_the_editor_can_open_it(): void
    {
        $sfdt = $this->chuyen(self::DAU.'\sectd\pgwsxn11906 {\footer\pard Chan\par}\pard }');

        $this->assertCount(1, $sfdt['sections']);
        $this->assertSame([[]], array_column($this->khoi($sfdt), 'inlines'));
        $this->assertSame('Chan', $this->chu($sfdt['sections'][0]['headersFooters']['footer']['blocks'][0]));
    }
}
