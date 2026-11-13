<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Khách hàng được phép gọi API
    |--------------------------------------------------------------------------
    |
    | Định dạng biến môi trường BO_SOAN_KHACH: "ten_khach:khoa_api,ten_khach2:khoa_api2".
    | Máy chủ chỉ giữ khóa; không lưu văn bản.
    |
    */
    'khach' => array_filter(array_map(function (string $cap): ?array {
        [$ten, $khoa] = array_pad(explode(':', $cap, 2), 2, null);

        return $ten && $khoa ? ['ten' => trim($ten), 'khoa' => trim($khoa)] : null;
    }, explode(',', (string) env('BO_SOAN_KHACH', '')))),

    /*
    | Thời gian (phút) giữ nội dung phiên soạn trong cache.
    */
    'thoi_gian_phien' => (int) env('BO_SOAN_THOI_GIAN_PHIEN', 120),

];
