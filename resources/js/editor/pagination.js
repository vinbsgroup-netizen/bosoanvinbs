import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Ngắt trang hiển thị. Vị trí ngắt là các điểm trong văn bản; tại đó chèn một khoảng trống
 * (lề dưới + lề trên) để tờ sau bắt đầu. Đoạn văn có thể bị cắt giữa hai trang theo dòng.
 * Bảng và hình ảnh không bị cắt: nếu không vừa thì chuyển nguyên khối sang trang sau.
 *
 * Toạ độ "logic" là toạ độ khi bỏ qua mọi khoảng trống đang có, nên kết quả không phụ thuộc
 * vào các khoảng trống đã chèn trước đó. Chỉ là lớp hiển thị, không đổi nội dung JSON.
 */
const pageBreakKey = new PluginKey('pageBreaks');

const TWIPS_TO_PX = 96 / 1440;

const SEPARATOR_PX = 14;

const layout = {
    contentPx: 0,
    gapPx: 0,
    topPx: 0,
    bottomPx: 0,
    paddingLeftPx: 0,
    paddingRightPx: 0,
};

/**
 * Khoảng ngắt gồm: lề dưới của tờ trước (trắng), dải ngăn xám, lề trên của tờ sau (trắng).
 */
const createGap = () => {
    const element = document.createElement('div');
    element.className = 'bs-page-break';
    element.contentEditable = 'false';
    const separatorTop = layout.bottomPx;
    const separatorBottom = layout.bottomPx + SEPARATOR_PX;
    element.style.height = `${layout.gapPx}px`;
    element.style.background = `linear-gradient(to bottom, #fff 0 ${separatorTop}px, #d6d6d6 ${separatorTop}px ${separatorBottom}px, #fff ${separatorBottom}px)`;
    element.style.marginLeft = `-${layout.paddingLeftPx}px`;
    element.style.marginRight = `-${layout.paddingRightPx}px`;
    return element;
};

const buildDecorations = (doc, positions) =>
    DecorationSet.create(
        doc,
        positions.map((pos) =>
            Decoration.widget(pos, createGap, {
                side: -1,
                key: `pb-${pos}-${layout.gapPx}`,
            }),
        ),
    );

/**
 * Tính danh sách vị trí ngắt mới từ DOM hiện tại.
 */
const computeBreaks = (view) => {
    const existing = pageBreakKey.getState(view.state)?.positions ?? [];
    const bodyTop = view.dom.getBoundingClientRect().top;
    const gapsAtOrBefore = (pos) => existing.filter((breakPos) => breakPos <= pos).length;

    const visibleY = (pos, side) => view.coordsAtPos(pos)[side] - bodyTop;
    const logicalY = (pos, side) => visibleY(pos, side) - gapsAtOrBefore(pos) * layout.gapPx;

    const breaks = [];
    let pageIndex = 0;
    const pageStart = () => pageIndex * layout.contentPx;
    const pageEnd = () => (pageIndex + 1) * layout.contentPx;

    const addBreak = (pos) => {
        breaks.push(pos);
        pageIndex += 1;
    };

    /* Tìm vị trí nhỏ nhất trong [from, to] mà dòng chứa nó kết thúc sau trang hiện tại. */
    const findLineBeyondPage = (from, to) => {
        let low = from;
        let high = to;
        if (logicalY(high, 'bottom') <= pageEnd()) {
            return null;
        }
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (logicalY(middle, 'bottom') > pageEnd()) {
                high = middle;
            } else {
                low = middle + 1;
            }
        }
        return low;
    };

    view.state.doc.forEach((node, offset) => {
        const element = view.nodeDOM(offset);
        if (!(element instanceof HTMLElement)) {
            return;
        }

        if (node.type.name === 'paragraph' && node.attrs.pageBreakBefore) {
            if (element.offsetTop - gapsAtOrBefore(offset) * layout.gapPx > pageStart() + 1) {
                addBreak(offset);
            }
        }

        if (node.isTextblock && node.content.size > 0) {
            const contentStart = offset + 1;
            const contentEnd = offset + node.nodeSize - 1;
            let cursor = contentStart;

            while (logicalY(contentEnd, 'bottom') > pageEnd()) {
                const split = findLineBeyondPage(cursor, contentEnd);
                if (split === null) {
                    break;
                }

                if (split === contentStart) {
                    if (logicalY(contentStart, 'top') > pageStart() + 1) {
                        addBreak(offset);
                    } else {
                        pageIndex += 1;
                    }
                    cursor = contentStart;
                    continue;
                }

                addBreak(split);
                cursor = split + 1;
            }
            return;
        }

        const logicalTop = element.offsetTop - gapsAtOrBefore(offset) * layout.gapPx;
        const logicalBottom = logicalTop + element.offsetHeight;
        if (logicalBottom > pageEnd() && logicalTop > pageStart() + 1) {
            addBreak(offset);
        }
    });

    return breaks;
};

