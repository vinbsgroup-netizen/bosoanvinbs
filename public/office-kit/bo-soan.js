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

    /*
     * Đặt chiều cao bộ soạn vừa khít một khung. Office kit đặt ribbon và thước ngang bên trong #container, phía trên
     * vùng soạn (.e-de-ctn), nhưng vùng soạn vẫn lấy đủ container.height: bộ soạn cao hơn khung đúng bằng ribbon + thước,
     * thanh trạng thái bị khuất. Syncfusion còn trừ chiều cao thanh công cụ gốc (Office kit đã ẩn), nên bù phần trống đó.
     * Ribbon thu gọn hay mở rộng thì tự tính lại.
     */
    window.boSoanVuaKhung = function (chieuCaoKhung) {
        var khung = container.element;
        window.boSoanVuaKhung.khung = chieuCaoKhung;
        container.height = chieuCaoKhung + 'px';
        khung.style.overflow = 'hidden';

        var vungSoan = khung.querySelector('.e-de-ctn');
        if (vungSoan) {
            var phanTren = Math.max(0, vungSoan.getBoundingClientRect().top - khung.getBoundingClientRect().top);
            var cao = Math.max(300, chieuCaoKhung - phanTren);
            vungSoan.style.height = cao + 'px';
            container.resize();

            var thanhTrangThai = khung.querySelector('.e-de-status-bar');
            if (thanhTrangThai) {
                var trong = Math.round(khung.getBoundingClientRect().top + chieuCaoKhung - thanhTrangThai.getBoundingClientRect().bottom);
                if (Math.abs(trong) > 1) {
                    vungSoan.style.height = Math.max(300, cao + trong) + 'px';
                    container.resize();
                }
            }
        }

        var ribbon = document.getElementById('syncfusion-office-kit-ribbon');
        if (ribbon && window.ResizeObserver && !window.boSoanVuaKhung.dangTheoDoi) {
            window.boSoanVuaKhung.dangTheoDoi = true;
            var caoRibbon = ribbon.offsetHeight;
            new ResizeObserver(function () {
                if (ribbon.offsetHeight !== caoRibbon) {
                    caoRibbon = ribbon.offsetHeight;
                    window.boSoanVuaKhung(window.boSoanVuaKhung.khung);
                }
            }).observe(ribbon);
        }
    };

    // "Mở file Word" của Office kit chỉ lọc .doc, .docx, .sfdt; dịch vụ mở file của bo-soan nhận cả RTF và văn bản thuần (.txt).
    if (typeof getSyncfusionOfficeKitImportInput === 'function') {
        getSyncfusionOfficeKitImportInput().accept = '.doc,.docx,.rtf,.txt,.sfdt,application/msword,'
            + 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,application/json';
    }
})();
