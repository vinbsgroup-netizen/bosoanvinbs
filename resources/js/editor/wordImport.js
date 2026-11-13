import { rtfToTipTapDoc } from './rtf';

/*
 * Đọc file Word và RTF thành JSON của TipTap, không dùng thư viện ngoài.
 * - .docx là file ZIP chứa XML: giải nén bằng DecompressionStream của trình duyệt.
 * - .doc (Word 97-2003) là container OLE2 nhị phân: đọc bảng piece để lấy văn bản.
 * .docx giữ đoạn, căn lề, thụt lề, giãn dòng, định dạng chữ, bảng và khổ giấy.
 * .doc chỉ giữ văn bản và ngắt đoạn; định dạng chữ, bảng và ảnh không được đọc.
 */

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const ZIP_END_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const MAX_VALID_SECTOR = 0xfffffffa;
const DIRECTORY_TYPE_STORAGE = 1;
const DIRECTORY_TYPE_STREAM = 2;
const DIRECTORY_TYPE_ROOT = 5;

const HIGHLIGHT_COLORS = {
    yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff', magenta: '#ff00ff', blue: '#0000ff',
    red: '#ff0000', darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000',
    darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000', darkGray: '#808080',
    lightGray: '#c0c0c0', black: '#000000',
};

const emptyPage = () => ({
    widthTwip: null,
    heightTwip: null,
    marginsTwip: { top: null, right: null, bottom: null, left: null },
});

/**
 * Nhận dạng file Word hoặc RTF theo chữ ký đầu file, không theo đuôi.
 * @param {ArrayBuffer} buffer
 * @returns {boolean}
 */
export const isWordOrRtfBuffer = (buffer) => {
    const head = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
    return (head[0] === 0x50 && head[1] === 0x4b)
        || CFB_SIGNATURE.every((byte, index) => head[index] === byte)
        || new TextDecoder('latin1').decode(head.subarray(0, 5)) === '{\\rtf';
};

/**
 * @param {ArrayBuffer} buffer
 * @returns {Promise<{ doc: object, page: object }>}
 */
export const readWordDocument = async (buffer) => {
    const head = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
    if (head[0] === 0x50 && head[1] === 0x4b) {
        return readDocx(buffer);
    }
    if (CFB_SIGNATURE.every((byte, index) => head[index] === byte)) {
        return readDoc(buffer);
    }
    if (new TextDecoder('latin1').decode(head.subarray(0, 5)) === '{\\rtf') {
        return rtfToTipTapDoc(new TextDecoder('latin1').decode(buffer));
    }
    throw new Error('Không nhận dạng được định dạng file (cần .docx, .doc hoặc .rtf).');
};

/* ---------- .docx ---------- */

const inflateRaw = async (bytes) => {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Đọc một file trong ZIP theo tên, chỉ giải nén đúng file cần dùng.
 * @returns {Promise<Uint8Array|null>}
 */
const readZipFile = async (buffer, wantedName) => {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    let endOffset = -1;
    for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
        if (view.getUint32(offset, true) === ZIP_END_SIGNATURE) {
            endOffset = offset;
            break;
        }
    }
    if (endOffset < 0) {
        throw new Error('File .docx không phải ZIP hợp lệ.');
    }

    const count = view.getUint16(endOffset + 10, true);
    let cursor = view.getUint32(endOffset + 16, true);
    for (let index = 0; index < count; index += 1) {
        if (view.getUint32(cursor, true) !== ZIP_CENTRAL_SIGNATURE) {
            throw new Error('Mục lục ZIP của file .docx bị hỏng.');
        }
        const nameLength = view.getUint16(cursor + 28, true);
        const name = new TextDecoder('utf-8').decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
        if (name === wantedName) {
            const method = view.getUint16(cursor + 10, true);
            const compressedSize = view.getUint32(cursor + 20, true);
            const localOffset = view.getUint32(cursor + 42, true);
            const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
            const packed = bytes.subarray(dataStart, dataStart + compressedSize);
            if (method === 0) {
                return packed;
            }
            if (method === 8) {
                return inflateRaw(packed);
            }
            throw new Error('Phương pháp nén của file .docx chưa được hỗ trợ.');
        }
        cursor += 46 + nameLength + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    }

    return null;
};

