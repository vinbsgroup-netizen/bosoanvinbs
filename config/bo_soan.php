<?php

return [

    /*
    | Thời gian (phút) giữ nội dung phiên soạn trong cache.
    */
    'thoi_gian_phien' => (int) env('BO_SOAN_THOI_GIAN_PHIEN', 120),

    /*
    | Dịch vụ .NET Syncfusion DocumentEditor (Import, SystemClipboard...). Bộ soạn Office kit gọi
    | /api/documenteditor/* của bo-soan, bo-soan chuyển tiếp sang đây. Kết thúc bằng dấu "/".
    */
    'dich_vu_syncfusion' => rtrim((string) env('BO_SOAN_DICH_VU_SYNCFUSION', 'http://vi-sos.com:85/api/documenteditor/'), '/').'/',

    /*
    | Dịch vụ DocToPDF: nhận file DOCX (trường "file"), trả nội dung PDF dạng base64. Dùng cho In và xuất PDF.
    */
    'doc_to_pdf' => (string) env('BO_SOAN_DOC_TO_PDF', 'http://vi-sos.com:86/api/documenteditorservice/DocToPDF'),

    /*
    | Giới hạn kích thước file Word tải lên để mở (KB).
    */
    'kich_thuoc_file_toi_da' => (int) env('BO_SOAN_KICH_THUOC_FILE_TOI_DA', 20480),

];
