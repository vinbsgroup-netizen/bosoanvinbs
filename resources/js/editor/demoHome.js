import { buildWordKitRibbonHtml } from './demoRibbon';

/*
 * Tab "Trang đầu" lấy markup từ demo1 (buildWordKitRibbonHtml), rồi nối vào các action và control
 * của bộ soạn. Lệnh nào bộ soạn chưa có chức năng sẽ bị vô hiệu hóa, nhãn "Chưa hỗ trợ".
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
};

const STYLE_TO_DATA = {
    'style-normal': 'p',
    'style-heading1': 'h1',
    'style-heading2': 'h2',
    'style-title': 'h3',
};

const COLOR_FONT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu phông chữ"><span class="wk-glyph" style="color:#c00000;font-weight:700">A</span><input type="color" value="#000000" data-control="color" hidden></label></span>';
const COLOR_HIGHLIGHT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu tô sáng văn bản"><span class="wk-glyph" style="background:#ffff00">ab</span><input type="color" value="#ffff00" data-control="highlight" hidden></label></span>';

const FONT_FAMILY = '<select data-control="fontFamily" title="Phông chữ" class="wk-select wk-font-family"></select>';
const FONT_SIZE = '<select data-control="fontSize" title="Cỡ chữ" class="wk-select wk-font-size"></select>';

const unsupported = (el) => {
    el.setAttribute('disabled', '');
    el.setAttribute('title', 'Chưa hỗ trợ');
    el.classList.add('is-disabled');
};

const replaceWith = (el, html) => {
    const holder = el.ownerDocument.createElement('template');
    holder.innerHTML = html.trim();
    el.replaceWith(holder.content.firstElementChild);
};

export const renderDemoHome = () => {
    const doc = new DOMParser().parseFromString(`<div>${buildWordKitRibbonHtml()}</div>`, 'text/html');
    const panel = doc.querySelector('[data-office-kit-panel="home"]');
    if (!panel) return null;

    /* Font và cỡ chữ: combo của demo1 thay bằng select của bộ soạn (được điền bởi index.js). */
    panel.querySelectorAll('[data-office-kit-combo="font-family"]').forEach((el) => replaceWith(el, FONT_FAMILY));
    panel.querySelectorAll('[data-office-kit-combo="font-size"]').forEach((el) => replaceWith(el, FONT_SIZE));

    /* Màu chữ và màu tô sáng: dùng ô màu của bộ soạn. */
    panel.querySelectorAll('[data-office-kit-command="font-color-apply"], [data-wk-color-bar="font"]').forEach((el) => {
        const split = el.closest('.wk-split') ?? el;
        replaceWith(split, COLOR_FONT);
    });
    panel.querySelectorAll('[data-office-kit-command="highlight-apply"], [data-wk-color-bar="highlight"]').forEach((el) => {
        const split = el.closest('.wk-split') ?? el;
        replaceWith(split, COLOR_HIGHLIGHT);
    });

    panel.querySelectorAll('[data-office-kit-command]').forEach((el) => {
        const command = el.getAttribute('data-office-kit-command');
        if (STYLE_TO_DATA[command]) {
            el.removeAttribute('data-office-kit-command');
            el.setAttribute('data-style', STYLE_TO_DATA[command]);
            el.setAttribute('type', 'button');
            return;
        }
        if (COMMAND_TO_ACTION[command]) {
            el.removeAttribute('data-office-kit-command');
            el.setAttribute('data-action', COMMAND_TO_ACTION[command]);
            return;
        }
        unsupported(el);
    });

    panel.classList.add('bs-ribbon', 'wk-body');
    panel.removeAttribute('data-office-kit-panel');
    panel.setAttribute('data-panel', 'home');
    panel.setAttribute('role', 'toolbar');
    return panel.outerHTML;
};
