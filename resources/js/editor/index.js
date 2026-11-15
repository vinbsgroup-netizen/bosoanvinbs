import { WINDOWS_FONTS } from './fonts';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import { TableWithAlign, TableRowWithHeight, TableCellWithAlign, TableHeaderWithAlign, locateTableSelection, measureColumnWidths, setTableColumnWidth, setTableRowHeightAt, TWIPS_PER_PX } from './tableExtensions';
import { FontSize } from './fontSize';
import { downloadDocx } from './exportDocx';
import { isSfdt, sfdtToTiptapDoc, sfdtHeaderFooter } from './sfdt';
import { isWordOrRtfBuffer, readWordDocument } from './wordImport';
import { sanitizeDocument } from './sanitize';
import { renderIcons } from './icons';
import { bindWkMenus } from './wkMenus';
import { openFontDialog, openParagraphDialog, openTablePropertiesDialog, openBordersShadingDialog } from './dialogs';
import { applyBorderPreset, applyCellShading } from './tableBorders';
import { renderRibbon } from './ribbon';
import { bindContextMenu } from './contextMenu';
import { PageBreakAttribute } from './pageBreak';
import { bindHeaderFooterPanel } from './hfPanel';
import { renderHeaderFooter, setHeaderFooterLayout, getHeaderFooter, setHeaderFooter, bindHeaderFooterEditing } from './headerFooter';
import { ParagraphFormat } from './paragraphFormat';
import { LinkMark } from './link';
import { INSERT_EXTENSIONS, openSymbolPicker } from './insertItems';
import { updateToc } from './toc';
import { InsertionMark, TrackChanges, trackState } from './track';
import { PageBreaks, resetPagination, setPageLayout } from './pagination';

const FONT_FAMILIES = WINDOWS_FONTS;
const FONT_SIZES = ['10pt', '11pt', '12pt', '13pt', '14pt', '16pt', '18pt', '20pt', '24pt'];
const DEFAULT_FONT = 'Times New Roman';
const DEFAULT_SIZE = '14pt';

const createEditor = (element) =>
    new Editor({
        element,
        content: '<p></p>',
        extensions: [
            StarterKit,
            TextStyle,
            FontFamily,
            FontSize,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            Subscript,
            Superscript,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TableWithAlign.configure({ resizable: true }),
            TableRowWithHeight,
            TableHeaderWithAlign,
            TableCellWithAlign,
            Image.configure({ inline: true, allowBase64: true }),
            PageBreakAttribute,
            ParagraphFormat,
            LinkMark,
            InsertionMark,
            TrackChanges,
            ...INSERT_EXTENSIONS,
            PageBreaks,
        ],
        editorProps: {
            attributes: {
                class: 'doc-body',
                spellcheck: 'false',
            },
        },
    });

const fillDatalist = (list, values) => {
    if (!list) return;
    list.replaceChildren(...values.map((value) => {
        const option = document.createElement('option');
        option.value = value;
        return option;
    }));
};

const populateSelects = (root) => {
    const fontSelect = root.querySelector('[data-control="fontFamily"]');
    fillDatalist(root.querySelector('#bs-font-list'), FONT_FAMILIES);
    fontSelect.value = DEFAULT_FONT;

    const sizeSelect = root.querySelector('[data-control="fontSize"]');
    fillDatalist(root.querySelector('#bs-size-list'), FONT_SIZES.map((size) => size.replace('pt', '')));
    sizeSelect.value = DEFAULT_SIZE.replace('pt', '');
};

/* Tăng hoặc giảm cỡ chữ của vùng chọn theo bước (pt). */
const stepFontSize = (editor, root, delta) => {
    const current = parseFloat(editor.getAttributes('textStyle').fontSize) || parseFloat(root.querySelector('[data-control="fontSize"]').value) || 14;
    const next = Math.max(6, Math.min(72, current + delta));
    editor.chain().focus().setFontSize(`${next}pt`).run();
};

/* Sắp xếp các đoạn văn trong vùng chọn theo thứ tự chữ cái. */
const sortSelectedParagraphs = (editor) => {
    const { state } = editor;
    const { from, to, empty } = state.selection;
    if (empty) return;
    const blocks = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph') blocks.push({ node, pos });
        return node.type.name !== 'paragraph';
    });
    if (blocks.length < 2) return;
    const sorted = [...blocks].sort((a, b) => a.node.textContent.localeCompare(b.node.textContent, 'vi'));
    const tr = state.tr;
    const start = blocks[0].pos;
    const end = blocks[blocks.length - 1].pos + blocks[blocks.length - 1].node.nodeSize;
    const nodes = sorted.map(({ node }) => node);
    tr.replaceWith(start, end, nodes);
    editor.view.dispatch(tr);
};

/**
 * Đổi chữ hoa, chữ thường cho vùng chọn. Chỉ biến đổi từng nút văn bản, nên vị trí không bị lệch.
 */
const changeCaseOfSelection = (editor) => {
    const { state } = editor;
    const { from, to, empty } = state.selection;
    if (empty) {
        return;
    }

    const whole = state.doc.textBetween(from, to, ' ');
    const isUpper = whole === whole.toUpperCase();
    const transform = isUpper
        ? (text) => text.toLowerCase()
        : (text) => text.toUpperCase();

    const tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText) {
            return true;
        }
        const start = Math.max(from, pos);
        const end = Math.min(to, pos + node.nodeSize);
        const piece = transform(node.text.slice(start - pos, end - pos));
        tr.replaceWith(start, end, state.schema.text(piece, node.marks));
        return false;
    });
    editor.view.dispatch(tr);
};

/**
 * Thanh Tìm và Thay thế dưới ribbon. Tìm trong từng nút văn bản.
 */
const toggleFindBar = (root, open) => {
    const bar = root.querySelector('[data-findbar]');
    bar.hidden = !open;
    if (open) {
        bar.querySelector('[data-control="findText"]').focus();
    }
};

