/**
 * Chuyển RTF (xuất từ TX Text Control, cột vanban_temp.noidung) sang JSON của TipTap.
 *
 * Không phụ thuộc thư viện nào, nên có thể chạy cả trong trình duyệt lẫn Node để kiểm thử.
 * Phạm vi hiện tại: ký tự, định dạng chữ, phông, cỡ, màu, tô sáng, căn lề đoạn, ngắt dòng,
 * tab, ký tự Unicode/\'hh. Chưa xử lý: bảng (\trowd), ngắt trang, danh sách, hình ảnh, trường.
 */

const SKIPPED_DESTINATIONS = new Set([
    'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object',
    'header', 'headerl', 'headerr', 'headerf', 'footer', 'footerl', 'footerr', 'footerf',
    'fldinst', 'pntext', 'pn', 'xe', 'tc', 'bkmkstart', 'bkmkend',
    'generator', 'themedata', 'colorschememapping', 'latentstyles', 'listtable',
    'listoverridetable', 'rsidtbl', 'datastore', 'xmlnstbl', 'mmathPr', 'pgdsctbl',
]);

const SPECIAL_CHARACTERS = {
    emdash: '—',
    endash: '–',
    lquote: '‘',
    rquote: '’',
    ldblquote: '“',
    rdblquote: '”',
    bullet: '•',
    enspace: ' ',
    emspace: ' ',
    tab: '\t',
};

const ALIGNMENTS = { ql: 'left', qc: 'center', qr: 'right', qj: 'justify' };

const CONTROL_WORD = /\\([a-zA-Z]+)(-?\d+)? ?/y;

/**
 * @param {string} rtf
 * @returns {{ doc: object, page: { widthTwip: number|null, heightTwip: number|null, marginsTwip: { top: number|null, right: number|null, bottom: number|null, left: number|null } } }}
 */
