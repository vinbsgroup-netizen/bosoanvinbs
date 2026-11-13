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

const tableOf = (node) => {
    const rows = (node.content ?? []).map(
        (row) =>
            new TableRow({
                children: (row.content ?? []).map(
                    (cell) =>
                        new TableCell({
                            children: (cell.content ?? [{ type: 'paragraph', content: [] }]).map((p) => paragraphOf(p)),
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            shading: cell.type === 'tableHeader' ? { type: ShadingType.CLEAR, fill: 'F2F2F2' } : undefined,
                        }),
                ),
            }),
    );
    return new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
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

