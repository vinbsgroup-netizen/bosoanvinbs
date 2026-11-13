import { wordKitIcons } from './wordKitIcons';

/* Markup ribbon kiểu Word cho các tab Tệp, Chèn, Bố trí, Tham chiếu, Xem lại, Xem. */
const ico = (name, large) =>
    `<svg class="wk-ico${large ? ' wk-ico-lg' : ''}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${wordKitIcons[name] ?? ''}</svg>`;

const L = (action, icon, label, title, attrs = '') =>
    action
        ? `<button type="button" class="wk-btn wk-btn-l" data-action="${action}" title="${title ?? label}"${attrs}>${ico(icon, true)}<span class="wk-label">${label}</span></button>`
        : `<button type="button" class="wk-btn wk-btn-l" disabled title="Chưa hỗ trợ">${ico(icon, true)}<span class="wk-label">${label}</span></button>`;

const S = (action, icon, label, title) =>
    action
        ? `<button type="button" class="wk-btn wk-btn-s" data-action="${action}" title="${title ?? label}">${ico(icon)}<span>${label}</span></button>`
        : `<button type="button" class="wk-btn wk-btn-s" disabled title="Chưa hỗ trợ">${ico(icon)}<span>${label}</span></button>`;

const FILE_INPUT = (control, icon, label, accept) =>
    `<label class="wk-btn wk-btn-l" title="${label}">${ico(icon, true)}<span class="wk-label">${label}</span><input type="file" accept="${accept}" data-control="${control}" hidden></label>`;

const group = (title, body, extra = '') =>
    `<div class="wk-group ${extra}"><div class="wk-group-body">${body}</div><div class="wk-group-label">${title}</div></div>`;
const stack = (buttons) => `<div class="wk-stack">${buttons.join('')}</div>`;
const fields = (title, inner) => `<div class="wk-fields">${title ? `<span class="wk-fields-title">${title}</span>` : ''}${inner}</div>`;
const num = (label, control, value, step, unit, disabled = false) =>
    `<label class="wk-field">${label}<input type="number" step="${step}" min="0" value="${value}" data-control="${control}" class="wk-num"${disabled ? ' disabled title="Chưa hỗ trợ"' : ''}> <span class="wk-unit">${unit}</span></label>`;
const check = (icon, label, control, checked = false) =>
    `<label class="wk-btn wk-btn-s wk-check">${ico(icon)}<span>${label}</span><input type="checkbox" data-control="${control}"${checked ? ' checked' : ''}></label>`;
const panel = (id, groups) =>
    `<div class="bs-ribbon wk-body" role="toolbar" aria-label="${id}" data-panel="${id}" hidden>${Array.isArray(groups) ? groups.join('') : groups}</div>`;

const LINK_INPUT = '';
const BOOKMARK_BOX = '<div class="bs-link-box"><input type="text" data-control="bookmarkName" placeholder="Tên dấu trang" style="width:120px"><button type="button" class="wk-btn wk-btn-s" data-action="bookmark"><span>Dấu trang</span></button></div>';
const COMMENT_INPUT = '';
const MERGE_BOX = '<div class="bs-link-box"><input type="text" data-control="mergeName" placeholder="Tên trường" style="width:110px"><button type="button" class="wk-btn wk-btn-s" data-action="mergeField"><span>Chèn trường trộn</span></button></div>';

