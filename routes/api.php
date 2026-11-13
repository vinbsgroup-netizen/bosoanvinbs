<?php

use App\Http\Controllers\Api\CauHinhController;
use App\Http\Controllers\Api\PhienSoanController;
use App\Http\Middleware\XacThucKhach;
use Illuminate\Support\Facades\Route;

Route::middleware(XacThucKhach::class)->prefix('v1')->group(function () {
    Route::post('/phien-soan', [PhienSoanController::class, 'store'])->name('api.phien-soan.store');
    Route::get('/phien-soan/{ma}', [PhienSoanController::class, 'show'])->name('api.phien-soan.show');
    Route::delete('/phien-soan/{ma}', [PhienSoanController::class, 'destroy'])->name('api.phien-soan.destroy');

    Route::get('/cau-hinh', [CauHinhController::class, 'show'])->name('api.cau-hinh.show');
    Route::put('/cau-hinh', [CauHinhController::class, 'update'])->name('api.cau-hinh.update');
});
