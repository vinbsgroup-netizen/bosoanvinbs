import {
    AlignmentType,
    Document,
    Footer,
    Header,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    PageNumber,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TabStopType,
    TextRun,
    WidthType,
    BorderStyle,
    HeightRule,
    TableLayoutType,
    TextDirection,
    VerticalAlign,
} from 'docx';

const TAB_TYPE = {
    left: TabStopType.LEFT,
    center: TabStopType.CENTER,
    right: TabStopType.RIGHT,
    decimal: TabStopType.DECIMAL,
};
import { getHeaderFooter } from './headerFooter';

/* Khổ A4 và lề 25 mm, đơn vị twip (1 pt = 20 twip). */
const PAGE = { width: 11906, height: 16838, margin: 1417 };
const HEADING = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
};
const ALIGN = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
};
const HEADER_ALIGN = { trai: AlignmentType.LEFT, giua: AlignmentType.CENTER, phai: AlignmentType.RIGHT };

/* Đổi "14pt", "18px" hoặc "14" sang nửa-pt (đơn vị của docx). */
const toHalfPoints = (value) => {
    const match = String(value ?? '').match(/([\d.]+)\s*(pt|px)?/);
    if (!match) return null;
    const number = parseFloat(match[1]);
    const points = match[2] === 'px' ? number * 0.75 : number;
    return Math.round(points * 2);
};

const colorOf = (value) => (value ? String(value).replace('#', '').toUpperCase() : undefined);

/* Chuyển các mark của TipTap (đậm, nghiêng, phông...) sang tham số TextRun. */
const runOptions = (marks = []) => {
    const opts = {};
    marks.forEach((mark) => {
        const a = mark.attrs ?? {};
        switch (mark.type) {
            case 'bold':
                opts.bold = true;
                break;
            case 'italic':
                opts.italics = true;
                break;
            case 'underline':
                opts.underline = {};
                break;
            case 'strike':
                opts.strike = true;
                break;
            case 'subscript':
                opts.subScript = true;
                break;
            case 'superscript':
                opts.superScript = true;
                break;
            case 'highlight':
                opts.shading = a.color ? { type: ShadingType.CLEAR, fill: colorOf(a.color) } : undefined;
                break;
            case 'textStyle':
                if (a.color) opts.color = colorOf(a.color);
                if (a.fontFamily) opts.font = a.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
                if (a.fontSize) opts.size = toHalfPoints(a.fontSize);
                break;
            default:
                break;
        }
    });
    return opts;
};

/* Nội dung inline (chữ, xuống dòng, ảnh) của một đoạn. */
const inlineRuns = (nodes = []) =>
    nodes.flatMap((node) => {
        if (node.type === 'text') {
            return [new TextRun({ text: node.text, ...runOptions(node.marks) })];
        }
        if (node.type === 'hardBreak') {
            return [new TextRun({ break: 1 })];
        }
        if (node.type === 'image' && node.attrs?.src?.startsWith('data:')) {
            const base64 = node.attrs.src.split(',')[1];
            const width = Math.round(parseFloat(node.attrs.width) || 300);
            const height = Math.round(parseFloat(node.attrs.height) || 200);
            const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
            return [new ImageRun({ type: 'png', data: bytes, transformation: { width, height } })];
        }
        return inlineRuns(node.content);
    });

const paragraphOf = (node, extra = {}) => {
    const attrs = node.attrs ?? {};
    const alignment = ALIGN[attrs.textAlign] ?? ALIGN.left;
    return new Paragraph({
        alignment,
        heading: node.type === 'heading' ? HEADING[attrs.level] : undefined,
        children: inlineRuns(node.content),
        spacing: { after: 120 },
        tabStops: (attrs.tabs ?? []).map((tab) => ({ type: TAB_TYPE[tab.type] ?? TabStopType.LEFT, position: Math.round(tab.pos) })),
        ...extra,
    });
};

/* Bảng: độ dài trong bộ soạn tính bằng px (96 dpi), docx dùng twip (1 px = 15 twip). */
const PX_TO_TWIP = 15;
const DEFAULT_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
const BORDER_STYLE = {
    solid: BorderStyle.SINGLE,
    dashed: BorderStyle.DASHED,
    dotted: BorderStyle.DOTTED,
    double: BorderStyle.DOUBLE,
};
const CELL_VALIGN = { top: VerticalAlign.TOP, middle: VerticalAlign.CENTER, bottom: VerticalAlign.BOTTOM };
const TABLE_ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT };
const CELL_TEXT_DIRECTION = {
    tbrl: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
    btlr: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
};

