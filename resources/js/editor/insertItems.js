import { Mark, Node } from '@tiptap/core';

/** Dấu trang: đánh dấu một đoạn bằng tên. */
export const BookmarkMark = Mark.create({
    name: 'bookmark',
    addAttributes() {
        return { name: { default: null } };
    },
    parseHTML() {
        return [{ tag: 'span[data-bookmark]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', { ...HTMLAttributes, 'data-bookmark': HTMLAttributes.name, class: 'bs-bookmark' }, 0];
    },
    addCommands() {
        return {
            setBookmark:
                (name) =>
                ({ chain }) =>
                    chain().setMark(this.name, { name }).run(),
        };
    },
});

/** Chú thích: gắn ghi chú vào một đoạn văn bản, hiện khi rê chuột. */
export const CommentMark = Mark.create({
    name: 'comment',
    addAttributes() {
        return { text: { default: '' } };
    },
    parseHTML() {
        return [{ tag: 'span[data-comment]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', { ...HTMLAttributes, 'data-comment': HTMLAttributes.text, title: HTMLAttributes.text, class: 'bs-comment' }, 0];
    },
    addCommands() {
        return {
            setComment:
                (text) =>
                ({ chain }) =>
                    chain().setMark(this.name, { text }).run(),
        };
    },
});

/** Ngôn ngữ của đoạn văn bản (dùng cho kiểm tra chính tả). */
export const LanguageMark = Mark.create({
    name: 'language',
    addAttributes() {
        return { lang: { default: 'vi-VN' } };
    },
    parseHTML() {
        return [{ tag: 'span[lang]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', HTMLAttributes, 0];
    },
    addCommands() {
        return {
            setLanguage:
                (lang) =>
                ({ chain }) =>
                    chain().setMark(this.name, { lang }).run(),
        };
    },
});

/** Ô đánh dấu (hộp kiểm) đặt trong văn bản. */
export const CheckboxNode = Node.create({
    name: 'checkbox',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes() {
        return {
            checked: {
                default: false,
                parseHTML: (element) => element.checked,
            },
        };
    },
    parseHTML() {
        return [{ tag: 'input[data-checkbox]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['input', { ...HTMLAttributes, type: 'checkbox', 'data-checkbox': 'true', checked: HTMLAttributes.checked ? 'checked' : null }];
    },
    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement('input');
            dom.type = 'checkbox';
            dom.checked = node.attrs.checked;
            dom.addEventListener('change', () => {
                const pos = getPos();
                if (typeof pos === 'number') {
                    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { checked: dom.checked }));
                }
            });
            return { dom, stopEvent: () => true, ignoreMutation: () => true };
        };
    },
    addCommands() {
        return {
            insertCheckbox:
                () =>
                ({ chain }) =>
                    chain().insertContent({ type: this.name, attrs: { checked: false } }).run(),
        };
    },
});

/** Trường nhập liệu: ô văn bản đặt trong nội dung. */
export const FormTextNode = Node.create({
    name: 'formText',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes() {
        return {
            value: { default: '', parseHTML: (element) => element.value },
            placeholder: { default: 'Nhập nội dung' },
        };
    },
    parseHTML() {
        return [{ tag: 'input[data-form-text]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['input', { type: 'text', 'data-form-text': 'true', value: HTMLAttributes.value, placeholder: HTMLAttributes.placeholder, class: 'bs-form-text' }];
    },
    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement('input');
            dom.type = 'text';
            dom.className = 'bs-form-text';
            dom.value = node.attrs.value;
            dom.placeholder = node.attrs.placeholder;
            dom.addEventListener('change', () => {
                const pos = getPos();
                if (typeof pos === 'number') {
                    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, value: dom.value }));
                }
            });
            return { dom, stopEvent: () => true, ignoreMutation: () => true };
        };
    },
    addCommands() {
        return {
            insertFormText:
                () =>
                ({ chain }) =>
                    chain().insertContent({ type: this.name, attrs: { value: '' } }).run(),
        };
    },
});

const SYMBOLS = ['Ω', '©', '®', '™', '§', '¶', '€', '£', '¥', '±', '×', '÷', '≠', '≤', '≥', '∞', '→', '←', '↑', '↓', 'α', 'β', 'π', 'Σ', '°', '…', '–', '—'];

/** Bảng ký hiệu: bấm một ký hiệu để chèn vào vị trí con trỏ. */
export const openSymbolPicker = (editor) => {
    document.querySelectorAll('.bs-symbols').forEach((element) => element.remove());
    const picker = document.createElement('div');
    picker.className = 'bs-symbols';
    picker.innerHTML = SYMBOLS.map((symbol) => `<button type="button" data-symbol="${symbol}">${symbol}</button>`).join('');
    picker.addEventListener('mousedown', (event) => event.preventDefault());
    picker.addEventListener('click', (event) => {
        const button = event.target.closest('[data-symbol]');
        if (!button) return;
        editor.chain().focus().insertContent(button.dataset.symbol).run();
        picker.remove();
    });
    document.body.appendChild(picker);
    setTimeout(() => {
        document.addEventListener('mousedown', function close(event) {
            if (!picker.contains(event.target)) {
                picker.remove();
                document.removeEventListener('mousedown', close);
            }
        });
    }, 0);
};

/** Trường trộn: chỗ giữ tên trường, được thay bằng giá trị khi trộn dữ liệu. */
export const MergeFieldNode = Node.create({
    name: 'mergeField',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes() {
        return { name: { default: '' } };
    },
    parseHTML() {
        return [{ tag: 'span[data-merge-field]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', { 'data-merge-field': HTMLAttributes.name, class: 'bs-merge' }, `«${HTMLAttributes.name}»`];
    },
    addCommands() {
        return {
            insertMergeField:
                (name) =>
                ({ chain }) =>
                    chain().insertContent({ type: this.name, attrs: { name } }).run(),
        };
    },
});

export const INSERT_EXTENSIONS = [BookmarkMark, CommentMark, LanguageMark, CheckboxNode, FormTextNode, MergeFieldNode];
