/**
 * Đọc file SFDT (JSON của Syncfusion Document Editor) và đổi sang cây JSON của TipTap.
 * Chỉ giữ nội dung và định dạng cơ bản: đoạn, đề mục, bảng, chữ đậm/nghiêng/gạch chân/gạch ngang,
 * cỡ chữ, phông, màu chữ, màu tô sáng, căn lề, thụt lề, khoảng cách đoạn.
 */

const ALIGN = { left: 'left', center: 'center', right: 'right', justify: 'justify' };

/* Màu SFDT có dạng #AARRGGBB; alpha 00 nghĩa là "tự động" nên bỏ qua. */
const sfdtColor = (value) => {
    if (typeof value !== 'string') return null;
    const match = value.match(/^#([0-9a-f]{2})([0-9a-f]{6})$/i);
    if (!match) return null;
    if (match[1].toLowerCase() === '00') return null;
    return `#${match[2]}`;
};

const headingLevel = (styleName) => {
    const match = /^heading\s*(\d)$/i.exec(styleName ?? '');
    return match ? Math.min(3, Math.max(1, Number(match[1]))) : null;
};

/* Các mark của TipTap cho một inline (đoạn chữ) của SFDT. */
const marksOf = (format = {}) => {
    const marks = [];
    if (format.bold) marks.push({ type: 'bold' });
    if (format.italic) marks.push({ type: 'italic' });
    if (format.underline && format.underline !== 'None') marks.push({ type: 'underline' });
    if (format.strikethrough && format.strikethrough !== 'None') marks.push({ type: 'strike' });
    if (format.baselineAlignment === 'Subscript') marks.push({ type: 'subscript' });
    if (format.baselineAlignment === 'Superscript') marks.push({ type: 'superscript' });

    const style = {};
    if (format.fontFamily) style.fontFamily = `"${format.fontFamily}"`;
    if (format.fontSize) style.fontSize = `${format.fontSize}pt`;
    const color = sfdtColor(format.fontColor);
    if (color) style.color = color;
    if (Object.keys(style).length) marks.push({ type: 'textStyle', attrs: style });

    const highlight = sfdtColor(format.highlightColor);
    if (highlight) marks.push({ type: 'highlight', attrs: { color: highlight } });
    return marks;
};

/* Chữ của một inline: vì \v là xuống dòng mềm trong Word nên đổi thành hardBreak. */
const textNodes = (text, marks) =>
    String(text)
        .split('\v')
        .flatMap((part, index) => {
            const nodes = [];
            if (index > 0) nodes.push({ type: 'hardBreak' });
            if (part !== '') nodes.push({ type: 'text', text: part, ...(marks.length ? { marks } : {}) });
            return nodes;
        });

const inlinesOf = (inlines = []) =>
    inlines.flatMap((inline) => {
        if (typeof inline.text !== 'string') return [];
        return textNodes(inline.text, marksOf(inline.characterFormat));
    });

const paragraphOf = (block) => {
    const pf = block.paragraphFormat ?? {};
    const level = headingLevel(pf.styleName);
    const attrs = {};
    if (ALIGN[String(pf.textAlignment ?? '').toLowerCase()]) {
        attrs.textAlign = ALIGN[String(pf.textAlignment).toLowerCase()];
    }
    if (pf.leftIndent) attrs.indentLeft = Math.round(pf.leftIndent * 20);
    if (pf.firstLineIndent) attrs.firstLine = Math.round(pf.firstLineIndent * 20);
    if (pf.beforeSpacing) attrs.spaceBefore = pf.beforeSpacing;
    if (pf.afterSpacing) attrs.spaceAfter = pf.afterSpacing;

    const content = inlinesOf(block.inlines);
    if (level) {
        return { type: 'heading', attrs: { level, ...(attrs.textAlign ? { textAlign: attrs.textAlign } : {}) }, content };
    }
    return { type: 'paragraph', attrs, content: content.length ? content : undefined };
};

const blocksOf = (blocks = []) =>
    blocks.flatMap((block) => {
        if (Array.isArray(block.rows)) {
            return [tableOf(block)];
        }
        if (Array.isArray(block.inlines)) {
            return [paragraphOf(block)];
        }
        return [];
    });

const tableOf = (table) => ({
    type: 'table',
    content: table.rows.map((row) => ({
        type: 'tableRow',
        content: row.cells.map((cell) => {
            const children = blocksOf(cell.blocks);
            return {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: children.length ? children : [{ type: 'paragraph' }],
            };
        }),
    })),
});

/**
 * Trả về cây doc của TipTap, hoặc null nếu dữ liệu không phải SFDT.
 * @param {object} sfdt
 */
export const isSfdt = (data) => Array.isArray(data?.sections);

export const sfdtToTiptapDoc = (sfdt) => {
    const content = sfdt.sections.flatMap((section) => blocksOf(section.blocks));
    return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
};

/*
 * Duyệt các inline của một phần đầu/chân trang. Trường trong SFDT gồm: ký hiệu bắt đầu (fieldType 0),
 * mã trường là chữ thường (ví dụ " PAGE \* MERGEFORMAT "), ký hiệu phân cách (2), kết quả (chữ),
 * ký hiệu kết thúc (1). Mã và kết quả trường không được hiển thị như chữ thường.
 */
const scanPart = (part) => {
    let text = '';
    let hasPage = false;
    let inField = false;
    let afterSeparator = false;
    (part?.blocks ?? []).forEach((block) => {
        (block.inlines ?? []).forEach((inline) => {
            if (inline.fieldType !== undefined) {
                if (inline.fieldType === 0) {
                    inField = true;
                    afterSeparator = false;
                } else if (inline.fieldType === 2) {
                    afterSeparator = true;
                } else if (inline.fieldType === 1) {
                    inField = false;
                    afterSeparator = false;
                }
                return;
            }
            const value = inline.text ?? '';
            if (inField) {
                if (!afterSeparator && /\bPAGE\b/i.test(value)) hasPage = true;
                return;
            }
            text += value;
        });
    });
    return { text: text.replace(/	/g, ' ').trim(), hasPage };
};

const plainTextOf = (part) => scanPart(part).text;

/* Có trường số trang (PAGE) trong phần chân trang không. */
const hasPageField = (part) => scanPart(part).hasPage;

const alignOf = (part) => {
    const align = String(part?.blocks?.[0]?.paragraphFormat?.textAlignment ?? '').toLowerCase();
    return { left: 'trai', center: 'giua', right: 'phai' }[align] ?? 'giua';
};

/**
 * Đổi đầu/chân trang của SFDT sang cấu hình "hf" của bộ soạn.
 * Chỉ lấy chữ và số trang; hình ảnh và trường khác không được chuyển.
 * @param {object} sfdt
 */
export const sfdtHeaderFooter = (sfdt) => {
    const section = sfdt.sections?.[0] ?? {};
    const parts = section.headersFooters ?? {};
    const primary = parts.header ?? null;
    const footer = parts.footer ?? null;
    const firstFooter = parts.firstPageFooter ?? null;
    const differentFirst = Boolean(section.sectionFormat?.differentFirstPage);

    const footerHasPage = hasPageField(footer) || hasPageField(firstFooter);
    return {
        dau: { text: plainTextOf(primary), canh: alignOf(primary) },
        chan: { text: plainTextOf(footer), canh: alignOf(footer) },
        trangDauKhac: differentFirst,
        dauTrangDau: { text: plainTextOf(parts.firstPageHeader), canh: alignOf(parts.firstPageHeader) },
        chanTrangDau: { text: plainTextOf(firstFooter), canh: alignOf(firstFooter) },
        soTrang: footerHasPage ? { viTri: 'duoi_giua', dinhDang: '{n}' } : { viTri: 'khong', dinhDang: '{n}' },
    };
};
