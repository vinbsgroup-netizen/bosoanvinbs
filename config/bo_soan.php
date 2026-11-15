<?php

return [

    /*
    | Thời gian (phút) giữ nội dung phiên soạn trong cache.
    */
    'thoi_gian_phien' => (int) env('BO_SOAN_THOI_GIAN_PHIEN', 120),

    /*
    | Giới hạn kích thước file Word tải lên để mở (KB).
    */
    'kich_thuoc_file_toi_da' => (int) env('BO_SOAN_KICH_THUOC_FILE_TOI_DA', 20480),

];
