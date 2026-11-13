import { buildWordKitRibbonHtml } from './demoRibbon';

/*
 * Ribbon lấy nguyên từ demo1 (buildWordKitRibbonHtml). File này đổi các thuộc tính của demo1
 * sang tên mà bộ soạn đang dùng (action, control, tab, panel). Lệnh chưa có chức năng bị vô hiệu hóa.
 */

const COMMAND_TO_ACTION = {
    paste: 'paste',
    cut: 'cut',
    copy: 'copy',
    'format-painter': 'formatPainter',
    'grow-font': 'fontGrow',
    'shrink-font': 'fontShrink',
    'clear-formatting': 'clearFormat',
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strike',
    subscript: 'subscript',
    superscript: 'superscript',
    bullets: 'bulletList',
    numbering: 'orderedList',
    'decrease-indent': 'outdent',
    'increase-indent': 'indent',
    'align-left': 'alignLeft',
    'align-center': 'alignCenter',
    'align-right': 'alignRight',
    justify: 'alignJustify',
    find: 'find',
    replace: 'find',
    'select-all': 'selectAll',
    print: 'print',
    'download-docx': 'exportDocx',
    'change-case': 'changeCase',
    'insert-symbol': 'symbol',
    symbol: 'symbol',
    'insert-blank-page': 'blankPage',
    'insert-page-break': 'pageBreak',
    'insert-table': 'insertTable',
    table: 'insertTable',
    'insert-bookmark': 'bookmark',
    'insert-link': 'hyperlink',
    'insert-comment': 'comment',
    'insert-checkbox': 'checkbox',
    'insert-date-time': 'insertDate',
    'insert-page-number': 'insertPageNumber',
    'insert-toc': 'toc',
    'toc-update': 'tocUpdate',
    'insert-form-field': 'formText',
    'insert-merge-field': 'mergeField',
    'merge-preview': 'mergePreview',
    'accept-all': 'acceptChanges',
    'reject-all': 'rejectChanges',
    'page-setup': 'marginsFocus',
    'apply-margins': 'applyLayout',
    'apply-paragraph-indent': 'paraIndent',
    'apply-paragraph-spacing': 'paraSpacing',
    'table-add-row-above': 'tableAddRowBefore',
    'table-row-above': 'tableAddRowBefore',
    'table-add-row-below': 'tableAddRowAfter',
    'table-row-below': 'tableAddRowAfter',
    'table-delete-row': 'tableDeleteRow',
    'table-col-left': 'tableAddColBefore',
    'table-col-right': 'tableAddColAfter',
    'table-delete-col': 'tableDeleteCol',
    'table-merge': 'tableMerge',
    'table-split': 'tableSplit',
    'table-delete': 'tableDelete',
    'table-header-row': 'tableHeader',
    'multilevel-list': 'multilevel',
    sort: 'sortParagraphs',
    'layout-web': 'draftView',
    'show-marks': 'showMarks',
    'control-chars': 'showMarks',
    'field-codes': 'fieldCodes',
    'field-text': 'fieldText',
    'hf-header': 'hfPanel',
    'hf-footer': 'hfPanel',
    'insert-image': 'insertImageTrigger',
    save: 'qatSave',
    undo: 'undo',
    redo: 'redo',
    'insert-header': 'hfPanel',
    'insert-footer': 'hfPanel',
};

const STYLE_TO_DATA = {
    'style-normal': 'p',
    'style-heading1': 'h1',
    'style-heading2': 'h2',
    'style-title': 'h3',
};

/* Thuộc tính nhập số (demo1) -> control của bộ soạn. */
const CHANGE_TO_CONTROL = {
    'layout-margin-top': 'marginTop',
    'layout-margin-bottom': 'marginBottom',
    'layout-margin-left': 'marginLeft',
    'layout-margin-right': 'marginRight',
    'layout-left-indent': 'indentCm',
    'layout-right-indent': 'indentRightCm',
    'layout-first-line-indent': 'firstCm',
    'layout-before-spacing': 'spaceBeforePt',
    'layout-after-spacing': 'spaceAfterPt',
    'layout-line-spacing': 'paraLine',
    'layout-default-tab-width': 'tabStepCm',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-color-custom': 'color',
};

const UNSUPPORTED_TITLE = 'Chưa hỗ trợ';

const disable = (el) => {
    el.setAttribute('disabled', '');
    el.setAttribute('title', UNSUPPORTED_TITLE);
    el.classList.add('is-disabled');
};

