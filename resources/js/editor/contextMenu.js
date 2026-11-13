import { renderIcons } from './icons';

/**
 * Menu chuột phải và thanh công cụ nhỏ hiện trên vùng văn bản đã chọn, giống Word.
 * Các mục gọi lại nút đã có trên ribbon, nên không lặp lại logic.
 */
const MENU = [
    { label: 'Cắt', icon: 'cut', action: 'cut' },
    { label: 'Sao chép', icon: 'copy', action: 'copy' },
    { label: 'Dán', icon: 'paste', action: 'paste' },
    null,
    { label: 'Đổi chữ hoa, chữ thường', icon: 'changeCase', action: 'changeCase' },
    { label: 'Tìm…', icon: 'find', action: 'find' },
    null,
    { label: 'Phông…', icon: 'bold', tab: 'home' },
    { label: 'Đoạn văn…', icon: 'alignLeft', tab: 'home' },
    null,
    { label: 'Chèn liên kết…', icon: 'hyperlink', tab: 'insert' },
    { label: 'Chèn ghi chú', icon: 'track', disabled: true },
];

const createMenu = (className) => {
    const element = document.createElement('div');
    element.className = className;
    element.hidden = true;
    document.body.appendChild(element);
    return element;
};

export const bindContextMenu = (editor, root) => {
    const menu = createMenu('bs-ctx');
    const mini = createMenu('bs-mini');

    const hideAll = () => {
        menu.hidden = true;
        mini.hidden = true;
    };

    menu.innerHTML = MENU.map((item) => {
        if (item === null) {
            return '<div class="bs-ctx-sep"></div>';
        }
        return `<button type="button" class="bs-ctx-item" data-ctx="${item.action ?? item.tab ?? ''}"${item.disabled ? ' disabled' : ''}><span class="bs-icon" data-icon="${item.icon}"></span>${item.label}</button>`;
    }).join('');
    renderIcons(menu);

    menu.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ctx]');
        if (!button || button.disabled) {
            return;
        }
        const item = MENU.find((entry) => entry && (entry.action ?? entry.tab) === button.dataset.ctx);
        hideAll();
        if (item.tab) {
            root.querySelector(`[data-tab="${item.tab}"]`).click();
            return;
        }
        root.querySelector(`[data-action="${item.action}"]`).click();
    });

    mini.innerHTML = [
        ['bold', 'Đậm', 'toggleBold'],
        ['italic', 'Nghiêng', 'toggleItalic'],
        ['underline', 'Gạch chân', 'toggleUnderline'],
    ].map(([icon, title, command]) => `<button type="button" data-mini="${command}" title="${title}"><span class="bs-icon" data-icon="${icon}"></span></button>`).join('')
        + '<input type="color" value="#000000" data-mini-color title="Màu chữ">';
    renderIcons(mini);

    mini.addEventListener('mousedown', (event) => event.preventDefault());
    mini.addEventListener('click', (event) => {
        const button = event.target.closest('[data-mini]');
        if (button) {
            editor.chain().focus()[button.dataset.mini]().run();
        }
    });
    mini.querySelector('[data-mini-color]').addEventListener('input', (event) => {
        editor.chain().focus().setColor(event.target.value).run();
    });

    const place = (element, x, y) => {
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        element.style.left = `${Math.max(4, Math.min(x, window.innerWidth - width - 4))}px`;
        element.style.top = `${Math.max(4, Math.min(y, window.innerHeight - height - 4))}px`;
    };

    editor.view.dom.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        mini.hidden = true;
        menu.hidden = false;
        place(menu, event.clientX, event.clientY);
    });

    editor.on('selectionUpdate', () => {
        const { from, to, empty } = editor.state.selection;
        if (empty || menu.hidden === false) {
            mini.hidden = true;
            return;
        }
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        mini.hidden = false;
        place(mini, (start.left + end.right) / 2 - mini.offsetWidth / 2, start.top - mini.offsetHeight - 8);
    });

    document.addEventListener('mousedown', (event) => {
        if (!menu.contains(event.target)) {
            menu.hidden = true;
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideAll();
        }
    });
    window.addEventListener('scroll', hideAll, true);
};
