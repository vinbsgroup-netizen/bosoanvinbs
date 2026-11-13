<?php

namespace App\Http\Resources;

use App\Models\CauHinhKhach;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CauHinhKhach
 */
class CauHinhKhachResource extends JsonResource
{
    /** Trả về object phẳng như các API khác của bo-soan, không bọc trong "data". */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array{ten_khach: string, url_dich_vu: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            'ten_khach' => $this->ten_khach,
            'url_dich_vu' => $this->url_dich_vu,
        ];
    }
}
