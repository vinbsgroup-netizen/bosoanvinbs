import { WINDOWS_FONTS } from './fonts';
import { locateTableSelection, measureColumnWidths, setTableColumnWidth, applyTableAutoFit } from './tableExtensions';
import { BORDER_PRESETS, applyBorderPreset, applyCellShading } from './tableBorders';
/**
 * Hộp thoại Phông và Đoạn văn, mở từ mũi tên ở góc nhóm trên tab Trang đầu.
 */
const close = () => document.querySelectorAll('.wk-dialog-backdrop').forEach((el) => el.remove());

const shell = (title, body, onApply) => {
    close();
    const backdrop = document.createElement('div');
    backdrop.className = 'wk-dialog-backdrop';
    backdrop.innerHTML = `<div class="wk-dialog" role="dialog" aria-label="${title}">
        <div class="wk-dialog-title">${title}<button type="button" class="wk-dialog-x" data-dialog-close title="Đóng">✕</button></div>
        <div class="wk-dialog-body">${body}</div>
        <div class="wk-dialog-foot"><button type="button" data-dialog-close>Hủy</button><button type="button" data-dialog-ok>Áp dụng</button></div>
    </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop || event.target.closest('[data-dialog-close]')) close();
        if (event.target.closest('[data-dialog-ok]')) {
            onApply(backdrop);
            close();
        }
    });
    return backdrop;
};

const FONTS = WINDOWS_FONTS;

export const openFontDialog = (editor) => {
    const attrs = editor.getAttributes('textStyle');
    const body = `
        <label>Phông <select data-f="family">${FONTS.map((f) => `<option${attrs.fontFamily === f ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
        <label>Cỡ (pt) <input type="number" min="6" max="72" step="1" value="${parseFloat(attrs.fontSize) || 14}" data-f="size"></label>
        <label><input type="checkbox" data-f="bold"> Đậm</label>
        <label><input type="checkbox" data-f="italic"> Nghiêng</label>
        <label>Gạch chân <select data-f="underline"><option value="none">Không</option><option value="single">Một nét</option></select></label>
        <label>Màu chữ <input type="color" value="#000000" data-f="color"></label>
        <label><input type="checkbox" data-f="strike"> Gạch ngang</label>
        <label><input type="checkbox" data-f="sup"> Chỉ số trên</label>
        <label><input type="checkbox" data-f="sub"> Chỉ số dưới</label>`;
    shell('Phông', body, (root) => {
        const v = (name) => root.querySelector(`[data-f="${name}"]`);
        const chain = editor.chain().focus();
        chain.setFontFamily(v('family').value).setFontSize(`${v('size').value}pt`).setColor(v('color').value);
        if (v('bold').checked) chain.setBold(); else chain.unsetBold();
        if (v('italic').checked) chain.setItalic(); else chain.unsetItalic();
        if (v('underline').value === 'single') chain.setUnderline(); else chain.unsetUnderline();
        if (v('strike').checked) chain.setStrike(); else chain.unsetStrike();
        if (v('sup').checked) chain.setSuperscript(); else if (v('sub').checked) chain.setSubscript();
        chain.run();
    });
};

const PX_PER_CM = 96 / 2.54;

/**
 * Thuộc tính bảng với ba tab như Syncfusion: Bảng (tự động điều chỉnh, căn chỉnh), Hàng (chiều cao), Ô (độ rộng, căn dọc).
 */
export const openTablePropertiesDialog = (editor) => {
    const location = locateTableSelection(editor.state);
    if (!location) return;
    const table = location.table.attrs;
    const row = editor.getAttributes('tableRow');
    const columnPx = measureColumnWidths(editor)[location.columnIndex] ?? 100;
    const cellAttrs = editor.getAttributes('tableCell').verticalAlign !== undefined
        ? editor.getAttributes('tableCell')
        : editor.getAttributes('tableHeader');
    const valign = cellAttrs.verticalAlign ?? 'top';
    const rowPx = row.height ?? 0;
    const toCm = (px) => (px / PX_PER_CM).toFixed(2);

    const choose = (name, options, current) => options
        .map(([value, label]) => `<label class="bs-tp-radio"><input type="radio" name="${name}" value="${value}"${value === current ? ' checked' : ''}> ${label}</label>`)
        .join('');
    const panels = [
        ['table', 'Bảng', `
            <fieldset><legend>Kích thước</legend>
                <label><input type="checkbox" data-t="widthOn"${table.width ? ' checked' : ''}> Chiều rộng ưa thích</label>
                <label>Chiều rộng (cm) <input type="number" min="1" step="0.1" value="${toCm(table.width ?? 0)}" data-t="width"></label>
            </fieldset>
            <fieldset><legend>Căn chỉnh</legend>${choose('align', [['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải']], table.align ?? 'left')}</fieldset>
            <label>Thụt từ lề trái (cm) <input type="number" step="0.1" value="${toCm(table.indent ?? 0)}" data-t="indent"></label>`],
        ['row', 'Hàng', `
            <fieldset><legend>Kích thước</legend>
                <label><input type="checkbox" data-t="rowOn"${rowPx > 0 ? ' checked' : ''}> Chỉ định chiều cao</label>
                <label>Chiều cao (cm) <input type="number" min="0.1" step="0.1" value="${toCm(rowPx)}" data-t="row"></label>
                ${choose('heightRule', [['atLeast', 'Ít nhất'], ['exact', 'Chính xác']], row.heightRule ?? 'atLeast')}
            </fieldset>
            <label><input type="checkbox" data-t="allowBreak"${row.allowBreak === false ? '' : ' checked'}> Cho phép hàng ngắt qua trang</label>`],
        ['column', 'Cột', `
            <label><input type="checkbox" data-t="colOn" checked> Chiều rộng cột ${location.columnIndex + 1}</label>
            <label>Chiều rộng (cm) <input type="number" min="0.5" step="0.1" value="${toCm(columnPx)}" data-t="column"></label>`],
        ['cell', 'Ô', `
            <fieldset><legend>Căn dọc</legend>${choose('valign', [['top', 'Trên'], ['middle', 'Giữa'], ['bottom', 'Dưới']], valign)}</fieldset>`],
    ];
    const body = `<div class="bs-tp-tabs">${panels.map(([id, label], index) => `<button type="button" class="bs-tp-tab${index === 0 ? ' is-active' : ''}" data-tp-tab="${id}">${label}</button>`).join('')}</div>`
        + panels.map(([id, , html], index) => `<div class="bs-tp-panel" data-tp-panel="${id}"${index === 0 ? '' : ' hidden'}>${html}</div>`).join('');

    const backdrop = shell('Thuộc tính bảng', body, (root) => {
        const v = (name) => root.querySelector(`[data-t="${name}"]`);
        const checked = (name) => root.querySelector(`input[name="${name}"]:checked`)?.value;
        const widthCm = parseFloat(v('width').value) || 0;
        const indentCm = parseFloat(v('indent').value) || 0;
        const rowCm = parseFloat(v('row').value) || 0;
        const columnCm = parseFloat(v('column').value);

        editor.chain().focus().updateAttributes('table', {
            align: checked('align'),
            width: v('widthOn').checked && widthCm > 0 ? Math.round(widthCm * PX_PER_CM) : null,
            indent: indentCm !== 0 ? Math.round(indentCm * PX_PER_CM) : null,
        }).run();
        editor.chain().focus().updateAttributes('tableRow', {
            height: v('rowOn').checked && rowCm > 0 ? Math.round(rowCm * PX_PER_CM) : null,
            heightRule: checked('heightRule'),
            allowBreak: v('allowBreak').checked,
        }).run();
        if (v('colOn').checked && columnCm > 0) setTableColumnWidth(editor, location.columnIndex, columnCm * PX_PER_CM);
        editor.chain().focus().setCellAttribute('verticalAlign', checked('valign')).run();
    });

    backdrop.querySelector('.bs-tp-tabs').addEventListener('click', (event) => {
        const tab = event.target.closest('[data-tp-tab]');
        if (!tab) return;
        backdrop.querySelectorAll('[data-tp-panel]').forEach((panel) => { panel.hidden = panel.dataset.tpPanel !== tab.dataset.tpTab; });
        backdrop.querySelectorAll('[data-tp-tab]').forEach((button) => button.classList.toggle('is-active', button === tab));
    });
};

/**
 * Đường viền và tô bóng cho ô đang chọn: kiểu nét, độ dày, màu, phạm vi áp dụng và màu nền.
 */
export const openBordersShadingDialog = (editor) => {
    const body = `
        <label>Kiểu nét <select data-b="style">
            <option value="solid">Liền</option><option value="dashed">Nét đứt</option><option value="dotted">Chấm</option><option value="double">Đôi</option>
        </select></label>
        <label>Độ dày <select data-b="width">${[0.25, 0.5, 0.75, 1, 1.5, 2.25, 3].map((width) => `<option value="${width}"${width === 0.5 ? ' selected' : ''}>${String(width).replace('.', ',')} pt</option>`).join('')}</select></label>
        <label>Màu viền <input type="color" value="#000000" data-b="color"></label>
        <fieldset><legend>Áp dụng viền cho</legend>
            ${BORDER_PRESETS.map(([value, label], index) => `<label class="bs-tp-radio"><input type="radio" name="preset" value="${value}"${index === 0 ? ' checked' : ''}> ${label}</label>`).join('')}
        </fieldset>
        <label><input type="checkbox" data-b="shadingOn"> Tô bóng ô</label>
        <label>Màu tô <input type="color" value="#ffff00" data-b="shading"></label>`;
    shell('Đường viền và tô bóng', body, (root) => {
        const v = (name) => root.querySelector(`[data-b="${name}"]`);
        const preset = root.querySelector('input[name="preset"]:checked').value;
        applyBorderPreset(editor, preset, { style: v('style').value, width: parseFloat(v('width').value), color: v('color').value });
        if (v('shadingOn').checked) applyCellShading(editor, v('shading').value);
    });
};

export const openParagraphDialog = (editor) => {
    const a = editor.getAttributes('paragraph');
    const cm = (twip) => ((twip ?? 0) / 567).toFixed(2);
    const body = `
        <label>Căn lề <select data-p="align">
            <option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option><option value="justify">Đều hai bên</option>
        </select></label>
        <label>Thụt trái (cm) <input type="number" step="0.1" value="${cm(a.indentLeft)}" data-p="left"></label>
        <label>Dòng đầu (cm) <input type="number" step="0.1" value="${cm(a.firstLine)}" data-p="first"></label>
        <label>Khoảng trước (pt) <input type="number" min="0" step="1" value="${a.spaceBefore ?? 0}" data-p="before"></label>
        <label>Khoảng sau (pt) <input type="number" min="0" step="1" value="${a.spaceAfter ?? 0}" data-p="after"></label>
        <label>Giãn dòng <select data-p="line">
            <option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option>
        </select></label>`;
    shell('Đoạn văn', body, (root) => {
        const v = (name) => root.querySelector(`[data-p="${name}"]`);
        editor.chain().focus().setTextAlign(v('align').value).setParagraphFormat({
            indentLeft: Math.round((parseFloat(v('left').value) || 0) * 567),
            firstLine: Math.round((parseFloat(v('first').value) || 0) * 567),
            spaceBefore: parseFloat(v('before').value) || null,
            spaceAfter: parseFloat(v('after').value) || null,
            lineHeight: v('line').value,
        }).run();
    });
};