const bindFindBar = (editor, root) => {
    const bar = root.querySelector('[data-findbar]');
    const findInput = bar.querySelector('[data-control="findText"]');
    const replaceInput = bar.querySelector('[data-control="replaceText"]');
    const status = bar.querySelector('[data-control="findStatus"]');

    const matches = () => {
        const query = findInput.value;
        const found = [];
        if (!query) {
            return found;
        }
        const lower = query.toLowerCase();
        editor.state.doc.descendants((node, pos) => {
            if (!node.isText) {
                return true;
            }
            const text = node.text.toLowerCase();
            let index = text.indexOf(lower);
            while (index >= 0) {
                found.push({ from: pos + index, to: pos + index + query.length });
                index = text.indexOf(lower, index + query.length);
            }
            return false;
        });
        return found;
    };

    let current = -1;
    const select = (found) => {
        if (found.length === 0) {
            status.textContent = 'Không tìm thấy';
            return;
        }
        current = (current + 1) % found.length;
        const { from, to } = found[current];
        editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
        status.textContent = `${current + 1}/${found.length}`;
    };

    bar.querySelector('[data-action="findNext"]').addEventListener('click', () => select(matches()));
    findInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            select(matches());
        }
    });
    bar.querySelector('[data-action="replaceOne"]').addEventListener('click', () => {
        const found = matches();
        if (found.length === 0) {
            status.textContent = 'Không tìm thấy';
            return;
        }
        current = Math.max(current, 0);
        const target = found[Math.min(current, found.length - 1)];
        editor.view.dispatch(editor.state.tr.insertText(replaceInput.value, target.from, target.to));
        current -= 1;
        status.textContent = `Đã thay (còn ${matches().length})`;
    });
    bar.querySelector('[data-action="replaceAll"]').addEventListener('click', () => {
        const found = matches().reverse();
        const tr = editor.state.tr;
        found.forEach(({ from, to }) => tr.insertText(replaceInput.value, from, to));
        editor.view.dispatch(tr);
        status.textContent = `Đã thay ${found.length} chỗ`;
    });
    bar.querySelector('[data-action="closeFind"]').addEventListener('click', () => toggleFindBar(root, false));
};

/* Kiểu viền lấy từ bút vẽ trên ribbon: màu và độ dày; kiểu nét mặc định là liền. */
const borderSpecFromRibbon = (root) => ({
    style: 'solid',
    width: parseFloat(root.querySelector('[data-control="borderWidth"]')?.value) || 0.5,
    color: root.querySelector('[data-control="borderColor"]')?.value || '#000000',
});

