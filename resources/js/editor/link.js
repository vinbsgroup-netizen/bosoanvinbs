import { Mark } from '@tiptap/core';

/**
 * Siêu liên kết dạng mark. Dùng mark tự viết để không thêm gói phụ thuộc mới.
 */
export const LinkMark = Mark.create({
    name: 'link',

    addAttributes() {
        return {
            href: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'a[href]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['a', { ...HTMLAttributes, target: '_blank', rel: 'noopener noreferrer' }, 0];
    },

    addCommands() {
        return {
            setLink:
                (href) =>
                ({ chain }) =>
                    chain().setMark(this.name, { href }).run(),
            unsetLink:
                () =>
                ({ chain }) =>
                    chain().unsetMark(this.name).run(),
        };
    },
});
