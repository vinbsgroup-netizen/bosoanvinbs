<?php

namespace App\Models;

use Database\Factories\CauHinhKhachFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Cấu hình bộ soạn riêng của từng khách hàng, khóa theo tên khách trong config bo_soan.khach.
 *
 * @property int $id
 * @property string $ten_khach
 * @property string|null $url_dich_vu
 */
class CauHinhKhach extends Model
{
    /** @use HasFactory<CauHinhKhachFactory> */
    use HasFactory;

    protected $fillable = ['ten_khach', 'url_dich_vu'];
}