const bindRibbon = (editor, root) => {
    const chainAction = (command) => () => command(editor.chain().focus()).run();

    const actions = {
        bold: chainAction((chain) => chain.toggleBold()),
        italic: chainAction((chain) => chain.toggleItalic()),
        underline: chainAction((chain) => chain.toggleUnderline()),
        strike: chainAction((chain) => chain.toggleStrike()),
        subscript: chainAction((chain) => chain.toggleSubscript()),
        superscript: chainAction((chain) => chain.toggleSuperscript()),
        alignLeft: chainAction((chain) => chain.setTextAlign('left')),
        alignCenter: chainAction((chain) => chain.setTextAlign('center')),
        alignRight: chainAction((chain) => chain.setTextAlign('right')),
        alignJustify: chainAction((chain) => chain.setTextAlign('justify')),
        bulletList: chainAction((chain) => chain.toggleBulletList()),
        orderedList: chainAction((chain) => chain.toggleOrderedList()),
        indent: chainAction((chain) => chain.sinkListItem('listItem')),
        outdent: chainAction((chain) => chain.liftListItem('listItem')),
        clearFormat: chainAction((chain) => chain.unsetAllMarks().clearNodes()),
        undo: chainAction((chain) => chain.undo()),
        redo: chainAction((chain) => chain.redo()),
        insertTable: chainAction((chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true })),
        blankPage: () => editor.chain().focus().insertBlankPage().run(),
        changeCase: () => changeCaseOfSelection(editor),
        multilevel: () => editor.chain().focus().toggleOrderedList().run(),
        showMarks: () => root.classList.toggle('bs-show-marks'),
        borders: () => {
            const active = editor.getAttributes('paragraph').bordered;
            editor.chain().focus().setParagraphFormat({ bordered: !active }).run();
        },
        find: () => toggleFindBar(root, true),
        selectAll: () => editor.chain().focus().selectAll().run(),
        hyperlink: () => {
            const href = (window.prompt('Địa chỉ liên kết (URL):', 'https://') ?? '').trim();
            if (href) editor.chain().focus().setLink(href).run();
        },
        bookmark: () => {
            const name = (window.prompt('Tên dấu trang:') ?? '').trim();
            if (name) editor.chain().focus().setBookmark(name).run();
        },
        comment: () => {
            const text = (window.prompt('Nội dung chú thích:') ?? '').trim();
            if (text) editor.chain().focus().setComment(text).run();
        },
        symbol: () => openSymbolPicker(editor),
        checkbox: () => editor.chain().focus().insertCheckbox().run(),
        formText: () => editor.chain().focus().insertFormText().run(),
        orientation: () => {
            applyPageSetup(root, editor, {
                ...currentPage,
                widthTwip: currentPage.heightTwip,
                heightTwip: currentPage.widthTwip,
            });
        },
        pageSizeFocus: () => root.querySelector('[data-control="pageSize"]').focus(),
        marginsFocus: () => root.querySelector('[data-control="marginTop"]').focus(),
        paraIndent: () => {
            const cm = (name) => Number.parseFloat(root.querySelector(`[data-control="${name}"]`).value) || 0;
            editor.chain().focus().setParagraphFormat({
                indentLeft: Math.round(cm('indentCm') * 567),
                indentRight: Math.round(cm('indentRightCm') * 567),
                firstLine: Math.round(cm('firstCm') * 567),
            }).run();
        },
        paraSpacing: () => {
            const pt = (name) => Number.parseFloat(root.querySelector(`[data-control="${name}"]`).value) || 0;
            editor.chain().focus().setParagraphFormat({
                spaceBefore: pt('spaceBeforePt'),
                spaceAfter: pt('spaceAfterPt'),
                lineHeight: root.querySelector('[data-control="paraLine"]').value,
            }).run();
        },
        toc: () => updateToc(editor, { insertIfMissing: true, maxLevel: Number(root.querySelector('[data-control="tocLevels"]').value) }),
        tocUpdate: () => updateToc(editor, { insertIfMissing: false, maxLevel: Number(root.querySelector('[data-control="tocLevels"]').value) }),
        enforce: () => root.querySelector('[data-control="readOnly"]').click(),
        mergeField: () => {
            const name = root.querySelector('[data-control="mergeName"]').value.trim();
            if (name) editor.chain().focus().insertMergeField(name).run();
        },
        mergePreview: () => {
            const data = window.__mergeData ?? {};
            const tr = editor.state.tr;
            const found = [];
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'mergeField') found.push({ pos, name: node.attrs.name });
            });
            found.reverse().forEach(({ pos, name }) => {
                const value = data[name];
                if (value !== undefined) {
                    tr.replaceWith(pos, pos + 1, editor.state.schema.text(String(value)));
                }
            });
            editor.view.dispatch(tr);
        },
        acceptChanges: () => editor.chain().focus().acceptChanges().run(),
        rejectChanges: () => editor.chain().focus().rejectChanges().run(),
        formatPainter: () => {
            const marks = editor.state.selection.$from.marks();
            window.__painterMarks = marks.map((m) => m.toJSON());
            root.dispatchEvent(new Event('bs-painter-armed'));
        },
        fontGrow: () => stepFontSize(editor, root, 2),
        fontShrink: () => stepFontSize(editor, root, -2),
        sortParagraphs: () => sortSelectedParagraphs(editor),
        draftView: () => root.querySelector('.bs-page-wrap').classList.toggle('bs-draft'),
        print: () => window.print(),
        exportDocx: () => downloadDocx(editor).catch((error) => window.alert(`Không tải được file Word: ${error.message}`)),
        tableAddRowBefore: () => editor.chain().focus().addRowBefore().run(),
        tableAddRowAfter: () => editor.chain().focus().addRowAfter().run(),
        tableDeleteRow: () => editor.chain().focus().deleteRow().run(),
        tableAddColBefore: () => editor.chain().focus().addColumnBefore().run(),
        tableAddColAfter: () => editor.chain().focus().addColumnAfter().run(),
        tableDeleteCol: () => editor.chain().focus().deleteColumn().run(),
        tableMerge: () => editor.chain().focus().mergeCells().run(),
        tableSplit: () => editor.chain().focus().splitCell().run(),
        tableHeader: () => editor.chain().focus().toggleHeaderRow().run(),
        tableDelete: () => editor.chain().focus().deleteTable().run(),
        tableProperties: () => openTablePropertiesDialog(editor),
        borderShadingDialog: () => openBordersShadingDialog(editor),
        tableBorder: (event) => applyBorderPreset(editor, event.currentTarget.dataset.value, borderSpecFromRibbon(root)),
        tableShading: (event) => applyCellShading(editor, event.currentTarget.dataset.value || null),
        fieldCodes: () => root.classList.add('bs-field-codes'),
        fieldText: () => root.classList.remove('bs-field-codes'),
        insertPageNumber: () => {
            if (root.querySelector('.bs-hf.is-editing')) {
                document.execCommand('insertText', false, '{n}');
                return;
            }
            root.dispatchEvent(new Event('bs-hf-open'));
        },
        insertDate: () => {
            const now = new Date();
            const pad = (value) => String(value).padStart(2, '0');
            const text = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
            if (root.querySelector('.bs-hf.is-editing')) {
                document.execCommand('insertText', false, text);
                return;
            }
            editor.chain().focus().insertContent(text).run();
        },
        openFile: () => {
            /* Nút "Mở file Word" của demo1: mở hộp chọn file JSON/SFDT (.txt, .sfdt) của bộ soạn. */
            const input = root.querySelector('[data-control="open"]');
            if (!input) return;
            input.accept = '.json,.txt,.sfdt,application/json,text/plain';
            input.click();
        },
        applyFontColor: (event) => {
            const value = event.currentTarget.dataset.value ?? root.querySelector('[data-control="color"]').value;
            const chain = editor.chain().focus();
            if (value === 'auto' || value === '') chain.unsetColor().run();
            else chain.setColor(value).run();
            const bar = root.querySelector('[data-wk-color-bar="font"]');
            if (bar && value !== 'auto') bar.style.background = value;
        },
        applyHighlight: (event) => {
            const value = event.currentTarget.dataset.value ?? root.querySelector('[data-control="highlight"]').value;
            const chain = editor.chain().focus();
            if (value === 'none' || value === '') chain.unsetHighlight().run();
            else chain.setHighlight({ color: value }).run();
            const bar = root.querySelector('[data-wk-color-bar="highlight"]');
            if (bar && value !== 'none') bar.style.background = value;
        },
        hfPanel: (event) => {
            /* Như demo1: sửa đầu/chân trang trực tiếp trên trang đầu, không mở panel riêng. */
            const where = event.currentTarget.dataset.where === 'chan' ? 'chan' : 'dau';
            root.querySelector(`.bs-hf.is-editable.is-${where}`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        },
        copy: () => {
            editor.commands.focus();
            document.execCommand('copy');
        },
        cut: () => {
            editor.commands.focus();
            document.execCommand('cut');
        },
        paste: async () => {
            const status = root.querySelector('[data-status]');
            try {
                const text = await navigator.clipboard.readText();
                const paragraphs = text.split(/\r?\n/).map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' }));
                editor.chain().focus().insertContent(paragraphs).run();
            } catch (error) {
                if (status) status.textContent = `Dán thất bại: ${error.message}`;
            }
        },
        pageBreak: () => editor.chain().focus().insertPageBreak().run(),
    };

    root.querySelectorAll('[data-tab]').forEach((tab) => {
        tab.addEventListener('click', () => {
            root.querySelectorAll('[data-tab]').forEach((other) => {
                other.classList.toggle('is-active', other === tab);
                other.classList.toggle('wk-tab-active', other === tab);
                other.setAttribute('aria-selected', other === tab ? 'true' : 'false');
            });
            root.querySelectorAll('[data-panel]').forEach((panel) => {
                panel.hidden = panel.dataset.panel !== tab.dataset.tab;
            });
        });
    });

    root.querySelector('[data-collapse-toggle]')?.addEventListener('click', (event) => {
        const collapsed = root.classList.toggle('wk-collapsed');
        event.currentTarget.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        event.currentTarget.title = collapsed ? 'Mở rộng ribbon' : 'Thu gọn ribbon';
    });

    root.querySelector('[data-control="insertImage"]').addEventListener('change', (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            editor.chain().focus().setImage({ src: reader.result }).run();
        });
        reader.readAsDataURL(file);
    });

    root.querySelectorAll('[data-action]').forEach((button) => {
        const action = actions[button.dataset.action];
        if (!action) {
            return;
        }

        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', action);
    });

    const fontSelect = root.querySelector('[data-control="fontFamily"]');
    fontSelect.addEventListener('change', () => {
        editor.chain().focus().setFontFamily(fontSelect.value).run();
    });

    const sizeSelect = root.querySelector('[data-control="fontSize"]');
    sizeSelect.addEventListener('change', () => {
        const size = parseFloat(sizeSelect.value);
        if (Number.isFinite(size) && size > 0) editor.chain().focus().setFontSize(`${size}pt`).run();
    });

    const colorInput = root.querySelector('[data-control="color"]');
    colorInput.addEventListener('input', () => {
        editor.chain().focus().setColor(colorInput.value).run();
    });

    const styleCards = root.querySelectorAll('[data-style]');
    styleCards.forEach((card) => {
        card.addEventListener('click', () => {
            const chain = editor.chain().focus();
            if (card.dataset.style === 'p') {
                chain.setParagraph().run();
            } else {
                chain.setHeading({ level: Number(card.dataset.style.slice(1)) }).run();
            }
        });
    });

    const highlightInput = root.querySelector('[data-control="highlight"]');
    highlightInput?.addEventListener('input', () => {
        editor.chain().focus().setHighlight({ color: highlightInput.value }).run();
    });

    const syncRibbonState = () => {
        const activeStates = {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            strike: editor.isActive('strike'),
            subscript: editor.isActive('subscript'),
            superscript: editor.isActive('superscript'),
            alignLeft: editor.isActive({ textAlign: 'left' }),
            alignCenter: editor.isActive({ textAlign: 'center' }),
            alignRight: editor.isActive({ textAlign: 'right' }),
            alignJustify: editor.isActive({ textAlign: 'justify' }),
            bulletList: editor.isActive('bulletList'),
            orderedList: editor.isActive('orderedList'),
        };

        root.querySelectorAll('[data-action]').forEach((button) => {
            const key = button.dataset.action;
            if (key in activeStates) {
                button.classList.toggle('is-active', activeStates[key]);
                button.classList.toggle('wk-on', activeStates[key]);
            }
        });

        const activeStyle = [1, 2, 3].map((level) => (editor.isActive('heading', { level }) ? `h${level}` : null)).find(Boolean) ?? 'p';
        root.querySelectorAll('[data-style]').forEach((card) => card.classList.toggle('is-active', card.dataset.style === activeStyle));

        const attributes = editor.getAttributes('textStyle');
        if (attributes.fontFamily) {
            fontSelect.value = attributes.fontFamily;
        }
        if (attributes.fontSize) {
            sizeSelect.value = String(parseFloat(attributes.fontSize));
        }
    };

    editor.on('selectionUpdate', syncRibbonState);
    editor.on('transaction', syncRibbonState);
};