export function rtfToTipTapDoc(rtf) {
    const fonts = parseFontTable(rtf);
    const colors = parseColorTable(rtf);
    const page = parsePageSetup(rtf);
    const decodeHex = createHexDecoder(fonts);

    const paragraphs = [];
    let inlineNodes = [];
    let defaultState = createState();
    let state = { ...defaultState };
    const groupStack = [];
    let pendingUnicodeSkip = 0;
    let alignment = 'left';

    const pushText = (text) => {
        if (state.skip || text === '') {
            return;
        }

        const marks = buildMarks(state, fonts, colors);
        const markKey = JSON.stringify(marks);
        const last = inlineNodes[inlineNodes.length - 1];

        if (last && last.type === 'text' && JSON.stringify(last.marks ?? []) === markKey) {
            last.text += text;
            return;
        }

        const node = { type: 'text', text };
        if (marks.length > 0) {
            node.marks = marks;
        }
        inlineNodes.push(node);
    };

    let table = null;
    let inTableRow = false;
    let cellEdges = [];
    let cellIndex = 0;
    let cellParagraphs = [];
    let rowCells = [];

    const buildParagraph = () => {
        const paragraph = { type: 'paragraph', attrs: { textAlign: alignment } };
        if (inlineNodes.length > 0) {
            paragraph.content = inlineNodes;
        }
        inlineNodes = [];
        return paragraph;
    };

    const flushTable = () => {
        if (table && table.content.length > 0) {
            paragraphs.push(table);
        }
        table = null;
    };

    const endParagraph = () => {
        const paragraph = buildParagraph();
        if (inTableRow) {
            cellParagraphs.push(paragraph);
            return;
        }
        flushTable();
        paragraphs.push(paragraph);
    };

    const endCell = () => {
        cellParagraphs.push(buildParagraph());
        const left = cellIndex === 0 ? 0 : cellEdges[cellIndex - 1];
        const widthTwip = (cellEdges[cellIndex] ?? left) - left;
        rowCells.push({
            type: 'tableCell',
            attrs: { colspan: 1, rowspan: 1, colwidth: [Math.round(widthTwip * 96 / 1440)] },
            content: cellParagraphs,
        });
        cellParagraphs = [];
        cellIndex += 1;
    };

    const endRow = () => {
        if (cellParagraphs.length > 0) {
            endCell();
        }
        if (table && rowCells.length > 0) {
            table.content.push({ type: 'tableRow', content: rowCells });
        }
        rowCells = [];
        cellEdges = [];
        cellIndex = 0;
        inTableRow = false;
    };

    const startRow = () => {
        if (rowCells.length > 0 || cellParagraphs.length > 0) {
            endRow();
        }
        if (!table) {
            table = { type: 'table', content: [] };
        }
        inTableRow = true;
        rowCells = [];
        cellEdges = [];
        cellParagraphs = [];
        cellIndex = 0;
    };

    const applyControl = (name, parameter) => {
        if (SKIPPED_DESTINATIONS.has(name)) {
            state.skip = true;
            return;
        }

        if (state.skip) {
            return;
        }

        if (name in SPECIAL_CHARACTERS) {
            pushText(SPECIAL_CHARACTERS[name]);
            return;
        }

        if (name in ALIGNMENTS) {
            alignment = ALIGNMENTS[name];
            return;
        }

        const flag = parameter === null || parameter !== 0;

        switch (name) {
            case 'par':
                endParagraph();
                return;
            case 'pard':
                alignment = 'left';
                return;
            case 'line':
                inlineNodes.push({ type: 'hardBreak' });
                return;
            case 'trowd':
                startRow();
                return;
            case 'cellx':
                cellEdges.push(parameter);
                return;
            case 'cell':
                endCell();
                return;
            case 'row':
                endRow();
                return;
            case 'plain':
                state = { ...state, bold: false, italic: false, underline: false, strike: false, sub: false, sup: false, font: null, fs: null, color: null, highlight: null };
                return;
            case 'b':
                state.bold = flag;
                return;
            case 'i':
                state.italic = flag;
                return;
            case 'ul':
                state.underline = flag;
                return;
            case 'ulnone':
                state.underline = false;
                return;
            case 'strike':
                state.strike = flag;
                return;
            case 'sub':
                state.sub = true;
                state.sup = false;
                return;
            case 'super':
                state.sup = true;
                state.sub = false;
                return;
            case 'nosupersub':
                state.sub = false;
                state.sup = false;
                return;
            case 'f':
                state.font = parameter;
                return;
            case 'fs':
                state.fs = parameter;
                return;
            case 'cf':
                state.color = parameter;
                return;
            case 'highlight':
                state.highlight = parameter;
                return;
            case 'uc':
                state.uc = parameter ?? 1;
                return;
            case 'u': {
                const code = parameter < 0 ? parameter + 65536 : parameter;
                pushText(String.fromCharCode(code));
                pendingUnicodeSkip = state.uc;
                return;
            }
            default:
                return;
        }
    };

    let index = 0;
    const length = rtf.length;

    while (index < length) {
        if (pendingUnicodeSkip > 0) {
            index += rtf.startsWith("\\'", index) ? 4 : 1;
            pendingUnicodeSkip -= 1;
            continue;
        }

        const character = rtf[index];

        if (character === '{' && !state.skip && rtf.startsWith('{\\pict', index)) {
            const end = findGroupEnd(rtf, index);
            const image = parsePictGroup(rtf.slice(index, end + 1));
            if (image) {
                inlineNodes.push(image);
            }
            index = end + 1;
            continue;
        }

        if (character === '{') {
            groupStack.push({ ...state });
            index += 1;
            continue;
        }

        if (character === '}') {
            state = groupStack.pop() ?? state;
            index += 1;
            continue;
        }

        if (character === '\\') {
            const next = rtf[index + 1];

            if (next === undefined) {
                break;
            }

            if (/[a-zA-Z]/.test(next)) {
                CONTROL_WORD.lastIndex = index;
                const match = CONTROL_WORD.exec(rtf);
                const parameter = match[2] === undefined ? null : Number(match[2]);
                index = CONTROL_WORD.lastIndex;
                applyControl(match[1], parameter);
                continue;
            }

            if (next === "'") {
                const byte = parseInt(rtf.substr(index + 2, 2), 16);
                pushText(Number.isNaN(byte) ? '' : decodeHex(state.font, byte));
                index += 4;
                continue;
            }

            index += 2;

            if (next === '\\' || next === '{' || next === '}') {
                pushText(next);
            } else if (next === '~') {
                pushText(' ');
            } else if (next === '_') {
                pushText('-');
            } else if (next === '*') {
                state.skip = true;
            } else if (next === '\n' || next === '\r') {
                endParagraph();
            }

            continue;
        }

        if (character === '\r' || character === '\n') {
            index += 1;
            continue;
        }

        let end = index;
        while (end < length && !'{}\\\r\n'.includes(rtf[end])) {
            end += 1;
        }
        pushText(rtf.slice(index, end));
        index = end;
    }

    if (inlineNodes.length > 0) {
        endParagraph();
    }

    flushTable();

    if (paragraphs.length === 0) {
        paragraphs.push({ type: 'paragraph', attrs: { textAlign: 'left' } });
    }

    return { doc: { type: 'doc', content: paragraphs }, page };
}