export const renderWkPanels = () => [
    panel('table', [
        group('Hàng', L('tableAddRowBefore', 'table', 'Chèn hàng trên') + L('tableAddRowAfter', 'table', 'Chèn hàng dưới') + L('tableDeleteRow', 'table', 'Xóa hàng')),
        group('Cột', L('tableAddColBefore', 'table', 'Chèn cột trái') + L('tableAddColAfter', 'table', 'Chèn cột phải') + L('tableDeleteCol', 'table', 'Xóa cột')),
        group('Gộp ô', L('tableMerge', 'table', 'Gộp ô') + L('tableSplit', 'table', 'Tách ô')),
        group('Tiêu đề', L('tableHeader', 'table', 'Hàng tiêu đề')),
        group('Xóa', L('tableDelete', 'table', 'Xóa bảng')),
    ].join('')),
    panel('file', [
        group('Tệp', [
            L('', 'newDoc', 'Mới', 'Tạo văn bản trống'),
            FILE_INPUT('open', 'open', 'Mở JSON', 'application/json,.json,.sfdt,.docx,.doc,.rtf,.txt'),
            FILE_INPUT('openDocument', 'open', 'Mở Word / RTF', '.docx,.doc,.rtf,.txt'),
            L('save', 'save', 'Lưu', 'Tải về JSON (Ctrl+S)'),
            L('print', 'print', 'In', 'In (Ctrl+P)'),
            L('pageSizeFocus', 'margins', 'Thiết lập trang', 'Thiết lập trang'),
        ].join(''), 'wk-group-file'),
        group('Gửi', `<div class="bs-link-box"><button type="button" class="wk-btn wk-btn-s" data-action="submitResult" hidden><span>Gửi kết quả</span></button><span class="bs-status" data-status></span></div>`),
    ].join('')),
    panel('insert', [
        group('Trang', L('blankPage', 'blankPage', 'Trang trống') + L('pageBreak', 'pageBreak', 'Ngắt trang', 'Ngắt trang (Ctrl+Enter)')),
        group('Bảng', L('insertTable', 'table', 'Bảng', 'Chèn bảng 3x3') + '<button type="button" class="wk-btn wk-caret" data-wk-menu-toggle="table-insert" title="Chọn kích thước bảng"><span class="wk-caret-ico">▾</span></button>'),
        group('Minh họa', FILE_INPUT('insertImage', 'picture', 'Ảnh', 'image/png,image/jpeg')),
        group('Liên kết', LINK_INPUT + L('hyperlink', 'link', 'Liên kết', 'Chèn siêu liên kết cho ô URL') + L('bookmark', 'bookmark', 'Dấu trang', 'Đánh dấu vị trí con trỏ')),
        group('Chú thích', COMMENT_INPUT + L('comment', 'comment', 'Chú thích', 'Thêm chú thích tại vị trí con trỏ')),
        group('Đầu trang & Chân trang', L('hfPanel', 'header', 'Đầu trang', 'Sửa đầu trang', ' data-where="dau"') + L('hfPanel', 'footer', 'Chân trang', 'Sửa chân trang', ' data-where="chan"') + L('insertPageNumber', 'pageNumber', 'Số trang')),
        group('Văn bản', L('insertDate', 'date', 'Ngày & giờ', 'Chèn ngày hôm nay')),
        group('Ký hiệu', L('symbol', 'symbol', 'Ký hiệu', 'Chèn ký hiệu')),
        group('Biểu mẫu', L('checkbox', 'checkbox', 'Ô đánh dấu', 'Chèn ô đánh dấu') + L('formText', 'formText', 'Trường nhập', 'Chèn trường nhập liệu')),
        group('Trộn thư', `${MERGE_BOX}${FILE_INPUT('dataSource', 'open', 'Nguồn dữ liệu (JSON)', 'application/json,.json')}${L('mergePreview', 'preview', 'Xem trước', 'Điền dữ liệu vào trường trộn')}${L('fieldCodes', 'fieldCodes', 'Mã trường', 'Hiện mã trường')}${L('fieldText', 'fieldText', 'Nội dung trường', 'Hiện nội dung trường')}`),
    ].join('')),
    panel('references', [
        group('Mục lục', L('toc', 'toc', 'Mục lục', 'Chèn mục lục từ tiêu đề') + '<label class="wk-field">Cấp <select data-control="tocLevels"><option value="1">1</option><option value="2">1–2</option><option value="3" selected>1–3</option></select></label>' + S('tocUpdate', 'toc', 'Cập nhật', 'Cập nhật mục lục')),
        group('Cước chú', L('', 'footnote', 'Chèn cước chú', 'Chưa hỗ trợ') + L('', 'endnote', 'Chèn chú thích cuối', 'Chưa hỗ trợ')),
        group('Dấu trang', L('bookmark', 'bookmark', 'Dấu trang', 'Đánh dấu vị trí con trỏ')),
    ].join('')),
    panel('review', [
        group('Tìm kiếm', L('find', 'find', 'Tìm', 'Tìm (Ctrl+F)') + L('find', 'replace', 'Thay thế', 'Thay thế (Ctrl+H)')),
        group('Chú thích', L('comment', 'comment', 'Chú thích mới', 'Thêm chú thích tại vị trí con trỏ') + L('', 'revisions', 'Hiện chú thích', 'Chưa hỗ trợ')),
        group('Theo dõi', check('trackChanges', 'Theo dõi thay đổi', 'trackChanges') + L('', 'revisions', 'Ngăn sửa đổi', 'Chưa hỗ trợ')),
        group('Thay đổi', L('acceptChanges', 'acceptAll', 'Chấp nhận tất cả', 'Chấp nhận mọi thay đổi') + L('rejectChanges', 'rejectAll', 'Từ chối tất cả', 'Từ chối mọi thay đổi')),
        group('Chính tả & Ngôn ngữ', check('spellcheck', 'Kiểm tra chính tả', 'spellcheck') + '<label class="wk-field">Ngôn ngữ <select data-control="language"><option value="vi-VN">Tiếng Việt</option><option value="en-US">English</option></select></label>'),
        group('Quyền', check('lock', 'Chỉ đọc', 'readOnly') + L('', 'restrict', 'Hạn chế định dạng', 'Chưa hỗ trợ')),
    ].join('')),
    panel('view', [
        group('Dạng xem', L('', 'printLayout', 'Bố cục in', 'Chưa hỗ trợ') + L('draftView', 'webLayout', 'Bố cục web', 'Bản nháp không khung tờ')),
        group('Hiển thị', L('', 'ruler', 'Thước kẻ', 'Hiện/ẩn thước') + L('', 'navPane', 'Ngăn dẫn hướng', 'Chưa hỗ trợ') + '<div class="wk-stack">' + check('ruler', 'Thước ngang', 'hRuler', true) + check('ruler', 'Thước dọc', 'vRuler', true) + check('table', 'Lưới bảng', 'gridLines') + '</div>' + L('showMarks', 'controlChars', 'Ký tự điều khiển', 'Hiện dấu đoạn ¶')),
        group('Thu phóng', '<label class="wk-field">Thu phóng <select data-control="zoom"><option value="0.75">75%</option><option value="1" selected>100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label>' + L('', 'onePage', 'Một trang', 'Chưa hỗ trợ') + L('', 'pageWidth', 'Chiều rộng trang', 'Chưa hỗ trợ')),
    ].join('')),
];