const TWIPS_PER_MM = 1440 / 25.4;
const DEFAULT_PAGE = { widthTwip: 11906, heightTwip: 16838, marginsTwip: { top: 1134, right: 1134, bottom: 1134, left: 1701 } };

/**
 * Đặt khổ trang và lề theo số liệu đọc từ RTF (twip). Thiếu giá trị nào thì giữ mặc định A4 của bộ soạn.
 */
let currentPage = DEFAULT_PAGE;

const TWIPS_PER_CM = 1440 / 2.54;
const PAGE_SIZES = {
    a4: { widthTwip: 11906, heightTwip: 16838 },
    letter: { widthTwip: 12240, heightTwip: 15840 },
};

const syncLayoutInputs = (root, page) => {
    const set = (control, twip) => {
        root.querySelector(`[data-control="${control}"]`).value = (twip / TWIPS_PER_CM).toFixed(1);
    };
    set('marginTop', page.marginsTwip.top);
    set('marginBottom', page.marginsTwip.bottom);
    set('marginLeft', page.marginsTwip.left);
    set('marginRight', page.marginsTwip.right);
    const sizeKey = page.widthTwip === PAGE_SIZES.letter.widthTwip ? 'letter' : 'a4';
    root.querySelector('[data-control="pageSize"]').value = sizeKey;
};

const applyPageSetup = (root, editor, page) => {
    currentPage = page;
    syncLayoutInputs(root, { ...DEFAULT_PAGE, ...page, marginsTwip: { ...DEFAULT_PAGE.marginsTwip, ...(page.marginsTwip ?? {}) } });
    const pageElement = root.querySelector('.bs-page');
    const ruler = root.querySelector('.bs-ruler');
    const width = page.widthTwip ?? DEFAULT_PAGE.widthTwip;
    const height = page.heightTwip ?? DEFAULT_PAGE.heightTwip;
    const margins = { ...DEFAULT_PAGE.marginsTwip };
    Object.entries(page.marginsTwip ?? {}).forEach(([side, value]) => {
        if (value !== null && value !== undefined) {
            margins[side] = value;
        }
    });

    const toMm = (twip) => `${(twip / TWIPS_PER_MM).toFixed(2)}mm`;

    pageElement.style.width = toMm(width);
    pageElement.style.minHeight = toMm(height);
    pageElement.style.padding = `${toMm(margins.top)} ${toMm(margins.right)} ${toMm(margins.bottom)} ${toMm(margins.left)}`;
    ruler.style.width = toMm(width);
    renderRuler(ruler, width, margins);

    setPageLayout(editor, { widthTwip: width, heightTwip: height, marginsTwip: margins });
};

/**
 * Vẽ thước theo cm: vạch mỗi 1 cm, số ở mỗi cm, vùng lề được tô xám.
 */
const renderRuler = (ruler, widthTwip, margins) => {
    const widthMm = widthTwip / TWIPS_PER_MM;
    const leftMm = margins.left / TWIPS_PER_MM;
    const rightMm = margins.right / TWIPS_PER_MM;

    const parts = [
        `<div class="bs-ruler-margin" style="left:0;width:${leftMm.toFixed(2)}mm"></div>`,
        `<div class="bs-ruler-margin" style="right:0;width:${rightMm.toFixed(2)}mm"></div>`,
    ];
    /* Dấu lề trái và lề phải trên thước ngang, như thước TX. */
    parts.push(`<div class="bs-ruler-marker" data-hmargin="left" style="left:${leftMm.toFixed(2)}mm"></div>`);
    parts.push(`<div class="bs-ruler-marker is-right" data-hmargin="right" style="left:${(widthMm - rightMm).toFixed(2)}mm"></div>`);
    /* Số đo tính từ lề trái: 0 tại lề, số âm nằm trong vùng lề, như thước của bộ soạn demo1. */
    const phase = leftMm % 10;
    for (let mm = phase; mm <= widthMm; mm += 10) {
        const label = Math.round((mm - leftMm) / 10);
        parts.push(`<span class="bs-ruler-tick" style="left:${mm.toFixed(2)}mm">${label !== 0 ? label : ''}</span>`);
        for (let half = 1; half < 10 && mm + half < widthMm; half += 1) {
            const isHalf = half === 5;
            parts.push(`<i class="bs-ruler-minor${isHalf ? ' is-half' : ''}" style="left:${(mm + half).toFixed(2)}mm"></i>`);
        }
    }
    ruler.innerHTML = parts.join('');
};

/**
 * Gửi kết quả về máy chủ khi khách mở bộ soạn qua phiên (/soan/{ma}).
 */
const bindSession = (editor, root) => {
    const session = window.BO_SOAN;
    const status = root.querySelector('[data-status]');
    const button = root.querySelector('[data-action="submitResult"]');

    if (!session) {
        return;
    }

    button.hidden = false;
    button.addEventListener('click', async () => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
        status.textContent = 'Đang gửi…';
        try {
            const response = await fetch(session.ket_qua_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ noi_dung: { ...editor.getJSON(), hf: getHeaderFooter() } }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            status.textContent = 'Đã gửi kết quả';
        } catch (error) {
            status.textContent = `Gửi thất bại: ${error.message}`;
        }
    });
};