const attr = (element, name) => element?.getAttributeNS(W_NS, name) ?? null;

const child = (element, name) =>
    element ? Array.from(element.children).find((node) => node.localName === name && node.namespaceURI === W_NS) ?? null : null;

const childrenNamed = (element, name) =>
    Array.from(element.children).filter((node) => node.localName === name && node.namespaceURI === W_NS);

/* Cờ kiểu bật/tắt của Word: không có val hoặc val khác 0/false/none thì là bật. */
const isOn = (element) => {
    if (!element) {
        return false;
    }
    const value = attr(element, 'val');
    return value === null || !['0', 'false', 'none'].includes(value);
};

const runMarks = (runProperties) => {
    const marks = [];
    if (isOn(child(runProperties, 'b'))) {
        marks.push({ type: 'bold' });
    }
    if (isOn(child(runProperties, 'i'))) {
        marks.push({ type: 'italic' });
    }
    if (isOn(child(runProperties, 'u'))) {
        marks.push({ type: 'underline' });
    }
    if (isOn(child(runProperties, 'strike'))) {
        marks.push({ type: 'strike' });
    }

    const verticalAlign = attr(child(runProperties, 'vertAlign'), 'val');
    if (verticalAlign === 'subscript' || verticalAlign === 'superscript') {
        marks.push({ type: verticalAlign });
    }

    const highlight = HIGHLIGHT_COLORS[attr(child(runProperties, 'highlight'), 'val')];
    if (highlight) {
        marks.push({ type: 'highlight', attrs: { color: highlight } });
    }

    const textStyle = {};
    const fontFamily = attr(child(runProperties, 'rFonts'), 'ascii');
    if (fontFamily) {
        textStyle.fontFamily = fontFamily;
    }
    const halfPoints = attr(child(runProperties, 'sz'), 'val');
    if (halfPoints) {
        textStyle.fontSize = `${Number(halfPoints) / 2}pt`;
    }
    const color = attr(child(runProperties, 'color'), 'val');
    if (color && color !== 'auto') {
        textStyle.color = `#${color}`;
    }
    if (Object.keys(textStyle).length > 0) {
        marks.push({ type: 'textStyle', attrs: textStyle });
    }

    return marks;
};

const appendText = (inline, text, marks) => {
    if (text === '') {
        return;
    }
    const last = inline[inline.length - 1];
    const markKey = JSON.stringify(marks);
    if (last && last.type === 'text' && JSON.stringify(last.marks ?? []) === markKey) {
        last.text += text;
        return;
    }
    const node = { type: 'text', text };
    if (marks.length > 0) {
        node.marks = marks;
    }
    inline.push(node);
};

