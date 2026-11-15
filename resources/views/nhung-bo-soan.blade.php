{{-- Trả về dạng JavaScript (xem NhungBoSoanController). --}}
/*
 * Bộ soạn bo-soan (Office kit Syncfusion) nhúng vào trang khác.
 *
 * Đặt <script src="https://<bo-soan>/api/nhung"></script> ngay sau phần tử #container (và #documenteditor_titlebar nếu có).
 * Script kế tiếp của trang đã dùng được window.container.documentEditor.
 *
 * Mở file gọi dịch vụ của bo-soan, trừ khi trang đã tự đặt
 * window.syncfusionOfficeKitDocumentServiceUrl hoặc window.syncfusionOfficeKitImportUrl.
 * In, tạo PDF và dán giữ định dạng chạy ngay trên trình duyệt. QR và logo vẫn gọi api/document-export-* của chính trang nhúng.
 */
(function () {
    var phienBan = @json($phienBan);
    // Địa chỉ bo-soan lấy từ chính thẻ script, nên đúng http/https mà trang nhúng đã dùng.
    var goc = new URL(document.currentScript.src, location.href).origin;

    function duongDan(tep) {
        return goc + '/office-kit/' + tep + '?v=' + phienBan[tep];
    }

    function css(tep) {
        return '<link rel="stylesheet" href="' + duongDan(tep) + '">';
    }

    function js(tep) {
        return '<script src="' + duongDan(tep) + '"><\/script>';
    }

    window.syncfusionOfficeKitDocumentServiceUrl = window.syncfusionOfficeKitDocumentServiceUrl || goc + '/api/documenteditor/';
    window.syncfusionOfficeKitImportUrl = window.syncfusionOfficeKitImportUrl || goc + '/api/documenteditor/import-vinbs';

    // Trang nhúng đã có print-js thì giữ bản của trang.
    var inPdf = window.printJS ? '' : css('print.min.css') + js('print.min.js');

    // document.write để các file chạy lần lượt ngay tại chỗ, xong trước script kế tiếp của trang.
    document.write(css('material.css') + css('index.css') + inPdf + js('ej2.min.js') + js('office-kit.js') + js('bo-soan.js'));
})();