const bindFileActions = (editor, root) => {
    bindSession(editor, root);

    root.querySelector('[data-action="save"]').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ ...editor.getJSON(), hf: getHeaderFooter() }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'van-ban.json';
        link.click();
        URL.revokeObjectURL(url);
    });

    root.querySelector('[data-control="open"]').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        try {
            const bytes = await file.arrayBuffer();
            if (isWordOrRtfBuffer(bytes)) {
                /* Nút "Mở file Word" của demo1 dùng chung ô này: file Word/RTF đi qua bộ đọc Word. */
                const { doc, page } = await readWordDocument(bytes);
                editor.commands.setContent(doc);
                applyPageSetup(root, editor, page);
            } else {
                const json = JSON.parse(new TextDecoder().decode(bytes));
                if (isSfdt(json)) {
                    /* File mẫu của Syncfusion (SFDT): đổi nội dung và đầu/chân trang sang cấu trúc của bộ soạn. */
                    setHeaderFooter(sfdtHeaderFooter(json));
                    editor.commands.setContent(sanitizeDocument(sfdtToTiptapDoc(json)));
                } else {
                    setHeaderFooter(json.hf);
                    editor.commands.setContent(sanitizeDocument(json));
                }
            }
            resetPagination(editor);
        } catch (error) {
            window.alert(`Không mở được file: ${error.message}`);
        } finally {
            event.target.value = '';
        }
    });

    root.querySelector('[data-control="openDocument"]').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        try {
            const { doc, page } = await readWordDocument(await file.arrayBuffer());
            editor.commands.setContent(doc);
            applyPageSetup(root, editor, page);
        } catch (error) {
            window.alert(`Không mở được file: ${error.message}`);
        } finally {
            event.target.value = '';
        }
    });
};

/**
 * Vẽ thước dọc theo cm bên trái trang, cao bằng toàn bộ tờ. Lề trên và lề dưới của tờ đầu được tô xám.
 */
const renderVerticalRuler = (ruler, { heightPx, pageHeightPx, pages }, margins) => {
    const pageMm = pageHeightPx * 25.4 / 96;
    const topMm = margins.top / TWIPS_PER_MM;
    const bottomMm = margins.bottom / TWIPS_PER_MM;
    const parts = [];

    /* Mỗi tờ có thước riêng, đánh số lại từ mép trên của tờ đó. */
    for (let page = 0; page < pages; page += 1) {
        const offset = page * pageMm;
        parts.push(`<div class="bs-ruler-margin" style="top:${offset.toFixed(2)}mm;height:${topMm.toFixed(2)}mm"></div>`);
        parts.push(`<div class="bs-ruler-margin" style="top:${(offset + pageMm - bottomMm).toFixed(2)}mm;height:${bottomMm.toFixed(2)}mm"></div>`);
        for (let cm = 0; cm * 10 < pageMm; cm += 1) {
            parts.push(`<span class="bs-vruler-tick" style="top:${(offset + cm * 10).toFixed(2)}mm">${cm > 0 ? cm : ''}</span>`);
            for (let half = 1; half < 10 && cm * 10 + half < pageMm; half += 1) {
                const isHalf = half === 5;
                parts.push(`<i class="bs-vruler-minor${isHalf ? ' is-half' : ''}" style="top:${(offset + cm * 10 + half).toFixed(2)}mm"></i>`);
            }
        }
        if (page > 0) {
            parts.push(`<div class="bs-vruler-sep" style="top:${offset.toFixed(2)}mm"></div>`);
        }
    }
    /* Tay nắm lề trên và lề dưới của tờ đầu, kéo được trên thước dọc. */
        parts.push(`<div class="bs-vmargin" data-vmargin="top" style="top:${topMm.toFixed(2)}mm"></div>`);
        parts.push(`<div class="bs-vmargin" data-vmargin="bottom" style="top:${(pageMm - bottomMm).toFixed(2)}mm"></div>`);
        ruler.style.height = `${heightPx}px`;
    ruler.innerHTML = parts.join('');
};

/**
 * Tab Bố cục trang: đổi khổ giấy và lề theo cm rồi áp dụng cho toàn bộ tài liệu.
 */
const bindLayoutPanel = (editor, root) => {
    root.querySelector('[data-action="applyLayout"]').addEventListener('click', () => {
        const readCm = (control, fallbackTwip) => {
            const value = Number.parseFloat(root.querySelector(`[data-control="${control}"]`).value);
            return Number.isFinite(value) && value >= 0 ? Math.round(value * TWIPS_PER_CM) : fallbackTwip;
        };
        const size = PAGE_SIZES[root.querySelector('[data-control="pageSize"]').value] ?? PAGE_SIZES.a4;
        applyPageSetup(root, editor, {
            widthTwip: size.widthTwip,
            heightTwip: size.heightTwip,
            marginsTwip: {
                top: readCm('marginTop', currentPage.marginsTwip.top),
                bottom: readCm('marginBottom', currentPage.marginsTwip.bottom),
                left: readCm('marginLeft', currentPage.marginsTwip.left),
                right: readCm('marginRight', currentPage.marginsTwip.right),
            },
        });
    });
};

/**
 * Nhóm Đoạn văn: giãn dòng, tô nền đoạn.
 */
const bindParagraphPanel = (editor, root) => {
    const lineHeight = root.querySelector('[data-control="lineHeight"]');
    if (lineHeight) {
        lineHeight.addEventListener('change', () => {
            editor.chain().focus().setParagraphFormat({ lineHeight: lineHeight.value }).run();
        });
    }

    const shading = root.querySelector('[data-control="shading"]');
    if (shading) {
        shading.addEventListener('input', () => {
            editor.chain().focus().setParagraphFormat({ shading: shading.value }).run();
        });
    }
};

/**
 * Các tab Soát lỗi, Xem và Quyền.
 */
const bindReviewPanels = (editor, root) => {
    const spellcheck = root.querySelector('[data-control="spellcheck"]');
    spellcheck.addEventListener('change', () => {
        editor.view.dom.setAttribute('spellcheck', spellcheck.checked ? 'true' : 'false');
    });

    const hRuler = root.querySelector('[data-control="hRuler"]');
    hRuler.addEventListener('change', () => {
        root.querySelector('.bs-ruler').style.display = hRuler.checked ? '' : 'none';
    });

    const vRuler = root.querySelector('[data-control="vRuler"]');
    vRuler.addEventListener('change', () => {
        root.querySelector('[data-vruler]').style.display = vRuler.checked ? '' : 'none';
    });

    const zoom = root.querySelector('[data-control="zoom"]');
    zoom.addEventListener('change', () => {
        root.querySelector('.bs-page-wrap').style.zoom = zoom.value;
    });

    const readOnly = root.querySelector('[data-control="readOnly"]');
    readOnly.addEventListener('change', () => {
        editor.setEditable(!readOnly.checked);
    });
};

/**
 * Kéo các dấu lề trên thước ngang và tay nắm lề trên thước dọc để đổi lề, như bộ soạn V2.
 */
/* Ghi thụt lề vào các đoạn đang chọn, giới hạn số lần cập nhật theo khung hình. */
let indentFrame = 0;
const applyIndent = (editor, indentLeft, firstLine) => {
    if (indentFrame) return;
    indentFrame = requestAnimationFrame(() => {
        indentFrame = 0;
        editor.chain().focus().setParagraphFormat({ indentLeft, firstLine }).run();
    });
};

