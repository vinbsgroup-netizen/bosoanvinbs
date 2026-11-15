<?php

use App\Http\Controllers\Api\CauHinhController;
use App\Http\Controllers\Api\DichVuSoanThaoController;
use App\Http\Controllers\Api\PhienSoanController;
use App\Http\Middleware\XacThucBanQuyen;
use Illuminate\Support\Facades\Route;

Route::middleware(XacThucBanQuyen::class)->prefix('v1')->group(function () {
    Route::post('/phien-soan', [PhienSoanController::class, 'store'])->name('api.phien-soan.store');
    Route::get('/phien-soan/{ma}', [PhienSoanController::class, 'show'])->name('api.phien-soan.show');
    Route::delete('/phien-soan/{ma}', [PhienSoanController::class, 'destroy'])->name('api.phien-soan.destroy');

    Route::get('/cau-hinh', [CauHinhController::class, 'show'])->name('api.cau-hinh.show');
    Route::put('/cau-hinh', [CauHinhController::class, 'update'])->name('api.cau-hinh.update');
});

/*
 * Dịch vụ cho bộ soạn Office kit (Syncfusion), cùng dạng địa chỉ với dịch vụ .NET (.../api/documenteditor/),
 * nên phần mềm khách có thể đặt url_dich_vu = https://<bo-soan>/api/documenteditor/.
 */
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/documenteditor/Import', [DichVuSoanThaoController::class, 'nhapFile'])->name('api.soan-thao.import');
    Route::post('/documenteditor/import-vinbs', [DichVuSoanThaoController::class, 'nhapFile'])->name('api.soan-thao.import-vinbs');
    Route::post('/documenteditor/{hanhDong}', [DichVuSoanThaoController::class, 'chuyenTiep'])
        ->whereIn('hanhDong', DichVuSoanThaoController::HANH_DONG_JSON)
        ->name('api.soan-thao.chuyen-tiep');
    Route::post('/get-file', [DichVuSoanThaoController::class, 'docxSangPdf'])->name('api.soan-thao.pdf');
});