const docxParagraph = (paragraph) => {
    const attrs = { textAlign: 'left' };
    const paragraphProperties = child(paragraph, 'pPr');

    const justification = attr(child(paragraphProperties, 'jc'), 'val');
    attrs.textAlign = { center: 'center', right: 'right', end: 'right', both: 'justify', distribute: 'justify' }[justification] ?? 'left';

    const indent = child(paragraphProperties, 'ind');
    const left = attr(indent, 'left') ?? attr(indent, 'start');
    const right = attr(indent, 'right') ?? attr(indent, 'end');
    if (left) {
        attrs.indentLeft = Number(left);
    }
    if (right) {
        attrs.indentRight = Number(right);
    }
    const firstLine = attr(indent, 'firstLine');
    const hanging = attr(indent, 'hanging');
    if (firstLine) {
        attrs.firstLine = Number(firstLine);
    } else if (hanging) {
        attrs.firstLine = -Number(hanging);
    }

    const spacing = child(paragraphProperties, 'spacing');
    const before = attr(spacing, 'before');
    const after = attr(spacing, 'after');
    if (before) {
        attrs.spaceBefore = Number(before) / 20;
    }
    if (after) {
        attrs.spaceAfter = Number(after) / 20;
    }
    const line = attr(spacing, 'line');
    const lineRule = attr(spacing, 'lineRule');
    if (line && (lineRule === null || lineRule === 'auto')) {
        attrs.lineHeight = String(Math.round((Number(line) / 240) * 100) / 100);
    }

    const inline = [];
    for (const run of paragraph.getElementsByTagNameNS(W_NS, 'r')) {
        if (run.parentElement?.localName === 'del') {
            continue;
        }
        const marks = runMarks(child(run, 'rPr'));
        for (const node of run.children) {
            if (node.namespaceURI !== W_NS) {
                continue;
            }
            if (node.localName === 't') {
                appendText(inline, node.textContent, marks);
            } else if (node.localName === 'tab') {
                appendText(inline, '\t', marks);
            } else if ((node.localName === 'br' || node.localName === 'cr') && attr(node, 'type') !== 'page') {
                inline.push({ type: 'hardBreak' });
            }
        }
    }

    return inline.length > 0 ? { type: 'paragraph', attrs, content: inline } : { type: 'paragraph', attrs };
};

const docxTable = (table) => {
    const rows = childrenNamed(table, 'tr')
        .map((row) => ({
            type: 'tableRow',
            content: childrenNamed(row, 'tc').map((cell) => {
                const cellProperties = child(cell, 'tcPr');
                const colspan = Number(attr(child(cellProperties, 'gridSpan'), 'val') ?? 1);
                const widthTwip = Number(attr(child(cellProperties, 'tcW'), 'w') ?? 0);
                const paragraphs = childrenNamed(cell, 'p').map(docxParagraph);
                return {
                    type: 'tableCell',
                    attrs: {
                        colspan,
                        rowspan: 1,
                        colwidth: widthTwip ? [Math.round((widthTwip * 96) / 1440)] : null,
                    },
                    content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }],
                };
            }),
        }))
        .filter((row) => row.content.length > 0);

    return { type: 'table', content: rows };
};

const docxPage = (sectionProperties) => {
    const size = child(sectionProperties, 'pgSz');
    const margins = child(sectionProperties, 'pgMar');
    const twip = (element, name) => {
        const value = attr(element, name);
        return value === null ? null : Math.abs(Number(value));
    };
    return {
        widthTwip: twip(size, 'w'),
        heightTwip: twip(size, 'h'),
        marginsTwip: {
            top: twip(margins, 'top'),
            right: twip(margins, 'right'),
            bottom: twip(margins, 'bottom'),
            left: twip(margins, 'left'),
        },
    };
};

const readDocx = async (buffer) => {
    const xmlBytes = await readZipFile(buffer, 'word/document.xml');
    if (!xmlBytes) {
        throw new Error('File .docx thiếu word/document.xml.');
    }

    const xml = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(xmlBytes), 'application/xml');
    const body = xml.getElementsByTagNameNS(W_NS, 'body')[0];
    if (!body) {
        throw new Error('Không tìm thấy nội dung trong file .docx.');
    }

    const content = [];
    for (const node of body.children) {
        if (node.namespaceURI !== W_NS) {
            continue;
        }
        if (node.localName === 'p') {
            content.push(docxParagraph(node));
        } else if (node.localName === 'tbl') {
            const table = docxTable(node);
            if (table.content.length > 0) {
                content.push(table);
            }
        }
    }

    return {
        doc: { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] },
        page: docxPage(child(body, 'sectPr')),
    };
};

/* ---------- .doc (OLE2 / Word 97-2003) ---------- */

const concatBytes = (parts, size = null) => {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        output.set(part, offset);
        offset += part.length;
    }
    return size === null ? output : output.subarray(0, Math.min(size, output.length));
};

/**
 * Mở container OLE2 và trả về hàm lấy từng luồng theo tên.
 */
