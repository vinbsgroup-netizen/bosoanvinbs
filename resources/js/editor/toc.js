/**
 * Mục lục: lấy tiêu đề cấp 1 đến 3 trong văn bản. Đoạn mục lục được đánh dấu để cập nhật lại sau này.
 */
export const updateToc = (editor, { insertIfMissing, maxLevel = 3 }) => {
    const { state } = editor;
    const headings = [];
    const existing = [];
    state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && node.attrs.level <= maxLevel) {
            headings.push({ level: node.attrs.level, text: node.textContent });
        }
        if (node.type.name === 'paragraph' && node.attrs.tocEntry) {
            existing.push({ from: pos, to: pos + node.nodeSize });
        }
        return true;
    });
    if (existing.length === 0 && !insertIfMissing) return;

    const entries = headings.map((heading) =>
        state.schema.nodes.paragraph.create(
            { textAlign: 'left', indentLeft: (heading.level - 1) * 567, tocEntry: true },
            heading.text ? state.schema.text(heading.text) : null,
        ),
    );
    const insertAt = existing.length > 0 ? existing[0].from : state.selection.$from.after();
    const tr = state.tr;
    [...existing].reverse().forEach(({ from, to }) => tr.delete(from, to));
    if (entries.length > 0) {
        tr.insert(tr.mapping.map(insertAt), entries);
    }
    editor.view.dispatch(tr);
};
