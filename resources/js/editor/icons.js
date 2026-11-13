import { wordKitIcons } from './wordKitIcons';
/**
 * Bộ icon màu cho ribbon, vẽ mới theo cùng ẩn dụ và bảng màu của ribbon TX (không sao chép tài sản của TX).
 * Mỗi icon là một chuỗi SVG 24×24.
 */
const BLUE = '#2b579a';
const BLUE_LIGHT = '#bcd3ef';
const GREEN = '#2f855a';
const ORANGE = '#dd6b20';
const YELLOW = '#f6c343';
const RED = '#c53030';
const INK = '#323130';
const GREY = '#8a8886';

const letter = (text, extra = '') =>
    `<text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${INK}" ${extra}>${text}</text>`;

const ICONS = {
    undo: `<path d="M9 6 4 11l5 5" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11h9.5a5.5 5.5 0 0 1 0 11H10" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`,
    redo: `<path d="m15 6 5 5-5 5" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 11h-9.5a5.5 5.5 0 0 0 0 11H14" fill="none" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`,
    bold: letter('B', 'font-size="17"'),
    italic: `<text x="12" y="17" text-anchor="middle" font-family="Georgia, serif" font-size="17" font-style="italic" font-weight="700" fill="${INK}">I</text>`,
    underline: letter('U') + `<rect x="6" y="19" width="12" height="2" rx="1" fill="${BLUE}"/>`,
    strike: letter('S') + `<rect x="3" y="11" width="18" height="2" rx="1" fill="${RED}"/>`,
    subscript: letter('X', 'x="9"') + `<text x="18" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="${BLUE}">2</text>`,
    superscript: letter('X', 'x="9"') + `<text x="18" y="11" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="${BLUE}">2</text>`,
    clearFormat: `<path d="M9 5h9l-5 6H6z" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 11l5 5-3 3H4l-1-1z" fill="${RED}"/><path d="M14 16h7" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
    alignLeft: `<rect x="3" y="4" width="10" height="3" rx="1" fill="${BLUE}"/><rect x="3" y="10" width="18" height="2" rx="1" fill="${INK}"/><rect x="3" y="15" width="14" height="2" rx="1" fill="${INK}"/><rect x="3" y="20" width="10" height="2" rx="1" fill="${INK}"/>`,
    alignCenter: `<rect x="7" y="4" width="10" height="3" rx="1" fill="${BLUE}"/><rect x="3" y="10" width="18" height="2" rx="1" fill="${INK}"/><rect x="5" y="15" width="14" height="2" rx="1" fill="${INK}"/><rect x="7" y="20" width="10" height="2" rx="1" fill="${INK}"/>`,
    alignRight: `<rect x="11" y="4" width="10" height="3" rx="1" fill="${BLUE}"/><rect x="3" y="10" width="18" height="2" rx="1" fill="${INK}"/><rect x="7" y="15" width="14" height="2" rx="1" fill="${INK}"/><rect x="11" y="20" width="10" height="2" rx="1" fill="${INK}"/>`,
    alignJustify: `<rect x="3" y="4" width="18" height="3" rx="1" fill="${BLUE}"/><rect x="3" y="10" width="18" height="2" rx="1" fill="${INK}"/><rect x="3" y="15" width="18" height="2" rx="1" fill="${INK}"/><rect x="3" y="20" width="18" height="2" rx="1" fill="${INK}"/>`,
    bulletList: `<circle cx="4.5" cy="6" r="2" fill="${BLUE}"/><circle cx="4.5" cy="12" r="2" fill="${BLUE}"/><circle cx="4.5" cy="18" r="2" fill="${BLUE}"/><rect x="9" y="5" width="12" height="2" rx="1" fill="${INK}"/><rect x="9" y="11" width="12" height="2" rx="1" fill="${INK}"/><rect x="9" y="17" width="12" height="2" rx="1" fill="${INK}"/>`,
    orderedList: `<text x="2" y="8" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="${BLUE}">1</text><text x="2" y="14" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="${BLUE}">2</text><text x="2" y="20" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="${BLUE}">3</text><rect x="9" y="5" width="12" height="2" rx="1" fill="${INK}"/><rect x="9" y="11" width="12" height="2" rx="1" fill="${INK}"/><rect x="9" y="17" width="12" height="2" rx="1" fill="${INK}"/>`,
    outdent: `<rect x="9" y="4" width="13" height="2" rx="1" fill="${INK}"/><rect x="9" y="10" width="13" height="2" rx="1" fill="${INK}"/><rect x="9" y="16" width="13" height="2" rx="1" fill="${INK}"/><rect x="9" y="22" width="13" height="0" fill="${INK}"/><path d="M7 7 2 12l5 5z" fill="${BLUE}"/>`,
    indent: `<rect x="2" y="4" width="13" height="2" rx="1" fill="${INK}"/><rect x="2" y="10" width="13" height="2" rx="1" fill="${INK}"/><rect x="2" y="16" width="13" height="2" rx="1" fill="${INK}"/><path d="M17 7l5 5-5 5z" fill="${BLUE}"/>`,
    table: `<rect x="3" y="4" width="18" height="16" rx="1.5" fill="#fff" stroke="${BLUE}" stroke-width="1.5"/><rect x="3" y="4" width="18" height="4" fill="${BLUE}"/><path d="M3 12h18M3 16h18M9 8v12M15 8v12" stroke="${BLUE}" stroke-width="1.2"/>`,
    image: `<rect x="3" y="4" width="18" height="16" rx="1.5" fill="#ebf8ff" stroke="${BLUE}" stroke-width="1.5"/><circle cx="8.5" cy="9" r="2" fill="${YELLOW}"/><path d="M4 19l5-6 3 3 3-4 5 7z" fill="${GREEN}"/>`,
    save: `<rect x="4" y="3" width="16" height="18" rx="2" fill="${BLUE}"/><rect x="7" y="3" width="10" height="6" fill="#fff"/><rect x="7" y="13" width="10" height="8" rx="1" fill="#fff"/><rect x="13" y="5" width="2" height="3" fill="${BLUE}"/>`,
    open: `<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.5l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" fill="${YELLOW}" stroke="#b7791f" stroke-width="1"/><path d="M3 10h18" stroke="#b7791f" stroke-width="1"/>`,
    submit: `<path d="M2 11.5 21 3l-4 18-6-5.5-3 3v-5.5z" fill="${GREEN}"/><path d="M21 3 10.5 14" stroke="#fff" stroke-width="1.2"/>`,
    spellcheck: letter('ABC', 'font-size="9"') + `<path d="M3 21q2-2 4 0t4 0 4 0 4 0" fill="none" stroke="${RED}" stroke-width="1.6" stroke-linecap="round"/>`,
    ruler: `<rect x="2" y="7" width="20" height="10" rx="1" fill="${YELLOW}" stroke="#b7791f" stroke-width="1"/><path d="M6 7v4M10 7v2M14 7v4M18 7v2" stroke="#744210" stroke-width="1"/>`,
    margins: `<rect x="4" y="2" width="16" height="20" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.2"/><rect x="7.5" y="5.5" width="9" height="13" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="1" stroke-dasharray="2 1"/>`,
    lock: `<path d="M8 11V7.5a4 4 0 0 1 8 0V11" fill="none" stroke="${GREY}" stroke-width="2"/><rect x="5" y="11" width="14" height="10" rx="2" fill="${YELLOW}" stroke="#b7791f" stroke-width="1"/><circle cx="12" cy="16" r="1.5" fill="#744210"/>`,
    zoom: `<circle cx="10" cy="10" r="6.5" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="2"/><path d="M15 15l6 6" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round"/>`,
    pageSize: `<path d="M6 2h9l5 5v15H6z" fill="#fff" stroke="${INK}" stroke-width="1.2"/><path d="M15 2v5h5" fill="${BLUE_LIGHT}" stroke="${INK}" stroke-width="1.2"/>`,
    table2: `<rect x="3" y="4" width="18" height="16" rx="1.5" fill="#fff" stroke="${BLUE}" stroke-width="1.5"/><rect x="3" y="4" width="18" height="4" fill="${BLUE}"/><path d="M3 12h18M9 8v12" stroke="${BLUE}" stroke-width="1.2"/>`,
};