const replaceWith = (el, html) => {
    const holder = el.ownerDocument.createElement('template');
    holder.innerHTML = html.trim();
    el.replaceWith(holder.content.firstElementChild);
};

const COLOR_FONT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu phông chữ"><span class="wk-glyph" style="color:#c00000;font-weight:700">A</span><input type="color" value="#000000" data-control="color" hidden></label></span>';
const COLOR_HIGHLIGHT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu tô sáng văn bản"><span class="wk-glyph" style="background:#ffff00">ab</span><input type="color" value="#ffff00" data-control="highlight" hidden></label></span>';

const adaptCommands = (root) => {
    root.querySelectorAll('[data-office-kit-command]').forEach((el) => {
        const command = el.getAttribute('data-office-kit-command');
        el.removeAttribute('data-office-kit-command');
        if (STYLE_TO_DATA[command]) {
            el.setAttribute('data-style', STYLE_TO_DATA[command]);
            return;
        }
        if (command === 'font-color' || command === 'font-color-apply') {
            el.setAttribute('data-action', 'applyFontColor');
            if (el.hasAttribute('data-office-kit-arg')) el.setAttribute('data-value', el.getAttribute('data-office-kit-arg'));
            el.removeAttribute('data-office-kit-arg');
            return;
        }
        if (command === 'highlight' || command === 'highlight-apply') {
            el.setAttribute('data-action', 'applyHighlight');
            if (el.hasAttribute('data-office-kit-arg')) el.setAttribute('data-value', el.getAttribute('data-office-kit-arg'));
            el.removeAttribute('data-office-kit-arg');
            return;
        }
        if (command === 'import-word') {
            el.setAttribute('data-action', 'openFile');
            return;
        }
        if (command === 'toggle-ribbon') {
            el.setAttribute('data-collapse-toggle', '');
            return;
        }
        if (command === 'insert-header' || command === 'insert-footer') {
            el.setAttribute('data-action', 'hfPanel');
            el.setAttribute('data-where', command === 'insert-footer' ? 'chan' : 'dau');
            return;
        }
        if (command === 'insert-image') {
            el.setAttribute('data-action', 'insertImageTrigger');
            return;
        }
        if (COMMAND_TO_ACTION[command]) {
            el.setAttribute('data-action', COMMAND_TO_ACTION[command]);
            return;
        }
        disable(el);
    });
};

const adaptCombos = (root) => {
    root.querySelectorAll('[data-office-kit-combo]').forEach((combo) => {
        const kind = combo.getAttribute('data-office-kit-combo');
        const input = combo.querySelector('input');
        if (input) {
            input.setAttribute('data-control', kind === 'font-family' ? 'fontFamily' : 'fontSize');
            input.removeAttribute('data-office-kit-change');
        }
        combo.querySelectorAll('[data-office-kit-combo-value]').forEach((item) => {
            item.setAttribute('data-combo-value', item.getAttribute('data-office-kit-combo-value'));
            item.removeAttribute('data-office-kit-combo-value');
        });
        combo.querySelectorAll('[data-office-kit-combo-toggle]').forEach((caret) => {
            caret.setAttribute('data-combo-toggle', '');
            caret.removeAttribute('data-office-kit-combo-toggle');
        });
    });
};

const adaptColors = (root) => {
    root.querySelectorAll('[data-wk-color-bar="font"]').forEach((el) => replaceWith(el.closest('.wk-split') ?? el, COLOR_FONT));
    root.querySelectorAll('[data-wk-color-bar="highlight"]').forEach((el) => replaceWith(el.closest('.wk-split') ?? el, COLOR_HIGHLIGHT));
};

const adaptChanges = (root) => {
    root.querySelectorAll('[data-office-kit-change]').forEach((el) => {
        const name = el.getAttribute('data-office-kit-change');
        if (CHANGE_TO_CONTROL[name]) {
            el.setAttribute('data-control', CHANGE_TO_CONTROL[name]);
            el.removeAttribute('data-office-kit-change');
            return;
        }
        disable(el);
    });
};

const adaptTabsAndPanels = (root) => {
    root.querySelectorAll('[data-office-kit-tab]').forEach((el) => {
        el.setAttribute('data-tab', el.getAttribute('data-office-kit-tab'));
        el.removeAttribute('data-office-kit-tab');
        el.classList.add('wk-tab');
    });
    root.querySelectorAll('[data-office-kit-panel]').forEach((el) => {
        el.setAttribute('data-panel', el.getAttribute('data-office-kit-panel'));
        el.removeAttribute('data-office-kit-panel');
        el.classList.add('bs-ribbon', 'wk-body');
        el.hidden = !el.classList.contains('wk-panel-active');
    });
};

