import { CellSelection, TableMap } from '@tiptap/pm/tables';

/**
 * Viền và tô bóng cho ô bảng. Mỗi ô lưu viền từng cạnh trong thuộc tính `borders`
 * ({ top, right, bottom, left } = { style, width, color }) và màu nền trong `background`.
 * Đặt viền một cạnh cũng cập nhật cạnh đối diện của ô liền kề, để đường kẻ chung luôn khớp.
 */
export const BORDER_SIDES = ['top', 'right', 'bottom', 'left'];
const OPPOSITE_SIDE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export const BORDER_PRESETS = [
    ['AllBorders', 'Tất cả'],
    ['OutsideBorders', 'Ngoài'],
    ['InsideBorders', 'Trong'],
    ['NoBorder', 'Không viền'],
    ['TopBorder', 'Trên'],
    ['BottomBorder', 'Dưới'],
    ['LeftBorder', 'Trái'],
    ['RightBorder', 'Phải'],
];

/* Cạnh nào của ô sẽ được đặt viền, theo từng kiểu áp dụng. edge = cạnh nằm trên mép bảng. */
const PRESET_SIDES = {
    AllBorders: () => BORDER_SIDES,
    NoBorder: () => BORDER_SIDES,
    OutsideBorders: (edge) => BORDER_SIDES.filter((side) => edge[side]),
    InsideBorders: (edge) => BORDER_SIDES.filter((side) => !edge[side]),
    TopBorder: () => ['top'],
    BottomBorder: () => ['bottom'],
    LeftBorder: () => ['left'],
    RightBorder: () => ['right'],
};

/** Các ô đang được chọn (kéo chọn nhiều ô hoặc ô con trỏ), kèm vị trí trong bảng. Trả null nếu không ở trong bảng. */
const selectedCells = (state) => {
    const { selection, doc } = state;
    const found = [];
    if (selection instanceof CellSelection) {
        selection.forEachCell((node, pos) => found.push({ node, pos }));
    } else {
        const { $from } = selection;
        for (let depth = $from.depth; depth > 0; depth -= 1) {
            const name = $from.node(depth).type.name;
            if (name === 'tableCell' || name === 'tableHeader') {
                found.push({ node: $from.node(depth), pos: $from.before(depth) });
                break;
            }
        }
    }
    if (!found.length) return null;

    const $first = doc.resolve(found[0].pos);
    let tableDepth = $first.depth;
    while (tableDepth > 0 && $first.node(tableDepth).type.name !== 'table') tableDepth -= 1;
    if (tableDepth === 0) return null;

    const table = $first.node(tableDepth);
    const tableStart = $first.start(tableDepth);
    const map = TableMap.get(table);
    return {
        map,
        tableStart,
        cells: found.map(({ pos }) => ({ pos, rect: map.findCell(pos - tableStart) })),
    };
};

/** Vị trí và rect của ô nằm tại cột col, hàng row; null nếu ngoài bảng. */
const cellAt = (state, info, col, row) => {
    if (col < 0 || row < 0 || col >= info.map.width || row >= info.map.height) return null;
    const pos = info.tableStart + info.map.map[row * info.map.width + col];
    return { pos };
};

/** Giao dịch đặt viền cho các ô đang chọn theo một kiểu áp dụng; null nếu con trỏ không ở trong bảng. */
export const borderTransaction = (state, preset, spec) => {
    const info = selectedCells(state);
    if (!info || !PRESET_SIDES[preset]) return null;

    const updates = new Map();
    const bordersOf = (pos) => {
        if (!updates.has(pos)) {
            updates.set(pos, { ...(state.doc.nodeAt(pos).attrs.borders ?? {}) });
        }
        return updates.get(pos);
    };
    const value = preset === 'NoBorder' ? { style: 'none' } : spec;

    info.cells.forEach(({ pos, rect }) => {
        const edge = {
            top: rect.top === 0,
            bottom: rect.bottom === info.map.height,
            left: rect.left === 0,
            right: rect.right === info.map.width,
        };
        PRESET_SIDES[preset](edge).forEach((side) => {
            bordersOf(pos)[side] = value;
            const neighbor = {
                top: () => cellAt(state, info, rect.left, rect.top - 1),
                bottom: () => cellAt(state, info, rect.left, rect.bottom),
                left: () => cellAt(state, info, rect.left - 1, rect.top),
                right: () => cellAt(state, info, rect.right, rect.top),
            }[side]();
            if (neighbor) bordersOf(neighbor.pos)[OPPOSITE_SIDE[side]] = value;
        });
    });

    const tr = state.tr;
    updates.forEach((borders, pos) => {
        tr.setNodeMarkup(pos, undefined, { ...state.doc.nodeAt(pos).attrs, borders });
    });
    return tr;
};

/** Giao dịch tô màu nền cho các ô đang chọn; color = null để bỏ tô. */
export const shadingTransaction = (state, color) => {
    const info = selectedCells(state);
    if (!info) return null;
    const tr = state.tr;
    info.cells.forEach(({ pos }) => {
        tr.setNodeMarkup(pos, undefined, { ...state.doc.nodeAt(pos).attrs, background: color });
    });
    return tr;
};

export const applyBorderPreset = (editor, preset, spec) => {
    const tr = borderTransaction(editor.state, preset, spec);
    if (!tr) return false;
    editor.view.dispatch(tr);
    return true;
};

export const applyCellShading = (editor, color) => {
    const tr = shadingTransaction(editor.state, color);
    if (!tr) return false;
    editor.view.dispatch(tr);
    return true;
};

/** Chuỗi style CSS cho viền các cạnh của ô, dùng khi xuất HTML. */
export const bordersStyle = (borders) => BORDER_SIDES
    .filter((side) => borders?.[side])
    .map((side) => {
        const border = borders[side];
        const css = border.style === 'none' ? 'none' : `${border.width}pt ${border.style} ${border.color}`;
        return `border-${side}: ${css}`;
    })
    .join('; ');
