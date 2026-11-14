<?php

namespace App\Models;

use Database\Factories\CauHinhKhachFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Cấu hình bộ soạn riêng của từng giấy phép, khóa theo mã giấy phép vi-sos (claim sub của token).
 *
 * @property int $id
 * @property string $ma_giay_phep
 * @property string|null $url_dich_vu
 */
class CauHinhKhach extends Model
{
    /** @use HasFactory<CauHinhKhachFactory> */
    use HasFactory;

    protected $fillable = ['ma_giay_phep', 'url_dich_vu'];
}
