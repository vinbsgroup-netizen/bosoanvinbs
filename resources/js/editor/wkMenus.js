/**
 * Menu thả xuống của ribbon: mở từ nút có data-wk-menu-toggle, chọn một mục để chạy lệnh.
 */
const COLORS = ['#000000', '#c00000', '#ff0000', '#ffc000', '#ffff00', '#00b050', '#0070c0', '#7030a0', '#ffffff', '#808080', '#f4b183', '#9bc2e6'];

const SPECS = {
    'font-color': {
        html: () => `<div class="wk-color-grid">${COLORS.map((c) => `<button type="button" class="wk-swatch" data-menu-run="font-color" data-value="${c}" title="${c}" style="background:${c}"></button>`).join('')}</div>`,
    },
    'highlight': {
        html: () => `<div class="wk-color-grid">${COLORS.map((c) => `<button type="button" class="wk-swatch" data-menu-run="highlight" data-value="${c}" title="${c}" style="background:${c}"></button>`).join('')}</div>`,
    },
    'bullets': {
        html: () => ['•  Dấu chấm', '○  Vòng tròn', '■  Vuông'].map((label, i) => `<button type="button" class="wk-menu-item" data-menu-run="bullets" data-value="${i}">${label}</button>`).join(''),
    },
    'numbering': {
        html: () => ['1. 2. 3.', 'a. b. c.', 'i. ii. iii.'].map((label, i) => `<button type="button" class="wk-menu-item" data-menu-run="numbering" data-value="${i}">${label}</button>`).join(''),
    },
    'line-spacing': {
        html: () => ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'].map((v) => `<button type="button" class="wk-menu-item" data-menu-run="line-spacing" data-value="${v}">Giãn dòng ${v}</button>`).join(''),
    },
    'change-case': {
        html: () => [['upper', 'VIẾT HOA TOÀN BỘ'], ['lower', 'viết thường toàn bộ'], ['title', 'Viết Hoa Chữ Đầu']].map(([v, label]) => `<button type="button" class="wk-menu-item" data-menu-run="change-case" data-value="${v}">${label}</button>`).join(''),
    },
    'table-insert': {
        html: () => ['3 × 3', '4 × 4', '5 × 5'].map((label, i) => `<button type="button" class="wk-menu-item" data-menu-run="table-insert" data-value="${i + 3}">Bảng ${label}</button>`).join(''),
    },
};

export const bindWkMenus = (root, run) => {
    const menu = document.createElement('div');
    menu.className = 'wk-menu';
    menu.hidden = true;
    document.body.appendChild(menu);
    let openName = null;

    const close = () => {
        menu.hidden = true;
        openName = null;
    };

    root.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-wk-menu-toggle]');
        if (toggle) {
            const name = toggle.dataset.wkMenuToggle;
            if (openName === name) return close();
            const spec = SPECS[name];
            if (!spec) return;
            menu.innerHTML = spec.html();
            const rect = toggle.getBoundingClientRect();
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom + 2}px`;
            menu.hidden = false;
            openName = name;
            return;
        }
    });

    menu.addEventListener('mousedown', (event) => event.preventDefault());
    menu.addEventListener('click', (event) => {
        const item = event.target.closest('[data-menu-run]');
        if (!item) return;
        run(item.dataset.menuRun, item.dataset.value);
        close();
    });
    document.addEventListener('mousedown', (event) => {
        if (!menu.hidden && !menu.contains(event.target) && !event.target.closest('[data-wk-menu-toggle]')) close();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close();
    });
};
