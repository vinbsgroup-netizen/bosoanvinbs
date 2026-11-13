import { Extension } from '@tiptap/core';

/**
 * Thuộc tính pageBreakBefore trên đoạn văn: đoạn có thuộc tính này luôn bắt đầu một trang mới.
 */
export const PageBreakAttribute = Extension.create({
    name: 'pageBreakAttribute',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    pageBreakBefore: {
                        default: false,
                        parseHTML: (element) => element.dataset.pageBreakBefore === 'true',
                        renderHTML: (attributes) =>
                            attributes.pageBreakBefore ? { 'data-page-break-before': 'true' } : {},
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            /* Ngắt trang tại con trỏ: phần sau con trỏ chuyển sang trang mới. */
            insertPageBreak:
                () =>
                ({ chain }) =>
                    chain().splitBlock().updateAttributes('paragraph', { pageBreakBefore: true }).run(),
            /* Trang trắng: thêm một trang trống ở cuối tài liệu. */
            insertBlankPage:
                () =>
                ({ editor, chain }) =>
                    chain()
                        .insertContentAt(editor.state.doc.content.size, {
                            type: 'paragraph',
                            attrs: { pageBreakBefore: true },
                        })
                        .run(),
        };
    },
});