/* Vẽ dấu thụt dòng đầu (▼ trên) và thụt lề trái (▲ dưới) theo đoạn hiện tại. */
const renderIndentMarkers = (root, editor) => {
    const ruler = root.querySelector('.bs-ruler');
    if (!ruler) return;
    ruler.querySelectorAll('.bs-indent').forEach((element) => element.remove());
    ruler.querySelectorAll('.bs-tab-stop').forEach((element) => element.remove());
    const attrs = editor.getAttributes('paragraph');
    const leftTwip = currentPage.marginsTwip.left;
    const indentLeft = attrs.indentLeft ?? 0;
    const firstLine = attrs.firstLine ?? 0;
    const leftMm = (leftTwip + indentLeft) / TWIPS_PER_MM;
    const firstMm = (leftTwip + indentLeft + firstLine) / TWIPS_PER_MM;
    const stops = (attrs.tabs ?? [])
        .map((tab) => `<div class="bs-tab-stop" data-tab-pos="${tab.pos}" title="${TAB_TYPES[tab.type]?.label ?? 'Điểm dừng'}" style="left:${((leftTwip + tab.pos) / TWIPS_PER_MM).toFixed(2)}mm">${TAB_TYPES[tab.type]?.symbol ?? 'L'}</div>`)
        .join('');
    ruler.insertAdjacentHTML('beforeend',
        stops +
        `<div class="bs-indent is-first" data-indent="first" title="Thụt dòng đầu" style="left:${firstMm.toFixed(2)}mm"></div>` +
        `<div class="bs-indent is-left" data-indent="left" title="Thụt lề trái" style="left:${leftMm.toFixed(2)}mm"></div>`);
};

/* Các loại điểm dừng tab, theo thứ tự nút "L" trên thước chuyển qua. */
const TAB_CYCLE = ['left', 'center', 'right', 'decimal'];
const TAB_TYPES = {
    left: { symbol: 'L', label: 'Điểm dừng trái' },
    center: { symbol: '⊥', label: 'Điểm dừng giữa' },
    right: { symbol: '⌐', label: 'Điểm dừng phải' },
    decimal: { symbol: '.', label: 'Điểm dừng thập phân' },
};

/* Vị trí (twip, tính từ lề trái) của một điểm trên thước; trả null nếu nằm ngoài vùng soạn thảo. */
const rulerTextTwip = (root, clientX) => {
    const rect = root.querySelector('.bs-ruler').getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const x = Math.round(fraction * currentPage.widthTwip) - currentPage.marginsTwip.left;
    const textWidth = currentPage.widthTwip - currentPage.marginsTwip.left - currentPage.marginsTwip.right;
    return x < 0 || x > textWidth ? null : x;
};

/* Bấm lên vùng soạn thảo của thước để đặt điểm dừng; bấm lại đúng chỗ đó thì xóa. */
const toggleTabStop = (editor, root, clientX) => {
    const x = rulerTextTwip(root, clientX);
    if (x === null) return;
    const tolerance = 40;
    const current = editor.getAttributes('paragraph').tabs ?? [];
    const existing = current.findIndex((tab) => Math.abs(tab.pos - x) <= tolerance);
    const tabs = existing >= 0
        ? current.filter((_, index) => index !== existing)
        : [...current, { pos: x, type: root.dataset.tabKind || 'left' }].sort((a, b) => a.pos - b.pos);
    editor.chain().focus().setParagraphFormat({ tabs: tabs.length ? tabs : null }).run();
};

/* Bóng mờ của điểm dừng sắp đặt, hiện khi di chuột trên vùng soạn thảo của thước. */
const bindTabGhost = (root) => {
    root.addEventListener('pointermove', (event) => {
        const ruler = root.querySelector('.bs-ruler');
        if (!ruler) return;
        const ghost = ruler.querySelector('.bs-tab-ghost');
        const onRuler = event.target.closest('.bs-ruler') && !event.target.closest('[data-hmargin], [data-indent], .bs-tab-stop, .bs-col-stop');
        const x = onRuler ? rulerTextTwip(root, event.clientX) : null;
        if (x === null) {
            ghost?.remove();
            return;
        }
        const el = ghost ?? document.createElement('div');
        el.className = 'bs-tab-ghost';
        el.textContent = TAB_TYPES[root.dataset.tabKind || 'left'].symbol;
        el.style.left = `${((currentPage.marginsTwip.left + x) / TWIPS_PER_MM).toFixed(2)}mm`;
        if (!ghost) ruler.appendChild(el);
    });
    root.addEventListener('pointerleave', () => root.querySelector('.bs-tab-ghost')?.remove());
};

/* Vẽ mốc cạnh phải của từng cột trên thước ngang khi con trỏ nằm trong bảng; kéo mốc để đổi độ rộng cột. */
const renderColumnStops = (root, editor) => {
    const ruler = root.querySelector('.bs-ruler');
    if (!ruler) return;
    ruler.querySelectorAll('.bs-col-stop').forEach((element) => element.remove());
    const location = locateTableSelection(editor.state);
    if (!location) return;
    const widths = measureColumnWidths(editor);
    const totalTwip = widths.reduce((sum, px) => sum + px * TWIPS_PER_PX, 0);
    const textWidth = currentPage.widthTwip - currentPage.marginsTwip.left - currentPage.marginsTwip.right;
    const align = location.table.attrs.align ?? 'left';
    const offset = align === 'center' ? (textWidth - totalTwip) / 2 : align === 'right' ? textWidth - totalTwip : 0;
    let edge = currentPage.marginsTwip.left + offset;
    const stops = widths.map((px, index) => {
        edge += px * TWIPS_PER_PX;
        return `<div class="bs-col-stop" data-col-index="${index}" title="Kéo để đổi độ rộng cột ${index + 1}" style="left:${(edge / TWIPS_PER_MM).toFixed(2)}mm"></div>`;
    });
    ruler.insertAdjacentHTML('beforeend', stops.join(''));
};

/* Vẽ mốc đáy của từng hàng trên thước dọc khi con trỏ nằm trong bảng; kéo mốc để đổi chiều cao hàng. */
const renderRowStops = (root, editor) => {
    const ruler = root.querySelector('[data-vruler]');
    if (!ruler) return;
    ruler.querySelectorAll('.bs-row-stop').forEach((element) => element.remove());
    const location = locateTableSelection(editor.state);
    if (!location) return;
    const rulerRect = ruler.getBoundingClientRect();
    if (!rulerRect.height) return;
    const scale = ruler.offsetHeight / rulerRect.height;
    const stops = [];
    let rowNumber = 0;
    location.table.forEach((row, offset) => {
        rowNumber += 1;
        const rowPos = location.tablePos + 1 + offset;
        const dom = editor.view.nodeDOM(rowPos);
        if (!dom) return;
        const top = (dom.getBoundingClientRect().bottom - rulerRect.top) * scale;
        stops.push(`<div class="bs-row-stop" data-row-pos="${rowPos}" title="Kéo để đổi chiều cao hàng ${rowNumber}" style="top:${top.toFixed(1)}px"></div>`);
    });
    ruler.insertAdjacentHTML('beforeend', stops.join(''));
};

