import { renderIcons } from './icons';
import { openTablePropertiesDialog } from './dialogs';
import { applyTableAutoFit, fixTableColumnWidths } from './tableExtensions';
import { BORDER_PRESETS, applyBorderPreset, applyCellShading } from './tableBorders';
import { openBordersShadingDialog } from './dialogs';

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

/*
 * Nhóm lệnh bảng khi con trỏ nằm trong bảng, theo menu chuột phải của Word:
 * Chèn, Xóa, Gộp ô, Tách ô, rồi Tự động điều chỉnh và Thuộc tính bảng. Mục có children là menu con.
 */
const TABLE_MENU = [
    {
        label: 'Chèn',
        children: [
            { label: 'Chèn hàng phía trên', key: 'rowAbove' },
            { label: 'Chèn hàng phía dưới', key: 'rowBelow' },
            { label: 'Chèn cột bên trái', key: 'colLeft' },
            { label: 'Chèn cột bên phải', key: 'colRight' },
        ],
    },
    {
        label: 'Xóa',
        children: [
            { label: 'Xóa bảng', key: 'deleteTable' },
            { label: 'Xóa hàng', key: 'deleteRow' },
            { label: 'Xóa cột', key: 'deleteCol' },
        ],
    },
    { label: 'Gộp ô', key: 'merge' },
    { label: 'Tách ô…', key: 'split' },
    {
        label: 'Tự động điều chỉnh',
        children: [
            { label: 'Tự động theo nội dung', key: 'fitContents' },
            { label: 'Tự động theo cửa sổ', key: 'fitWindow' },
            { label: 'Độ rộng cột cố định', key: 'fixedWidth' },
        ],
    },
    {
        label: 'Đường viền',
        children: [
            ...BORDER_PRESETS.map(([value, label]) => ({ label, key: `border-${value}` })),
            null,
            { label: 'Đường viền và tô bóng…', key: 'borders' },
        ],
    },
    null,
    { label: 'Thuộc tính bảng…', key: 'properties' },
];

/* Nút thả xuống trong thanh công cụ nổi (Chèn, Xóa), mỗi mục gọi một lệnh trong tableActions. */
const miniDropdown = (label, items) => `<span class="bs-mini-drop">`
    + `<button type="button" class="bs-mini-drop-toggle" data-mini-drop>${label} ▾</button>`
    + `<span class="bs-mini-list" hidden>${items.map(([key, text]) => `<button type="button" data-mini-table="${key}">${text}</button>`).join('')}</span>`
    + '</span>';