/* Màu CSS (#rgb, #rrggbb, rgb(r, g, b)) sang hex 6 ký tự của docx; null nếu không đọc được. */
const hexOf = (value) => {
    const text = String(value ?? '').trim();
    const short = text.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (short) return (short[1] + short[1] + short[2] + short[2] + short[3] + short[3]).toUpperCase();
    const long = text.match(/^#([0-9a-f]{6})$/i);
    if (long) return long[1].toUpperCase();
    const rgb = text.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgb) return rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('').toUpperCase();
    return null;
};

/* Viền một cạnh của ô: { style, width (pt), color } -> viền docx (độ dày tính bằng 1/8 pt). */
const docxBorder = (border) => {
    if (!border) return undefined;
    if (border.style === 'none') return { style: BorderStyle.NONE, size: 0, color: 'auto' };
    return {
        style: BORDER_STYLE[border.style] ?? BorderStyle.SINGLE,
        size: Math.max(2, Math.round((border.width ?? 0.5) * 8)),
        color: hexOf(border.color) ?? '000000',
    };
};

const cellBordersOf = (borders) => {
    if (!borders) return undefined;
    const result = {};
    ['top', 'bottom', 'left', 'right'].forEach((side) => {
        const border = docxBorder(borders[side]);
        if (border) result[side] = border;
    });
    return Object.keys(result).length ? result : undefined;
};

/* Độ rộng từng cột (px) lấy từ hàng đầu; null nếu có cột chưa đặt độ rộng. */
const columnWidthsOf = (node) => {
    const widths = [];
    for (const cell of node.content?.[0]?.content ?? []) {
        const span = cell.attrs?.colspan ?? 1;
        for (let index = 0; index < span; index += 1) {
            const width = cell.attrs?.colwidth?.[index];
            if (!width) return null;
            widths.push(width);
        }
    }
    return widths.length ? widths : null;
};