const readCompoundFile = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const sectorSize = 2 ** view.getUint16(30, true);
    const miniSectorSize = 2 ** view.getUint16(32, true);
    const miniStreamCutoff = view.getUint32(56, true);

    const sectorBytes = (id) => {
        const offset = (id + 1) * sectorSize;
        return bytes.subarray(offset, offset + sectorSize);
    };
    const sectorEntries = (sector) => {
        const sectorView = new DataView(sector.buffer, sector.byteOffset, sector.byteLength);
        return Array.from({ length: sector.length / 4 }, (_, index) => sectorView.getUint32(index * 4, true));
    };

    /* Các sector FAT nằm trong 109 mục đầu của header, phần còn lại nối qua các sector DIFAT. */
    const fatSectorIds = [];
    for (let index = 0; index < 109; index += 1) {
        const id = view.getUint32(76 + index * 4, true);
        if (id <= MAX_VALID_SECTOR) {
            fatSectorIds.push(id);
        }
    }
    let difatSector = view.getUint32(68, true);
    for (let count = view.getUint32(72, true); count > 0 && difatSector <= MAX_VALID_SECTOR; count -= 1) {
        const entries = sectorEntries(sectorBytes(difatSector));
        fatSectorIds.push(...entries.slice(0, -1).filter((id) => id <= MAX_VALID_SECTOR));
        difatSector = entries[entries.length - 1];
    }

    const fat = fatSectorIds.flatMap((id) => sectorEntries(sectorBytes(id)));
    const chainOf = (table, start) => {
        const ids = [];
        let id = start;
        while (id <= MAX_VALID_SECTOR && ids.length < 1000000) {
            ids.push(id);
            id = table[id] ?? 0xfffffffe;
        }
        return ids;
    };
    const readChain = (start, size = null) => concatBytes(chainOf(fat, start).map(sectorBytes), size);

    const directoryBytes = readChain(view.getUint32(48, true));
    const directoryView = new DataView(directoryBytes.buffer, directoryBytes.byteOffset, directoryBytes.byteLength);
    const directory = [];
    for (let base = 0; base + 128 <= directoryBytes.length; base += 128) {
        const nameLength = directoryView.getUint16(base + 64, true);
        const type = directoryBytes[base + 66];
        if (type === 0 || nameLength < 2) {
            continue;
        }
        directory.push({
            name: new TextDecoder('utf-16le').decode(directoryBytes.subarray(base, base + nameLength - 2)),
            type,
            start: directoryView.getUint32(base + 116, true),
            size: directoryView.getUint32(base + 120, true),
        });
    }

    /* Luồng nhỏ (dưới ngưỡng) nằm trong ministream, được cấp phát theo miniFAT. */
    const root = directory.find((entry) => entry.type === DIRECTORY_TYPE_ROOT);
    const miniStream = root ? readChain(root.start) : new Uint8Array(0);
    const miniFat = sectorEntries(readChain(view.getUint32(60, true)));

    const openStream = (name) => {
        const entry = directory.find((item) => item.name === name && item.type === DIRECTORY_TYPE_STREAM);
        if (!entry) {
            return null;
        }
        if (entry.size < miniStreamCutoff) {
            const parts = chainOf(miniFat, entry.start).map((id) => miniStream.subarray(id * miniSectorSize, (id + 1) * miniSectorSize));
            return concatBytes(parts, entry.size);
        }
        return readChain(entry.start, entry.size);
    };

    return { openStream };
};

/**
 * Bảng piece (CLX) mô tả từng đoạn văn bản: vị trí ký tự, địa chỉ trong luồng WordDocument và có nén hay không.
 */
