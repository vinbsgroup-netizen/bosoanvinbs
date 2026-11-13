/* Trích từ demo1 (giao diện menu do đội tự chỉnh). */
export var wordKitIcons = {
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

export function buildWordKitRibbonHtml() {
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
        '<button type="button" class="wk-bar-btn" data-office-kit-command="print" title="In (Ctrl+P)">' + wkIcon("print") + "<span>In</span></button>",
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


export function buildWordKitMiniHtml(fontColorGlyph, highlightGlyph) {
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

