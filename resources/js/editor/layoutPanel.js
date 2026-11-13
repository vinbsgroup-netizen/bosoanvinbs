import { wordKitIcons } from './wordKitIcons';

/* Tab "Bố trí" theo bố cục bộ soạn demo1: Thiết lập trang | Lề trang | Đoạn văn. */
const ico = (name, large) =>
    `<svg class="wk-ico${large ? ' wk-ico-lg' : ''}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${wordKitIcons[name] ?? ''}</svg>`;

const large = (action, icon, label, title) =>
    `<button type="button" class="wk-btn wk-btn-l" data-action="${action}" title="${title ?? label}">${ico(icon, true)}<span class="wk-label">${label}</span></button>`;

const group = (title, body, extraClass = '') =>
    `<div class="wk-group ${extraClass}"><div class="wk-group-body">${body}</div><div class="wk-group-label">${title}</div></div>`;

const field = (label, control, unit, step = '0.1', extra = '') =>
    `<label class="wk-field"><span>${label}</span><input type="number" step="${step}" min="0" data-control="${control}" class="wk-input" ${extra}><span class="wk-unit">${unit}</span></label>`;

const applyBtn = (action, title) => `<button type="button" class="wk-apply" data-action="${action}" title="${title}">Áp dụng</button>`;

const pageSetup = `
  ${group('Thiết lập trang', `
    <div class="wk-big-row">
      ${large('marginsFocus', 'margins', 'Lề', 'Lề trang: nhập ở ô Lề trang bên cạnh')}
      ${large('orientation', 'orientation', 'Hướng', 'Đổi hướng giấy ngang/dọc')}
      ${large('pageSizeFocus', 'pageSize', 'Kích cỡ', 'Chọn khổ giấy ở ô Khổ giấy')}
      ${large('pageBreak', 'breaks', 'Ngắt', 'Chèn ngắt trang')}
    </div>
    <label class="wk-field wk-field-wide"><span>Khổ giấy</span><select data-control="pageSize" class="wk-select"><option value="a4">A4</option><option value="letter">Letter</option></select></label>
  `, 'wk-group-page')}`;

const margins = `
  ${group('Lề trang', `
    <div class="wk-grid2">
      ${field('Trên', 'marginTop', 'cm', '0.01')}
      ${field('Trái', 'marginLeft', 'cm', '0.01')}
      ${field('Dưới', 'marginBottom', 'cm', '0.01')}
      ${field('Phải', 'marginRight', 'cm', '0.01')}
    </div>
    ${applyBtn('applyLayout', 'Áp dụng lề cho toàn trang')}
  `, 'wk-group-margins')}`;

const paragraph = `
  ${group('Đoạn văn', `
    <div class="wk-col">
      <div class="wk-sub">Thụt lề</div>
      ${field('Trái', 'indentCm', 'cm')}
      ${field('Phải', 'indentRightCm', 'cm')}
      ${field('Dòng đầu', 'firstCm', 'cm')}
      ${applyBtn('paraIndent', 'Áp dụng thụt lề cho đoạn đang chọn')}
    </div>
    <div class="wk-col">
      <div class="wk-sub">Giãn cách</div>
      ${field('Trước', 'spaceBeforePt', 'pt', '1')}
      ${field('Sau', 'spaceAfterPt', 'pt', '1')}
      <label class="wk-field"><span>Dòng</span><select data-control="paraLine" class="wk-select"><option value="1">1</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2</option></select><span class="wk-unit">lần</span></label>
      ${applyBtn('paraSpacing', 'Áp dụng giãn cách cho đoạn đang chọn')}
    </div>
    <div class="wk-col">
      <div class="wk-sub">Tab</div>
      ${field('Bước', 'tabStepCm', 'cm', '0.01', 'value="1.27"')}
    </div>
  `, 'wk-group-paragraph-layout')}`;

export const renderLayoutPanel = () => `<div class="bs-ribbon wk-body" role="toolbar" aria-label="Bố trí" data-panel="layout" hidden>${pageSetup}${margins}${paragraph}</div>`;
