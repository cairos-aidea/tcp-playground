<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TimeChargeController;
use App\Http\Controllers\Microsoft\LoginController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return view('welcome');
// });

// Login Routes
// Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
// Route::post('/login', [AuthController::class, 'login']);

// Logout Route
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/excel_parser', [TimeChargeController::class, 'excel_parser'])->name('excel_parser');
Route::get('/employees_parser', [TimeChargeController::class, 'employees_parser'])->name('employees_parser');

Route::prefix('api/ms')->group(function () {
    Route::post('/login', [LoginController::class, 'login'])->name('ms.login');
    Route::get('/login/callback', [LoginController::class, 'callback'])->name('ms.callback');
    Route::post('/login/validate', [LoginController::class, 'validateResponse'])->name('ms.validate');
    Route::post('/validate-teams-token', [LoginController::class, 'validateTeamsToken'])->name('ms.validateTeamsToken');
});
