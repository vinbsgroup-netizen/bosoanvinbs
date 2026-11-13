import { renderWkPanels } from './wkPanels';
import { renderHomePanel } from './homePanel';
import { renderDemoRibbon } from './demoRibbonAdapter';
import { renderLayoutPanel } from './layoutPanel';
/**
 * Cấu trúc ribbon giống TX: 9 tab, mỗi tab có các nhóm nút. Nút chưa có chức năng vẫn hiển thị
 * (mờ, ghi "Chưa hỗ trợ") để giữ đúng bố cục của bản TX.
 *
 * Trang chủ nằm sẵn trong view (có các điều khiển đặc biệt như chọn phông, màu chữ).
 */
const TITLE_UNSUPPORTED = 'Chưa hỗ trợ';

const btn = (icon, label, options = {}) => ({ type: 'button', icon, label, ...options });
const off = (icon, label) => btn(icon, label, { disabled: true });

const RAW_TABS = [
    {
        id: 'insert',
        label: 'Chèn',
        groups: [
            {
                name: 'Trang',
                items: [btn('blankPage', 'Trang trống', { action: 'blankPage' }), btn('pageBreak', 'Ngắt trang', { action: 'pageBreak' })],
            },
            { name: 'Bảng', items: [btn('table', 'Bảng', { action: 'insertTable' })] },
            {
                name: 'Minh họa',
                items: [{ type: 'file', icon: 'image', label: 'Ảnh', control: 'insertImage', accept: 'image/png,image/jpeg' }],
            },
            {
                name: 'Liên kết',
                items: [
                    {
                        type: 'html',
                        html: `<div class="bs-link-box"><input type="url" data-control="linkUrl" placeholder="https://..." style="width:170px"><button type="button" data-action="hyperlink" title="Chèn siêu liên kết"><span class="bs-icon" data-icon="hyperlink"></span> Chèn liên kết</button></div>`,
                    },
                    { type: 'html', html: `<div class="bs-link-box"><input type="text" data-control="bookmarkName" placeholder="Tên dấu trang" style="width:130px"><button type="button" data-action="bookmark"><span class="bs-icon" data-icon="bookmark"></span> Dấu trang</button></div>` },
                ],
            },
            { name: 'Chú thích', items: [{ type: 'html', html: `<div class="bs-link-box"><input type="text" data-control="commentText" placeholder="Nội dung chú thích" style="width:130px"><button type="button" data-action="comment"><span class="bs-icon" data-icon="comment"></span> Chú thích</button></div>` }] },
            {
                name: 'Đầu trang & Chân trang',
                items: [btn('header', 'Đầu trang', { action: 'hfPanel' }), btn('footer', 'Chân trang', { action: 'hfPanel' }), btn('pageNumber', 'Số trang', { action: 'insertPageNumber' })],
            },
            { name: 'Văn bản', items: [btn('date', 'Ngày & giờ', { action: 'insertDate' })] },
            { name: 'Ký hiệu', items: [btn('symbol', 'Ký hiệu', { action: 'symbol' })] },
            { name: 'Biểu mẫu', items: [btn('checkbox', 'Ô đánh dấu', { action: 'checkbox' })] },
        ],
    },
    {
        id: 'layout',
        label: 'Bố cục trang',
        groups: [
            {
                name: 'Thiết lập trang',
                items: [
                    {
                        type: 'html',
                        html: `<label>Khổ giấy <select data-control="pageSize"><option value="a4">A4</option><option value="letter">Letter</option></select></label>
<label>Trên (cm) <input type="number" step="0.1" min="0" data-control="marginTop" class="bs-num"></label>
<label>Dưới (cm) <input type="number" step="0.1" min="0" data-control="marginBottom" class="bs-num"></label>
<label>Trái (cm) <input type="number" step="0.1" min="0" data-control="marginLeft" class="bs-num"></label>
<label>Phải (cm) <input type="number" step="0.1" min="0" data-control="marginRight" class="bs-num"></label>
<button type="button" data-action="applyLayout"><span class="bs-icon" data-icon="margins"></span> Áp dụng</button>`,
                    },
                    btn('orientation', 'Hướng giấy', { action: 'orientation' }),
                    btn('pageSize', 'Kích thước', { action: 'pageSizeFocus' }),
                ],
            },
            { name: 'Cột & ngắt', items: [off('columns', 'Cột'), btn('breaks', 'Ngắt', { action: 'pageBreak' })] },
            { name: 'Nền & khung', items: [{ type: 'html', html: `<label>Màu nền trang <input type="color" value="#ffffff" data-control="pageColor"></label>` }, { type: 'check', icon: 'margins', label: 'Khung trang', control: 'pageBorder' }] },
            { name: 'Đoạn văn', items: [{ type: 'html', html: `<label>Thụt trái (cm) <input type="number" step="0.1" min="0" data-control="indentCm" class="bs-num"></label><label>Dòng đầu (cm) <input type="number" step="0.1" data-control="firstCm" class="bs-num"></label><button type="button" data-action="paraIndent">Áp dụng</button>` }] },
        ],
    },
    {
        id: 'reporting',
        label: 'Báo cáo',
        groups: [
            { name: 'Nguồn dữ liệu', items: [{ type: 'html', html: `<label class="bs-button"><span class="bs-icon" data-icon="open"></span> Nguồn dữ liệu (JSON) <input type="file" accept="application/json,.json" data-control="dataSource" hidden></label>` }] },
            { name: 'Trường trộn', items: [{ type: 'html', html: `<div class="bs-link-box"><input type="text" data-control="mergeName" placeholder="Tên trường" style="width:120px"><button type="button" data-action="mergeField"><span class="bs-icon" data-icon="mergeField"></span> Chèn trường trộn</button></div>` }, off('mergeSpecial', 'Trường đặc biệt')] },
            { name: 'Khối trộn', items: [off('mergeBlock', 'Chèn khối trộn')] },
            { name: 'Xem', items: [off('fieldCodes', 'Mã trường'), off('fieldText', 'Nội dung trường')] },
            { name: 'Hoàn tất', items: [btn('preview', 'Xem trước', { action: 'mergePreview' })] },
        ],
    },
    {
        id: 'view',
        label: 'Xem',
        groups: [
            {
                name: 'Chế độ xem',
                items: [btn('draft', 'Bản nháp', { action: 'draftView' }), btn('printView', 'Bố cục in', { active: true, disabled: true })],
            },
            {
                name: 'Thu phóng',
                items: [
                    {
                        type: 'html',
                        html: `<label>Thu phóng <select data-control="zoom"><option value="0.75">75%</option><option value="1" selected>100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label>`,
                    },
                ],
            },
            {
                name: 'Thanh công cụ',
                items: [
                    { type: 'check', icon: 'ruler', label: 'Thước ngang', control: 'hRuler', checked: true },
                    { type: 'check', icon: 'ruler', label: 'Thước dọc', control: 'vRuler', checked: true },
                ],
            },
            { name: 'Hiển thị', items: [{ type: 'check', icon: 'table', label: 'Lưới bảng', control: 'gridLines' }, btn('controlChars', 'Ký tự điều khiển', { action: 'showMarks' })] },
        ],
    },
    {
        id: 'references',
        label: 'Tham chiếu',
        groups: [
            { name: 'Mục lục', items: [btn('toc', 'Chèn mục lục', { action: 'toc' }), btn('tocUpdate', 'Cập nhật', { action: 'tocUpdate' })] },
            { name: 'Cấp đoạn', items: [off('outline', 'Cấp đoạn')] },
        ],
    },
    {
        id: 'proofing',
        label: 'Soát lỗi',
        groups: [
            {
                name: 'Chính tả & ngắt chữ',
                items: [{ type: 'check', icon: 'spellcheck', label: 'Kiểm tra chính tả', control: 'spellcheck' }],
            },
            { name: 'Theo dõi thay đổi', items: [{ type: 'check', icon: 'track', label: 'Theo dõi thay đổi', control: 'trackChanges' }, btn('acceptChange', 'Chấp nhận', { action: 'acceptChanges' }), btn('rejectChange', 'Từ chối', { action: 'rejectChanges' })] },
            { name: 'Ngôn ngữ', items: [{ type: 'html', html: `<label>Ngôn ngữ <select data-control="language"><option value="vi-VN">Tiếng Việt</option><option value="en-US">English</option></select></label>` }] },
        ],
    },
    {
        id: 'permissions',
        label: 'Quyền',
        groups: [
            { name: 'Hạn chế định dạng', items: [off('restrictFormat', 'Cho phép định dạng')] },
            {
                name: 'Hạn chế chỉnh sửa',
                items: [{ type: 'check', icon: 'lock', label: 'Chỉ đọc', control: 'readOnly' }],
            },
            { name: 'Ngoại lệ', items: [off('exceptions', 'Ngoại lệ người dùng')] },
            { name: 'Khóa tài liệu', items: [btn('enforce', 'Bật bảo vệ', { action: 'enforce' })] },
        ],
    },
    {
        id: 'formfields',
        label: 'Trường nhập',
        groups: [
            { name: 'Chèn trường', items: [btn('formField', 'Trường nhập liệu', { action: 'formText' })] },
            { name: 'Chỉnh trường', items: [off('removeContent', 'Xóa nội dung')] },
            { name: 'Kiểm tra', items: [off('validate', 'Bật kiểm tra')] },
        ],
    },
];