/**
 * Vị trí của dấu '}' khớp với '{' tại start (bỏ qua \{ \} và \\).
 */
function findGroupEnd(rtf, start) {
    let depth = 0;
    for (let index = start; index < rtf.length; index += 1) {
        const character = rtf[index];
        if (character === '\\') {
            index += 1;
        } else if (character === '{') {
            depth += 1;
        } else if (character === '}') {
            depth -= 1;
            if (depth === 0) {
                return index;
            }
        }
    }
    return rtf.length - 1;
}

/**
 * Đọc một nhóm \pict thành nút ảnh inline (data URL base64). Chỉ hỗ trợ PNG và JPEG.
 * @returns {object|null}
 */
function parsePictGroup(group) {
    const blip = /\\(pngblip|jpegblip)\b/.exec(group);
    if (!blip) {
        return null;
    }

    const mime = blip[1] === 'pngblip' ? 'image/png' : 'image/jpeg';
    const readNumber = (control) => {
        const match = new RegExp(`\\\\${control}(-?\\d+)`).exec(group);
        return match ? Number(match[1]) : null;
    };

    const payload = pictPayload(group);
    if (payload.length === 0 || payload.length % 2 !== 0) {
        return null;
    }

    const twipsToPx = (twip) => Math.round((twip * 96) / 1440);
    const scaleX = (readNumber('picscalex') ?? 100) / 100;
    const scaleY = (readNumber('picscaley') ?? 100) / 100;
    const widthTwip = readNumber('picwgoal');
    const heightTwip = readNumber('pichgoal');

    const attrs = { src: `data:${mime};base64,${hexToBase64(payload)}`, alt: '', title: '' };
    if (widthTwip) {
        attrs.width = twipsToPx(widthTwip * scaleX);
    }
    if (heightTwip) {
        attrs.height = twipsToPx(heightTwip * scaleY);
    }

    return { type: 'image', attrs };
}

/**
 * Lấy chuỗi hex của dữ liệu ảnh: chỉ lấy văn bản ở độ sâu 1 của nhóm \pict,
 * bỏ qua nhóm con (\*\picprop…) và từ khóa điều khiển.
 */
function pictPayload(group) {
    let depth = 0;
    let payload = '';
    for (let index = 0; index < group.length; index += 1) {
        const character = group[index];
        if (character === '{') {
            depth += 1;
        } else if (character === '}') {
            depth -= 1;
        } else if (character === '\\') {
            const word = /^\\[a-zA-Z]+-?\d* ?/.exec(group.slice(index));
            if (word) {
                index += word[0].length - 1;
            } else {
                index += 1;
            }
        } else if (depth === 1 && /[0-9a-fA-F]/.test(character)) {
            payload += character;
        }
    }
    return payload;
}

function hexToBase64(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = parseInt(hex.substr(index * 2, 2), 16);
    }

    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
}

function createState() {
    return {
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        sub: false,
        sup: false,
        font: null,
        fs: null,
        color: null,
        highlight: null,
        uc: 1,
        skip: false,
    };
}

function buildMarks(state, fonts, colors) {
    const marks = [];

    if (state.bold) {
        marks.push({ type: 'bold' });
    }
    if (state.italic) {
        marks.push({ type: 'italic' });
    }
    if (state.underline) {
        marks.push({ type: 'underline' });
    }
    if (state.strike) {
        marks.push({ type: 'strike' });
    }
    if (state.sub) {
        marks.push({ type: 'subscript' });
    }
    if (state.sup) {
        marks.push({ type: 'superscript' });
    }

    const textStyleAttributes = {};
    const fontFamily = state.font !== null ? fonts.get(state.font)?.name : undefined;
    if (fontFamily) {
        textStyleAttributes.fontFamily = fontFamily;
    }
    if (state.fs !== null && state.fs > 0) {
        textStyleAttributes.fontSize = `${state.fs / 2}pt`;
    }
    const color = state.color !== null ? colors[state.color] : undefined;
    if (color) {
        textStyleAttributes.color = color;
    }
    if (Object.keys(textStyleAttributes).length > 0) {
        marks.push({ type: 'textStyle', attrs: textStyleAttributes });
    }

    const highlightColor = state.highlight !== null ? colors[state.highlight] : undefined;
    if (highlightColor) {
        marks.push({ type: 'highlight', attrs: { color: highlightColor } });
    }

    return marks;
}

