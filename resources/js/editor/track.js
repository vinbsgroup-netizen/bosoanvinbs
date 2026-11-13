import { Extension, Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Theo dõi thay đổi: chữ chèn mới được đánh dấu. Có thể chấp nhận hoặc từ chối từng loạt.
 * Phạm vi hiện tại: ghi nhận chữ chèn; xóa chữ chưa được ghi nhận dưới dạng gạch ngang.
 */
export const InsertionMark = Mark.create({
    name: 'insertion',
    parseHTML() {
        return [{ tag: 'ins[data-insertion]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['ins', { ...HTMLAttributes, 'data-insertion': 'true', class: 'bs-insertion' }, 0];
    },
});

const trackKey = new PluginKey('trackChanges');
export const trackState = { enabled: false };

export const TrackChanges = Extension.create({
    name: 'trackChanges',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: trackKey,
                appendTransaction(transactions, oldState, newState) {
                    if (!trackState.enabled) return null;
                    if (!transactions.some((tr) => tr.docChanged)) return null;
                    if (transactions.some((tr) => tr.getMeta('trackSkip'))) return null;
                    const markType = newState.schema.marks.insertion;
                    if (!markType) return null;
                    const tr = newState.tr;
                    transactions.forEach((transaction) => {
                        if (!transaction.docChanged || transaction.getMeta('history$')) return;
                        transaction.steps.forEach((step, index) => {
                            step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
                                if (newEnd > newStart) {
                                    if (newEnd > newStart && newEnd <= tr.doc.content.size) {
                                        tr.addMark(newStart, newEnd, markType.create());
                                    }
                                }
                            });
                        });
                    });
                    tr.setMeta('trackSkip', true);
                    return tr.docChanged ? tr : null;
                },
            }),
        ];
    },
    addCommands() {
        return {
            acceptChanges:
                () =>
                ({ tr, state, dispatch }) => {
                    state.doc.descendants((node, pos) => {
                        if (node.isText && node.marks.some((m) => m.type.name === 'insertion')) {
                            tr.removeMark(pos, pos + node.nodeSize, state.schema.marks.insertion);
                        }
                    });
                    if (dispatch) dispatch(tr);
                    return true;
                },
            rejectChanges:
                () =>
                ({ tr, state, dispatch }) => {
                    const ranges = [];
                    state.doc.descendants((node, pos) => {
                        if (node.isText && node.marks.some((m) => m.type.name === 'insertion')) {
                            ranges.push({ from: pos, to: pos + node.nodeSize });
                        }
                    });
                    ranges.reverse().forEach(({ from, to }) => tr.delete(from, to));
                    if (dispatch) dispatch(tr);
                    return true;
                },
        };
    },
});