/**
 * Dựng ribbon demo1 vào root. Trả về phần tử gốc của ribbon, hoặc null nếu không dựng được.
 * @param {HTMLElement} root
 */
export const renderDemoRibbon = (root) => {
    const doc = new DOMParser().parseFromString(`<div>${buildWordKitRibbonHtml()}</div>`, 'text/html');
    const holder = doc.body.firstElementChild;
    adaptCommands(holder);
    adaptCombos(holder);
    adaptChanges(holder);
    adaptTabsAndPanels(holder);
    holder.querySelectorAll('[data-wk-menu-toggle]').forEach((el) => {
        el.setAttribute('data-demo-menu', el.getAttribute('data-wk-menu-toggle'));
        el.removeAttribute('data-wk-menu-toggle');
    });

    /* Đưa markup đã đổi thuộc tính vào trang, thay thanh tab cũ và khu vực panel cũ. */
    const topbar = root.querySelector('.bs-topbar');
    const ribbonRoot = doc.createElement('div');
    ribbonRoot.className = 'bs-demo-ribbon';
    ribbonRoot.innerHTML = holder.innerHTML;
    if (!topbar) return null;
    ribbonRoot.insertAdjacentHTML('beforeend', '<datalist id="bs-font-list"></datalist><datalist id="bs-size-list"></datalist>');
    /* Ô màu ẩn cho tô sáng và màu chữ: bộ soạn đọc giá trị từ đây khi áp dụng. */
    if (!ribbonRoot.querySelector('[data-control="highlight"]')) {
        ribbonRoot.querySelector('[data-action="applyHighlight"]')?.insertAdjacentHTML('beforeend', '<input type="color" value="#ffff00" data-control="highlight" hidden>');
    }
    if (!ribbonRoot.querySelector('[data-control="color"]')) {
        ribbonRoot.querySelector('[data-action="applyFontColor"]')?.insertAdjacentHTML('beforeend', '<input type="color" value="#000000" data-control="color" hidden>');
    }
    topbar.replaceWith(ribbonRoot);
    bindDemoMenus(ribbonRoot);
    return ribbonRoot;
};

/* Menu thả của demo1 (.wk-menu[data-wk-menu]) mở từ nút [data-demo-menu]; bấm ra ngoài hoặc chọn mục thì đóng. */
const bindDemoMenus = (ribbonRoot) => {
    const close = () => ribbonRoot.querySelectorAll('.wk-menu.is-open').forEach((m) => m.classList.remove('is-open'));
    const closeCombos = () => ribbonRoot.querySelectorAll('.contract-template-office-combo-menu-open').forEach((m) => m.classList.remove('contract-template-office-combo-menu-open'));
    ribbonRoot.addEventListener('click', (event) => {
        const caret = event.target.closest('[data-combo-toggle]');
        if (caret) {
            const combo = caret.closest('.contract-template-office-combo');
            const menu = combo.querySelector('.contract-template-office-combo-menu');
            const wasOpen = menu.classList.contains('contract-template-office-combo-menu-open');
            close();
            closeCombos();
            if (wasOpen) return;
            const rect = combo.getBoundingClientRect();
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom + 2}px`;
            menu.classList.add('contract-template-office-combo-menu-open');
            return;
        }
        const item = event.target.closest('[data-combo-value]');
        if (item) {
            const combo = item.closest('.contract-template-office-combo');
            const input = combo.querySelector('input');
            input.value = item.getAttribute('data-combo-value');
            input.dispatchEvent(new Event('change', { bubbles: true }));
            closeCombos();
            return;
        }
        const toggle = event.target.closest('[data-demo-menu]');
        if (!toggle) return;
        const menu = ribbonRoot.querySelector(`.wk-menu[data-wk-menu="${toggle.getAttribute('data-demo-menu')}"]`);
        if (!menu) return;
        const wasOpen = menu.classList.contains('is-open');
        close();
        if (wasOpen) return;
        const rect = toggle.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 2}px`;
        menu.classList.add('is-open');
    });
    ribbonRoot.querySelectorAll('.wk-menu').forEach((menu) => menu.addEventListener('click', close));
    document.addEventListener('mousedown', (event) => {
        if (!event.target.closest('.wk-menu') && !event.target.closest('[data-demo-menu]')) close();
        if (!event.target.closest('.contract-template-office-combo')) closeCombos();
    });
};
