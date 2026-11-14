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

    'leeway' => (int) env('LICENSE_LEEWAY', 60),

];
