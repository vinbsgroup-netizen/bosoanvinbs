<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Bản quyền vi-sos cho bộ soạn
    |--------------------------------------------------------------------------
    |
    | Khách gửi token bản quyền của văn phòng (lấy từ vi-sos) trong header Authorization.
    | Token phải được ký bằng khóa riêng của sản phẩm trên vi-sos, và gói phải có chức năng "bo_soan".
    |
    */
    'product' => env('LICENSE_PRODUCT', 'vinbs'),

    'issuer' => env('LICENSE_ISSUER', 'vi-sos.com'),

    'chuc_nang' => 'bo_soan',

    /*
    | Public key RS256 của sản phẩm (không phải bí mật). Ghi trên một dòng với "\n" thay cho xuống dòng.
    */
    'public_key' => env('LICENSE_PUBLIC_KEY'),

    /*
    | Sản phẩm vi-sos khác được dùng bộ soạn (ví dụ phần mềm "dotary"), mỗi sản phẩm ký token bằng khóa riêng.
    | Khai báo LICENSE_SAN_PHAM_KHAC=dotary và LICENSE_PUBLIC_KEY_DOTARY=... (cùng định dạng LICENSE_PUBLIC_KEY).
    | Gói của văn phòng trên vi-sos vẫn phải có chức năng "bo_soan".
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