/* Icon bổ sung cho tab Trang chủ, vẽ theo cùng bảng màu. */
Object.assign(ICONS, {
    paste: `<rect x="5" y="4" width="14" height="17" rx="2" fill="#fff" stroke="${BLUE}" stroke-width="1.5"/><rect x="8.5" y="2" width="7" height="4" rx="1" fill="${BLUE}"/><rect x="8" y="9" width="8" height="8" fill="${BLUE_LIGHT}"/>`,
    copy: `<rect x="8" y="8" width="12" height="13" rx="1.5" fill="#fff" stroke="${BLUE}" stroke-width="1.5"/><rect x="4" y="3" width="12" height="13" rx="1.5" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="1.5"/>`,
    cut: `<circle cx="7" cy="17" r="3" fill="none" stroke="${RED}" stroke-width="1.8"/><circle cx="17" cy="17" r="3" fill="none" stroke="${RED}" stroke-width="1.8"/><path d="M9 15 19 4M15 15 5 4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
    fontGrow: letter('A', 'font-size="15"') + `<path d="M19 3v6M16 6h6" stroke="${BLUE}" stroke-width="1.6"/>`,
    fontShrink: letter('A', 'font-size="11"') + `<path d="M16 6h6" stroke="${BLUE}" stroke-width="1.6"/>`,
    changeCase: letter('Aa', 'font-size="12"') + `<path d="M4 21h16" stroke="${GREY}" stroke-width="1.2"/>`,
    lineSpacing: `<path d="M8 3v18M5 6l3-3 3 3M5 18l3 3 3-3" fill="none" stroke="${BLUE}" stroke-width="1.6" stroke-linecap="round"/><rect x="13" y="5" width="8" height="2" fill="${INK}"/><rect x="13" y="11" width="8" height="2" fill="${INK}"/><rect x="13" y="17" width="8" height="2" fill="${INK}"/>`,
    shading: `<path d="M4 16 12 4l8 12-8 4z" fill="${YELLOW}" stroke="${INK}" stroke-width="1.2"/><rect x="3" y="20" width="18" height="2" fill="${BLUE}"/>`,
    borders: `<rect x="3" y="3" width="18" height="18" fill="none" stroke="${BLUE}" stroke-width="1.5"/><path d="M3 12h18M12 3v18" stroke="${BLUE}" stroke-width="1.2"/>`,
    showMarks: `<path d="M14 4v16M18 4v16M14 4h6M10 4h4a4 4 0 0 0 0 8h-4z" fill="none" stroke="${BLUE}" stroke-width="1.6" stroke-linejoin="round"/>`,
    sort: letter('A', 'font-size="10" x="7"') + letter('Z', 'font-size="10" x="17"') + `<path d="M12 5v14M9 16l3 3 3-3" fill="none" stroke="${BLUE}" stroke-width="1.4"/>`,
    multilevel: `<rect x="3" y="4" width="4" height="2" fill="${INK}"/><rect x="9" y="10" width="12" height="2" fill="${INK}"/><rect x="9" y="16" width="12" height="2" fill="${INK}"/><rect x="3" y="4" width="2" height="2" fill="${BLUE}"/><path d="M4 10h3M4 16h3" stroke="${GREY}" stroke-width="1.5"/>`,
    styles: letter('A', 'font-size="20" x="9" y="18"') + `<path d="M16 4l4 4-7 7-3 1 1-3z" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="1.2"/>`,
    find: `<circle cx="10" cy="10" r="6" fill="${BLUE_LIGHT}" stroke="${BLUE}" stroke-width="2"/><path d="M15 15l5 5" stroke="${BLUE}" stroke-width="2.4" stroke-linecap="round"/>`,
    replace: letter('ab', 'font-size="9" x="8" y="10"') + letter('ac', 'font-size="9" x="8" y="20"') + `<path d="M14 9h6l-2-2M20 15h-6l2 2" fill="none" stroke="${BLUE}" stroke-width="1.4"/>`,
    selectAll: `<rect x="3" y="3" width="18" height="18" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-dasharray="3 2"/><path d="M7 12l3 3 7-7" fill="none" stroke="${GREEN}" stroke-width="2"/>`,
});

/* Icon dự phòng cho nút chưa có hình riêng: khung vuông với ba vạch. */
const FALLBACK = `<rect x="3" y="4" width="18" height="16" rx="2" fill="#edf2f7" stroke="${GREY}" stroke-width="1.5"/><path d="M7 9h10M7 12h10M7 15h6" stroke="${GREY}" stroke-width="1.4" stroke-linecap="round"/>`;

const svg = (body) =>
    `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${body}</svg>`;

/**
 * Thay mọi phần tử [data-icon] bằng SVG tương ứng.
 * @param {ParentNode} root
 */
export const renderIcons = (root) => {
    root.querySelectorAll('[data-icon]').forEach((element) => {
        const name = element.dataset.icon;
        if (wordKitIcons[name]) {
            element.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${wordKitIcons[name]}</svg>`;
        } else if (ICONS[name]) {
            element.innerHTML = svg(ICONS[name]);
        } else {
            element.innerHTML = svg(FALLBACK);
        }
    });
};
