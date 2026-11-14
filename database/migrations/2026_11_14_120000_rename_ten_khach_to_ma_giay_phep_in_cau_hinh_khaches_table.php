<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Khóa cấu hình theo mã giấy phép vi-sos (claim "sub") thay vì tên khách, vì tên có thể trùng.
     */
    public function up(): void
    {
        Schema::table('cau_hinh_khaches', function (Blueprint $table) {
            $table->renameColumn('ten_khach', 'ma_giay_phep');
        });
    }

    public function down(): void
    {
        Schema::table('cau_hinh_khaches', function (Blueprint $table) {
            $table->renameColumn('ma_giay_phep', 'ten_khach');
        });
    }
};