const FILE_GROUP = {
    name: 'Tệp',
    items: [
        btn('save', 'Tải JSON', { action: 'save' }),
        { type: 'file', icon: 'open', label: 'Mở JSON', control: 'open', accept: 'application/json,.json,.sfdt,.docx,.doc,.rtf,.txt' },
        { type: 'file', icon: 'open', label: 'Mở Word / RTF', control: 'openDocument', accept: '.docx,.doc,.rtf,.txt' },
        {
            type: 'html',
            html: '<div class="bs-link-box"><button type="button" data-action="submitResult" title="Gửi kết quả về phần mềm" hidden><span class="bs-icon" data-icon="submit"></span> Gửi kết quả</button><span class="bs-status" data-status></span></div>',
        },
    ],
};

const byId = Object.fromEntries(RAW_TABS.map((tab) => [tab.id, tab]));

/* Thứ tự và tên tab theo bộ soạn V2: Tệp, Trang đầu, Chèn, Bố trí, Tham chiếu, Xem lại, Xem. */
const TABS = [
    { id: 'file', label: 'Tệp', groups: [FILE_GROUP] },
    { id: 'insert', label: 'Chèn', groups: [...byId.insert.groups, ...byId.reporting.groups, ...byId.formfields.groups] },
    { id: 'layout', label: 'Bố trí', groups: byId.layout.groups },
    { id: 'references', label: 'Tham chiếu', groups: byId.references.groups },
    { id: 'review', label: 'Xem lại', groups: [...byId.proofing.groups, ...byId.permissions.groups] },
    { id: 'view', label: 'Xem', groups: byId.view.groups },
];