/**
 * Bảng mã theo \fcharset của phông. Phông tiếng Việt dùng 163 (cp1258): các \'hh của nó
 * không phải cp1252.
 */
const CHARSET_ENCODINGS = {
    0: 'windows-1252',
    128: 'shift_jis',
    129: 'euc-kr',
    136: 'big5',
    161: 'windows-1253',
    162: 'windows-1254',
    163: 'windows-1258',
    177: 'windows-1255',
    178: 'windows-1256',
    186: 'windows-1257',
    204: 'windows-1251',
    222: 'windows-874',
    238: 'windows-1250',
};

/**
 * @returns {Map<number, { name: string, charset: number }>}
 */
function parseFontTable(rtf) {
    const fonts = new Map();
    const start = rtf.indexOf('{\\fonttbl');
    if (start < 0) {
        return fonts;
    }

    let depth = 0;
    let entryStart = -1;
    for (let index = start; index < rtf.length; index += 1) {
        const character = rtf[index];
        if (character === '{') {
            depth += 1;
            if (depth === 2) {
                entryStart = index;
            }
        } else if (character === '}') {
            if (depth === 2 && entryStart >= 0) {
                addFontEntry(fonts, rtf.slice(entryStart, index + 1));
                entryStart = -1;
            }
            depth -= 1;
            if (depth === 0) {
                break;
            }
        }
    }

    return fonts;
}

function addFontEntry(fonts, entry) {
    const index = /\\f(\d+)/.exec(entry);
    if (!index) {
        return;
    }

    const charset = /\\fcharset(\d+)/.exec(entry);
    const name = entry
        .slice(1, -1)
        .replace(/\{[^{}]*\}/g, '')
        .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
        .replace(/[{}]/g, '')
        .split(';')[0]
        .replace(/\s*\((Vietnamese|Western|Central European|Cyrillic|Greek|Turkish|Baltic|Thai)\)\s*$/i, '')
        .replace(/\s+CE$/, '')
        .trim();

    if (name) {
        fonts.set(Number(index[1]), { name, charset: charset ? Number(charset[1]) : 0 });
    }
}

/**
 * Chọn bộ giải mã cho \'hh theo phông hiện tại.
 */
function createHexDecoder(fonts) {
    const decoders = new Map();

    return (fontIndex, byte) => {
        const charset = fontIndex !== null && fonts.get(fontIndex)?.charset;
        const encoding = CHARSET_ENCODINGS[charset ?? 0] ?? 'windows-1252';
        if (!decoders.has(encoding)) {
            decoders.set(encoding, new TextDecoder(encoding));
        }
        return decoders.get(encoding).decode(Uint8Array.of(byte));
    };
}

function parseColorTable(rtf) {
    const colors = [];
    const table = /\{\\colortbl([^}]*)\}/.exec(rtf);
    if (!table) {
        return colors;
    }

    table[1].split(';').forEach((entry, index) => {
        const channels = /\\red(\d+)\\green(\d+)\\blue(\d+)/.exec(entry);
        colors[index] = channels
            ? '#' + [channels[1], channels[2], channels[3]].map((value) => Number(value).toString(16).padStart(2, '0')).join('')
            : null;
    });

    return colors;
}

function parsePageSetup(rtf) {
    const read = (control) => {
        const match = new RegExp(`\\\\${control}(-?\\d+)`).exec(rtf);
        return match ? Number(match[1]) : null;
    };

    /* Thuộc tính của section (\pgwsxn, \marglsxn…) là giá trị thực; \paperw, \margl… chỉ là mặc định của tài liệu. */
    const readSectionOrDocument = (sectionControl, documentControl) => read(sectionControl) ?? read(documentControl);

    return {
        widthTwip: readSectionOrDocument('pgwsxn', 'paperw'),
        heightTwip: readSectionOrDocument('pghsxn', 'paperh'),
        marginsTwip: {
            top: readSectionOrDocument('margtsxn', 'margt'),
            right: readSectionOrDocument('margrsxn', 'margr'),
            bottom: readSectionOrDocument('margbsxn', 'margb'),
            left: readSectionOrDocument('marglsxn', 'margl'),
        },
    };
}
