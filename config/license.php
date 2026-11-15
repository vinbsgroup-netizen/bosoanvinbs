<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Bản quyền vi-sos cho bộ soạn
    |--------------------------------------------------------------------------
    |
    | Khách gửi token bản quyền của văn phòng (lấy từ vi-sos) trong header Authorization.
    | Token phải được ký bằng khóa riêng của sản phẩm trên vi-sos, và gói phải có chức năng "bo_soan".
    | Public key của sản phẩm được lấy tự động từ vi-sos theo claim "aud": không cần khai báo gì trong .env.
    |
    */
    'may_chu' => rtrim((string) env('LICENSE_SERVER_URL', 'https://vi-sos.com'), '/'),

    'product' => env('LICENSE_PRODUCT', 'vinbs'),

    'issuer' => env('LICENSE_ISSUER', 'vi-sos.com'),

    'chuc_nang' => 'bo_soan',

    /*
    | Không bắt buộc: ghim sẵn public key RS256 của sản phẩm chính thay cho lấy từ vi-sos.
    | Ghi trên một dòng với "\n" thay cho xuống dòng.
    */
    'public_key' => env('LICENSE_PUBLIC_KEY'),

    /*
    | Không bắt buộc: ghim sẵn public key của sản phẩm khác (LICENSE_SAN_PHAM_KHAC=dotary,
    | LICENSE_PUBLIC_KEY_DOTARY=...). Bỏ trống thì khóa được lấy từ vi-sos.
    */
    'san_pham_khac' => array_reduce(
        array_filter(array_map('trim', explode(',', (string) env('LICENSE_SAN_PHAM_KHAC', '')))),
        function (array $danhSach, string $maSanPham): array {
            $danhSach[$maSanPham] = env('LICENSE_PUBLIC_KEY_'.strtoupper(str_replace('-', '_', $maSanPham)));

            return $danhSach;
        },
        [],
    ),

    'leeway' => (int) env('LICENSE_LEEWAY', 60),

];
