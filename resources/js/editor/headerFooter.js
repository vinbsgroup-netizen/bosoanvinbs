/**
 * Đầu trang và chân trang cấu hình được cho từng văn bản.
 * Cấu hình được lưu cùng JSON của văn bản dưới khóa "hf".
 */
const DEFAULTS = {
    dau: { text: '', canh: 'giua' },
    chan: { text: '', canh: 'giua' },
    trangDauKhac: false,
    dauTrangDau: { text: '', canh: 'giua' },
    chanTrangDau: { text: '', canh: 'giua' },
    soTrang: { viTri: 'khong', dinhDang: '{n}' },
};

let settings = clone(DEFAULTS);
let lastLayout = null;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export const getHeaderFooter = () => clone(settings);

export const setHeaderFooter = (value) => {
    settings = { ...clone(DEFAULTS), ...(value ?? {}) };
};

/* Khi chân trang có cả chữ và số trang, chữ nằm nửa trên, số trang nằm nửa dưới để không chồng lên nhau. */
const stackOffset = (where, kind, pageIndex, bottomPx) => {
    if (where !== 'chan' || settings.soTrang.viTri === 'khong') return 0;
    const footerSource = pageIndex === 0 && settings.trangDauKhac ? settings.chanTrangDau : settings.chan;
    if (!footerSource.text || footerSource.text.trim() === '') return 0;
    return kind === 'number' ? bottomPx * 0.25 : -bottomPx * 0.25;
};

const CSS_ALIGN = { trai: 'left', giua: 'center', phai: 'right', left: 'left', center: 'center', right: 'right' };

const placeText = (text, pageIndex, pages) => {
    const number = pageIndex + 1;
    return text.replace(/\{n\}/g, String(number)).replace(/\{tong\}/g, String(pages));
};

const pageNumberText = (pageIndex, pages) => {
    const format = settings.soTrang.dinhDang;
    const number = pageIndex + 1;
    if (format === 'Trang {n}') return `Trang ${number}`;
    if (format === '{n}/{tong}') return `${number}/${pages}`;
    return String(number);
};

/**
 * Vẽ đầu trang và chân trang lên từng tờ. Lớp này nằm trên tờ, không ảnh hưởng bố cục văn bản.
 */
export const renderHeaderFooter = (sheet, layout) => {
    if (!sheet) return;
    lastLayout = layout ?? lastLayout;
    if (!lastLayout) return;
    const { pageHeightPx, pages, topPx, bottomPx, widthPx, paddingLeftPx, paddingRightPx } = lastLayout;

    sheet.querySelectorAll('.bs-hf').forEach((element) => element.remove());

    const add = (pageIndex, where, raw, align, kind) => {
        const element = document.createElement('div');
        const first = pageIndex === 0 && settings.trangDauKhac;
        const pageTop = pageIndex * pageHeightPx;
        const footerSource = first ? settings.chanTrangDau : settings.chan;
        const dual = where === 'chan' && settings.soTrang.viTri !== 'khong' && footerSource.text.trim() !== '';
        element.dataset.where = where;
        element.dataset.page = String(pageIndex);
        element.dataset.kind = kind;
        element.contentEditable = 'false';
        element.style.left = `${paddingLeftPx}px`;
        element.style.width = `${widthPx - paddingLeftPx - paddingRightPx}px`;
        element.style.textAlign = CSS_ALIGN[align] ?? align;
        if (kind === 'text') {
            const bandTop = where === 'dau' ? pageTop : pageTop + pageHeightPx - bottomPx;
            const bandHeight = where === 'dau' ? topPx : bottomPx;
            element.className = `bs-hf is-editable is-${where}`;
            element.dataset.placeholder = where === 'dau' ? 'Nhấp để nhập đầu trang' : 'Nhấp để nhập chân trang';
            element.dataset.label = where === 'dau'
                ? (first ? 'Đầu trang trang đầu' : 'Đầu trang')
                : (first ? 'Chân trang trang đầu' : 'Chân trang');
            element.style.top = `${bandTop}px`;
            element.style.height = `${bandHeight}px`;
            if (dual) element.style.justifyContent = 'flex-start';
            element.textContent = placeText(raw, pageIndex, pages);
        } else {
            const offset = dual ? bottomPx * 0.25 : 0;
            element.className = 'bs-hf';
            element.style.top = `${pageTop + pageHeightPx - bottomPx / 2 + offset}px`;
            element.textContent = raw;
        }
        sheet.appendChild(element);
    };

    for (let page = 0; page < pages; page += 1) {
        const first = page === 0 && settings.trangDauKhac;
        const headerSource = first ? settings.dauTrangDau : settings.dau;
        const footerSource = first ? settings.chanTrangDau : settings.chan;
        add(page, 'dau', headerSource.text, headerSource.canh, 'text');
        add(page, 'chan', footerSource.text, footerSource.canh, 'text');

        const position = settings.soTrang.viTri;
        if (position !== 'khong') {
            const number = pageNumberText(page, pages);
            const align = position === 'duoi_trai' ? 'left' : position === 'duoi_phai' ? 'right' : 'center';
            add(page, 'chan', number, align, 'number');
        }
    }
};

/**
 * Bấm đúp vào đầu trang hoặc chân trang trên tờ để sửa trực tiếp. Enter hoặc rời khỏi ô để lưu.
 */
export const bindHeaderFooterEditing = (root) => {
    root.addEventListener('click', (event) => {
        const element = event.target.closest('.bs-hf.is-editable');
        if (!element || element.isContentEditable) return;
        element.contentEditable = 'true';
        element.classList.add('is-editing');
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        /* Chọn toàn bộ nội dung cũ: gõ tiếp sẽ thay thế, không nối thêm vào sau. */
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        element.addEventListener('keydown', (keyEvent) => {
            if (keyEvent.key === 'Enter') {
                keyEvent.preventDefault();
                element.blur();
            }
        });
        element.addEventListener('blur', () => {
            const page = Number(element.dataset.page);
            const first = page === 0 && settings.trangDauKhac;
            const key = element.dataset.where === 'dau'
                ? (first ? 'dauTrangDau' : 'dau')
                : (first ? 'chanTrangDau' : 'chan');
            settings[key] = { ...settings[key], text: element.textContent.trim() };
            element.contentEditable = 'false';
            element.classList.remove('is-editing');
            renderHeaderFooter(element.parentElement);
        }, { once: true });
    });
};

/**
 * Cập nhật kích thước tờ (gọi mỗi khi bố cục thay đổi).
 */
export const setHeaderFooterLayout = (layout) => {
    lastLayout = layout;
};
