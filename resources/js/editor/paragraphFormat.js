import { Extension } from '@tiptap/core';

/**
 * Định dạng đoạn: giãn dòng, tô nền, viền. Các thuộc tính này được lưu trong JSON của đoạn.
 */
export const ParagraphFormat = Extension.create({
    name: 'paragraphFormat',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    lineHeight: {
                        default: null,
                        parseHTML: (element) => element.style.lineHeight || null,
                        renderHTML: (attributes) => (attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {}),
                    },
                    shading: {
                        default: null,
                        parseHTML: (element) => element.style.backgroundColor || null,
                        renderHTML: (attributes) => (attributes.shading ? { style: `background-color: ${attributes.shading}` } : {}),
                    },
                    indentLeft: {
                        default: null,
                        parseHTML: (element) => (element.style.marginLeft ? Math.round(parseFloat(element.style.marginLeft) * 20) : null),
                        renderHTML: (attributes) =>
                            attributes.indentLeft ? { style: `margin-left: ${attributes.indentLeft / 20}pt` } : {},
                    },
                    indentRight: {
                        default: null,
                        parseHTML: (element) => (element.style.marginRight ? Math.round(parseFloat(element.style.marginRight) * 20) : null),
                        renderHTML: (attributes) =>
                            attributes.indentRight ? { style: `margin-right: ${attributes.indentRight / 20}pt` } : {},
                    },
                    firstLine: {
                        default: null,
                        parseHTML: (element) => (element.style.textIndent ? Math.round(parseFloat(element.style.textIndent) * 20) : null),
                        renderHTML: (attributes) =>
                            attributes.firstLine ? { style: `text-indent: ${attributes.firstLine / 20}pt` } : {},
                    },
                    tocEntry: {
                        default: false,
                        parseHTML: (element) => element.dataset.toc === 'true',
                        renderHTML: (attributes) => (attributes.tocEntry ? { 'data-toc': 'true' } : {}),
                    },
                    spaceBefore: {
                        default: null,
                        parseHTML: (element) => (element.style.marginTop ? parseFloat(element.style.marginTop) : null),
                        renderHTML: (attributes) => (attributes.spaceBefore ? { style: `margin-top: ${attributes.spaceBefore}pt` } : {}),
                    },
                    spaceAfter: {
                        default: null,
                        parseHTML: (element) => (element.style.marginBottom ? parseFloat(element.style.marginBottom) : null),
                        renderHTML: (attributes) => (attributes.spaceAfter ? { style: `margin-bottom: ${attributes.spaceAfter}pt` } : {}),
                    },
                    /* Điểm dừng tab: mảng { pos (twip, tính từ lề trái), type: left|center|right|decimal } */
                    tabs: {
                        default: null,
                        parseHTML: (element) => {
                            try {
                                return element.dataset.tabs ? JSON.parse(element.dataset.tabs) : null;
                            } catch {
                                return null;
                            }
                        },
                        renderHTML: (attributes) => (attributes.tabs?.length ? { 'data-tabs': JSON.stringify(attributes.tabs) } : {}),
                    },
                    bordered: {
                        default: false,
                        parseHTML: (element) => element.dataset.bordered === 'true',
                        renderHTML: (attributes) =>
                            attributes.bordered ? { 'data-bordered': 'true', style: 'border: 1px solid #555; padding: 2px 4px' } : {},
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            /* Đặt thuộc tính cho mọi đoạn nằm trong vùng chọn. */
            setParagraphFormat:
                (attrs) =>
                ({ tr, state, dispatch }) => {
                    const { from, to } = state.selection;
                    state.doc.nodesBetween(from, to, (node, pos) => {
                        if (node.type.name === 'paragraph') {
                            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
                        }
                        return true;
                    });
                    if (dispatch) {
                        dispatch(tr);
                    }
                    return true;
                },
        };
    },
});