const renderItem = (item) => {
    if (item.type === 'html') {
        return `<div class="bs-item">${item.html}</div>`;
    }

    if (item.type === 'check') {
        return `<label class="bs-item bs-check"><span class="bs-icon" data-icon="${item.icon}"></span><input type="checkbox" data-control="${item.control}"${item.checked ? ' checked' : ''}> ${item.label}</label>`;
    }

    if (item.type === 'file') {
        return `<label class="bs-item bs-big" title="${item.label}"><span class="bs-icon" data-icon="${item.icon}"></span><span>${item.label}</span><input type="file" accept="${item.accept}" data-control="${item.control}" hidden></label>`;
    }

    const attributes = [
        item.action ? `data-action="${item.action}"` : '',
        item.disabled ? 'disabled' : '',
        item.disabled ? `title="${TITLE_UNSUPPORTED}"` : `title="${item.label}"`,
    ].filter(Boolean).join(' ');
    const classes = ['bs-item', 'bs-big', item.active ? 'is-active' : '', item.disabled ? 'is-disabled' : '']
        .filter(Boolean)
        .join(' ');
    return `<button type="button" class="${classes}" ${attributes}><span class="bs-icon" data-icon="${item.icon}"></span><span>${item.label}</span></button>`;
};

const renderPanel = (tab) => {
    const groups = tab.groups
        .map(
            (group) => `<div class="bs-group"><div class="bs-group-items">${group.items.map(renderItem).join('')}</div><div class="bs-group-name">${group.name}</div></div>`,
        )
        .join('');
    return `<div class="bs-ribbon" role="toolbar" aria-label="${tab.label}" data-panel="${tab.id}" hidden>${groups}</div>`;
};

