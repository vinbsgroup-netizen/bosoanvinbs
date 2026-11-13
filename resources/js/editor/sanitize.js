/**
 * Làm sạch cây JSON của TipTap trước khi nạp. TipTap bỏ qua cả tài liệu nếu gặp một nút
 * văn bản có text không phải chuỗi (ví dụ null), nên các nút đó được loại bỏ.
 * @param {object} node
 * @returns {object}
 */
export const sanitizeDocument = (node) => {
    if (!node || typeof node !== 'object') {
        return node;
    }

    if (node.type === 'text') {
        return typeof node.text === 'string' && node.text !== '' ? node : null;
    }

    if (!Array.isArray(node.content)) {
        return node;
    }

    const content = node.content.map(sanitizeDocument).filter(Boolean);
    return { ...node, content };
};
