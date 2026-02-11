<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Setting;
use App\Http\Controllers\AuthController;

// Route::post('/login', [AuthController::class, 'login']);
// Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::group(['middleware' => ['auth:api']], function() {

    Route::post('time-charges/approve', 'App\Http\Controllers\TimeChargeController@approve');
    Route::post('time-charges/decline', 'App\Http\Controllers\TimeChargeController@decline');
    Route::post('time-charges/re-open', 'App\Http\Controllers\TimeChargeController@re_open');

    Route::apiResource('time-charges', 'App\Http\Controllers\TimeChargeController');
    Route::apiResource('projects', 'App\Http\Controllers\ProjectController');
    Route::get('projects/owned/{id}', 'App\Http\Controllers\UserController@ownedByUser');
    Route::get('projects/external/{id}/etf-versions', 'App\Http\Controllers\EtfController@etfVersionsByProject');
    Route::get('projects/external/{id}/version/{version}/etfs', 'App\Http\Controllers\EtfController@etfsByProjectAndVersion');
    // etf
    Route::get('etfs/time-charges/project/{id}', 'App\Http\Controllers\EtfController@etfTimeChargesByProject');
    Route::post('etfs/create', 'App\Http\Controllers\EtfController@store');
    Route::post('etfs/update', 'App\Http\Controllers\EtfController@update');
    // for both create and update
    Route::post('etfs/save', 'App\Http\Controllers\EtfController@save');
    Route::post('etfs/delete', 'App\Http\Controllers\EtfController@delete');

    Route::post('etf-stages/update-dates', 'App\Http\Controllers\EtfStageVersionController@updateDates');

    Route::apiResource('project-stages', 'App\Http\Controllers\ProjectStageController');
    Route::apiResource('departmental-tasks', 'App\Http\Controllers\DepartmentalTaskController');
    Route::apiResource('project-internals', 'App\Http\Controllers\ProjectInternalController');
    Route::apiResource('subsidiaries', 'App\Http\Controllers\SubsidiaryController');
    Route::get('holidays/calendar', 'App\Http\Controllers\HolidayController@calendarHolidays');
    Route::apiResource('holidays', 'App\Http\Controllers\HolidayController');

    Route::post('approvers-list', 'App\Http\Controllers\TimeChargeController@approvers_list');
    Route::post('export-data', 'App\Http\Controllers\TimeChargeController@export_data'); 
    Route::post('send-reminders', 'App\Http\Controllers\Microsoft\TeamsMessageController@sendTimeChargeReminders');

    Route::get('meetings', 'App\Http\Controllers\MeetingController@index');
    Route::apiResource('staffs', 'App\Http\Controllers\UserController');
    Route::apiResource('departments', 'App\Http\Controllers\DepartmentController');
    
    Route::get('leaves', 'App\Http\Controllers\LeaveController@index');
    Route::get('leaves/credits/{id}', 'App\Http\Controllers\LeaveController@leave_credits');

    Route::get('missing-time-charges', 'App\Http\Controllers\TimeChargeController@missing_time_charges');

    Route::get('projects/{id}/budget', 'App\Http\Controllers\BudgetVersionController@getProjectBudget');
    Route::get('projects/{id}/budget-versions', 'App\Http\Controllers\BudgetVersionController@getBudgetVersions');
    Route::get('projects/budget/other-expenses', 'App\Http\Controllers\BudgetOtherExpenseController@getOtherExpenses');
    Route::apiResource('budget-versions', 'App\Http\Controllers\BudgetVersionController');    
    Route::apiResource('budget-other-expenses', 'App\Http\Controllers\BudgetOtherExpenseController');
    
    // Route::get('billable_non_billable', function () {
    //     $billable_non_billable_data = array(
    //         "billable" => config('constants.billable'),
    //         "non_billable" => config('constants.non_billable'),
    //         "billable_tasks" => config('constants.billable_tasks'), 
    //         "non_billable_tasks" => config('constants.non_billable_tasks')
    //     );

    //     return response()->json($billable_non_billable_data);
    // });
});