const measure = (view) => {
    if (!layout.contentPx || view.isDestroyed) {
        return;
    }

    const existing = pageBreakKey.getState(view.state)?.positions ?? [];
    const positions = computeBreaks(view);
    const unchanged = positions.length === existing.length && positions.every((pos, index) => pos === existing[index]);

    /* Mỗi tờ, kể cả tờ cuối, luôn có đủ chiều cao khổ giấy. */
    const sheet = view.dom.closest('.bs-page');
    if (sheet) {
        const heightPx = (positions.length + 1) * (layout.contentPx + layout.gapPx);
        sheet.style.minHeight = `${heightPx}px`;
        view.dom.dispatchEvent(new CustomEvent('bs-sheet-height', { detail: { heightPx, pageHeightPx: layout.contentPx + layout.gapPx, pages: positions.length + 1 } }));
    }

    if (!unchanged) {
        view.dispatch(view.state.tr.setMeta(pageBreakKey, { positions }).setMeta('addToHistory', false));
    }
};

const scheduleMeasure = (view) => {
    requestAnimationFrame(() => measure(view));
};

const PageBreaks = Extension.create({
    name: 'pageBreaks',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: pageBreakKey,
                state: {
                    init: () => ({ positions: [], decorations: DecorationSet.empty }),
                    apply(tr, previous, oldState, newState) {
                        const meta = tr.getMeta(pageBreakKey);
                        if (meta && meta.positions) {
                            return {
                                positions: meta.positions,
                                decorations: buildDecorations(newState.doc, meta.positions),
                            };
                        }

                        return {
                            positions: previous.positions.map((pos) => tr.mapping.map(pos)),
                            decorations: previous.decorations.map(tr.mapping, tr.doc),
                        };
                    },
                },
                props: {
                    decorations(state) {
                        return pageBreakKey.getState(state).decorations;
                    },
                },
                view(view) {
                    scheduleMeasure(view);
                    return {
                        update(updatedView, previousState) {
                            if (updatedView.state.doc !== previousState.doc) {
                                scheduleMeasure(updatedView);
                            }
                        },
                    };
                },
            }),
        ];
    },
});

/**
 * Cập nhật khổ trang và lề (đơn vị twip, theo RTF) rồi đo lại ngắt trang.
 */
export const setPageLayout = (editor, { widthTwip, heightTwip, marginsTwip }) => {
    const pageHeightPx = heightTwip * TWIPS_TO_PX;
    const topPx = marginsTwip.top * TWIPS_TO_PX;
    const bottomPx = marginsTwip.bottom * TWIPS_TO_PX;

    layout.contentPx = pageHeightPx - topPx - bottomPx;
    layout.gapPx = topPx + bottomPx;
    layout.topPx = topPx;
    layout.bottomPx = bottomPx;
    layout.paddingLeftPx = marginsTwip.left * TWIPS_TO_PX;
    layout.paddingRightPx = marginsTwip.right * TWIPS_TO_PX;

    resetPagination(editor);
};

/**
 * Xóa mọi khoảng trống ngắt trang rồi đo lại. Gọi sau khi thay toàn bộ nội dung.
 */
export const resetPagination = (editor) => {
    editor.view.dispatch(editor.state.tr.setMeta(pageBreakKey, { positions: [] }).setMeta('addToHistory', false));
    scheduleMeasure(editor.view);
};

export { PageBreaks };
