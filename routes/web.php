<?php

use App\Http\Controllers\SoanController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'office-kit', ['phien' => null])->name('editor');

Route::get('/soan/{ma}', [SoanController::class, 'show'])->name('phien-soan.mo');
Route::post('/soan/{ma}/ket-qua', [SoanController::class, 'luuKetQua'])->name('phien-soan.ket-qua');
