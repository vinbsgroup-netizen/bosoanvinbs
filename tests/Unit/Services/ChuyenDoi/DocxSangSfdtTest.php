<?php

namespace Tests\Unit\Services\ChuyenDoi;

use App\Services\ChuyenDoi\Docx\LoiDocx;
use App\Services\ChuyenDoi\DocxSangSfdt;
use PHPUnit\Framework\TestCase;
use ZipArchive;

class DocxSangSfdtTest extends TestCase
{
    /**
     * @return array<string, mixed>
     */
    private function chuyen(DocxTongHop $docx): array
    {
        return json_decode((new DocxSangSfdt)->chuyen($docx->noiDung()), true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @return array<string, mixed>
     */
    private function khoi(array $sfdt, int $chiSo = 0): array
    {
        return $sfdt['sections'][0]['blocks'][$chiSo];
    }

    public function test_paragraph_and_run_formatting_is_converted_to_points_and_sfdt_names(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:pPr><w:jc w:val="both"/><w:ind w:left="720" w:right="240" w:hanging="360"/>'
            .'<w:spacing w:before="120" w:after="240" w:line="360" w:lineRule="auto"/><w:outlineLvl w:val="0"/>'
            .'<w:rPr><w:sz w:val="26"/></w:rPr></w:pPr>'
            .'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Arial"/><w:b/><w:i/><w:u w:val="double"/>'
            .'<w:strike/><w:vertAlign w:val="superscript"/><w:highlight w:val="yellow"/><w:color w:val="FF0000"/>'
            .'<w:sz w:val="28"/><w:szCs w:val="24"/></w:rPr><w:t>Bên A</w:t></w:r></w:p>'
            .'<w:p><w:pPr><w:spacing w:line="300" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:color w:val="auto"/></w:rPr><w:t>x</w:t></w:r></w:p>',
        );

        $sfdt = $this->chuyen($docx);

        $this->assertSame([
            'leftIndent' => 36.0, 'rightIndent' => 12.0, 'firstLineIndent' => -18.0, 'beforeSpacing' => 6.0, 'afterSpacing' => 12.0,
            'lineSpacing' => 1.5, 'lineSpacingType' => 'Multiple', 'outlineLevel' => 'Level1', 'textAlignment' => 'Justify',
            'styleName' => 'Normal',
        ], $this->khoi($sfdt)['paragraphFormat']);
        $this->assertSame(['fontSize' => 13.0], $this->khoi($sfdt)['characterFormat']);
        $this->assertSame([
            'text' => 'Bên A',
            'characterFormat' => [
                'bold' => true, 'italic' => true, 'underline' => 'Double', 'strikethrough' => 'SingleStrike',
                'baselineAlignment' => 'Superscript', 'highlightColor' => 'Yellow', 'fontSize' => 14.0,
                'fontFamily' => 'Times New Roman', 'fontColor' => '#FF0000FF', 'fontSizeBidi' => 12.0, 'fontFamilyBidi' => 'Arial',
            ],
        ], $this->khoi($sfdt)['inlines'][0]);
        $this->assertSame(['lineSpacing' => 15.0, 'lineSpacingType' => 'Exactly', 'styleName' => 'Normal'], $this->khoi($sfdt, 1)['paragraphFormat']);
        $this->assertSame(['bold' => false, 'fontColor' => '#00000000'], $this->khoi($sfdt, 1)['inlines'][0]['characterFormat']);
    }

    public function test_tabs_breaks_and_symbols_become_separate_inlines(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9000"/><w:tab w:val="clear" w:pos="720"/></w:tabs></w:pPr>'
            .'<w:r><w:t>a</w:t><w:tab/><w:t>b</w:t><w:br/><w:t>c</w:t><w:br w:type="page"/>'
            .'<w:sym w:font="Wingdings" w:char="F0FC"/><w:noBreakHyphen/></w:r></w:p>',
        );

        $khoi = $this->khoi($this->chuyen($docx));

        $this->assertSame([
            ['tabJustification' => 'Right', 'position' => 450.0, 'tabLeader' => 'Dot', 'deletePosition' => 0.0],
            ['tabJustification' => 'Left', 'position' => 0.0, 'tabLeader' => 'None', 'deletePosition' => 36.0],
        ], $khoi['paragraphFormat']['tabs']);
        $this->assertSame(
            ['a', "\t", 'b', "\v", 'c', "\f", "\u{F0FC}", "\u{1E}"],
            array_column($khoi['inlines'], 'text'),
        );
        $this->assertSame(['fontFamily' => 'Wingdings'], $khoi['inlines'][6]['characterFormat']);
    }

