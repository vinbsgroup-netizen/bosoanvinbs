import { WINDOWS_FONTS } from './fonts';
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