/**
 * Dựng toàn bộ tab và panel vào khung #bo-soan. Trang chủ đã có sẵn trong view.
 * @param {HTMLElement} root
 */
export const renderRibbon = (root) => {
    const tabStrip = root.querySelector('[data-tabs]');
    const panels = root.querySelector('[data-ribbon-panels]');

    const homeTab = { id: 'home', label: 'Trang đầu' };
    const allTabs = [TABS[0], homeTab, ...TABS.slice(1), { id: 'table', label: 'Bảng', contextual: true }];
    tabStrip.innerHTML = allTabs
        .map((tab) => {
            const active = tab.id === 'home';
            const classes = ['wk-tab', active ? 'wk-tab-active is-active' : '', tab.contextual ? 'wk-tab-context' : ''].filter(Boolean).join(' ');
            return `<button type="button" class="${classes}" role="tab" aria-selected="${active ? 'true' : 'false'}" data-tab="${tab.id}"${tab.contextual ? ' hidden' : ''}>${tab.label}</button>`;
        })
        .join('');
    const topbar = tabStrip.parentElement;
    topbar.querySelector('.wk-tabbar-right')?.remove();
    topbar.insertAdjacentHTML(
        'beforeend',
        `<div class="wk-tabbar-right">
            <button type="button" class="wk-tab-action" data-action="exportDocx" title="Tải về file Word (.docx)">Tải DOCX</button>
            <button type="button" class="wk-tab-action" data-action="print" title="In (Ctrl+P)">In</button>
            <button type="button" class="wk-tab-action wk-collapse-toggle" data-collapse-toggle title="Thu gọn ribbon" aria-expanded="true">${'&#8963;'}</button>
        </div>`,
    );
    panels.innerHTML = TABS.map(renderPanel).join('');
    const layoutPanel = panels.querySelector('[data-panel="layout"]');
    if (layoutPanel) layoutPanel.outerHTML = renderLayoutPanel();
    renderWkPanels().forEach((html) => {
        const match = html.match(/data-panel="([^"]+)"/);
        if (!match) return;
        const id = match[1];
        const current = root.querySelector(`[data-panel="${id}"]`);
        if (current) current.outerHTML = html;
        else panels.insertAdjacentHTML('beforeend', html);
    });
    const placeholder = root.querySelector('[data-home-panel]');
    if (placeholder) placeholder.remove();
    const hiddenHost = root.ownerDocument.createElement('div');
    hiddenHost.className = 'bs-legacy-controls';
    hiddenHost.hidden = true;
    root.querySelectorAll('[data-ribbon-panels], [data-panel="home"]').forEach((el) => {
        if (!el.closest('.bs-legacy-controls')) hiddenHost.append(el);
    });
    root.append(hiddenHost);
    renderDemoRibbon(root);
};