/* Nhóm nút bảng của thanh công cụ nổi, chỉ hiện khi chuột phải trong bảng (giống Word). */
const TABLE_MINI_HTML = '<span class="bs-mini-table">'
    + '<span class="bs-mini-sep"></span>'
    + '<input type="color" value="#ffff00" data-mini-highlight title="Màu tô sáng văn bản">'
    + '<input type="color" value="#d9d9d9" data-mini-shading title="Tô bóng ô">'
    + '<button type="button" data-mini-table="borders" title="Đường viền và tô bóng"><span class="bs-icon" data-icon="borders"></span></button>'
    + '<span class="bs-mini-sep"></span>'
    + miniDropdown('Chèn', [
        ['rowAbove', 'Chèn hàng phía trên'],
        ['rowBelow', 'Chèn hàng phía dưới'],
        ['colLeft', 'Chèn cột bên trái'],
        ['colRight', 'Chèn cột bên phải'],
    ])
    + miniDropdown('Xóa', [
        ['deleteRow', 'Xóa hàng'],
        ['deleteCol', 'Xóa cột'],
        ['deleteTable', 'Xóa bảng'],
    ])
    + '<button type="button" data-mini-table="properties" title="Thuộc tính bảng"><span class="bs-icon" data-icon="table"></span></button>'
    + '</span>';

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

    const tableActions = {
        properties: () => openTablePropertiesDialog(editor),
        merge: () => editor.chain().focus().mergeCells().run(),
        split: () => editor.chain().focus().splitCell().run(),
        borders: () => openBordersShadingDialog(editor),
        ...Object.fromEntries(BORDER_PRESETS.map(([value]) => [
            `border-${value}`,
            () => applyBorderPreset(editor, value, { style: 'solid', width: 0.5, color: '#000000' }),
        ])),
        fitContents: () => applyTableAutoFit(editor, 'contents'),
        fitWindow: () => applyTableAutoFit(editor, 'window'),
        fixedWidth: () => fixTableColumnWidths(editor),
        rowAbove: () => editor.chain().focus().addRowBefore().run(),
        rowBelow: () => editor.chain().focus().addRowAfter().run(),
        colLeft: () => editor.chain().focus().addColumnBefore().run(),
        colRight: () => editor.chain().focus().addColumnAfter().run(),
        deleteTable: () => editor.chain().focus().deleteTable().run(),
        deleteRow: () => editor.chain().focus().deleteRow().run(),
        deleteCol: () => editor.chain().focus().deleteColumn().run(),
    };

    const renderItem = (item) => {
        if (item === null) {
            return '<div class="bs-ctx-sep"></div>';
        }
        if (item.children) {
            return `<div class="bs-ctx-group"><button type="button" class="bs-ctx-item bs-ctx-parent">${item.label}<span class="bs-ctx-arrow">›</span></button>`
                + `<div class="bs-ctx-sub">${item.children.map(renderItem).join('')}</div></div>`;
        }
        const key = item.key ? `table:${item.key}` : (item.action ?? item.tab ?? '');
        const icon = item.icon ? `<span class="bs-icon" data-icon="${item.icon}"></span>` : '';
        return `<button type="button" class="bs-ctx-item" data-ctx="${key}"${item.disabled ? ' disabled' : ''}>${icon}${item.label}</button>`;
    };

    const renderMenu = (inTable) => {
        const items = inTable ? [...MENU.slice(0, 3), null, ...TABLE_MENU, null, ...MENU.slice(4)] : MENU;
        menu.innerHTML = items.map(renderItem).join('');
        renderIcons(menu);
    };

    menu.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ctx]');
        if (!button || button.disabled) {
            return;
        }
        hideAll();
        const key = button.dataset.ctx;
        if (key.startsWith('table:')) {
            tableActions[key.slice('table:'.length)]();
            return;
        }
        const item = MENU.find((entry) => entry && (entry.action ?? entry.tab) === key);
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
        + '<input type="color" value="#000000" data-mini-color title="Màu chữ">'
        + TABLE_MINI_HTML;
    renderIcons(mini);

    const closeMiniLists = () => mini.querySelectorAll('.bs-mini-list').forEach((list) => { list.hidden = true; });

    mini.addEventListener('mousedown', (event) => {
        if (!event.target.matches('input[type="color"]')) event.preventDefault();
    });
    mini.addEventListener('click', (event) => {
        const dropToggle = event.target.closest('[data-mini-drop]');
        if (dropToggle) {
            const list = dropToggle.nextElementSibling;
            const wasHidden = list.hidden;
            closeMiniLists();
            list.hidden = !wasHidden;
            return;
        }
        const tableButton = event.target.closest('[data-mini-table]');
        if (tableButton) {
            hideAll();
            tableActions[tableButton.dataset.miniTable]();
            return;
        }
        const button = event.target.closest('[data-mini]');
        if (button) {
            editor.chain().focus()[button.dataset.mini]().run();
        }
    });
    mini.querySelector('[data-mini-color]').addEventListener('input', (event) => {
        editor.chain().focus().setColor(event.target.value).run();
    });
    mini.querySelector('[data-mini-highlight]').addEventListener('input', (event) => {
        editor.chain().focus().setHighlight({ color: event.target.value }).run();
    });
    mini.querySelector('[data-mini-shading]').addEventListener('input', (event) => {
        applyCellShading(editor, event.target.value);
    });

    const place = (element, x, y) => {
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        element.style.left = `${Math.max(4, Math.min(x, window.innerWidth - width - 4))}px`;
        element.style.top = `${Math.max(4, Math.min(y, window.innerHeight - height - 4))}px`;
    };

    /* Chuột phải: trong bảng thì hiện thêm thanh công cụ nổi có nhóm nút bảng, nằm ngay phía trên menu như Word. */
    editor.view.dom.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const inTable = editor.isActive('table');
        renderMenu(inTable);
        closeMiniLists();
        mini.classList.toggle('is-table', inTable);
        mini.hidden = !inTable;
        menu.hidden = false;
        place(menu, event.clientX, event.clientY);
        if (inTable) {
            place(mini, event.clientX, event.clientY - mini.offsetHeight - 6);
        }
    });

    editor.on('selectionUpdate', () => {
        if (menu.hidden === false && mini.classList.contains('is-table')) {
            return;
        }
        const { from, to, empty } = editor.state.selection;
        if (empty || menu.hidden === false) {
            mini.hidden = true;
            return;
        }
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        mini.classList.remove('is-table');
        mini.hidden = false;
        place(mini, (start.left + end.right) / 2 - mini.offsetWidth / 2, start.top - mini.offsetHeight - 8);
    });

    document.addEventListener('mousedown', (event) => {
        if (menu.contains(event.target) || mini.contains(event.target)) {
            return;
        }
        menu.hidden = true;
        if (mini.classList.contains('is-table')) {
            mini.hidden = true;
            mini.classList.remove('is-table');
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideAll();
        }
    });
    window.addEventListener('scroll', hideAll, true);
};
