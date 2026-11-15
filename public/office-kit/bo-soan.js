/*
 * Điều chỉnh của bo-soan cho Office kit, chạy ngay sau office-kit.js (api/nhung nạp file này).
 * Dùng chung cho trang soạn của bo-soan và các phần mềm nhúng bộ soạn, nên sửa ở đây là mọi nơi cùng nhận.
 * Các file Office kit khác giữ nguyên như bản của hợp đồng V2 để có thể chép đè khi cập nhật.
 */
(function () {
    if (!window.container || !window.container.documentEditor) {
        return;
    }

    // Office kit đặt pageOutline = "FF000" (mã màu sai nên canvas vẽ viền đen quanh trang). Bỏ khung trang.
    container.documentEditor.pageOutline = 'transparent';

    // "Mở file Word" của Office kit chỉ lọc .doc, .docx, .sfdt; dịch vụ mở file của bo-soan nhận cả RTF và văn bản thuần (.txt).
    if (typeof getSyncfusionOfficeKitImportInput === 'function') {
        getSyncfusionOfficeKitImportInput().accept = '.doc,.docx,.rtf,.txt,.sfdt,application/msword,'
            + 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,application/json';
    }
})();