    public function test_fields_hyperlinks_and_bookmarks_follow_the_net_inline_layout(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:hyperlink r:id="rIdLienKet"><w:r><w:t>web</w:t></w:r></w:hyperlink>'
            .'<w:hyperlink w:anchor="dieu-1"><w:r><w:t>trong</w:t></w:r></w:hyperlink>'
            .'<w:bookmarkStart w:id="1" w:name="dieu-1"/><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple><w:bookmarkEnd w:id="1"/>'
            .'<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>'
            .'<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>2</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>',
        )->lienKetNgoai('rIdLienKet', 'http://vi-du.test/a');

        $inlines = $this->khoi($this->chuyen($docx))['inlines'];

        $this->assertSame([
            ['hasFieldEnd' => true, 'fieldType' => 0], ['text' => 'HYPERLINK "http://vi-du.test/a" '], ['fieldType' => 2], ['text' => 'web'], ['fieldType' => 1],
            ['hasFieldEnd' => true, 'fieldType' => 0], ['text' => 'HYPERLINK \\l "dieu-1"'], ['fieldType' => 2], ['text' => 'trong'], ['fieldType' => 1],
            ['name' => 'dieu_1', 'bookmarkType' => 0],
            ['hasFieldEnd' => true, 'fieldType' => 0], ['text' => ' PAGE '], ['fieldType' => 2], ['text' => '1'], ['fieldType' => 1],
            ['name' => 'dieu_1', 'bookmarkType' => 1],
            ['hasFieldEnd' => true, 'fieldType' => 0], ['text' => ' NUMPAGES '], ['fieldType' => 2], ['text' => '2'], ['fieldType' => 1],
        ], $inlines);
    }

    public function test_form_field_data_is_kept_on_the_field_begin(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val="Chon"/><w:enabled/>'
            .'<w:checkBox><w:sizeAuto/><w:default w:val="0"/><w:checked/></w:checkBox></w:ffData></w:fldChar></w:r>'
            .'<w:r><w:instrText> FORMCHECKBOX </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>',
        );

        $batDau = $this->khoi($this->chuyen($docx))['inlines'][0];

        $this->assertSame([
            'hasFieldEnd' => true,
            'formFieldData' => [
                'name' => 'Chon', 'enabled' => true, 'helpText' => '', 'statusText' => '',
                'checkBox' => ['sizeType' => 'Auto', 'size' => 20, 'defaultValue' => false, 'checked' => true],
            ],
            'fieldType' => 0,
        ], $batDau);
    }

    public function test_styles_doc_defaults_and_built_in_names_are_converted(): void
    {
        $docx = DocxTongHop::voiBody('<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:rStyle w:val="Nhan"/></w:rPr><w:t>x</w:t></w:r></w:p>')
            ->kieu(
                '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="26"/></w:rPr></w:rPrDefault>'
                .'<w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults>'
                .'<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
                .'<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:link w:val="Heading1Char"/>'
                .'<w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/></w:rPr></w:style>'
                .'<w:style w:type="character" w:styleId="Heading1Char"><w:name w:val="Heading 1 Char"/><w:link w:val="Heading1"/></w:style>'
                .'<w:style w:type="character" w:styleId="Nhan"><w:name w:val="Nhấn"/><w:rPr><w:i/></w:rPr></w:style>'
                .'<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>',
            );

        $sfdt = $this->chuyen($docx);

        $this->assertSame(['fontSize' => 13.0, 'fontFamily' => 'Times New Roman', 'fontFamilyBidi' => 'Times New Roman'], $sfdt['characterFormat']);
        $this->assertSame(['afterSpacing' => 6.0], $sfdt['paragraphFormat']);
        $this->assertSame([
            ['type' => 'Paragraph', 'name' => 'Normal', 'next' => 'Normal'],
            ['type' => 'Paragraph', 'name' => 'Heading 1', 'basedOn' => 'Normal', 'next' => 'Heading 1', 'link' => 'Heading 1 Char',
                'characterFormat' => ['bold' => true], 'paragraphFormat' => ['outlineLevel' => 'Level1']],
            ['type' => 'Character', 'name' => 'Heading 1 Char', 'basedOn' => 'Default Paragraph Font'],
            ['type' => 'Character', 'name' => 'Nhấn', 'basedOn' => 'Default Paragraph Font', 'characterFormat' => ['italic' => true]],
        ], $sfdt['styles']);
        $this->assertSame('Heading 1', $this->khoi($sfdt)['paragraphFormat']['styleName']);
        $this->assertSame(['styleName' => 'Nhấn'], $this->khoi($sfdt)['inlines'][0]['characterFormat']);
    }

    public function test_numbering_keeps_only_used_lists_and_overrides_get_a_new_list_id(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="7"/></w:numPr></w:pPr><w:r><w:t>a</w:t></w:r></w:p>'
            .'<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="8"/></w:numPr></w:pPr><w:r><w:t>b</w:t></w:r></w:p>'
            .'<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr></w:pPr><w:r><w:t>c</w:t></w:r></w:p>',
        )->danhSach(
            '<w:abstractNum w:abstractNumId="40"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="-"/></w:lvl></w:abstractNum>'
            .'<w:abstractNum w:abstractNumId="41"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>'
            .'<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>'
            .'<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:suff w:val="space"/><w:lvlText w:val="%2)"/>'
            .'<w:rPr><w:b/></w:rPr></w:lvl></w:abstractNum>'
            .'<w:num w:numId="7"><w:abstractNumId w:val="41"/></w:num>'
            .'<w:num w:numId="8"><w:abstractNumId w:val="41"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="5"/></w:lvlOverride></w:num>',
        );

        $sfdt = $this->chuyen($docx);

        $this->assertSame(['listLevelNumber' => 1, 'listId' => 1], $this->khoi($sfdt)['paragraphFormat']['listFormat']);
        $this->assertSame(['listLevelNumber' => 0, 'listId' => 2], $this->khoi($sfdt, 1)['paragraphFormat']['listFormat']);
        $this->assertSame(['listLevelNumber' => 0, 'listId' => -1], $this->khoi($sfdt, 2)['paragraphFormat']['listFormat']);
        $this->assertSame([
            ['listId' => 1, 'abstractListId' => 1],
            ['listId' => 2, 'abstractListId' => 1, 'levelOverrides' => [['startAt' => 5, 'levelNumber' => 0]]],
        ], $sfdt['lists']);
        $this->assertCount(1, $sfdt['abstractLists']);
        $this->assertCount(9, $sfdt['abstractLists'][0]['levels']);
        $this->assertSame([
            'startAt' => 1, 'restartLevel' => 0, 'listLevelPattern' => 'Arabic', 'followCharacter' => 'Tab', 'numberFormat' => '%1.',
            'paragraphFormat' => ['leftIndent' => 36.0, 'firstLineIndent' => -18.0],
        ], $sfdt['abstractLists'][0]['levels'][0]);
        $this->assertSame([
            'startAt' => 1, 'restartLevel' => 1, 'listLevelPattern' => 'LowLetter', 'followCharacter' => 'Space', 'numberFormat' => '%2)',
            'characterFormat' => ['bold' => true],
        ], $sfdt['abstractLists'][0]['levels'][1]);
        $this->assertSame(['startAt' => 0, 'restartLevel' => 2, 'listLevelPattern' => 'Arabic', 'followCharacter' => 'Tab'], $sfdt['abstractLists'][0]['levels'][2]);
    }

    public function test_table_merges_borders_shading_and_nested_tables_are_converted(): void
    {
        $o = fn (string $tcPr, string $noiDung): string => '<w:tc><w:tcPr>'.$tcPr.'</w:tcPr>'.$noiDung.'</w:tc>';
        $doan = fn (string $chu): string => '<w:p><w:r><w:t>'.$chu.'</w:t></w:r></w:p>';
        $docx = DocxTongHop::voiBody(
            '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:jc w:val="center"/><w:tblInd w:w="100" w:type="dxa"/>'
            .'<w:tblBorders><w:top w:val="single" w:sz="4" w:color="000000"/><w:insideH w:val="dotted" w:sz="8"/></w:tblBorders>'
            .'<w:tblCellMar><w:left w:w="108" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar><w:tblLayout w:type="fixed"/></w:tblPr>'
            .'<w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="3000"/><w:gridCol w:w="4000"/></w:tblGrid>'
            .'<w:tr><w:trPr><w:trHeight w:val="400" w:hRule="exact"/><w:tblHeader/><w:cantSplit/></w:trPr>'
            .$o('<w:tcW w:w="5000" w:type="dxa"/><w:gridSpan w:val="2"/><w:shd w:val="clear" w:fill="D9D9D9"/><w:vAlign w:val="center"/>', $doan('A'))
            .$o('<w:tcW w:w="4000" w:type="dxa"/><w:vMerge w:val="restart"/><w:tcBorders><w:bottom w:val="double" w:sz="12" w:color="00FF00"/></w:tcBorders><w:tcMar><w:left w:w="0" w:type="dxa"/></w:tcMar>', $doan('B'))
            .'</w:tr><w:tr>'
            .$o('<w:tcW w:w="2000" w:type="dxa"/>', $doan('C'))
            .$o('<w:tcW w:w="3000" w:type="dxa"/>', '<w:tbl><w:tblGrid><w:gridCol w:w="1000"/></w:tblGrid><w:tr>'.$o('<w:tcW w:w="1000" w:type="dxa"/>', $doan('N')).'</w:tr></w:tbl><w:p/>')
            .$o('<w:tcW w:w="4000" w:type="dxa"/><w:vMerge/>', '<w:p/>')
            .'</w:tr></w:tbl><w:p/>',
        );

        $bang = $this->khoi($this->chuyen($docx));

        $this->assertSame(['allowAutoFit', 'leftMargin', 'rightMargin', 'leftIndent', 'tableAlignment', 'preferredWidth', 'preferredWidthType', 'borders', 'bidi'], array_keys($bang['tableFormat']));
        $this->assertSame([5.0, 'Center', 100.0, 'Percent'], [$bang['tableFormat']['leftIndent'], $bang['tableFormat']['tableAlignment'], $bang['tableFormat']['preferredWidth'], $bang['tableFormat']['preferredWidthType']]);
        $this->assertSame(['lineStyle' => 'Single', 'lineWidth' => 0.5, 'shadow' => false, 'space' => 0.0, 'hasNoneStyle' => false, 'color' => '#000000FF'], $bang['tableFormat']['borders']['top']);
        $this->assertSame('Dot', $bang['tableFormat']['borders']['horizontal']['lineStyle']);
        $this->assertSame([true, 20.0, 'Exactly', false], [$bang['rows'][0]['rowFormat']['isHeader'], $bang['rows'][0]['rowFormat']['height'], $bang['rows'][0]['rowFormat']['heightType'], $bang['rows'][0]['rowFormat']['allowBreakAcrossPages']]);

        $dau = $bang['rows'][0]['cells'][0]['cellFormat'];
        $this->assertSame([2, 1, 250.0, 'Center', true, 250.0], [$dau['columnSpan'], $dau['rowSpan'], $dau['preferredWidth'], $dau['verticalAlignment'], $dau['isSamePaddingAsTable'], $dau['cellWidth']]);
        $this->assertSame(['texture' => 'TextureNone', 'backgroundColor' => '#D9D9D9FF'], $dau['shading']);

        $gop = $bang['rows'][0]['cells'][1]['cellFormat'];
        $this->assertSame([2, 0.0, 5.4, false], [$gop['rowSpan'], $gop['leftMargin'], round($gop['rightMargin'], 2), $gop['isSamePaddingAsTable']]);
        $this->assertSame(['Double', 1.5, '#00FF00FF'], [$gop['borders']['bottom']['lineStyle'], $gop['borders']['bottom']['lineWidth'], $gop['borders']['bottom']['color']]);

        $this->assertCount(2, $bang['rows'][1]['cells']);
        $this->assertSame('N', $bang['rows'][1]['cells'][1]['blocks'][0]['rows'][0]['cells'][0]['blocks'][0]['inlines'][0]['text']);
    }

    public function test_table_style_header_row_shading_and_empty_grid_before_follow_the_net_output(): void
    {
        $o = fn (int $rong, string $them = ''): string => '<w:tc><w:tcPr><w:tcW w:w="'.$rong.'" w:type="dxa"/>'.$them.'</w:tcPr><w:p/></w:tc>';
        $docx = DocxTongHop::voiBody(
            '<w:tbl><w:tblPr><w:tblStyle w:val="Bang"/><w:tblLook w:val="04A0"/></w:tblPr>'
            .'<w:tblGrid><w:gridCol w:w="0"/><w:gridCol w:w="1000"/><w:gridCol w:w="2000"/></w:tblGrid>'
            .'<w:tr><w:trPr><w:gridBefore w:val="1"/><w:wBefore w:w="0" w:type="dxa"/></w:trPr>'.$o(1000).$o(2000).'</w:tr>'
            .'<w:tr>'.$o(1000, '<w:gridSpan w:val="2"/>').$o(2000).'</w:tr>'
            .'</w:tbl><w:p/>',
        )->kieu(
            '<w:style w:type="table" w:styleId="Bang"><w:name w:val="Bang"/>'
            .'<w:tblStylePr w:type="firstRow"><w:tcPr><w:shd w:val="clear" w:fill="E6F6F2"/><w:vAlign w:val="bottom"/></w:tcPr></w:tblStylePr></w:style>',
        );

        $bang = $this->khoi($this->chuyen($docx));

        $this->assertSame(['backgroundColor' => '#E6F6F2FF'], $bang['rows'][0]['cells'][0]['cellFormat']['shading']);
        $this->assertSame('Bottom', $bang['rows'][0]['cells'][1]['cellFormat']['verticalAlignment']);
        $this->assertArrayNotHasKey('shading', $bang['rows'][1]['cells'][0]['cellFormat']);
        $this->assertSame([2, 1], array_map(fn (array $o): int => $o['cellFormat']['columnSpan'], $bang['rows'][0]['cells']));
        $this->assertArrayNotHasKey('gridBefore', $bang['rows'][0]['rowFormat']);
    }

    public function test_sections_page_setup_and_headers_footers_are_converted(): void
    {
        $docx = DocxTongHop::voiBody(
            '<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdDau"/><w:footerReference w:type="first" r:id="rIdChan"/>'
            .'<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="567" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="0"/>'
            .'<w:pgNumType w:start="3"/><w:titlePg/></w:sectPr></w:pPr><w:r><w:t>Một</w:t></w:r></w:p>'
            .'<w:p><w:r><w:t>Hai</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>',
        )->dauTrang('rIdDau', '<w:p><w:r><w:t>Đầu</w:t></w:r></w:p>')
            ->chanTrang('rIdChan', '<w:p><w:r><w:t>Chân</w:t></w:r></w:p>')
            ->caiDat('<w:defaultTabStop w:val="720"/><w:evenAndOddHeaders/>');

        $sfdt = $this->chuyen($docx);

        $this->assertCount(2, $sfdt['sections']);
        $this->assertSame([
            'headerDistance' => 35.4, 'footerDistance' => 0.0, 'pageWidth' => 841.9, 'pageHeight' => 595.3, 'leftMargin' => 85.05,
            'rightMargin' => 42.5, 'topMargin' => 28.35, 'bottomMargin' => 56.7, 'differentFirstPage' => true,
            'differentOddAndEvenPages' => true, 'bidi' => false, 'restartPageNumbering' => true, 'pageStartingNumber' => 3,
        ], array_map(fn (mixed $giaTri): mixed => is_float($giaTri) ? round($giaTri, 2) : $giaTri, $sfdt['sections'][0]['sectionFormat']));
        $this->assertSame('Đầu', $sfdt['sections'][0]['headersFooters']['header']['blocks'][0]['inlines'][0]['text']);
        $this->assertSame('Chân', $sfdt['sections'][0]['headersFooters']['firstPageFooter']['blocks'][0]['inlines'][0]['text']);
        $this->assertSame([], $sfdt['sections'][1]['headersFooters']);
        $this->assertSame('Hai', $sfdt['sections'][1]['blocks'][0]['inlines'][0]['text']);
        $this->assertSame(36.0, $sfdt['defaultTabWidth']);
    }

    public function test_inline_and_floating_pictures_become_base64_image_inlines(): void
    {
        $anh = fn (string $khung): string => '<w:r><w:drawing>'.$khung.'</w:drawing></w:r>';
        $hinh = '<wp:extent cx="254000" cy="127000"/><wp:docPr id="1" name="Hinh"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            .'<pic:pic><pic:blipFill><a:blip r:embed="rIdAnh"/></pic:blipFill></pic:pic></a:graphicData></a:graphic>';
        $docx = DocxTongHop::voiBody('<w:p>'.$anh('<wp:inline>'.$hinh.'</wp:inline>').$anh('<wp:anchor relativeHeight="1">'.$hinh.'</wp:anchor>').'</w:p>')
            ->anh('rIdAnh', base64_decode(DocxTongHop::PNG));

        $inlines = $this->khoi($this->chuyen($docx))['inlines'];

        $this->assertSame([
            'imageString' => 'data:image/png;base64,'.DocxTongHop::PNG, 'length' => 1, 'width' => 20.0, 'height' => 10.0,
            'isInlineImage' => true, 'isMetaFile' => false,
        ], $inlines[0]);
        $this->assertFalse($inlines[1]['isInlineImage']);
    }

    public function test_a_file_that_is_not_a_zip_package_is_rejected_with_a_readable_message(): void
    {
        $this->expectException(LoiDocx::class);
        $this->expectExceptionMessage('File không phải DOCX (không phải gói ZIP).');

        (new DocxSangSfdt)->chuyen('Đây là văn bản thường');
    }

    public function test_a_zip_without_a_word_document_is_rejected(): void
    {
        $tep = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive;
        $zip->open($tep, ZipArchive::OVERWRITE);
        $zip->addFromString('ghi-chu.txt', 'x');
        $zip->close();
        $noiDung = (string) file_get_contents($tep);
        unlink($tep);

        $this->expectException(LoiDocx::class);
        $this->expectExceptionMessage('thiếu word/document.xml');

        (new DocxSangSfdt)->chuyen($noiDung);
    }

    public function test_a_document_with_broken_xml_is_rejected(): void
    {
        $tep = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive;
        $zip->open($tep, ZipArchive::OVERWRITE);
        $zip->addFromString('word/document.xml', '<w:document><w:body><w:p>');
        $zip->close();
        $noiDung = (string) file_get_contents($tep);
        unlink($tep);

        $this->expectException(LoiDocx::class);
        $this->expectExceptionMessage('không phải XML hợp lệ');

        (new DocxSangSfdt)->chuyen($noiDung);
    }
}