const bindRulerDrag = (editor, root) => {
    editor.on('transaction', () => {
        renderIndentMarkers(root, editor);
        renderColumnStops(root, editor);
        renderRowStops(root, editor);
    });
    bindTabGhost(root);
    let columnDrag = null;
    let rowStopDrag = null;

    const corner = root.querySelector('[data-corner]');
    let cornerIndex = 0;
    root.dataset.tabKind = TAB_CYCLE[0];
    corner.addEventListener('click', () => {
        cornerIndex = (cornerIndex + 1) % TAB_CYCLE.length;
        root.dataset.tabKind = TAB_CYCLE[cornerIndex];
        corner.textContent = TAB_TYPES[TAB_CYCLE[cornerIndex]].symbol;
        corner.title = TAB_TYPES[TAB_CYCLE[cornerIndex]].label;
    });

    let drag = null;
    let frame = 0;
    const zoomOf = () => Number(root.querySelector('.bs-page-wrap').style.zoom || 1);
    const minGap = 720;

    const update = (margins) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            applyPageSetup(root, editor, { ...currentPage, marginsTwip: margins });
        });
    };

    root.addEventListener('pointerdown', (event) => {
        const rowHandle = event.target.closest('[data-row-pos]');
        if (rowHandle) {
            event.preventDefault();
            const dom = editor.view.nodeDOM(Number(rowHandle.dataset.rowPos));
            rowStopDrag = {
                rowPos: Number(rowHandle.dataset.rowPos),
                startY: event.clientY,
                startHeight: (dom ? dom.getBoundingClientRect().height : 0) / zoomOf(),
            };
            return;
        }
        const columnHandle = event.target.closest('[data-col-index]');
        if (columnHandle) {
            event.preventDefault();
            const index = Number(columnHandle.dataset.colIndex);
            columnDrag = { index, startX: event.clientX, startWidth: measureColumnWidths(editor)[index] ?? 100 };
            return;
        }
        const handle = event.target.closest('[data-hmargin], [data-vmargin], [data-indent]');
        if (!handle) {
            if (event.target.closest('.bs-ruler')) {
                toggleTabStop(editor, root, event.clientX);
            }
            return;
        }
        event.preventDefault();
        if (handle.dataset.indent) {
            drag = { axis: 'indent', kind: handle.dataset.indent };
            return;
        }
        drag = handle.dataset.hmargin
            ? { axis: 'h', side: handle.dataset.hmargin }
            : { axis: 'v', side: handle.dataset.vmargin };
    });

    document.addEventListener('pointermove', (event) => {
        if (rowStopDrag) {
            const heightPx = Math.max(12, Math.round(rowStopDrag.startHeight + (event.clientY - rowStopDrag.startY) / zoomOf()));
            setTableRowHeightAt(editor, rowStopDrag.rowPos, heightPx);
            return;
        }
        if (columnDrag) {
            const rect = root.querySelector('.bs-ruler').getBoundingClientRect();
            const twipPerScreenPx = currentPage.widthTwip / rect.width;
            const deltaPx = ((event.clientX - columnDrag.startX) * twipPerScreenPx) / TWIPS_PER_PX;
            setTableColumnWidth(editor, columnDrag.index, columnDrag.startWidth + deltaPx);
            return;
        }
        if (!drag) return;
        const margins = { ...currentPage.marginsTwip };
        if (drag.axis === 'indent') {
            const rect = root.querySelector('.bs-ruler').getBoundingClientRect();
            const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const x = Math.round(fraction * currentPage.widthTwip);
            const attrs = editor.getAttributes('paragraph');
            let indentLeft = attrs.indentLeft ?? 0;
            let firstLine = attrs.firstLine ?? 0;
            if (drag.kind === 'first') {
                firstLine = Math.max(-indentLeft, x - (margins.left + indentLeft));
            } else {
                indentLeft = Math.max(0, x - margins.left);
            }
            applyIndent(editor, indentLeft, firstLine);
            return;
        }
        if (drag.axis === 'h') {
            const rect = root.querySelector('.bs-ruler').getBoundingClientRect();
            const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const x = Math.round(fraction * currentPage.widthTwip);
            if (drag.side === 'left') {
                margins.left = Math.min(Math.max(0, x), currentPage.widthTwip - margins.right - minGap);
            } else {
                margins.right = Math.min(Math.max(0, currentPage.widthTwip - x), currentPage.widthTwip - margins.left - minGap);
            }
        } else {
            const rect = root.querySelector('[data-vruler]').getBoundingClientRect();
            const y = Math.round(((event.clientY - rect.top) / zoomOf()) * 1440 / 96);
            if (drag.side === 'top') {
                margins.top = Math.min(Math.max(0, y), currentPage.heightTwip - margins.bottom - minGap);
            } else {
                margins.bottom = Math.min(Math.max(0, currentPage.heightTwip - y), currentPage.heightTwip - margins.top - minGap);
            }
        }
        update(margins);
    });

    document.addEventListener('pointerup', () => {
        drag = null;
        columnDrag = null;
        rowStopDrag = null;
    });
};

/*
 * Kéo mép dưới của hàng trong bảng để đổi chiều cao hàng. Rê chuột gần mép dưới thì con trỏ đổi thành mũi tên dọc.
 */
const ROW_EDGE_PX = 5;
const ROW_MIN_PX = 12;
const bindRowResize = (editor, root) => {
    let rowDrag = null;
    const zoomOf = () => Number(root.querySelector('.bs-page-wrap').style.zoom || 1);
    const rowAtEdge = (event) => {
        const row = event.target.closest?.('tr');
        if (!row || !editor.view.dom.contains(row)) return null;
        const rect = row.getBoundingClientRect();
        return event.clientY >= rect.bottom - ROW_EDGE_PX && event.clientY <= rect.bottom + 2 ? row : null;
    };

    editor.view.dom.addEventListener('pointermove', (event) => {
        if (rowDrag) return;
        const cursor = rowAtEdge(event) ? 'ns-resize' : '';
        if (document.body.style.cursor !== cursor) document.body.style.cursor = cursor;
    });

    editor.view.dom.addEventListener('pointerdown', (event) => {
        const row = rowAtEdge(event);
        if (!row) return;
        event.preventDefault();
        const $pos = editor.state.doc.resolve(editor.view.posAtDOM(row, 0));
        let depth = $pos.depth;
        while (depth > 0 && $pos.node(depth).type.name !== 'tableRow') depth -= 1;
        if (depth === 0) return;
        rowDrag = {
            rowPos: $pos.before(depth),
            startY: event.clientY,
            startHeight: row.getBoundingClientRect().height / zoomOf(),
        };
    });

    document.addEventListener('pointermove', (event) => {
        if (!rowDrag) return;
        const heightPx = Math.max(ROW_MIN_PX, Math.round(rowDrag.startHeight + (event.clientY - rowDrag.startY) / zoomOf()));
        setTableRowHeightAt(editor, rowDrag.rowPos, heightPx);
    });

    document.addEventListener('pointerup', () => {
        if (!rowDrag) return;
        rowDrag = null;
        document.body.style.cursor = '';
    });
};