const readPieceTable = (clx) => {
    const view = new DataView(clx.buffer, clx.byteOffset, clx.byteLength);
    let offset = 0;
    while (offset < clx.length && clx[offset] === 0x01) {
        offset += 3 + view.getUint16(offset + 1, true);
    }
    if (clx[offset] !== 0x02) {
        throw new Error('Bảng piece của file .doc bị hỏng.');
    }

    const size = view.getUint32(offset + 1, true);
    const plc = clx.subarray(offset + 5, offset + 5 + size);
    const plcView = new DataView(plc.buffer, plc.byteOffset, plc.byteLength);
    const count = (size - 4) / 12;
    const pieces = [];
    for (let index = 0; index < count; index += 1) {
        const fcRaw = plcView.getUint32((count + 1) * 4 + index * 8 + 2, true);
        pieces.push({
            cpStart: plcView.getUint32(index * 4, true),
            cpEnd: plcView.getUint32((index + 1) * 4, true),
            compressed: (fcRaw & 0x40000000) !== 0,
            fc: fcRaw & 0x3fffffff,
        });
    }
    return pieces;
};

const decodePiece = (word, piece, count) => {
    if (piece.compressed) {
        const start = piece.fc / 2;
        return new TextDecoder('windows-1252').decode(word.subarray(start, start + count));
    }
    return new TextDecoder('utf-16le').decode(word.subarray(piece.fc, piece.fc + count * 2));
};

/**
 * Chuyển văn bản thô của Word thành đoạn TipTap. Bỏ mã lệnh của trường (giữa 0x13 và 0x14), giữ kết quả.
 */
const textToDocument = (text) => {
    const paragraphs = [];
    let inline = [];
    let buffered = '';
    const fieldStates = [];

    const flushText = () => {
        appendText(inline, buffered, []);
        buffered = '';
    };
    const endParagraph = () => {
        flushText();
        paragraphs.push(inline.length > 0 ? { type: 'paragraph', content: inline } : { type: 'paragraph' });
        inline = [];
    };

    for (const character of text) {
        const code = character.codePointAt(0);
        if (code === 0x13) {
            fieldStates.push('code');
        } else if (code === 0x14 && fieldStates.length > 0) {
            fieldStates[fieldStates.length - 1] = 'result';
        } else if (code === 0x15) {
            fieldStates.pop();
        } else if (fieldStates.includes('code')) {
            continue;
        } else if (code === 0x0d) {
            endParagraph();
        } else if (code === 0x07) {
            /* Dấu kết thúc ô của bảng: chỉ ngắt khi ô có nội dung, bỏ các ô trống của dấu kết thúc hàng. */
            if (inline.length > 0 || buffered !== '') {
                endParagraph();
            }
        } else if (code === 0x0b) {
            flushText();
            inline.push({ type: 'hardBreak' });
        } else if (code === 0x09) {
            buffered += '\t';
        } else if (code >= 0x20) {
            buffered += character;
        }
    }
    if (inline.length > 0 || buffered !== '') {
        endParagraph();
    }

    return { type: 'doc', content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }] };
};

const readDoc = (buffer) => {
    const { openStream } = readCompoundFile(buffer);
    const word = openStream('WordDocument');
    if (!word) {
        throw new Error('File .doc thiếu luồng WordDocument.');
    }

    const wordView = new DataView(word.buffer, word.byteOffset, word.byteLength);
    if (wordView.getUint16(0, true) !== 0xa5ec) {
        throw new Error('Không phải file Word 97-2003 (.doc).');
    }

    /* FIB: bit 0x0200 của cờ quyết định bảng nằm ở 1Table hay 0Table; fcClx/lcbClx và ccpText nằm cố định. */
    const useOneTable = (wordView.getUint16(0x0a, true) & 0x0200) !== 0;
    const table = openStream(useOneTable ? '1Table' : '0Table');
    if (!table) {
        throw new Error('File .doc thiếu bảng nội dung.');
    }

    const clxOffset = wordView.getUint32(0x1a2, true);
    const clxLength = wordView.getUint32(0x1a6, true);
    const textEnd = wordView.getUint32(0x4c, true);

    let text = '';
    for (const piece of readPieceTable(table.subarray(clxOffset, clxOffset + clxLength))) {
        if (piece.cpStart >= textEnd) {
            break;
        }
        const count = Math.min(piece.cpEnd, textEnd) - piece.cpStart;
        text += decodePiece(word, piece, count);
    }

    return { doc: textToDocument(text), page: emptyPage() };
};
