import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { bordersStyle } from './tableBorders';

/**
 * Bảng với thuộc tính căn lề bảng, chiều cao hàng và căn dọc trong ô, lưu cùng tài liệu.
 * Đơn vị: colwidth và height tính bằng px (96 dpi), cùng hệ với colwidth của TipTap.
 */
const TABLE_ALIGNMENTS = ['left', 'center', 'right'];
const CELL_VERTICAL_ALIGNMENTS = ['top', 'middle', 'bottom'];
export const MIN_COLUMN_PX = 20;
export const TWIPS_PER_PX = 15;

const dataAttribute = (name, allowed, fallback) => ({
    default: fallback,
    parseHTML: (element) => {
        const value = element.getAttribute(`data-${name}`);
        return allowed.includes(value) ? value : fallback;
    },
    renderHTML: (attrs) => (attrs[name] && attrs[name] !== fallback ? { [`data-${name}`]: attrs[name] } : {}),
});

export const TableWithAlign = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            align: dataAttribute('align', TABLE_ALIGNMENTS, 'left'),
            fit: dataAttribute('fit', ['window', 'contents'], 'window'),
            width: {
                default: null,
                parseHTML: (element) => {
                    const value = parseFloat(element.style.width);
                    return Number.isFinite(value) && value > 0 ? value : null;
                },
                renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}px` } : {}),
            },
            indent: {
                default: null,
                parseHTML: (element) => {
                    const value = parseFloat(element.style.marginLeft);
                    return Number.isFinite(value) && value !== 0 ? value : null;
                },
                renderHTML: (attrs) => (attrs.indent ? { style: `margin-left: ${attrs.indent}px` } : {}),
            },
        };
    },
});

/**
 * Tự động điều chỉnh bảng như Syncfusion: "contents" co theo nội dung, "window" giãn đủ chiều rộng trang.
 * Xóa độ rộng cột đã đặt để trình duyệt tự tính lại.
 */
export const applyTableAutoFit = (editor, mode) => {
    const location = locateTableSelection(editor.state);
    if (!location) return false;
    const { tr } = editor.state;
    location.table.forEach((row, rowOffset) => {
        row.forEach((cell, cellOffset) => {
            tr.setNodeMarkup(location.tablePos + 2 + rowOffset + cellOffset, undefined, { ...cell.attrs, colwidth: null });
        });
    });
    tr.setNodeMarkup(location.tablePos, undefined, { ...location.table.attrs, fit: mode });
    editor.view.dispatch(tr);
    return true;
};

/** Cố định độ rộng hiện tại của mọi cột (Syncfusion: "Fixed Column Width"). */
/** Đặt chiều cao (px) cho hàng nằm tại vị trí rowPos trong tài liệu. */
export const setTableRowHeightAt = (editor, rowPos, heightPx) => {
    const row = editor.state.doc.nodeAt(rowPos);
    if (!row || row.type.name !== 'tableRow') return false;
    const tr = editor.state.tr.setNodeMarkup(rowPos, undefined, { ...row.attrs, height: heightPx });
    editor.view.dispatch(tr);
    return true;
};

export const fixTableColumnWidths = (editor) => {
    const widths = measureColumnWidths(editor);
    widths.forEach((width, index) => setTableColumnWidth(editor, index, width));
    return widths.length > 0;
};

export const TableRowWithHeight = TableRow.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            height: {
                default: null,
                parseHTML: (element) => {
                    const value = parseFloat(element.style.height);
                    return Number.isFinite(value) && value > 0 ? value : null;
                },
                renderHTML: (attrs) => (attrs.height ? { style: `height: ${attrs.height}px` } : {}),
            },
            heightRule: {
                default: 'atLeast',
                parseHTML: (element) => (element.classList.contains('bs-row-exact') ? 'exact' : 'atLeast'),
                renderHTML: (attrs) => (attrs.heightRule === 'exact' ? { class: 'bs-row-exact' } : {}),
            },
            allowBreak: {
                default: true,
                parseHTML: (element) => !element.classList.contains('bs-row-nobreak'),
                renderHTML: (attrs) => (attrs.allowBreak === false ? { class: 'bs-row-nobreak' } : {}),
            },
        };
    },
});

const withVerticalAlign = (CellExtension) => CellExtension.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            verticalAlign: dataAttribute('valign', CELL_VERTICAL_ALIGNMENTS, 'top'),
            borders: {
                default: null,
                parseHTML: (element) => {
                    try {
                        return JSON.parse(element.getAttribute('data-borders') || 'null');
                    } catch {
                        return null;
                    }
                },
                renderHTML: (attrs) => (attrs.borders
                    ? { 'data-borders': JSON.stringify(attrs.borders), style: bordersStyle(attrs.borders) }
                    : {}),
            },
            background: {
                default: null,
                parseHTML: (element) => element.style.backgroundColor || null,
                renderHTML: (attrs) => (attrs.background ? { style: `background-color: ${attrs.background}` } : {}),
            },
        };
    },
});

export const TableCellWithAlign = withVerticalAlign(TableCell);
export const TableHeaderWithAlign = withVerticalAlign(TableHeader);

/**
 * Vị trí con trỏ trong bảng: bảng, hàng, ô và chỉ số cột (tính theo colspan).
 * Trả null nếu con trỏ không nằm trong bảng.
 */
export const locateTableSelection = (state) => {
    const { $from } = state.selection;
    let tableDepth = -1;
    for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'table') {
            tableDepth = depth;
            break;
        }
    }
    if (tableDepth < 0) return null;

    const table = $from.node(tableDepth);
    const rowIndex = $from.index(tableDepth);
    const cellIndex = $from.index(tableDepth + 1);
    const row = table.child(rowIndex);
    let columnIndex = 0;
    for (let index = 0; index < cellIndex; index += 1) {
        columnIndex += row.child(index).attrs.colspan ?? 1;
    }
    return { table, tablePos: $from.before(tableDepth), rowIndex, row, cellIndex, columnIndex };
};

/** Độ rộng (px) của từng cột, đo từ hàng đầu tiên; ô chưa có colwidth thì lấy kích thước đang hiển thị. */
export const measureColumnWidths = (editor) => {
    const location = locateTableSelection(editor.state);
    if (!location) return [];
    const widths = [];
    let column = 0;
    location.table.child(0).forEach((cell, offset) => {
        const span = cell.attrs.colspan ?? 1;
        const cellPos = location.tablePos + 2 + offset;
        const domWidth = editor.view.nodeDOM(cellPos)?.offsetWidth || 100;
        for (let index = 0; index < span; index += 1) {
            const stored = cell.attrs.colwidth?.[index];
            widths[column + index] = stored ?? Math.round(domWidth / span);
        }
        column += span;
    });
    return widths;
};

/** Đặt độ rộng cho một cột: áp dụng cho mọi ô nằm trong cột đó ở mọi hàng. */
export const setTableColumnWidth = (editor, columnIndex, widthPx) => {
    const location = locateTableSelection(editor.state);
    if (!location) return false;
    const width = Math.max(MIN_COLUMN_PX, Math.round(widthPx));
    const { tr } = editor.state;
    location.table.forEach((row, rowOffset) => {
        let column = 0;
        row.forEach((cell, cellOffset) => {
            const span = cell.attrs.colspan ?? 1;
            if (columnIndex >= column && columnIndex < column + span) {
                const colwidth = Array.from({ length: span }, (_, index) => cell.attrs.colwidth?.[index] ?? width);
                colwidth[columnIndex - column] = width;
                tr.setNodeMarkup(location.tablePos + 2 + rowOffset + cellOffset, undefined, { ...cell.attrs, colwidth });
            }
            column += span;
        });
    });
    editor.view.dispatch(tr);
    return true;
};