/* Màu nền trang, khung trang và lưới bảng. */
const bindLayoutExtras = (editor, root) => {
    root.querySelector('[data-control="trackChanges"]').addEventListener('change', (event) => {
        trackState.enabled = event.target.checked;
    });
    let painterArmed = false;
    root.addEventListener('bs-painter-armed', () => { painterArmed = true; });
    root.addEventListener('bs-painter-arm', () => { painterArmed = true; });
    editor.on('selectionUpdate', () => {
        if (!painterArmed) return;
        const { from, to, empty } = editor.state.selection;
        if (empty) return;
        painterArmed = false;
        const { schema } = editor.state;
        const marks = (window.__painterMarks ?? []).map((json) => schema.marks[json.type].create(json.attrs));
        let tr = editor.state.tr.removeMark(from, to);
        marks.forEach((mark) => { tr = tr.addMark(from, to, mark); });
        editor.view.dispatch(tr);
    });
    root.querySelector('[data-control="language"]').addEventListener('change', (event) => {
        editor.chain().focus().setLanguage(event.target.value).run();
    });
    root.querySelector('[data-control="dataSource"]').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            window.__mergeData = JSON.parse(await file.text());
        }
        event.target.value = '';
    });
    root.querySelector('[data-control="gridLines"]').addEventListener('change', (event) => {
        root.classList.toggle('bs-grid-lines', event.target.checked);
    });
};

/* Chọn kiểu viết hoa/thường cho vùng chọn. */
const setCaseMode = (editor, mode) => {
    const { state } = editor;
    const { from, to, empty } = state.selection;
    if (empty) return;
    const titleCase = (text) => text.toLowerCase().replace(/(^|\s)(\S)/g, (match, space, letter) => space + letter.toUpperCase());
    const transform = mode === 'upper' ? (t) => t.toUpperCase() : mode === 'lower' ? (t) => t.toLowerCase() : titleCase;
    const tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText) return true;
        const start = Math.max(from, pos);
        const end = Math.min(to, pos + node.nodeSize);
        const piece = transform(node.text.slice(start - pos, end - pos));
        tr.replaceWith(start, end, state.schema.text(piece, node.marks));
        return false;
    });
    editor.view.dispatch(tr);
};

/* Lệnh của các menu thả xuống. */
const runWkMenu = (editor, name, value) => {
    const chain = () => editor.chain().focus();
    switch (name) {
        case 'font-color': chain().setColor(value).run(); break;
        case 'highlight': chain().setHighlight({ color: value }).run(); break;
        case 'bullets': chain().toggleBulletList().run(); break;
        case 'numbering': chain().toggleOrderedList().run(); break;
        case 'line-spacing': chain().setParagraphFormat({ lineHeight: value }).run(); break;
        case 'change-case': setCaseMode(editor, value); break;
        case 'table-insert': {
            const size = Number(value);
            chain().insertTable({ rows: size, cols: size, withHeaderRow: true }).run();
            break;
        }
        default: break;
    }
};

const mountEditor = () => {
    const root = document.getElementById('bo-soan');
    if (!root) {
        return;
    }

    renderRibbon(root);
    renderIcons(root);

    populateSelects(root);

    const editor = createEditor(root.querySelector('[data-editor-surface]'));
    applyPageSetup(root, editor, DEFAULT_PAGE);

    if (window.BO_SOAN?.noi_dung) {
        setHeaderFooter(window.BO_SOAN.noi_dung.hf);
        editor.commands.setContent(sanitizeDocument(window.BO_SOAN.noi_dung));
        resetPagination(editor);
    }
    bindRibbon(editor, root);
    bindFileActions(editor, root);
    bindLayoutPanel(editor, root);
    bindReviewPanels(editor, root);
    bindFindBar(editor, root);
    bindContextMenu(editor, root);
    bindRulerDrag(editor, root);
    bindRowResize(editor, root);
    const syncTableTab = () => {
        const tab = root.querySelector('[data-tab="table"]');
        const inTable = editor.isActive('table');
        tab.hidden = !inTable;
        if (!inTable && root.querySelector('[data-panel="table"]').hidden === false) {
            root.querySelector('[data-tab="home"]').click();
        }
    };
    editor.on('selectionUpdate', syncTableTab);
    editor.on('transaction', syncTableTab);
    bindWkMenus(root, (name, value) => runWkMenu(editor, name, value));
    root.addEventListener('bo-soan:insert-table', (event) => {
        const { rows, cols } = event.detail;
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    });
    root.addEventListener('click', (event) => {
        const launcher = event.target.closest('[data-dialog]');
        if (!launcher) return;
        if (launcher.dataset.dialog === 'font') openFontDialog(editor);
        if (launcher.dataset.dialog === 'paragraph') openParagraphDialog(editor);
    });
    bindHeaderFooterEditing(root);
    bindLayoutExtras(editor, root);
    bindHeaderFooterPanel(root, () => {
        renderHeaderFooter(root.querySelector('.bs-page'));
    });
    editor.view.dom.addEventListener('bs-sheet-height', (event) => {
        setHeaderFooterLayout({
            pageHeightPx: event.detail.pageHeightPx,
            pages: event.detail.pages,
            topPx: currentPage.marginsTwip.top * 96 / 1440,
            bottomPx: currentPage.marginsTwip.bottom * 96 / 1440,
            widthPx: currentPage.widthTwip * 96 / 1440,
            paddingLeftPx: currentPage.marginsTwip.left * 96 / 1440,
            paddingRightPx: currentPage.marginsTwip.right * 96 / 1440,
        });
        renderHeaderFooter(root.querySelector('.bs-page'));
    });
    root.querySelector('[data-action="qatSave"]')?.addEventListener('click', () => {
        root.querySelector('[data-action="save"]')?.click();
    });
    bindParagraphPanel(editor, root);

    const vruler = root.querySelector('[data-vruler]');
    editor.view.dom.addEventListener('bs-sheet-height', (event) => {
        renderVerticalRuler(vruler, event.detail, currentPage.marginsTwip);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        mountEditor();
    } catch (error) {
        console.error('Khởi tạo bộ soạn lỗi:', error);
    }
});