const tableCellOf = (cell) => {
    const attrs = cell.attrs ?? {};
    const colwidth = attrs.colwidth?.filter(Boolean) ?? [];
    const background = hexOf(attrs.background);
    let shading;
    if (background) {
        shading = { type: ShadingType.CLEAR, fill: background, color: 'auto' };
    } else if (cell.type === 'tableHeader') {
        shading = { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' };
    }
    return new TableCell({
        children: (cell.content?.length ? cell.content : [{ type: 'paragraph', content: [] }]).flatMap((child) => blocksOf([child])),
        columnSpan: attrs.colspan > 1 ? attrs.colspan : undefined,
        rowSpan: attrs.rowspan > 1 ? attrs.rowspan : undefined,
        width: colwidth.length ? { size: colwidth.reduce((sum, px) => sum + px, 0) * PX_TO_TWIP, type: WidthType.DXA } : undefined,
        verticalAlign: CELL_VALIGN[attrs.verticalAlign],
        textDirection: CELL_TEXT_DIRECTION[attrs.textDirection],
        borders: cellBordersOf(attrs.borders),
        shading,
    });
};

const tableRowOf = (row) => {
    const attrs = row.attrs ?? {};
    return new TableRow({
        children: (row.content ?? []).map(tableCellOf),
        height: attrs.height
            ? { value: Math.round(attrs.height * PX_TO_TWIP), rule: attrs.heightRule === 'exact' ? HeightRule.EXACT : HeightRule.ATLEAST }
            : undefined,
        cantSplit: attrs.allowBreak === false ? true : undefined,
        tableHeader: attrs.repeatHeader ? true : undefined,
    });
};

const tableOf = (node) => {
    const attrs = node.attrs ?? {};
    const columnWidths = columnWidthsOf(node);
    let width = { size: 100, type: WidthType.PERCENTAGE };
    if (attrs.width) {
        width = { size: Math.round(attrs.width * PX_TO_TWIP), type: WidthType.DXA };
    } else if (columnWidths) {
        width = { size: columnWidths.reduce((sum, px) => sum + px, 0) * PX_TO_TWIP, type: WidthType.DXA };
    } else if (attrs.fit === 'contents') {
        width = { size: 0, type: WidthType.AUTO };
    }
    const padding = attrs.cellPadding;
    return new Table({
        rows: (node.content ?? []).map(tableRowOf),
        width,
        columnWidths: columnWidths ? columnWidths.map((px) => px * PX_TO_TWIP) : undefined,
        layout: columnWidths ? TableLayoutType.FIXED : TableLayoutType.AUTOFIT,
        alignment: TABLE_ALIGN[attrs.align],
        indent: attrs.indent ? { size: Math.round(attrs.indent * PX_TO_TWIP), type: WidthType.DXA } : undefined,
        margins: padding
            ? {
                top: Math.round(padding.vertical * PX_TO_TWIP),
                bottom: Math.round(padding.vertical * PX_TO_TWIP),
                left: Math.round(padding.horizontal * PX_TO_TWIP),
                right: Math.round(padding.horizontal * PX_TO_TWIP),
            }
            : undefined,
        borders: {
            top: DEFAULT_BORDER,
            bottom: DEFAULT_BORDER,
            left: DEFAULT_BORDER,
            right: DEFAULT_BORDER,
            insideHorizontal: DEFAULT_BORDER,
            insideVertical: DEFAULT_BORDER,
        },
    });
};

/* Danh sách: docx cần một numbering reference cho mỗi kiểu, nên dùng hai kiểu cố định. */
const listParagraphs = (node, reference) =>
    (node.content ?? []).flatMap((item) =>
        (item.content ?? []).map(
            (child) =>
                new Paragraph({
                    numbering: { reference, level: 0 },
                    children: inlineRuns(child.content),
                    spacing: { after: 60 },
                }),
        ),
    );

/* Chuyển toàn bộ cây TipTap thành danh sách block của docx. */
const blocksOf = (nodes = []) =>
    nodes.flatMap((node) => {
        switch (node.type) {
            case 'paragraph':
            case 'heading':
                return [paragraphOf(node)];
            case 'bulletList':
                return listParagraphs(node, 'bullets');
            case 'orderedList':
                return listParagraphs(node, 'numbers');
            case 'table':
                return [tableOf(node), new Paragraph({ children: [] })];
            case 'blockquote':
            case 'listItem':
                return blocksOf(node.content);
            case 'horizontalRule':
                return [new Paragraph({ children: [] })];
            default:
                return node.content ? blocksOf(node.content) : [];
        }
    });

const headerFor = (hf) => {
    const dauCanh = HEADER_ALIGN[hf.dau?.canh] ?? AlignmentType.CENTER;
    return new Header({
        children: [new Paragraph({ alignment: dauCanh, children: [new TextRun({ text: hf.dau?.text ?? '' })] })],
    });
};

const footerFor = (hf) => {
    const children = [];
    const chanCanh = HEADER_ALIGN[hf.chan?.canh] ?? AlignmentType.CENTER;
    if (hf.chan?.text) {
        children.push(new Paragraph({ alignment: chanCanh, children: [new TextRun({ text: hf.chan.text })] }));
    }
    const viTri = hf.soTrang?.viTri ?? 'khong';
    if (viTri !== 'khong') {
        const alignment = { duoi_trai: AlignmentType.LEFT, duoi_giua: AlignmentType.CENTER, duoi_phai: AlignmentType.RIGHT }[viTri];
        const format = hf.soTrang?.dinhDang ?? '{n}';
        const parts = format.split(/(\{n\}|\{tong\})/).map((part) => {
            if (part === '{n}') return new TextRun({ children: [PageNumber.CURRENT] });
            if (part === '{tong}') return new TextRun({ children: [PageNumber.TOTAL_PAGES] });
            return new TextRun({ text: part });
        });
        children.push(new Paragraph({ alignment, children: parts }));
    }
    return new Footer({ children: children.length ? children : [new Paragraph({ children: [] })] });
};

/**
 * Xuất tài liệu đang soạn thành file .docx và tải về.
 * @param {import('@tiptap/core').Editor} editor
 * @param {string} fileName
 */
export const downloadDocx = async (editor, fileName = 'van-ban.docx') => {
    const hf = getHeaderFooter();
    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: 'bullets',
                    levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
                },
                {
                    reference: 'numbers',
                    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        size: { width: PAGE.width, height: PAGE.height },
                        margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
                    },
                },
                headers: { default: headerFor(hf) },
                footers: { default: footerFor(hf) },
                children: blocksOf(editor.getJSON().content),
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

