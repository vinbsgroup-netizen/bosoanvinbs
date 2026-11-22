if (typeof ej !== "undefined" && ej.base && typeof ej.base.enableRipple === "function") {
    ej.base.enableRipple(Boolean(window.ripple));
}

var hostUrl = window.location.origin.replace(/\/+$/, "") + "/";
// Dich vu .NET DocumentEditor chi con dung cho "Mo file" (gui kem trong yeu cau import). Dan giu dinh dang va PDF
// lam ngay tren trinh duyet. Trang nao can dich vu rieng van override qua window.syncfusionOfficeKitDocumentServiceUrl.
var syncfusionOfficeKitDocumentServiceUrl = window.syncfusionOfficeKitDocumentServiceUrl || (hostUrl + "api/documenteditor/");
var syncfusionOfficeKitDefaultCharacterFormat = {
    bold: false,
    italic: false,
    fontSize: 14,
    fontFamily: "Times New Roman",
    underline: "None",
    strikethrough: "None",
    baselineAlignment: "Normal",
    highlightColor: "NoColor",
    fontColor: "#000000",
    fontSizeBidi: 14,
    fontFamilyBidi: "Times New Roman",
};
var syncfusionOfficeKitDefaultParagraphFormat = {
    leftIndent: 0,
    rightIndent: 0,
    firstLineIndent: 0,
    textAlignment: "Left",
    beforeSpacing: 0,
    afterSpacing: 0,
    lineSpacing: 1.0791666507720947,
    lineSpacingType: "Multiple",
    styleName: "Normal",
    listFormat: {},
    bidi: false,
};
var syncfusionOfficeKitDefaultSectionFormat = {
    pageWidth: 595.28,
    pageHeight: 841.89,
    leftMargin: 85.04,
    rightMargin: 56.69,
    topMargin: 56.69,
    bottomMargin: 56.69,
    differentFirstPage: false,
    differentOddAndEvenPages: false,
    headerDistance: 36,
    footerDistance: 36,
    bidi: false,
};
var syncfusionOfficeKitRulerMaxMarginRatio = 0.45;

injectSyncfusionOfficeKitModules();

function injectSyncfusionOfficeKitModules() {
    if (typeof ej === "undefined" || !ej.documenteditor || !ej.documenteditor.DocumentEditorContainer || typeof ej.documenteditor.DocumentEditorContainer.Inject !== "function") {
        return;
    }

    var moduleNames = [
        "Toolbar",
        "Editor",
        "Selection",
        "EditorHistory",
        "ContextMenu",
        "ImageResizer",
        "OptionsPane",
        "Search",
        "SfdtExport",
        "WordExport",
        "TextExport",
        "Print",
        "TableDialog",
        "BookmarkDialog",
        "HyperlinkDialog",
        "TableOfContentsDialog",
        "PageSetupDialog",
        "StyleDialog",
        "ListDialog",
        "ParagraphDialog",
        "BulletsAndNumberingDialog",
        "FontDialog",
        "TablePropertiesDialog",
        "BordersAndShadingDialog",
        "TableOptionsDialog",
        "CellOptionsDialog",
        "StylesDialog",
        "Ruler",
    ];
    var modules = [];

    moduleNames.forEach(function (moduleName) {
        if (ej.documenteditor[moduleName]) {
            modules.push(ej.documenteditor[moduleName]);
        }
    });

    if (modules.length > 0 && ej.documenteditor.DocumentEditor && typeof ej.documenteditor.DocumentEditor.Inject === "function") {
        ej.documenteditor.DocumentEditor.Inject.apply(ej.documenteditor.DocumentEditor, modules.filter(function (module) {
            return module !== ej.documenteditor.Toolbar;
        }));
    }

    if (modules.length > 0) {
        ej.documenteditor.DocumentEditorContainer.Inject.apply(ej.documenteditor.DocumentEditorContainer, modules);
    }
}

function cloneSyncfusionOfficeKitObject(object) {
    var cloned = {};

    Object.keys(object || {}).forEach(function (key) {
        cloned[key] = object[key];
    });

    return cloned;
}

function syncfusionOfficeKitParagraph(text, paragraphFormat, characterFormat) {
    var format = cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultParagraphFormat);
    var inlineFormat = cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultCharacterFormat);

    Object.keys(paragraphFormat || {}).forEach(function (key) {
        format[key] = paragraphFormat[key];
    });
    Object.keys(characterFormat || {}).forEach(function (key) {
        inlineFormat[key] = characterFormat[key];
    });
    format.listFormat = cloneSyncfusionOfficeKitObject(format.listFormat);

    return {
        paragraphFormat: format,
        characterFormat: inlineFormat,
        inlines: text ? [{
            characterFormat: inlineFormat,
            text: text,
        }] : [],
    };
}

function syncfusionOfficeKitDocument(blocks) {
    return {
        sections: [{
            sectionFormat: cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultSectionFormat),
            blocks: blocks && blocks.length ? blocks : [syncfusionOfficeKitParagraph("")],
            headersFooters: {
                header: { blocks: [syncfusionOfficeKitParagraph("")] },
                footer: { blocks: [syncfusionOfficeKitParagraph("")] },
            },
        }],
        characterFormat: cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultCharacterFormat),
        paragraphFormat: cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultParagraphFormat),
        defaultTabWidth: 36,
        trackChanges: false,
        enforcement: false,
        hashValue: "",
        saltValue: "",
        formatting: false,
        protectionType: "NoProtection",
        dontUseHTMLParagraphAutoSpacing: false,
        background: { color: "#FFFFFF" },
        styles: [{
            name: "Normal",
            type: "Paragraph",
            paragraphFormat: {
                lineSpacing: 1.149999976158142,
                lineSpacingType: "Multiple",
                listFormat: {},
            },
            characterFormat: {
                fontFamily: "Times New Roman",
            },
            next: "Normal",
        }, {
            name: "Default Paragraph Font",
            type: "Character",
            characterFormat: {},
        }, {
            name: "Heading 1",
            type: "Paragraph",
            paragraphFormat: {
                beforeSpacing: 12,
                afterSpacing: 0,
                outlineLevel: "Level1",
                listFormat: {},
            },
            characterFormat: {
                fontSize: 16,
                fontFamily: "Times New Roman",
            },
            basedOn: "Normal",
            next: "Normal",
        }, {
            name: "Heading 2",
            type: "Paragraph",
            paragraphFormat: {
                beforeSpacing: 2,
                afterSpacing: 6,
                outlineLevel: "Level2",
                listFormat: {},
            },
            characterFormat: {
                fontSize: 13,
                fontFamily: "Times New Roman",
            },
            basedOn: "Normal",
            next: "Normal",
        }, {
            name: "Title",
            type: "Paragraph",
            paragraphFormat: {
                beforeSpacing: 12,
                afterSpacing: 6,
                textAlignment: "Center",
                outlineLevel: "BodyText",
                listFormat: {},
            },
            characterFormat: {
                bold: true,
                fontSize: 18,
                fontFamily: "Times New Roman",
            },
            basedOn: "Normal",
            next: "Normal",
        }],
        lists: [],
        abstractLists: [],
        comments: [],
        revisions: [],
    };
}

function configureSyncfusionOfficeKit(editorContainer) {
    if (!editorContainer) {
        return;
    }

    injectSyncfusionOfficeKitChromeStyles();

    var containerSettings = editorContainer.documentEditorSettings || {};
    containerSettings.allowDragAndDrop = true;
    // In bang anh tung trang: x6.25 = 600 dpi, khop do phan giai may in (khong phai phong/thu anh -> chu khong nhoe).
    containerSettings.printDevicePixelRatio = 6.25;
    containerSettings.showHeaderAndFooter = true;
    containerSettings.enableRuler = true;
    containerSettings.showRuler = true;
    editorContainer.documentEditorSettings = containerSettings;
    editorContainer.enableRuler = true;
    editorContainer.showPropertiesPane = false;

    var editor = editorContainer.documentEditor;
    if (!editor) {
        return;
    }
    editor.syncfusionOfficeKitContainer = editorContainer;

    var editorSettings = {
        isReadOnly: false,
        enableEditor: true,
        enableSelection: true,
        enableEditorHistory: true,
        enableSfdtExport: true,
        enableWordExport: true,
        enableTextExport: true,
        enableSearch: true,
        enableOptionsPane: true,
        enableContextMenu: true,
        enableImageResizer: true,
        enableRuler: true,
        enablePageSetupDialog: true,
        enableParagraphDialog: true,
        enableTableDialog: true,
        enableBookmarkDialog: true,
        enableHyperlinkDialog: true,
        enableTableOfContentsDialog: true,
        enableListDialog: true,
        enableStyleDialog: true,
        enableFontDialog: true,
        acceptTab: true,
    };

    Object.keys(editorSettings).forEach(function (key) {
        editor[key] = editorSettings[key];
    });

    if (editor.documentEditorSettings) {
        editor.documentEditorSettings.printDevicePixelRatio = 6.25;
        editor.documentEditorSettings.allowDragAndDrop = true;
        editor.documentEditorSettings.showHeaderAndFooter = true;
        editor.documentEditorSettings.enableRuler = true;
        editor.documentEditorSettings.showRuler = true;
    }
    editor.enableRuler = true;

    if (typeof editor.setDefaultCharacterFormat === "function") {
        editor.setDefaultCharacterFormat(cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultCharacterFormat));
    }

    if (typeof editor.dataBind === "function") {
        editor.dataBind();
    }

    if (typeof editorContainer.dataBind === "function") {
        editorContainer.dataBind();
    }

    if (typeof window.configureDocumentExportQr === "function") {
        window.configureDocumentExportQr(editor);
    }

    installSyncfusionOfficeKitRulers(editorContainer);
    scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
}

function installSyncfusionOfficeKitChrome(editorContainer) {
    var titlebar = document.getElementById("documenteditor_titlebar");
    var editorHost = document.getElementById("container");
    var editorBody = findSyncfusionOfficeKitEditorBody(editorHost) || document.getElementById("documenteditor_container_body");
    var mountBefore = editorBody || editorHost;

    if ((!titlebar && !mountBefore) || document.getElementById("syncfusion-office-kit-ribbon")) {
        return;
    }

    injectSyncfusionOfficeKitChromeStyles();

    var ribbon = document.createElement("div");
    ribbon.id = "syncfusion-office-kit-ribbon";
    ribbon.className = "syncfusion-office-kit-ribbon wk-ribbon";
    if (isWordKitRibbonCollapsed()) {
        ribbon.classList.add("wk-collapsed");
    }
    ribbon.innerHTML = buildWordKitRibbonHtml();

    if (!placeSyncfusionOfficeKitRibbon(ribbon, titlebar, mountBefore)) {
        return;
    }

    document.body.classList.add("syncfusion-office-kit-enabled");
    wireSyncfusionOfficeKitChrome(ribbon, editorContainer);
    watchWordKitRibbonWidth(ribbon);
    pinWordKitHostScroll(editorContainer);
    installSyncfusionOfficeKitRulers(editorContainer);
    scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
    scheduleWordKitStateUpdate(editorContainer);
}

// Giong Word: ribbon hep thi thu gon dan (bo nhan nut nho, bot o Kieu) thay vi de tran phai.
// Theo do rong that cua ribbon (cot soan nam canh menu trai), khong theo do rong cua so.
function watchWordKitRibbonWidth(ribbon) {
    var apply = function () {
        var width = ribbon.clientWidth;
        if (!width) {
            return;
        }
        ribbon.classList.toggle("wk-w-lg", width < 1260);
        ribbon.classList.toggle("wk-w-md", width < 1100);
        ribbon.classList.toggle("wk-w-sm", width < 960);
    };
    apply();
    if (typeof ResizeObserver === "function") {
        new ResizeObserver(apply).observe(ribbon);
    } else {
        window.addEventListener("resize", apply);
    }
}

// Cac trang dat #container overflow:hidden. Khi Syncfusion focus o nhap an cua no, trinh duyet van
// cuon khung nay de "lo" o do ra -> ribbon bi day len khuat (trang Tao dieu khoan lech 800+px, nguoi
// dung khong thay thanh cong cu nao). Khung nay khong bao gio can cuon nen giu ve 0.
function pinWordKitHostScroll(editorContainer) {
    var host = editorContainer && editorContainer.element ? editorContainer.element : document.getElementById("container");
    if (!host || host.wordKitScrollPinned) {
        return;
    }
    host.wordKitScrollPinned = true;
    var reset = function () {
        if (host.scrollTop || host.scrollLeft) {
            host.scrollTop = 0;
            host.scrollLeft = 0;
        }
    };
    host.addEventListener("scroll", reset);
    reset();
}

// ---------------------------------------------------------------------------
// Ribbon kieu Word 365: tab tieng Viet, nhom + nhan nhom, nut lon/nho, menu tha.
// Bieu tuong ve SVG net manh (cung tinh than bo Fluent cua Office) thay cho chu tam
// "x2 / Or / Sz / TC". Lop trong SVG: a = mau nhan xanh Word, f = to dac, t = chu,
// ta = chu mau nhan, d = do (xoa), g = xanh la (chap nhan), bg = nen trang, dash = net dut.
// ---------------------------------------------------------------------------
var wordKitIcons = {
    save: '<path d="M4 3h9.5L17 6.5V17H3V3z"/><path d="M6.5 3v4h6V3"/><path d="M6 17v-5h8v5"/>',
    undo: '<path d="M7.5 5L4 8.5 7.5 12"/><path d="M4 8.5h8a4 4 0 010 8H9"/>',
    redo: '<path d="M12.5 5L16 8.5 12.5 12"/><path d="M16 8.5H8a4 4 0 000 8h3"/>',
    paste: '<path d="M6 4H4v13h4"/><path d="M12 4h2v3"/><rect x="6.5" y="2.5" width="5" height="3" rx=".8"/><rect class="a bg" x="9" y="8.5" width="8" height="9" rx=".8"/><path class="a" d="M11 11.5h4M11 14h4"/>',
    cut: '<circle cx="6" cy="14.5" r="2.5"/><circle cx="14" cy="14.5" r="2.5"/><path d="M7.4 12.4L14 3M12.6 12.4L6 3"/>',
    copy: '<rect x="7" y="6" width="9.5" height="11.5" rx="1"/><path d="M4 13.5V3.5h9"/>',
    painter: '<rect x="3.5" y="2.5" width="11" height="5" rx="1"/><path d="M14.5 5H17v4.5h-7V12"/><rect class="a" x="8.5" y="12" width="3" height="6" rx=".8"/>',
    grow: '<text class="t" x="1" y="16" font-size="14">A</text><path class="a" d="M13.5 8.5L16 5.5l2.5 3"/>',
    shrink: '<text class="t" x="2" y="16" font-size="10.5">A</text><path class="a" d="M12.5 5.5L15 8.5l2.5-3"/>',
    changeCase: '<text class="t" x="1" y="15" font-size="11.5">Aa</text>',
    clearFormat: '<text class="t" x="1.5" y="14" font-size="12.5">A</text><path class="d" d="M10 17.5l5.5-5.5 3 3-2.5 2.5H10z"/>',
    bullets: '<circle class="f" cx="4" cy="5" r="1.4"/><circle class="f" cx="4" cy="10" r="1.4"/><circle class="f" cx="4" cy="15" r="1.4"/><path d="M8 5h9.5M8 10h9.5M8 15h9.5"/>',
    numbering: '<text class="t" x="1.5" y="7.5" font-size="6.5">1</text><text class="t" x="1.5" y="12.5" font-size="6.5">2</text><text class="t" x="1.5" y="17.5" font-size="6.5">3</text><path d="M8 5h9.5M8 10h9.5M8 15h9.5"/>',
    outdent: '<path d="M3 3.5h14M9 8h8M9 12h8M3 16.5h14"/><path class="a" d="M6 7.5L3.5 10 6 12.5"/>',
    indent: '<path d="M3 3.5h14M9 8h8M9 12h8M3 16.5h14"/><path class="a" d="M3.5 7.5L6 10l-2.5 2.5"/>',
    alignLeft: '<path d="M3 4h14M3 8h9M3 12h14M3 16h9"/>',
    alignCenter: '<path d="M3 4h14M5.5 8h9M3 12h14M5.5 16h9"/>',
    alignRight: '<path d="M3 4h14M8 8h9M3 12h14M8 16h9"/>',
    justify: '<path d="M3 4h14M3 8h14M3 12h14M3 16h14"/>',
    lineSpacing: '<path d="M9 4.5h8.5M9 10h8.5M9 15.5h8.5"/><path class="a" d="M4.5 3v14M2.5 5l2-2 2 2M2.5 15l2 2 2-2"/>',
    find: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2L17 17"/>',
    replace: '<path d="M3.5 7.5h10M11 5l2.5 2.5L11 10"/><path class="a" d="M16.5 12.5h-10M9 10l-2.5 2.5L9 15"/>',
    select: '<path d="M6 3l9 6.5-4 1 2.5 5-2 1-2.5-5-3 3z"/>',
    blankPage: '<path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5"/>',
    pageBreak: '<path d="M5 2.5h10v5.5H5zM5 12h10v5.5H5z"/><path class="a" d="M2 10h2.5M7 10h2M11 10h2M15.5 10H18"/>',
    table: '<rect x="2.5" y="3.5" width="15" height="13" rx="1"/><path d="M2.5 7.8h15M2.5 12.2h15M7.5 3.5v13M12.5 3.5v13"/>',
    picture: '<rect x="2.5" y="3.5" width="15" height="13" rx="1"/><circle class="a" cx="7" cy="8" r="1.5"/><path class="a" d="M2.5 15l4.5-4.5 3.5 3.5 2-2 5 5"/>',
    link: '<path d="M8.3 11.7l3.4-3.4"/><path d="M10.3 6.3l1.4-1.4a3 3 0 014.3 4.3l-1.4 1.4M9.7 13.7l-1.4 1.4a3 3 0 01-4.3-4.3l1.4-1.4"/>',
    bookmark: '<path class="a" d="M5.5 2.5h9v15l-4.5-3.5-4.5 3.5z"/>',
    comment: '<path d="M3 4h14v9.5H9.5L5.5 17v-3.5H3z"/><path class="a" d="M10 6.5v5M7.5 9h5"/>',
    header: '<rect x="4" y="2.5" width="12" height="15" rx="1"/><path class="a" d="M6.5 5.5h7M6.5 7.5h7"/>',
    footer: '<rect x="4" y="2.5" width="12" height="15" rx="1"/><path class="a" d="M6.5 12.5h7M6.5 14.5h7"/>',
    pageNumber: '<rect x="4" y="2.5" width="12" height="15" rx="1"/><text class="t ta" x="7" y="15" font-size="8">#</text>',
    date: '<rect x="3" y="4" width="14" height="13" rx="1"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/><path class="a" d="M6.5 11h2M11.5 11h2M6.5 14h2"/>',
    symbol: '<text class="t" x="3.5" y="16" font-size="14.5">&#937;</text>',
    margins: '<rect x="3.5" y="2.5" width="13" height="15"/><rect class="a dash" x="6" y="5" width="8" height="10"/>',
    orientation: '<rect x="3" y="2.5" width="8" height="11" rx=".5"/><rect class="a bg" x="7.5" y="9" width="10.5" height="8" rx=".5"/>',
    pageSize: '<rect x="3" y="2.5" width="10" height="15" rx=".5"/><path class="a" d="M16 3v14M14.8 4.5L16 3l1.2 1.5M14.8 15.5L16 17l1.2-1.5"/>',
    breaks: '<path d="M4 8V2.5h12V8M4 12v5.5h12V12"/><path class="a dash" d="M2 10h16"/>',
    toc: '<path d="M3 4h14M5 8h7M5 12h7M3 16h14"/><path class="a" d="M14 8h.5M16 8h.5M14 12h.5M16 12h.5"/>',
    footnote: '<text class="t" x="1" y="14" font-size="11">ab</text><text class="t ta" x="14" y="8" font-size="7">1</text><path class="a" d="M2 17.5h16"/>',
    endnote: '<text class="t" x="1" y="11" font-size="11">ab</text><text class="t ta" x="14" y="6" font-size="7">i</text><path d="M2 14.5h16"/><path class="a" d="M2 17.5h9"/>',
    trackChanges: '<path d="M11.5 2.5H4.5v15h5"/><path d="M11.5 2.5l4 4V9"/><path class="a" d="M11 17.5l.8-2.8 5-5 2 2-5 5z"/>',
    revisions: '<rect x="2.5" y="3" width="15" height="14" rx="1"/><path d="M12 3v14"/><path class="a" d="M14 6.5h2M14 9.5h2M14 12.5h2"/>',
    acceptAll: '<rect x="3" y="3" width="11" height="14" rx="1"/><path class="g" d="M10 12.5l2.5 2.5 5-5"/>',
    rejectAll: '<rect x="3" y="3" width="11" height="14" rx="1"/><path class="d" d="M12 10l5 5M17 10l-5 5"/>',
    ruler: '<rect x="2" y="7" width="16" height="6" rx="1"/><path d="M5 7v3M8 7v2M11 7v3M14 7v2"/>',
    navPane: '<rect x="2.5" y="3.5" width="15" height="13" rx="1"/><path d="M8 3.5v13"/><path class="a" d="M4 7h2.5M4 10h2.5M4 13h2.5"/>',
    printLayout: '<rect x="5" y="2.5" width="10" height="15" rx=".5"/><path d="M7.5 6h5M7.5 9h5M7.5 12h5"/>',
    webLayout: '<rect x="2.5" y="3.5" width="15" height="13" rx="1"/><path d="M2.5 6.5h15"/><circle class="a" cx="10" cy="11.5" r="3"/><path class="a" d="M7 11.5h6"/>',
    zoom: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2L17 17"/><path class="a" d="M6.5 8.5h4M8.5 6.5v4"/>',
    zoom100: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2L17 17"/><text class="t ta" x="6.4" y="11" font-size="7">1</text>',
    onePage: '<rect x="5.5" y="2.5" width="9" height="15" rx=".5"/><path class="a" d="M3 5v10M17 5v10"/>',
    pageWidth: '<rect x="5" y="2.5" width="10" height="15" rx=".5"/><path class="a" d="M2 10h16M4 8l-2 2 2 2M16 8l2 2-2 2"/>',
    newDoc: '<path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5"/><path class="a" d="M10 9v6M7 12h6"/>',
    open: '<path d="M2.5 5.5h5l1.5 2h8.5v9.5h-15z"/>',
    download: '<path class="a" d="M10 3v9.5M6 8.5l4 4 4-4"/><path d="M3.5 13v3.5h13V13"/>',
    print: '<path d="M5.5 7.5v-5h9v5"/><rect x="2.5" y="7.5" width="15" height="7" rx="1"/><path class="bg" d="M5.5 12h9v5.5h-9z"/>',
    launcher: '<path d="M4 4h5M4 4v5M7 7l8.5 8.5M15.5 10.5v5h-5"/>',
    chevronDown: '<path d="M5.5 8l4.5 4.5L14.5 8"/>',
    chevronUp: '<path d="M5.5 12.5L10 8l4.5 4.5"/>',
    textOnly: '<text class="t" x="3" y="15.5" font-size="13">A</text>',
    rowAbove: '<rect x="2.5" y="9.5" width="15" height="8" rx=".5"/><path d="M2.5 13.5h15M7.5 9.5v8M12.5 9.5v8"/><path class="a" d="M10 2v6M7 5h6"/>',
    rowBelow: '<rect x="2.5" y="2.5" width="15" height="8" rx=".5"/><path d="M2.5 6.5h15M7.5 2.5v8M12.5 2.5v8"/><path class="a" d="M10 12v6M7 15h6"/>',
    colLeft: '<rect x="9.5" y="2.5" width="8" height="15" rx=".5"/><path d="M13.5 2.5v15M9.5 7.5h8M9.5 12.5h8"/><path class="a" d="M2 10h6M5 7v6"/>',
    colRight: '<rect x="2.5" y="2.5" width="8" height="15" rx=".5"/><path d="M6.5 2.5v15M2.5 7.5h8M2.5 12.5h8"/><path class="a" d="M12 10h6M15 7v6"/>',
    tableDelete: '<rect x="2.5" y="3.5" width="12" height="11" rx=".5"/><path d="M2.5 7.2h12M2.5 10.8h12M6.5 3.5v11M10.5 3.5v11"/><path class="d" d="M12.5 12.5l5 5M17.5 12.5l-5 5"/>',
    merge: '<rect x="2.5" y="4.5" width="15" height="11" rx=".5"/><path class="a" d="M4.5 10h3.5M15.5 10H12M6.5 8l2 2-2 2M13.5 8l-2 2 2 2"/>',
    autofit: '<rect x="2.5" y="4.5" width="15" height="11" rx=".5"/><path d="M10 4.5v11"/><path class="a" d="M4 10h4.5M5.5 8.5L4 10l1.5 1.5M16 10h-4.5M14.5 8.5L16 10l-1.5 1.5"/>',
    distRows: '<rect x="2.5" y="2.5" width="11" height="15" rx=".5"/><path d="M2.5 7.5h11M2.5 12.5h11"/><path class="a" d="M16.5 3.5v13M15 5l1.5-1.5L18 5M15 15l1.5 1.5L18 15"/>',
    distCols: '<rect x="2.5" y="2.5" width="15" height="11" rx=".5"/><path d="M7.5 2.5v11M12.5 2.5v11"/><path class="a" d="M3.5 16.5h13M5 15l-1.5 1.5L5 18M15 15l1.5 1.5L15 18"/>',
    tableProps: '<rect x="2.5" y="3.5" width="12" height="11" rx=".5"/><path d="M2.5 7.2h12M2.5 10.8h12M6.5 3.5v11M10.5 3.5v11"/><circle class="a bg" cx="15" cy="15" r="2.6"/>',
    borders: '<rect x="3" y="3" width="14" height="14"/><path d="M10 3v14M3 10h14"/>',
    shading: '<path d="M4.5 9.5l5-5 5.5 5.5-5 5z"/><path d="M9.5 4.5l-2-2"/><path class="a" d="M16 12c.9 1.3 1.6 2.2 1.6 3a1.6 1.6 0 01-3.2 0c0-.8.7-1.7 1.6-3z"/>',
    valignTop: '<rect x="3" y="3" width="14" height="14" rx=".5"/><path class="a" d="M6 6.5h8M6 9h8"/>',
    valignCenter: '<rect x="3" y="3" width="14" height="14" rx=".5"/><path class="a" d="M6 8.8h8M6 11.3h8"/>',
    valignBottom: '<rect x="3" y="3" width="14" height="14" rx=".5"/><path class="a" d="M6 11h8M6 13.5h8"/>',
    checkbox: '<rect x="3.5" y="3.5" width="13" height="13" rx="1.5"/><path class="a" d="M6.5 10.2l2.4 2.4 4.6-5"/>',
    cellMargin: '<rect x="2.5" y="2.5" width="15" height="15" rx=".5"/><rect class="a dash" x="5.5" y="5.5" width="9" height="9"/>',
};

// Mau phong chu: hang mau chuan cua Office + vai mau dam/xam hay dung trong van ban.
var wordKitFontColors = [
    "#000000", "#404040", "#595959", "#7F7F7F", "#A6A6A6", "#1F3864", "#2F5496", "#C00000", "#833C0B", "#375623",
    "#C00000", "#FF0000", "#FFC000", "#FFFF00", "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0",
];
// Mau to sang: dung ten mau cua Syncfusion (highlightColor la kieu liet ke, khong nhan ma hex).
var wordKitHighlightColors = [
    ["Yellow", "#FFFF00", "Vàng"], ["BrightGreen", "#00FF00", "Xanh lá tươi"], ["Turquoise", "#00FFFF", "Xanh ngọc"],
    ["Pink", "#FF00FF", "Hồng"], ["Blue", "#0000FF", "Xanh dương"], ["Red", "#FF0000", "Đỏ"],
    ["DarkBlue", "#000080", "Xanh đậm"], ["Teal", "#008080", "Xanh mòng két"], ["Green", "#008000", "Xanh lá"],
    ["Violet", "#800080", "Tím"], ["DarkRed", "#800000", "Đỏ sẫm"], ["DarkYellow", "#808000", "Vàng sẫm"],
    ["Gray50", "#808080", "Xám đậm"], ["Gray25", "#C0C0C0", "Xám nhạt"], ["Black", "#000000", "Đen"],
];
var wordKitShadingColors = [
    "#FFFFFF", "#F2F2F2", "#D9D9D9", "#BFBFBF", "#DEEAF6", "#BDD7EE", "#E2EFD9", "#C5E0B3", "#FFF2CC", "#FBE4D5",
    "#FFFF00", "#FFC000", "#92D050", "#00B0F0", "#9DC3E6", "#F4B183", "#FF9999", "#D9C3E9", "#808080", "#000000",
];
var wordKitSymbols = "§№©®™°±×÷≤≥≠≈∞…–—«»“”‘’•✓✗→←↑↓½¼¾€£¥₫¶†‰µΩαβπΣ√²³¹".split("");

function wkEscape(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wkIcon(name, large) {
    return '<svg class="wk-ico' + (large ? " wk-ico-lg" : "") + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' + (wordKitIcons[name] || "") + "</svg>";
}

function wkCommandAttrs(command, options) {
    options = options || {};
    var attrs = "";
    if (options.menu) {
        attrs += ' data-wk-menu-toggle="' + options.menu + '" aria-haspopup="true"';
    } else if (command) {
        attrs += ' data-office-kit-command="' + command + '"';
    }
    if (options.arg !== undefined) {
        attrs += ' data-office-kit-arg="' + wkEscape(options.arg) + '"';
    }
    if (options.state) {
        attrs += ' data-wk-state="' + options.state + '" aria-pressed="false"';
    }
    if (options.title) {
        attrs += ' title="' + wkEscape(options.title) + '"';
    }
    return attrs;
}

function wkCaret() {
    return '<span class="wk-caret-ico">' + wkIcon("chevronDown") + "</span>";
}

// Nut lon: bieu tuong 32px tren, nhan duoi (nhu "Dán", "Bảng", "Lề" cua Word).
function wkLarge(command, icon, label, options) {
    options = options || {};
    options.title = options.title || label;
    return '<button type="button" class="wk-btn wk-btn-l"' + wkCommandAttrs(command, options) + ">"
        + wkIcon(icon, true) + '<span class="wk-label">' + label + (options.menu ? wkCaret() : "") + "</span></button>";
}

// Nut nho co chu: bieu tuong 16px + nhan ngang (cot "Cắt / Sao chép / Sao định dạng").
function wkSmall(command, icon, label, options) {
    options = options || {};
    options.title = options.title || label;
    return '<button type="button" class="wk-btn wk-btn-s"' + wkCommandAttrs(command, options) + ">"
        + wkIcon(icon) + "<span>" + label + "</span>" + (options.menu ? wkCaret() : "") + "</button>";
}

// Nut chi co bieu tuong (B, I, U, can le...). content la ten icon hoac HTML san.
function wkIconButton(command, content, title, options) {
    options = options || {};
    options.title = title;
    var inner = wordKitIcons[content] ? wkIcon(content) : content;
    return '<button type="button" class="wk-btn wk-btn-i"' + wkCommandAttrs(command, options) + ">" + inner + (options.menu ? wkCaret() : "") + "</button>";
}

// Nut tach doi: bam phan trai la ap dung ngay, bam mui ten la mo menu (mau chu, to sang, danh sach).
function wkSplit(command, content, title, menu, options) {
    options = options || {};
    var inner = wordKitIcons[content] ? wkIcon(content) : content;
    return '<span class="wk-split">'
        + '<button type="button" class="wk-btn wk-btn-i"' + wkCommandAttrs(command, { title: title, arg: options.arg, state: options.state }) + ">" + inner + "</button>"
        + '<button type="button" class="wk-btn wk-caret"' + wkCommandAttrs("", { menu: menu, title: title }) + ">" + wkIcon("chevronDown") + "</button>"
        + "</span>";
}

function wkGroup(title, body, launcherCommand, launcherTitle, extraClass) {
    return '<div class="wk-group' + (extraClass ? " " + extraClass : "") + '">'
        + '<div class="wk-group-body">' + body + "</div>"
        + '<div class="wk-group-label">' + title + "</div>"
        + (launcherCommand ? '<button type="button" class="wk-launcher" data-office-kit-command="' + launcherCommand + '" title="' + wkEscape(launcherTitle || title) + '">' + wkIcon("launcher") + "</button>" : "")
        + "</div>";
}

function wkRows(rows) {
    return '<div class="wk-rows">' + rows.map(function (row) {
        return '<div class="wk-row">' + row.join("") + "</div>";
    }).join("") + "</div>";
}

function wkStack(buttons) {
    return '<div class="wk-stack">' + buttons.join("") + "</div>";
}

function wkSep() {
    return '<span class="wk-sep" aria-hidden="true"></span>';
}

function wkTab(name, label, active) {
    return '<button type="button" class="wk-tab' + (active ? " wk-tab-active" : "") + '" data-office-kit-tab="' + name + '" role="tab" aria-selected="' + (active ? "true" : "false") + '">' + label + "</button>";
}

function wkPanel(name, groups, active) {
    return '<section class="wk-panel' + (active ? " wk-panel-active" : "") + '" data-office-kit-panel="' + name + '" role="tabpanel">' + groups.join("") + "</section>";
}

function wkNumberField(label, changeName, value, min, max, step, unit) {
    return '<label class="wk-field"><span>' + label + '</span><input type="number" class="wk-number" value="' + value + '" min="' + min + '" max="' + max + '" step="' + step + '" data-office-kit-change="' + changeName + '"><small>' + unit + "</small></label>";
}

function wkMenu(name, items, extraClass) {
    return '<div class="wk-menu' + (extraClass ? " " + extraClass : "") + '" data-wk-menu="' + name + '" role="menu">' + items.join("") + "</div>";
}

function wkMenuItem(command, arg, icon, label, hint, options) {
    options = options || {};
    return '<button type="button" class="wk-menu-item" role="menuitem"' + wkCommandAttrs(command, { arg: arg === null ? undefined : arg, state: options.state }) + ">"
        + (icon ? wkIcon(icon) : '<span class="wk-menu-blank"></span>')
        + '<span class="wk-menu-text">' + label + (hint ? "<small>" + hint + "</small>" : "") + "</span></button>";
}

function wkMenuSep() {
    return '<div class="wk-menu-sep" role="separator"></div>';
}

function wkMenuHeading(text) {
    return '<div class="wk-menu-heading">' + text + "</div>";
}

function wkColorGrid(command, colors) {
    return '<div class="wk-colors">' + colors.map(function (color) {
        var value = Array.isArray(color) ? color[0] : color;
        var swatch = Array.isArray(color) ? color[1] : color;
        var title = Array.isArray(color) ? color[2] : color;
        return '<button type="button" class="wk-swatch" data-office-kit-command="' + command + '" data-office-kit-arg="' + value + '" title="' + title + '" style="background:' + swatch + '"></button>';
    }).join("") + "</div>";
}

function buildWordKitRibbonHtml() {
    var fontColorGlyph = '<span class="wk-glyph wk-glyph-color">A<span class="wk-color-bar" data-wk-color-bar="font" style="background:#C00000"></span></span>';
    var highlightGlyph = '<span class="wk-glyph wk-glyph-color wk-glyph-small">ab<span class="wk-color-bar" data-wk-color-bar="highlight" style="background:#FFFF00"></span></span>';
    var shadingGlyph = '<span class="wk-glyph-color">' + wkIcon("shading", true) + '<span class="wk-color-bar wk-color-bar-wide" data-wk-color-bar="shading" style="background:#D9D9D9"></span></span>';

    var home = wkPanel("home", [
        wkGroup("Bộ nhớ tạm", [
            '<div class="wk-lsplit">',
            '<button type="button" class="wk-btn wk-lsplit-top" data-office-kit-command="paste" title="Dán (Ctrl+V)">' + wkIcon("paste", true) + "</button>",
            '<button type="button" class="wk-btn wk-lsplit-bottom" data-wk-menu-toggle="paste" aria-haspopup="true" title="Tùy chọn dán"><span class="wk-label">Dán' + wkCaret() + "</span></button>",
            "</div>",
            wkStack([
                wkSmall("cut", "cut", "Cắt", { title: "Cắt (Ctrl+X)" }),
                wkSmall("copy", "copy", "Sao chép", { title: "Sao chép (Ctrl+C)" }),
                wkSmall("format-painter", "painter", "Sao định dạng", { state: "format-painter", title: "Sao định dạng: bôi đen chữ mẫu, bấm nút này rồi bôi đen chỗ cần áp dụng (Esc để hủy)" }),
            ]),
        ].join(""), null, null, "wk-group-clipboard"),
        wkGroup("Phông chữ", wkRows([
            [
                officeKitFontFamilyControl(),
                officeKitFontSizeControl(),
                wkIconButton("grow-font", "grow", "Tăng cỡ phông (Ctrl+])"),
                wkIconButton("shrink-font", "shrink", "Giảm cỡ phông (Ctrl+[)"),
                wkSep(),
                wkIconButton("", "changeCase", "Đổi chữ hoa/thường", { menu: "change-case" }),
                wkIconButton("clear-formatting", "clearFormat", "Xóa mọi định dạng"),
            ],
            [
                wkIconButton("bold", '<span class="wk-glyph" style="font-weight:700">B</span>', "Đậm (Ctrl+B)", { state: "bold" }),
                wkIconButton("italic", '<span class="wk-glyph wk-glyph-serif" style="font-style:italic">I</span>', "Nghiêng (Ctrl+I)", { state: "italic" }),
                wkIconButton("underline", '<span class="wk-glyph" style="text-decoration:underline">U</span>', "Gạch dưới (Ctrl+U)", { state: "underline" }),
                wkIconButton("strikethrough", '<span class="wk-glyph wk-glyph-small" style="text-decoration:line-through">ab</span>', "Gạch ngang chữ", { state: "strike" }),
                wkIconButton("subscript", '<span class="wk-glyph wk-glyph-small">x<sub>2</sub></span>', "Chỉ số dưới (Ctrl+=)", { state: "sub" }),
                wkIconButton("superscript", '<span class="wk-glyph wk-glyph-small">x<sup>2</sup></span>', "Chỉ số trên (Ctrl+Shift++)", { state: "sup" }),
                wkSep(),
                wkSplit("highlight-apply", highlightGlyph, "Màu tô sáng văn bản", "highlight"),
                wkSplit("font-color-apply", fontColorGlyph, "Màu phông chữ", "font-color"),
            ],
        ]), "font-dialog", "Phông chữ (Ctrl+D)", "wk-group-font"),
        wkGroup("Đoạn văn", wkRows([
            [
                wkSplit("bullets", "bullets", "Dấu đầu dòng", "bullets", { arg: "dot" }),
                wkSplit("numbering", "numbering", "Đánh số", "numbering", { arg: "1." }),
                wkSep(),
                wkIconButton("decrease-indent", "outdent", "Giảm thụt lề"),
                wkIconButton("increase-indent", "indent", "Tăng thụt lề"),
            ],
            [
                wkIconButton("align-left", "alignLeft", "Căn trái (Ctrl+L)", { state: "align-left" }),
                wkIconButton("align-center", "alignCenter", "Căn giữa (Ctrl+E)", { state: "align-center" }),
                wkIconButton("align-right", "alignRight", "Căn phải (Ctrl+R)", { state: "align-right" }),
                wkIconButton("justify", "justify", "Căn đều hai bên (Ctrl+J)", { state: "justify" }),
                wkSep(),
                wkIconButton("", "lineSpacing", "Giãn cách dòng và đoạn", { menu: "line-spacing" }),
            ],
        ]), "paragraph-settings", "Cài đặt đoạn văn"),
        wkGroup("Kiểu", [
            '<div class="wk-styles">',
            '<button type="button" class="wk-style" data-office-kit-command="style-normal" data-wk-state="style-normal" aria-pressed="false" title="Bình thường"><span style="font-size:14px">AaBbCc</span><small>Bình thường</small></button>',
            '<button type="button" class="wk-style" data-office-kit-command="style-heading1" data-wk-state="style-heading1" aria-pressed="false" title="Đề mục 1"><span style="font-size:16px;font-weight:600">AaBbC</span><small>Đề mục 1</small></button>',
            '<button type="button" class="wk-style" data-office-kit-command="style-heading2" data-wk-state="style-heading2" aria-pressed="false" title="Đề mục 2"><span style="font-size:14px;font-weight:600">AaBbCc</span><small>Đề mục 2</small></button>',
            '<button type="button" class="wk-style" data-office-kit-command="style-title" data-wk-state="style-title" aria-pressed="false" title="Tiêu đề"><span style="font-size:18px;font-weight:700">AaB</span><small>Tiêu đề</small></button>',
            "</div>",
        ].join(""), "styles-dialog", "Quản lý kiểu"),
        wkGroup("Chỉnh sửa", wkStack([
            wkSmall("find", "find", "Tìm", { title: "Tìm (Ctrl+F)" }),
            wkSmall("replace", "replace", "Thay thế", { title: "Thay thế (Ctrl+H)" }),
            wkSmall("select-all", "select", "Chọn tất cả", { title: "Chọn tất cả (Ctrl+A)" }),
        ]), null, null, "wk-group-editing"),
    ], true);

    var insert = wkPanel("insert", [
        wkGroup("Trang", wkLarge("insert-blank-page", "blankPage", "Trang trống") + wkLarge("insert-page-break", "pageBreak", "Ngắt trang", { title: "Ngắt trang (Ctrl+Enter)" })),
        wkGroup("Bảng", wkLarge("", "table", "Bảng", { menu: "table-insert" })),
        wkGroup("Minh họa", wkLarge("insert-image", "picture", "Ảnh", { title: "Chèn ảnh từ máy" })),
        wkGroup("Liên kết", wkLarge("insert-link", "link", "Liên kết", { title: "Chèn liên kết (Ctrl+K)" }) + wkLarge("insert-bookmark", "bookmark", "Dấu trang")),
        wkGroup("Chú thích", wkLarge("insert-comment", "comment", "Chú thích")),
        wkGroup("Đầu trang & Chân trang", wkLarge("insert-header", "header", "Đầu trang") + wkLarge("insert-footer", "footer", "Chân trang") + wkLarge("insert-page-number", "pageNumber", "Số trang")),
        wkGroup("Văn bản", wkLarge("insert-date-time", "date", "Ngày & giờ", { title: "Chèn ngày hôm nay" })),
        wkGroup("Ký hiệu", wkLarge("", "symbol", "Ký hiệu", { menu: "symbol" })),
        wkGroup("Biểu mẫu", wkLarge("insert-checkbox", "checkbox", "Ô đánh dấu", { title: "Chèn ô đánh dấu ☐ (bấm vào ô trong văn bản để đánh dấu)" })),
    ]);

    var layout = wkPanel("layout", [
        wkGroup("Thiết lập trang", [
            wkLarge("", "margins", "Lề", { menu: "margins" }),
            wkLarge("", "orientation", "Hướng", { menu: "orientation" }),
            wkLarge("", "pageSize", "Kích cỡ", { menu: "page-size" }),
            wkLarge("", "breaks", "Ngắt", { menu: "breaks" }),
        ].join(""), "page-setup", "Thiết lập trang"),
        wkGroup("Lề trang", [
            '<div class="wk-fields">',
            wkNumberField("Trên", "layout-margin-top", 2, 0, 55, 0.1, "cm"),
            wkNumberField("Dưới", "layout-margin-bottom", 2, 0, 55, 0.1, "cm"),
            "</div>",
            '<div class="wk-fields">',
            wkNumberField("Trái", "layout-margin-left", 3, 0, 55, 0.1, "cm"),
            wkNumberField("Phải", "layout-margin-right", 2, 0, 55, 0.1, "cm"),
            "</div>",
        ].join("")),
        wkGroup("Đoạn văn", [
            '<div class="wk-fields"><span class="wk-fields-title">Thụt lề</span>',
            wkNumberField("Trái", "layout-left-indent", 0, -10, 10, 0.1, "cm"),
            wkNumberField("Phải", "layout-right-indent", 0, -10, 10, 0.1, "cm"),
            wkNumberField("Dòng đầu", "layout-first-line-indent", 0, -10, 10, 0.1, "cm"),
            "</div>",
            '<div class="wk-fields"><span class="wk-fields-title">Giãn cách</span>',
            wkNumberField("Trước", "layout-before-spacing", 0, 0, 120, 1, "pt"),
            wkNumberField("Sau", "layout-after-spacing", 0, 0, 120, 1, "pt"),
            wkNumberField("Dòng", "layout-line-spacing", 1.08, 0.5, 5, 0.05, "lần"),
            "</div>",
            '<div class="wk-fields"><span class="wk-fields-title">Tab</span>',
            wkNumberField("Bước", "layout-default-tab-width", 1.27, 0.1, 10, 0.1, "cm"),
            "</div>",
        ].join(""), "paragraph-settings", "Cài đặt đoạn văn"),
    ]);

    var references = wkPanel("references", [
        wkGroup("Mục lục", wkLarge("insert-toc", "toc", "Mục lục")),
        wkGroup("Cước chú", wkLarge("insert-footnote", "footnote", "Chèn cước chú") + wkLarge("insert-endnote", "endnote", "Chèn chú thích cuối")),
        wkGroup("Dấu trang", wkLarge("insert-bookmark", "bookmark", "Dấu trang")),
    ]);

    var review = wkPanel("review", [
        wkGroup("Tìm kiếm", wkLarge("find", "find", "Tìm") + wkLarge("replace", "replace", "Thay thế")),
        wkGroup("Chú thích", wkLarge("insert-comment", "comment", "Chú thích mới") + wkLarge("show-comments", "revisions", "Hiện chú thích", { state: "show-comments" })),
        wkGroup("Theo dõi", wkLarge("track-changes", "trackChanges", "Theo dõi thay đổi", { state: "track-changes" }) + wkLarge("show-revisions", "revisions", "Ngăn sửa đổi", { state: "show-revisions" })),
        wkGroup("Thay đổi", wkLarge("accept-all", "acceptAll", "Chấp nhận tất cả") + wkLarge("reject-all", "rejectAll", "Từ chối tất cả")),
    ]);

    var view = wkPanel("view", [
        wkGroup("Dạng xem", wkLarge("layout-pages", "printLayout", "Bố cục in", { state: "layout-pages" }) + wkLarge("layout-web", "webLayout", "Bố cục web", { state: "layout-web" })),
        wkGroup("Hiển thị", wkLarge("toggle-ruler", "ruler", "Thước kẻ", { state: "ruler" }) + wkLarge("find", "navPane", "Ngăn dẫn hướng")),
        wkGroup("Thu phóng", [
            wkLarge("", "zoom", "Thu phóng", { menu: "zoom" }),
            wkLarge("zoom", "zoom100", "100%", { arg: "100" }),
            wkStack([
                wkSmall("fit-page", "onePage", "Một trang"),
                wkSmall("fit-width", "pageWidth", "Chiều rộng trang"),
            ]),
        ].join("")),
    ]);

    var file = wkPanel("file", [
        wkGroup("Tệp", [
            wkLarge("new-document", "newDoc", "Mới", { title: "Tạo văn bản trống" }),
            wkLarge("import-word", "open", "Mở file Word", { title: "Mở file .docx / .doc / .sfdt" }),
            wkLarge("save-template", "save", "Lưu", { title: "Lưu (Ctrl+S)" }),
            wkLarge("download-docx", "download", "Tải DOCX", { title: "Tải về file Word (.docx)" }),
            wkLarge("print", "print", "In", { title: "In (Ctrl+P)" }),
            wkLarge("page-setup", "margins", "Thiết lập trang"),
        ].join("")),
    ]);

    var table = wkPanel("table", [
        wkGroup("Bảng", wkLarge("table-properties", "tableProps", "Thuộc tính")),
        wkGroup("Hàng & Cột", [
            wkLarge("", "tableDelete", "Xóa", { menu: "table-delete" }),
            wkLarge("table-row-above", "rowAbove", "Chèn phía trên"),
            wkStack([
                wkSmall("table-row-below", "rowBelow", "Chèn phía dưới"),
                wkSmall("table-col-left", "colLeft", "Chèn bên trái"),
                wkSmall("table-col-right", "colRight", "Chèn bên phải"),
            ]),
        ].join("")),
        wkGroup("Phối", wkLarge("table-merge", "merge", "Gộp ô", { title: "Gộp các ô đang bôi đen" })),
        wkGroup("Kích cỡ ô", wkLarge("", "autofit", "Tự khớp", { menu: "table-autofit" }) + wkStack([
            wkSmall("table-distribute-rows", "distRows", "Phân bố hàng", { title: "Phân bố đều các hàng (đang bôi đen, hoặc cả bảng)" }),
            wkSmall("table-distribute-cols", "distCols", "Phân bố cột", { title: "Phân bố đều các cột (đang bôi đen, hoặc cả bảng)" }),
        ])),
        wkGroup("Căn chỉnh", wkRows([
            [
                wkIconButton("align-left", "alignLeft", "Căn trái", { state: "align-left" }),
                wkIconButton("align-center", "alignCenter", "Căn giữa", { state: "align-center" }),
                wkIconButton("align-right", "alignRight", "Căn phải", { state: "align-right" }),
            ],
            [
                wkIconButton("table-valign", "valignTop", "Căn trên trong ô", { arg: "Top", state: "valign-top" }),
                wkIconButton("table-valign", "valignCenter", "Căn giữa trong ô", { arg: "Center", state: "valign-center" }),
                wkIconButton("table-valign", "valignBottom", "Căn dưới trong ô", { arg: "Bottom", state: "valign-bottom" }),
            ],
        ])),
        wkGroup("Lề ô", [
            '<div class="wk-fields">',
            wkNumberField("Trên", "table-cell-margin-top", 0, 0, 5, 0.05, "cm"),
            wkNumberField("Dưới", "table-cell-margin-bottom", 0, 0, 5, 0.05, "cm"),
            "</div>",
            '<div class="wk-fields">',
            wkNumberField("Trái", "table-cell-margin-left", 0.19, 0, 5, 0.05, "cm"),
            wkNumberField("Phải", "table-cell-margin-right", 0.19, 0, 5, 0.05, "cm"),
            "</div>",
        ].join("")),
        wkGroup("Viền & Tô bóng", [
            wkLarge("", "borders", "Viền", { menu: "table-borders" }),
            '<button type="button" class="wk-btn wk-btn-l" data-wk-menu-toggle="table-shading" aria-haspopup="true" title="Tô bóng ô">' + shadingGlyph + '<span class="wk-label">Tô bóng' + wkCaret() + "</span></button>",
        ].join(""), "borders-shading", "Viền và tô bóng"),
    ]);

    var tableGridCells = [];
    for (var row = 1; row <= 8; row += 1) {
        for (var column = 1; column <= 10; column += 1) {
            tableGridCells.push('<span class="wk-cell" data-wk-cell="' + row + "," + column + '"></span>');
        }
    }

    var menus = [
        wkMenu("paste", [
            wkMenuItem("paste", null, "paste", "Dán", "Giữ định dạng gốc (Ctrl+V)"),
            wkMenuItem("paste-text", null, "textOnly", "Dán chỉ giữ chữ", "Bỏ toàn bộ định dạng, theo định dạng chỗ con trỏ"),
            wkMenuItem("paste-from-store", null, "copy", "Dán từ kho dùng chung", "Khối văn bản đã sao chép ở văn bản / phần mềm khác, giữ nguyên định dạng"),
            wkMenuSep(),
            '<div class="wk-menu-note">Sau khi dán bằng Ctrl+V sẽ có nút nhỏ cạnh chỗ dán để đổi: giữ định dạng gốc / theo định dạng văn bản / chỉ giữ chữ.</div>',
        ]),
        wkMenu("change-case", [
            wkMenuItem("change-case", "Uppercase", null, "CHỮ IN HOA"),
            wkMenuItem("change-case", "Lowercase", null, "chữ thường"),
        ]),
        wkMenu("font-color", [
            wkMenuItem("font-color", "#000000", null, "Tự động (đen)"),
            wkMenuHeading("Màu chuẩn"),
            wkColorGrid("font-color", wordKitFontColors),
            wkMenuSep(),
            '<label class="wk-menu-item"><span class="wk-menu-blank"></span><span class="wk-menu-text">Màu khác...</span><input type="color" class="wk-hidden-color" value="#000000" data-office-kit-change="font-color-custom"></label>',
        ], "wk-menu-colors"),
        wkMenu("highlight", [
            wkColorGrid("highlight", wordKitHighlightColors),
            wkMenuSep(),
            wkMenuItem("highlight", "NoColor", null, "Không màu"),
        ], "wk-menu-colors"),
        wkMenu("bullets", [
            '<div class="wk-gallery">',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="dot" title="Chấm tròn">&#9679;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="circle" title="Vòng tròn">&#9675;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="square" title="Ô vuông">&#9632;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="dash" title="Gạch đầu dòng">&#8211;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="flower" title="Hoa thị">&#10070;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="arrow" title="Mũi tên">&#10146;</button>',
            '<button type="button" class="wk-tile" data-office-kit-command="bullets" data-office-kit-arg="tick" title="Dấu tích">&#10003;</button>',
            "</div>",
            wkMenuSep(),
            wkMenuItem("clear-list", null, null, "Bỏ dấu đầu dòng"),
        ]),
        wkMenu("numbering", [
            '<div class="wk-gallery wk-gallery-numbers">',
            ["1.", "1)", "a.", "a)", "A.", "i.", "I."].map(function (format) {
                var sample = format.charAt(0);
                var next = { "1": ["2", "3"], a: ["b", "c"], A: ["B", "C"], i: ["ii", "iii"], I: ["II", "III"] }[sample];
                var tail = format.slice(1);
                return '<button type="button" class="wk-tile wk-tile-number" data-office-kit-command="numbering" data-office-kit-arg="' + format + '" title="' + format + '">'
                    + "<span>" + sample + tail + "</span><span>" + next[0] + tail + "</span><span>" + next[1] + tail + "</span></button>";
            }).join(""),
            "</div>",
            wkMenuSep(),
            wkMenuItem("clear-list", null, null, "Bỏ đánh số"),
        ]),
        wkMenu("line-spacing", [
            wkMenuItem("line-spacing", "1", null, "1,0", null, { state: "ls-1" }),
            wkMenuItem("line-spacing", "1.15", null, "1,15", null, { state: "ls-1.15" }),
            wkMenuItem("line-spacing", "1.5", null, "1,5", null, { state: "ls-1.5" }),
            wkMenuItem("line-spacing", "2", null, "2,0", null, { state: "ls-2" }),
            wkMenuItem("line-spacing", "2.5", null, "2,5", null, { state: "ls-2.5" }),
            wkMenuItem("line-spacing", "3", null, "3,0", null, { state: "ls-3" }),
            wkMenuSep(),
            wkMenuItem("paragraph-settings", null, "lineSpacing", "Tùy chọn giãn dòng..."),
            wkMenuSep(),
            wkMenuItem("space-before", null, null, '<span data-wk-label="space-before">Thêm khoảng cách trước đoạn</span>'),
            wkMenuItem("space-after", null, null, '<span data-wk-label="space-after">Thêm khoảng cách sau đoạn</span>'),
        ]),
        wkMenu("table-insert", [
            '<div class="wk-menu-heading" data-wk-grid-label>Chèn bảng</div>',
            '<div class="wk-table-grid" data-wk-table-grid>' + tableGridCells.join("") + "</div>",
            wkMenuSep(),
            wkMenuItem("insert-table-dialog", null, "table", "Chèn bảng..."),
        ]),
        wkMenu("symbol", [
            '<div class="wk-symbols">' + wordKitSymbols.map(function (symbol) {
                return '<button type="button" class="wk-symbol" data-office-kit-command="insert-symbol" data-office-kit-arg="' + wkEscape(symbol) + '" title="' + wkEscape(symbol) + '">' + wkEscape(symbol) + "</button>";
            }).join("") + "</div>",
        ]),
        wkMenu("margins", [
            wkMenuItem("margins", "2,2,3,2", "margins", "Mặc định văn bản", "Trên 2 cm · Dưới 2 cm · Trái 3 cm · Phải 2 cm"),
            wkMenuItem("margins", "2.54,2.54,2.54,2.54", "margins", "Bình thường", "Trên 2,54 cm · Dưới 2,54 cm · Trái 2,54 cm · Phải 2,54 cm"),
            wkMenuItem("margins", "1.27,1.27,1.27,1.27", "margins", "Hẹp", "Trên 1,27 cm · Dưới 1,27 cm · Trái 1,27 cm · Phải 1,27 cm"),
            wkMenuItem("margins", "2.54,2.54,1.91,1.91", "margins", "Vừa phải", "Trên 2,54 cm · Dưới 2,54 cm · Trái 1,91 cm · Phải 1,91 cm"),
            wkMenuItem("margins", "2.54,2.54,5.08,5.08", "margins", "Rộng", "Trên 2,54 cm · Dưới 2,54 cm · Trái 5,08 cm · Phải 5,08 cm"),
            wkMenuSep(),
            wkMenuItem("page-setup", null, null, "Lề tùy chỉnh..."),
        ]),
        wkMenu("orientation", [
            wkMenuItem("orientation", "Portrait", "pageSize", "Dọc", null, { state: "orientation-portrait" }),
            wkMenuItem("orientation", "Landscape", "orientation", "Ngang", null, { state: "orientation-landscape" }),
        ]),
        wkMenu("page-size", [
            wkMenuItem("page-size", "A4", "blankPage", "A4", "21 cm × 29,7 cm"),
            wkMenuItem("page-size", "A5", "blankPage", "A5", "14,8 cm × 21 cm"),
            wkMenuItem("page-size", "A3", "blankPage", "A3", "29,7 cm × 42 cm"),
            wkMenuItem("page-size", "Letter", "blankPage", "Letter", "21,59 cm × 27,94 cm"),
            wkMenuItem("page-size", "Legal", "blankPage", "Legal", "21,59 cm × 35,56 cm"),
            wkMenuSep(),
            wkMenuItem("page-setup", null, null, "Khổ giấy khác..."),
        ]),
        wkMenu("breaks", [
            wkMenuHeading("Ngắt trang"),
            wkMenuItem("insert-page-break", null, "pageBreak", "Trang", "Đánh dấu chỗ một trang kết thúc và trang sau bắt đầu (Ctrl+Enter)"),
            wkMenuHeading("Ngắt phần"),
            wkMenuItem("insert-section-break", null, "breaks", "Trang tiếp theo", "Bắt đầu phần mới ở trang sau (đổi được hướng, lề riêng)"),
        ]),
        wkMenu("zoom", ["50", "75", "100", "125", "150", "200"].map(function (zoom) {
            return wkMenuItem("zoom", zoom, null, zoom + "%");
        }).concat([
            wkMenuSep(),
            wkMenuItem("fit-page", null, "onePage", "Một trang"),
            wkMenuItem("fit-width", null, "pageWidth", "Chiều rộng trang"),
        ])),
        wkMenu("table-insert-rc", [
            wkMenuItem("table-row-above", null, "rowAbove", "Chèn hàng phía trên"),
            wkMenuItem("table-row-below", null, "rowBelow", "Chèn hàng phía dưới"),
            wkMenuItem("table-col-left", null, "colLeft", "Chèn cột bên trái"),
            wkMenuItem("table-col-right", null, "colRight", "Chèn cột bên phải"),
        ]),
        wkMenu("table-delete", [
            wkMenuItem("table-delete-row", null, "rowBelow", "Xóa hàng"),
            wkMenuItem("table-delete-col", null, "colRight", "Xóa cột"),
            wkMenuItem("table-delete", null, "tableDelete", "Xóa bảng"),
        ]),
        wkMenu("table-autofit", [
            wkMenuItem("table-autofit", "FitToContents", "autofit", "Tự khớp nội dung"),
            wkMenuItem("table-autofit", "FitToWindow", "pageWidth", "Tự khớp cửa sổ"),
            wkMenuItem("table-autofit", "FixedColumnWidth", "table", "Độ rộng cột cố định"),
        ]),
        wkMenu("table-borders", [
            wkMenuHeading("Bút vẽ viền"),
            '<div class="wk-pen">'
                + '<label title="Màu viền"><span>Màu</span><input type="color" value="#000000" data-office-kit-change="border-color"></label>'
                + '<label title="Độ dày viền"><span>Độ dày</span><select data-office-kit-change="border-width">'
                + [0.25, 0.5, 0.75, 1, 1.5, 2.25, 3].map(function (width) {
                    return '<option value="' + width + '"' + (width === 0.5 ? " selected" : "") + ">" + String(width).replace(".", ",") + " pt</option>";
                }).join("")
                + "</select></label></div>",
            wkMenuSep(),
            wkMenuItem("border-AllBorders", null, "borders", "Tất cả viền"),
            wkMenuItem("border-NoBorder", null, null, "Không viền"),
            wkMenuItem("border-OutsideBorders", null, null, "Viền ngoài"),
            wkMenuItem("border-InsideBorders", null, null, "Viền trong"),
            wkMenuSep(),
            wkMenuItem("border-TopBorder", null, null, "Viền trên"),
            wkMenuItem("border-BottomBorder", null, null, "Viền dưới"),
            wkMenuItem("border-LeftBorder", null, null, "Viền trái"),
            wkMenuItem("border-RightBorder", null, null, "Viền phải"),
            wkMenuItem("border-InsideHorizontalBorder", null, null, "Viền ngang bên trong"),
            wkMenuItem("border-InsideVerticalBorder", null, null, "Viền dọc bên trong"),
            wkMenuSep(),
            wkMenuItem("borders-shading", null, "launcher", "Viền và tô bóng..."),
        ]),
        wkMenu("table-shading", [
            wkColorGrid("table-shading", wordKitShadingColors),
            wkMenuSep(),
            wkMenuItem("table-shading", "", null, "Không tô"),
        ], "wk-menu-colors"),
    ];

    return [
        '<div class="wk-tabbar">',
        '<div class="wk-qat" aria-label="Thanh truy cập nhanh">',
        wkIconButton("save-template", "save", "Lưu (Ctrl+S)"),
        wkIconButton("undo", "undo", "Hoàn tác (Ctrl+Z)"),
        wkIconButton("redo", "redo", "Làm lại (Ctrl+Y)"),
        "</div>",
        '<nav class="wk-tabs" role="tablist" aria-label="Ribbon">',
        wkTab("file", "Tệp"),
        wkTab("home", "Trang đầu", true),
        wkTab("insert", "Chèn"),
        wkTab("layout", "Bố trí"),
        wkTab("references", "Tham chiếu"),
        wkTab("review", "Xem lại"),
        wkTab("view", "Xem"),
        '<button type="button" class="wk-tab wk-tab-context" data-office-kit-tab="table" role="tab" aria-selected="false" hidden>Bảng</button>',
        "</nav>",
        '<div class="wk-tabbar-right">',
        '<button type="button" class="wk-bar-btn" data-office-kit-command="download-docx" title="Tải về file Word (.docx)">' + wkIcon("download") + "<span>Tải DOCX</span></button>",
        '<button type="button" class="wk-bar-btn wk-bar-btn-in" data-office-kit-command="print" title="In (Ctrl+P)">' + wkIcon("print") + "<span>In</span></button>",
        '<button type="button" class="wk-bar-btn wk-collapse-btn" data-office-kit-command="toggle-ribbon" title="Thu gọn / hiện ribbon (Ctrl+F1). Bấm đúp vào tên tab cũng được.">' + wkIcon("chevronUp") + "</button>",
        "</div>",
        "</div>",
        '<div class="wk-body">',
        file, home, insert, layout, references, review, view, table,
        "</div>",
        '<div class="wk-menus">', menus.join(""), "</div>",
        buildWordKitMiniHtml(fontColorGlyph, highlightGlyph),
    ].join("");
}

function officeKitComboControl(kind, changeName, currentValue, inputClass, items, inputMode) {
    var menu = items.map(function (value) {
        // Giong Word: ten phong hien bang chinh phong do.
        var preview = kind === "font-family" ? ' style="font-family:\'' + value + '\'"' : "";
        return '<button type="button" data-office-kit-combo-value="' + value + '"' + preview + ">" + value + "</button>";
    }).join("");

    return '<div class="contract-template-office-combo" data-office-kit-combo="' + kind + '">'
        + '<input class="contract-template-office-select ' + inputClass + '" data-office-kit-change="' + changeName + '" value="' + currentValue + '" autocomplete="off" aria-label="' + changeName + '"' + (inputMode ? ' inputmode="' + inputMode + '"' : "") + ">"
        + '<button type="button" class="contract-template-office-combo-caret" data-office-kit-combo-toggle tabindex="-1" aria-label="Mo danh sach">&#9662;</button>'
        + '<div class="contract-template-office-combo-menu" data-office-kit-combo-menu>' + menu + "</div>"
        + "</div>";
}

function officeKitFontFamilyControl() {
    // Danh sach font Windows chuan; nguoi dung van go tu do ten font bat ky.
    var fonts = [
        "Times New Roman", "Arial", "Arial Black", "Arial Narrow", "Calibri", "Calibri Light",
        "Cambria", "Candara", "Century Gothic", "Comic Sans MS", "Consolas", "Constantia",
        "Corbel", "Courier New", "Franklin Gothic Medium", "Gabriola", "Garamond", "Georgia",
        "Impact", "Lucida Console", "Lucida Sans Unicode", "Palatino Linotype", "Book Antiqua",
        "Segoe UI", "Segoe UI Light", "Segoe Print", "Segoe Script", "Sitka", "Tahoma",
        "Trebuchet MS", "Verdana", "Wingdings", "Symbol", "MS Gothic", "MS Mincho", "SimSun",
        "Microsoft Sans Serif", "Roboto",
    ];

    return officeKitComboControl("font-family", "font-family", "Times New Roman", "contract-template-office-font-family", fonts);
}

function officeKitFontSizeControl() {
    var sizes = [6, 7, 8, 9, 10, 10.5, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 96];

    return officeKitComboControl("font-size", "font-size", "14", "contract-template-office-font-size", sizes, "decimal");
}

// Thanh cong cu nho hien tren menu chuot phai (nhu Word): hai hang dinh dang ben trai, nut lon ben phai.
// Nam trong ribbon nen dung chung xu ly bam nut, menu tha xuong, o phong/co chu va trang thai B/I/U.
// data-wk-mini="text" chi hien ngoai bang, "table" chi hien trong bang (giong hai kieu thanh nho cua Word).

function buildWordKitMiniHtml(fontColorGlyph, highlightGlyph) {
    var shadingGlyph = '<span class="wk-glyph-color">' + wkIcon("shading") + '<span class="wk-color-bar" data-wk-color-bar="shading" style="background:#D9D9D9"></span></span>';
    var chiNgoaiBang = function (html) {
        return '<span data-wk-mini="text">' + html + "</span>";
    };
    var chiTrongBang = function (html) {
        return '<span data-wk-mini="table">' + html + "</span>";
    };

    return '<div class="wk-mini" role="toolbar" aria-label="Định dạng nhanh">'
        + wkRows([
            [
                officeKitFontFamilyControl(),
                officeKitFontSizeControl(),
                wkIconButton("grow-font", "grow", "Tăng cỡ phông (Ctrl+])"),
                wkIconButton("shrink-font", "shrink", "Giảm cỡ phông (Ctrl+[)"),
                wkIconButton("format-painter", "painter", "Sao định dạng", { state: "format-painter" }),
            ],
            [
                wkIconButton("bold", '<span class="wk-glyph" style="font-weight:700">B</span>', "Đậm (Ctrl+B)", { state: "bold" }),
                wkIconButton("italic", '<span class="wk-glyph wk-glyph-serif" style="font-style:italic">I</span>', "Nghiêng (Ctrl+I)", { state: "italic" }),
                chiNgoaiBang(wkIconButton("underline", '<span class="wk-glyph" style="text-decoration:underline">U</span>', "Gạch dưới (Ctrl+U)", { state: "underline" })),
                chiTrongBang(wkIconButton("align-center", "alignCenter", "Căn giữa (Ctrl+E)", { state: "align-center" })),
                wkSplit("highlight-apply", highlightGlyph, "Màu tô sáng văn bản", "highlight"),
                wkSplit("font-color-apply", fontColorGlyph, "Màu phông chữ", "font-color"),
                chiNgoaiBang(wkSplit("bullets", "bullets", "Dấu đầu dòng", "bullets", { arg: "dot" })
                    + wkSplit("numbering", "numbering", "Đánh số", "numbering", { arg: "1." })),
                chiTrongBang(wkSplit("table-shading-apply", shadingGlyph, "Tô bóng ô", "table-shading")
                    + wkIconButton("", "borders", "Viền", { menu: "table-borders" })),
            ],
        ])
        + '<div class="wk-mini-big">'
        + chiNgoaiBang(wkLarge("insert-comment", "comment", "Chú thích mới"))
        + chiTrongBang(wkLarge("", "rowAbove", "Chèn", { menu: "table-insert-rc", title: "Chèn hàng / cột" })
            + wkLarge("", "tableDelete", "Xóa", { menu: "table-delete", title: "Xóa hàng / cột / bảng" }))
        + "</div></div>";
}

function getWordKitMiniToolbar() {
    var ribbon = document.getElementById("syncfusion-office-kit-ribbon");
    return ribbon ? ribbon.querySelector(".wk-mini") : null;
}

function showWordKitMiniToolbar(editorContainer, clientX, clientY) {
    var mini = getWordKitMiniToolbar();
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!mini || !editor || editor.isReadOnly) {
        return;
    }
    closeWordKitMenus();
    closeSyncfusionOfficeKitCombos(null);
    mini.classList.toggle("wk-mini-table", isWordKitSelectionInTable(editor));
    try {
        updateWordKitState(editorContainer);
    } catch (error) {
        // trang thai nut chi de hien thi; loi doc dinh dang khong chan thanh cong cu
    }
    mini.classList.add("wk-open");
    // Menu chuot phai cua Syncfusion mo ngay sau su kien nay (va co the dua con tro toi cho vua bam):
    // xet lai trong/ngoai bang roi dat thanh nho theo vi tri menu khi menu da hien.
    var dat = function () {
        mini.classList.toggle("wk-mini-table", isWordKitSelectionInTable(editor));
        placeWordKitMiniToolbar(mini, clientX, clientY);
    };
    dat();
    setTimeout(dat, 0);
    setTimeout(dat, 150);
}

function placeWordKitMiniToolbar(mini, clientX, clientY) {
    if (!mini.classList.contains("wk-open")) {
        return;
    }
    var width = mini.offsetWidth;
    var height = mini.offsetHeight;
    var menu = null;
    document.querySelectorAll('[id$="e-de-contextmenu-list"]').forEach(function (list) {
        var rect = list.getBoundingClientRect();
        if (!menu && rect.width > 0 && rect.height > 0) {
            menu = rect;
        }
    });
    var anchor = menu || { left: clientX, top: clientY, right: clientX, bottom: clientY };
    var left = anchor.left;
    var top = anchor.top - height - 6;
    if (top < 4) {
        // Khong du cho phia tren menu: dat ben canh menu (phai, sat mep thi trai).
        top = Math.max(4, Math.min(anchor.top, window.innerHeight - height - 4));
        left = anchor.right + 6;
        if (left + width > window.innerWidth - 4) {
            left = anchor.left - width - 6;
        }
    }
    left = Math.max(4, Math.min(left, window.innerWidth - width - 4));
    mini.style.left = Math.round(left) + "px";
    mini.style.top = Math.round(top) + "px";
}

function hideWordKitMiniToolbar() {
    var mini = getWordKitMiniToolbar();
    if (mini && mini.classList.contains("wk-open")) {
        mini.classList.remove("wk-open");
        closeWordKitMenus();
        closeSyncfusionOfficeKitCombos(null);
    }
}

// Menu chuot phai: giu cac muc goc cua Syncfusion (lien ket, chu thich, chen/xoa hang...), them cac muc
// bang nhu Word o cuoi menu, chi hien khi con tro trong bang. Muc con khong bi Syncfusion them tien to id.

var wordKitContextPrefix = "wkctx_";

function installWordKitContextMenu(editorContainer, editor) {
    var contextMenu = editor.contextMenu || editor.contextMenuModule;
    if (!contextMenu || typeof contextMenu.addCustomMenu !== "function") {
        return;
    }
    var p = wordKitContextPrefix;
    var vien = [
        ["AllBorders", "Tất cả viền"], ["NoBorder", "Không viền"], ["OutsideBorders", "Viền ngoài"], ["InsideBorders", "Viền trong"],
        ["TopBorder", "Viền trên"], ["BottomBorder", "Viền dưới"], ["LeftBorder", "Viền trái"], ["RightBorder", "Viền phải"],
        ["InsideHorizontalBorder", "Viền ngang bên trong"], ["InsideVerticalBorder", "Viền dọc bên trong"],
    ].map(function (item) {
        return { text: item[1], id: p + "border_" + item[0] };
    });
    vien.splice(4, 0, { separator: true });
    vien.push({ separator: true }, { text: "Viền và tô bóng...", id: p + "borders_shading" });

    try {
        contextMenu.addCustomMenu([
            { separator: true, id: p + "sep" },
            { text: "Phân bố đều các hàng", id: p + "distribute_rows" },
            { text: "Phân bố đều các cột", id: p + "distribute_cols" },
            { text: "Kiểu viền", id: p + "borders", items: vien },
            { text: "Căn chỉnh trong ô", id: p + "valign", items: [
                { text: "Căn trên", id: p + "valign_Top" },
                { text: "Căn giữa", id: p + "valign_Center" },
                { text: "Căn dưới", id: p + "valign_Bottom" },
            ] },
        ], false, true);
    } catch (error) {
        console.warn("Word kit context menu:", error);
        return;
    }

    editor.addEventListener("customContextMenuBeforeOpen", function (args) {
        // Syncfusion chi bat "Dan" khi enableLocalPaste; dan cua bo soan doc bo nho tam he thong nen luon bat.
        var pasteItem = document.getElementById(editor.element.id + "_contextmenu_paste");
        if (pasteItem && !editor.isReadOnlyMode) {
            pasteItem.classList.remove("e-disabled");
        }
        var inTable = isWordKitSelectionInTable(editor) && !editor.isReadOnly;
        (args && args.ids || []).forEach(function (id) {
            var item = document.getElementById(id);
            if (item && String(id).indexOf(p) !== -1) {
                item.style.display = inTable ? "" : "none";
            }
        });
    });
    editor.addEventListener("customContextMenuSelect", function (args) {
        var id = String(args && args.id || "");
        var at = id.indexOf(p);
        if (at === -1) {
            return;
        }
        var key = id.slice(at + p.length);
        hideWordKitMiniToolbar();
        if (key === "distribute_rows" || key === "distribute_cols") {
            runSyncfusionOfficeKitCommand(editorContainer, key === "distribute_rows" ? "table-distribute-rows" : "table-distribute-cols");
        } else if (key === "borders_shading") {
            runSyncfusionOfficeKitCommand(editorContainer, "borders-shading");
        } else if (key.indexOf("border_") === 0) {
            runSyncfusionOfficeKitCommand(editorContainer, "border-" + key.slice("border_".length));
        } else if (key.indexOf("valign_") === 0) {
            runSyncfusionOfficeKitCommand(editorContainer, "table-valign", key.slice("valign_".length));
        }
    });
}

// Thanh nho: hien khi bam chuot phai trong vung soan; an khi bam cho khac, go phim, lan chuot, Esc.

// Giong Word: dat con tro, giu Shift roi bam chuot cho khac -> to den tu con tro toi cho bam.
// Syncfusion ban nay bam chuot luon dat lai con tro (khong mo rong vung chon) nen tu lam: luc nhan chuot co Shift
// nho diem dau vung chon hien tai, tha chuot xong chon tu diem do toi vi tri vua bam (keo chuot khi giu Shift cung duoc).
function wireWordKitShiftClickSelect(editor) {
    var element = editor.element;
    if (!element || element.wordKitShiftClickWired) {
        return;
    }
    element.wordKitShiftClickWired = true;
    var diemDau = null;
    element.addEventListener("mousedown", function (event) {
        diemDau = null;
        if (event.button !== 0 || !event.shiftKey || !editor.selection || !editor.selection.start) {
            return;
        }
        try {
            diemDau = editor.selection.start.clone();
        } catch (e) {
            diemDau = null;
        }
    }, true);
    document.addEventListener("mouseup", function () {
        if (!diemDau) {
            return;
        }
        var dau = diemDau;
        diemDau = null;
        setTimeout(function () {
            try {
                editor.selection.selectPosition(dau, editor.selection.end.clone());
            } catch (e) {
                // Vi tri cu khong con hop le (van ban vua doi): giu nguyen cho vua bam.
            }
        }, 0);
    }, true);
}

function wireWordKitMiniToolbar(editorContainer, editor) {
    var element = editor.element;
    if (!element || element.wordKitMiniWired) {
        return;
    }
    element.wordKitMiniWired = true;
    element.addEventListener("contextmenu", function (event) {
        showWordKitMiniToolbar(editorContainer, event.clientX, event.clientY);
    }, true);
    element.addEventListener("wheel", hideWordKitMiniToolbar, { passive: true });
    // Phim go trong van ban nam trong iframe nhap lieu cua Syncfusion, khong toi document: nghe qua su kien cua editor.
    editor.addEventListener("keyDown", function () {
        hideWordKitMiniToolbar();
    });

    if (!window.__wordKitMiniDocumentWired) {
        window.__wordKitMiniDocumentWired = true;
        document.addEventListener("mousedown", function (event) {
            if (!event.target.closest(".wk-mini, .wk-menu, .contract-template-office-combo-menu")) {
                hideWordKitMiniToolbar();
            }
        }, true);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" || !event.target.closest(".wk-mini")) {
                hideWordKitMiniToolbar();
            }
        }, true);
        window.addEventListener("resize", hideWordKitMiniToolbar);
    }
}

// Phan bo deu cac hang (nhu Word): chieu cao trung binh cho cac hang dang boi den, chua boi den = ca bang.
// Dat qua rowFormat cua vung chon nen chi mot buoc hoan tac; hang co noi dung cao hon van giu chieu cao can thiet.

function distributeWordKitTableRows(editor) {
    var selection = editor.selection;
    var info = getWordKitRulerTableInfo(editor);
    if (!info || !info.rows.length || !selection || !selection.rowFormat) {
        return false;
    }
    var hangCua = function (position) {
        var paragraph = position && position.paragraph;
        var cell = paragraph && paragraph.isInsideTable ? paragraph.associatedCell : null;
        return cell ? cell.ownerRow : null;
    };
    var rows = info.rows;
    var caBang = selection.isEmpty;
    if (!caBang) {
        var dau = rows.findIndex(function (entry) { return entry.row === hangCua(selection.start); });
        var cuoi = rows.findIndex(function (entry) { return entry.row === hangCua(selection.end); });
        if (dau === -1 || cuoi === -1 || dau === cuoi) {
            caBang = true;
        } else {
            rows = rows.slice(Math.min(dau, cuoi), Math.max(dau, cuoi) + 1);
        }
    }
    if (rows.length < 2) {
        return false;
    }

    var tong = rows.reduce(function (sum, entry) { return sum + (entry.bottom - entry.top); }, 0);
    var height = Math.round(Math.max(tong / rows.length, wordKitMinimumRow) * 100) / 100;
    var savedStart = selection.startOffset;
    var savedEnd = selection.endOffset;
    if (caBang) {
        selection.selectTable();
    }
    selection.rowFormat.heightType = "AtLeast";
    selection.rowFormat.height = height;
    if (caBang) {
        try {
            selection.select(savedStart, savedEnd);
        } catch (error) {
            // vi tri cu khong con hop le: de vung chon ca bang
        }
    }
    return true;
}

// Phan bo deu cac cot: dua tung ranh gioi cot ve vi tri chia deu (theo hang chua con tro) bang bo keo cot
// cua Syncfusion. Ranh gioi dich sang phai xu ly tu phai qua trai, dich sang trai tu trai qua phai,
// de khong ranh gioi nao bi ranh gioi ben canh chan lai.

function distributeWordKitTableColumns(editor) {
    var selection = editor.selection;
    var info = getWordKitRulerTableInfo(editor);
    if (!info || info.columns.length < 3) {
        return false;
    }
    var dau = 0;
    var cuoi = info.columns.length - 1;
    if (!selection.isEmpty) {
        var cells = info.row.childWidgets;
        var endParagraph = selection.end && selection.end.paragraph;
        var endCell = endParagraph && endParagraph.isInsideTable ? endParagraph.associatedCell : null;
        var a = cells.indexOf(info.cell);
        var b = -1;
        cells.forEach(function (cell, index) {
            if (endCell && cell.columnIndex <= endCell.columnIndex) {
                b = index;
            }
        });
        if (a !== -1 && b !== -1 && a !== b) {
            dau = Math.min(a, b);
            cuoi = Math.max(a, b) + 1;
        }
    }
    if (cuoi - dau < 2) {
        return false;
    }

    var trai = info.columns[dau].point;
    var buoc = (info.columns[cuoi].point - trai) / (cuoi - dau);
    var sangPhai = [];
    var sangTrai = [];
    for (var k = dau + 1; k < cuoi; k += 1) {
        var dich = trai + buoc * (k - dau);
        if (dich > info.columns[k].point) {
            sangPhai.push([k, dich]);
        } else if (dich < info.columns[k].point) {
            sangTrai.push([k, dich]);
        }
    }
    sangPhai.reverse().concat(sangTrai).forEach(function (item) {
        applyWordKitColumnResize(editor, item[0], item[1]);
    });
    return true;
}

function openWordKitMenu(toggle) {
    var ribbon = document.getElementById("syncfusion-office-kit-ribbon");
    var name = toggle.getAttribute("data-wk-menu-toggle");
    var menu = ribbon ? ribbon.querySelector('[data-wk-menu="' + name + '"]') : null;
    if (!menu) {
        return;
    }

    var wasOpen = menu.classList.contains("wk-open");
    closeWordKitMenus();
    closeSyncfusionOfficeKitCombos(null);
    if (wasOpen) {
        return;
    }

    if (name === "table-insert") {
        highlightWordKitTableGrid(ribbon, "0,0");
    }
    menu.classList.add("wk-open");
    toggle.classList.add("wk-menu-active");

    // position:fixed -> khong bi cat boi overflow cua ribbon; lat len tren neu sat day man hinh.
    var anchor = toggle.closest(".wk-split") || toggle;
    var rect = anchor.getBoundingClientRect();
    var width = menu.offsetWidth;
    var height = menu.offsetHeight;
    var left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4));
    var top = rect.bottom + 2;
    if (top + height > window.innerHeight - 4 && rect.top - height - 2 > 4) {
        top = rect.top - height - 2;
    }
    menu.style.left = Math.round(left) + "px";
    menu.style.top = Math.round(top) + "px";
}

function closeWordKitMenus() {
    document.querySelectorAll(".wk-menu.wk-open").forEach(function (menu) {
        menu.classList.remove("wk-open");
    });
    document.querySelectorAll(".wk-menu-active").forEach(function (button) {
        button.classList.remove("wk-menu-active");
    });
}

// Ten cu con duoc goi o vai cho: nay la menu "Viền" trong tab Bang.
function toggleSyncfusionOfficeKitBorderMenu() {
    var toggle = document.querySelector('[data-wk-menu-toggle="table-borders"]');
    if (toggle) {
        openWordKitMenu(toggle);
    }
}

function closeSyncfusionOfficeKitBorderMenu() {
    closeWordKitMenus();
}

function positionSyncfusionOfficeKitCombo(combo) {
    var menu = combo.querySelector("[data-office-kit-combo-menu]");
    var input = combo.querySelector("input");
    if (!menu || !input) {
        return;
    }
    var rect = input.getBoundingClientRect();
    menu.style.top = Math.round(rect.bottom + 2) + "px";
    menu.style.left = Math.round(Math.max(4, Math.min(rect.left, window.innerWidth - 160))) + "px";
    menu.style.minWidth = Math.round(rect.width) + "px";
}

function filterSyncfusionOfficeKitCombo(combo, text) {
    var query = (text || "").trim().toLowerCase();
    combo.querySelectorAll("[data-office-kit-combo-value]").forEach(function (button) {
        var value = (button.getAttribute("data-office-kit-combo-value") || "").toLowerCase();
        button.hidden = query !== "" && value.indexOf(query) === -1;
    });
}

function closeSyncfusionOfficeKitCombos(except) {
    document.querySelectorAll(".contract-template-office-combo").forEach(function (combo) {
        if (combo !== except) {
            var menu = combo.querySelector("[data-office-kit-combo-menu]");
            if (menu) {
                menu.classList.remove("contract-template-office-combo-menu-open");
            }
        }
    });
}

function openSyncfusionOfficeKitCombo(combo) {
    closeSyncfusionOfficeKitCombos(combo);
    closeSyncfusionOfficeKitBorderMenu();
    var menu = combo.querySelector("[data-office-kit-combo-menu]");
    if (!menu) {
        return;
    }
    filterSyncfusionOfficeKitCombo(combo, "");
    positionSyncfusionOfficeKitCombo(combo);
    menu.classList.add("contract-template-office-combo-menu-open");
}

function toggleSyncfusionOfficeKitCombo(combo) {
    var menu = combo.querySelector("[data-office-kit-combo-menu]");
    if (!menu) {
        return;
    }
    if (menu.classList.contains("contract-template-office-combo-menu-open")) {
        menu.classList.remove("contract-template-office-combo-menu-open");
    } else {
        openSyncfusionOfficeKitCombo(combo);
    }
}

// But ve vien (mau / do day) - ap dung cho lenh vien chon sau do, giong Pen Color cua Word.
var syncfusionOfficeKitBorderColor = "#000000";
var syncfusionOfficeKitBorderWidth = 0.5;

function applySyncfusionOfficeKitTableBorderType(editor, type) {
    var editorModule = editor && editor.editor;
    var selection = editor && editor.selection;

    if (!editorModule || !selection || typeof editorModule.getBorder !== "function") {
        return;
    }

    var startCell = selection.start && selection.start.paragraph && selection.start.paragraph.associatedCell;
    var endCell = selection.end && selection.end.paragraph && selection.end.paragraph.associatedCell;
    var table = startCell && startCell.ownerTable;
    if (!table) {
        showWordKitToast("Hãy đặt con trỏ vào trong bảng trước khi chỉnh viền.");
        return;
    }

    var rows = table.childWidgets || [];
    var cellsOf = function (rowIndex) {
        var row = rows[rowIndex];
        return (row && row.childWidgets) || [];
    };
    // Quet de tim vi tri (dong, cot) - khong phu thuoc ten thuoc tinh noi bo cua Syncfusion.
    var locate = function (cell) {
        for (var i = 0; i < rows.length; i++) {
            var cells = cellsOf(i);
            for (var j = 0; j < cells.length; j++) {
                if (cells[j] === cell) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    };

    var startPos = locate(startCell);
    if (!startPos) {
        return;
    }
    // Chi tac dong len vung dang chon, khong pha vien cua ca bang.
    var endPos = (endCell && endCell.ownerTable === table && locate(endCell)) || startPos;
    var rowFrom = Math.min(startPos.row, endPos.row);
    var rowTo = Math.max(startPos.row, endPos.row);
    var colFrom = Math.min(startPos.col, endPos.col);
    var colTo = Math.max(startPos.col, endPos.col);
    var wholeTable = rowFrom === 0 && colFrom === 0 && rowTo === rows.length - 1 && colTo === cellsOf(rowTo).length - 1;

    var single = function () {
        return editorModule.getBorder(syncfusionOfficeKitBorderColor, syncfusionOfficeKitBorderWidth, "Single");
    };
    var none = function () {
        return editorModule.getBorder("#000000", 0, "None");
    };
    var bordersOf = function (rowIndex, colIndex) {
        var cell = cellsOf(rowIndex)[colIndex];
        return (cell && cell.cellFormat && cell.cellFormat.borders) || null;
    };
    var setSide = function (borders, side, makeFn) {
        if (borders && borders[side] && typeof borders[side].copyFormat === "function") {
            borders[side].copyFormat(makeFn());
        }
    };

    var tableBorders = (table.tableFormat && table.tableFormat.borders) || null;
    var opposite = { top: "bottom", bottom: "top", left: "right", right: "left" };
    var neighbor = { top: [-1, 0], bottom: [1, 0], left: [0, -1], right: [0, 1] };
    var isVisible = function (border) {
        var style = border && border.lineStyle;
        return !!style && style !== "None" && style !== "Cleared";
    };
    // Vien o co the chua duoc dat rieng -> phai xet them vien cap bang moi biet duong ke co dang hien hay khong.
    var sideVisible = function (rowIndex, colIndex, side) {
        var border = (bordersOf(rowIndex, colIndex) || {})[side];
        if (border && border.lineStyle) {
            return isVisible(border);
        }
        if (!tableBorders) {
            return false;
        }
        var isOuter = (side === "top" && rowIndex === 0)
            || (side === "bottom" && rowIndex === rows.length - 1)
            || (side === "left" && colIndex === 0)
            || (side === "right" && colIndex === cellsOf(rowIndex).length - 1);
        if (isOuter) {
            return isVisible(tableBorders[side]);
        }
        return isVisible(tableBorders[side === "left" || side === "right" ? "vertical" : "horizontal"]);
    };
    // Duong ke giua 2 o van hien neu ben kia con khai bao vien.
    var edgeVisible = function (rowIndex, colIndex, side) {
        if (sideVisible(rowIndex, colIndex, side)) {
            return true;
        }
        var delta = neighbor[side];
        var nr = rowIndex + delta[0];
        var nc = colIndex + delta[1];
        if (nr < 0 || nr >= rows.length || nc < 0 || nc >= cellsOf(nr).length) {
            return false;
        }
        return sideVisible(nr, nc, opposite[side]);
    };
    // Xoa mot canh phai xoa ca canh doi dien cua o ke ben, neu khong duong ke van con.
    var clearSide = function (rowIndex, colIndex, side) {
        setSide(bordersOf(rowIndex, colIndex), side, none);
        var delta = neighbor[side];
        setSide(bordersOf(rowIndex + delta[0], colIndex + delta[1]), opposite[side], none);
    };

    var edgeCells = function (side) {
        var list = [];
        var k;
        if (side === "top" || side === "bottom") {
            var r = side === "top" ? rowFrom : rowTo;
            for (k = colFrom; k <= colTo; k++) {
                list.push([r, k]);
            }
        } else {
            var c = side === "left" ? colFrom : colTo;
            for (k = rowFrom; k <= rowTo; k++) {
                list.push([k, c]);
            }
        }
        return list;
    };
    // Vien dang khac mau/do day but -> ap lai theo but, chi go khi da trung khop.
    var matchesPen = function (border) {
        if (!border || border.lineStyle !== "Single") {
            return false;
        }
        var color = String(border.color || "").toLowerCase();
        var pen = syncfusionOfficeKitBorderColor.toLowerCase().replace("#", "");
        return color.indexOf(pen) >= 0 && Math.abs((border.lineWidth || 0) - syncfusionOfficeKitBorderWidth) < 0.01;
    };
    var edgeMatchesPen = function (rowIndex, colIndex, side) {
        if (matchesPen((bordersOf(rowIndex, colIndex) || {})[side])) {
            return true;
        }
        var delta = neighbor[side];
        var nr = rowIndex + delta[0];
        var nc = colIndex + delta[1];
        if (nr < 0 || nr >= rows.length || nc < 0 || nc >= cellsOf(nr).length) {
            return false;
        }
        return matchesPen((bordersOf(nr, nc) || {})[opposite[side]]);
    };

    // Giong Word: canh dang co vien thi bam lai se go vien do.
    var toggleSide = function (side) {
        var list = edgeCells(side);
        var allOn = list.length > 0 && list.every(function (pos) {
            return edgeVisible(pos[0], pos[1], side) && edgeMatchesPen(pos[0], pos[1], side);
        });
        list.forEach(function (pos) {
            if (allOn) {
                clearSide(pos[0], pos[1], side);
            } else {
                setSide(bordersOf(pos[0], pos[1]), side, single);
            }
        });
    };

    var sideByType = { TopBorder: "top", BottomBorder: "bottom", LeftBorder: "left", RightBorder: "right" };

    try {
        if (sideByType[type]) {
            toggleSide(sideByType[type]);
        } else {
            for (var i = rowFrom; i <= rowTo; i++) {
                for (var j = colFrom; j <= colTo; j++) {
                    var b = bordersOf(i, j);
                    if (!b) {
                        continue;
                    }
                    var isTop = i === rowFrom;
                    var isBottom = i === rowTo;
                    var isFirst = j === colFrom;
                    var isLast = j === colTo;

                    switch (type) {
                        case "AllBorders":
                            setSide(b, "top", single); setSide(b, "bottom", single);
                            setSide(b, "left", single); setSide(b, "right", single);
                            setSide(b, "vertical", single); setSide(b, "horizontal", single);
                            break;
                        case "NoBorder":
                            clearSide(i, j, "top"); clearSide(i, j, "bottom");
                            clearSide(i, j, "left"); clearSide(i, j, "right");
                            setSide(b, "vertical", none); setSide(b, "horizontal", none);
                            break;
                        case "OutsideBorders":
                            if (isTop) { setSide(b, "top", single); }
                            if (isBottom) { setSide(b, "bottom", single); }
                            if (isFirst) { setSide(b, "left", single); }
                            if (isLast) { setSide(b, "right", single); }
                            break;
                        case "InsideBorders":
                            if (!isBottom) { setSide(b, "bottom", single); }
                            if (!isLast) { setSide(b, "right", single); }
                            setSide(b, "vertical", single); setSide(b, "horizontal", single);
                            break;
                        case "InsideHorizontalBorder":
                            if (!isBottom) { setSide(b, "bottom", single); }
                            setSide(b, "horizontal", single);
                            break;
                        case "InsideVerticalBorder":
                            if (!isLast) { setSide(b, "right", single); }
                            setSide(b, "vertical", single);
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        // Chi dung den vien cap bang khi dang chon ca bang, tranh ghi de vung khac.
        if (wholeTable && tableBorders) {
            if (type === "AllBorders") {
                setSide(tableBorders, "top", single);
                setSide(tableBorders, "bottom", single);
                setSide(tableBorders, "left", single);
                setSide(tableBorders, "right", single);
                setSide(tableBorders, "vertical", single);
                setSide(tableBorders, "horizontal", single);
            } else if (type === "NoBorder") {
                setSide(tableBorders, "top", none);
                setSide(tableBorders, "bottom", none);
                setSide(tableBorders, "left", none);
                setSide(tableBorders, "right", none);
                setSide(tableBorders, "vertical", none);
                setSide(tableBorders, "horizontal", none);
            }
        }

        if (typeof editorModule.reLayoutTable === "function") {
            editorModule.reLayoutTable(table);
        } else if (typeof editor.open === "function" && typeof editor.serialize === "function") {
            editor.open(editor.serialize());
        }
    } catch (error) {
        console.error("Office kit table border error:", error);
    }
}

// Kho dan dung chung (lay tu cdt/vt01...): Ctrl+C luu ban SFDT (giu nguyen dinh dang) vao localStorage + kho tren may
// chu; Ctrl+V ma chu trong bo nho tam khop thi dan thang SFDT, khong qua dich vu .NET -> dan giua cac van ban
// trong phan mem giu tron dinh dang, chay ca tren http.

var SYNCFUSION_OFFICE_KIT_SFDT_TAG = "/*office-kit-sfdt*/";

var SYNCFUSION_OFFICE_KIT_CLIPBOARD_KEY = "officeKitSfdtClipboard";

function syncfusionOfficeKitClipboardRelay() {
    var url = window.syncfusionOfficeKitClipboardRelayUrl;
    var owner = window.syncfusionOfficeKitClipboardOwner;
    if (typeof url !== "string" || !url.trim() || typeof owner !== "string" || !owner.trim()) {
        return null;
    }
    return { url: url.trim().replace(/\/+$/, ""), owner: owner.trim() };
}

function pushSyncfusionOfficeKitClipboardToStore(sfdt, label) {
    var relay = syncfusionOfficeKitClipboardRelay();
    if (!relay || !sfdt) {
        return;
    }

    fetch(relay.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: relay.owner, sfdt: sfdt, label: label || "" }),
    }).catch(function (error) {
        console.error("Office kit clipboard store error:", error);
    });
}

function pasteSyncfusionOfficeKitFromStore(editor) {
    var editorModule = editor && editor.editor;
    var relay = syncfusionOfficeKitClipboardRelay();

    if (!relay) {
        showWordKitToast("Chưa cấu hình kho dùng chung (OFFICE_KIT_CLIPBOARD_RELAY trong .env).");
        return;
    }
    if (!editorModule || typeof editorModule.pasteContents !== "function") {
        return;
    }

    fetch(relay.url + "?owner=" + encodeURIComponent(relay.owner), { method: "GET" })
        .then(function (response) {
            return response.ok ? response.json() : null;
        })
        .then(function (data) {
            if (!data || !data.ok || !data.sfdt) {
                showWordKitToast("Kho trống. Hãy sao chép (Ctrl+C) khối văn bản ở văn bản/phần mềm nguồn trước.");
                return;
            }
            if (!pasteSyncfusionOfficeKitSfdt(editor, data.sfdt, data.label || "")) {
                showWordKitToast("Nội dung trong kho dùng chung không hợp lệ.");
            }
        })
        .catch(function (error) {
            console.error("Office kit clipboard fetch error:", error);
            showWordKitToast("Không lấy được nội dung từ kho dùng chung.");
        });
}

function syncfusionOfficeKitClipboardSignature(text) {
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, 400);
}

// Ban sao chep gan nhat tu bo soan tren trang nay (khi localStorage bi chan hoac ban SFDT qua lon).
var syncfusionOfficeKitLastCopy = null;

// Syncfusion sao chep: ghi SFDT vao editor.copiedData roi chon mot div tam (left/top -10000px) ngay duoi body
// va execCommand("copy"). Chi su kien copy tu div do moi la sao chep trong bo soan.
function isSyncfusionOfficeKitCopyEvent(event) {
    var node = event && event.target;
    if (node && node.nodeType !== 1) {
        node = node.parentNode;
    }
    while (node && node.parentNode && node.parentNode !== document.body) {
        node = node.parentNode;
    }
    return Boolean(node && node.style && node.style.left === "-10000px" && node.style.top === "-10000px");
}

function saveSyncfusionOfficeKitClipboard(editor, event) {
    var editorModule = editor && editor.editor;
    var selection = editor && editor.selection;
    if (!editorModule || !selection || !isSyncfusionOfficeKitCopyEvent(event)) {
        return;
    }

    try {
        var sfdt = editorModule.copiedData;
        if (!sfdt) {
            return;
        }
        if (typeof sfdt !== "string") {
            sfdt = JSON.stringify(sfdt);
        }
        // Chu thuan trinh duyet dat vao bo nho tam chinh la chu dang chon trong div tam luc nay.
        var clipboardText = window.getSelection ? String(window.getSelection()) : "";
        var entry = {
            sfdt: sfdt,
            sig: syncfusionOfficeKitClipboardSignature(selection.text),
            clipSig: syncfusionOfficeKitClipboardSignature(clipboardText),
        };
        syncfusionOfficeKitLastCopy = entry;
        try {
            // Tranh nhet qua nhieu vao localStorage (gioi han khoang 5MB).
            if (sfdt.length <= 2000000) {
                window.localStorage.setItem(SYNCFUSION_OFFICE_KIT_CLIPBOARD_KEY, JSON.stringify(entry));
            } else {
                window.localStorage.removeItem(SYNCFUSION_OFFICE_KIT_CLIPBOARD_KEY);
            }
        } catch (storageError) {
            // Che do an danh / chan luu tru: van dan duoc trong trang nay nho syncfusionOfficeKitLastCopy.
        }
        // Day len kho chung de du an khac ten mien lay duoc.
        pushSyncfusionOfficeKitClipboardToStore(sfdt, (entry.clipSig || entry.sig).slice(0, 80));
    } catch (error) {
        console.error("Office kit clipboard save error:", error);
    }
}

function syncfusionOfficeKitClipboardEntryMatches(entry, signature) {
    return Boolean(entry && entry.sfdt && signature && (signature === entry.clipSig || signature === entry.sig));
}

function loadSyncfusionOfficeKitClipboard(plainText) {
    var signature = syncfusionOfficeKitClipboardSignature(plainText);
    if (!signature) {
        return null;
    }
    if (syncfusionOfficeKitClipboardEntryMatches(syncfusionOfficeKitLastCopy, signature)) {
        return syncfusionOfficeKitLastCopy.sfdt;
    }
    try {
        var stored = window.localStorage.getItem(SYNCFUSION_OFFICE_KIT_CLIPBOARD_KEY);
        var entry = stored ? JSON.parse(stored) : null;
        return syncfusionOfficeKitClipboardEntryMatches(entry, signature) ? entry.sfdt : null;
    } catch (error) {
        return null;
    }
}

function syncfusionOfficeKitSfdtFromClipboard(text) {
    if (!text) {
        return null;
    }

    var value = String(text).trim();
    if (value.indexOf(SYNCFUSION_OFFICE_KIT_SFDT_TAG) === 0) {
        value = value.slice(SYNCFUSION_OFFICE_KIT_SFDT_TAG.length).trim();
    }
    if (value.charAt(0) !== "{" || value.indexOf('"sections"') < 0) {
        return null;
    }

    try {
        var parsed = JSON.parse(value);
        return parsed && Array.isArray(parsed.sections) ? value : null;
    } catch (error) {
        return null;
    }
}

function insertSyncfusionOfficeKitCheckBox(editor) {
    var editorModule = (editor && editor.editor) || {};

    if (typeof editorModule.insertFormField === "function") {
        try {
            editorModule.insertFormField("CheckBox");
            return;
        } catch (error) {
            console.warn("insertFormField(CheckBox) that bai, dung ky tu thay the:", error);
        }
    }
    if (typeof editorModule.insertText === "function") {
        // Dung ma ky tu de khong phu thuoc encoding cua file khi deploy (U+2610 = o trong).
        editorModule.insertText(String.fromCharCode(0x2610) + " ");
    }
}

function lockSyncfusionOfficeKitPageScroll(durationMs) {
    var duration = durationMs || 1500;

    if (window.__officeKitScrollLock) {
        window.__officeKitScrollLock.until = Date.now() + duration;
        return;
    }

    var lock = {
        x: window.scrollX,
        y: window.scrollY,
        until: Date.now() + duration,
    };
    window.__officeKitScrollLock = lock;

    var restore = function () {
        if (Date.now() > lock.until) {
            release();
            return;
        }
        if (window.scrollX !== lock.x || window.scrollY !== lock.y) {
            window.scrollTo(lock.x, lock.y);
        }
    };
    var release = function () {
        window.removeEventListener("scroll", restore, true);
        if (window.__officeKitScrollLock === lock) {
            window.__officeKitScrollLock = null;
        }
    };

    window.addEventListener("scroll", restore, true);
    setTimeout(release, duration + 100);
}

function applySyncfusionOfficeKitCellMargin(editor, side, pointValue) {
    var selection = editor && editor.selection;
    var cellFormat = selection ? selection.cellFormat : null;

    if (!cellFormat || !syncfusionOfficeKitSelectionInTable(selection)) {
        return;
    }

    var value = Number(pointValue);
    if (!Number.isFinite(value) || value < 0) {
        return;
    }

    if (side === "top") {
        cellFormat.topMargin = value;
    } else if (side === "bottom") {
        cellFormat.bottomMargin = value;
    } else if (side === "left") {
        cellFormat.leftMargin = value;
    } else if (side === "right") {
        cellFormat.rightMargin = value;
    }
}

function syncfusionOfficeKitSelectionInTable(selection) {
    // contextType luc con tro trong bang la "TableText", "TableImage"...
    return Boolean(selection) && String(selection.contextType || "").indexOf("Table") === 0;
}

// Ribbon da cai du chua (MutationObserver o keepSyncfusionOfficeKitChromePersistent cua mot so du an goi ham nay).
function syncfusionOfficeKitChromeIsComplete() {
    var ribbon = document.getElementById("syncfusion-office-kit-ribbon");
    return !!ribbon && !!ribbon.querySelector(".wk-tabs") && !!ribbon.querySelector("[data-office-kit-panel]");
}

function installSyncfusionOfficeKitRulers(editorContainer) {
    var host = editorContainer && editorContainer.element ? editorContainer.element : document.getElementById("container");
    if (!host) {
        return;
    }

    var editorBody = findSyncfusionOfficeKitEditorBody(host);
    if (!editorBody || !editorBody.parentNode) {
        return;
    }

    host.classList.add("syncfusion-office-kit-rulers-enabled");
    editorBody.classList.add("syncfusion-office-kit-ruler-body");

    var horizontalRuler = host.querySelector(".syncfusion-office-kit-horizontal-ruler");
    if (!horizontalRuler) {
        horizontalRuler = document.createElement("div");
        horizontalRuler.className = "syncfusion-office-kit-horizontal-ruler";
        horizontalRuler.setAttribute("data-office-kit-horizontal-ruler", "true");
        horizontalRuler.innerHTML = [
            '<button type="button" class="syncfusion-office-kit-ruler-corner wk-tab-selector" data-wk-tab-selector><span class="wk-tab-glyph wk-tab-glyph-left"></span></button>',
            '<div class="syncfusion-office-kit-horizontal-ruler-track">',
            '<div class="syncfusion-office-kit-horizontal-ruler-page" data-office-kit-horizontal-ruler-page>',
            '<div class="syncfusion-office-kit-horizontal-margin-zone syncfusion-office-kit-horizontal-margin-left" aria-hidden="true"></div>',
            '<div class="syncfusion-office-kit-horizontal-margin-zone syncfusion-office-kit-horizontal-margin-right" aria-hidden="true"></div>',
            buildSyncfusionOfficeKitHorizontalRulerMarks(),
            '<button type="button" class="syncfusion-office-kit-ruler-handle syncfusion-office-kit-ruler-handle-left" data-office-kit-horizontal-margin="left" title="Lề trái — kéo để chỉnh" aria-label="Lề trái"></button>',
            '<button type="button" class="syncfusion-office-kit-ruler-handle syncfusion-office-kit-ruler-handle-right" data-office-kit-horizontal-margin="right" title="Lề phải — kéo để chỉnh" aria-label="Lề phải"></button>',
            '<button type="button" class="syncfusion-office-kit-indent-handle syncfusion-office-kit-indent-first-line" data-office-kit-horizontal-indent="firstLineIndent" title="Thụt lề dòng đầu" aria-label="Thụt lề dòng đầu"></button>',
            '<button type="button" class="syncfusion-office-kit-indent-handle syncfusion-office-kit-indent-hanging" data-office-kit-horizontal-indent="hangingIndent" title="Thụt lề treo" aria-label="Thụt lề treo"></button>',
            '<button type="button" class="syncfusion-office-kit-indent-handle syncfusion-office-kit-indent-left" data-office-kit-horizontal-indent="leftIndent" title="Thụt lề trái" aria-label="Thụt lề trái"></button>',
            '<button type="button" class="syncfusion-office-kit-indent-handle syncfusion-office-kit-indent-right" data-office-kit-horizontal-indent="rightIndent" title="Thụt lề phải" aria-label="Thụt lề phải"></button>',
            '<span class="syncfusion-office-kit-tab-origin" data-office-kit-horizontal-tab-origin aria-hidden="true"></span>',
            '<button type="button" class="syncfusion-office-kit-tab-stop" data-office-kit-horizontal-tab-stop title="Tab mặc định — kéo để đổi khoảng cách" aria-label="Tab mặc định"></button>',
            '<div class="wk-ruler-cols" data-wk-ruler-cols></div>',
            '<div class="wk-ruler-tabs" data-wk-ruler-tabs></div>',
            '</div>',
            '</div>',
        ].join("");
    }
    editorBody.parentNode.insertBefore(horizontalRuler, editorBody);

    if (!editorBody.querySelector(".syncfusion-office-kit-vertical-ruler")) {
        var verticalRuler = document.createElement("div");
        verticalRuler.className = "syncfusion-office-kit-vertical-ruler";
        verticalRuler.setAttribute("data-office-kit-vertical-ruler", "true");
        verticalRuler.innerHTML = [
            '<div class="syncfusion-office-kit-vertical-ruler-page" data-office-kit-vertical-ruler-page>',
            '<div class="syncfusion-office-kit-vertical-margin-zone syncfusion-office-kit-vertical-margin-top" aria-hidden="true"></div>',
            '<div class="syncfusion-office-kit-vertical-margin-zone syncfusion-office-kit-vertical-margin-bottom" aria-hidden="true"></div>',
            buildSyncfusionOfficeKitVerticalRulerMarks(),
            '<button type="button" class="syncfusion-office-kit-vertical-handle syncfusion-office-kit-vertical-handle-top" data-office-kit-vertical-margin="top" title="Lề trên — kéo để chỉnh" aria-label="Lề trên"></button>',
            '<button type="button" class="syncfusion-office-kit-vertical-handle syncfusion-office-kit-vertical-handle-bottom" data-office-kit-vertical-margin="bottom" title="Lề dưới — kéo để chỉnh" aria-label="Lề dưới"></button>',
            '<div class="wk-ruler-rows" data-wk-ruler-rows></div>',
            '</div>',
        ].join("");
        editorBody.appendChild(verticalRuler);
    }

    if (host.dataset.officeKitRulerListeners !== "true") {
        host.dataset.officeKitRulerListeners = "true";
        host.addEventListener("scroll", function () {
            scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
        }, true);
        window.addEventListener("resize", function () {
            scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
        });
    }

    wireSyncfusionOfficeKitRulerDragging(editorContainer, host, editorBody);
}

// Giong Word: so tren thuoc dem tu le trai (3 2 1 | 1 2 3 ...) chu khong dem tu mep giay.
// Vi tri goc (le) dat qua bien CSS --office-kit-ruler-origin trong updateSyncfusionOfficeKitRulers.
function buildSyncfusionOfficeKitHorizontalRulerMarks() {
    var marks = [];
    for (var index = -12; index <= 32; index += 1) {
        if (index !== 0) {
            marks.push('<span class="syncfusion-office-kit-horizontal-ruler-number" style="--office-kit-ruler-position:' + index + '">' + Math.abs(index) + '</span>');
        }
    }

    return marks.join("");
}

function buildSyncfusionOfficeKitVerticalRulerMarks() {
    var marks = [];
    for (var index = -12; index <= 42; index += 1) {
        if (index !== 0) {
            marks.push('<span class="syncfusion-office-kit-vertical-ruler-number" style="--office-kit-ruler-position:' + index + '">' + Math.abs(index) + '</span>');
        }
    }

    return marks.join("");
}

function scheduleSyncfusionOfficeKitRulerUpdate(editorContainer) {
    var activeContainer = editorContainer || (window.container && window.container.documentEditor ? window.container : null);
    if (!activeContainer) {
        return;
    }

    // Cuon trang ban ra hang chuc su kien/giay; truoc day moi su kien dat 4 hen gio khong bao gio
    // huy -> cuon hop dong dai la hang tram lan do lai bo cuc (giat). Nay gop ve toi da 1 lan moi
    // khung hinh + 1 lan sau khi editor dung yen (cho bo cuc on dinh sau khi mo van ban).
    if (!activeContainer.officeKitRulerFrame) {
        var runFrame = function () {
            activeContainer.officeKitRulerFrame = 0;
            updateSyncfusionOfficeKitRulers(activeContainer);
        };
        activeContainer.officeKitRulerFrame = typeof window.requestAnimationFrame === "function"
            ? window.requestAnimationFrame(runFrame)
            : setTimeout(runFrame, 16);
    }

    if (activeContainer.officeKitRulerTimer) {
        clearTimeout(activeContainer.officeKitRulerTimer);
    }
    activeContainer.officeKitRulerTimer = setTimeout(function () {
        activeContainer.officeKitRulerTimer = 0;
        updateSyncfusionOfficeKitRulers(activeContainer);
    }, 450);
}

function updateSyncfusionOfficeKitRulers(editorContainer) {
    var host = editorContainer && editorContainer.element ? editorContainer.element : document.getElementById("container");
    var editor = editorContainer && editorContainer.documentEditor ? editorContainer.documentEditor : null;
    if (!host || !editor) {
        return;
    }

    var horizontalRuler = host.querySelector(".syncfusion-office-kit-horizontal-ruler");
    var horizontalTrack = host.querySelector(".syncfusion-office-kit-horizontal-ruler-track");
    var horizontalPage = host.querySelector("[data-office-kit-horizontal-ruler-page]");
    var editorBody = findSyncfusionOfficeKitEditorBody(host);
    var verticalRuler = editorBody ? editorBody.querySelector(".syncfusion-office-kit-vertical-ruler") : null;
    var verticalPage = editorBody ? editorBody.querySelector("[data-office-kit-vertical-ruler-page]") : null;

    if (!horizontalRuler || !horizontalTrack || !horizontalPage || !editorBody || !verticalRuler || !verticalPage) {
        return;
    }

    wireSyncfusionOfficeKitRulerDragging(editorContainer, host, editorBody);

    var sectionFormat = editor.selection && editor.selection.sectionFormat ? editor.selection.sectionFormat : {};
    var pageWidth = syncfusionOfficeKitPositiveNumber(sectionFormat.pageWidth, syncfusionOfficeKitDefaultSectionFormat.pageWidth);
    var pageHeight = syncfusionOfficeKitPositiveNumber(sectionFormat.pageHeight, syncfusionOfficeKitDefaultSectionFormat.pageHeight);
    var leftMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.leftMargin, syncfusionOfficeKitDefaultSectionFormat.leftMargin);
    var rightMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.rightMargin, syncfusionOfficeKitDefaultSectionFormat.rightMargin);
    var topMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.topMargin, syncfusionOfficeKitDefaultSectionFormat.topMargin);
    var bottomMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.bottomMargin, syncfusionOfficeKitDefaultSectionFormat.bottomMargin);
    var paragraphFormat = editor.selection && editor.selection.paragraphFormat ? editor.selection.paragraphFormat : {};
    var leftIndent = Number(paragraphFormat.leftIndent) || 0;
    var rightIndent = Number(paragraphFormat.rightIndent) || 0;
    var firstLineIndent = Number(paragraphFormat.firstLineIndent) || 0;
    // Trong bang: thut le / tab tinh theo o dang dung (giong Word), khong theo le trang.
    var textBox = getWordKitRulerTextBox(editor);
    var tableInfo = textBox.table;
    var leftIndentPoint = syncfusionOfficeKitClampNumber(textBox.left + leftIndent, 0, pageWidth);
    var firstLineIndentPoint = syncfusionOfficeKitClampNumber(textBox.left + leftIndent + firstLineIndent, 0, pageWidth);
    var rightIndentPoint = syncfusionOfficeKitClampNumber(textBox.right - rightIndent, leftIndentPoint, pageWidth);
    var tabOriginPoint = firstLineIndentPoint;
    var defaultTabWidth = Math.max(Number(editor.documentHelper && editor.documentHelper.defaultTabWidth) || 36, syncfusionOfficeKitCentimetersToPoints(0.1));
    var tabStopPoint = syncfusionOfficeKitClampNumber(tabOriginPoint + defaultTabWidth, tabOriginPoint, pageWidth);
    var fallbackPageWidth = syncfusionOfficeKitPointsToPixels(pageWidth, editorContainer);
    var fallbackPageHeight = syncfusionOfficeKitPointsToPixels(pageHeight, editorContainer);
    // Toa do trang lay thang tu Syncfusion; cach do DOM cu chi la du phong (truoc day thuoc lech ~20px).
    var pageBounds = getWordKitPageScreenRect(editor) || findSyncfusionOfficeKitVisiblePageBounds(host, pageWidth, pageHeight, fallbackPageWidth, fallbackPageHeight);
    var trackBounds = horizontalTrack.getBoundingClientRect();
    var bodyBounds = editorBody.getBoundingClientRect();
    var pageWidthPx = Math.max(pageBounds ? pageBounds.width : fallbackPageWidth, 1);
    var pageHeightPx = Math.max(pageBounds ? pageBounds.height : fallbackPageHeight, 1);
    var pageLeftPx = pageBounds ? pageBounds.left - trackBounds.left : Math.max((trackBounds.width - pageWidthPx) / 2, 0);
    var pageTopPx = pageBounds ? pageBounds.top - bodyBounds.top : 0;
    var pageWidthCm = Math.max(syncfusionOfficeKitPointsToCentimeters(pageWidth), 0.1);
    var pageHeightCm = Math.max(syncfusionOfficeKitPointsToCentimeters(pageHeight), 0.1);
    var dragging = horizontalPage.classList.contains("wk-ruler-dragging") || verticalPage.classList.contains("wk-ruler-dragging");

    horizontalTrack.style.setProperty("--office-kit-ruler-page-left", Math.round(pageLeftPx * 100) / 100 + "px");
    horizontalTrack.style.setProperty("--office-kit-ruler-page-width", Math.round(pageWidthPx * 100) / 100 + "px");
    horizontalPage.style.setProperty("--office-kit-ruler-centimeter-width", Math.round((pageWidthPx / pageWidthCm) * 100) / 100 + "px");
    horizontalPage.style.setProperty("--office-kit-ruler-origin", Math.round(pageWidthPx * leftMargin / pageWidth * 100) / 100 + "px");
    verticalRuler.style.setProperty("--office-kit-ruler-page-top", Math.round(pageTopPx * 100) / 100 + "px");
    verticalRuler.style.setProperty("--office-kit-ruler-page-height", Math.round(pageHeightPx * 100) / 100 + "px");
    verticalPage.style.setProperty("--office-kit-ruler-centimeter-height", Math.round((pageHeightPx / pageHeightCm) * 100) / 100 + "px");
    verticalPage.style.setProperty("--office-kit-ruler-origin-y", Math.round(pageHeightPx * topMargin / pageHeight * 100) / 100 + "px");
    updateWordKitTableHandle(editor, tableInfo, pageBounds, pageWidth, pageHeight, editorBody);

    // Dang keo mot vach tren thuoc: chi cap nhat vi tri trang (cuon), khong ghi de vach dang keo.
    if (dragging) {
        return;
    }

    // Trong bang, vung trang chi la o dang dung (cac o khac to xam): nhin la biet bam vao dau de
    // dat tab / keo thut le. Mau phieu cong chung hay dung bang khong vien de dan trang, nguoi dung
    // khong biet con tro dang o trong o hep nao.
    horizontalPage.style.setProperty("--office-kit-ruler-left-margin", syncfusionOfficeKitPointPercent(tableInfo ? textBox.left : leftMargin, pageWidth) + "%");
    horizontalPage.style.setProperty("--office-kit-ruler-right-margin", syncfusionOfficeKitPointPercent(tableInfo ? pageWidth - textBox.right : rightMargin, pageWidth) + "%");
    horizontalPage.classList.toggle("wk-ruler-in-table", !!tableInfo);
    verticalPage.classList.toggle("wk-ruler-in-table", !!tableInfo);
    var leftMarginHandle = horizontalPage.querySelector(".syncfusion-office-kit-ruler-handle-left");
    var rightMarginHandle = horizontalPage.querySelector(".syncfusion-office-kit-ruler-handle-right");
    var firstLineIndentHandle = horizontalPage.querySelector(".syncfusion-office-kit-indent-first-line");
    var leftIndentHandle = horizontalPage.querySelector(".syncfusion-office-kit-indent-left");
    var hangingIndentHandle = horizontalPage.querySelector(".syncfusion-office-kit-indent-hanging");
    var rightIndentHandle = horizontalPage.querySelector(".syncfusion-office-kit-indent-right");
    var tabOriginHandle = horizontalPage.querySelector("[data-office-kit-horizontal-tab-origin]");
    var tabStopHandle = horizontalPage.querySelector("[data-office-kit-horizontal-tab-stop]");
    if (leftMarginHandle) {
        leftMarginHandle.style.left = syncfusionOfficeKitPointPercent(leftMargin, pageWidth) + "%";
    }
    if (rightMarginHandle) {
        rightMarginHandle.style.left = 100 - syncfusionOfficeKitPointPercent(rightMargin, pageWidth) + "%";
    }
    if (firstLineIndentHandle) {
        firstLineIndentHandle.style.left = syncfusionOfficeKitPointPercent(firstLineIndentPoint, pageWidth) + "%";
    }
    if (leftIndentHandle) {
        leftIndentHandle.style.left = syncfusionOfficeKitPointPercent(leftIndentPoint, pageWidth) + "%";
    }
    if (hangingIndentHandle) {
        hangingIndentHandle.style.left = syncfusionOfficeKitPointPercent(leftIndentPoint, pageWidth) + "%";
    }
    if (rightIndentHandle) {
        rightIndentHandle.style.left = syncfusionOfficeKitPointPercent(rightIndentPoint, pageWidth) + "%";
    }
    if (tabOriginHandle) {
        tabOriginHandle.style.left = syncfusionOfficeKitPointPercent(tabOriginPoint, pageWidth) + "%";
    }
    if (tabStopHandle) {
        tabStopHandle.style.left = syncfusionOfficeKitPointPercent(tabStopPoint, pageWidth) + "%";
    }
    renderWordKitRulerColumns(horizontalPage, tableInfo, pageWidth);
    renderWordKitRulerTabs(horizontalPage, editor, textBox, pageWidth);

    verticalPage.style.setProperty("--office-kit-ruler-top-margin", syncfusionOfficeKitPointPercent(topMargin, pageHeight) + "%");
    verticalPage.style.setProperty("--office-kit-ruler-bottom-margin", syncfusionOfficeKitPointPercent(bottomMargin, pageHeight) + "%");
    var topMarginHandle = verticalPage.querySelector(".syncfusion-office-kit-vertical-handle-top");
    var bottomMarginHandle = verticalPage.querySelector(".syncfusion-office-kit-vertical-handle-bottom");
    if (topMarginHandle) {
        topMarginHandle.style.top = syncfusionOfficeKitPointPercent(topMargin, pageHeight) + "%";
    }
    if (bottomMarginHandle) {
        bottomMarginHandle.style.top = 100 - syncfusionOfficeKitPointPercent(bottomMargin, pageHeight) + "%";
    }
    renderWordKitRulerRows(verticalPage, tableInfo, pageHeight);

    updateSyncfusionOfficeKitLayoutControls(editorContainer);
}

// Vi tri trang tren man hinh, lay tu so do bo cuc cua Syncfusion: pages[i].boundingRectangle tinh
// trong vung cuon cua viewerContainer. Uu tien trang chua con tro; trang do dang khuat thi lay
// trang dang hien nhieu nhat.
function getWordKitPageScreenRect(editor) {
    var helper = editor && editor.documentHelper;
    var viewer = helper && helper.viewerContainer;
    if (!helper || !viewer || !helper.pages || !helper.pages.length) {
        return null;
    }

    var viewerRect = viewer.getBoundingClientRect();
    var zoom = Number(helper.zoomFactor) || 1;
    var gap = Number(editor.viewer && editor.viewer.pageGap) || 0;
    // Cung cong thuc voi viewer.findFocusedPage cua Syncfusion: x da la toa do man hinh, con
    // y / rong / cao luu o ty le 100% -> phai nhan thu phong (khoang cach giua trang khong nhan).
    var toScreen = function (page) {
        var rect = page && page.boundingRectangle;
        var index = page ? helper.pages.indexOf(page) : -1;
        if (!rect || index < 0 || !(rect.width > 0) || !(rect.height > 0)) {
            return null;
        }
        var gaps = gap * (index + 1);
        var width = rect.width * zoom;
        var height = rect.height * zoom;
        var left = viewerRect.left + viewer.clientLeft + rect.x - viewer.scrollLeft;
        var top = viewerRect.top + viewer.clientTop + (rect.y - gaps) * zoom + gaps - viewer.scrollTop;
        return { left: left, top: top, width: width, height: height, right: left + width, bottom: top + height };
    };

    var cursorPage = null;
    try {
        cursorPage = getWordKitSelectionStartParagraph(editor).bodyWidget.page;
    } catch (error) {
        cursorPage = null;
    }
    var cursorRect = toScreen(cursorPage);
    if (cursorRect && cursorRect.bottom > viewerRect.top && cursorRect.top < viewerRect.bottom) {
        return cursorRect;
    }

    var best = null;
    var bestVisible = 0;
    helper.pages.forEach(function (page) {
        var rect = toScreen(page);
        if (!rect) {
            return;
        }
        var visible = Math.min(rect.bottom, viewerRect.bottom) - Math.max(rect.top, viewerRect.top);
        if (visible > bestVisible) {
            bestVisible = visible;
            best = rect;
        }
    });
    return best || cursorRect;
}

function getWordKitSelectionStartParagraph(editor) {
    var selection = editor && editor.selection;
    if (!selection || !selection.start) {
        return null;
    }
    var start = selection.isForward === false && selection.end ? selection.end : selection.start;
    return start.paragraph || null;
}

// Con tro trong bang: ranh gioi cot cua hang hien tai (thuoc ngang) va ranh gioi cac hang cua bang
// tren trang nay (thuoc doc). Toa do bo cuc Syncfusion la px (96dpi) tinh tu goc trang -> doi ra pt.
function getWordKitRulerTableInfo(editor) {
    var paragraph = getWordKitSelectionStartParagraph(editor);
    var cell = paragraph && paragraph.isInsideTable ? paragraph.associatedCell : null;
    var row = cell ? cell.ownerRow : null;
    var table = cell ? cell.ownerTable : null;
    if (!cell || !row || !table || !row.childWidgets || !row.childWidgets.length) {
        return null;
    }

    var pxToPt = 0.75;
    var cells = row.childWidgets;
    var first = cells[0];
    var columns = [{ point: (first.x - first.margin.left) * pxToPt, column: first.columnIndex }];
    cells.forEach(function (item, index) {
        var next = cells[index + 1];
        columns.push({
            point: (item.x + item.width + item.margin.right) * pxToPt,
            column: next ? next.columnIndex : item.columnIndex + ((item.cellFormat && item.cellFormat.columnSpan) || 1),
        });
    });

    var rows = [];
    (table.childWidgets || []).forEach(function (tableRow) {
        if (typeof tableRow.y === "number" && typeof tableRow.height === "number") {
            rows.push({ top: tableRow.y * pxToPt, bottom: (tableRow.y + tableRow.height) * pxToPt, row: tableRow });
        }
    });

    return {
        cell: cell,
        row: row,
        table: table,
        columns: columns,
        rows: rows,
        contentLeft: cell.x * pxToPt,
        contentRight: (cell.x + cell.width) * pxToPt,
    };
}

// Vung chu ma thut le / tab tinh theo: le trang, hoac noi dung o neu con tro trong bang.
function getWordKitRulerTextBox(editor) {
    var sectionFormat = editor && editor.selection && editor.selection.sectionFormat ? editor.selection.sectionFormat : {};
    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var leftMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.leftMargin, syncfusionOfficeKitDefaultSectionFormat.leftMargin);
    var rightMargin = syncfusionOfficeKitNonNegativeNumber(sectionFormat.rightMargin, syncfusionOfficeKitDefaultSectionFormat.rightMargin);
    var table = null;
    try {
        table = getWordKitRulerTableInfo(editor);
    } catch (error) {
        table = null;
    }
    if (table) {
        return { left: table.contentLeft, right: table.contentRight, table: table };
    }
    return { left: leftMargin, right: pageWidth - rightMargin, table: null };
}

function renderWordKitRulerColumns(horizontalPage, tableInfo, pageWidth) {
    var layer = horizontalPage.querySelector("[data-wk-ruler-cols]");
    if (!layer) {
        return;
    }
    var signature = tableInfo ? tableInfo.columns.map(function (item) { return item.point.toFixed(2); }).join(",") + "/" + pageWidth : "";
    if (layer.getAttribute("data-wk-signature") === signature) {
        return;
    }
    layer.setAttribute("data-wk-signature", signature);
    layer.innerHTML = tableInfo ? tableInfo.columns.map(function (item, index) {
        return '<span class="wk-ruler-col" data-wk-col="' + index + '" style="left:' + syncfusionOfficeKitPointPercent(item.point, pageWidth) + '%" title="Kéo để đổi độ rộng cột"></span>';
    }).join("") : "";
}

function renderWordKitRulerRows(verticalPage, tableInfo, pageHeight) {
    var layer = verticalPage.querySelector("[data-wk-ruler-rows]");
    if (!layer) {
        return;
    }
    var signature = tableInfo ? tableInfo.rows.map(function (item) { return item.top.toFixed(1) + "-" + item.bottom.toFixed(1); }).join(",") + "/" + pageHeight : "";
    if (layer.getAttribute("data-wk-signature") === signature) {
        return;
    }
    layer.setAttribute("data-wk-signature", signature);
    if (!tableInfo || !tableInfo.rows.length) {
        layer.innerHTML = "";
        return;
    }
    // Moc tren cung (dau bang) chi de nhin; moi moc duoi hang keo duoc de doi chieu cao hang do.
    var marks = ['<span class="wk-ruler-row wk-ruler-row-fixed" style="top:' + syncfusionOfficeKitPointPercent(tableInfo.rows[0].top, pageHeight) + '%"></span>'];
    tableInfo.rows.forEach(function (item, index) {
        marks.push('<span class="wk-ruler-row" data-wk-row="' + index + '" style="top:' + syncfusionOfficeKitPointPercent(item.bottom, pageHeight) + '%" title="Kéo để đổi chiều cao hàng"></span>');
    });
    layer.innerHTML = marks.join("");
}

// Nut ⊕ o goc tren trai bang (nhu Word): bam de chon ca bang.
function updateWordKitTableHandle(editor, tableInfo, pageBounds, pageWidth, pageHeight, editorBody) {
    var handle = document.getElementById("wk-table-handle");
    var viewer = editor && editor.documentHelper ? editor.documentHelper.viewerContainer : null;
    if (!tableInfo || !pageBounds || !viewer || !editorBody || !tableInfo.rows.length) {
        if (handle) {
            handle.hidden = true;
        }
        return;
    }
    if (!handle) {
        handle = document.createElement("button");
        handle.type = "button";
        handle.id = "wk-table-handle";
        handle.className = "wk-table-handle";
        handle.title = "Chọn cả bảng";
        handle.setAttribute("aria-label", "Chọn cả bảng");
        handle.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13M8 1.5L6.2 3.3M8 1.5l1.8 1.8M8 14.5l-1.8-1.8M8 14.5l1.8-1.8M1.5 8l1.8-1.8M1.5 8l1.8 1.8M14.5 8l-1.8-1.8M14.5 8l-1.8 1.8"/></svg>';
        handle.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });
        handle.addEventListener("click", function () {
            var activeEditor = getSyncfusionOfficeKitEditor(window.container);
            if (activeEditor && activeEditor.selection && typeof activeEditor.selection.selectTable === "function") {
                activeEditor.selection.selectTable();
            }
        });
    }
    // Nam trong khung soan (position:absolute) de cuon ca trang web thi nut di theo bang.
    if (handle.parentNode !== editorBody) {
        editorBody.appendChild(handle);
    }

    var left = pageBounds.left + (tableInfo.columns[0].point / pageWidth) * pageBounds.width;
    var top = pageBounds.top + (tableInfo.rows[0].top / pageHeight) * pageBounds.height;
    var viewerRect = viewer.getBoundingClientRect();
    var visible = top - 18 >= viewerRect.top && top <= viewerRect.bottom && left - 18 >= viewerRect.left && left <= viewerRect.right;
    handle.hidden = !visible;
    if (visible) {
        var bodyRect = editorBody.getBoundingClientRect();
        handle.style.left = Math.round(left - 19 - bodyRect.left) + "px";
        handle.style.top = Math.round(top - 19 - bodyRect.top) + "px";
    }
}

function getWordKitParagraphTabs(paragraph) {
    var format = paragraph && paragraph.paragraphFormat;
    if (!format) {
        return [];
    }
    var tabs = [];
    try {
        tabs = typeof format.getUpdatedTabs === "function" ? format.getUpdatedTabs() : [];
    } catch (error) {
        tabs = [];
    }
    // getUpdatedTabs tra rong khi doan khong co kieu goc -> lay tab rieng cua doan.
    if (!tabs.length && Array.isArray(format.tabs)) {
        tabs = format.tabs.filter(function (tab) {
            return tab.position !== 0 && !tab.deletePosition;
        });
    }
    return tabs.map(function (tab) {
        return { position: Number(tab.position) || 0, type: tab.tabJustification || "Left" };
    }).filter(function (tab) {
        return tab.position > 0;
    });
}

function renderWordKitRulerTabs(horizontalPage, editor, textBox, pageWidth) {
    var layer = horizontalPage.querySelector("[data-wk-ruler-tabs]");
    if (!layer) {
        return;
    }
    var tabs = getWordKitParagraphTabs(getWordKitSelectionStartParagraph(editor));
    var signature = textBox.left.toFixed(2) + "/" + pageWidth + "/" + tabs.map(function (tab) { return tab.position.toFixed(2) + tab.type; }).join(",");
    if (layer.getAttribute("data-wk-signature") === signature) {
        return;
    }
    layer.setAttribute("data-wk-signature", signature);
    layer.innerHTML = tabs.map(function (tab) {
        var name = wordKitTabNames[tab.type] || "Tab";
        var centimeters = (Math.round(syncfusionOfficeKitPointsToCentimeters(tab.position) * 100) / 100).toString().replace(".", ",");
        return '<span class="wk-ruler-tab wk-ruler-tab-' + String(tab.type).toLowerCase() + '" data-wk-tab-pos="' + tab.position + '" data-wk-tab-type="' + tab.type + '"'
            + ' style="left:' + syncfusionOfficeKitPointPercent(textBox.left + tab.position, pageWidth) + '%"'
            + ' title="' + name + " " + centimeters + ' cm — kéo để dời, kéo xuống khỏi thước để xóa"></span>';
    }).join("");
}

function findSyncfusionOfficeKitVisiblePageBounds(host, pageWidth, pageHeight, fallbackWidth, fallbackHeight) {
    var expectedRatio = pageWidth / Math.max(pageHeight, 1);
    var editorBody = findSyncfusionOfficeKitEditorBody(host);
    var bodyBounds = editorBody && typeof editorBody.getBoundingClientRect === "function" ? editorBody.getBoundingClientRect() : null;

    // Lan truoc da tim ra phan tu trang: con dung duoc thi lay luon, khoi quet ca cay DOM +
    // getComputedStyle tung phan tu (ton nhat trong cap nhat thuoc, chay moi khung hinh khi cuon).
    var cached = host.officeKitPageElement;
    if (cached && cached.isConnected) {
        var cachedBounds = cached.getBoundingClientRect();
        if (cachedBounds.width > 120
            && cachedBounds.height > 160
            && Math.abs(cachedBounds.width / Math.max(cachedBounds.height, 1) - expectedRatio) < 0.35
            && Math.abs(cachedBounds.width - fallbackWidth) / Math.max(fallbackWidth, 1) < 0.75
            && (!bodyBounds || syncfusionOfficeKitRectsIntersect(cachedBounds, bodyBounds))) {
            return cachedBounds;
        }
    }

    var candidates = Array.prototype.slice.call(host.querySelectorAll("canvas, [class*='page'], [id*='page'], [class*='Page'], [id*='Page']"));
    var scored = candidates
        .filter(function (element) {
            if (!(element instanceof HTMLElement) && !(element instanceof HTMLCanvasElement)) {
                return false;
            }

            var marker = String(element.className || "") + " " + String(element.id || "");
            if (/(office-kit|setup|pagenumber|page-number|page-break|statusbar|toolbar|button|dialog|tab|header|footer|ruler)/i.test(marker)) {
                return false;
            }

            var bounds = element.getBoundingClientRect();
            if (bounds.width <= 0 || bounds.height <= 0) {
                return false;
            }

            if (bodyBounds && !syncfusionOfficeKitRectsIntersect(bounds, bodyBounds)) {
                return false;
            }

            var style = window.getComputedStyle ? window.getComputedStyle(element) : null;
            return !style || (style.display !== "none" && style.visibility !== "hidden");
        })
        .map(function (element) {
            var bounds = element.getBoundingClientRect();
            var ratio = bounds.width / Math.max(bounds.height, 1);
            var ratioDifference = Math.abs(ratio - expectedRatio);
            var widthDifference = Math.abs(bounds.width - fallbackWidth) / Math.max(fallbackWidth, 1);
            var heightDifference = Math.abs(bounds.height - fallbackHeight) / Math.max(fallbackHeight, 1);
            var marker = String(element.className || "") + " " + String(element.id || "");
            var parentMarker = element.parentElement ? String(element.parentElement.className || "") + " " + String(element.parentElement.id || "") : "";
            var canvasBonus = element.tagName && element.tagName.toLowerCase() === "canvas" ? -0.25 : 0;
            var pageMarkerBonus = /(page|canvas)/i.test(marker + " " + parentMarker) ? -0.1 : 0.25;

            return {
                element: element,
                bounds: bounds,
                score: (ratioDifference * 4) + widthDifference + heightDifference + canvasBonus + pageMarkerBonus,
                ratioDifference: ratioDifference,
                widthDifference: widthDifference,
                heightDifference: heightDifference,
            };
        })
        .filter(function (candidate) {
            return candidate.bounds.width > 120
                && candidate.bounds.height > 160
                && candidate.ratioDifference < 0.35
                && candidate.widthDifference < 0.75
                && candidate.heightDifference < 0.75;
        })
        .sort(function (first, second) {
            return first.score - second.score;
        });

    host.officeKitPageElement = scored.length ? scored[0].element : null;
    return scored.length ? scored[0].bounds : null;
}

function syncfusionOfficeKitRectsIntersect(first, second) {
    return first.left < second.right
        && first.right > second.left
        && first.top < second.bottom
        && first.bottom > second.top;
}

function findSyncfusionOfficeKitEditorBody(host) {
    if (!host) {
        return null;
    }

    return host.querySelector("#documenteditor_container_body")
        || host.querySelector("#container_container_body")
        || host.querySelector("[id$='_container_body']")
        || host.querySelector(".e-de-ctn")
        || document.getElementById("documenteditor_container_body")
        || document.getElementById("container_container_body");
}

function syncfusionOfficeKitPositiveNumber(value, fallback) {
    var numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function syncfusionOfficeKitNonNegativeNumber(value, fallback) {
    var numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

function syncfusionOfficeKitPointsToPixels(points, editorContainer) {
    var editor = editorContainer && editorContainer.documentEditor ? editorContainer.documentEditor : null;
    var zoomFactor = Number(editor && (editor.zoomFactor || (editor.viewer && editor.viewer.zoomFactor))) || 1;

    return points * (96 / 72) * zoomFactor;
}

function syncfusionOfficeKitPointsToCentimeters(points) {
    return points / 28.3464566929;
}

function syncfusionOfficeKitPointPercent(point, pageSize) {
    return Math.max(0, Math.min(100, (point / Math.max(pageSize, 1)) * 100));
}

function syncfusionOfficeKitClampNumber(value, min, max) {
    var numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return min;
    }

    return Math.min(max, Math.max(min, numericValue));
}

function syncfusionOfficeKitRoundPoint(value) {
    return Math.round(Number(value) * 100) / 100;
}

function syncfusionOfficeKitSectionPageWidth(sectionFormat) {
    return syncfusionOfficeKitPositiveNumber(sectionFormat && sectionFormat.pageWidth, syncfusionOfficeKitDefaultSectionFormat.pageWidth);
}

function syncfusionOfficeKitSectionPageHeight(sectionFormat) {
    return syncfusionOfficeKitPositiveNumber(sectionFormat && sectionFormat.pageHeight, syncfusionOfficeKitDefaultSectionFormat.pageHeight);
}

function syncfusionOfficeKitFirstLineStartPoint(sectionFormat, paragraphFormat) {
    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var leftMargin = Number(sectionFormat && sectionFormat.leftMargin) || 0;
    var leftIndent = Number(paragraphFormat && paragraphFormat.leftIndent) || 0;
    var firstLineIndent = Number(paragraphFormat && paragraphFormat.firstLineIndent) || 0;

    return syncfusionOfficeKitClampNumber(leftMargin + leftIndent + firstLineIndent, 0, pageWidth);
}

function syncfusionOfficeKitPointFromTrackX(clientX, track, pageWidth) {
    if (!track || typeof track.getBoundingClientRect !== "function") {
        return null;
    }

    var trackBounds = track.getBoundingClientRect();
    if (trackBounds.width <= 0) {
        return null;
    }

    return syncfusionOfficeKitClampNumber((clientX - trackBounds.left) / trackBounds.width, 0, 1) * pageWidth;
}

function syncfusionOfficeKitPointFromTrackY(clientY, track, pageHeight) {
    if (!track || typeof track.getBoundingClientRect !== "function") {
        return null;
    }

    var trackBounds = track.getBoundingClientRect();
    if (trackBounds.height <= 0) {
        return null;
    }

    return syncfusionOfficeKitClampNumber((clientY - trackBounds.top) / trackBounds.height, 0, 1) * pageHeight;
}

function getSyncfusionOfficeKitActiveContainer(editorContainer) {
    if (editorContainer && editorContainer.documentEditor) {
        return editorContainer;
    }

    return window.container && window.container.documentEditor ? window.container : null;
}

function applySyncfusionOfficeKitSectionFormat(editorContainer, values) {
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var editor = activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null;

    if (!editor || !editor.selection || !editor.selection.sectionFormat) {
        return false;
    }

    Object.keys(values || {}).forEach(function (key) {
        var numericValue = Number(values[key]);
        if (Number.isFinite(numericValue)) {
            editor.selection.sectionFormat[key] = numericValue;
        }
    });

    syncfusionOfficeKitRefreshEditorLayout(activeContainer, editor);

    scheduleSyncfusionOfficeKitRulerUpdate(activeContainer);
    updateSyncfusionOfficeKitLayoutControls(activeContainer);

    return true;
}

function applySyncfusionOfficeKitParagraphFormat(editorContainer, property, value) {
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var editor = activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null;

    if (!editor || !editor.selection || !editor.selection.paragraphFormat) {
        return false;
    }

    var numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return false;
    }

    // Syncfusion tu dan lai dung doan bi doi; khong can dan trang ca van ban.
    editor.selection.paragraphFormat[property] = numericValue;
    if (editor.focusIn) {
        editor.focusIn();
    }

    scheduleSyncfusionOfficeKitRulerUpdate(activeContainer);
    updateSyncfusionOfficeKitLayoutControls(activeContainer);

    return true;
}

function applySyncfusionOfficeKitHorizontalMargin(editorContainer, marginName, clientX, track) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    var sectionFormat = editor && editor.selection ? editor.selection.sectionFormat : null;

    if ((marginName !== "left" && marginName !== "right") || !sectionFormat) {
        return false;
    }

    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var point = syncfusionOfficeKitPointFromTrackX(clientX, track, pageWidth);

    if (point === null) {
        return false;
    }

    var rawMargin = marginName === "right" ? pageWidth - point : point;
    var margin = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(rawMargin, 0, pageWidth * syncfusionOfficeKitRulerMaxMarginRatio));
    var values = {};
    values[marginName + "Margin"] = margin;

    return applySyncfusionOfficeKitSectionFormat(editorContainer, values);
}

function applySyncfusionOfficeKitVerticalMargin(editorContainer, marginName, clientY, track) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    var sectionFormat = editor && editor.selection ? editor.selection.sectionFormat : null;

    if ((marginName !== "top" && marginName !== "bottom") || !sectionFormat) {
        return false;
    }

    var pageHeight = syncfusionOfficeKitSectionPageHeight(sectionFormat);
    var point = syncfusionOfficeKitPointFromTrackY(clientY, track, pageHeight);

    if (point === null) {
        return false;
    }

    var rawMargin = marginName === "bottom" ? pageHeight - point : point;
    var margin = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(rawMargin, 0, pageHeight * syncfusionOfficeKitRulerMaxMarginRatio));
    var values = {};
    values[marginName + "Margin"] = margin;

    return applySyncfusionOfficeKitSectionFormat(editorContainer, values);
}

function applySyncfusionOfficeKitHorizontalIndent(editorContainer, indentName, clientX, track) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    var sectionFormat = editor && editor.selection ? editor.selection.sectionFormat : null;
    var paragraphFormat = editor && editor.selection ? editor.selection.paragraphFormat : null;

    if (!sectionFormat || !paragraphFormat) {
        return false;
    }

    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var point = syncfusionOfficeKitPointFromTrackX(clientX, track, pageWidth);

    if (point === null) {
        return false;
    }

    // Trong bang thut le tinh tu mep noi dung o, ngoai bang tinh tu le trang.
    var textBox = getWordKitRulerTextBox(editor);
    var textWidth = Math.max(textBox.right - textBox.left, 1);
    var leftIndent = Number(paragraphFormat.leftIndent) || 0;
    var value = null;

    if (indentName === "hangingIndent") {
        var firstLineIndent = Number(paragraphFormat.firstLineIndent) || 0;
        var firstLineAbsolute = leftIndent + firstLineIndent;
        var newLeft = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(point - textBox.left, 0, textWidth));
        applySyncfusionOfficeKitParagraphFormat(editorContainer, "leftIndent", newLeft);
        return applySyncfusionOfficeKitParagraphFormat(editorContainer, "firstLineIndent", syncfusionOfficeKitRoundPoint(firstLineAbsolute - newLeft));
    } else if (indentName === "leftIndent") {
        value = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(point - textBox.left, 0, textWidth));
    } else if (indentName === "rightIndent") {
        value = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(textBox.right - point, 0, textWidth));
    } else if (indentName === "firstLineIndent") {
        value = syncfusionOfficeKitRoundPoint(syncfusionOfficeKitClampNumber(point - textBox.left - leftIndent, -leftIndent, textWidth - leftIndent));
    } else {
        return false;
    }

    return applySyncfusionOfficeKitParagraphFormat(editorContainer, indentName, value);
}

function applySyncfusionOfficeKitHorizontalTabStop(editorContainer, clientX, track) {
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var editor = activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null;
    var sectionFormat = editor && editor.selection ? editor.selection.sectionFormat : null;
    var paragraphFormat = editor && editor.selection ? editor.selection.paragraphFormat : null;

    if (!editor || !sectionFormat || !editor.documentHelper) {
        return false;
    }

    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var point = syncfusionOfficeKitPointFromTrackX(clientX, track, pageWidth);

    if (point === null) {
        return false;
    }

    var tabOriginPoint = syncfusionOfficeKitFirstLineStartPoint(sectionFormat, paragraphFormat);
    var minimumTabWidth = syncfusionOfficeKitCentimetersToPoints(0.1);
    var tabWidth = syncfusionOfficeKitClampNumber(point - tabOriginPoint, minimumTabWidth, Math.max(pageWidth - tabOriginPoint, minimumTabWidth));

    editor.documentHelper.defaultTabWidth = syncfusionOfficeKitRoundPoint(tabWidth);
    syncfusionOfficeKitRefreshEditorLayout(activeContainer, editor);
    scheduleSyncfusionOfficeKitRulerUpdate(activeContainer);
    updateSyncfusionOfficeKitLayoutControls(activeContainer);

    return true;
}

// ---------------------------------------------------------------------------
// Keo tren thuoc (giong Word): trong luc keo chi doi vach + hien duong cham doc/ngang xuyen van ban
// de dong vi tri; tha chuot moi ap dung 1 lan. Truoc day moi lan di chuot deu ap dinh dang va dan
// trang lai ca van ban -> keo thuoc rat giat.
// ---------------------------------------------------------------------------
var wordKitTabType = "Left";
var wordKitTabTypes = ["Left", "Center", "Right"];
var wordKitTabNames = { Left: "Tab trái", Center: "Tab giữa", Right: "Tab phải", Decimal: "Tab thập phân", Bar: "Tab vạch" };
// Tab moi bat vao luoi 0,25 cm tinh tu le (giu Alt de dat tu do).
var wordKitTabSnap = 7.0866;
var wordKitMinimumColumn = 14.17;
var wordKitMinimumRow = 8.5;

function wireSyncfusionOfficeKitRulerDragging(editorContainer, host, editorBody) {
    if (!host) {
        return;
    }

    var horizontalPage = host.querySelector("[data-office-kit-horizontal-ruler-page]");
    var verticalPage = editorBody ? editorBody.querySelector("[data-office-kit-vertical-ruler-page]") : null;
    if (horizontalPage && horizontalPage.dataset.wkRulerWired !== "true") {
        horizontalPage.dataset.wkRulerWired = "true";
        horizontalPage.addEventListener("pointerdown", function (event) {
            beginWordKitRulerDrag(editorContainer, horizontalPage, "x", event);
        });
    }
    if (verticalPage && verticalPage.dataset.wkRulerWired !== "true") {
        verticalPage.dataset.wkRulerWired = "true";
        verticalPage.addEventListener("pointerdown", function (event) {
            beginWordKitRulerDrag(editorContainer, verticalPage, "y", event);
        });
    }

    var selector = host.querySelector("[data-wk-tab-selector]");
    if (selector && selector.dataset.wkWired !== "true") {
        selector.dataset.wkWired = "true";
        selector.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });
        selector.addEventListener("click", function () {
            wordKitTabType = wordKitTabTypes[(wordKitTabTypes.indexOf(wordKitTabType) + 1) % wordKitTabTypes.length];
            updateWordKitTabSelector(selector);
            showWordKitToast("Đã chọn " + (wordKitTabNames[wordKitTabType] || "tab").toLowerCase() + ". Bấm lên vùng trắng của thước để đặt.");
        });
        updateWordKitTabSelector(selector);
    }
}

function updateWordKitTabSelector(selector) {
    var glyph = selector.querySelector(".wk-tab-glyph");
    if (glyph) {
        glyph.className = "wk-tab-glyph wk-tab-glyph-" + wordKitTabType.toLowerCase();
    }
    selector.title = "Loại tab: " + (wordKitTabNames[wordKitTabType] || "").replace("Tab ", "")
        + ". Bấm để đổi (Trái → Giữa → Phải), rồi bấm lên thước để đặt tab.";
}

function beginWordKitRulerDrag(editorContainer, page, axis, event) {
    if (event.button !== undefined && event.button !== 0) {
        return;
    }

    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!editor || !editor.selection) {
        return;
    }

    var target = event.target;
    var handle = null;
    var kind = null;
    if (axis === "y") {
        if ((handle = target.closest("[data-office-kit-vertical-margin]"))) {
            kind = "verticalMargin";
        } else if ((handle = target.closest("[data-wk-row]"))) {
            kind = "row";
        } else {
            return;
        }
    } else if ((handle = target.closest("[data-office-kit-horizontal-margin]"))) {
        kind = "margin";
    } else if ((handle = target.closest("[data-office-kit-horizontal-indent]"))) {
        kind = "indent";
    } else if ((handle = target.closest("[data-wk-col]"))) {
        kind = "column";
    } else if ((handle = target.closest("[data-wk-tab-pos]"))) {
        kind = "tab";
    } else if ((handle = target.closest("[data-office-kit-horizontal-tab-stop]"))) {
        kind = "defaultTab";
    } else {
        kind = "newTab";
    }

    var sectionFormat = editor.selection.sectionFormat || {};
    var pageSize = axis === "x" ? syncfusionOfficeKitSectionPageWidth(sectionFormat) : syncfusionOfficeKitSectionPageHeight(sectionFormat);
    var textBox = getWordKitRulerTextBox(editor);
    var pointAt = function (clientX, clientY) {
        var rect = page.getBoundingClientRect();
        var ratio = axis === "x" ? (clientX - rect.left) / Math.max(rect.width, 1) : (clientY - rect.top) / Math.max(rect.height, 1);
        return syncfusionOfficeKitClampNumber(ratio, 0, 1) * pageSize;
    };

    if (kind === "newTab") {
        // Bam vao thuoc (trong vung chu) = dat tab loai dang chon o goc thuoc.
        var startPoint = pointAt(event.clientX, event.clientY);
        if (startPoint < textBox.left - 2 || startPoint > textBox.right + 2) {
            event.preventDefault();
            showWordKitToast(textBox.table
                ? "Con trỏ đang ở trong một ô bảng: chỉ đặt tab được trong vùng trắng của thước (chính ô đó). Muốn đặt tab cho đoạn khác, bấm vào đoạn đó trước."
                : "Bấm vào vùng trắng của thước (giữa hai lề) để đặt tab.");
            return;
        }
        var layer = page.querySelector("[data-wk-ruler-tabs]");
        if (!layer) {
            return;
        }
        handle = document.createElement("span");
        handle.className = "wk-ruler-tab wk-ruler-tab-" + wordKitTabType.toLowerCase() + " wk-ruler-tab-new";
        layer.appendChild(handle);
    }

    event.preventDefault();
    if (page.setPointerCapture) {
        try {
            page.setPointerCapture(event.pointerId);
        } catch (error) {
            // Mot so trinh duyet tu choi capture tren phan tu vua tao: van keo duoc qua document.
        }
    }
    page.classList.add("wk-ruler-dragging");
    handle.classList.add("syncfusion-office-kit-ruler-dragging");
    document.body.classList.add("syncfusion-office-kit-ruler-user-select-none");

    var isTab = kind === "tab" || kind === "newTab";
    var state = { point: pointAt(event.clientX, event.clientY), off: false };
    var move = function (moveEvent) {
        var point = pointAt(moveEvent.clientX, moveEvent.clientY);
        if (isTab) {
            var relative = point - textBox.left;
            if (!moveEvent.altKey) {
                relative = Math.round(relative / wordKitTabSnap) * wordKitTabSnap;
            }
            point = syncfusionOfficeKitClampNumber(textBox.left + relative, textBox.left + 0.5, Math.max(textBox.right, textBox.left + 1));
            // Keo tab ra khoi thuoc (len/xuong) = xoa tab, nhu Word.
            var rect = page.getBoundingClientRect();
            state.off = moveEvent.clientY > rect.bottom + 16 || moveEvent.clientY < rect.top - 16;
            handle.classList.toggle("wk-removing", state.off);
        }
        state.point = point;
        handle.style[axis === "x" ? "left" : "top"] = syncfusionOfficeKitPointPercent(point, pageSize) + "%";
        var pageRect = page.getBoundingClientRect();
        var screen = axis === "x"
            ? pageRect.left + (point / pageSize) * pageRect.width
            : pageRect.top + (point / pageSize) * pageRect.height;
        if (state.off) {
            hideWordKitGuides();
        } else {
            showWordKitGuide(axis, screen, editorContainer);
        }
    };
    var end = function (endEvent) {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", end);
        document.removeEventListener("pointercancel", end);
        if (page.hasPointerCapture && page.hasPointerCapture(endEvent.pointerId) && page.releasePointerCapture) {
            page.releasePointerCapture(endEvent.pointerId);
        }
        page.classList.remove("wk-ruler-dragging");
        handle.classList.remove("syncfusion-office-kit-ruler-dragging");
        document.body.classList.remove("syncfusion-office-kit-ruler-user-select-none");
        hideWordKitGuides();

        if (endEvent.type !== "pointercancel") {
            try {
                applyWordKitRulerDrag(editorContainer, editor, kind, handle, state, textBox, page);
            } catch (error) {
                console.error("Word kit ruler drag error:", error);
            }
        }
        if (kind === "newTab" && handle.parentNode) {
            handle.parentNode.removeChild(handle);
        }
        // Ve lai toan bo vach theo du lieu that (xoa chu ky de buoc dung lai lop tab/cot/hang).
        page.querySelectorAll("[data-wk-signature]").forEach(function (layerElement) {
            layerElement.removeAttribute("data-wk-signature");
        });
        updateSyncfusionOfficeKitRulers(getSyncfusionOfficeKitActiveContainer(editorContainer));
        scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
        scheduleWordKitStateUpdate(editorContainer);
        if (editor.focusIn) {
            editor.focusIn();
        }
    };

    move(event);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
}

function applyWordKitRulerDrag(editorContainer, editor, kind, handle, state, textBox, page) {
    var pageRect = page.getBoundingClientRect();
    var sectionFormat = editor.selection.sectionFormat || {};
    var pageWidth = syncfusionOfficeKitSectionPageWidth(sectionFormat);
    var pageHeight = syncfusionOfficeKitSectionPageHeight(sectionFormat);
    var clientX = pageRect.left + (state.point / pageWidth) * pageRect.width;
    var clientY = pageRect.top + (state.point / pageHeight) * pageRect.height;

    switch (kind) {
        case "margin":
            return applySyncfusionOfficeKitHorizontalMargin(editorContainer, handle.getAttribute("data-office-kit-horizontal-margin") || "", clientX, page);
        case "verticalMargin":
            return applySyncfusionOfficeKitVerticalMargin(editorContainer, handle.getAttribute("data-office-kit-vertical-margin") || "", clientY, page);
        case "indent":
            return applySyncfusionOfficeKitHorizontalIndent(editorContainer, handle.getAttribute("data-office-kit-horizontal-indent") || "", clientX, page);
        case "defaultTab":
            return applySyncfusionOfficeKitHorizontalTabStop(editorContainer, clientX, page);
        case "column":
            return applyWordKitColumnResize(editor, Number(handle.getAttribute("data-wk-col")), state.point);
        case "row":
            return applyWordKitRowResize(editor, Number(handle.getAttribute("data-wk-row")), state.point);
        case "tab": {
            var from = Number(handle.getAttribute("data-wk-tab-pos"));
            if (state.off) {
                return deleteWordKitTab(editor, from);
            }
            return moveWordKitTab(editor, from, state.point - textBox.left, handle.getAttribute("data-wk-tab-type") || "Left");
        }
        case "newTab":
            return state.off ? false : addWordKitTab(editor, state.point - textBox.left, wordKitTabType);
    }
    return false;
}

// Duong cham dong vi tri (giong Word khi keo thuoc hoac keo vien bang): x = doc, y = ngang.
function showWordKitGuide(axis, position, editorContainer) {
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var host = activeContainer ? activeContainer.element : null;
    var editor = activeContainer ? activeContainer.documentEditor : null;
    var viewer = editor && editor.documentHelper ? editor.documentHelper.viewerContainer : null;
    if (!host || !viewer || !Number.isFinite(position)) {
        return;
    }

    var guide = document.getElementById("wk-ruler-guide-" + axis);
    if (!guide) {
        guide = document.createElement("div");
        guide.id = "wk-ruler-guide-" + axis;
        guide.className = "wk-ruler-guide wk-ruler-guide-" + axis;
        guide.setAttribute("aria-hidden", "true");
        document.body.appendChild(guide);
    }

    var viewerRect = viewer.getBoundingClientRect();
    if (axis === "x") {
        var ruler = host.querySelector(".syncfusion-office-kit-horizontal-ruler");
        var top = ruler ? ruler.getBoundingClientRect().top : viewerRect.top;
        guide.style.left = Math.round(position) + "px";
        guide.style.top = Math.round(top) + "px";
        guide.style.height = Math.max(Math.round(viewerRect.bottom - top), 0) + "px";
    } else {
        var verticalRuler = host.querySelector(".syncfusion-office-kit-vertical-ruler");
        var left = verticalRuler ? verticalRuler.getBoundingClientRect().left : viewerRect.left;
        guide.style.top = Math.round(position) + "px";
        guide.style.left = Math.round(left) + "px";
        guide.style.width = Math.max(Math.round(viewerRect.right - left), 0) + "px";
    }
    guide.classList.add("wk-show");
}

function hideWordKitGuides() {
    document.querySelectorAll(".wk-ruler-guide.wk-show").forEach(function (guide) {
        guide.classList.remove("wk-show");
    });
}

// Keo vien bang ngay trong van ban (bo keo cua Syncfusion): hien duong cham + thuoc chay theo.
function watchWordKitTableBorderDrag(editorContainer, editor) {
    var active = false;
    document.addEventListener("mousemove", function (event) {
        var helper = editor.documentHelper;
        if (helper && helper.isRowOrCellResizing) {
            var resizer = editor.editor ? editor.editor.tableResize : null;
            var rowResize = resizer && resizer.resizeNode === 1;
            showWordKitGuide(rowResize ? "y" : "x", rowResize ? event.clientY : event.clientX, editorContainer);
            scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
            active = true;
        } else if (active) {
            active = false;
            hideWordKitGuides();
        }
    }, true);
    document.addEventListener("mouseup", function () {
        if (active) {
            setTimeout(function () {
                active = false;
                hideWordKitGuides();
                scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
            }, 0);
        }
    }, true);
}

// Doi do rong cot bang bo keo vien cua chinh Syncfusion (TableResizer): co hoan tac (Ctrl+Z) nhu
// khi keo vien trong van ban. Do lech truyen vao tinh bang pt (da do: 60 -> cot rong them 60pt).
function applyWordKitColumnResize(editor, boundaryIndex, targetPoint) {
    var info = getWordKitRulerTableInfo(editor);
    var resizer = editor.editor ? editor.editor.tableResize : null;
    var boundary = info ? info.columns[boundaryIndex] : null;
    if (!boundary || !resizer || typeof resizer.handleResize !== "function") {
        return false;
    }

    var previous = info.columns[boundaryIndex - 1];
    var next = info.columns[boundaryIndex + 1];
    var point = targetPoint;
    if (previous) {
        point = Math.max(point, previous.point + wordKitMinimumColumn);
    }
    if (next) {
        point = Math.min(point, next.point - wordKitMinimumColumn);
    }
    var delta = Math.round((point - boundary.point) * 100) / 100;
    if (Math.abs(delta) < 0.5) {
        return false;
    }

    var y = info.cell.y;
    resizer.currentResizingTable = info.table;
    resizer.resizeNode = 0;
    resizer.resizerPosition = boundary.column;
    resizer.startingPoint.x = 0;
    resizer.startingPoint.y = y;
    resizer.handleResize({ x: 0, y: y });
    resizer.handleResizing({ x: delta, y: y });
    resizer.updateResizingHistory({ x: delta, y: y });
    return true;
}

// Doi chieu cao hang qua rowFormat cua vung chon (API chinh thuc, hoan tac dung). Bo keo hang cua
// TableResizer tron lan px/pt nen Ctrl+Z khong tra ve dung chieu cao cu -> khong dung.
function applyWordKitRowResize(editor, rowIndex, targetPoint) {
    var info = getWordKitRulerTableInfo(editor);
    var entry = info ? info.rows[rowIndex] : null;
    var selection = editor.selection;
    if (!entry || !selection || !selection.rowFormat) {
        return false;
    }

    var height = Math.round(Math.max(targetPoint - entry.top, wordKitMinimumRow) * 100) / 100;
    if (Math.abs(height - (entry.bottom - entry.top)) < 0.5) {
        return false;
    }

    // Dua con tro vao hang can doi (neu khac hang hien tai), doi xong tra con tro ve cho cu.
    var savedStart = selection.startOffset;
    var savedEnd = selection.endOffset;
    var firstCell = entry.row.childWidgets && entry.row.childWidgets[0];
    var paragraph = firstCell && firstCell.childWidgets ? firstCell.childWidgets[0] : null;
    var moved = false;
    if (entry.row !== info.row && paragraph && typeof selection.selectParagraphInternal === "function") {
        selection.selectParagraphInternal(paragraph, true);
        moved = true;
    }
    selection.rowFormat.heightType = "AtLeast";
    selection.rowFormat.height = height;
    if (moved && typeof selection.select === "function") {
        try {
            selection.select(savedStart, savedEnd);
        } catch (error) {
            // Vi tri cu khong con hop le (hiem): giu con tro trong hang vua doi.
        }
    }
    return true;
}

// ---------------------------------------------------------------------------
// Diem dung tab. Syncfusion 19.1 co tab trong mo hinh doan van (WTabStop, vi tri tinh tu le /
// noi dung o) va dan trang co xet tab, nhung khong co API/hop thoai sua tab -> sua thang mo hinh
// roi dan lai cac doan bi doi. Thao tac tab khong vao lich su hoan tac (Ctrl+Z); muon bo tab thi
// keo no ra khoi thuoc.
// ---------------------------------------------------------------------------
function getWordKitSelectedParagraphs(editor) {
    var selection = editor.selection;
    var start = selection.isForward === false ? selection.end : selection.start;
    var end = selection.isForward === false ? selection.start : selection.end;
    var paragraph = start ? start.paragraph : null;
    var last = end ? end.paragraph : null;
    var paragraphs = [];
    while (paragraph && paragraphs.length < 5000) {
        paragraphs.push(paragraph);
        if (paragraph === last || typeof selection.getNextParagraphBlock !== "function") {
            break;
        }
        paragraph = selection.getNextParagraphBlock(paragraph);
    }
    return paragraphs;
}

function editWordKitTabs(editor, mutate) {
    var TabStop = typeof ej !== "undefined" && ej.documenteditor ? ej.documenteditor.WTabStop : null;
    if (!TabStop || !editor.editor || editor.isReadOnly) {
        return false;
    }

    var makeTab = function (position, type, deletePosition) {
        var tab = new TabStop();
        tab.position = Math.round(position * 100) / 100;
        tab.deletePosition = deletePosition || 0;
        tab.tabJustification = type || "Left";
        tab.tabLeader = "None";
        return tab;
    };
    var paragraphs = getWordKitSelectedParagraphs(editor);
    var formats = [];
    paragraphs.forEach(function (paragraph) {
        var widgets = typeof paragraph.getSplitWidgets === "function" ? paragraph.getSplitWidgets() : [paragraph];
        widgets.forEach(function (widget) {
            var format = widget.paragraphFormat;
            if (format && Array.isArray(format.tabs) && formats.indexOf(format) === -1) {
                formats.push(format);
                mutate(format, makeTab);
                format.tabs.sort(function (first, second) {
                    return first.position - second.position;
                });
            }
        });
    });
    if (!formats.length) {
        return false;
    }

    paragraphs.forEach(function (paragraph) {
        try {
            editor.editor.layoutItemBlock(paragraph, false);
        } catch (error) {
            console.warn("Word kit tab relayout warning:", error);
        }
    });
    try {
        editor.editor.reLayout(editor.selection, false);
    } catch (error) {
        console.warn("Word kit tab render warning:", error);
    }
    return true;
}

function removeWordKitTabAt(tabs, position) {
    var removed = false;
    for (var index = tabs.length - 1; index >= 0; index -= 1) {
        if (Math.abs(tabs[index].position - position) < 0.6) {
            tabs.splice(index, 1);
            removed = true;
        }
    }
    return removed;
}

// Tab lay tu kieu (style) khong nam trong tabs rieng cua doan: muon bo phai them moc "xoa" tai vi tri do.
function hideWordKitStyleTab(format, position, makeTab) {
    var stillThere = getWordKitParagraphTabs({ paragraphFormat: format }).some(function (tab) {
        return Math.abs(tab.position - position) < 0.6;
    });
    if (stillThere) {
        format.tabs.push(makeTab(position, "Left", position));
    }
}

function addWordKitTab(editor, position, type) {
    if (!(position > 0)) {
        return false;
    }
    return editWordKitTabs(editor, function (format, makeTab) {
        removeWordKitTabAt(format.tabs, position);
        format.tabs.push(makeTab(position, type));
    });
}

function moveWordKitTab(editor, from, to, type) {
    if (!(to > 0) || Math.abs(from - to) < 0.5) {
        return false;
    }
    return editWordKitTabs(editor, function (format, makeTab) {
        removeWordKitTabAt(format.tabs, from);
        hideWordKitStyleTab(format, from, makeTab);
        removeWordKitTabAt(format.tabs, to);
        format.tabs.push(makeTab(to, type));
    });
}

function deleteWordKitTab(editor, position) {
    return editWordKitTabs(editor, function (format, makeTab) {
        removeWordKitTabAt(format.tabs, position);
        hideWordKitStyleTab(format, position, makeTab);
    });
}

function setSyncfusionOfficeKitNumberControl(root, changeName, value, decimals) {
    if (!Number.isFinite(Number(value))) {
        return;
    }

    var selector = '[data-office-kit-change="' + changeName + '"]';
    var control = root && root.querySelector ? root.querySelector(selector) : null;
    if (!control) {
        control = document.querySelector(selector);
    }
    if (!control || control === document.activeElement) {
        return;
    }

    var numericValue = Number(value);
    var textValue = decimals > 0 ? numericValue.toFixed(decimals).replace(/\.?0+$/, "") : String(Math.round(numericValue));
    control.value = textValue;
}

function updateSyncfusionOfficeKitLayoutControls(editorContainer) {
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var editor = activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null;
    var root = activeContainer && activeContainer.element ? activeContainer.element : document;

    if (!editor || !editor.selection) {
        return;
    }

    var sectionFormat = editor.selection.sectionFormat || {};
    var paragraphFormat = editor.selection.paragraphFormat || {};
    var documentHelper = editor.documentHelper || {};

    setSyncfusionOfficeKitNumberControl(root, "layout-margin-top", syncfusionOfficeKitPointsToCentimeters(syncfusionOfficeKitNonNegativeNumber(sectionFormat.topMargin, syncfusionOfficeKitDefaultSectionFormat.topMargin)), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-margin-left", syncfusionOfficeKitPointsToCentimeters(syncfusionOfficeKitNonNegativeNumber(sectionFormat.leftMargin, syncfusionOfficeKitDefaultSectionFormat.leftMargin)), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-margin-bottom", syncfusionOfficeKitPointsToCentimeters(syncfusionOfficeKitNonNegativeNumber(sectionFormat.bottomMargin, syncfusionOfficeKitDefaultSectionFormat.bottomMargin)), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-margin-right", syncfusionOfficeKitPointsToCentimeters(syncfusionOfficeKitNonNegativeNumber(sectionFormat.rightMargin, syncfusionOfficeKitDefaultSectionFormat.rightMargin)), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-left-indent", syncfusionOfficeKitPointsToCentimeters(Number(paragraphFormat.leftIndent) || 0), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-right-indent", syncfusionOfficeKitPointsToCentimeters(Number(paragraphFormat.rightIndent) || 0), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-first-line-indent", syncfusionOfficeKitPointsToCentimeters(Number(paragraphFormat.firstLineIndent) || 0), 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-before-spacing", Number(paragraphFormat.beforeSpacing) || 0, 0);
    setSyncfusionOfficeKitNumberControl(root, "layout-after-spacing", Number(paragraphFormat.afterSpacing) || 0, 0);
    setSyncfusionOfficeKitNumberControl(root, "layout-line-spacing", Number(paragraphFormat.lineSpacing) || 1, 2);
    setSyncfusionOfficeKitNumberControl(root, "layout-default-tab-width", syncfusionOfficeKitPointsToCentimeters(Number(documentHelper.defaultTabWidth) || 36), 2);
}

function syncfusionOfficeKitRefreshEditorLayout(editorContainer, editor) {
    editor = editor || (editorContainer && editorContainer.documentEditor ? editorContainer.documentEditor : null);

    if (!editor) {
        return;
    }

    if (editor.focusIn) {
        editor.focusIn();
    }

    try {
        if (editor.documentHelper && editor.documentHelper.layout && typeof editor.documentHelper.layout.layoutWholeDocument === "function") {
            editor.documentHelper.layout.layoutWholeDocument();
        }
    } catch (error) {
        console.warn("Syncfusion Office kit layout refresh failed:", error);
    }

    if (editor.viewer && typeof editor.viewer.updateScrollBars === "function") {
        editor.viewer.updateScrollBars();
    }
    if (editorContainer && editorContainer.dataBind) {
        editorContainer.dataBind();
    }
    if (editor.dataBind) {
        editor.dataBind();
    }
    if (editorContainer && editorContainer.resize) {
        editorContainer.resize();
    }
    if (editor.resize) {
        editor.resize();
    }
}

function injectSyncfusionOfficeKitChromeStyles() {
    if (document.getElementById("syncfusion-office-kit-styles")) {
        return;
    }

    var style = document.createElement("style");
    style.id = "syncfusion-office-kit-styles";
    style.textContent = [
        // Bang mau theo Word 365 (giao dien sang): nen thanh tab xam nhat, than ribbon trang, mau nhan xanh Word.
        "#syncfusion-office-kit-ribbon{--wk-accent:#185abd;--wk-accent-soft:#deecf9;--wk-bg:#fff;--wk-bar:#f3f2f1;--wk-border:#e1dfdd;--wk-border-strong:#c8c6c4;--wk-text:#252423;--wk-muted:#605e5c;--wk-hover:#edebe9;--wk-pressed:#e1dfdd;--wk-on:#d9d9d9;display:block!important;position:relative;z-index:30;width:100%;min-width:0;border:1px solid var(--wk-border);border-bottom:0;background:var(--wk-bar);color:var(--wk-text);font:12px/1.2 'Segoe UI','Segoe UI Web (West European)',-apple-system,Roboto,Arial,sans-serif;text-align:left;user-select:none}",
        "#syncfusion-office-kit-ribbon *,.wk-menu *{box-sizing:border-box}",
        "#syncfusion-office-kit-ribbon button,.wk-menu button{margin:0;font:inherit;color:inherit;text-transform:none;letter-spacing:0}",
        ".wk-tabbar{display:flex;align-items:stretch;height:34px;gap:6px;padding:0 6px}",
        ".wk-qat{display:flex;align-items:center;gap:1px;padding-right:6px;border-right:1px solid var(--wk-border)}",
        ".wk-qat .wk-btn-i{min-width:28px;height:28px}",
        ".wk-tabs{display:flex;align-items:stretch;gap:1px;min-width:0;overflow-x:auto;scrollbar-width:none}",
        ".wk-tabs::-webkit-scrollbar{display:none}",
        ".wk-tab{position:relative;display:inline-flex;flex:0 0 auto;align-items:center;height:100%;padding:0 11px;border:0;background:transparent;color:var(--wk-text);font-size:13px!important;white-space:nowrap;cursor:pointer}",
        ".wk-tab:hover{background:var(--wk-hover)}",
        ".wk-tab-active{color:var(--wk-accent)!important;font-weight:600!important}",
        ".wk-tab-active:after{position:absolute;right:10px;bottom:3px;left:10px;height:3px;border-radius:2px;background:var(--wk-accent);content:''}",
        ".wk-tab[hidden]{display:none!important}",
        ".wk-tab-context{margin-left:6px;color:#107c41;font-weight:600}",
        ".wk-tab-context:before{position:absolute;top:0;right:0;left:0;height:3px;background:#107c41;content:''}",
        ".wk-tab-context.wk-tab-active{color:#107c41!important}",
        ".wk-tab-context.wk-tab-active:after{background:#107c41}",
        ".wk-tabbar-right{display:flex;align-items:center;gap:4px;margin-left:auto}",
        ".wk-bar-btn{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid transparent;border-radius:4px;background:transparent;white-space:nowrap;cursor:pointer}",
        ".wk-bar-btn:hover{border-color:var(--wk-border);background:var(--wk-hover)}",
        "#syncfusion-office-kit-ribbon .wk-bar-btn.wk-bar-btn-in{margin-left:4px;padding:0 14px;border-color:var(--wk-accent);background:var(--wk-accent);color:#fff;font-weight:700;box-shadow:0 1px 3px rgba(24,90,189,.35)}",
        "#syncfusion-office-kit-ribbon .wk-bar-btn.wk-bar-btn-in .wk-ico{stroke:#fff}",
        "#syncfusion-office-kit-ribbon .wk-bar-btn.wk-bar-btn-in:hover{border-color:#124a9c;background:#124a9c;color:#fff}",
        "#syncfusion-office-kit-ribbon .wk-bar-btn.wk-bar-btn-in:focus-visible{outline:2px solid #fff;outline-offset:-4px}",
        "#syncfusion-office-kit-ribbon.wk-w-md .wk-bar-btn.wk-bar-btn-in span{display:inline}",
        ".wk-collapse-btn{padding:0 5px}",
        ".wk-collapsed .wk-collapse-btn .wk-ico{transform:rotate(180deg)}",
        ".wk-body{overflow-x:auto;overflow-y:hidden;border-top:1px solid var(--wk-border);border-bottom:1px solid var(--wk-border);background:var(--wk-bg);box-shadow:0 1px 2px rgb(0 0 0 / .05);scrollbar-width:thin}",
        ".wk-collapsed .wk-body{display:none}",
        ".wk-collapsed.wk-peek .wk-body{position:absolute;top:100%;right:0;left:0;display:block;box-shadow:0 8px 18px rgb(0 0 0 / .16)}",
        ".wk-panel{display:none;align-items:stretch;min-height:98px;padding:3px 4px 0}",
        ".wk-panel-active{display:flex}",
        ".wk-group{position:relative;display:flex;flex:0 0 auto;flex-direction:column;margin-right:3px;padding:1px 5px 0}",
        ".wk-group:after{position:absolute;top:6px;right:-2px;bottom:6px;width:1px;background:var(--wk-border);content:''}",
        ".wk-group-body{display:flex;flex:1 1 auto;align-items:flex-start;gap:2px;min-height:74px}",
        ".wk-group-label{padding:3px 16px 4px;color:var(--wk-muted);font-size:11px;text-align:center;white-space:nowrap}",
        ".wk-launcher{position:absolute;right:1px;bottom:3px;display:grid;width:16px;height:16px;padding:0;place-items:center;border:0;border-radius:3px;background:transparent;color:var(--wk-muted);cursor:pointer}",
        ".wk-launcher .wk-ico{width:10px;height:10px}",
        ".wk-launcher:hover{background:var(--wk-hover);color:var(--wk-text)}",
        ".wk-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:0;border:1px solid transparent;border-radius:4px;background:transparent;color:var(--wk-text);white-space:nowrap;cursor:pointer}",
        ".wk-btn:hover{background:var(--wk-hover)}",
        ".wk-btn:active,.wk-btn.wk-menu-active{background:var(--wk-pressed)}",
        ".wk-btn.wk-on{border-color:var(--wk-border-strong);background:var(--wk-on)}",
        ".wk-btn:focus-visible,.wk-tab:focus-visible,.wk-menu-item:focus-visible,.wk-style:focus-visible{outline:2px solid var(--wk-accent);outline-offset:-2px}",
        ".wk-btn-l{flex-direction:column;justify-content:flex-start;gap:3px;min-width:48px;max-width:80px;height:74px;padding:5px 5px 3px}",
        ".wk-btn-l .wk-label{display:block;font-size:11.5px;line-height:1.2;text-align:center;white-space:normal}",
        ".wk-btn-l .wk-caret-ico{display:flex;justify-content:center;margin:1px 0 0}",
        ".wk-btn-s{justify-content:flex-start;height:23px;padding:0 7px 0 4px;font-size:12px}",
        ".wk-btn-i{min-width:26px;height:25px;padding:0 4px}",
        ".wk-caret{width:15px;height:25px;padding:0;border-radius:0 4px 4px 0}",
        ".wk-caret .wk-ico{width:10px;height:10px}",
        ".wk-caret-ico{display:inline-flex;margin-left:2px;vertical-align:middle}",
        ".wk-caret-ico .wk-ico{width:9px;height:9px}",
        ".wk-split{display:inline-flex;align-items:center;border:1px solid transparent;border-radius:4px}",
        ".wk-split:hover{border-color:var(--wk-border)}",
        ".wk-split .wk-btn-i{border-radius:4px 0 0 4px}",
        ".wk-lsplit{display:flex;flex-direction:column;align-items:stretch;width:54px;height:74px;border:1px solid transparent;border-radius:4px}",
        ".wk-lsplit:hover{border-color:var(--wk-border)}",
        ".wk-lsplit-top{height:44px;border-radius:4px 4px 0 0}",
        ".wk-lsplit-bottom{flex:1 1 auto;flex-direction:column;border-radius:0 0 4px 4px}",
        ".wk-lsplit-bottom .wk-label{font-size:11.5px}",
        ".wk-lsplit-bottom .wk-caret-ico{display:flex;justify-content:center;margin:1px 0 0}",
        ".wk-stack{display:flex;flex-direction:column;gap:1px;padding-top:1px}",
        ".wk-rows{display:flex;flex-direction:column;gap:6px;padding-top:4px}",
        ".wk-row{display:flex;align-items:center;gap:1px}",
        ".wk-sep{display:inline-block;width:1px;height:18px;margin:0 4px;background:var(--wk-border)}",
        ".wk-ico{flex:0 0 auto;width:16px;height:16px;overflow:visible;fill:none;stroke:currentColor;stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round}",
        ".wk-ico *{vector-effect:non-scaling-stroke}",
        ".wk-ico-lg{width:32px;height:32px;stroke-width:1.5}",
        ".wk-ico .a{stroke:var(--wk-accent,#185abd)}",
        ".wk-ico .bg{fill:var(--wk-bg,#fff)}",
        ".wk-ico .f{fill:currentColor;stroke:none}",
        ".wk-ico .t{fill:currentColor;stroke:none;font-family:'Segoe UI',Arial,sans-serif;font-weight:600}",
        ".wk-ico .ta{fill:var(--wk-accent,#185abd)}",
        ".wk-ico .d{stroke:#c50f1f}",
        ".wk-ico .g{stroke:#107c10}",
        ".wk-ico .dash{stroke-dasharray:2 1.6}",
        ".wk-glyph{display:inline-block;min-width:12px;font:600 15px/1 'Segoe UI',Arial,sans-serif;text-align:center}",
        ".wk-glyph-serif{font-family:'Times New Roman',Georgia,serif;font-size:16px}",
        ".wk-glyph-small{font-size:12.5px}",
        ".wk-glyph sub,.wk-glyph sup{font-size:8px;line-height:0}",
        ".wk-glyph-color{position:relative;display:inline-flex;flex-direction:column;align-items:center;padding-bottom:4px}",
        ".wk-color-bar{position:absolute;right:-2px;bottom:0;left:-2px;height:4px;border-radius:1px;box-shadow:inset 0 0 0 1px rgb(0 0 0 / .12)}",
        ".wk-color-bar-wide{right:6px;bottom:-2px;left:6px}",
        ".wk-styles{display:flex;gap:3px;padding-top:2px}",
        ".wk-style{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;width:86px;height:60px;overflow:hidden;padding:2px 8px;border:1px solid var(--wk-border);border-radius:3px;background:#fff;cursor:pointer}",
        ".wk-style span{color:var(--wk-text);font-family:'Times New Roman',Times,serif;line-height:1.1;white-space:nowrap}",
        ".wk-style small{max-width:100%;overflow:hidden;color:var(--wk-muted);font-size:10.5px;text-overflow:ellipsis;white-space:nowrap}",
        ".wk-style:hover{border-color:var(--wk-border-strong);background:var(--wk-hover)}",
        ".wk-style.wk-on{padding:1px 7px;border:2px solid var(--wk-accent);background:#fff}",
        ".wk-fields{display:flex;flex-direction:column;gap:3px;padding:1px 6px 0}",
        ".wk-fields-title{color:var(--wk-muted);font-size:11px;line-height:1.2}",
        ".wk-field{display:grid;grid-template-columns:56px 66px 24px;align-items:center;gap:3px;margin:0!important;color:var(--wk-text)!important;font-size:12px;font-weight:400}",
        ".wk-number{width:66px;height:22px;padding:0 4px;border:1px solid #8a8886;border-radius:2px;background:#fff;color:var(--wk-text);font:12px 'Segoe UI',Arial,sans-serif}",
        ".wk-number:focus{border-color:var(--wk-accent);outline:0;box-shadow:0 0 0 1px var(--wk-accent)}",
        ".wk-field small{color:var(--wk-muted);font-size:11px}",
        ".wk-menu{--wk-accent:#185abd;--wk-accent-soft:#deecf9;--wk-bg:#fff;--wk-bar:#f3f2f1;--wk-border:#e1dfdd;--wk-border-strong:#c8c6c4;--wk-text:#252423;--wk-muted:#605e5c;--wk-hover:#edebe9;position:fixed;top:0;left:0;z-index:3000;display:none;min-width:200px;max-width:360px;max-height:72vh;overflow:auto;padding:4px;border:1px solid var(--wk-border-strong);border-radius:6px;background:#fff;box-shadow:0 8px 24px rgb(0 0 0 / .18);color:var(--wk-text);font:12.5px/1.25 'Segoe UI',Arial,sans-serif;text-align:left;user-select:none}",
        ".wk-menu.wk-open{display:block}",
        ".wk-menu-item{position:relative;display:flex;align-items:flex-start;gap:9px;width:100%;padding:6px 10px 6px 8px;border:0;border-radius:4px;background:transparent;text-align:left;white-space:normal;cursor:pointer}",
        ".wk-menu-item:hover{background:var(--wk-hover)}",
        ".wk-menu-item.wk-on{background:var(--wk-accent-soft)}",
        ".wk-menu-item .wk-ico{margin-top:1px}",
        ".wk-menu-blank{display:inline-block;flex:0 0 16px;width:16px}",
        ".wk-menu-text{display:flex;flex-direction:column;gap:2px}",
        ".wk-menu-text small{color:var(--wk-muted);font-size:11px}",
        ".wk-menu-sep{height:1px;margin:4px 2px;background:var(--wk-border)}",
        ".wk-menu-heading{margin:2px 0;padding:5px 10px 4px;border-radius:3px;background:var(--wk-bar);color:var(--wk-muted);font-size:11.5px;font-weight:600}",
        ".wk-pen{display:flex;gap:12px;align-items:center;padding:4px 10px 6px}",
        ".wk-pen label{display:flex;gap:6px;align-items:center;margin:0;color:var(--wk-text);font-size:12px;font-weight:400}",
        ".wk-pen input[type=color]{width:28px;height:22px;padding:0;border:1px solid #8a8886;background:#fff}",
        ".wk-pen select{height:22px;border:1px solid #8a8886;border-radius:2px;font:12px 'Segoe UI',Arial,sans-serif}",
        ".wk-menu-note{max-width:300px;padding:4px 10px 6px;color:var(--wk-muted);font-size:11px;line-height:1.4}",
        ".wk-colors{display:grid;grid-template-columns:repeat(10,18px);gap:4px;padding:6px 8px}",
        ".wk-swatch{width:18px;height:18px;padding:0;border:1px solid rgb(0 0 0 / .18);border-radius:2px;cursor:pointer}",
        ".wk-swatch:hover{outline:2px solid var(--wk-accent);outline-offset:1px}",
        ".wk-hidden-color{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}",
        ".wk-gallery{display:grid;grid-template-columns:repeat(4,48px);gap:6px;padding:6px 8px}",
        ".wk-tile{display:grid;width:48px;height:48px;padding:0;place-items:center;border:1px solid var(--wk-border);border-radius:3px;background:#fff;font-size:18px;cursor:pointer}",
        ".wk-tile:hover{border-color:var(--wk-accent);background:var(--wk-accent-soft)}",
        ".wk-gallery-numbers{grid-template-columns:repeat(4,60px)}",
        ".wk-tile-number{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;width:60px;height:60px;padding:4px 7px;font:11px 'Times New Roman',serif}",
        ".wk-tile-number span:after{display:inline-block;width:22px;height:1px;margin-left:4px;vertical-align:middle;background:#a19f9d;content:''}",
        ".wk-table-grid{display:grid;grid-template-columns:repeat(10,17px);gap:2px;padding:4px 10px 8px}",
        ".wk-cell{width:17px;height:17px;border:1px solid #a19f9d;background:#fff;cursor:pointer}",
        ".wk-cell.wk-on{border-color:var(--wk-accent);background:#c7e0f4}",
        ".wk-symbols{display:grid;grid-template-columns:repeat(10,28px);gap:2px;padding:6px}",
        ".wk-symbol{width:28px;height:28px;padding:0;border:1px solid var(--wk-border);border-radius:2px;background:#fff;font:15px 'Times New Roman',serif!important;cursor:pointer}",
        ".wk-symbol:hover{border-color:var(--wk-accent);background:var(--wk-accent-soft)}",
        ".contract-template-office-combo{position:relative;display:inline-flex;align-items:center;margin-right:2px}",
        ".contract-template-office-select{height:24px;padding:0 18px 0 6px;border:1px solid #8a8886;border-radius:2px;background:#fff;color:#252423;font:12px 'Segoe UI',Arial,sans-serif;user-select:text}",
        ".contract-template-office-select:hover{border-color:#323130}",
        ".contract-template-office-select:focus{border-color:#185abd;outline:0;box-shadow:0 0 0 1px #185abd}",
        ".contract-template-office-font-family{width:160px}",
        ".contract-template-office-font-size{width:56px}",
        ".contract-template-office-combo-caret{position:absolute;top:1px;right:1px;display:inline-grid;width:16px;height:22px;padding:0;place-items:center;border:0;background:transparent;color:#605e5c;font-size:10px;line-height:1;cursor:pointer}",
        ".contract-template-office-combo-caret:hover{background:#edebe9}",
        ".contract-template-office-combo-menu{position:fixed;top:0;left:0;z-index:3000;display:none;min-width:150px;max-height:60vh;overflow-y:auto;flex-direction:column;padding:4px;border:1px solid #c8c6c4;border-radius:6px;background:#fff;box-shadow:0 8px 24px rgb(0 0 0 / .18)}",
        ".contract-template-office-combo-menu-open{display:flex}",
        ".contract-template-office-combo-menu button{padding:5px 10px;border:0;border-radius:3px;background:transparent;color:#252423;font-size:13px;text-align:left;white-space:nowrap;cursor:pointer}",
        ".contract-template-office-combo-menu button:hover,.contract-template-office-combo-menu button:focus-visible{outline:0;background:#edebe9}",
        ".contract-template-office-combo-menu button[hidden]{display:none}",
        ".wk-toast{position:fixed;bottom:28px;left:50%;z-index:5000;max-width:min(560px,calc(100vw - 32px));padding:10px 16px;border-radius:6px;background:#323130;color:#fff;font:13px/1.4 'Segoe UI',Arial,sans-serif;box-shadow:0 6px 20px rgb(0 0 0 / .25);opacity:0;pointer-events:none;transform:translate(-50%,20px);transition:opacity .2s,transform .2s}",
        ".wk-toast-show{opacity:1;transform:translate(-50%,0)}",
        ".wk-painting [id$='_viewerContainer'],.wk-painting [id$='_viewerContainer'] *{cursor:copy!important}",
        // Nhu Word: vung quanh trang mau xam, trang van trang (canvas to nen trang theo mau nen van ban);
        // theme material de .e-de-background trang nen trang va le hoa lam mot.
        ".e-de-background,.e-documenteditor [id$='_viewerContainer']{background-color:#e6e6e6!important}",
        // Thanh cong cu nho tren menu chuot phai (nhu Word)
        ".wk-mini{position:fixed;top:0;left:0;z-index:2999;display:none;align-items:stretch;gap:4px;padding:4px 5px;border:1px solid var(--wk-border-strong);border-radius:6px;background:#fff;box-shadow:0 6px 18px rgb(0 0 0 / .18)}",
        ".wk-mini.wk-open{display:flex}",
        ".wk-mini .wk-rows{gap:3px;padding-top:0}",
        ".wk-mini [data-wk-mini]{display:contents}",
        ".wk-mini.wk-mini-table [data-wk-mini=text],.wk-mini:not(.wk-mini-table) [data-wk-mini=table]{display:none}",
        ".wk-mini-big{display:flex;align-items:stretch;gap:2px;padding-left:4px;border-left:1px solid var(--wk-border)}",
        ".wk-mini .wk-btn-l{height:auto;min-width:46px;max-width:64px;padding:3px 4px}",
        ".wk-mini .wk-btn-l .wk-ico-lg{width:24px;height:24px}",
        ".wk-mini .contract-template-office-font-family{width:126px}",
        ".wk-mini .contract-template-office-font-size{width:46px}",
        // O chon don vi o dau hop Thiet lap trang
        // nam cung hang voi cac tab Le/Giay/Bo cuc (khong lam hop cao them: Syncfusion da tinh san chieu cao noi dung)
        ".wk-don-vi-trang{position:absolute;top:4px;right:0;z-index:2}",
        ".wk-don-vi-trang label{display:inline-flex;align-items:center;gap:6px;margin:0;font:13px 'Segoe UI',Arial,sans-serif;color:#605e5c}",
        ".wk-don-vi-trang select{height:28px;padding:0 6px;border:1px solid #8a8886;border-radius:2px;background:#fff;color:#252423;font:13px 'Segoe UI',Arial,sans-serif}",
        // An thanh cong cu goc cua Syncfusion (ribbon tren thay the). Chi an dung thanh do: luat cu an moi .e-toolbar
        // nen the "Thay thế" trong ngan tim kiem cung bien mat.
        ".syncfusion-office-kit-enabled #container .e-de-ctnr-toolbar,.syncfusion-office-kit-enabled #container .e-de-toolbar{display:none!important}",
        // Thuoc doc (18px, nam de len mep trai vung soan) tung che chu "Trang 1/1" va mep ngan Tim/Thay the.
        ":not(.syncfusion-office-kit-rulers-hidden)>.syncfusion-office-kit-ruler-body .e-de-op{margin-left:19px!important}",
        ":not(.syncfusion-office-kit-rulers-hidden)>.syncfusion-office-kit-ruler-body>.e-de-status-bar{padding-left:20px!important}",
        ".wk-w-lg .wk-group-editing .wk-btn-s>span{display:none}",
        ".wk-w-lg .wk-style{width:74px}",
        ".wk-w-md .wk-group-clipboard .wk-btn-s>span{display:none}",
        ".wk-w-md .wk-style:nth-child(4){display:none}",
        ".wk-w-md .wk-bar-btn span{display:none}",
        ".wk-w-md .wk-tab{padding:0 8px}",
        ".wk-w-sm .wk-style:nth-child(3){display:none}",
        ".wk-w-sm .contract-template-office-font-family{width:122px}",
        // Thuoc kieu Word: mong 18px, so 9px nam giua, cham o 1/4 cm va vach ngan o 1/2 cm, le la vung xam
        // (keo ranh gioi xam/trang de chinh le), vach thut le hinh dong ho cat nen trang vien xam.
        ".syncfusion-office-kit-rulers-enabled{position:relative;background:#e5e5e5!important}",
        ".syncfusion-office-kit-ruler-body{position:relative!important}",
        ".syncfusion-office-kit-horizontal-ruler{position:relative;z-index:28;display:grid!important;grid-template-columns:18px minmax(0,1fr);height:20px;min-height:20px;overflow:hidden;background:#e5e5e5}",
        ".syncfusion-office-kit-horizontal-ruler-track{position:relative;overflow:hidden;background:#e5e5e5;--office-kit-ruler-page-left:0px;--office-kit-ruler-page-width:100%}",
        ".syncfusion-office-kit-horizontal-ruler-page{position:absolute;top:2px;bottom:0;left:var(--office-kit-ruler-page-left);width:var(--office-kit-ruler-page-width);overflow:hidden;background:linear-gradient(#fff,#fff) 0 0/100% 14px no-repeat;--office-kit-ruler-centimeter-width:38px;--office-kit-ruler-half-centimeter-width:calc(var(--office-kit-ruler-centimeter-width) / 2);--office-kit-ruler-left-margin:10%;--office-kit-ruler-right-margin:10%}",
        ".syncfusion-office-kit-horizontal-ruler-page:before{position:absolute;top:0;right:0;left:0;height:14px;z-index:1;background-image:repeating-linear-gradient(to right,#5f5f5f 0 1px,transparent 1px var(--office-kit-ruler-half-centimeter-width)),repeating-linear-gradient(to right,#5f5f5f 0 1px,transparent 1px var(--office-kit-ruler-centimeter-width));background-repeat:repeat-x;background-size:calc(var(--office-kit-ruler-centimeter-width) * 10) 1px,calc(var(--office-kit-ruler-centimeter-width) * 10) 4px;background-position:calc(var(--office-kit-ruler-origin,0px) + var(--office-kit-ruler-centimeter-width) / 4) 50%,calc(var(--office-kit-ruler-origin,0px) + var(--office-kit-ruler-centimeter-width) / 2) 50%;pointer-events:none;content:''}",
        ".syncfusion-office-kit-horizontal-ruler-page:after{display:none}",
        ".syncfusion-office-kit-horizontal-margin-zone{position:absolute;top:0;height:14px;z-index:0;background:#cbcbcb;pointer-events:none}",
        ".syncfusion-office-kit-horizontal-margin-left{left:0;width:var(--office-kit-ruler-left-margin)}",
        ".syncfusion-office-kit-horizontal-margin-right{right:0;width:var(--office-kit-ruler-right-margin)}",
        ".syncfusion-office-kit-horizontal-ruler-number{position:absolute;top:6px;left:calc(var(--office-kit-ruler-origin,0px) + var(--office-kit-ruler-position) * var(--office-kit-ruler-centimeter-width));z-index:2;color:#3b3b3b;font:9px/1 'Segoe UI',Arial,sans-serif;transform:translate(-50%,-50%);pointer-events:none}",
        ".syncfusion-office-kit-ruler-handle{position:absolute;top:0;height:14px;z-index:4;width:11px;padding:0;border:0;background:transparent;transform:translateX(-50%);cursor:ew-resize;pointer-events:auto;touch-action:none}",
        ".syncfusion-office-kit-ruler-handle:hover,.syncfusion-office-kit-vertical-handle:hover{background:rgb(24 90 189 / .22)}",
        ".syncfusion-office-kit-indent-handle{position:absolute;z-index:5;width:9px;padding:0;border:0;background:transparent;transform:translateX(-50%);cursor:ew-resize;pointer-events:auto;touch-action:none}",
        ".syncfusion-office-kit-indent-handle:before,.syncfusion-office-kit-indent-handle:after{position:absolute;content:''}",
        ".syncfusion-office-kit-indent-handle:before{inset:0;background:#6b6b6b}",
        ".syncfusion-office-kit-indent-handle:after{inset:1px;background:#fff}",
        ".syncfusion-office-kit-indent-handle:hover:before,.syncfusion-office-kit-indent-handle.syncfusion-office-kit-ruler-dragging:before{background:#185abd}",
        ".syncfusion-office-kit-indent-first-line{top:0;height:6px;clip-path:polygon(0 0,100% 0,50% 100%)}",
        ".syncfusion-office-kit-indent-first-line:before,.syncfusion-office-kit-indent-first-line:after{clip-path:polygon(0 0,100% 0,50% 100%)}",
        ".syncfusion-office-kit-indent-hanging{bottom:5px;height:6px;clip-path:polygon(50% 0,100% 100%,0 100%)}",
        ".syncfusion-office-kit-indent-hanging:before,.syncfusion-office-kit-indent-hanging:after{clip-path:polygon(50% 0,100% 100%,0 100%)}",
        ".syncfusion-office-kit-indent-left{bottom:0;height:6px}",
        
        ".syncfusion-office-kit-indent-right{bottom:5px;height:6px;clip-path:polygon(50% 0,100% 100%,0 100%)}",
        ".syncfusion-office-kit-indent-right:before,.syncfusion-office-kit-indent-right:after{clip-path:polygon(50% 0,100% 100%,0 100%)}",
        ".syncfusion-office-kit-tab-origin{display:none}",
        ".syncfusion-office-kit-tab-stop{position:absolute;bottom:0;z-index:5;width:7px;height:4px;padding:0;border:0;background:transparent;transform:translateX(-50%);cursor:ew-resize;pointer-events:auto;touch-action:none}",
        ".syncfusion-office-kit-tab-stop:before{position:absolute;top:1px;left:3px;width:1px;height:2px;background:#9b9b9b;content:''}",
        ".syncfusion-office-kit-vertical-ruler{position:absolute;top:0;bottom:0;left:0;z-index:27;width:18px;overflow:hidden;background:#e5e5e5;pointer-events:auto;--office-kit-ruler-page-top:0px;--office-kit-ruler-page-height:760px}",
        ".syncfusion-office-kit-vertical-ruler-page{position:absolute;top:var(--office-kit-ruler-page-top);left:2px;width:14px;height:var(--office-kit-ruler-page-height);overflow:hidden;background:#fff;--office-kit-ruler-centimeter-height:38px;--office-kit-ruler-top-margin:7%;--office-kit-ruler-bottom-margin:7%}",
        ".syncfusion-office-kit-vertical-ruler-page:before{position:absolute;inset:0;z-index:1;background-image:repeating-linear-gradient(to bottom,#5f5f5f 0 1px,transparent 1px calc(var(--office-kit-ruler-centimeter-height) / 2)),repeating-linear-gradient(to bottom,#5f5f5f 0 1px,transparent 1px var(--office-kit-ruler-centimeter-height));background-repeat:repeat-y;background-size:1px calc(var(--office-kit-ruler-centimeter-height) * 10),4px calc(var(--office-kit-ruler-centimeter-height) * 10);background-position:50% calc(var(--office-kit-ruler-origin-y,0px) + var(--office-kit-ruler-centimeter-height) / 4),50% calc(var(--office-kit-ruler-origin-y,0px) + var(--office-kit-ruler-centimeter-height) / 2);pointer-events:none;content:''}",
        ".syncfusion-office-kit-vertical-ruler-page:after{display:none}",
        ".syncfusion-office-kit-vertical-margin-zone{position:absolute;right:0;left:0;z-index:0;background:#cbcbcb;pointer-events:none}",
        ".syncfusion-office-kit-vertical-margin-top{top:0;height:var(--office-kit-ruler-top-margin)}",
        ".syncfusion-office-kit-vertical-margin-bottom{bottom:0;height:var(--office-kit-ruler-bottom-margin)}",
        ".syncfusion-office-kit-vertical-ruler-number{position:absolute;top:calc(var(--office-kit-ruler-origin-y,0px) + var(--office-kit-ruler-position) * var(--office-kit-ruler-centimeter-height));left:50%;z-index:2;color:#3b3b3b;font:9px/1 'Segoe UI',Arial,sans-serif;transform:translate(-50%,-50%) rotate(-90deg);pointer-events:none}",
        ".syncfusion-office-kit-vertical-handle{position:absolute;right:0;left:0;z-index:4;height:7px;padding:0;border:0;background:transparent;transform:translateY(-50%);cursor:ns-resize;pointer-events:auto;touch-action:none}",
        ".syncfusion-office-kit-ruler-user-select-none{user-select:none!important}",
        ".syncfusion-office-kit-rulers-hidden .syncfusion-office-kit-horizontal-ruler,.syncfusion-office-kit-rulers-hidden .syncfusion-office-kit-vertical-ruler{display:none!important}",
        ".wk-tab-selector{display:grid!important;box-sizing:border-box;width:14px;height:14px;margin:2px;padding:0;place-items:center;border:1px solid #bdbdbd;background:#fff;cursor:pointer}",
        ".wk-tab-selector:hover{border-color:#185abd}",
        ".wk-tab-glyph{position:relative;display:block;box-sizing:border-box;width:6px;height:6px}",
        ".wk-tab-glyph-left{border-bottom:2px solid #1f1f1f;border-left:2px solid #1f1f1f}",
        ".wk-tab-glyph-right{border-right:2px solid #1f1f1f;border-bottom:2px solid #1f1f1f}",
        ".wk-tab-glyph-center{width:8px;border-bottom:2px solid #1f1f1f}",
        ".wk-tab-glyph-center:before{position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:#1f1f1f;content:''}",
        ".wk-ruler-cols,.wk-ruler-tabs,.wk-ruler-rows{position:absolute;inset:0;z-index:6;pointer-events:none}",
        ".wk-ruler-tab{position:absolute;bottom:5px;box-sizing:border-box;width:6px;height:5px;pointer-events:auto;cursor:ew-resize}",
        ".wk-ruler-tab:after{position:absolute;inset:-4px -3px -1px -3px;content:''}",
        ".wk-ruler-tab-left,.wk-ruler-tab-list,.wk-ruler-tab-bar{margin-left:-1px;border-bottom:2px solid #1f1f1f;border-left:2px solid #1f1f1f}",
        ".wk-ruler-tab-right{margin-left:-5px;border-right:2px solid #1f1f1f;border-bottom:2px solid #1f1f1f}",
        ".wk-ruler-tab-center,.wk-ruler-tab-decimal{width:8px;margin-left:-4px;border-bottom:2px solid #1f1f1f}",
        ".wk-ruler-tab-center:before,.wk-ruler-tab-decimal:before{position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:#1f1f1f;content:''}",
        ".wk-ruler-tab.wk-removing{opacity:.25}",
        ".wk-ruler-col{position:absolute;top:3px;bottom:7px;box-sizing:border-box;width:7px;margin-left:-3.5px;border:1px solid #8c8c8c;background:repeating-linear-gradient(135deg,#6e6e6e 0 1px,#e6e6e6 1px 3px);pointer-events:auto;cursor:col-resize}",
        ".wk-ruler-row{position:absolute;right:3px;left:3px;box-sizing:border-box;height:7px;margin-top:-3.5px;border:1px solid #8c8c8c;background:repeating-linear-gradient(135deg,#6e6e6e 0 1px,#e6e6e6 1px 3px);pointer-events:auto;cursor:row-resize}",
        ".wk-ruler-row-fixed{opacity:.55;pointer-events:none}",
        ".wk-ruler-col:hover,.wk-ruler-row:hover,.wk-ruler-col.syncfusion-office-kit-ruler-dragging,.wk-ruler-row.syncfusion-office-kit-ruler-dragging{border-color:#185abd}",
        ".wk-ruler-in-table .syncfusion-office-kit-ruler-handle{display:none!important}",
        ".wk-ruler-guide{position:fixed;z-index:2500;display:none;pointer-events:none}",
        ".wk-ruler-guide.wk-show{display:block}",
        ".wk-ruler-guide-x{width:0;border-left:1px dotted #252423}",
        ".wk-ruler-guide-y{height:0;border-top:1px dotted #252423}",
        ".wk-table-handle{position:absolute;z-index:26;display:grid;box-sizing:border-box;width:16px;height:16px;padding:0;place-items:center;border:1px solid #a19f9d;border-radius:2px;background:#fff;color:#252423;cursor:pointer}",
        ".wk-table-handle[hidden]{display:none}",
        ".wk-table-handle:hover{border-color:#185abd;color:#185abd}",
        ".wk-table-handle svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}",
    ].join("\n");
    document.head.appendChild(style);
}

function placeSyncfusionOfficeKitRibbon(ribbon, titlebar, mountBefore) {
    var parent = null;

    if (mountBefore && mountBefore.parentNode) {
        parent = mountBefore.parentNode;
        parent.insertBefore(ribbon, mountBefore);
        return true;
    }

    if (titlebar && titlebar.parentNode) {
        parent = titlebar.parentNode;
        parent.appendChild(ribbon);
        return true;
    }

    if (document.body) {
        document.body.insertBefore(ribbon, document.body.firstChild);
        return true;
    }

    return false;
}

function scheduleSyncfusionOfficeKitChrome(editorContainer) {
    var delays = [0, 100, 400, 1000, 1800];

    delays.forEach(function (delay) {
        setTimeout(function () {
            try {
                installSyncfusionOfficeKitChrome(editorContainer);
            } catch (error) {
                console.error("Syncfusion Office kit chrome install error:", error);
            }
        }, delay);
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            installSyncfusionOfficeKitChrome(editorContainer);
        });
    }

    // Giu ribbon luon hien: khi editor re-render lam mat ribbon thi gan lai.
    keepSyncfusionOfficeKitChromePersistent(editorContainer);
}

function keepSyncfusionOfficeKitChromePersistent(editorContainer) {
    if (window.__officeKitChromeObserver || typeof MutationObserver === "undefined" || !document.body) {
        window.__officeKitChromeContainer = editorContainer || window.__officeKitChromeContainer;
        return;
    }

    window.__officeKitChromeContainer = editorContainer;
    var pending = false;
    window.__officeKitChromeObserver = new MutationObserver(function () {
        if (pending || document.getElementById("syncfusion-office-kit-ribbon")) {
            return;
        }
        pending = true;
        setTimeout(function () {
            pending = false;
            if (document.getElementById("syncfusion-office-kit-ribbon")) {
                return;
            }
            try {
                installSyncfusionOfficeKitChrome(window.__officeKitChromeContainer);
            } catch (error) {
                console.error("Syncfusion Office kit chrome re-install error:", error);
            }
        }, 60);
    });
    window.__officeKitChromeObserver.observe(document.body, { childList: true, subtree: true });
}

function wireSyncfusionOfficeKitChrome(ribbon, editorContainer) {
    // Bam nut tren ribbon khong lay focus khoi van ban (giong Word): bam B xong go tiep duoc ngay.
    ribbon.addEventListener("mousedown", function (event) {
        if (event.target.closest("button")) {
            event.preventDefault();
        }
    });

    ribbon.addEventListener("click", function (event) {
        var tabButton = event.target.closest("[data-office-kit-tab]");
        if (tabButton) {
            selectSyncfusionOfficeKitTab(ribbon, tabButton.getAttribute("data-office-kit-tab"), true);
            return;
        }

        var caret = event.target.closest("[data-office-kit-combo-toggle]");
        if (caret) {
            toggleSyncfusionOfficeKitCombo(caret.closest(".contract-template-office-combo"));
            return;
        }

        var comboItem = event.target.closest("[data-office-kit-combo-value]");
        if (comboItem) {
            var combo = comboItem.closest(".contract-template-office-combo");
            var input = combo.querySelector("input");
            if (input) {
                input.value = comboItem.getAttribute("data-office-kit-combo-value");
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            closeSyncfusionOfficeKitCombos(null);
            return;
        }

        var menuToggle = event.target.closest("[data-wk-menu-toggle]");
        if (menuToggle) {
            openWordKitMenu(menuToggle);
            return;
        }

        var cell = event.target.closest("[data-wk-cell]");
        if (cell) {
            closeWordKitMenus();
            runSyncfusionOfficeKitCommand(editorContainer, "insert-table-grid", cell.getAttribute("data-wk-cell"));
            return;
        }

        var commandButton = event.target.closest("[data-office-kit-command]");
        if (commandButton && !commandButton.disabled) {
            closeWordKitMenus();
            ribbon.classList.remove("wk-peek");
            runSyncfusionOfficeKitCommand(editorContainer, commandButton.getAttribute("data-office-kit-command"), commandButton.getAttribute("data-office-kit-arg"));
        }
    });

    // Bam dup ten tab = thu gon/mo ribbon nhu Word.
    ribbon.addEventListener("dblclick", function (event) {
        if (event.target.closest("[data-office-kit-tab]")) {
            toggleWordKitRibbonCollapsed(ribbon);
        }
    });

    ribbon.addEventListener("mouseover", function (event) {
        var cell = event.target.closest("[data-wk-cell]");
        if (cell) {
            highlightWordKitTableGrid(ribbon, cell.getAttribute("data-wk-cell"));
        }
    });

    ribbon.addEventListener("change", function (event) {
        var control = event.target.closest("[data-office-kit-change]");
        if (control) {
            // Chon "Mau khac..." cho chu thi dong menu; mau / do day but ve vien thi giu menu de chon kieu vien tiep.
            if (control.getAttribute("data-office-kit-change") === "font-color-custom") {
                closeWordKitMenus();
            }
            runSyncfusionOfficeKitChange(editorContainer, control.getAttribute("data-office-kit-change"), control.value);
        }
    });

    // Combobox font/size: mo menu khi focus, loc khi go, chon bang chuot.
    ribbon.addEventListener("focusin", function (event) {
        var comboInput = event.target.closest(".contract-template-office-combo input");
        if (comboInput) {
            closeWordKitMenus();
            openSyncfusionOfficeKitCombo(comboInput.closest(".contract-template-office-combo"));
            if (typeof comboInput.select === "function") {
                comboInput.select();
            }
        }
    });

    ribbon.addEventListener("input", function (event) {
        var comboInput = event.target.closest(".contract-template-office-combo input");
        if (comboInput) {
            var combo = comboInput.closest(".contract-template-office-combo");
            filterSyncfusionOfficeKitCombo(combo, comboInput.value);
            var menu = combo.querySelector("[data-office-kit-combo-menu]");
            if (menu) {
                menu.classList.add("contract-template-office-combo-menu-open");
            }
            positionSyncfusionOfficeKitCombo(combo);
        }
    });

    ribbon.addEventListener("keydown", function (event) {
        var comboInput = event.target.closest(".contract-template-office-combo input");
        if (comboInput && (event.key === "Enter" || event.key === "Escape")) {
            event.preventDefault();
            if (event.key === "Enter") {
                comboInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            closeSyncfusionOfficeKitCombos(null);
            comboInput.blur();
            var editor = getSyncfusionOfficeKitEditor(editorContainer);
            if (editor && editor.focusIn) {
                editor.focusIn();
            }
        }
    });

    if (!window.__wordKitDocumentWired) {
        window.__wordKitDocumentWired = true;
        document.addEventListener("click", function (event) {
            if (!event.target.closest(".wk-menu") && !event.target.closest("[data-wk-menu-toggle]")) {
                closeWordKitMenus();
            }
            if (!event.target.closest(".contract-template-office-combo")) {
                closeSyncfusionOfficeKitCombos(null);
            }
            if (!event.target.closest("#syncfusion-office-kit-ribbon")) {
                var currentRibbon = document.getElementById("syncfusion-office-kit-ribbon");
                if (currentRibbon) {
                    currentRibbon.classList.remove("wk-peek");
                }
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeWordKitMenus();
                closeSyncfusionOfficeKitCombos(null);
                if (wordKitFormatPainter) {
                    stopWordKitFormatPainter();
                }
            }
        }, true);
        // Syncfusion sao chep bang mot div tam trong trang chinh (execCommand copy) -> nghe o document de nho ban SFDT.
        ["copy", "cut"].forEach(function (name) {
            document.addEventListener(name, function (event) {
                saveSyncfusionOfficeKitClipboard(getSyncfusionOfficeKitEditor(window.container), event);
            }, false);
        });
        // Dan vao bo soan xu ly o patchWordKitPasteHandler (o nhap cua Syncfusion nam trong iframe, su kien khong toi day).
        document.addEventListener("paste", function () {
            lockSyncfusionOfficeKitPageScroll();
        }, true);
        window.addEventListener("resize", closeWordKitMenus);
        // Menu dung position:fixed -> trang cuon thi dong lai cho khoi troi lech (tru khi cuon ben trong menu).
        window.addEventListener("scroll", function (event) {
            if (!(event.target && event.target.closest && event.target.closest(".wk-menu, .contract-template-office-combo-menu"))) {
                closeWordKitMenus();
            }
        }, true);
    }

    attachWordKitEditorEvents(editorContainer);
}

function selectSyncfusionOfficeKitTab(ribbon, tabName, fromUser) {
    ribbon.querySelectorAll("[data-office-kit-tab]").forEach(function (button) {
        var active = button.getAttribute("data-office-kit-tab") === tabName;
        button.classList.toggle("wk-tab-active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
    });
    ribbon.querySelectorAll("[data-office-kit-panel]").forEach(function (panel) {
        panel.classList.toggle("wk-panel-active", panel.getAttribute("data-office-kit-panel") === tabName);
    });
    closeWordKitMenus();
    // Ribbon dang thu gon: bam tab thi hien tam de chon lenh, bam ra ngoai la an (giong Word).
    if (fromUser && ribbon.classList.contains("wk-collapsed")) {
        ribbon.classList.add("wk-peek");
    }
}

function isWordKitRibbonCollapsed() {
    try {
        return window.localStorage.getItem("wordKitRibbonCollapsed") === "1";
    } catch (error) {
        return false;
    }
}

function toggleWordKitRibbonCollapsed(ribbon) {
    ribbon = ribbon || document.getElementById("syncfusion-office-kit-ribbon");
    if (!ribbon) {
        return;
    }

    var collapsed = !ribbon.classList.contains("wk-collapsed");
    ribbon.classList.toggle("wk-collapsed", collapsed);
    ribbon.classList.remove("wk-peek");
    try {
        window.localStorage.setItem("wordKitRibbonCollapsed", collapsed ? "1" : "0");
    } catch (error) {
        // Che do an danh / chan luu tru: van thu gon duoc, chi khong nho lan sau.
    }
    if (window.container && typeof window.container.resize === "function") {
        window.container.resize();
    }
    scheduleSyncfusionOfficeKitRulerUpdate(window.container);
}

function highlightWordKitTableGrid(ribbon, value) {
    var parts = String(value || "").split(",");
    var rows = Number(parts[0]) || 0;
    var columns = Number(parts[1]) || 0;
    ribbon.querySelectorAll("[data-wk-cell]").forEach(function (cell) {
        var position = cell.getAttribute("data-wk-cell").split(",");
        cell.classList.toggle("wk-on", Number(position[0]) <= rows && Number(position[1]) <= columns);
    });
    var label = ribbon.querySelector("[data-wk-grid-label]");
    if (label) {
        label.textContent = rows && columns ? "Bảng " + columns + " cột × " + rows + " hàng" : "Chèn bảng";
    }
}

function getSyncfusionOfficeKitEditor(editorContainer) {
    if (editorContainer && editorContainer.documentEditor) {
        return editorContainer.documentEditor;
    }

    return window.container && window.container.documentEditor ? window.container.documentEditor : null;
}

// ---------------------------------------------------------------------------
// Dong bo trang thai nut theo vi tri con tro (B sang khi dung trong chu dam, o font/co chu
// hien dung font dang go, hien tab "Bang" khi con tro trong bang...). Gop ve 1 lan/khung hinh
// vi selectionChange/contentChange ban ra theo tung phim go.
// ---------------------------------------------------------------------------
var wordKitStateFrame = 0;
var wordKitRulerSignature = "";

function attachWordKitEditorEvents(editorContainer) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!editor || editor.wordKitEventsAttached || typeof editor.addEventListener !== "function") {
        return;
    }
    editor.wordKitEventsAttached = true;

    var refresh = function () {
        scheduleWordKitStateUpdate(editorContainer);
    };
    // addEventListener (khong gan de thuoc tinh) de khong de len handler trang khac tu gan.
    editor.addEventListener("selectionChange", refresh);
    editor.addEventListener("contentChange", refresh);
    editor.addEventListener("documentChange", function () {
        patchWordKitPasteOptions(editor);
        refresh();
    });
    editor.addEventListener("keyDown", function (args) {
        handleWordKitKeyDown(editorContainer, editor, args);
    });
    patchWordKitPasteOptions(editor);
    patchWordKitPasteHandler(editor);
    watchWordKitTableBorderDrag(editorContainer, editor);
    installWordKitContextMenu(editorContainer, editor);
    wireWordKitMiniToolbar(editorContainer, editor);
    wireWordKitShiftClickSelect(editor);
    patchWordKitPageSetupDialog(editor);

    document.addEventListener("mouseup", function (event) {
        if (wordKitFormatPainter) {
            var target = event.target;
            setTimeout(function () {
                applyWordKitFormatPainter(editorContainer, target);
            }, 0);
        }
    });
}

// ---------------------------------------------------------------------------
// Hop "Thiet lap trang" cua Syncfusion chi nhan pt: them o chon don vi (cm, mm, inch, pt) nhu Word.
// Mo hop thi doi pt -> don vi chon, bam Dong y thi doi nguoc ve pt. O nao khong sua giu nguyen pt goc
// (khong lam tron qua lai lam le xe dich). Don vi chon nho trong trinh duyet cua nguoi dung.
// ---------------------------------------------------------------------------

var wordKitDonViTrang = {
    cm: { pt: 72 / 2.54, soLe: 2, buoc: 0.1, ten: "cm (xentimét)" },
    mm: { pt: 72 / 25.4, soLe: 1, buoc: 1, ten: "mm (milimét)" },
    inch: { pt: 72, soLe: 2, buoc: 0.05, ten: "inch" },
    pt: { pt: 1, soLe: 2, buoc: 1, ten: "pt (điểm)" },
};

var wordKitOTrang = {
    top: "topMarginBox", bottom: "bottomMarginBox", left: "leftMarginBox", right: "rightMarginBox",
    width: "widthBox", height: "heightBox", header: "headerBox", footer: "footerBox",
};

function docWordKitDonViTrang() {
    try {
        var donVi = window.localStorage.getItem("wordKitDonViTrang");
        return wordKitDonViTrang[donVi] ? donVi : "cm";
    } catch (error) {
        return "cm";
    }
}

function ghiWordKitDonViTrang(donVi) {
    try {
        window.localStorage.setItem("wordKitDonViTrang", donVi);
    } catch (error) {
        // trinh duyet chan luu tru: lan sau ve cm
    }
}

// Gia tri pt cua o: neu o dang hien dung so da dat (ke ca sau khi doi Doc/Ngang, hai o doi cho nhau)
// thi lay pt goc da luu; nguoi dung go so moi thi doi tu don vi dang hien.
function layWordKitPtHopTrang(dlg, khoa) {
    var box = dlg[wordKitOTrang[khoa]];
    var value = Number(box && box.value);
    if (!box || !isFinite(value)) {
        return null;
    }
    var daDat = dlg.wordKitDaDat || {};
    for (var k in daDat) {
        if (daDat[k].hien === value) {
            return daDat[k].pt;
        }
    }
    return Math.round(value * wordKitDonViTrang[dlg.wordKitDonVi || "pt"].pt * 100) / 100;
}

function datWordKitHopTrang(dlg, donVi) {
    var cu = {};
    Object.keys(wordKitOTrang).forEach(function (khoa) {
        cu[khoa] = layWordKitPtHopTrang(dlg, khoa);
    });
    var dv = wordKitDonViTrang[donVi];
    dlg.wordKitDonVi = donVi;
    dlg.wordKitDaDat = {};
    Object.keys(wordKitOTrang).forEach(function (khoa) {
        var box = dlg[wordKitOTrang[khoa]];
        if (!box || cu[khoa] === null) {
            return;
        }
        var hien = Math.round(cu[khoa] / dv.pt * Math.pow(10, dv.soLe)) / Math.pow(10, dv.soLe);
        box.decimals = dv.soLe;
        box.format = "n" + dv.soLe;
        box.step = dv.buoc;
        box.value = hien;
        if (typeof box.dataBind === "function") {
            box.dataBind();
        }
        dlg.wordKitDaDat[khoa] = { pt: cu[khoa], hien: Number(box.value) };
        // Nhan dung ngay truoc o so: them "(cm)" ...
        var wrapper = box.element && box.element.closest(".e-numeric");
        var nhan = wrapper ? wrapper.previousElementSibling : null;
        if (nhan && nhan.tagName === "LABEL") {
            if (!nhan.hasAttribute("data-wk-nhan")) {
                nhan.setAttribute("data-wk-nhan", nhan.textContent);
            }
            nhan.textContent = nhan.getAttribute("data-wk-nhan") + " (" + donVi + ")";
        }
    });
}

function patchWordKitPageSetupDialog(editor) {
    var dlg = editor.pageSetupDialogModule;
    if (!dlg || dlg.wordKitPatched || typeof dlg.loadPageSetupDialog !== "function" || typeof dlg.applyPageSetupProperties !== "function") {
        return;
    }
    dlg.wordKitPatched = true;

    // show() gan loadPageSetupDialog / applyPageSetupProperties vao hop thoai moi lan mo -> boc tai thuc the.
    var napGoc = dlg.loadPageSetupDialog;
    dlg.loadPageSetupDialog = function () {
        // Xoa trang thai lan mo truoc truoc khi nap: nap goc dat lai khoi giay va co the kich hoat su kien doi khoi giay.
        dlg.wordKitDonVi = "pt";
        dlg.wordKitDaDat = {};
        napGoc.apply(this, arguments);
        var donVi = docWordKitDonViTrang();
        var chon = ganWordKitChonDonViTrang(dlg);
        if (chon) {
            chon.value = donVi;
        }
        datWordKitHopTrang(dlg, donVi);
    };

    var apDungGoc = dlg.applyPageSetupProperties;
    dlg.applyPageSetupProperties = function () {
        if (dlg.wordKitDonVi && dlg.wordKitDonVi !== "pt") {
            datWordKitHopTrang(dlg, "pt");
        }
        apDungGoc.apply(this, arguments);
    };
}

// O chon don vi o dau hop; doi khoi giay (Letter, A4...) thi Syncfusion dien thang pt vao o rong/cao -> doi lai.
function ganWordKitChonDonViTrang(dlg) {
    if (!dlg.target) {
        return null;
    }
    var chon = dlg.target.querySelector(".wk-don-vi-trang select");
    if (chon) {
        return chon;
    }
    var hang = document.createElement("div");
    hang.className = "wk-don-vi-trang";
    hang.innerHTML = '<label>Đơn vị <select aria-label="Đơn vị đo" title="Đơn vị đo lề, khổ giấy, khoảng cách đầu/chân trang">'
        + Object.keys(wordKitDonViTrang).map(function (donVi) {
            return '<option value="' + donVi + '" title="' + wordKitDonViTrang[donVi].ten + '">' + donVi + "</option>";
        }).join("")
        + "</select></label>";
    dlg.target.style.position = "relative";
    dlg.target.insertBefore(hang, dlg.target.firstChild);
    chon = hang.querySelector("select");
    chon.addEventListener("change", function () {
        ghiWordKitDonViTrang(chon.value);
        datWordKitHopTrang(dlg, chon.value);
    });

    if (dlg.paperSize && typeof dlg.paperSize.addEventListener === "function") {
        // Chay sau xu ly goc (dang ky truoc). Xu ly goc dien thang pt vao o rong/cao, ke ca khi mo hop (tu chon
        // lai khoi giay, "Tùy chỉnh" lay kich thuoc trang hien tai): o nao khac so minh da dat la vua bi ghi pt.
        dlg.paperSize.addEventListener("change", function (args) {
            if (!args || !args.value || !dlg.wordKitDonVi || dlg.wordKitDonVi === "pt") {
                return;
            }
            var dv = wordKitDonViTrang[dlg.wordKitDonVi];
            ["width", "height"].forEach(function (khoa) {
                var box = dlg[wordKitOTrang[khoa]];
                var pt = Number(box && box.value);
                var daDat = dlg.wordKitDaDat[khoa];
                if (!box || !isFinite(pt) || (daDat && daDat.hien === pt)) {
                    return;
                }
                box.value = Math.round(pt / dv.pt * Math.pow(10, dv.soLe)) / Math.pow(10, dv.soLe);
                if (typeof box.dataBind === "function") {
                    box.dataBind();
                }
                dlg.wordKitDaDat[khoa] = { pt: pt, hien: Number(box.value) };
            });
        });
    }
    return chon;
}

function handleWordKitKeyDown(editorContainer, editor, args) {
    var event = args && args.event;
    if (!event || args.isHandled) {
        return;
    }
    var keyCode = event.which || event.keyCode;
    var isCtrlKey = event.ctrlKey || event.metaKey;
    // Ctrl+S: luu nhu Word (truoc day trinh duyet mo hop "Luu trang web" vo nghia).
    if (isCtrlKey && !event.shiftKey && !event.altKey && keyCode === 83) {
        args.isHandled = true;
        event.preventDefault();
        if (getWordKitSaveButton()) {
            runSyncfusionOfficeKitCommand(editorContainer, "save-template");
        } else {
            showWordKitToast("Trang này không có nút Lưu. Dùng \"Tải DOCX\" nếu cần bản Word.");
        }
    } else if (isCtrlKey && keyCode === 112) {
        // Ctrl+F1: thu gon / hien ribbon.
        args.isHandled = true;
        event.preventDefault();
        toggleWordKitRibbonCollapsed();
    } else if (isCtrlKey && !event.shiftKey && keyCode === 68) {
        // Ctrl+D: hop thoai Phong chu (Ctrl+D cua trinh duyet la danh dau trang).
        args.isHandled = true;
        event.preventDefault();
        showSyncfusionDialog(editor, "Font");
    }
}

function scheduleWordKitStateUpdate(editorContainer) {
    if (wordKitStateFrame) {
        return;
    }

    var run = function () {
        wordKitStateFrame = 0;
        try {
            updateWordKitState(editorContainer);
        } catch (error) {
            console.warn("Word kit state update failed:", error);
        }
    };
    wordKitStateFrame = typeof window.requestAnimationFrame === "function" ? window.requestAnimationFrame(run) : setTimeout(run, 16);
}

function updateWordKitState(editorContainer) {
    var ribbon = document.getElementById("syncfusion-office-kit-ribbon");
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!ribbon || !editor || !editor.selection) {
        return;
    }

    var selection = editor.selection;
    var characterFormat = selection.characterFormat || {};
    var paragraphFormat = selection.paragraphFormat || {};
    var sectionFormat = selection.sectionFormat || {};
    var contextType = String(selection.contextType || "");
    var inTable = contextType.indexOf("Table") !== -1;
    var cellAlignment = inTable && selection.cellFormat ? selection.cellFormat.verticalAlignment : "";
    var alignment = paragraphFormat.textAlignment;
    var styleName = paragraphFormat.styleName;
    var activeContainer = getSyncfusionOfficeKitActiveContainer(editorContainer);
    var landscape = Number(sectionFormat.pageWidth) > Number(sectionFormat.pageHeight);
    var states = {
        bold: characterFormat.bold === true,
        italic: characterFormat.italic === true,
        underline: !!characterFormat.underline && characterFormat.underline !== "None",
        strike: !!characterFormat.strikethrough && characterFormat.strikethrough !== "None",
        sub: characterFormat.baselineAlignment === "Subscript",
        sup: characterFormat.baselineAlignment === "Superscript",
        "align-left": alignment === "Left",
        "align-center": alignment === "Center",
        "align-right": alignment === "Right",
        justify: alignment === "Justify",
        "style-normal": styleName === "Normal",
        "style-heading1": styleName === "Heading 1",
        "style-heading2": styleName === "Heading 2",
        "style-title": styleName === "Title",
        "track-changes": editor.enableTrackChanges === true,
        "show-comments": editor.showComments === true,
        "show-revisions": editor.showRevisions === true,
        "layout-pages": editor.layoutType !== "Continuous",
        "layout-web": editor.layoutType === "Continuous",
        ruler: !(activeContainer && activeContainer.element && activeContainer.element.classList.contains("syncfusion-office-kit-rulers-hidden")),
        "format-painter": !!wordKitFormatPainter,
        "valign-top": cellAlignment === "Top",
        "valign-center": cellAlignment === "Center",
        "valign-bottom": cellAlignment === "Bottom",
        "orientation-portrait": !landscape,
        "orientation-landscape": landscape,
    };
    var lineSpacing = paragraphFormat.lineSpacingType === "Multiple" ? Number(paragraphFormat.lineSpacing) : NaN;

    ribbon.querySelectorAll("[data-wk-state]").forEach(function (button) {
        var key = button.getAttribute("data-wk-state");
        var on;
        if (key.indexOf("ls-") === 0) {
            on = Math.abs(Number(key.slice(3)) - lineSpacing) < 0.01;
        } else if (Object.prototype.hasOwnProperty.call(states, key)) {
            on = states[key];
        } else {
            return;
        }
        if (button.classList.contains("wk-on") !== on) {
            button.classList.toggle("wk-on", on);
            button.setAttribute("aria-pressed", on ? "true" : "false");
        }
    });

    setWordKitComboValue(ribbon, "font-family", characterFormat.fontFamily || "");
    setWordKitComboValue(ribbon, "font-size", Number(characterFormat.fontSize) > 0 ? String(Math.round(Number(characterFormat.fontSize) * 10) / 10) : "");

    if (inTable && selection.cellFormat) {
        ["top", "bottom", "left", "right"].forEach(function (side) {
            setSyncfusionOfficeKitNumberControl(ribbon, "table-cell-margin-" + side, syncfusionOfficeKitPointsToCentimeters(Number(selection.cellFormat[side + "Margin"]) || 0), 2);
        });
    }

    var beforeLabel = ribbon.querySelector('[data-wk-label="space-before"]');
    if (beforeLabel) {
        beforeLabel.textContent = Number(paragraphFormat.beforeSpacing) > 0 ? "Bỏ khoảng cách trước đoạn" : "Thêm khoảng cách trước đoạn";
    }
    var afterLabel = ribbon.querySelector('[data-wk-label="space-after"]');
    if (afterLabel) {
        afterLabel.textContent = Number(paragraphFormat.afterSpacing) > 0 ? "Bỏ khoảng cách sau đoạn" : "Thêm khoảng cách sau đoạn";
    }

    var tableTab = ribbon.querySelector('[data-office-kit-tab="table"]');
    if (tableTab && tableTab.hidden === inTable) {
        tableTab.hidden = !inTable;
        if (!inTable && tableTab.classList.contains("wk-tab-active")) {
            selectSyncfusionOfficeKitTab(ribbon, "home");
        }
    }

    // Thuoc ke chi can ve lai khi le/thut le doi; go chu binh thuong khong dong toi thuoc.
    var rulerSignature = [
        paragraphFormat.leftIndent, paragraphFormat.rightIndent, paragraphFormat.firstLineIndent,
        sectionFormat.leftMargin, sectionFormat.rightMargin, sectionFormat.topMargin, sectionFormat.bottomMargin,
        sectionFormat.pageWidth, sectionFormat.pageHeight, getWordKitRulerContextSignature(editor),
    ].join("|");
    if (rulerSignature !== wordKitRulerSignature) {
        wordKitRulerSignature = rulerSignature;
        scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
    }
}

// O bang dang dung (vi tri, so cot/hang, chieu cao hang) + tab cua doan: doi la phai ve lai thuoc.
function getWordKitRulerContextSignature(editor) {
    var paragraph = getWordKitSelectionStartParagraph(editor);
    if (!paragraph) {
        return "";
    }
    var parts = [];
    var cell = paragraph.isInsideTable ? paragraph.associatedCell : null;
    if (cell) {
        parts.push(cell.x, cell.width, cell.ownerRow ? cell.ownerRow.childWidgets.length + ":" + cell.ownerRow.height : "", cell.ownerTable ? cell.ownerTable.childWidgets.length : "");
    }
    parts.push(getWordKitParagraphTabs(paragraph).map(function (tab) { return tab.position + tab.type; }).join(","));
    return parts.join(";");
}

// Ca o tren ribbon lan o tren thanh cong cu nho (chuot phai).
function setWordKitComboValue(ribbon, changeName, value) {
    ribbon.querySelectorAll('.contract-template-office-combo input[data-office-kit-change="' + changeName + '"]').forEach(function (input) {
        if (input !== document.activeElement && input.value !== value) {
            input.value = value;
        }
    });
}

// ---------------------------------------------------------------------------
// Sao dinh dang (Format Painter): bam nut khi dang boi den chu mau, roi boi den cho can ap.
// ---------------------------------------------------------------------------
var wordKitFormatPainter = null;
var wordKitCharacterProperties = ["bold", "italic", "underline", "strikethrough", "baselineAlignment", "fontFamily", "fontSize", "fontColor", "highlightColor"];
var wordKitParagraphProperties = ["textAlignment", "leftIndent", "rightIndent", "firstLineIndent", "beforeSpacing", "afterSpacing", "lineSpacing", "lineSpacingType"];

function pickWordKitFormat(format, properties) {
    var picked = {};
    properties.forEach(function (property) {
        var value = format ? format[property] : undefined;
        // Vung chon lan nhieu dinh dang tra ve undefined/"" -> bo qua, khong ghi de.
        if (value !== undefined && value !== null && value !== "") {
            picked[property] = value;
        }
    });
    return picked;
}

function wordKitSelectionKey(selection) {
    return String(selection.startOffset) + "|" + String(selection.endOffset);
}

function toggleWordKitFormatPainter(editor) {
    if (wordKitFormatPainter) {
        stopWordKitFormatPainter();
        return;
    }

    var selection = editor.selection;
    wordKitFormatPainter = {
        source: wordKitSelectionKey(selection),
        character: pickWordKitFormat(selection.characterFormat, wordKitCharacterProperties),
        // Giong Word: chi dat con tro (khong boi den) thi sao ca dinh dang doan.
        paragraph: selection.isEmpty ? pickWordKitFormat(selection.paragraphFormat, wordKitParagraphProperties) : null,
    };
    document.body.classList.add("wk-painting");
    showWordKitToast("Sao định dạng: bôi đen chỗ cần áp dụng. Bấm Esc để hủy.");
}

function stopWordKitFormatPainter() {
    wordKitFormatPainter = null;
    document.body.classList.remove("wk-painting");
    scheduleWordKitStateUpdate(window.container);
}

function applyWordKitFormatPainter(editorContainer, target) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    var painter = wordKitFormatPainter;
    if (!painter || !editor || !editor.selection || editor.selection.isEmpty) {
        return;
    }

    var viewer = editor.documentHelper && editor.documentHelper.viewerContainer;
    if (viewer && target && !viewer.contains(target)) {
        return;
    }
    if (wordKitSelectionKey(editor.selection) === painter.source) {
        return;
    }

    stopWordKitFormatPainter();
    var characterFormat = editor.selection.characterFormat;
    Object.keys(painter.character).forEach(function (property) {
        characterFormat[property] = painter.character[property];
    });
    if (painter.paragraph) {
        var paragraphFormat = editor.selection.paragraphFormat;
        Object.keys(painter.paragraph).forEach(function (property) {
            paragraphFormat[property] = painter.paragraph[property];
        });
    }
}

// ---------------------------------------------------------------------------
// Dan (Paste)
// ---------------------------------------------------------------------------
// Nut tuy chon dan co san cua Syncfusion so khop theo chu tieng Anh ("Keep source formatting"...).
// Da dich sang tieng Viet nen phai thay ham xu ly: nhan dien theo bieu tuong cua tung muc.
function patchWordKitPasteOptions(editor) {
    var selection = editor && editor.selection;
    if (!selection || selection.wordKitPastePatched || !editor.editor || typeof editor.editor.applyPasteOptions !== "function") {
        return;
    }
    selection.wordKitPastePatched = true;
    selection.pasteOptions = function (args) {
        var iconCss = String(args && args.item && args.item.iconCss || "");
        var option = iconCss.indexOf("paste-source") !== -1
            ? "KeepSourceFormatting"
            : (iconCss.indexOf("paste-merge") !== -1 ? "MergeWithExistingFormatting" : "KeepTextOnly");
        editor.editor.applyPasteOptions(option);
    };
}

// Dan giu dinh dang khong qua may chu. Truoc day HTML/RTF trong bo nho tam duoc gui len dich vu .NET
// (SystemClipboard) de doi sang SFDT; nay moi lan dan (Ctrl+V, menu chuot phai, nut Dan) di qua pasteInternal:
//  - chu trong bo nho tam khop ban vua sao chep trong bo soan -> dan lai dung SFDT da sao chep (giu tron dinh dang);
//  - co text/html (Word, trang web, Excel) -> doi HTML sang SFDT ngay tren trinh duyet (convertWordKitHtmlToSfdt);
//  - chi co chu thuong / anh -> de Syncfusion tu dan (an RTF de khong goi dich vu).
var wordKitPasteTextOnly = false;

function patchWordKitPasteHandler(editor) {
    var editorModule = editor && (editor.editorModule || editor.editor);
    if (!editorModule || editorModule.wordKitPasteHandled || typeof editorModule.pasteInternal !== "function") {
        return;
    }
    var originalPasteInternal = editorModule.pasteInternal;
    editorModule.wordKitPasteHandled = true;
    editorModule.pasteInternal = function (event, pasteWindow) {
        if (editor.enableLocalPaste) {
            return originalPasteInternal.apply(editorModule, arguments);
        }
        var clipboard = (pasteWindow && pasteWindow.clipboardData) || (event && event.clipboardData) || null;
        if (!clipboard) {
            // Menu chuot phai "Dan" cua Syncfusion goi pasteInternal() khong kem su kien: doc bo nho tam nhu nut Dan.
            pasteWordKitFromClipboard(editor, false);
            return;
        }
        lockSyncfusionOfficeKitPageScroll();
        handleWordKitPaste(editor, editorModule, originalPasteInternal, clipboard);
    };
}

function readWordKitClipboardData(clipboard, type) {
    try {
        return String(clipboard.getData(type) || "");
    } catch (error) {
        return "";
    }
}

function handleWordKitPaste(editor, editorModule, originalPasteInternal, clipboard) {
    var text = readWordKitClipboardData(clipboard, "text/plain") || readWordKitClipboardData(clipboard, "Text");
    var textOnly = wordKitPasteTextOnly || isWordKitInlineFormFill(editor);
    var html = textOnly ? "" : readWordKitClipboardData(clipboard, "text/html");
    var pastePlain = function () {
        // Syncfusion dan chu xong goi applyPasteOptions: con giu SFDT cua lan dan truoc (copiedContent) thi dan lai
        // noi dung cu de len chu vua dan. Xoa di de tuy chon dan dung chu thuong nay.
        editorModule.copiedContent = "";
        originalPasteInternal.call(editorModule, { clipboardData: createWordKitPlainClipboard(clipboard, text) });
    };

    if (!textOnly) {
        var copiedSfdt = syncfusionOfficeKitSfdtFromClipboard(text) || loadSyncfusionOfficeKitClipboard(text);
        if (copiedSfdt && pasteSyncfusionOfficeKitSfdt(editor, copiedSfdt, text)) {
            return;
        }
        if (html && wordKitHtmlHasContent(html)) {
            convertWordKitHtmlToSfdt(html, editor).then(function (sfdt) {
                if (!sfdt || !pasteSyncfusionOfficeKitSfdt(editor, sfdt, text)) {
                    pastePlain();
                }
            }).catch(function (error) {
                console.error("Office kit HTML paste error:", error);
                pastePlain();
            });
            return;
        }
    }
    pastePlain();
}

// Bo nho tam chi con chu thuong (va anh): Syncfusion dan chu theo dinh dang cho con tro, hoac dan anh.
function createWordKitPlainClipboard(clipboard, text) {
    var items = null;
    var files = null;
    try {
        items = clipboard.items;
        files = clipboard.files;
    } catch (error) {
        // Het phien su kien paste.
    }
    return {
        items: items,
        files: files,
        types: ["text/plain"],
        getData: function (type) {
            return /^text(\/plain)?$/i.test(String(type)) ? (text || "") : "";
        },
    };
}

function isWordKitInlineFormFill(editor) {
    try {
        return editor.documentHelper.protectionType === "FormFieldsOnly" && editor.selection.isInlineFormFillMode();
    } catch (error) {
        return false;
    }
}

// Dan SFDT (doi tuong hoac chuoi JSON) nhu Syncfusion dan ket qua tu dich vu: hien nut tuy chon dan,
// "Chi giu chu" dung chu thuong trong bo nho tam.
function pasteSyncfusionOfficeKitSfdt(editor, sfdt, text) {
    var editorModule = editor && (editor.editorModule || editor.editor);
    var data = sfdt;
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (error) {
            return false;
        }
    }
    if (!editorModule || !data || !Array.isArray(data.sections) || typeof editorModule.pasteContents !== "function") {
        return false;
    }

    var selection = editor.selection;
    var option = editor.defaultPasteOption || "KeepSourceFormatting";
    try {
        editorModule.currentPasteOptions = option;
        editorModule.copiedTextContent = String(text || "").replace(/\r\n/g, "\r") || " ";
        if (selection) {
            selection.isViewPasteOptions = true;
            if (selection.pasteElement) {
                selection.pasteElement.style.display = "none";
            }
            rememberWordKitPasteTargetFormat(editorModule, selection);
        }
        if (typeof editorModule.pasteFormattedContent === "function") {
            editorModule.pasteFormattedContent({ data: data });
        } else {
            editorModule.pasteContents(data);
            if (option !== "KeepSourceFormatting" && typeof editorModule.applyPasteOptions === "function") {
                editorModule.applyPasteOptions(option);
            }
        }
        return true;
    } catch (error) {
        console.error("Office kit paste sfdt error:", error);
        return false;
    }
}

// Nhu Syncfusion: nho dinh dang cho con tro de tuy chon "Chi giu chu" dan chu theo dinh dang do.
function rememberWordKitPasteTargetFormat(editorModule, selection) {
    var api = typeof ej !== "undefined" && ej.documenteditor ? ej.documenteditor : null;
    var paragraph = selection.start && selection.start.paragraph;
    if (!api || !paragraph || !api.WCharacterFormat || !api.WParagraphFormat) {
        return;
    }
    try {
        var characterFormat = new api.WCharacterFormat();
        characterFormat.copyFormat(paragraph.characterFormat);
        var paragraphFormat = new api.WParagraphFormat();
        paragraphFormat.copyFormat(paragraph.paragraphFormat);
        editorModule.previousCharFormat = characterFormat;
        editorModule.previousParaFormat = paragraphFormat;
    } catch (error) {
        // Khong quan trong: chi anh huong tuy chon "Chi giu chu".
    }
}

// Nut "Dan" tren ribbon: doc bo nho tam bang Clipboard API roi phat su kien paste vao o nhap an
// cua editor -> di dung duong Ctrl+V. Trinh duyet chan (trang http, chua cho phep) thi nhac Ctrl+V.
function pasteWordKitFromClipboard(editor, textOnly) {
    var clipboard = navigator.clipboard;
    var fallback = function () {
        showWordKitToast("Trình duyệt không cho nút Dán đọc bộ nhớ tạm. Hãy bấm Ctrl+V trong văn bản để dán.");
        if (editor.focusIn) {
            editor.focusIn();
        }
    };

    if (!clipboard || !editor.documentHelper || !editor.documentHelper.editableDiv) {
        fallback();
        return;
    }

    var readPromise;
    if (!textOnly && typeof clipboard.read === "function") {
        readPromise = clipboard.read().then(function (items) {
            var htmlPromise = null;
            var textPromise = null;
            var imagePromise = null;
            items.forEach(function (item) {
                if (!htmlPromise && item.types.indexOf("text/html") !== -1) {
                    htmlPromise = item.getType("text/html").then(function (blob) { return blob.text(); });
                }
                if (!textPromise && item.types.indexOf("text/plain") !== -1) {
                    textPromise = item.getType("text/plain").then(function (blob) { return blob.text(); });
                }
                if (!imagePromise && item.types.indexOf("image/png") !== -1) {
                    imagePromise = item.getType("image/png");
                }
            });
            return Promise.all([htmlPromise || "", textPromise || "", imagePromise]);
        });
    } else if (typeof clipboard.readText === "function") {
        readPromise = clipboard.readText().then(function (text) {
            return ["", text, null];
        });
    } else {
        fallback();
        return;
    }

    readPromise.then(function (data) {
        var editorModule = editor.editorModule || editor.editor;
        if (!data[0] && !data[1] && data[2] && editorModule && typeof editorModule.pasteImage === "function") {
            editorModule.pasteImage(data[2]);
            return;
        }
        if (!data[0] && !data[1]) {
            showWordKitToast("Bộ nhớ tạm đang trống.");
            return;
        }
        if (!dispatchWordKitPaste(editor, textOnly ? "" : data[0], data[1], textOnly)) {
            fallback();
        }
    }).catch(fallback);
}

function dispatchWordKitPaste(editor, html, text, textOnly) {
    var target = editor.documentHelper.editableDiv;
    var event;
    try {
        var data = new DataTransfer();
        if (html) {
            data.setData("text/html", html);
        }
        data.setData("text/plain", text || "");
        event = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
    } catch (error) {
        return false;
    }
    if (!event.clipboardData) {
        return false;
    }

    if (editor.focusIn) {
        editor.focusIn();
    }
    // Su kien chay dong bo: co "chi giu chu" chi co hieu luc trong lan dan nay.
    wordKitPasteTextOnly = Boolean(textOnly);
    try {
        target.dispatchEvent(event);
    } finally {
        wordKitPasteTextOnly = false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// HTML trong bo nho tam -> SFDT (v19, ten thuoc tinh day du)
// ---------------------------------------------------------------------------
// HTML (Word, trang web, Excel) duoc dung tam trong shadow DOM an ngoai man hinh (da bo script, iframe, tai nguyen
// ngoai) de trinh duyet tinh dinh dang that (getComputedStyle: class MsoNormal cua Word, the h1/b/i, style...). Sau do
// doc tung khoi: doan, tieu de, xuong dong, dam/nghieng/gach chan/gach ngang, phong/co/mau/nen chu, can le, thut le,
// gian dong, danh sach (ul/ol va doan MsoListParagraph cua Word), bang (colspan/rowspan theo vi tri o, do rong, vien,
// nen o) va anh data:.
var WORD_KIT_PASTE_SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|TITLE|META|LINK|BASE|IFRAME|FRAME|FRAMESET|OBJECT|EMBED|APPLET|AUDIO|VIDEO|SOURCE|TRACK|CANVAS|SVG|MATH|INPUT|SELECT|TEXTAREA|BUTTON|OPTION|DATALIST|MAP|AREA|XML)$/;
var WORD_KIT_PASTE_REMOVE_SELECTOR = "script,noscript,template,iframe,frame,frameset,object,embed,applet,link,meta,base,audio,video,source,track,input,select,textarea,button";
var WORD_KIT_HIGHLIGHT_COLORS = [
    ["Yellow", 255, 255, 0], ["BrightGreen", 0, 255, 0], ["Turquoise", 0, 255, 255], ["Pink", 255, 0, 255],
    ["Blue", 0, 0, 255], ["Red", 255, 0, 0], ["DarkBlue", 0, 0, 128], ["Teal", 0, 128, 128], ["Green", 0, 128, 0],
    ["Violet", 128, 0, 128], ["DarkRed", 128, 0, 0], ["DarkYellow", 128, 128, 0], ["Gray50", 128, 128, 128],
    ["Gray25", 192, 192, 192], ["Black", 0, 0, 0],
];

// HTML co gi de dan (chu, anh data:, bang)? Khong co (vd. chi mot anh file:/// cua Word) thi de Syncfusion dan anh/chu.
function wordKitHtmlHasContent(html) {
    try {
        var body = new DOMParser().parseFromString(String(html), "text/html").body;
        return Boolean(body && (/\S/.test(body.textContent || "") || body.querySelector("img[src^='data:image'],table")));
    } catch (error) {
        return false;
    }
}

/**
 * Doi HTML trong bo nho tam sang SFDT de editor.pasteContents. Tra ve Promise<doi tuong SFDT | null>.
 */
function convertWordKitHtmlToSfdt(html, editor) {
    var prepared = prepareWordKitPasteHtml(html);
    var sectionFormat = getWordKitPasteSectionFormat(editor);
    var contentWidth = Math.max(72, sectionFormat.pageWidth - sectionFormat.leftMargin - sectionFormat.rightMargin);
    var base = getWordKitPasteBaseFormat(editor);
    var mounted = mountWordKitPasteHtml(prepared, contentWidth / 0.75, base);

    return waitWordKitPasteImages(mounted.root, 2000).then(function () {
        try {
            return buildWordKitSfdtFromHtml(mounted.root, {
                contentWidth: contentWidth,
                sectionFormat: sectionFormat,
                isWord: prepared.isWord,
            });
        } finally {
            if (mounted.host.parentNode) {
                mounted.host.parentNode.removeChild(mounted.host);
            }
        }
    }, function (error) {
        if (mounted.host.parentNode) {
            mounted.host.parentNode.removeChild(mounted.host);
        }
        throw error;
    });
}

// Phan tich HTML o tai lieu tro (khong chay script, khong tai gi), bo phan tu nguy hiem va moi lien ket tai nguyen
// ngoai (anh khong phai data:, url() trong CSS, @import).
function prepareWordKitPasteHtml(html) {
    var source = String(html || "").replace(/<!--\s*(StartFragment|EndFragment)\s*-->/gi, "");
    var parsed = new DOMParser().parseFromString(source, "text/html");
    var stripUrls = function (value) {
        return String(value || "").replace(/@import[^;]*;?/gi, "").replace(/url\s*\([^)]*\)/gi, "none");
    };
    var css = [];
    Array.prototype.slice.call(parsed.querySelectorAll("style")).forEach(function (style) {
        css.push(stripUrls(style.textContent));
        style.parentNode.removeChild(style);
    });
    Array.prototype.slice.call(parsed.querySelectorAll(WORD_KIT_PASTE_REMOVE_SELECTOR)).forEach(function (element) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    Array.prototype.slice.call(parsed.body ? parsed.body.querySelectorAll("*") : []).forEach(function (element) {
        if (element.tagName.toUpperCase() === "IMG" && !/^data:image\//i.test(element.getAttribute("src") || "")) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            return;
        }
        for (var index = element.attributes.length - 1; index >= 0; index -= 1) {
            var name = element.attributes[index].name.toLowerCase();
            if (name.indexOf("on") === 0 || name === "srcset" || name === "background" || name === "poster" || name === "href") {
                element.removeAttribute(element.attributes[index].name);
            }
        }
        var style = element.getAttribute("style");
        if (style && /url\s*\(/i.test(style)) {
            element.setAttribute("style", stripUrls(style));
        }
    });

    return {
        css: css.join("\n"),
        body: parsed.body,
        isWord: /urn:schemas-microsoft-com:office|class="?Mso|mso-/i.test(source),
    };
}

function getWordKitPasteSectionFormat(editor) {
    var source = editor && editor.selection ? editor.selection.sectionFormat : null;
    var format = cloneSyncfusionOfficeKitObject(syncfusionOfficeKitDefaultSectionFormat);
    ["pageWidth", "pageHeight", "leftMargin", "rightMargin", "topMargin", "bottomMargin", "headerDistance",
        "footerDistance", "differentFirstPage", "differentOddAndEvenPages", "bidi"].forEach(function (key) {
        try {
            var value = source ? source[key] : undefined;
            if (value !== undefined && value !== null && value !== "") {
                format[key] = value;
            }
        } catch (error) {
            // Giu gia tri mac dinh.
        }
    });
    return format;
}

// Chu khong khai bao phong/co (thuong la HTML tu trang web) lay theo dinh dang cho con tro.
function getWordKitPasteBaseFormat(editor) {
    var format = { fontFamily: syncfusionOfficeKitDefaultCharacterFormat.fontFamily, fontSize: syncfusionOfficeKitDefaultCharacterFormat.fontSize };
    try {
        var current = editor.selection.characterFormat;
        if (current.fontFamily) {
            format.fontFamily = current.fontFamily;
        }
        if (Number(current.fontSize) > 0) {
            format.fontSize = Number(current.fontSize);
        }
    } catch (error) {
        // Dung mac dinh.
    }
    return format;
}

function mountWordKitPasteHtml(prepared, widthPx, base) {
    var host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "all:initial;display:block;position:fixed;left:-30000px;top:0;width:" + widthPx + "px;"
        + "pointer-events:none;z-index:-1;";
    var shadow = typeof host.attachShadow === "function" ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style");
    style.textContent = prepared.css;
    var root = document.createElement("div");
    root.style.cssText = "display:block;box-sizing:content-box;width:" + widthPx + "px;margin:0;padding:0;border:0;"
        + "font-family:'" + String(base.fontFamily).replace(/'/g, "") + "';font-size:" + base.fontSize + "pt;"
        + "font-weight:normal;font-style:normal;color:#000000;line-height:normal;text-align:start;white-space:normal;"
        + "background:transparent;";
    var body = prepared.body;
    if (body) {
        if (body.className) {
            root.className = body.className;
        }
        while (body.firstChild) {
            root.appendChild(document.importNode(body.firstChild, true));
            body.removeChild(body.firstChild);
        }
    }
    shadow.appendChild(style);
    shadow.appendChild(root);
    document.body.appendChild(host);
    return { host: host, root: root };
}

function waitWordKitPasteImages(root, timeoutMs) {
    var pending = Array.prototype.slice.call(root.querySelectorAll("img")).filter(function (image) {
        return !image.complete;
    });
    if (!pending.length) {
        return Promise.resolve();
    }
    return new Promise(function (resolve) {
        var left = pending.length;
        var timer = setTimeout(resolve, timeoutMs);
        var done = function () {
            left -= 1;
            if (left <= 0) {
                clearTimeout(timer);
                resolve();
            }
        };
        pending.forEach(function (image) {
            image.addEventListener("load", done);
            image.addEventListener("error", done);
        });
    });
}

// px (so hoac chuoi CSS da tinh "12px") -> pt.
function wordKitPt(px) {
    return Math.round((parseFloat(px) || 0) * 0.75 * 100) / 100;
}

function wordKitPx(value) {
    return parseFloat(value) || 0;
}

function wordKitClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function wordKitHexColor(value) {
    var match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)/i.exec(String(value || ""));
    if (!match) {
        return "";
    }
    if (match[4] !== undefined && parseFloat(match[4]) === 0) {
        return "";
    }
    return "#" + [match[1], match[2], match[3]].map(function (part) {
        var hex = Math.min(255, Number(part)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
}

// Nen chu: SFDT v19 chi co mau to (highlight) co dinh -> chon mau gan nhat; nen trang/gan trang bo qua.
function wordKitHighlightColor(hex) {
    if (!hex) {
        return "";
    }
    var red = parseInt(hex.slice(1, 3), 16);
    var green = parseInt(hex.slice(3, 5), 16);
    var blue = parseInt(hex.slice(5, 7), 16);
    if (red > 235 && green > 235 && blue > 235) {
        return "";
    }
    var best = "";
    var bestDistance = Infinity;
    WORD_KIT_HIGHLIGHT_COLORS.forEach(function (entry) {
        var distance = Math.pow(entry[1] - red, 2) + Math.pow(entry[2] - green, 2) + Math.pow(entry[3] - blue, 2);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = entry[0];
        }
    });
    return best;
}

function wordKitFontFamily(value, fallback) {
    var first = String(value || "").split(",")[0].replace(/["']/g, "").trim();
    var generic = {
        "serif": "Times New Roman",
        "sans-serif": "Arial",
        "monospace": "Courier New",
        "cursive": "Comic Sans MS",
        "fantasy": "Impact",
        "system-ui": "Segoe UI",
        "-apple-system": "Segoe UI",
        "ui-sans-serif": "Arial",
        "ui-serif": "Times New Roman",
        "ui-monospace": "Courier New",
    };
    return generic[first.toLowerCase()] || first || fallback;
}

// text-align da tinh (ke ca -webkit-center cua <center>, -internal-center cua <th>) -> can le SFDT.
function wordKitTextAlignment(value) {
    var align = String(value || "");
    if (align.indexOf("center") !== -1) {
        return "Center";
    }
    if (align.indexOf("right") !== -1 || align === "end") {
        return "Right";
    }
    if (align === "justify") {
        return "Justify";
    }
    return "Left";
}

// Do dai CSS (pt, px, in, cm, mm; so tron = px) -> pt.
function wordKitCssLengthPt(value) {
    var match = /^\s*([\d.]+)\s*(pt|px|in|cm|mm)?\s*$/i.exec(String(value || ""));
    if (!match) {
        return 0;
    }
    var number = parseFloat(match[1]);
    var unit = String(match[2] || "px").toLowerCase();
    var factor = { pt: 1, px: 0.75, "in": 72, cm: 72 / 2.54, mm: 72 / 25.4 }[unit];
    return Math.round(number * factor * 100) / 100;
}

// Vien kieu 3D (inset/outset cua bang web mac dinh) dua ve net don cho giong Word.
function wordKitBorderLineStyle(value) {
    return {
        dotted: "Dot",
        dashed: "DashSmallGap",
        double: "Double",
    }[value] || "Single";
}

function buildWordKitSfdtFromHtml(root, options) {
    var lists = [];
    var abstractLists = [];
    var wordLists = {};
    var headingLevels = {};
    var hasContent = false;
    var styleCache = typeof WeakMap === "function" ? new WeakMap() : null;

    var css = function (element) {
        var style = styleCache ? styleCache.get(element) : null;
        if (!style) {
            style = window.getComputedStyle(element);
            if (styleCache) {
                styleCache.set(element, style);
            }
        }
        return style;
    };
    var rawStyle = function (element) {
        return element && element.getAttribute ? String(element.getAttribute("style") || "") : "";
    };
    var copyContext = function (context, changes) {
        var next = {};
        Object.keys(context).forEach(function (key) {
            next[key] = context[key];
        });
        Object.keys(changes || {}).forEach(function (key) {
            next[key] = changes[key];
        });
        return next;
    };
    var createContainer = function (element, widthPt) {
        var rect = element.getBoundingClientRect();
        var style = css(element);
        return {
            element: element,
            blocks: [],
            current: null,
            lastParagraph: null,
            lastElement: null,
            width: widthPt,
            left: rect.left + wordKitPx(style.borderLeftWidth) + wordKitPx(style.paddingLeft),
            right: rect.right - wordKitPx(style.borderRightWidth) - wordKitPx(style.paddingRight),
        };
    };

    // --- danh sach ---
    var createList = function () {
        var id = lists.length;
        var levels = [];
        for (var level = 0; level < 9; level += 1) {
            levels.push({
                characterFormat: {},
                paragraphFormat: { leftIndent: 36 * (level + 1), firstLineIndent: -18, listFormat: {} },
                followCharacter: "Tab",
                listLevelPattern: "Arabic",
                numberFormat: "%" + (level + 1) + ".",
                restartLevel: level,
                startAt: 1,
            });
        }
        abstractLists.push({ abstractListId: id, levels: levels });
        lists.push({ abstractListId: id, listId: id, levelOverrides: [] });
        return { listId: id, levels: levels, defined: {} };
    };
    var bulletLevel = function (level, key) {
        var bullet = wordKitBulletStyles[key] || wordKitBulletStyles.dot;
        level.listLevelPattern = "Bullet";
        level.numberFormat = bullet[0];
        level.characterFormat = { fontFamily: bullet[1], fontFamilyBidi: bullet[1] };
        level.startAt = 0;
    };
    var defineHtmlListLevel = function (record, levelIndex, listElement, style) {
        if (record.defined[levelIndex]) {
            return;
        }
        record.defined[levelIndex] = true;
        var level = record.levels[levelIndex];
        var type = String(style.listStyleType || "");
        var ordered = listElement.tagName.toUpperCase() === "OL";
        var patterns = {
            "decimal": "Arabic",
            "decimal-leading-zero": "Arabic",
            "lower-alpha": "LowLetter",
            "lower-latin": "LowLetter",
            "upper-alpha": "UpLetter",
            "upper-latin": "UpLetter",
            "lower-roman": "LowRoman",
            "upper-roman": "UpRoman",
        };
        if (patterns[type] || (ordered && ["disc", "circle", "square"].indexOf(type) === -1)) {
            level.listLevelPattern = patterns[type] || "Arabic";
            level.numberFormat = "%" + (levelIndex + 1) + ".";
            level.startAt = ordered ? (parseInt(listElement.getAttribute("start"), 10) || 1) : 1;
            return;
        }
        bulletLevel(level, type === "circle" ? "circle" : (type === "square" ? "square" : (type === "disc" ? "dot" : ["dot", "circle", "square"][levelIndex % 3])));
    };
    // Doan danh sach cua Word: <p style="mso-list:l0 level1 lfo1"> va ky hieu dau dong nam trong <span mso-list:Ignore>.
    var defineWordListLevel = function (level, levelIndex, marker, markerFont) {
        var number = /^(\(?)(\d+(?:\.\d+)*)(\.?\)?)$/.exec(marker);
        if (number) {
            var parts = number[2].split(".");
            var first = levelIndex - parts.length + 2;
            var placeholders = first >= 1
                ? parts.map(function (part, index) { return "%" + (first + index); }).join(".")
                : "%" + (levelIndex + 1);
            level.listLevelPattern = "Arabic";
            level.numberFormat = number[1] + placeholders + number[3];
            level.startAt = parseInt(parts[parts.length - 1], 10) || 1;
            return;
        }
        var letter = /^(\(?)([a-zA-Z]+)([.)])$/.exec(marker);
        if (letter) {
            var value = letter[2];
            var lower = value === value.toLowerCase();
            var isRoman = /^[ivxlcdm]+$/i.test(value) && (value.length > 1 || /^i$/i.test(value));
            level.numberFormat = letter[1] + "%" + (levelIndex + 1) + letter[3];
            if (isRoman) {
                level.listLevelPattern = lower ? "LowRoman" : "UpRoman";
                level.startAt = wordKitRomanValue(value) || 1;
            } else {
                level.listLevelPattern = lower ? "LowLetter" : "UpLetter";
                level.startAt = value.length === 1 ? value.toLowerCase().charCodeAt(0) - 96 : 1;
            }
            return;
        }
        var symbol = marker.charAt(0) || "·";
        var font = markerFont || "Symbol";
        if (/symbol|wingdings|webdings/i.test(font) && symbol.charCodeAt(0) < 256) {
            symbol = String.fromCharCode(0xf000 + symbol.charCodeAt(0));
        }
        level.listLevelPattern = "Bullet";
        level.numberFormat = symbol;
        level.characterFormat = { fontFamily: font, fontFamilyBidi: font };
        level.startAt = 0;
    };
    var applyWordList = function (element, format) {
        if (!element || element.wordKitListed || !element.querySelectorAll) {
            return;
        }
        var match = /mso-list\s*:\s*(l\d+)\s+level(\d+)\s+(lfo\d+)/i.exec(rawStyle(element));
        if (!match) {
            return;
        }
        element.wordKitListed = true;
        var markerElement = null;
        Array.prototype.some.call(element.querySelectorAll("span"), function (span) {
            if (/mso-list\s*:\s*ignore/i.test(rawStyle(span))) {
                markerElement = span;
                return true;
            }
            return false;
        });
        var marker = markerElement ? String(markerElement.textContent || "").replace(/[\s ]+/g, "") : "";
        var levelIndex = wordKitClamp(parseInt(match[2], 10) - 1, 0, 8);
        var key = match[1] + ":" + match[3];
        var record = wordLists[key] || (wordLists[key] = createList());
        var level = record.levels[levelIndex];
        if (!record.defined[levelIndex]) {
            record.defined[levelIndex] = true;
            defineWordListLevel(level, levelIndex, marker, markerElement ? wordKitFontFamily(css(markerElement).fontFamily, "Symbol") : "Symbol");
            level.paragraphFormat = { leftIndent: format.leftIndent, firstLineIndent: format.firstLineIndent, listFormat: {} };
        }
        format.listFormat = { listId: record.listId, listLevelNumber: levelIndex };
    };

    // --- dinh dang ---
    var characterFormatOf = function (element, context) {
        var style = css(element);
        var size = context.baselineSize || wordKitPt(style.fontSize);
        var weight = String(style.fontWeight);
        var fontFamily = wordKitFontFamily(style.fontFamily, syncfusionOfficeKitDefaultCharacterFormat.fontFamily);
        var fontSize = Math.round(size * 2) / 2 || syncfusionOfficeKitDefaultCharacterFormat.fontSize;
        return {
            bold: weight === "bold" || weight === "bolder" || parseInt(weight, 10) >= 600,
            italic: style.fontStyle === "italic" || String(style.fontStyle).indexOf("oblique") === 0,
            underline: context.decoration.indexOf("u") !== -1 ? "Single" : "None",
            strikethrough: context.decoration.indexOf("s") !== -1 ? "SingleStrike" : "None",
            baselineAlignment: context.baseline,
            highlightColor: context.highlight || "NoColor",
            fontSize: fontSize,
            fontFamily: fontFamily,
            fontColor: wordKitHexColor(style.color) || "#000000",
            fontSizeBidi: fontSize,
            fontFamilyBidi: fontFamily,
        };
    };
    var lineSpacingOf = function (element, style, format) {
        var raw = rawStyle(element);
        var declared = /(?:^|;)\s*line-height\s*:\s*([\d.]+)\s*(%|pt|px|in|cm|mm)?/i.exec(raw);
        var fontPx = wordKitPx(style.fontSize) || 16;
        var lineHeight = String(style.lineHeight);
        var multiple = 1;
        if (declared && declared[2] === "%") {
            multiple = parseFloat(declared[1]) / 100;
        } else if (declared && declared[2] && /px$/.test(lineHeight)) {
            format.lineSpacingType = /mso-line-height-rule\s*:\s*exactly/i.test(raw) ? "Exactly" : "AtLeast";
            format.lineSpacing = wordKitPt(lineHeight);
            return;
        } else if (/px$/.test(lineHeight)) {
            // Word: ti le theo dong don; trang web: line-height tinh theo co chu, dong don ~1.15 co chu.
            multiple = wordKitPx(lineHeight) / fontPx / (options.isWord ? 1 : 1.15);
        }
        multiple = Math.round(wordKitClamp(multiple, 0.5, 5) * 100) / 100;
        format.lineSpacingType = "Multiple";
        format.lineSpacing = Math.abs(multiple - 1) < 0.05 ? 1 : multiple;
    };
    var paragraphFormatOf = function (element, container, context) {
        var style = css(element);
        var format = {
            styleName: "Normal",
            textAlignment: wordKitTextAlignment(style.textAlign),
            leftIndent: 0,
            rightIndent: 0,
            firstLineIndent: 0,
            beforeSpacing: 0,
            afterSpacing: 0,
            listFormat: {},
        };
        if (element === root) {
            // Chu dan khong nam trong khoi nao (vai chu chep tu trang web): khong doi can le/thut le cua doan dich.
            return { listFormat: {} };
        }
        if (element !== container.element) {
            var rect = element.getBoundingClientRect();
            var left = rect.left + wordKitPx(style.borderLeftWidth) + wordKitPx(style.paddingLeft);
            var right = rect.right - wordKitPx(style.borderRightWidth) - wordKitPx(style.paddingRight);
            format.leftIndent = wordKitClamp(wordKitPt(left - container.left), 0, 432);
            format.rightIndent = wordKitClamp(wordKitPt(container.right - right), 0, 432);
            if (!element.wordKitSpaced) {
                element.wordKitSpaced = true;
                var before = wordKitPt(style.marginTop);
                var previous = container.blocks[container.blocks.length - 1];
                if (!options.isWord && previous && previous === container.lastParagraph) {
                    // Trang web: le tren/duoi cua hai doan lien nhau gop lam mot (margin collapsing).
                    before = Math.max(0, before - (previous.paragraphFormat.afterSpacing || 0));
                }
                format.beforeSpacing = wordKitClamp(before, 0, 72);
            }
        }
        var indent = String(style.textIndent || "");
        var indentPx = /%$/.test(indent) ? parseFloat(indent) / 100 * (container.right - container.left) : wordKitPx(indent);
        format.firstLineIndent = wordKitClamp(wordKitPt(indentPx), -format.leftIndent - 72, 432);
        lineSpacingOf(element, style, format);
        var heading = /^H([1-6])$/i.exec(element.tagName);
        if (heading) {
            format.styleName = "Heading " + heading[1];
            headingLevels[heading[1]] = true;
        }
        return format;
    };

    // --- doan ---
    var ensureParagraph = function (container, context) {
        if (container.current) {
            return container.current;
        }
        var element = context.blockElement || container.element;
        var format = paragraphFormatOf(element, container, context);
        var pending = context.pendingList;
        if (pending) {
            if (!pending.used) {
                pending.used = true;
                format.listFormat = { listId: pending.listId, listLevelNumber: pending.level };
                format.firstLineIndent = pending.firstLineIndent;
            } else {
                format.firstLineIndent = 0;
            }
            format.leftIndent = pending.leftIndent;
        } else if (element !== root) {
            applyWordList(element, format);
        }
        container.current = {
            element: element,
            endsWithSpace: true,
            lastKey: null,
            block: { paragraphFormat: format, characterFormat: characterFormatOf(element, context), inlines: [] },
        };
        return container.current;
    };
    var pushInline = function (paragraph, inline) {
        var inlines = paragraph.block.inlines;
        if (typeof inline.text === "string") {
            var key = JSON.stringify(inline.characterFormat);
            var last = inlines[inlines.length - 1];
            if (last && typeof last.text === "string" && paragraph.lastKey === key) {
                last.text += inline.text;
                return;
            }
            paragraph.lastKey = key;
        } else {
            paragraph.lastKey = null;
        }
        inlines.push(inline);
    };
    var finishParagraph = function (container) {
        var current = container.current;
        if (!current) {
            return;
        }
        container.current = null;
        var block = current.block;
        var inlines = block.inlines;
        var last = inlines[inlines.length - 1];
        if (last && typeof last.text === "string") {
            last.text = last.text.replace(/ +$/, "");
            // <br> cuoi khoi khong tao them dong trong (giong trinh duyet).
            if (/\v$/.test(last.text)) {
                last.text = last.text.slice(0, -1);
            }
            if (!last.text) {
                inlines.pop();
            }
        }
        // Doan chi co khoang trang (o:p &nbsp; cua Word) la doan trong; giu dinh dang cho dau doan.
        var onlySpaces = inlines.length > 0 && inlines.every(function (inline) {
            return typeof inline.text === "string" && /^[ \t ]*$/.test(inline.text);
        });
        if (inlines.length) {
            block.characterFormat = inlines[inlines.length - 1].characterFormat || block.characterFormat;
        }
        if (onlySpaces) {
            block.inlines = [];
        }
        container.blocks.push(block);
        container.lastParagraph = block;
        container.lastElement = current.element;
    };

    // --- duyet cay ---
    var appendText = function (node, container, context) {
        var parent = node.parentNode;
        var style = css(parent);
        if (style.visibility === "hidden" || style.visibility === "collapse") {
            return;
        }
        var text = String(node.nodeValue || "");
        var preserve = /^(pre|pre-wrap|pre-line|break-spaces)$/.test(style.whiteSpace);
        if (preserve) {
            text = text.replace(/\r\n?/g, "\n");
            if (style.whiteSpace === "pre-line") {
                text = text.replace(/[ \t]+/g, " ");
            }
            text = text.replace(/\n/g, "\v");
        } else {
            text = text.replace(/[ \t\n\r\f]+/g, " ");
            if (text === " " && !container.current) {
                return;
            }
        }
        var paragraph = ensureParagraph(container, context);
        if (!preserve && paragraph.endsWithSpace && text.charAt(0) === " ") {
            text = text.slice(1);
        }
        if (!text) {
            return;
        }
        if (context.uppercase) {
            text = text.toUpperCase();
        }
        pushInline(paragraph, { characterFormat: characterFormatOf(parent, context), text: text });
        paragraph.endsWithSpace = /[ \v]$/.test(text);
        if (/\S/.test(text)) {
            hasContent = true;
        }
    };
    var appendSpecial = function (element, container, context, text) {
        var paragraph = ensureParagraph(container, context);
        pushInline(paragraph, { characterFormat: characterFormatOf(element.parentNode || element, context), text: text });
        paragraph.endsWithSpace = true;
    };
    var appendImage = function (image, container, context) {
        var source = image.getAttribute("src") || "";
        if (!/^data:image\//i.test(source)) {
            return;
        }
        var rect = image.getBoundingClientRect();
        var width = rect.width || image.naturalWidth;
        var height = rect.height || image.naturalHeight;
        if (!width || !height) {
            return;
        }
        var maxWidth = container.width / 0.75;
        if (width > maxWidth) {
            height = height * maxWidth / width;
            width = maxWidth;
        }
        var imageString = normalizeWordKitPasteImage(image, source);
        if (!imageString) {
            return;
        }
        var paragraph = ensureParagraph(container, context);
        pushInline(paragraph, {
            characterFormat: {},
            imageString: imageString,
            isMetaFile: false,
            isCompressed: false,
            width: wordKitPt(width),
            height: wordKitPt(height),
            iscrop: false,
            name: "",
            alternativeText: String(image.getAttribute("alt") || ""),
            title: "",
            verticalPosition: 0,
            horizontalPosition: 0,
            textWrappingStyle: "Inline",
        });
        paragraph.endsWithSpace = false;
        hasContent = true;
    };
    var inheritContext = function (element, style, context) {
        var next = copyContext(context);
        var line = String(style.textDecorationLine || style.textDecoration || "");
        if (line.indexOf("underline") !== -1 && next.decoration.indexOf("u") === -1) {
            next.decoration += "u";
        }
        if (line.indexOf("line-through") !== -1 && next.decoration.indexOf("s") === -1) {
            next.decoration += "s";
        }
        if (String(style.display).indexOf("inline") === 0 || style.display === "contents") {
            var background = wordKitHexColor(style.backgroundColor);
            if (background) {
                next.highlight = wordKitHighlightColor(background);
            }
            if (style.verticalAlign === "super" || style.verticalAlign === "sub") {
                next.baseline = style.verticalAlign === "super" ? "Superscript" : "Subscript";
                next.baselineSize = context.baselineSize || wordKitPt(css(element.parentNode).fontSize);
            }
        }
        if (style.textTransform === "uppercase") {
            next.uppercase = true;
        } else if (style.textTransform === "none" && element.style && element.style.textTransform) {
            next.uppercase = false;
        }
        return next;
    };
    var walkChildren = function (element, container, context) {
        for (var node = element.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 3) {
                appendText(node, container, context);
            } else if (node.nodeType === 1) {
                walkElement(node, container, context);
            }
        }
    };
    var walkBlock = function (element, container, context) {
        finishParagraph(container);
        var before = container.blocks.length;
        var next = copyContext(context, { blockElement: element });
        walkChildren(element, container, next);
        finishParagraph(container);
        if (container.blocks.length === before) {
            // Khoi rong nhung chiem cho (vd. <p><br></p>) -> mot doan trong.
            var tag = element.tagName.toUpperCase();
            if (tag === "LI" || element.getBoundingClientRect().height > 0.5) {
                ensureParagraph(container, next);
                finishParagraph(container);
            }
        }
        // Le duoi cua khoi dat cho doan cuoi cung cua khoi do.
        if (container.lastElement === element && container.lastParagraph
            && container.blocks[container.blocks.length - 1] === container.lastParagraph) {
            container.lastParagraph.paragraphFormat.afterSpacing = wordKitClamp(wordKitPt(css(element).marginBottom), 0, 72);
        }
    };
    var walkList = function (element, container, context, style) {
        finishParagraph(container);
        var parent = context.htmlList;
        var levelIndex = parent ? Math.min(parent.level + 1, 8) : 0;
        var record = parent ? parent.record : createList();
        defineHtmlListLevel(record, levelIndex, element, style);
        walkBlock(element, container, copyContext(context, { htmlList: { record: record, level: levelIndex }, pendingList: null }));
    };
    var walkListItem = function (element, container, context, style) {
        var list = context.htmlList;
        if (!list || style.display !== "list-item" || style.listStyleType === "none") {
            walkBlock(element, container, copyContext(context, { pendingList: null }));
            return;
        }
        var level = list.record.levels[list.level];
        walkBlock(element, container, copyContext(context, {
            pendingList: {
                listId: list.record.listId,
                level: list.level,
                used: false,
                leftIndent: level.paragraphFormat.leftIndent,
                firstLineIndent: level.paragraphFormat.firstLineIndent,
            },
        }));
    };
    var walkElement = function (element, container, context) {
        var tag = element.tagName.toUpperCase();
        if (WORD_KIT_PASTE_SKIP_TAGS.test(tag)) {
            return;
        }
        var raw = rawStyle(element);
        if (/mso-list\s*:\s*ignore|mso-hide\s*:\s*all|display\s*:\s*none/i.test(raw)) {
            return;
        }
        var style = css(element);
        if (style.display === "none") {
            return;
        }
        if (tag === "BR") {
            appendSpecial(element, container, context, "\v");
            return;
        }
        if (tag === "IMG") {
            appendImage(element, container, context);
            return;
        }
        var tabs = /mso-tab-count\s*:\s*(\d+)/i.exec(raw);
        if (tabs) {
            appendSpecial(element, container, context, new Array(Math.min(20, parseInt(tabs[1], 10) || 1) + 1).join("\t"));
            return;
        }
        var next = inheritContext(element, style, context);
        if (tag === "TABLE") {
            walkTable(element, container, next);
            return;
        }
        if (tag === "UL" || tag === "OL") {
            walkList(element, container, next, style);
            return;
        }
        if (tag === "LI") {
            walkListItem(element, container, next, style);
            return;
        }
        var display = String(style.display);
        if (display.indexOf("inline") === 0 || display === "contents" || display === "ruby" || display === "ruby-text") {
            walkChildren(element, container, next);
            return;
        }
        walkBlock(element, container, next);
    };

    // --- bang ---
    var borderOf = function (style, side) {
        var lineStyle = style["border" + side + "Style"];
        var width = wordKitPx(style["border" + side + "Width"]);
        if (!width || lineStyle === "none" || lineStyle === "hidden") {
            return null;
        }
        return {
            lineStyle: wordKitBorderLineStyle(lineStyle),
            lineWidth: Math.max(0.25, wordKitPt(width)),
            color: wordKitHexColor(style["border" + side + "Color"]) || "#000000",
        };
    };
    var walkTable = function (table, container, context) {
        finishParagraph(container);
        if (table.caption) {
            walkBlock(table.caption, container, context);
        }
        var tableStyle = css(table);
        var rows = [];
        Array.prototype.forEach.call(table.rows || [], function (row) {
            if (css(row).display === "none") {
                return;
            }
            var cells = [];
            Array.prototype.forEach.call(row.cells, function (cell) {
                var cellStyle = css(cell);
                if (cellStyle.display !== "none") {
                    cells.push({ element: cell, style: cellStyle, rect: cell.getBoundingClientRect() });
                }
            });
            if (cells.length) {
                rows.push({ element: row, rect: row.getBoundingClientRect(), cells: cells });
            }
        });
        if (!rows.length) {
            return;
        }

        // Cot cua bang = cac bien trai/phai cua o (gop bien lech nhau vai diem, ke ca khoang cach o).
        var spacing = tableStyle.borderCollapse === "separate" ? wordKitPx(String(tableStyle.borderSpacing).split(" ")[0]) : 0;
        var tolerance = 3 + spacing;
        var edges = [];
        rows.forEach(function (row) {
            row.cells.forEach(function (cell) {
                edges.push(cell.rect.left, cell.rect.right);
            });
        });
        edges.sort(function (a, b) {
            return a - b;
        });
        var columns = [];
        edges.forEach(function (x) {
            if (!columns.length || x - columns[columns.length - 1] > tolerance) {
                columns.push(x);
            }
        });
        if (columns.length < 2) {
            walkBlock(table, container, context);
            return;
        }
        var columnAt = function (x) {
            var best = 0;
            columns.forEach(function (position, index) {
                if (Math.abs(position - x) < Math.abs(columns[best] - x)) {
                    best = index;
                }
            });
            return best;
        };

        rows.forEach(function (row) {
            row.cells.forEach(function (cell) {
                cell.start = columnAt(cell.rect.left);
                cell.end = Math.max(cell.start + 1, columnAt(cell.rect.right));
            });
        });

        var tableRect = table.getBoundingClientRect();
        var leftIndent = wordKitClamp(wordKitPt(tableRect.left - container.left), 0, container.width / 2);
        var available = Math.max(36, container.width - leftIndent);
        var gridPx = [];
        for (var columnIndex = 1; columnIndex < columns.length; columnIndex += 1) {
            gridPx.push(columns[columnIndex] - columns[columnIndex - 1]);
        }
        if (options.isWord) {
            // Word ghi do rong o (width) da gom le trong o; trinh duyet cong them padding -> tru lai cho dung do rong goc.
            gridPx = gridPx.map(function (width, index) {
                var single = null;
                rows.some(function (row) {
                    return row.cells.some(function (cell) {
                        if (cell.start === index && cell.end === index + 1) {
                            single = cell;
                            return true;
                        }
                        return false;
                    });
                });
                if (!single) {
                    return width;
                }
                var inner = wordKitPx(single.style.paddingLeft) + wordKitPx(single.style.paddingRight)
                    + (wordKitPx(single.style.borderLeftWidth) + wordKitPx(single.style.borderRightWidth)) / 2;
                return Math.max(width / 2, width - inner);
            });
        }
        var total = wordKitPt(gridPx.reduce(function (sum, width) { return sum + width; }, 0));
        var scale = total > available ? available / total : 1;
        var grid = gridPx.map(function (width) {
            return Math.round(wordKitPt(width) * scale * 100) / 100;
        });

        // Vi tri o: cot bat dau, so cot, so dong (theo toa do; o gop dong chi nam o dong dau).
        var occupancy = rows.map(function () {
            return [];
        });
        rows.forEach(function (row, rowIndex) {
            row.cells.forEach(function (cell) {
                var start = cell.start;
                var end = cell.end;
                var rowSpan = 1;
                for (var below = rowIndex + 1; below < rows.length && rows[below].rect.top < cell.rect.bottom - 2; below += 1) {
                    rowSpan += 1;
                }
                cell.rowIndex = rowIndex;
                cell.rowSpan = rowSpan;
                cell.own = {
                    Top: borderOf(cell.style, "Top"),
                    Right: borderOf(cell.style, "Right"),
                    Bottom: borderOf(cell.style, "Bottom"),
                    Left: borderOf(cell.style, "Left"),
                };
                for (var r = rowIndex; r < rowIndex + rowSpan; r += 1) {
                    for (var c = start; c < end; c += 1) {
                        occupancy[r][c] = occupancy[r][c] || cell;
                    }
                }
            });
        });
        var none = function () {
            return { lineStyle: "None" };
        };
        var sharedBorder = function (cell, side) {
            if (cell.own[side]) {
                return cell.own[side];
            }
            // Bang gop vien (border-collapse): vien chung giua hai o co the chi khai bao o o ben canh.
            var neighbour = null;
            if (side === "Left" && cell.start > 0) {
                neighbour = occupancy[cell.rowIndex][cell.start - 1];
                return neighbour && neighbour.own.Right ? neighbour.own.Right : null;
            }
            if (side === "Right") {
                neighbour = occupancy[cell.rowIndex][cell.end];
                return neighbour && neighbour.own.Left ? neighbour.own.Left : null;
            }
            if (side === "Top" && cell.rowIndex > 0) {
                neighbour = occupancy[cell.rowIndex - 1][cell.start];
                return neighbour && neighbour !== cell && neighbour.own.Bottom ? neighbour.own.Bottom : null;
            }
            if (side === "Bottom" && occupancy[cell.rowIndex + cell.rowSpan]) {
                neighbour = occupancy[cell.rowIndex + cell.rowSpan][cell.start];
                return neighbour && neighbour.own.Top ? neighbour.own.Top : null;
            }
            return null;
        };
        var firstStyle = rows[0].cells[0].style;
        var margin = function (value) {
            return wordKitClamp(wordKitPt(value), 0, 30);
        };
        var sfdtRows = rows.map(function (row) {
            var height = Math.max(
                wordKitCssLengthPt(row.element.style.height || row.element.getAttribute("height")),
                row.cells.reduce(function (max, cell) {
                    return Math.max(max, wordKitCssLengthPt(cell.element.style.height || cell.element.getAttribute("height")));
                }, 0)
            );
            var rowBackground = wordKitHexColor(css(row.element).backgroundColor) || wordKitHexColor(tableStyle.backgroundColor);
            return {
                cells: row.cells.map(function (cell) {
                    var width = grid.slice(cell.start, cell.end).reduce(function (sum, value) { return sum + value; }, 0);
                    var leftMargin = margin(cell.style.paddingLeft);
                    var rightMargin = margin(cell.style.paddingRight);
                    var cellContainer = createContainer(cell.element, Math.max(18, width - leftMargin - rightMargin));
                    var cellContext = {
                        blockElement: cell.element,
                        decoration: context.decoration,
                        highlight: "",
                        baseline: "Normal",
                        baselineSize: 0,
                        uppercase: context.uppercase,
                        htmlList: null,
                        pendingList: null,
                    };
                    walkChildren(cell.element, cellContainer, cellContext);
                    finishParagraph(cellContainer);
                    var blocks = cellContainer.blocks;
                    if (!blocks.length || !blocks[blocks.length - 1].inlines) {
                        ensureParagraph(cellContainer, cellContext);
                        finishParagraph(cellContainer);
                    }
                    var background = wordKitHexColor(cell.style.backgroundColor) || rowBackground;
                    var verticalAlign = cell.style.verticalAlign;
                    return {
                        blocks: blocks,
                        cellFormat: {
                            columnSpan: cell.end - cell.start,
                            rowSpan: cell.rowSpan,
                            preferredWidth: Math.round(width * 100) / 100,
                            preferredWidthType: "Point",
                            cellWidth: Math.round(width * 100) / 100,
                            verticalAlignment: verticalAlign === "middle" ? "Center" : (verticalAlign === "bottom" ? "Bottom" : "Top"),
                            leftMargin: leftMargin,
                            rightMargin: rightMargin,
                            topMargin: margin(cell.style.paddingTop),
                            bottomMargin: margin(cell.style.paddingBottom),
                            shading: background ? { backgroundColor: background, foregroundColor: "empty", textureStyle: "TextureNone" } : {},
                            borders: {
                                top: sharedBorder(cell, "Top") || none(),
                                left: sharedBorder(cell, "Left") || none(),
                                right: sharedBorder(cell, "Right") || none(),
                                bottom: sharedBorder(cell, "Bottom") || none(),
                                diagonalDown: {},
                                diagonalUp: {},
                                horizontal: {},
                                vertical: {},
                            },
                        },
                        columnIndex: cell.start,
                    };
                }),
                rowFormat: {
                    height: height,
                    heightType: height ? "AtLeast" : "Auto",
                    allowBreakAcrossPages: true,
                    isHeader: false,
                    gridBefore: 0,
                    gridAfter: 0,
                    borders: { top: {}, left: {}, right: {}, bottom: {}, diagonalDown: {}, diagonalUp: {}, horizontal: {}, vertical: {} },
                },
            };
        });

        var leftGap = tableRect.left - container.left;
        var rightGap = container.right - tableRect.right;
        var alignment = /center/i.test(table.getAttribute("align") || "") || (leftGap > 2 && Math.abs(leftGap - rightGap) < 2)
            ? "Center"
            : (/right/i.test(table.getAttribute("align") || "") ? "Right" : "Left");
        container.blocks.push({
            rows: sfdtRows,
            grid: grid,
            tableFormat: {
                borders: {
                    top: none(), left: none(), right: none(), bottom: none(),
                    diagonalDown: {}, diagonalUp: {}, horizontal: none(), vertical: none(),
                },
                shading: {},
                leftIndent: alignment === "Left" ? leftIndent : 0,
                tableAlignment: alignment,
                topMargin: margin(firstStyle.paddingTop),
                bottomMargin: margin(firstStyle.paddingBottom),
                leftMargin: margin(firstStyle.paddingLeft),
                rightMargin: margin(firstStyle.paddingRight),
                cellSpacing: 0,
                preferredWidthType: "Auto",
            },
            columnCount: grid.length,
        });
        container.lastParagraph = null;
        container.lastElement = table;
        hasContent = true;
    };

    var rootContainer = createContainer(root, options.contentWidth);
    walkChildren(root, rootContainer, {
        blockElement: root,
        decoration: "",
        highlight: "",
        baseline: "Normal",
        baselineSize: 0,
        uppercase: false,
        htmlList: null,
        pendingList: null,
    });
    finishParagraph(rootContainer);
    if (!hasContent || !rootContainer.blocks.length) {
        return null;
    }

    var styles = Object.keys(headingLevels).map(function (level) {
        return {
            name: "Heading " + level,
            type: "Paragraph",
            paragraphFormat: { outlineLevel: "Level" + level, listFormat: {} },
            characterFormat: {},
            basedOn: "Normal",
            next: "Normal",
        };
    });
    return {
        sections: [{
            sectionFormat: options.sectionFormat,
            blocks: rootContainer.blocks,
            headersFooters: {},
        }],
        lists: lists,
        abstractLists: abstractLists,
        styles: styles,
    };
}

function wordKitRomanValue(value) {
    var numerals = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    var text = String(value || "").toLowerCase();
    var total = 0;
    for (var index = 0; index < text.length; index += 1) {
        var current = numerals[text.charAt(index)] || 0;
        var next = numerals[text.charAt(index + 1)] || 0;
        total += current < next ? -current : current;
    }
    return total;
}

// Syncfusion (va Word khi luu DOCX) chi nhan anh PNG/JPEG/GIF/BMP: anh khac (webp, svg...) doi sang PNG.
function normalizeWordKitPasteImage(image, source) {
    if (/^data:image\/(png|jpe?g|gif|bmp)[;,]/i.test(source)) {
        return source;
    }
    try {
        var canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        if (!canvas.width || !canvas.height) {
            return "";
        }
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    } catch (error) {
        return "";
    }
}

function showWordKitToast(message) {
    var toast = document.getElementById("wk-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "wk-toast";
        toast.className = "wk-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("wk-toast-show");
    clearTimeout(toast.wordKitTimer);
    toast.wordKitTimer = setTimeout(function () {
        toast.classList.remove("wk-toast-show");
    }, 4200);
}

// ---------------------------------------------------------------------------
// Lenh
// ---------------------------------------------------------------------------
var wordKitBulletStyles = {
    dot: ["", "Symbol"],
    circle: ["o", "Courier New"],
    square: ["", "Wingdings"],
    flower: ["", "Wingdings"],
    arrow: ["", "Wingdings"],
    tick: ["", "Wingdings"],
    dash: ["–", "Times New Roman"],
};
var wordKitNumberStyles = {
    "1.": ["%1.", "Arabic"],
    "1)": ["%1)", "Arabic"],
    "a.": ["%1.", "LowLetter"],
    "a)": ["%1)", "LowLetter"],
    "A.": ["%1.", "UpLetter"],
    "i.": ["%1.", "LowRoman"],
    "I.": ["%1.", "UpRoman"],
};
var wordKitFontSizeSteps = [8, 9, 10, 10.5, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
var wordKitPageSizes = {
    A4: [595.3, 841.9],
    A5: [419.55, 595.3],
    A3: [841.9, 1190.55],
    Letter: [612, 792],
    Legal: [612, 1008],
};
var wordKitLastFontColor = "#C00000";
var wordKitLastHighlight = "Yellow";
var wordKitLastShading = "#D9D9D9";
// Lenh doi bo cuc trang (le, huong, kho giay) moi can dan trang lai ca van ban. Cac lenh khac
// Syncfusion tu ve lai dung doan bi doi; truoc day lenh nao cung goi layoutWholeDocument nen
// hop dong dai khung lai ca giay moi lan bam B/I/U.
var wordKitSectionCommands = {
    "a4-default": true,
    margins: true,
    orientation: true,
    "page-orientation": true,
    "page-size": true,
};
var wordKitTableCommands = {
    "table-row-above": true,
    "table-row-below": true,
    "table-col-left": true,
    "table-col-right": true,
    "table-delete-row": true,
    "table-delete-col": true,
    "table-delete": true,
    "table-merge": true,
    "table-autofit": true,
    "table-distribute-rows": true,
    "table-distribute-cols": true,
    "table-valign": true,
    "table-shading": true,
    "table-shading-apply": true,
    "table-properties": true,
    "borders-shading": true,
};

function isWordKitSelectionInTable(editor) {
    var selection = editor && editor.selection;
    if (!selection) {
        return false;
    }
    if (String(selection.contextType || "").indexOf("Table") !== -1) {
        return true;
    }
    var paragraph = selection.start && selection.start.paragraph;
    return !!(paragraph && paragraph.isInsideTable);
}

function stepWordKitFontSize(characterFormat, direction) {
    var size = Number(characterFormat.fontSize) || 14;
    var next = direction > 0 ? Math.min(size + 1, 1638) : Math.max(size - 1, 1);
    var index;
    if (direction > 0) {
        for (index = 0; index < wordKitFontSizeSteps.length; index += 1) {
            if (wordKitFontSizeSteps[index] > size + 0.01) {
                next = wordKitFontSizeSteps[index];
                break;
            }
        }
    } else {
        for (index = wordKitFontSizeSteps.length - 1; index >= 0; index -= 1) {
            if (wordKitFontSizeSteps[index] < size - 0.01) {
                next = wordKitFontSizeSteps[index];
                break;
            }
        }
    }
    characterFormat.fontSize = next;
}

function applyWordKitMargins(selection, value) {
    var margins = String(value || "").split(",").map(Number);
    var sectionFormat = selection && selection.sectionFormat;
    if (!sectionFormat || margins.length !== 4 || margins.some(function (margin) { return !Number.isFinite(margin); })) {
        return;
    }
    sectionFormat.topMargin = syncfusionOfficeKitCentimetersToPoints(margins[0]);
    sectionFormat.bottomMargin = syncfusionOfficeKitCentimetersToPoints(margins[1]);
    sectionFormat.leftMargin = syncfusionOfficeKitCentimetersToPoints(margins[2]);
    sectionFormat.rightMargin = syncfusionOfficeKitCentimetersToPoints(margins[3]);
}

function applyWordKitPageSize(selection, name) {
    var size = wordKitPageSizes[name];
    var sectionFormat = selection && selection.sectionFormat;
    if (!size || !sectionFormat) {
        return;
    }
    var landscape = Number(sectionFormat.pageWidth) > Number(sectionFormat.pageHeight);
    sectionFormat.pageWidth = landscape ? size[1] : size[0];
    sectionFormat.pageHeight = landscape ? size[0] : size[1];
}

function applyWordKitOrientation(selection, orientation) {
    var sectionFormat = selection && selection.sectionFormat;
    if (!sectionFormat) {
        return;
    }
    var width = Number(sectionFormat.pageWidth) || syncfusionOfficeKitDefaultSectionFormat.pageWidth;
    var height = Number(sectionFormat.pageHeight) || syncfusionOfficeKitDefaultSectionFormat.pageHeight;
    if ((width > height) !== (orientation === "Landscape")) {
        sectionFormat.pageWidth = height;
        sectionFormat.pageHeight = width;
    }
}

function setWordKitColorBar(name, color) {
    document.querySelectorAll('[data-wk-color-bar="' + name + '"]').forEach(function (bar) {
        bar.style.background = color;
    });
}

function showWordKitFindPane(editor, replace) {
    if (typeof editor.showOptionsPane !== "function") {
        return;
    }
    editor.showOptionsPane();
    if (!replace) {
        return;
    }
    // Ngan tim kiem cua Syncfusion co san the "Thay thế"; chuyen sang the do.
    setTimeout(function () {
        var pane = editor.optionsPaneModule;
        if (!pane) {
            return;
        }
        if (pane.tabInstance && typeof pane.tabInstance.select === "function") {
            pane.tabInstance.select(1);
        } else if (typeof pane.onReplacePane === "function") {
            pane.onReplacePane();
        }
    }, 0);
}

function getWordKitSaveButton() {
    return document.getElementById("submit-noidung")
        || document.getElementById("soan-luu")
        || document.getElementById("sub-dk");
}

function runSyncfusionOfficeKitCommand(editorContainer, command, arg) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!editor) {
        return;
    }

    var editorModule = editor.editor || {};
    var selection = editor.selection || {};
    var characterFormat = selection.characterFormat || {};
    var paragraphFormat = selection.paragraphFormat || {};
    var keepFocus = true;

    if (wordKitTableCommands[command] && !isWordKitSelectionInTable(editor)) {
        showWordKitToast("Hãy đặt con trỏ vào trong bảng trước.");
        return;
    }

    // Cac lenh vien bang tu menu: border-<Type>
    if (command.indexOf("border-") === 0) {
        if (!isWordKitSelectionInTable(editor)) {
            showWordKitToast("Hãy đặt con trỏ vào trong bảng trước khi chỉnh viền.");
            return;
        }
        applySyncfusionOfficeKitTableBorderType(editor, command.slice("border-".length));
        finishWordKitCommand(editorContainer, editor, false, true);
        return;
    }

    switch (command) {
        case "unsupported":
            return;
        case "new-document":
            editor.open(JSON.stringify(syncfusionOfficeKitDocument([syncfusionOfficeKitParagraph("")])));
            break;
        case "import-word":
            // Mot so du an da viet lai phan mo file (openSyncfusionOfficeKitImportDialog).
            if (typeof openSyncfusionOfficeKitImportDialog === "function") {
                openSyncfusionOfficeKitImportDialog();
            } else if (typeof openSyncfusionOfficeKitImportVinbs === "function") {
                openSyncfusionOfficeKitImportVinbs();
            }
            keepFocus = false;
            break;
        case "paste-from-store":
            lockSyncfusionOfficeKitPageScroll();
            pasteSyncfusionOfficeKitFromStore(editor);
            break;
        case "insert-checkbox":
            insertSyncfusionOfficeKitCheckBox(editor);
            break;
        case "table-fixed-width":
            if (isWordKitSelectionInTable(editor) && editorModule.autoFitTable) {
                editorModule.autoFitTable("FixedColumnWidth");
            }
            break;
        case "toggle-table-grid": {
            var gridToggle = document.querySelector('[data-wk-menu-toggle="table-insert"]');
            if (gridToggle) {
                selectSyncfusionOfficeKitTab(document.getElementById("syncfusion-office-kit-ribbon"), "insert");
                openWordKitMenu(gridToggle);
            }
            keepFocus = false;
            break;
        }
        case "paste":
            lockSyncfusionOfficeKitPageScroll();
            pasteWordKitFromClipboard(editor, false);
            keepFocus = false;
            break;
        case "paste-text":
            pasteWordKitFromClipboard(editor, true);
            keepFocus = false;
            break;
        case "cut":
            if (typeof editorModule.cut === "function") {
                editorModule.cut();
            } else {
                document.execCommand("cut");
            }
            break;
        case "copy":
            if (typeof selection.copy === "function") {
                selection.copy();
            } else {
                document.execCommand("copy");
            }
            break;
        case "format-painter":
            toggleWordKitFormatPainter(editor);
            break;
        case "undo":
            if (editor.editorHistory && editor.editorHistory.undo) {
                editor.editorHistory.undo();
            }
            break;
        case "redo":
            if (editor.editorHistory && editor.editorHistory.redo) {
                editor.editorHistory.redo();
            }
            break;
        case "download-docx":
            save("Docx");
            keepFocus = false;
            break;
        case "save-template": {
            var saveButton = getWordKitSaveButton();
            if (saveButton) {
                saveButton.click();
            } else {
                save("Docx");
            }
            keepFocus = false;
            break;
        }
        case "bold":
            characterFormat.bold = !characterFormat.bold;
            break;
        case "italic":
            characterFormat.italic = !characterFormat.italic;
            break;
        case "underline":
            characterFormat.underline = characterFormat.underline === "Single" ? "None" : "Single";
            break;
        case "strikethrough":
            characterFormat.strikethrough = characterFormat.strikethrough === "SingleStrike" ? "None" : "SingleStrike";
            break;
        case "subscript":
            characterFormat.baselineAlignment = characterFormat.baselineAlignment === "Subscript" ? "Normal" : "Subscript";
            break;
        case "superscript":
            characterFormat.baselineAlignment = characterFormat.baselineAlignment === "Superscript" ? "Normal" : "Superscript";
            break;
        case "grow-font":
            stepWordKitFontSize(characterFormat, 1);
            break;
        case "shrink-font":
            stepWordKitFontSize(characterFormat, -1);
            break;
        case "change-case":
            if (selection.isEmpty) {
                showWordKitToast("Bôi đen đoạn chữ cần đổi chữ hoa/thường.");
            } else if (typeof editorModule.changeCase === "function") {
                editorModule.changeCase(arg === "Lowercase" ? "Lowercase" : "Uppercase");
            }
            break;
        case "highlight":
            // Menu chon mau; khong co arg = lenh cu (bat/tat vang).
            if (arg) {
                characterFormat.highlightColor = arg;
                if (arg !== "NoColor") {
                    wordKitLastHighlight = arg;
                    setWordKitColorBar("highlight", (wordKitHighlightColors.filter(function (item) { return item[0] === arg; })[0] || [])[1] || "#FFFF00");
                }
            } else {
                characterFormat.highlightColor = characterFormat.highlightColor === "Yellow" ? "NoColor" : "Yellow";
            }
            break;
        case "highlight-apply":
            if (typeof editorModule.toggleHighlightColor === "function") {
                editorModule.toggleHighlightColor(wordKitLastHighlight);
            } else {
                characterFormat.highlightColor = characterFormat.highlightColor === wordKitLastHighlight ? "NoColor" : wordKitLastHighlight;
            }
            break;
        case "font-color":
            characterFormat.fontColor = arg || "#000000";
            wordKitLastFontColor = arg || "#000000";
            setWordKitColorBar("font", wordKitLastFontColor);
            break;
        case "font-color-apply":
            characterFormat.fontColor = wordKitLastFontColor;
            break;
        case "clear-formatting":
            Object.keys(syncfusionOfficeKitDefaultCharacterFormat).forEach(function (key) {
                characterFormat[key] = syncfusionOfficeKitDefaultCharacterFormat[key];
            });
            break;
        case "style-normal":
            paragraphFormat.styleName = "Normal";
            break;
        case "style-heading1":
            paragraphFormat.styleName = "Heading 1";
            break;
        case "style-heading2":
            paragraphFormat.styleName = "Heading 2";
            break;
        case "style-title":
            paragraphFormat.styleName = "Title";
            break;
        case "style-strong":
            characterFormat.bold = true;
            break;
        case "align-left":
            paragraphFormat.textAlignment = "Left";
            break;
        case "align-center":
            paragraphFormat.textAlignment = paragraphFormat.textAlignment === "Center" ? "Left" : "Center";
            break;
        case "align-right":
            paragraphFormat.textAlignment = paragraphFormat.textAlignment === "Right" ? "Left" : "Right";
            break;
        case "justify":
            paragraphFormat.textAlignment = paragraphFormat.textAlignment === "Justify" ? "Left" : "Justify";
            break;
        case "increase-indent":
            if (typeof editorModule.increaseIndent === "function") {
                editorModule.increaseIndent();
            } else {
                paragraphFormat.leftIndent = (Number(paragraphFormat.leftIndent) || 0) + 18;
            }
            break;
        case "decrease-indent":
            if (typeof editorModule.decreaseIndent === "function") {
                editorModule.decreaseIndent();
            } else {
                paragraphFormat.leftIndent = Math.max((Number(paragraphFormat.leftIndent) || 0) - 18, 0);
            }
            break;
        case "bullets": {
            var bullet = wordKitBulletStyles[arg] || wordKitBulletStyles.dot;
            if (typeof editorModule.applyBullet === "function") {
                editorModule.applyBullet(bullet[0], bullet[1]);
            }
            break;
        }
        case "numbering": {
            var numbering = wordKitNumberStyles[arg] || wordKitNumberStyles["1."];
            if (typeof editorModule.applyNumbering === "function") {
                editorModule.applyNumbering(numbering[0], numbering[1]);
            }
            break;
        }
        case "clear-list":
            if (typeof editorModule.clearList === "function") {
                editorModule.clearList();
            }
            break;
        case "line-spacing":
            paragraphFormat.lineSpacingType = "Multiple";
            paragraphFormat.lineSpacing = Number(arg) || 1;
            break;
        case "space-before":
            paragraphFormat.beforeSpacing = Number(paragraphFormat.beforeSpacing) > 0 ? 0 : 6;
            break;
        case "space-after":
            paragraphFormat.afterSpacing = Number(paragraphFormat.afterSpacing) > 0 ? 0 : 6;
            break;
        case "find":
            showWordKitFindPane(editor, false);
            keepFocus = false;
            break;
        case "replace":
            showWordKitFindPane(editor, true);
            keepFocus = false;
            break;
        case "select-all":
            if (selection.selectAll) {
                selection.selectAll();
            }
            break;
        case "font-dialog":
            showSyncfusionDialog(editor, "Font");
            keepFocus = false;
            break;
        case "styles-dialog":
            showSyncfusionDialog(editor, "Styles");
            keepFocus = false;
            break;
        case "blank-page":
        case "insert-blank-page":
            // Giong Word: hai ngat trang -> con mot trang trong o giua.
            if (editorModule.insertPageBreak) {
                editorModule.insertPageBreak();
                editorModule.insertPageBreak();
            }
            break;
        case "page-break":
        case "insert-page-break":
            if (editorModule.insertPageBreak) {
                editorModule.insertPageBreak();
            }
            break;
        case "insert-image":
            insertSyncfusionOfficeKitImage(editor);
            keepFocus = false;
            break;
        case "insert-table":
            if (editorModule.insertTable) {
                editorModule.insertTable(2, 2);
            }
            break;
        case "insert-table-grid": {
            var size = String(arg || "").split(",");
            var rows = Math.max(1, Number(size[0]) || 1);
            var columns = Math.max(1, Number(size[1]) || 1);
            if (editorModule.insertTable) {
                editorModule.insertTable(rows, columns);
            }
            break;
        }
        case "insert-table-dialog":
            showSyncfusionDialog(editor, "Table");
            keepFocus = false;
            break;
        case "toggle-border-menu":
            toggleSyncfusionOfficeKitBorderMenu();
            keepFocus = false;
            break;
        case "insert-link":
            showSyncfusionDialog(editor, "Hyperlink");
            keepFocus = false;
            break;
        case "insert-bookmark":
            showSyncfusionDialog(editor, "Bookmark");
            keepFocus = false;
            break;
        case "insert-toc":
            showSyncfusionDialog(editor, "TableOfContents");
            keepFocus = false;
            break;
        case "insert-footnote":
            if (editorModule.insertFootnote) {
                editorModule.insertFootnote();
            }
            break;
        case "insert-endnote":
            if (editorModule.insertEndnote) {
                editorModule.insertEndnote();
            }
            break;
        case "insert-header":
            if (selection.goToHeader) {
                selection.goToHeader();
            }
            break;
        case "insert-footer":
            if (selection.goToFooter) {
                selection.goToFooter();
            }
            break;
        case "insert-page-number":
            if (editorModule.insertPageNumber) {
                editorModule.insertPageNumber();
            }
            break;
        case "insert-date-time":
            if (editorModule.insertText) {
                editorModule.insertText(new Date().toLocaleDateString("vi-VN"));
            }
            break;
        case "insert-equation": {
            var equation = window.prompt("Nhập công thức");
            if (equation && editorModule.insertText) {
                editorModule.insertText(equation);
            }
            break;
        }
        case "insert-symbol": {
            var symbol = arg || window.prompt("Nhập ký hiệu cần chèn");
            if (symbol && editorModule.insertText) {
                editorModule.insertText(symbol);
            }
            break;
        }
        case "a4-default":
            applySyncfusionOfficeKitA4(editor);
            break;
        case "page-setup":
        case "page-margins":
            showSyncfusionDialog(editor, "PageSetup");
            keepFocus = false;
            break;
        case "margins":
            applyWordKitMargins(selection, arg);
            break;
        case "page-size":
            if (arg) {
                applyWordKitPageSize(selection, arg);
            } else {
                showSyncfusionDialog(editor, "PageSetup");
                keepFocus = false;
            }
            break;
        case "orientation":
        case "page-orientation":
            if (arg) {
                applyWordKitOrientation(selection, arg);
            } else {
                toggleSyncfusionOfficeKitOrientation(editor);
            }
            break;
        case "insert-section-break":
            if (editorModule.insertSectionBreak) {
                editorModule.insertSectionBreak("NewPage");
            }
            break;
        case "paragraph-settings":
            showSyncfusionDialog(editor, "Paragraph");
            keepFocus = false;
            break;
        case "toggle-ruler":
            toggleSyncfusionOfficeKitRuler(editorContainer);
            break;
        case "track-changes":
            editor.enableTrackChanges = !editor.enableTrackChanges;
            break;
        case "show-revisions":
            editor.showRevisions = !editor.showRevisions;
            break;
        case "show-comments":
            editor.showComments = !editor.showComments;
            break;
        case "accept-all":
        case "reject-all":
            if (editor.revisions && typeof editor.revisions.acceptAll === "function") {
                if (command === "accept-all") {
                    editor.revisions.acceptAll();
                } else {
                    editor.revisions.rejectAll();
                }
            }
            break;
        case "insert-comment":
            if (editor.enableComment === false) {
                editor.enableComment = true;
            }
            if (editorModule.insertComment) {
                editorModule.insertComment("");
            }
            keepFocus = false;
            break;
        case "fit-width":
            if (editor.fitPage) {
                editor.fitPage("FitPageWidth");
            }
            break;
        case "fit-page":
            if (editor.fitPage) {
                editor.fitPage("FitOnePage");
            }
            break;
        case "zoom":
            editor.zoomFactor = (Number(arg) || 100) / 100;
            break;
        case "layout-pages":
            editor.layoutType = "Pages";
            break;
        case "layout-web":
            editor.layoutType = "Continuous";
            break;
        case "toggle-properties":
            editor.showPropertiesPane = !editor.showPropertiesPane;
            break;
        case "toggle-ribbon":
            toggleWordKitRibbonCollapsed();
            break;
        case "print":
            if (typeof printSyncfusionOfficeKitDocument === "function") {
                printSyncfusionOfficeKitDocument(editorContainer, editor);
            } else if (typeof onPrint === "function") {
                onPrint();
            }
            keepFocus = false;
            break;
        case "table-row-above":
            editorModule.insertRow(true);
            break;
        case "table-row-below":
            editorModule.insertRow(false);
            break;
        case "table-col-left":
            editorModule.insertColumn(true);
            break;
        case "table-col-right":
            editorModule.insertColumn(false);
            break;
        case "table-delete-row":
            editorModule.deleteRow();
            break;
        case "table-delete-col":
            editorModule.deleteColumn();
            break;
        case "table-delete":
            editorModule.deleteTable();
            break;
        case "table-merge":
            if (selection.isEmpty) {
                showWordKitToast("Bôi đen các ô cần gộp rồi bấm Gộp ô.");
            } else {
                editorModule.mergeCells();
            }
            break;
        case "table-autofit":
            editorModule.autoFitTable(arg || "FitToContents");
            break;
        case "table-distribute-rows":
            if (!distributeWordKitTableRows(editor)) {
                showWordKitToast("Bảng cần ít nhất hai hàng để phân bố đều.");
            }
            break;
        case "table-distribute-cols":
            if (!distributeWordKitTableColumns(editor)) {
                showWordKitToast("Hàng này cần ít nhất hai cột để phân bố đều.");
            }
            break;
        case "table-shading-apply":
            if (selection.cellFormat) {
                selection.cellFormat.background = wordKitLastShading;
            }
            break;
        case "table-valign":
            if (selection.cellFormat) {
                selection.cellFormat.verticalAlignment = arg || "Top";
            }
            break;
        case "table-shading":
            if (selection.cellFormat) {
                selection.cellFormat.background = arg || "empty";
                if (arg) {
                    wordKitLastShading = arg;
                    setWordKitColorBar("shading", arg);
                }
            }
            break;
        case "table-properties":
            showSyncfusionDialog(editor, "TableProperties");
            keepFocus = false;
            break;
        case "borders-shading":
            showSyncfusionDialog(editor, "BordersAndShading");
            keepFocus = false;
            break;
    }

    finishWordKitCommand(editorContainer, editor, wordKitSectionCommands[command] === true, keepFocus);
}

function finishWordKitCommand(editorContainer, editor, sectionChanged, keepFocus) {
    if (sectionChanged) {
        syncfusionOfficeKitRefreshEditorLayout(editorContainer, editor);
        scheduleSyncfusionOfficeKitRulerUpdate(editorContainer);
    } else if (keepFocus && editor && editor.focusIn) {
        editor.focusIn();
    }
    scheduleWordKitStateUpdate(editorContainer);
}

function runSyncfusionOfficeKitChange(editorContainer, changeName, value) {
    var editor = getSyncfusionOfficeKitEditor(editorContainer);
    if (!editor || !editor.selection) {
        return;
    }

    var numericValue = Number(value);
    var pointValue = syncfusionOfficeKitCentimetersToPoints(numericValue);

    if (changeName === "font-family") {
        if (String(value || "").trim()) {
            editor.selection.characterFormat.fontFamily = String(value).trim();
        }
    } else if (changeName === "font-size") {
        if (numericValue > 0) {
            editor.selection.characterFormat.fontSize = Math.min(numericValue, 1638);
        }
    } else if (changeName === "font-color" || changeName === "font-color-custom") {
        editor.selection.characterFormat.fontColor = value || "#000000";
        if (changeName === "font-color-custom") {
            wordKitLastFontColor = value || "#000000";
            setWordKitColorBar("font", wordKitLastFontColor);
        }
    } else if (changeName === "before-spacing" || changeName === "layout-before-spacing") {
        editor.selection.paragraphFormat.beforeSpacing = numericValue || 0;
    } else if (changeName === "after-spacing" || changeName === "layout-after-spacing") {
        editor.selection.paragraphFormat.afterSpacing = numericValue || 0;
    } else if (changeName === "line-spacing" || changeName === "layout-line-spacing") {
        editor.selection.paragraphFormat.lineSpacing = numericValue || 1;
        editor.selection.paragraphFormat.lineSpacingType = "Multiple";
    } else if (changeName === "layout-left-indent") {
        editor.selection.paragraphFormat.leftIndent = pointValue;
    } else if (changeName === "layout-right-indent") {
        editor.selection.paragraphFormat.rightIndent = pointValue;
    } else if (changeName === "layout-first-line-indent") {
        editor.selection.paragraphFormat.firstLineIndent = pointValue;
    } else if (changeName === "layout-margin-top") {
        editor.selection.sectionFormat.topMargin = pointValue;
    } else if (changeName === "layout-margin-right") {
        editor.selection.sectionFormat.rightMargin = pointValue;
    } else if (changeName === "layout-margin-bottom") {
        editor.selection.sectionFormat.bottomMargin = pointValue;
    } else if (changeName === "layout-margin-left") {
        editor.selection.sectionFormat.leftMargin = pointValue;
    } else if (changeName === "border-color") {
        syncfusionOfficeKitBorderColor = value || "#000000";
        return;
    } else if (changeName === "border-width") {
        syncfusionOfficeKitBorderWidth = Number(value) || 0.5;
        return;
    } else if (changeName.indexOf("table-cell-margin-") === 0) {
        applySyncfusionOfficeKitCellMargin(editor, changeName.slice("table-cell-margin-".length), pointValue);
    } else if (changeName === "layout-default-tab-width") {
        if (editor.documentHelper) {
            editor.documentHelper.defaultTabWidth = pointValue;
        }
    }

    var sectionChanged = changeName.indexOf("layout-margin-") === 0 || changeName === "layout-default-tab-width";
    // O so (le, thut le...) dang go do: khong keo focus ve van ban, de con bam mui ten tang/giam tiep.
    var typingInRibbonNumber = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("wk-number");
    finishWordKitCommand(editorContainer, editor, sectionChanged, !typingInRibbonNumber);
}

function syncfusionOfficeKitCentimetersToPoints(value) {
    value = Number(value);
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.round(value * 28.3464566929 * 100) / 100;
}

function showSyncfusionDialog(editor, dialogName) {
    if (editor && typeof editor.showDialog === "function") {
        editor.showDialog(dialogName);
    }
}

function applySyncfusionOfficeKitA4(editor) {
    if (!editor || !editor.selection || !editor.selection.sectionFormat) {
        return;
    }

    Object.keys(syncfusionOfficeKitDefaultSectionFormat).forEach(function (key) {
        editor.selection.sectionFormat[key] = syncfusionOfficeKitDefaultSectionFormat[key];
    });
}

function toggleSyncfusionOfficeKitOrientation(editor) {
    if (!editor || !editor.selection || !editor.selection.sectionFormat) {
        return;
    }

    var format = editor.selection.sectionFormat;
    var width = Number(format.pageWidth) || syncfusionOfficeKitDefaultSectionFormat.pageWidth;
    var height = Number(format.pageHeight) || syncfusionOfficeKitDefaultSectionFormat.pageHeight;
    format.pageWidth = height;
    format.pageHeight = width;
}

function toggleSyncfusionOfficeKitRuler(editorContainer) {
    var activeContainer = editorContainer && editorContainer.documentEditor
        ? editorContainer
        : (window.container && window.container.documentEditor ? window.container : null);
    var editor = activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null;
    if (!activeContainer || !editor) {
        return;
    }

    var settings = activeContainer.documentEditorSettings || {};
    var nextValue = !(settings.showRuler === true || settings.enableRuler === true || (editor.documentEditorSettings && (editor.documentEditorSettings.showRuler === true || editor.documentEditorSettings.enableRuler === true)));
    settings.enableRuler = nextValue;
    settings.showRuler = nextValue;
    activeContainer.documentEditorSettings = settings;
    activeContainer.enableRuler = nextValue;
    if (activeContainer.element) {
        activeContainer.element.classList.toggle("syncfusion-office-kit-rulers-hidden", !nextValue);
    }
    if (editor.documentEditorSettings) {
        editor.documentEditorSettings.enableRuler = nextValue;
        editor.documentEditorSettings.showRuler = nextValue;
    }
    editor.enableRuler = nextValue;
    if (activeContainer.dataBind) {
        activeContainer.dataBind();
    }
    if (editor.dataBind) {
        editor.dataBind();
    }
    if (activeContainer.resize) {
        activeContainer.resize();
    }
    if (editor.resize) {
        editor.resize();
    }
    if (nextValue) {
        installSyncfusionOfficeKitRulers(activeContainer);
        scheduleSyncfusionOfficeKitRulerUpdate(activeContainer);
    }
}

function getSyncfusionOfficeKitImportInput() {
    var input = document.getElementById("syncfusionOfficeKitImportVinbsInput");

    if (!input) {
        input = document.createElement("input");
        input.type = "file";
        input.id = "syncfusionOfficeKitImportVinbsInput";
        input.accept = ".doc,.docx,.sfdt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json";
        input.style.display = "none";
        document.body.appendChild(input);
    }

    if (input.getAttribute("data-office-kit-bound") !== "true") {
        input.addEventListener("change", function () {
            var file = input.files && input.files[0] ? input.files[0] : null;
            importSyncfusionOfficeKitVinbsFile(file);
        });
        input.setAttribute("data-office-kit-bound", "true");
    }

    return input;
}

function openSyncfusionOfficeKitImportVinbs() {
    var input = getSyncfusionOfficeKitImportInput();
    input.value = "";
    input.click();
}

function importSyncfusionOfficeKitVinbsFile(file) {
    if (!file) {
        return;
    }

    var editor = getSyncfusionOfficeKitEditor(container);
    if (!editor) {
        alert("Khong tim thay trinh soan thao de import.");
        return;
    }

    var fileName = String(file.name || "vinbs").trim();
    if (/\.sfdt$/i.test(fileName) || file.type === "application/json") {
        importSyncfusionOfficeKitSfdtFile(file, editor, fileName);
        return;
    }

    importSyncfusionOfficeKitWordFile(file, editor, fileName);
}

function importSyncfusionOfficeKitSfdtFile(file, editor, fileName) {
    var reader = new FileReader();
    reader.onload = function () {
        openSyncfusionOfficeKitSfdtText(String(reader.result || ""), editor, fileName, "Import VINBS SFDT error", "Khong import duoc file SFDT.");
    };
    reader.onerror = function () {
        alert("Khong doc duoc file SFDT.");
    };
    reader.readAsText(file);
}

function importSyncfusionOfficeKitWordFile(file, editor, fileName) {
    var formData = new FormData();
    formData.append("files", file);
    formData.append("document_editor_service_url", syncfusionOfficeKitDocumentServiceUrl);

    var importUrl = window.syncfusionOfficeKitImportUrl || (window.location.origin + "/api/documenteditor/import-vinbs");
    var request = new XMLHttpRequest();

    request.open("POST", importUrl, true);
    request.onreadystatechange = function () {
        if (request.readyState !== XMLHttpRequest.DONE) {
            return;
        }

        if (request.status < 200 || request.status >= 300 || !request.responseText) {
            console.error("Import VINBS response:", request.status, request.responseText);
            alert("Khong import duoc file Word.");
            return;
        }

        openSyncfusionOfficeKitSfdtText(request.responseText, editor, fileName, "Import VINBS open error", "File import khong hop le.");
    };
    request.onerror = function () {
        alert("Khong ket noi duoc dich vu import VINBS.");
    };
    request.send(formData);
}

function openSyncfusionOfficeKitSfdtText(sfdtText, editor, fileName, logPrefix, alertMessage) {
    try {
        editor.open(sfdtText);
        safelySetSyncfusionOfficeKitDocumentName(fileName);
        return true;
    } catch (error) {
        if (isSyncfusionOfficeKitSfdtText(sfdtText)) {
            console.warn(logPrefix + " (non-fatal):", error);
            safelySetSyncfusionOfficeKitDocumentName(fileName);
            return true;
        }

        console.error(logPrefix + ":", error);
        alert(alertMessage);
        return false;
    }
}

function isSyncfusionOfficeKitSfdtText(sfdtText) {
    try {
        var data = JSON.parse(String(sfdtText || ""));
        return Boolean(data && (Array.isArray(data.sections) || data.sfdt));
    } catch (error) {
        return false;
    }
}

function safelySetSyncfusionOfficeKitDocumentName(fileName) {
    try {
        setSyncfusionOfficeKitDocumentName(fileName);
    } catch (error) {
        console.warn("Import VINBS title update warning:", error);
    }
}

function setSyncfusionOfficeKitDocumentName(fileName) {
    var name = String(fileName || "vinbs").replace(/\.[^.]+$/, "").trim() || "vinbs";

    if (container && container.documentEditor) {
        container.documentEditor.documentName = name;
    }
    if (typeof updateDocumentTitle === "function") {
        updateDocumentTitle();
    }
}

function insertSyncfusionOfficeKitImage(editor) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/gif,image/bmp";
    input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.addEventListener("load", function () {
            if (typeof reader.result === "string" && editor.editor && editor.editor.insertImage) {
                editor.editor.insertImage(reader.result);
            }
        });
        reader.readAsDataURL(file);
    });
    input.click();
}

window.configureSyncfusionOfficeKit = configureSyncfusionOfficeKit;
window.scheduleSyncfusionOfficeKitChrome = scheduleSyncfusionOfficeKitChrome;
window.syncfusionOfficeKitDocument = syncfusionOfficeKitDocument;
window.syncfusionOfficeKitParagraph = syncfusionOfficeKitParagraph;
window.printSyncfusionOfficeKitDocument = printSyncfusionOfficeKitDocument;

// Viet hoa menu chuot phai, hop thoai va nut tuy chon dan cua Syncfusion. Khoa nao khong co o day
// thi Syncfusion tu dung chu tieng Anh mac dinh, nen dich dan duoc, khong vo gi.
// KHONG dich cac khoa Syncfusion 19.1 dem so sanh voi chu tieng Anh co dinh trong code (dich la hong
// chuc nang): Number, Numbering, Right, Read only, Spell Check, Underline errors; cung bo qua ten kieu
// (Normal, Heading 1...), ten kho giay, kieu so (Arabic, UpRoman...), Regular/Bold/Italic, None/Top/Bottom.
var wordKitLocaleVi = {
    // Menu chuot phai
    "Cut": "Cắt", "Copy": "Sao chép", "Paste": "Dán", "Hyperlink": "Liên kết", "Open Hyperlink": "Mở liên kết",
    "Copy Hyperlink": "Sao chép liên kết", "Remove Hyperlink": "Gỡ liên kết", "Edit Hyperlink": "Sửa liên kết",
    "Insert Hyperlink": "Chèn liên kết", "Font": "Phông chữ", "Paragraph": "Đoạn văn", "Insert": "Chèn", "Delete": "Xóa",
    "Merge Cells": "Gộp ô", "Insert Above": "Chèn hàng phía trên", "Insert Below": "Chèn hàng phía dưới",
    "Insert Left": "Chèn cột bên trái", "Insert Right": "Chèn cột bên phải", "Delete Table": "Xóa bảng",
    "Delete Row": "Xóa hàng", "Delete Column": "Xóa cột", "Table Properties": "Thuộc tính bảng", "AutoFit": "Tự khớp",
    "AutoFit to Contents": "Tự khớp nội dung", "AutoFit to Window": "Tự khớp cửa sổ", "Fixed Column Width": "Độ rộng cột cố định",
    "Continue Numbering": "Tiếp tục đánh số", "Restart At": "Bắt đầu lại từ", "Update Field": "Cập nhật trường",
    "Edit Field": "Sửa trường", "New Comment": "Chú thích mới", "Accept Changes": "Chấp nhận thay đổi",
    "Reject Changes": "Từ chối thay đổi", "Bullets": "Dấu đầu dòng", "Numbering and Bullets": "Đánh số và dấu đầu dòng",
    "Bookmark": "Dấu trang", "Page Setup": "Thiết lập trang", "Table of Contents": "Mục lục", "Insert Table": "Chèn bảng",
    "Styles": "Kiểu",
    // Nut tuy chon dan (ham xu ly da thay, khong con so chu tieng Anh)
    "Keep source formatting": "Giữ định dạng gốc", "Match destination formatting": "Theo định dạng văn bản",
    "Text only": "Chỉ giữ chữ",
    // Nut chung trong hop thoai
    "Ok": "Đồng ý", "Apply": "Áp dụng", "Cancel": "Hủy", "Close": "Đóng", "Save": "Lưu", "Reset": "Đặt lại",
    "Add": "Thêm", "Modify": "Sửa", "New": "Mới", "Go To": "Đi tới", "Edit": "Sửa", "Preview": "Xem trước",
    "Options": "Tùy chọn", "General": "Chung", "Properties": "Thuộc tính", "Name": "Tên", "Format": "Định dạng",
    "Formatting": "Định dạng", "Error in establishing connection with web server": "Không kết nối được dịch vụ soạn thảo",
    // Bang
    "Table": "Bảng", "Row": "Hàng", "Cell": "Ô", "Size": "Kích cỡ", "Preferred Width": "Độ rộng ưu tiên",
    "Measure in": "Đơn vị", "Alignment": "Căn chỉnh", "Indent from left": "Thụt lề từ trái",
    "Borders and Shading": "Viền và tô bóng", "Specify height": "Chỉ định chiều cao", "Row height is": "Chiều cao hàng là",
    "Allow row to break across pages": "Cho phép hàng ngắt sang trang sau",
    "Repeat as header row at the top of each page": "Lặp lại làm hàng tiêu đề ở đầu mỗi trang",
    "Vertical alignment": "Căn chỉnh dọc", "Default cell margins": "Lề ô mặc định", "Default cell spacing": "Khoảng cách ô mặc định",
    "Allow spacing between cells": "Cho phép giãn cách giữa các ô", "Cell margins": "Lề ô", "Same as the whole table": "Giống cả bảng",
    "Borders": "Viền", "Style": "Kiểu", "Width": "Độ rộng", "Height": "Chiều cao", "Color": "Màu", "Setting": "Thiết đặt",
    "Box": "Khung", "All": "Tất cả", "Custom": "Tùy chỉnh", "Shading": "Tô bóng", "Fill": "Màu tô", "Apply To": "Áp dụng cho",
    "Cell Options": "Tùy chọn ô", "Table Options": "Tùy chọn bảng", "Number of columns": "Số cột", "Number of rows": "Số hàng",
    "Table direction": "Hướng bảng",
    // Thiet lap trang
    "Top": "Trên", "Bottom": "Dưới", "Left": "Trái", "Right": "Phải",
    "Custom Size": "Tùy chỉnh", "Custom size": "Tùy chỉnh",
    "Margin": "Lề", "Paper": "Giấy", "Layout": "Bố cục", "Orientation": "Hướng", "Landscape": "Ngang", "Portrait": "Dọc",
    "Header": "Đầu trang", "Footer": "Chân trang", "Different odd and even": "Khác nhau trang chẵn lẻ",
    "Different first page": "Khác trang đầu", "From edge": "Cách mép",
    // Doan van
    "Indentation": "Thụt lề", "Before text": "Trước văn bản", "After text": "Sau văn bản", "Special": "Đặc biệt",
    "First line": "Dòng đầu", "Hanging": "Treo", "By": "Bằng", "Before": "Trước", "After": "Sau", "Line Spacing": "Giãn dòng",
    "At": "Mức", "Spacing": "Giãn cách", "Contextual Spacing": "Không thêm khoảng cách giữa các đoạn cùng kiểu",
    "Direction": "Hướng văn bản", "Right-to-left": "Phải sang trái", "Left-to-right": "Trái sang phải",
    "Indent from right": "Thụt lề từ phải",
    // Phong chu
    "Font style": "Kiểu phông", "Underline style": "Kiểu gạch dưới", "Font color": "Màu phông", "Effects": "Hiệu ứng",
    "Strikethrough": "Gạch ngang", "Superscript": "Chỉ số trên", "Subscript": "Chỉ số dưới",
    "Double strikethrough": "Gạch ngang đôi", "All caps": "Tất cả chữ hoa",
    // Danh sach nhieu cap
    "Define new Multilevel list": "Định nghĩa danh sách nhiều cấp mới", "List level": "Cấp danh sách",
    "Choose level to modify": "Chọn cấp cần sửa", "Level": "Cấp", "Number format": "Định dạng số",
    "Number style for this level": "Kiểu số cho cấp này", "Enter formatting for number": "Nhập định dạng số",
    "Start at": "Bắt đầu từ", "Restart list after": "Đánh số lại sau", "Position": "Vị trí", "Text indent at": "Thụt chữ tại",
    "Aligned at": "Căn tại", "Follow number with": "Sau số là",
    // Tim / thay the
    "Navigation": "Điều hướng", "Results": "Kết quả", "Replace": "Thay thế", "Replace All": "Thay thế tất cả",
    "We replaced all": "Đã thay thế tất cả", "Find": "Tìm", "No matches": "Không tìm thấy", "All Done": "Hoàn tất",
    "Result": "Kết quả", "of": "/", "instances": "chỗ", "with": "bằng", "Match case": "Phân biệt hoa thường",
    "Whole words": "Nguyên từ", "Search for": "Tìm", "Replace with": "Thay bằng", "No Headings": "Không có đề mục",
    "Add Headings": "Văn bản chưa có đề mục để điều hướng.", "More Options": "Tùy chọn khác",
    // Lien ket, dau trang, muc luc, chu thich cuoi
    "Text to display": "Văn bản hiển thị", "Address": "Địa chỉ", "Use bookmarks": "Dùng dấu trang",
    "Click to follow link": "Bấm để mở liên kết", "Bookmark name": "Tên dấu trang", "No bookmarks found": "Chưa có dấu trang",
    "Show page numbers": "Hiện số trang", "Right align page numbers": "Căn phải số trang", "Tab leader": "Dấu dẫn tab",
    "Show levels": "Số cấp hiển thị", "Use hyperlinks instead of page numbers": "Dùng liên kết thay cho số trang",
    "Build table of contents from": "Tạo mục lục từ", "Available styles": "Các kiểu có sẵn", "TOC level": "Cấp mục lục",
    "Outline levels": "Cấp dàn ý", "Footnote": "Cước chú", "Endnote": "Chú thích cuối", "InsertFootnote": "Chèn cước chú",
    "InsertEndnote": "Chèn chú thích cuối", "Notes Options": "Tùy chọn chú thích",
    "Click to View/Edit Footnote": "Bấm để xem/sửa cước chú", "Click to View/Edit Endnote": "Bấm để xem/sửa chú thích cuối",
    // Kieu
    "Create New Style": "Tạo kiểu mới", "Modify Style": "Sửa kiểu", "Style type": "Loại kiểu", "Style based on": "Dựa trên kiểu",
    "Style for following paragraph": "Kiểu cho đoạn tiếp theo", "Linked Style": "Kiểu liên kết", "Character": "Ký tự",
    "File Name": "Tên tệp", "Format Type": "Loại định dạng",
    // Chu thich (comment) va theo doi thay doi
    "Comments": "Chú thích", "Type your comment": "Nhập chú thích", "Post": "Đăng", "Reply": "Trả lời", "Resolve": "Đã xử lý",
    "Reopen": "Mở lại", "No comments in this document": "Văn bản chưa có chú thích", "more": "thêm",
    "Type your comment here": "Nhập chú thích tại đây", "Next Comment": "Chú thích sau", "Previous Comment": "Chú thích trước",
    "Un-posted comments": "Chú thích chưa đăng", "Discard Comment": "Bỏ chú thích", "Click to see this comment": "Bấm để xem chú thích",
    "Multiple Comment": "Nhiều chú thích", "Changes": "Thay đổi", "Accept": "Chấp nhận", "Reject": "Từ chối",
    "Accept all": "Chấp nhận tất cả", "Reject all": "Từ chối tất cả", "No changes": "Không có thay đổi",
    "Previous Changes": "Thay đổi trước", "Next Changes": "Thay đổi sau", "Inserted": "Đã chèn", "Deleted": "Đã xóa",
    "User": "Người dùng", "View": "Xem", "Insertion": "Chèn", "Deletion": "Xóa",
};
// Container: chi con thanh trang thai (so trang, thu phong) hien ra; thanh cong cu goc da an.
var wordKitContainerLocaleVi = {
    "Page": "Trang", "of": "/", "Fit one page": "Một trang", "Fit page width": "Chiều rộng trang",
    "Current Page Number": "Số trang hiện tại", "Print layout": "Bố cục in", "Web layout": "Bố cục web",
    "Error in establishing connection with web server": "Không kết nối được dịch vụ soạn thảo",
};

function loadWordKitLocale() {
    if (typeof ej === "undefined" || !ej.base || !ej.base.L10n || typeof ej.base.L10n.load !== "function") {
        return;
    }
    ej.base.L10n.load({
        vi: {
            documenteditor: wordKitLocaleVi,
            documenteditorcontainer: wordKitContainerLocaleVi,
        },
    });
}

// Khai bao truoc khi tao container: container.documentEditor.open(...) ngay ben duoi da kich hoat
// scheduleDocumentExportQr, luc do cac bien nay phai co gia tri (khong phai undefined do hoisting).
var documentExportQrPayload = null;
var documentExportQrPayloadPromise = null;
var documentExportQrSuppressOpenSchedule = false;
var documentExportQrRetryDelays = [0, 120, 350, 900, 1800, 3200, 5500, 8000, 12000];

loadWordKitLocale();

// Ten phong kieu cu tu RTF/Word theo bang ma Windows: "Times New Roman (Vietnamese)", "Arial CE", "Times New Roman Cyr"...
// Ten co dau ngoac bi trinh duyet tu choi (canvas giu phong cu, the do chieu cao lay phong cua trang) nen Syncfusion do chu
// sai: con tro nam lech dong, bam/keo chuot boi den nham dong tren, go chu xong con khoang trong. Doi ve ten phong goc.
var wordKitHauToPhongCu = /^(.+?)\s+(?:\((?:Vietnamese|Central European|Cyrillic|Greek|Turkish|Baltic|Arabic|Hebrew|Thai|Western)\)|CE|Cyr|Greek|Tur|Baltic)$/;

function chuanHoaTenPhongWordKit(tenPhong) {
    var khop = wordKitHauToPhongCu.exec(String(tenPhong).trim());
    return khop ? khop[1] : tenPhong;
}

// Mau RTF cu con ky tu dieu khien cua Word nam giua chu: U+001F (gach noi tuy chon), U+001E (gach noi khong ngat) va
// cac ky tu dieu khien khac. Trinh duyet ve thanh o vuong "□" nhung Syncfusion tinh do rong khac nen con tro lech tren dong do.
// Trong SFDT (JSON) chung luon o dang \u00XX; giu \t \n \r, \v (xuong dong) va \f (ngat trang) cua Syncfusion.
function boKyTuDieuKhienSfdtWordKit(sfdt) {
    return sfdt.replace(/(^|[^\\])((?:\\\\)*)\\u00(0[0-8]|0[eE]|1[0-9a-fA-F])/g, function (toanBo, truoc, gachCheo, ma) {
        return truoc + gachCheo + (ma.toLowerCase() === "1e" ? "-" : "");
    });
}

function chuanHoaTenPhongSfdtWordKit(sfdt) {
    if (typeof sfdt !== "string") {
        return sfdt;
    }
    if (sfdt.indexOf("\\u00") !== -1) {
        sfdt = boKyTuDieuKhienSfdtWordKit(sfdt);
    }
    if (sfdt.indexOf("fontFamily") === -1) {
        return sfdt;
    }
    return sfdt.replace(/("fontFamily[A-Za-z]*"\s*:\s*")((?:[^"\\]|\\.)*)"/g, function (toanBo, khoa, tenPhong) {
        var tenMoi = chuanHoaTenPhongWordKit(tenPhong);
        return tenMoi === tenPhong ? toanBo : khoa + tenMoi + '"';
    });
}

function patchWordKitFontNamesOnOpen(editor) {
    if (!editor || typeof editor.open !== "function" || editor.wordKitFontNamesPatched) {
        return;
    }
    var originalOpen = editor.open;
    editor.open = function (sfdt) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = chuanHoaTenPhongSfdtWordKit(sfdt);
        return originalOpen.apply(this, args);
    };
    editor.wordKitFontNamesPatched = true;
}

// Loi Syncfusion: updateViewerSizeInternal dat kich thuoc diem anh cua canvas (width/height) theo khung ngoai nhung khong doi
// kich thuoc hien thi (style). Buoc ve ngay sau (updateScrollBars -> updateCanvasWidthAndHeight) so diem anh, thay "da dung co"
// nen bo qua -> canvas hien thi bi co/gian so voi diem anh: chu ve lech khoi con tro, cang xuong duoi cang lech (vd. to khai V3
// khi trang doi co vung soan hai lan lien tiep, chi thay tren Chrome co thanh cuon chiem cho). Sau moi lan dat co khung, canvas
// nao lech thi xoa co de lan ve ngay sau dat lai ca diem anh lan kich thuoc hien thi. Syncfusion chi goi ham nay luc khoi tao
// (canvas chua co style) va trong updateViewerSize (luon goi updateScrollBars ngay sau) nen canvas khong bi bo trong.
function patchWordKitCanvasSizeSync(editor) {
    var helper = editor && editor.documentHelper;
    if (!helper || typeof helper.updateViewerSizeInternal !== "function" || helper.wordKitCanvasSizeSynced) {
        return;
    }
    var originalUpdate = helper.updateViewerSizeInternal;
    helper.updateViewerSizeInternal = function () {
        var result = originalUpdate.apply(this, arguments);
        var tiLe = Math.max(1, window.devicePixelRatio || 1);
        var cacCanvas = [this.containerCanvas, this.selectionCanvas].filter(function (canvas) {
            return canvas && canvas.style && canvas.style.width && canvas.style.height;
        });
        var lech = cacCanvas.some(function (canvas) {
            return Math.abs(canvas.width - parseFloat(canvas.style.width) * tiLe) > 1
                || Math.abs(canvas.height - parseFloat(canvas.style.height) * tiLe) > 1;
        });
        if (lech) {
            cacCanvas.forEach(function (canvas) {
                canvas.width = 0;
                canvas.height = 0;
            });
        }
        return result;
    };
    helper.wordKitCanvasSizeSynced = true;
}

// Khong dat serviceUrl: dan giu dinh dang doi HTML -> SFDT ngay tren trinh duyet (patchWordKitPasteHandler),
// khong goi dich vu .NET (SystemClipboard).
var container = new ej.documenteditor.DocumentEditorContainer({
    locale: window.ej && ej.base && ej.base.L10n ? "vi" : "en-US",
    enableToolbar: true,
    // false: moi lan dan deu doc bo nho tam cua he thong (noi dung tu Word/trinh duyet/Excel hoac tu chinh bo soan).
    enableLocalPaste: false,
    enableFooter: true,
    enableHeaderAndFooter: true,
    enableRuler: true,
    documentEditorSettings: {
        printDevicePixelRatio: 6.25,
        showHeaderAndFooter: true,
        enableRuler: true,
        showRuler: true,
        allowDragAndDrop: true,
    }
});

window.container = container;
container.appendTo("#container");
patchWordKitFontNamesOnOpen(container.documentEditor);
patchWordKitCanvasSizeSync(container.documentEditor);
container.height = "900px";
try {
    configureSyncfusionOfficeKit(container);
} catch (error) {
    console.error("Syncfusion Office kit config error:", error);
}
scheduleSyncfusionOfficeKitChrome(container);

var documentEditor = container.documentEditor;

var defaultDocument = {
    sections: [{
        blocks: [{
            inlines: [{ text: "Văn bản mẫu." }]
        }],
        headersFooters: {
            header: { blocks: [] },
            footer: { blocks: [] }
        }
    }]
};






defaultDocument = syncfusionOfficeKitDocument([
    syncfusionOfficeKitParagraph("Van ban mau.")
]);
container.documentEditor.open(JSON.stringify(defaultDocument));
container.showPropertiesPane = false;
container.documentEditor.documentName = "vinbs";
container.documentEditor.pageOutline = "FF000";

var titleBarDiv = document.getElementById("documenteditor_titlebar");
// Trang nhung khong co thanh tieu de (chi co #container) van chay tiep phan con lai cua kit (PDF, QR, logo).
if (titleBarDiv) {
    initializeTitleBar(true);
    updateDocumentTitle();
    wireEventsInTitleBar();
}

container.documentChange = function () {
    updateDocumentTitle();
};

function initializeTitleBar(isShareNeeded) {
    documentTitle = ej.base.createElement("label", {
        id: "documenteditor_title_name",
        styles: "text-transform:capitalize;font-weight:400;text-overflow:ellipsis;white-space:pre;overflow:hidden;user-select:none;cursor:text",
    });
    documentTitleContentEditor = ej.base.createElement("div", {
        id: "documenteditor_title_contentEditor",
        className: "single-line",
    });
    documentTitleContentEditor.appendChild(documentTitle);
    titleBarDiv.appendChild(documentTitleContentEditor);
    documentTitleContentEditor.setAttribute("title", "Document Name. Click or tap to rename this document.");

    var btnStyles = "float:right;background: transparent;box-shadow:none; font-family: inherit;border-color: transparent;" +
        "border-radius: 2px;color:inherit;font-size:12px;text-transform:capitalize;margin-top:4px;height:28px;font-weight:400";

    // Nut In noi bat tren thanh tieu de: chu trang, dam, vien trang mo.
    var printStyles = btnStyles.replace("color:inherit", "color:#fff").replace("font-weight:400", "font-weight:700")
        .replace("border-color: transparent", "border-color: rgba(255,255,255,.75)") + ";font-size:13px;padding:0 14px;background:rgba(255,255,255,.14)";
    print = addButton("e-de-icon-Print e-de-padding-right", "In", printStyles, "de-print", "In văn bản (Ctrl+P).", false);
    openBtn = addButton("e-de-icon-Open e-de-padding-right", "Import VINBS", btnStyles, "de-open", "Import file VINBS", false);

    var items = [{ text: "Microsoft Word (.docx)", id: "word" }];
    download = addButton("e-de-icon-Download e-de-padding-right", "Sửa trên Word", btnStyles, "documenteditor-share", "Download this document.", true, items);

    if (!isShareNeeded) {
        download.element.style.display = "none";
    } else {
        openBtn.element.style.display = "none";
    }
}

container.documentEditor.keyDown = function (args) {
    var keyCode = args.event.which || args.event.keyCode;
    var isCtrlKey = args.event.ctrlKey || args.event.metaKey;
    if (isCtrlKey && keyCode === 80) {
        args.isHandled = true;
        onPrint();
        args.event.preventDefault();
    }
};

function wireEventsInTitleBar() {
    print.element.addEventListener("click", onPrint);
    openBtn.element.addEventListener("click", function () {
        openSyncfusionOfficeKitImportVinbs();
    });
    documentTitleContentEditor.addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            documentTitleContentEditor.contentEditable = "false";
            if (documentTitleContentEditor.textContent === "") {
                documentTitleContentEditor.textContent = "Document1";
            }
        }
    });
    documentTitleContentEditor.addEventListener("blur", function () {
        if (documentTitleContentEditor.textContent === "") {
            documentTitleContentEditor.textContent = "Document1";
        }
        documentTitleContentEditor.contentEditable = "false";
        container.documentEditor.documentName = documentTitle.textContent;
    });
    documentTitleContentEditor.addEventListener("click", updateDocumentEditorTitle);
}

function updateDocumentEditorTitle() {
    documentTitleContentEditor.contentEditable = "true";
    documentTitleContentEditor.focus();
    window.getSelection().selectAllChildren(documentTitleContentEditor);
}

function updateDocumentTitle() {
    if (container.documentEditor.documentName === "") {
        container.documentEditor.documentName = "vinbs";
    }
    // Trang khong co #documenteditor_titlebar thi khong co o ten tai lieu.
    if (typeof documentTitle !== "undefined" && documentTitle) {
        documentTitle.textContent = container.documentEditor.documentName;
    }
}

window.configureDocumentExportQr = configureDocumentExportQr;
window.ensureDocumentExportQr = ensureDocumentExportQr;
window.scheduleDocumentExportQr = scheduleDocumentExportQr;
window.refreshDocumentEditorEnhancements = refreshDocumentEditorEnhancements;
refreshDocumentEditorEnhancements(container);

function isDocumentExportQrDisabled() {
    return window.documentExportQrDisabled === true
        || window.documentExportQrDisabled === "true"
        || window.documentExportQrDisabled === 1
        || window.documentExportQrDisabled === "1";
}

function clearDocumentExportQrTimers(editor) {
    if (editor && Array.isArray(editor.documentExportQrTimers)) {
        editor.documentExportQrTimers.forEach(function (timer) {
            clearTimeout(timer);
        });
    }
    if (editor) {
        editor.documentExportQrTimers = [];
    }
}

function getDocumentExportQrUrl() {
    return window.documentExportQrUrl || (hostUrl + "api/document-export-qr");
}

function configureDocumentExportQr(editor) {
    if (!editor) {
        return;
    }

    if (isDocumentExportQrDisabled()) {
        clearDocumentExportQrTimers(editor);
        return;
    }

    patchDocumentExportQrOpen(editor);
    patchDocumentExportQrDocumentChange(editor);
    scheduleDocumentExportQr(editor);
}

function refreshDocumentEditorEnhancements(editorContainer) {
    var activeContainer = editorContainer || (window.container && window.container.documentEditor ? window.container : null);
    if (!activeContainer) {
        return;
    }

    try {
        configureSyncfusionOfficeKit(activeContainer);
    } catch (error) {
        console.error("Syncfusion Office kit refresh error:", error);
    }

    scheduleSyncfusionOfficeKitChrome(activeContainer);

    if (activeContainer.documentEditor) {
        configureDocumentExportQr(activeContainer.documentEditor);
        scheduleDocumentExportQr(activeContainer.documentEditor);
    }
}

function patchDocumentExportQrOpen(editor) {
    if (!editor || typeof editor.open !== "function" || editor.documentExportQrOpenPatched) {
        return;
    }

    var originalOpen = editor.open.bind(editor);
    editor.open = function () {
        var result = originalOpen.apply(editor, arguments);
        scheduleSyncfusionOfficeKitRulerUpdate(editor.syncfusionOfficeKitContainer || (window.container && window.container.documentEditor === editor ? window.container : null));
        if (!documentExportQrSuppressOpenSchedule && !isDocumentExportQrDisabled()) {
            scheduleDocumentExportQr(editor);
        }

        return result;
    };
    editor.documentExportQrOpenPatched = true;
}

function patchDocumentExportQrDocumentChange(editor) {
    if (!editor || editor.documentExportQrDocumentChangePatched) {
        return;
    }

    var originalDocumentChange = typeof editor.documentChange === "function" ? editor.documentChange.bind(editor) : null;
    editor.documentChange = function () {
        var result = originalDocumentChange ? originalDocumentChange.apply(editor, arguments) : undefined;
        scheduleSyncfusionOfficeKitRulerUpdate(editor.syncfusionOfficeKitContainer || (window.container && window.container.documentEditor === editor ? window.container : null));
        if (!documentExportQrSuppressOpenSchedule && !isDocumentExportQrDisabled()) {
            scheduleDocumentExportQr(editor);
        }

        return result;
    };
    editor.documentExportQrDocumentChangePatched = true;
}

function scheduleDocumentExportQr(editor) {
    if (!editor || typeof editor.serialize !== "function") {
        return;
    }

    if (isDocumentExportQrDisabled()) {
        clearDocumentExportQrTimers(editor);
        return;
    }

    if (Array.isArray(editor.documentExportQrTimers)) {
        editor.documentExportQrTimers.forEach(function (timer) {
            clearTimeout(timer);
        });
    }
    editor.documentExportQrTimers = [];

    var delays = Array.isArray(window.documentExportQrRetryDelays) && window.documentExportQrRetryDelays.length
        ? window.documentExportQrRetryDelays
        : documentExportQrRetryDelays;

    // Moi lan thu la mot lan serialize() ca van ban; hop dong dai chay du 10 lan trong 12 giay dau
    // la 10 lan khung khi nguoi dung vua bat dau go. Hai lan lien tiep khong phai sua gi (va du lieu
    // QR/logo da tai xong) thi coi la on dinh, huy cac lan con lai. open() lai se len lich tu dau.
    var unchangedRuns = 0;
    var runEnsure = function () {
        ensureDocumentExportQr(editor).then(function (changed) {
            // Mot so du an da bo phan logo -> kiem tra truoc khi goi.
            var logoReady = typeof isDocumentExportLogoDisabled !== "function"
                || isDocumentExportLogoDisabled()
                || (typeof documentExportLogoPayload !== "undefined" && documentExportLogoPayload);
            var payloadsReady = (isDocumentExportQrDisabled() || documentExportQrPayload) && logoReady;
            unchangedRuns = changed || !payloadsReady ? 0 : unchangedRuns + 1;
            if (unchangedRuns >= 2) {
                clearDocumentExportQrTimers(editor);
            }
        });
    };

    Promise.resolve().then(runEnsure);

    delays.forEach(function (delay) {
        var timer = setTimeout(runEnsure, Number(delay || 300));
        editor.documentExportQrTimers.push(timer);
    });
}

function fetchDocumentExportQrPayload() {
    if (documentExportQrPayload) {
        return Promise.resolve(documentExportQrPayload);
    }

    if (documentExportQrPayloadPromise) {
        return documentExportQrPayloadPromise;
    }

    documentExportQrPayloadPromise = fetch(getDocumentExportQrUrl(), {
        method: "GET",
        headers: { "Accept": "application/json" },
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Cannot load document QR");
            }

            return response.json();
        })
        .then(function (payload) {
            documentExportQrPayload = payload || {};
            return documentExportQrPayload;
        })
        .catch(function (error) {
            documentExportQrPayloadPromise = null;
            console.error("Document QR load error:", error);
            return { enabled: false };
        });

    return documentExportQrPayloadPromise;
}

// QR/logo vua chen co vai khoa rieng (documentExportQr, alternateText...) va khoa gia tri mac dinh (distanceTop: 0...)
// ma serialize() cua Syncfusion bo di, thu tu khoa cung khac. So chuoi thi lan kiem tra nao cung thay "khac" va mo lai
// ca van ban (ke ca luc nguoi dung dang go/keo chuot): so theo noi dung, bo qua cac khoa do.
var wordKitKhoaBoQuaKhiSo = { documentExportQr: true, documentExportQrPlacement: true, documentExportLogo: true, alternateText: true };

function chuanHoaDeSoSfdtWordKit(giaTri) {
    if (Array.isArray(giaTri)) {
        return giaTri.map(chuanHoaDeSoSfdtWordKit);
    }
    if (giaTri && typeof giaTri === "object") {
        var ketQua = {};
        Object.keys(giaTri).sort().forEach(function (khoa) {
            var con = chuanHoaDeSoSfdtWordKit(giaTri[khoa]);
            var macDinh = con === 0 || con === false || con === "" || con === null || con === undefined
                || (typeof con === "object" && !Array.isArray(con) && Object.keys(con).length === 0);
            if (!wordKitKhoaBoQuaKhiSo[khoa] && !macDinh) {
                ketQua[khoa] = con;
            }
        });
        return ketQua;
    }
    return giaTri;
}

function laCungNoiDungSfdtWordKit(sfdtA, sfdtB) {
    try {
        return JSON.stringify(chuanHoaDeSoSfdtWordKit(JSON.parse(sfdtA)))
            === JSON.stringify(chuanHoaDeSoSfdtWordKit(JSON.parse(sfdtB)));
    } catch (error) {
        return false;
    }
}

function ensureDocumentExportQr(editor) {
    if (!editor || typeof editor.serialize !== "function" || typeof editor.open !== "function") {
        return Promise.resolve(false);
    }

    var qrDisabled = isDocumentExportQrDisabled();
    var logoDisabled = isDocumentExportLogoDisabled();
    // Trang tat logo han (vi du to khai) van phai go logo cu da luu trong noi dung.
    var logoStripOnly = isDocumentExportLogoTurnedOff();
    if (qrDisabled && logoDisabled && !logoStripOnly) {
        return Promise.resolve(false);
    }

    return Promise.all([
        qrDisabled ? Promise.resolve(null) : fetchDocumentExportQrPayload(),
        logoDisabled ? Promise.resolve(null) : fetchDocumentExportLogoPayload(),
    ])
        .then(function (payloads) {
            var qrPayload = payloads[0];
            var logoPayload = payloads[1];
            var currentSfdt = editor.serialize();
            var updatedSfdt = currentSfdt;

            if (qrPayload && qrPayload.enabled && getDocumentExportQrImageString(qrPayload)) {
                updatedSfdt = addDocumentExportQrToSfdt(updatedSfdt, qrPayload);
            }

            if (logoStripOnly) {
                updatedSfdt = removeDocumentExportLogoFromSfdt(updatedSfdt);
            } else if (logoPayload && logoPayload.enabled && getDocumentExportLogoImageString(logoPayload)) {
                updatedSfdt = addDocumentExportLogoToSfdt(updatedSfdt, logoPayload);
            }

            if (updatedSfdt === currentSfdt || laCungNoiDungSfdtWordKit(updatedSfdt, currentSfdt)) {
                return false;
            }

            documentExportQrSuppressOpenSchedule = true;
            try {
                editor.open(updatedSfdt);
            } finally {
                documentExportQrSuppressOpenSchedule = false;
            }

            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(true);
                }, 150);
            });
        })
        .catch(function (error) {
            console.error("Document QR/Logo insert error:", error);
            return false;
        });
}

function addDocumentExportQrToSfdt(sfdtText, payload) {
    var documentData;
    try {
        documentData = typeof sfdtText === "string" ? JSON.parse(sfdtText) : sfdtText;
    } catch (error) {
        return sfdtText;
    }

    if (!documentData || !Array.isArray(documentData.sections)) {
        return sfdtText;
    }

    var changed = false;
    var bodyQrAdded = false;
    documentData.sections.forEach(function (section) {
        if (!section || typeof section !== "object") {
            return;
        }

        if (section.headersFooters && typeof section.headersFooters === "object") {
            Object.keys(section.headersFooters).forEach(function (key) {
                if (removeDocumentExportQrHeader(section.headersFooters[key], payload)) {
                    changed = true;
                }
            });
        }

        if (!bodyQrAdded) {
            if (ensureDocumentExportQrBody(section, payload)) {
                changed = true;
            }

            bodyQrAdded = true;
        }
    });

    return changed ? JSON.stringify(documentData) : sfdtText;
}

function removeDocumentExportQrHeader(header, payload) {
    if (!header || typeof header !== "object" || !Array.isArray(header.blocks)) {
        return false;
    }

    var before = JSON.stringify(header.blocks);
    header.blocks = removeDocumentExportQrBlocks(header.blocks, payload);

    return before !== JSON.stringify(header.blocks);
}

function ensureDocumentExportQrBody(section, payload) {
    if (!section || typeof section !== "object") {
        return false;
    }

    section.blocks = Array.isArray(section.blocks) ? section.blocks : [];
    var before = JSON.stringify(section.blocks);
    section.blocks = unwrapDocumentExportQrBlocks(section.blocks, payload);
    addDocumentExportQrFloatingInline(section.blocks, payload, section);

    return before !== JSON.stringify(section.blocks);
}

function syncDocumentExportQrBlocks(blocks, payload, section) {
    var result = { found: false, changed: false };
    if (!Array.isArray(blocks)) {
        return result;
    }

    blocks.forEach(function (block) {
        if (!block || typeof block !== "object") {
            return;
        }

        if (Array.isArray(block.inlines)) {
            block.inlines.forEach(function (inline) {
                if (!isDocumentExportQrInline(inline, payload)) {
                    return;
                }

                result.found = true;
                if (applyDocumentExportQrInlinePayload(inline, payload, section)) {
                    result.changed = true;
                }
            });
        }

        if (Array.isArray(block.rows)) {
            block.rows.forEach(function (row) {
                if (!row || !Array.isArray(row.cells)) {
                    return;
                }

                row.cells.forEach(function (cell) {
                    if (!cell || !Array.isArray(cell.blocks)) {
                        return;
                    }

                    var cellResult = syncDocumentExportQrBlocks(cell.blocks, payload, section);
                    result.found = result.found || cellResult.found;
                    result.changed = result.changed || cellResult.changed;
                });
            });
        }
    });

    return result;
}

function isDocumentExportQrInline(inline, payload) {
    if (!inline || typeof inline !== "object") {
        return false;
    }

    var image = getDocumentExportQrImageString(payload);
    return inline.documentExportQr === true
        || inline.alternateText === "document-export-qr"
        || inline.alternativeText === "document-export-qr"
        || (inline.imageString && inline.imageString === image);
}

function applyDocumentExportQrInlinePayload(inline, payload, section) {
    var values = buildDocumentExportQrInline(payload, inline.documentExportQrPlacement || "body", section);
    var changed = false;

    Object.keys(values).forEach(function (key) {
        if (inline[key] === values[key]) {
            return;
        }

        inline[key] = values[key];
        changed = true;
    });

    return changed;
}

function containsDocumentExportQrTableBlock(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return false;
    }

    return blocks.some(function (block) {
        return block && typeof block === "object" && Array.isArray(block.rows) && containsDocumentExportQrBlock([block], payload);
    });
}

function containsDocumentExportQrAlignedTableBlock(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return false;
    }

    return blocks.some(function (block) {
        return block
            && typeof block === "object"
            && Array.isArray(block.rows)
            && block.documentExportQrLayout === "heading-row"
            && containsDocumentExportQrBlock([block], payload);
    });
}

function removeDocumentExportQrBlocks(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return [];
    }

    return blocks.filter(function (block) {
        return !containsDocumentExportQrBlock([block], payload);
    });
}

function unwrapDocumentExportQrBlocks(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return [];
    }

    var unwrapped = [];
    blocks.forEach(function (block) {
        if (!block || typeof block !== "object" || !containsDocumentExportQrBlock([block], payload)) {
            unwrapped.push(block);
            return;
        }

        if (!Array.isArray(block.rows)) {
            var cleanedBlock = removeDocumentExportQrInlines(block);
            if (!isDocumentExportQrEmptyBlock(cleanedBlock)) {
                unwrapped.push(cleanedBlock);
            }

            return;
        }

        getDocumentExportQrNonQrCellBlocks(block, payload).forEach(function (cellBlock) {
            unwrapped.push(cellBlock);
        });
    });

    return unwrapped;
}

function removeDocumentExportQrInlines(block) {
    if (!block || typeof block !== "object" || !Array.isArray(block.inlines)) {
        return block;
    }

    var cleanedBlock = Object.assign({}, block);
    cleanedBlock.inlines = block.inlines.filter(function (inline) {
        return !inline
            || typeof inline !== "object"
            || (inline.documentExportQr !== true
                && inline.alternateText !== "document-export-qr"
                && inline.alternativeText !== "document-export-qr");
    });

    return cleanedBlock;
}

function addDocumentExportQrFloatingInline(blocks, payload, section) {
    if (!Array.isArray(blocks)) {
        return;
    }

    for (var i = 0; i < blocks.length; i += 1) {
        var block = blocks[i];
        if (!isDocumentExportQrParagraphBlock(block)) {
            continue;
        }

        block.inlines = Array.isArray(block.inlines) ? block.inlines : [];
        block.inlines.push(buildDocumentExportQrInline(payload, "body", section));
        return;
    }

    blocks.unshift(buildDocumentExportQrBlock(payload, "body", section));
}

function getDocumentExportQrNonQrCellBlocks(tableBlock, payload) {
    var cellBlocks = [];

    (tableBlock.rows || []).forEach(function (row) {
        if (!row || !Array.isArray(row.cells)) {
            return;
        }

        row.cells.forEach(function (cell) {
            if (!cell || !Array.isArray(cell.blocks)) {
                return;
            }

            cell.blocks.forEach(function (cellBlock) {
                if (!cellBlock || typeof cellBlock !== "object") {
                    return;
                }

                if (containsDocumentExportQrBlock([cellBlock], payload) || isDocumentExportQrEmptyBlock(cellBlock)) {
                    return;
                }

                cellBlocks.push(cellBlock);
            });
        });
    });

    return cellBlocks;
}

function extractDocumentExportQrHeadingBlocks(blocks) {
    var headingBlocks = [];
    var remainingBlocks = [];
    var meaningfulBlocks = 0;
    var isExtracting = true;

    (Array.isArray(blocks) ? blocks : []).forEach(function (block) {
        if (isExtracting
            && headingBlocks.length < 8
            && block
            && typeof block === "object"
            && isDocumentExportQrParagraphBlock(block)) {
            headingBlocks.push(block);

            if (!isDocumentExportQrEmptyBlock(block)) {
                meaningfulBlocks += 1;
            }

            if (meaningfulBlocks >= 3) {
                isExtracting = false;
            }

            return;
        }

        remainingBlocks.push(block);
    });

    if (meaningfulBlocks === 0) {
        return {
            headingBlocks: [buildDocumentExportQrEmptyParagraph()],
            blocks: Array.isArray(blocks) ? blocks : [],
        };
    }

    return {
        headingBlocks: headingBlocks,
        blocks: remainingBlocks,
    };
}

function isDocumentExportQrParagraphBlock(block) {
    return block
        && typeof block === "object"
        && !Array.isArray(block.rows)
        && (Object.prototype.hasOwnProperty.call(block, "paragraphFormat")
            || Object.prototype.hasOwnProperty.call(block, "inlines"));
}

function isDocumentExportQrEmptyBlock(block) {
    if (!block || typeof block !== "object" || Array.isArray(block.rows)) {
        return false;
    }

    return !((block.inlines || []).some(function (inline) {
        return inline
            && typeof inline === "object"
            && (
                inline.imageString
                || String(inline.text || "").trim() !== ""
                || inline.fieldType !== undefined
            );
    }));
}

function containsDocumentExportQrBlock(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return false;
    }

    var image = getDocumentExportQrImageString(payload);
    var dataUri = payload && payload.image ? String(payload.image) : "";
    return blocks.some(function (block) {
        if (!block || typeof block !== "object") {
            return false;
        }

        if (Array.isArray(block.inlines) && block.inlines.some(function (inline) {
            return inline
                && typeof inline === "object"
                && (!inline.imageFormat || inline.imageFormat === "Png")
                && (
                    inline.documentExportQr === true
                    || inline.alternateText === "document-export-qr"
                    || inline.alternativeText === "document-export-qr"
                    || inline.imageString === image
                    || inline.imageString === dataUri
                );
        })) {
            return true;
        }

        if (Array.isArray(block.rows)) {
            return block.rows.some(function (row) {
                return row && Array.isArray(row.cells) && row.cells.some(function (cell) {
                    return cell && containsDocumentExportQrBlock(cell.blocks, payload);
                });
            });
        }

        return false;
    });
}

function getDocumentExportQrImageString(payload) {
    if (!payload) {
        return "";
    }

    if (payload.image) {
        return String(payload.image);
    }

    return payload.imageBase64 ? "data:image/png;base64," + String(payload.imageBase64) : "";
}

function buildDocumentExportQrHeaderBlock(payload) {
    return buildDocumentExportQrBlock(payload, "header");
}

function buildDocumentExportQrBodyTableBlock(payload, section, headingBlocks) {
    var qrWidth = Math.max(20, Number(payload.width || 60));
    var tableWidth = Math.max(120, getDocumentExportQrSectionContentWidth(section));
    var sideCellWidth = Math.min(Math.max(qrWidth + 10, 70), Math.max(40, (tableWidth - 80) / 2));
    var centerCellWidth = Math.max(20, tableWidth - (sideCellWidth * 2));
    tableWidth = (sideCellWidth * 2) + centerCellWidth;
    var borders = documentExportQrNoBorders();

    return {
        rows: [{
            cells: [{
                blocks: [buildDocumentExportQrEmptyParagraph()],
                cellFormat: documentExportQrCellFormat(sideCellWidth, borders),
                columnIndex: 0,
            }, {
                blocks: Array.isArray(headingBlocks) && headingBlocks.length ? headingBlocks : [buildDocumentExportQrEmptyParagraph()],
                cellFormat: documentExportQrCellFormat(centerCellWidth, borders),
                columnIndex: 1,
            }, {
                blocks: [buildDocumentExportQrBlock(payload, "body")],
                cellFormat: documentExportQrCellFormat(sideCellWidth, borders),
                columnIndex: 2,
            }],
            rowFormat: {
                height: 1,
                allowBreakAcrossPages: true,
                heightType: "AtLeast",
                isHeader: false,
                borders: borders,
                gridBefore: 0,
                gridBeforeWidth: 0,
                gridBeforeWidthType: "Point",
                gridAfter: 0,
                gridAfterWidth: 0,
                gridAfterWidthType: "Point",
            },
        }],
        grid: [sideCellWidth, centerCellWidth, sideCellWidth],
        tableFormat: {
            borders: borders,
            shading: documentExportQrShading(),
            cellSpacing: 0,
            leftIndent: 0,
            tableAlignment: "Left",
            topMargin: 0,
            rightMargin: 0,
            leftMargin: 0,
            bottomMargin: 0,
            preferredWidth: tableWidth,
            preferredWidthType: "Point",
        },
        description: "document-export-qr",
        title: "document-export-qr",
        documentExportQr: true,
        documentExportQrPlacement: "body",
        documentExportQrLayout: "heading-row",
    };
}

function buildDocumentExportQrEmptyParagraph() {
    return {
        paragraphFormat: {
            beforeSpacing: 0,
            afterSpacing: 0,
            lineSpacing: 1,
            lineSpacingType: "Multiple",
            listFormat: {},
        },
        characterFormat: {},
        inlines: [],
    };
}

function documentExportQrCellFormat(width, borders) {
    return {
        borders: borders,
        shading: documentExportQrShading(),
        topMargin: 0,
        rightMargin: 0,
        leftMargin: 0,
        bottomMargin: 0,
        preferredWidth: width,
        preferredWidthType: "Point",
        cellWidth: width,
        columnSpan: 1,
        rowSpan: 1,
        verticalAlignment: "Top",
    };
}

function documentExportQrNoBorders() {
    return {
        top: documentExportQrNoBorder(),
        left: documentExportQrNoBorder(),
        right: documentExportQrNoBorder(),
        bottom: documentExportQrNoBorder(),
        diagonalDown: documentExportQrNoBorder(),
        diagonalUp: documentExportQrNoBorder(),
        horizontal: documentExportQrNoBorder(),
        vertical: documentExportQrNoBorder(),
    };
}

function documentExportQrNoBorder() {
    return {
        color: "#000000",
        hasNoneStyle: false,
        lineStyle: "None",
        lineWidth: 0,
        shadow: false,
        space: 0,
    };
}

function documentExportQrShading() {
    return {
        backgroundColor: "#ffffff",
        foregroundColor: "empty",
        textureStyle: "TextureNone",
    };
}

function getDocumentExportQrSectionContentWidth(section) {
    var format = section && section.sectionFormat ? section.sectionFormat : {};
    var pageWidth = Number(format.pageWidth || 595.28);
    var leftMargin = Number(format.leftMargin || 85.04);
    var rightMargin = Number(format.rightMargin || 56.69);

    return Math.max(120, pageWidth - leftMargin - rightMargin);
}

function getDocumentExportQrSectionLeftMargin(section) {
    var format = section && section.sectionFormat ? section.sectionFormat : {};

    return Number(format.leftMargin || 85.04);
}

function buildDocumentExportQrBlock(payload, placement, section) {
    return {
        paragraphFormat: {
            textAlignment: "Right",
            beforeSpacing: 0,
            afterSpacing: 0,
            lineSpacing: 1,
            lineSpacingType: "Multiple",
            listFormat: {},
        },
        characterFormat: {},
        inlines: [buildDocumentExportQrInline(payload, placement || "body", section)],
    };
}

function buildDocumentExportQrInline(payload, placement, section) {
    var inline = {
        characterFormat: {},
        imageString: getDocumentExportQrImageString(payload),
        width: Number(payload.width || 60),
        height: Number(payload.height || 60),
        textWrappingStyle: placement === "body" ? "InFrontOfText" : "Inline",
        isMetaFile: false,
        alternateText: "document-export-qr",
        alternativeText: "document-export-qr",
        title: "document-export-qr",
        documentExportQr: true,
        documentExportQrPlacement: placement || "body",
    };

    if (placement === "body") {
        inline.verticalPosition = 0;
        inline.horizontalPosition = 0;
        inline.verticalOrigin = "Margin";
        inline.horizontalOrigin = "Margin";
        inline.verticalAlignment = "Top";
        inline.horizontalAlignment = "Right";
        inline.distanceTop = 0;
        inline.distanceBottom = 0;
        inline.distanceLeft = 0;
        inline.distanceRight = 0;
        inline.allowOverlap = true;
        inline.layoutInCell = true;
    }

    return inline;
}

/* ==========================================================================
   Logo van ban: lay cau hinh tu api/document-export-logo roi chen anh logo
   noi (floating) vao dau than van ban, tuong tu co che cua QRCode.
   ========================================================================== */

var documentExportLogoPayload = null;
var documentExportLogoPayloadPromise = null;

window.ensureDocumentExportLogo = ensureDocumentExportQr;

// Trang tu tat logo (window.documentExportLogoDisabled) thi vua khong chen moi, vua go logo cu.
function isDocumentExportLogoTurnedOff() {
    return window.documentExportLogoDisabled === true
        || window.documentExportLogoDisabled === "true"
        || window.documentExportLogoDisabled === 1
        || window.documentExportLogoDisabled === "1";
}

function isDocumentExportLogoDisabled() {
    if (isDocumentExportQrDisabled()) {
        return true;
    }

    return isDocumentExportLogoTurnedOff();
}

function getDocumentExportLogoUrl() {
    return window.documentExportLogoUrl || (hostUrl + "api/document-export-logo");
}

function fetchDocumentExportLogoPayload() {
    if (documentExportLogoPayload) {
        return Promise.resolve(documentExportLogoPayload);
    }

    if (documentExportLogoPayloadPromise) {
        return documentExportLogoPayloadPromise;
    }

    documentExportLogoPayloadPromise = fetch(getDocumentExportLogoUrl(), {
        method: "GET",
        headers: { "Accept": "application/json" },
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Cannot load document logo");
            }

            return response.json();
        })
        .then(function (payload) {
            documentExportLogoPayload = payload || {};
            return documentExportLogoPayload;
        })
        .catch(function (error) {
            documentExportLogoPayloadPromise = null;
            console.error("Document logo load error:", error);
            return { enabled: false };
        });

    return documentExportLogoPayloadPromise;
}

function addDocumentExportLogoToSfdt(sfdtText, payload) {
    var documentData;
    try {
        documentData = typeof sfdtText === "string" ? JSON.parse(sfdtText) : sfdtText;
    } catch (error) {
        return sfdtText;
    }

    if (!documentData || !Array.isArray(documentData.sections)) {
        return sfdtText;
    }

    var changed = false;
    var bodyLogoAdded = false;
    documentData.sections.forEach(function (section) {
        if (!section || typeof section !== "object") {
            return;
        }

        if (section.headersFooters && typeof section.headersFooters === "object") {
            Object.keys(section.headersFooters).forEach(function (key) {
                if (removeDocumentExportLogoHeader(section.headersFooters[key], payload)) {
                    changed = true;
                }
            });
        }

        if (!bodyLogoAdded) {
            if (ensureDocumentExportLogoBody(section, payload)) {
                changed = true;
            }

            bodyLogoAdded = true;
        }
    });

    return changed ? JSON.stringify(documentData) : sfdtText;
}

// Go het logo da chen truoc do, khong chen lai. Chi nhan dien theo dau (alternateText /
// documentExportLogo) nen anh khac trong van ban khong bi xoa nham.
function removeDocumentExportLogoFromSfdt(sfdtText) {
    var documentData;
    try {
        documentData = typeof sfdtText === "string" ? JSON.parse(sfdtText) : sfdtText;
    } catch (error) {
        return sfdtText;
    }

    if (!documentData || !Array.isArray(documentData.sections)) {
        return sfdtText;
    }

    var changed = false;
    documentData.sections.forEach(function (section) {
        if (!section || typeof section !== "object") {
            return;
        }

        if (section.headersFooters && typeof section.headersFooters === "object") {
            Object.keys(section.headersFooters).forEach(function (key) {
                if (removeDocumentExportLogoHeader(section.headersFooters[key], null)) {
                    changed = true;
                }
            });
        }

        section.blocks = Array.isArray(section.blocks) ? section.blocks : [];
        var before = JSON.stringify(section.blocks);
        section.blocks = unwrapDocumentExportLogoBlocks(section.blocks, null);
        if (before !== JSON.stringify(section.blocks)) {
            changed = true;
        }
    });

    return changed ? JSON.stringify(documentData) : sfdtText;
}

function removeDocumentExportLogoHeader(header, payload) {
    if (!header || typeof header !== "object" || !Array.isArray(header.blocks)) {
        return false;
    }

    var before = JSON.stringify(header.blocks);
    header.blocks = header.blocks.filter(function (block) {
        return !containsDocumentExportLogoBlock([block], payload);
    });

    return before !== JSON.stringify(header.blocks);
}

function ensureDocumentExportLogoBody(section, payload) {
    if (!section || typeof section !== "object") {
        return false;
    }

    section.blocks = Array.isArray(section.blocks) ? section.blocks : [];
    var before = JSON.stringify(section.blocks);
    section.blocks = unwrapDocumentExportLogoBlocks(section.blocks, payload);
    addDocumentExportLogoFloatingInline(section.blocks, payload);

    return before !== JSON.stringify(section.blocks);
}

function unwrapDocumentExportLogoBlocks(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return [];
    }

    var unwrapped = [];
    blocks.forEach(function (block) {
        if (!block || typeof block !== "object" || !containsDocumentExportLogoBlock([block], payload)) {
            unwrapped.push(block);
            return;
        }

        if (Array.isArray(block.rows)) {
            unwrapped.push(block);
            return;
        }

        var cleanedBlock = removeDocumentExportLogoInlines(block);
        if (!isDocumentExportLogoEmptyBlock(cleanedBlock)) {
            unwrapped.push(cleanedBlock);
        }
    });

    return unwrapped;
}

function removeDocumentExportLogoInlines(block) {
    if (!block || typeof block !== "object" || !Array.isArray(block.inlines)) {
        return block;
    }

    var cleanedBlock = Object.assign({}, block);
    cleanedBlock.inlines = block.inlines.filter(function (inline) {
        return !isDocumentExportLogoInline(inline);
    });

    return cleanedBlock;
}

function addDocumentExportLogoFloatingInline(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return;
    }

    for (var i = 0; i < blocks.length; i += 1) {
        var block = blocks[i];
        if (!isDocumentExportLogoParagraphBlock(block)) {
            continue;
        }

        block.inlines = Array.isArray(block.inlines) ? block.inlines : [];
        // Logo dat o dau doan, QRCode dat o cuoi doan -> thu tu on dinh, khong doi cho lien tuc.
        block.inlines.unshift(buildDocumentExportLogoInline(payload));
        return;
    }

    blocks.unshift(buildDocumentExportLogoBlock(payload));
}

function isDocumentExportLogoInline(inline) {
    if (!inline || typeof inline !== "object") {
        return false;
    }

    return inline.documentExportLogo === true
        || inline.alternateText === "document-export-logo"
        || inline.alternativeText === "document-export-logo";
}

function isDocumentExportLogoParagraphBlock(block) {
    return block
        && typeof block === "object"
        && !Array.isArray(block.rows)
        && (Object.prototype.hasOwnProperty.call(block, "paragraphFormat")
            || Object.prototype.hasOwnProperty.call(block, "inlines"));
}

function isDocumentExportLogoEmptyBlock(block) {
    if (!block || typeof block !== "object" || Array.isArray(block.rows)) {
        return false;
    }

    return !((block.inlines || []).some(function (inline) {
        return inline
            && typeof inline === "object"
            && (
                inline.imageString
                || String(inline.text || "").trim() !== ""
                || inline.fieldType !== undefined
            );
    }));
}

function containsDocumentExportLogoBlock(blocks, payload) {
    if (!Array.isArray(blocks)) {
        return false;
    }

    var image = getDocumentExportLogoImageString(payload);
    return blocks.some(function (block) {
        if (!block || typeof block !== "object") {
            return false;
        }

        if (Array.isArray(block.inlines) && block.inlines.some(function (inline) {
            return isDocumentExportLogoInline(inline)
                || (inline && typeof inline === "object" && image && inline.imageString === image);
        })) {
            return true;
        }

        if (Array.isArray(block.rows)) {
            return block.rows.some(function (row) {
                return row && Array.isArray(row.cells) && row.cells.some(function (cell) {
                    return cell && containsDocumentExportLogoBlock(cell.blocks, payload);
                });
            });
        }

        return false;
    });
}

function getDocumentExportLogoImageString(payload) {
    if (!payload) {
        return "";
    }

    if (payload.image) {
        return String(payload.image);
    }

    return payload.imageBase64 ? "data:image/png;base64," + String(payload.imageBase64) : "";
}

function buildDocumentExportLogoBlock(payload) {
    return {
        paragraphFormat: {
            textAlignment: "Left",
            beforeSpacing: 0,
            afterSpacing: 0,
            lineSpacing: 1,
            lineSpacingType: "Multiple",
            listFormat: {},
        },
        characterFormat: {},
        inlines: [buildDocumentExportLogoInline(payload)],
    };
}

function buildDocumentExportLogoInline(payload) {
    var offsetTop = Number(payload.offsetTop || 0);

    return {
        characterFormat: {},
        imageString: getDocumentExportLogoImageString(payload),
        width: Number(payload.width || 70),
        height: Number(payload.height || 70),
        textWrappingStyle: "InFrontOfText",
        isMetaFile: false,
        alternateText: "document-export-logo",
        alternativeText: "document-export-logo",
        title: "document-export-logo",
        documentExportLogo: true,
        documentExportLogoPlacement: "body",
        verticalPosition: offsetTop,
        horizontalPosition: 0,
        verticalOrigin: "Margin",
        horizontalOrigin: "Margin",
        verticalAlignment: offsetTop > 0 ? "None" : "Top",
        horizontalAlignment: payload.horizontalAlignment || "Left",
        distanceTop: 0,
        distanceBottom: 0,
        distanceLeft: 0,
        distanceRight: 0,
        allowOverlap: true,
        layoutInCell: true,
    };
}

function printSyncfusionOfficeKitDocument(editorContainer, editor) {
    var activeContainer = editorContainer && editorContainer.documentEditor
        ? editorContainer
        : getSyncfusionOfficeKitActiveContainer(editorContainer);
    editor = editor || (activeContainer && activeContainer.documentEditor ? activeContainer.documentEditor : null) || getSyncfusionOfficeKitEditor(editorContainer);

    if (!editor) {
        alert("Khong tim thay trinh soan thao de in.");
        return;
    }

    // In nhanh (printSyncfusionOfficeKitFast): ve tung trang bang chinh bo ve trang khi in cua Syncfusion -> ban in
    // khop man hinh tung dong, roi in bang iframe an ngay tren trang (khong mo cua so, khong tao PDF). Loi thi in qua
    // PDF tao tren trinh duyet (print-js), cuoi cung la editor.print() cua Syncfusion.
    // Trang nao muon in qua PDF ngay tu dau: dat window.syncfusionOfficeKitPrintViaPdf = true (ten cu
    // window.syncfusionOfficeKitPrintViaServer van nhan).
    if (syncfusionOfficeKitPrintBusy) {
        if (typeof showWordKitToast === "function") {
            showWordKitToast("Đang chuẩn bị bản in…");
        }
        return Promise.resolve(false);
    }
    syncfusionOfficeKitPrintBusy = true;

    var viaPdf = window.syncfusionOfficeKitPrintViaPdf === true || window.syncfusionOfficeKitPrintViaServer === true;
    var qrPromise = typeof ensureDocumentExportQr === "function" ? ensureDocumentExportQr(editor) : Promise.resolve(false);
    return Promise.resolve(qrPromise)
        .catch(function (error) {
            console.error("Print QR prepare error:", error);
        })
        .then(function () {
            if (!viaPdf && canCreateSyncfusionOfficeKitPdf(editor)) {
                return printSyncfusionOfficeKitFast(editor).catch(function (error) {
                    console.warn("Syncfusion Office kit fast print failed, in qua PDF:", error);
                    return printSyncfusionOfficeKitViaPdfOrDirect(editor);
                });
            }

            return printSyncfusionOfficeKitViaPdfOrDirect(editor);
        })
        .then(function (printed) {
            syncfusionOfficeKitPrintBusy = false;
            return printed;
        }, function (error) {
            syncfusionOfficeKitPrintBusy = false;
            throw error;
        });
}

var syncfusionOfficeKitPrintBusy = false;

function printSyncfusionOfficeKitViaPdfOrDirect(editor) {
    var direct = function () {
        var printedDirectly = printSyncfusionOfficeKitDirect(editor, true);
        if (!printedDirectly) {
            alert("Không in được văn bản. Vui lòng tải lại trang hoặc thử lại sau.");
        }
        return printedDirectly;
    };
    if (!canCreateSyncfusionOfficeKitPdf(editor)) {
        return Promise.resolve(direct());
    }

    return printSyncfusionOfficeKitViaPdf(editor).catch(function (error) {
        console.warn("Syncfusion Office kit PDF print fallback:", error);
        return direct();
    });
}

// Chu in bang anh: vien chu khu rang cua la diem xam nhat, may in ban diem -> chu nhat, dut net. Luc Syncfusion
// xuat anh tung trang (toDataURL), ep diem gan den khong mau thanh den han va nen gan trang thanh trang han ->
// net chu dam, lien mach. Diem co mau (logo, anh mau, chu mau) giu nguyen.
function withWordKitPrintInk(run) {
    var proto = window.HTMLCanvasElement && HTMLCanvasElement.prototype;
    if (!proto || typeof proto.toDataURL !== "function") {
        return run();
    }
    var original = proto.toDataURL;
    proto.toDataURL = function () {
        // Chi xu ly canvas trang in (rat lon); canvas khac de nguyen.
        if (this.width >= 1500 && this.height >= 1500) {
            try {
                darkenWordKitPrintCanvas(this);
            } catch (error) {
                console.warn("Word kit print ink warning:", error);
            }
        }
        return original.apply(this, arguments);
    };
    try {
        return run();
    } finally {
        proto.toDataURL = original;
    }
}

function darkenWordKitPrintCanvas(canvas) {
    var context = canvas.getContext("2d");
    if (!context) {
        return;
    }
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    // Doc tung diem 32-bit (RGBA little-endian = 0xAABBGGRR); diem nen trang / trong suot (hon 90% trang) bo qua ngay.
    var pixels = new Uint32Array(image.data.buffer);
    var white = 0xFFFFFFFF;
    for (var index = 0; index < pixels.length; index += 1) {
        var value = pixels[index];
        if (value === white) {
            continue;
        }
        if (value === 0) {
            pixels[index] = white;
            continue;
        }
        var alpha = value >>> 24;
        var red = value & 255;
        var green = (value >>> 8) & 255;
        var blue = (value >>> 16) & 255;
        if (alpha !== 255) {
            // Nen trong suot -> tron len nen trang truoc khi xet do dam.
            red = (red * alpha + 255 * (255 - alpha)) / 255;
            green = (green * alpha + 255 * (255 - alpha)) / 255;
            blue = (blue * alpha + 255 * (255 - alpha)) / 255;
        }
        var max = red > green ? (red > blue ? red : blue) : (green > blue ? green : blue);
        var min = red < green ? (red < blue ? red : blue) : (green < blue ? green : blue);
        if (max - min <= 48) {
            var luminance = (red * 3 + green * 6 + blue) / 10;
            if (luminance < 170) {
                red = green = blue = 0;
            } else if (luminance > 235) {
                red = green = blue = 255;
            }
        }
        pixels[index] = ((255 << 24) | ((blue & 255) << 16) | ((green & 255) << 8) | (red & 255)) >>> 0;
    }
    context.putImageData(image, 0, 0);
}

// ---------------------------------------------------------------------------
// PDF tao ngay tren trinh duyet
// ---------------------------------------------------------------------------
// Moi trang van ban duoc Syncfusion ve lai (dung bo ve trang khi in) len canvas ~200 dpi, nen JPEG roi ghep bang
// ej.pdfexport: kho trang PDF dung kho trang van ban (pt), le 0, ke ca trang ngang. Chu trong PDF la anh (khong
// chon/tim duoc). Khong con gui DOCX len may chu (api/get-file -> DocToPDF).
// JPEG 0.7: chu van ro o 200 dpi, nhe hon 0.8 khoang 15% (trang chu day khoang 350 KB).
var syncfusionOfficeKitPdfOptions = {
    dpi: 200,
    jpegQuality: 0.7,
};
// Blob do saveAsBlob cua bo soan nao tao ra -> doi blob do sang PDF thi ve lai tu chinh bo soan do.
var syncfusionOfficeKitBlobEditors = typeof WeakMap === "function" ? new WeakMap() : null;

patchSyncfusionOfficeKitSaveAsBlob();

function patchSyncfusionOfficeKitSaveAsBlob() {
    var DocumentEditor = typeof ej !== "undefined" && ej.documenteditor ? ej.documenteditor.DocumentEditor : null;
    var proto = DocumentEditor ? DocumentEditor.prototype : null;
    if (!proto || !syncfusionOfficeKitBlobEditors || proto.officeKitBlobPatched || typeof proto.saveAsBlob !== "function") {
        return;
    }
    var originalSaveAsBlob = proto.saveAsBlob;
    proto.officeKitBlobPatched = true;
    proto.saveAsBlob = function () {
        var editor = this;
        var result = originalSaveAsBlob.apply(this, arguments);
        if (!result || typeof result.then !== "function") {
            return result;
        }
        return result.then(function (blob) {
            if (blob && typeof blob === "object") {
                syncfusionOfficeKitBlobEditors.set(blob, editor);
            }
            return blob;
        });
    };
}

function isSyncfusionOfficeKitEditor(value) {
    return Boolean(value && typeof value === "object" && value.documentHelper && typeof value.serialize === "function");
}

function getSyncfusionOfficeKitBlobEditor(blob) {
    if (!blob || typeof blob !== "object" || !syncfusionOfficeKitBlobEditors) {
        return null;
    }
    var editor = syncfusionOfficeKitBlobEditors.get(blob);
    return editor && !editor.isDestroyed && editor.documentHelper ? editor : null;
}

function canCreateSyncfusionOfficeKitPdf(editor) {
    return Boolean(typeof ej !== "undefined" && ej.pdfexport && ej.pdfexport.PdfDocument && ej.pdfexport.PdfBitmap
        && editor && editor.documentHelper && editor.documentHelper.render
        && typeof editor.documentHelper.render.renderWidgets === "function");
}

/**
 * In qua PDF tao ngay tren trinh duyet (print-js). Net chu duoc lam dam nhu khi in truc tiep.
 */
function printSyncfusionOfficeKitViaPdf(editor) {
    return createSyncfusionOfficeKitPdfBase64(editor, { ink: true }).then(function (pdfBase64) {
        printSyncfusionOfficeKitPdfBase64(pdfBase64);
        return true;
    });
}

// Ten cu (truoc day gui DOCX len DocToPDF), giu cho trang nao con goi.
function printSyncfusionOfficeKitViaServer(editor) {
    return printSyncfusionOfficeKitViaPdf(editor);
}

// ---------------------------------------------------------------------------
// In nhanh (nut In, Ctrl+P trong bo soan)
// ---------------------------------------------------------------------------
// Truoc day nut In goi editor.print() cua Syncfusion: moi trang ve o printDevicePixelRatio 6.25 (~600 dpi, ~35 trieu
// diem mot trang A4), nen PNG base64 roi nap vao cua so moi -> vai giay moi trang. In nhanh ve tung trang ~240 dpi,
// lam dam net chu, nen JPEG bang toBlob (ngoai luong chinh), dung object URL (khong doi base64) va in bang iframe an
// ngay tren trang. Can net hon: window.syncfusionOfficeKitPrintDpi = 300 (72..600, cao hon thi cham hon).
var syncfusionOfficeKitPrintOptions = {
    dpi: 240,
    jpegQuality: 0.92,
};

/**
 * In nhanh toan bo van ban. Tra ve Promise<true> khi da mo hop thoai in.
 */
function printSyncfusionOfficeKitFast(editor) {
    if (!canCreateSyncfusionOfficeKitPdf(editor)) {
        return Promise.reject(new Error("Trình duyệt chưa sẵn sàng để in nhanh."));
    }

    var helper = editor.documentHelper;
    var pages = (helper.pages || []).slice();
    if (!pages.length) {
        return Promise.reject(new Error("Văn bản không có trang nào để in."));
    }

    var dpi = Math.max(72, Math.min(600, Number(window.syncfusionOfficeKitPrintDpi) || syncfusionOfficeKitPrintOptions.dpi));
    var quality = syncfusionOfficeKitPrintOptions.jpegQuality;
    var settings = editor.documentEditorSettings;
    var previousRatio = settings ? settings.printDevicePixelRatio : null;
    var showProgress = pages.length >= 5 && typeof showWordKitToast === "function";
    var images = [];
    var index = 0;

    // Bo ve trang khi in dung ti le max(devicePixelRatio, printDevicePixelRatio): dat tam ti le cho ~dpi.
    if (settings) {
        settings.printDevicePixelRatio = dpi / 96;
    }
    var restore = function () {
        if (settings && settings.printDevicePixelRatio !== previousRatio) {
            settings.printDevicePixelRatio = previousRatio;
        }
        releaseSyncfusionOfficeKitPageCanvas(helper.render);
    };

    return new Promise(function (resolve, reject) {
        var fail = function (error) {
            restore();
            revokeSyncfusionOfficeKitPrintImages(images);
            reject(error);
        };
        var next = function () {
            if (index >= pages.length) {
                restore();
                printSyncfusionOfficeKitImages(images, editor.documentName).then(resolve, fail);
                return;
            }

            var page = pages[index];
            var canvas;
            try {
                canvas = drawSyncfusionOfficeKitPrintPage(editor, page, true);
            } catch (error) {
                fail(error);
                return;
            }
            var size = getSyncfusionOfficeKitPageSizePt(page);
            syncfusionOfficeKitCanvasToJpegBlob(canvas, quality).then(function (blob) {
                images.push({ url: URL.createObjectURL(blob), width: size.width, height: size.height });
                index += 1;
                if (showProgress && index < pages.length) {
                    showWordKitToast("Đang chuẩn bị bản in: " + index + "/" + pages.length + " trang…");
                }
                setTimeout(next, 0);
            }).catch(fail);
        };
        next();
    });
}

// Canvas -> Blob JPEG. toBlob nen anh ngoai luong chinh; trinh duyet khong co thi doi tu toDataURL.
function syncfusionOfficeKitCanvasToJpegBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
        var fromDataUrl = function () {
            try {
                var base64 = String(canvas.toDataURL("image/jpeg", quality)).split(",")[1] || "";
                var binary = atob(base64);
                var bytes = new Uint8Array(binary.length);
                for (var index = 0; index < binary.length; index += 1) {
                    bytes[index] = binary.charCodeAt(index);
                }
                resolve(new Blob([bytes], { type: "image/jpeg" }));
            } catch (error) {
                reject(error);
            }
        };
        if (typeof canvas.toBlob !== "function") {
            fromDataUrl();
            return;
        }
        canvas.toBlob(function (blob) {
            if (blob) {
                resolve(blob);
            } else {
                fromDataUrl();
            }
        }, "image/jpeg", quality);
    });
}

function revokeSyncfusionOfficeKitPrintImages(images) {
    (images || []).forEach(function (image) {
        try {
            URL.revokeObjectURL(image.url);
        } catch (error) {
            // Da thu hoi.
        }
    });
}

/**
 * In cac anh trang ({ url, width, height } theo pt) bang iframe an: moi anh mot trang, kho giay dung kho trang, le 0
 * (trinh duyet khong in tieu de/ngay gio o le). Trang khac kho (vd trang ngang) dung @page co ten rieng.
 */
function printSyncfusionOfficeKitImages(images, title) {
    return new Promise(function (resolve, reject) {
        var iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        iframe.setAttribute("tabindex", "-1");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(iframe);

        var cleanedUp = false;
        var cleanup = function () {
            if (cleanedUp) {
                return;
            }
            cleanedUp = true;
            revokeSyncfusionOfficeKitPrintImages(images);
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        };

        var frameWindow = iframe.contentWindow;
        var frameDocument = frameWindow ? frameWindow.document : null;
        if (!frameDocument) {
            cleanup();
            reject(new Error("Không tạo được khung in."));
            return;
        }

        var first = images[0];
        var sameSize = images.every(function (image) {
            return image.width === first.width && image.height === first.height;
        });
        var pageRules = sameSize ? "@page{size:" + first.width + "pt " + first.height + "pt;margin:0}" : "";
        var namedSizes = {};
        var body = images.map(function (image) {
            var name = "kho" + Math.round(image.width * 100) + "x" + Math.round(image.height * 100);
            if (!sameSize && !namedSizes[name]) {
                namedSizes[name] = true;
                pageRules += "@page " + name + "{size:" + image.width + "pt " + image.height + "pt;margin:0}";
            }
            // Cao hon kho giay 1pt de lam tron khong day sang trang trang; anh cat 1pt day (le duoi, vung trong).
            return "<div class=\"trang\" style=\"" + (sameSize ? "" : "page:" + name + ";") + "width:" + image.width
                + "pt;height:" + Math.max(1, image.height - 1) + "pt\"><img src=\"" + image.url + "\" alt=\"\"></div>";
        }).join("");
        var safeTitle = String(title || "").replace(/[&<>"]/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character];
        });

        frameDocument.open();
        frameDocument.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + safeTitle + "</title><style>"
            + pageRules
            + "html,body{margin:0;padding:0;background:#fff}"
            + ".trang{overflow:hidden;break-after:page;page-break-after:always}"
            + ".trang:last-child{break-after:auto;page-break-after:auto}"
            + ".trang img{display:block;width:100%;height:auto}"
            + "</style></head><body>" + body + "</body></html>");
        frameDocument.close();

        var waitImage = function (image) {
            if (typeof image.decode === "function") {
                return image.decode().catch(function () {});
            }
            return new Promise(function (done) {
                if (image.complete) {
                    done();
                    return;
                }
                image.onload = image.onerror = function () {
                    done();
                };
            });
        };

        Promise.all(Array.prototype.map.call(frameDocument.images, waitImage)).then(function () {
            // Chrome/Edge: print() cho den khi dong hop thoai in roi moi chay tiep, afterprint bao xong.
            // Trinh duyet khong cho thi don sau 5 phut.
            frameWindow.addEventListener("afterprint", function () {
                setTimeout(cleanup, 1000);
            });
            setTimeout(cleanup, 5 * 60 * 1000);
            try {
                frameWindow.focus();
                frameWindow.print();
            } catch (error) {
                cleanup();
                reject(error);
                return;
            }
            resolve(true);
        });
    });
}

/**
 * Doi blob DOCX sang PDF (base64, khong kem tien to data:), tao ngay tren trinh duyet.
 * Modal "Cong chung so — tao phien" (dotary hopdongv2/cong_chung_so_modal.blade.php) goi ham nay voi blob vua xuat tu
 * container.documentEditor.saveAsBlob("Docx") -> PDF duoc ve lai tu chinh bo soan do (gom ca QR vua chen).
 * Blob khong do bo soan nao tren trang tao ra: mo tam vao mot bo soan an (qua dich vu mo file) roi ve tu do.
 * editor (tuy chon): bo soan can ve. options (tuy chon): { dpi, jpegQuality, onProgress(soTrangXong, tongSoTrang) }.
 */
function syncfusionOfficeKitConvertDocxBlobToPdfBase64(docxBlob, editor, options) {
    if (!options && editor && typeof editor === "object" && !isSyncfusionOfficeKitEditor(editor)) {
        options = editor;
        editor = null;
    }
    var sourceEditor = isSyncfusionOfficeKitEditor(editor) ? editor : getSyncfusionOfficeKitBlobEditor(docxBlob);
    if (sourceEditor) {
        return createSyncfusionOfficeKitPdfBase64(sourceEditor, options);
    }
    if (!docxBlob) {
        return Promise.reject(new Error("Không có dữ liệu DOCX để chuyển."));
    }

    return withSyncfusionOfficeKitHiddenEditor(docxBlob, function (hiddenEditor) {
        return createSyncfusionOfficeKitPdfBase64(hiddenEditor, options);
    });
}

function createSyncfusionOfficeKitPdfBase64(editor, options) {
    return createSyncfusionOfficeKitPdfBlob(editor, options).then(readSyncfusionOfficeKitBlobBase64);
}

/**
 * Tao PDF (Blob) tu bo soan: ve tuan tu tung trang, nhuong luong giua cac trang de trang web khong bi treo
 * voi van ban dai. Tu 5 trang tro len hien tien trinh (hoac goi options.onProgress).
 */
function createSyncfusionOfficeKitPdfBlob(editor, options) {
    options = options || {};
    if (!canCreateSyncfusionOfficeKitPdf(editor)) {
        return Promise.reject(new Error("Trình duyệt chưa sẵn sàng để tạo PDF."));
    }

    var pdf = ej.pdfexport;
    var helper = editor.documentHelper;
    var pages = (helper.pages || []).slice();
    if (!pages.length) {
        return Promise.reject(new Error("Văn bản không có trang nào để tạo PDF."));
    }

    var dpi = Math.max(72, Math.min(600, Number(options.dpi) || syncfusionOfficeKitPdfOptions.dpi));
    var quality = Math.max(0.3, Math.min(1, Number(options.jpegQuality) || syncfusionOfficeKitPdfOptions.jpegQuality));
    var onProgress = typeof options.onProgress === "function"
        ? options.onProgress
        : (pages.length >= 5 && options.silent !== true ? showSyncfusionOfficeKitPdfProgress : null);
    var settings = editor.documentEditorSettings;
    var previousRatio = settings ? settings.printDevicePixelRatio : null;
    var pdfDocument = new pdf.PdfDocument();
    var current = { section: null, width: 0, height: 0 };
    var index = 0;

    // Bo ve trang khi in dung ti le max(devicePixelRatio, printDevicePixelRatio): dat tam ti le cho ~dpi.
    if (settings) {
        settings.printDevicePixelRatio = dpi / 96;
    }
    var restore = function () {
        if (settings && settings.printDevicePixelRatio !== previousRatio) {
            settings.printDevicePixelRatio = previousRatio;
        }
        releaseSyncfusionOfficeKitPageCanvas(helper.render);
    };

    return new Promise(function (resolve, reject) {
        var fail = function (error) {
            restore();
            try {
                pdfDocument.destroy();
            } catch (destroyError) {
                // Da huy.
            }
            reject(error);
        };
        var next = function () {
            if (index >= pages.length) {
                restore();
                Promise.resolve(pdfDocument.save()).then(function (result) {
                    try {
                        pdfDocument.destroy();
                    } catch (destroyError) {
                        // Da huy.
                    }
                    if (!result || !result.blobData) {
                        reject(new Error("Không tạo được PDF."));
                        return;
                    }
                    resolve(result.blobData);
                }, fail);
                return;
            }

            renderSyncfusionOfficeKitPageJpeg(editor, pages[index], quality, options.ink === true).then(function (image) {
                addSyncfusionOfficeKitPdfPage(pdf, pdfDocument, current, image);
                index += 1;
                if (onProgress) {
                    try {
                        onProgress(index, pages.length);
                    } catch (progressError) {
                        console.warn("Office kit PDF progress:", progressError);
                    }
                }
                setTimeout(next, 0);
            }).catch(fail);
        };
        next();
    });
}

function renderSyncfusionOfficeKitPageJpeg(editor, page, quality, ink) {
    var canvas;
    try {
        canvas = drawSyncfusionOfficeKitPrintPage(editor, page, ink);
    } catch (error) {
        return Promise.reject(error);
    }

    var size = getSyncfusionOfficeKitPageSizePt(page);
    return syncfusionOfficeKitCanvasToJpegBase64(canvas, quality).then(function (base64) {
        return { base64: base64, width: size.width, height: size.height, pixelWidth: canvas.width, pixelHeight: canvas.height };
    });
}

// Ve mot trang bang bo ve trang khi in cua Syncfusion (ti le theo printDevicePixelRatio), tra ve canvas dung chung.
function drawSyncfusionOfficeKitPrintPage(editor, page, ink) {
    var render = editor.documentHelper.render;
    try {
        render.isPrinting = true;
        render.renderWidgets(page, 0, 0, 0, 0);
        var canvas = render.pageCanvas;
        if (ink) {
            darkenWordKitPrintCanvas(canvas);
        }
        return canvas;
    } finally {
        render.isPrinting = false;
    }
}

// Kho trang theo pt (1 px CSS = 0.75 pt).
function getSyncfusionOfficeKitPageSizePt(page) {
    var bounds = page.boundingRectangle;
    return {
        width: Math.round(bounds.width * 0.75 * 100) / 100,
        height: Math.round(bounds.height * 0.75 * 100) / 100,
    };
}

// Canvas -> JPEG base64. toBlob nen anh ngoai luong chinh (khong khung trang); trinh duyet khong co thi dung toDataURL.
function syncfusionOfficeKitCanvasToJpegBase64(canvas, quality) {
    return new Promise(function (resolve, reject) {
        var fromDataUrl = function () {
            try {
                resolve(String(canvas.toDataURL("image/jpeg", quality)).split(",")[1] || "");
            } catch (error) {
                reject(error);
            }
        };
        if (typeof canvas.toBlob !== "function" || typeof FileReader !== "function") {
            fromDataUrl();
            return;
        }
        canvas.toBlob(function (blob) {
            if (!blob) {
                fromDataUrl();
                return;
            }
            readSyncfusionOfficeKitBlobBase64(blob).then(resolve, reject);
        }, "image/jpeg", quality);
    });
}

// Moi trang mot anh phu kin trang; trang lien nhau cung kho giay dung chung mot section cua PDF.
function addSyncfusionOfficeKitPdfPage(pdf, pdfDocument, current, image) {
    if (!current.section || Math.abs(current.width - image.width) > 0.5 || Math.abs(current.height - image.height) > 0.5) {
        var section = pdfDocument.sections.add();
        var pageSettings = new pdf.PdfPageSettings(0);
        // Dat huong truoc kho giay: PdfPageSettings tu doi chieu rong/cao theo huong.
        pageSettings.orientation = image.width > image.height ? pdf.PdfPageOrientation.Landscape : pdf.PdfPageOrientation.Portrait;
        pageSettings.size = new pdf.SizeF(image.width, image.height);
        section.setPageSettings(pageSettings);
        current.section = section;
        current.width = image.width;
        current.height = image.height;
    }
    var page = current.section.pages.add();
    page.graphics.drawImage(new pdf.PdfBitmap(image.base64), 0, 0, image.width, image.height);
}

// Canvas ve trang khi in rat lon (vai chuc trieu diem): thu nho lai sau khi dung de tra bo nho.
function releaseSyncfusionOfficeKitPageCanvas(render) {
    if (!render) {
        return;
    }
    try {
        render.isPrinting = true;
        var canvas = render.pageCanvas;
        if (canvas && canvas.width * canvas.height > 4000000) {
            canvas.width = 1;
            canvas.height = 1;
        }
    } catch (error) {
        // Chi la giai phong bo nho.
    } finally {
        render.isPrinting = false;
    }
}

function showSyncfusionOfficeKitPdfProgress(done, total) {
    if (typeof showWordKitToast === "function") {
        showWordKitToast(done < total ? "Đang tạo PDF: " + done + "/" + total + " trang…" : "Đã tạo PDF " + total + " trang.");
    }
}

function readSyncfusionOfficeKitBlobBase64(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            var result = String(reader.result || "");
            resolve(result.slice(result.indexOf(",") + 1));
        };
        reader.onerror = function () {
            reject(reader.error || new Error("Không đọc được dữ liệu."));
        };
        reader.readAsDataURL(blob);
    });
}

function readSyncfusionOfficeKitBlobText(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            resolve(String(reader.result || ""));
        };
        reader.onerror = function () {
            reject(reader.error || new Error("Không đọc được dữ liệu."));
        };
        reader.readAsText(blob);
    });
}

// Blob la SFDT thi mo thang; DOCX/RTF/DOC thi doi sang SFDT qua dich vu mo file (cung duong voi "Mo file").
function readSyncfusionOfficeKitBlobAsSfdt(blob) {
    return readSyncfusionOfficeKitBlobText(blob.slice(0, 16)).then(function (head) {
        var isRtf = /^\s*\{\\rtf/.test(head);
        if (!isRtf && /^\s*\{/.test(head)) {
            return readSyncfusionOfficeKitBlobText(blob);
        }

        var fileName = String(blob.name || "") || (isRtf ? "van-ban.rtf" : "van-ban.docx");
        return new Promise(function (resolve, reject) {
            var formData = new FormData();
            formData.append("files", blob, fileName);
            formData.append("document_editor_service_url", syncfusionOfficeKitDocumentServiceUrl);
            var request = new XMLHttpRequest();
            request.open("POST", window.syncfusionOfficeKitImportUrl || (window.location.origin + "/api/documenteditor/import-vinbs"), true);
            request.onload = function () {
                if (request.status >= 200 && request.status < 300 && isSyncfusionOfficeKitSfdtText(request.responseText)) {
                    resolve(request.responseText);
                    return;
                }
                reject(new Error("Không mở được tệp để tạo PDF (HTTP " + request.status + ")."));
            };
            request.onerror = function () {
                reject(new Error("Không kết nối được dịch vụ mở tệp."));
            };
            request.send(formData);
        });
    });
}

// Anh trong SFDT nap san vao bo nho dem cua trinh duyet -> bo soan an ve duoc anh ngay, khong bi thieu anh.
function preloadSyncfusionOfficeKitImages(sfdtText) {
    var sources = [];
    var pattern = /"(data:image\/[a-z+.\-]+;base64,[A-Za-z0-9+\/=\\]+)"/gi;
    var match;
    while ((match = pattern.exec(sfdtText)) !== null && sources.length < 200) {
        sources.push(match[1].replace(/\\\//g, "/"));
    }
    var images = sources.map(function (source) {
        var image = new Image();
        image.src = source;
        return image;
    });
    var pending = images.filter(function (image) {
        return !image.complete;
    });
    if (!pending.length) {
        return Promise.resolve(images);
    }
    return new Promise(function (resolve) {
        var left = pending.length;
        var timer = setTimeout(function () {
            resolve(images);
        }, 3000);
        var done = function () {
            left -= 1;
            if (left <= 0) {
                clearTimeout(timer);
                resolve(images);
            }
        };
        pending.forEach(function (image) {
            image.addEventListener("load", done);
            image.addEventListener("error", done);
        });
    });
}

function withSyncfusionOfficeKitHiddenEditor(blob, work) {
    return readSyncfusionOfficeKitBlobAsSfdt(blob).then(function (sfdtText) {
        return preloadSyncfusionOfficeKitImages(sfdtText).then(function (images) {
            var host = document.createElement("div");
            host.setAttribute("aria-hidden", "true");
            host.style.cssText = "position:fixed;left:-30000px;top:0;width:1000px;height:800px;overflow:hidden;pointer-events:none;";
            document.body.appendChild(host);
            var hiddenEditor = null;
            var cleanup = function () {
                try {
                    if (hiddenEditor) {
                        hiddenEditor.destroy();
                    }
                } catch (error) {
                    console.warn("Office kit hidden editor destroy:", error);
                }
                if (host.parentNode) {
                    host.parentNode.removeChild(host);
                }
                images.length = 0;
            };

            try {
                hiddenEditor = new ej.documenteditor.DocumentEditor({
                    isReadOnly: true,
                    enablePrint: true,
                    enableSfdtExport: true,
                    width: "1000px",
                    height: "800px",
                });
                hiddenEditor.appendTo(host);
                hiddenEditor.open(chuanHoaTenPhongSfdtWordKit(sfdtText));
            } catch (error) {
                cleanup();
                return Promise.reject(error);
            }

            return new Promise(function (resolve) {
                setTimeout(resolve, 50);
            }).then(function () {
                return work(hiddenEditor);
            }).then(function (result) {
                cleanup();
                return result;
            }, function (error) {
                cleanup();
                throw error;
            });
        });
    });
}

function getSyncfusionOfficeKitPdfBase64FromResponse(responseText) {
    var text = String(responseText || "").trim();
    if (!text) {
        return "";
    }

    try {
        var parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
            return String(parsed.data || parsed.pdf || parsed.file || "").replace(/^data:application\/pdf;base64,/i, "").trim();
        }
        if (typeof parsed === "string") {
            return parsed.replace(/^data:application\/pdf;base64,/i, "").trim();
        }
    } catch (error) {
        // Some legacy endpoints return raw base64 instead of JSON.
    }

    return text.replace(/^data:application\/pdf;base64,/i, "").replace(/^"|"$/g, "").trim();
}

function printSyncfusionOfficeKitPdfBase64(pdfBase64) {
    if (typeof printJS === "function") {
        printJS({ printable: pdfBase64, type: "pdf", base64: true });
        return;
    }

    var byteCharacters = atob(pdfBase64);
    var byteNumbers = new Array(byteCharacters.length);
    for (var index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index);
    }

    var pdfBlob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
    var pdfUrl = URL.createObjectURL(pdfBlob);
    var iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.onload = function () {
        setTimeout(function () {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } finally {
                setTimeout(function () {
                    URL.revokeObjectURL(pdfUrl);
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 30000);
            }
        }, 200);
    };
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
}

function printSyncfusionOfficeKitDirect(editor, silent) {
    if (!editor) {
        return false;
    }

    if (editor.focusIn) {
        editor.focusIn();
    }

    try {
        if (typeof editor.print === "function") {
            withWordKitPrintInk(function () {
                editor.print();
            });
            return true;
        }
    } catch (error) {
        console.warn("Syncfusion Office kit editor.print failed:", error);
    }

    try {
        if (editor.printModule && typeof editor.printModule.print === "function") {
            editor.printModule.print();
            return true;
        }
    } catch (error) {
        console.warn("Syncfusion Office kit printModule failed:", error);
    }

    if (!silent) {
        alert("Khong in duoc van ban. Vui long tai lai trang hoac thu lai sau.");
    }
    return false;
}

function onPrint() {
    printSyncfusionOfficeKitDocument(container, container && container.documentEditor ? container.documentEditor : null);
}

function saveToMediaFileKy(yeucau_id, hopdong_id, hopdong_ten) {
    ensureDocumentExportQr(container.documentEditor).then(function () {
        return container.documentEditor.saveAsBlob("Docx");
    }).then(function (blob) {
        const formData = new FormData();
        formData.append("file", blob, "hopdong.docx");
        formData.append("yeucau_id", yeucau_id);
        formData.append("hopdong_id", hopdong_id);
        formData.append("hopdong_ten", hopdong_ten);

        fetch("/hopdong_yeucau/store", {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
            },
            body: formData,
        }).then(async (response) => {
            try {
                const data = await response.json();
                if (data.success) {
                    Swal.fire({ icon: "success", title: "Thành công", text: "Đã lưu file tại: " + data.path, showConfirmButton: false, timer: 2500 });
                } else {
                    Swal.fire({ icon: "error", title: "Lỗi", text: data.error || "Đã xảy ra lỗi không xác định!", showConfirmButton: true });
                }
            } catch (e) {
                const text = await response.text();
                console.error("Không thể parse JSON. Response là:", text);
                alert("Phản hồi không hợp lệ từ server.");
            }
        });
    });
}

function onExportClick(args) {
    var value = args.item.id;
    if (value === "word") {
        save("Docx");
    }
}

function save(format) {
    ensureDocumentExportQr(container.documentEditor).then(function () {
        container.documentEditor.save(
            getDocumentDownloadName(),
            format
        );
    });
}

function getDocumentDownloadName() {
    var name = String(container.documentEditor.documentName || "").trim();
    var lowerName = name.toLowerCase();
    if (!name || lowerName === "simple" || lowerName === "sample" || lowerName === "untitled" || lowerName === "great-manager") {
        return "vinbs";
    }

    return name;
}

function setTooltipForPopup() {
    document.querySelectorAll("#documenteditor-share-popup li")[0].setAttribute("title", "Download a copy of this document to your computer as a DOCX file.");
    document.querySelectorAll("#documenteditor-share-popup li")[1].setAttribute("title", "Download a copy of this document to your computer as an SFDT file.");
}

function addButton(iconClass, btnText, styles, id, tooltipText, isDropDown, items) {
    var button = ej.base.createElement("button", { id: id, styles: styles });
    titleBarDiv.appendChild(button);
    button.setAttribute("title", tooltipText);
    if (isDropDown) {
        return new ej.splitbuttons.DropDownButton({ select: onExportClick, items: items, iconCss: iconClass, cssClass: "e-caret-hide", content: btnText, open: setTooltipForPopup }, button);
    } else {
        return new ej.buttons.Button({ iconCss: iconClass, content: btnText }, button);
    }
}
