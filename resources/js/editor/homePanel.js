import { wordKitIcons } from './wordKitIcons';

/* Các hàm dựng markup ribbon kiểu Word (cùng cấu trúc với bộ soạn dotary). */
const ico = (name, large) =>
    `<svg class="wk-ico${large ? ' wk-ico-lg' : ''}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${wordKitIcons[name] ?? ''}</svg>`;

const large = (action, icon, label, title) =>
    `<button type="button" class="wk-btn wk-btn-l" data-action="${action}" title="${title ?? label}">${ico(icon, true)}<span class="wk-label">${label}</span></button>`;

const small = (action, icon, label, title) =>
    `<button type="button" class="wk-btn wk-btn-s" data-action="${action}" title="${title ?? label}">${ico(icon)}<span>${label}</span></button>`;

const iconBtn = (action, content, title, extra = '') =>
    `<button type="button" class="wk-btn wk-btn-i" data-action="${action}" title="${title}"${extra}>${content}</button>`;

const iconName = (action, icon, title) => iconBtn(action, ico(icon), title);

const caretBtn = (menu, title) => `<button type="button" class="wk-btn wk-caret" data-wk-menu-toggle="${menu}" title="${title}">${ico('chevronDown')}</button>`;
const splitBtn = (action, icon, title, menu) => `<span class="wk-split">${iconBtn(action, ico(icon), title)}${caretBtn(menu, title)}</span>`;

const group = (title, body, extraClass = '') =>
    `<div class="wk-group ${extraClass}"><div class="wk-group-body">${body}</div><div class="wk-group-label">${title}</div></div>`;

const rows = (list) => `<div class="wk-rows">${list.map((row) => `<div class="wk-row">${row.join('')}</div>`).join('')}</div>`;
const stack = (buttons) => `<div class="wk-stack">${buttons.join('')}</div>`;
const sep = () => '<span class="wk-sep" aria-hidden="true"></span>';

const FONT_FAMILY = '<select data-control="fontFamily" title="Phông chữ" class="wk-select wk-font-family"></select>';
const FONT_SIZE = '<select data-control="fontSize" title="Cỡ chữ" class="wk-select wk-font-size"></select>';
const COLOR_HIGHLIGHT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu tô sáng văn bản"><span class="wk-glyph" style="background:#ffff00">ab</span><input type="color" value="#ffff00" data-control="highlight" hidden></label>' + caretBtn('highlight', 'Màu tô sáng') + '</span>';
const COLOR_FONT = '<span class="wk-split"><label class="wk-btn wk-btn-i" title="Màu phông chữ"><span class="wk-glyph" style="color:#c00000;font-weight:700">A</span><input type="color" value="#000000" data-control="color" hidden></label>' + caretBtn('font-color', 'Màu phông chữ') + '</span>';

export const renderHomePanel = () => `
<div class="bs-ribbon wk-body" role="toolbar" aria-label="Trang đầu" data-panel="home">
  ${group('Bộ nhớ tạm', `
    <div class="wk-lsplit">
      <button type="button" class="wk-btn wk-lsplit-top" data-action="paste" title="Dán (Ctrl+V)">${ico('paste', true)}</button>
      <button type="button" class="wk-btn wk-lsplit-bottom" disabled title="Tùy chọn dán"><span class="wk-label">Dán</span></button>
    </div>
    ${stack([small('cut', 'cut', 'Cắt', 'Cắt (Ctrl+X)'), small('copy', 'copy', 'Sao chép', 'Sao chép (Ctrl+C)'), small('formatPainter', 'painter', 'Sao định dạng', 'Sao định dạng: chọn chữ mẫu, bấm nút này rồi chọn chỗ cần áp dụng')])}
  `, 'wk-group-clipboard')}
  ${group('Phông chữ', rows([
    [FONT_FAMILY, FONT_SIZE, iconName('fontGrow', 'grow', 'Tăng cỡ phông'), iconName('fontShrink', 'shrink', 'Giảm cỡ phông'), sep(), splitBtn('changeCase', 'changeCase', 'Đổi chữ hoa, chữ thường', 'change-case'), iconName('clearFormat', 'clearFormat', 'Xóa mọi định dạng')],
    [iconBtn('bold', '<span class="wk-glyph" style="font-weight:700">B</span>', 'Đậm (Ctrl+B)'), iconBtn('italic', '<span class="wk-glyph wk-glyph-serif" style="font-style:italic">I</span>', 'Nghiêng (Ctrl+I)'), iconBtn('underline', '<span class="wk-glyph" style="text-decoration:underline">U</span>', 'Gạch dưới (Ctrl+U)'), iconBtn('strike', '<span class="wk-glyph wk-glyph-small" style="text-decoration:line-through">ab</span>', 'Gạch ngang chữ'), iconBtn('subscript', '<span class="wk-glyph wk-glyph-small">x<sub>2</sub></span>', 'Chỉ số dưới'), iconBtn('superscript', '<span class="wk-glyph wk-glyph-small">x<sup>2</sup></span>', 'Chỉ số trên'), sep(), COLOR_HIGHLIGHT, COLOR_FONT],
  ]) + '<button type="button" class="wk-launcher" data-dialog="font" title="Phông chữ (Ctrl+D)">' + ico('chevronDown') + '</button>', 'wk-group-font')}
  ${group('Đoạn văn', rows([
    [splitBtn('bulletList', 'bullets', 'Dấu đầu dòng', 'bullets'), splitBtn('orderedList', 'numbering', 'Đánh số', 'numbering'), sep(), iconName('outdent', 'outdent', 'Giảm thụt lề'), iconName('indent', 'indent', 'Tăng thụt lề')],
    [iconName('alignLeft', 'alignLeft', 'Căn trái (Ctrl+L)'), iconName('alignCenter', 'alignCenter', 'Căn giữa (Ctrl+E)'), iconName('alignRight', 'alignRight', 'Căn phải (Ctrl+R)'), iconName('alignJustify', 'justify', 'Căn đều hai bên (Ctrl+J)'), sep(), '<select data-control="lineHeight" title="Giãn cách dòng" class="wk-select"><option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option></select>'],
  ]) + '<button type="button" class="wk-launcher" data-dialog="paragraph" title="Cài đặt đoạn văn">' + ico('chevronDown') + '</button>', 'wk-group-paragraph')}
  ${group('Kiểu', `<div class="wk-styles">
    <button type="button" class="wk-style" data-style="p" title="Bình thường"><span style="font-size:14px">AaBbCc</span><small>Bình thường</small></button>
    <button type="button" class="wk-style" data-style="h1" title="Đề mục 1"><span style="font-size:16px;font-weight:600">AaBbC</span><small>Đề mục 1</small></button>
    <button type="button" class="wk-style" data-style="h2" title="Đề mục 2"><span style="font-size:14px;font-weight:600">AaBbCc</span><small>Đề mục 2</small></button>
    <button type="button" class="wk-style" data-style="h3" title="Tiêu đề"><span style="font-size:18px;font-weight:700">AaB</span><small>Tiêu đề</small></button>
  </div>`)}
  ${group('Chỉnh sửa', stack([small('find', 'find', 'Tìm', 'Tìm (Ctrl+F)'), small('find', 'replace', 'Thay thế', 'Thay thế (Ctrl+H)'), small('selectAll', 'select', 'Chọn tất cả', 'Chọn tất cả (Ctrl+A)')]), 'wk-group-editing')}
</div>`;
