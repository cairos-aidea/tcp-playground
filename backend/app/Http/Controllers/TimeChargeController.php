<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentalTask;
use App\Models\TimeCharge;
use App\Models\TimeChargeLog;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\User;
use App\Models\Meeting;
use App\Models\Leave;
use App\Models\Holiday;
use App\Models\ProjectInternal;
use App\Models\Subsidiary;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

use Auth;
use Hash;
use Str;
use DateTime;

class TimeChargeController extends Controller
{
    // Display a listing of the resource.
    public function index(Request $request)
    {
        $year = $request->get('year', '');
        $month = $request->get('month', '');
        $user_id = $request->get('user_id', '');

        $query = TimeCharge::where('user_id', $user_id)
            ->whereNull('deleted_at')
            ->with(['time_charge_logs']);

        if (!empty($year)) {
            $query->whereYear('time_charge_date', $year);
        }

        $time_charges = $query->get();

        return $time_charges;
    }
    // Store a newly created resource in storage.
    public function store(Request $request)
    {
        if ($request->get('status') == 'approved' || $request->get('status') == 'declined') {
            return response()->json(['message' => "You cannot create a time charge with status approved"], 400);
        }

        $user = Auth::user();
        $userId = $user->id;
        $start_time_input = $request->get('start_time');
        if (!$start_time_input) {
            return response()->json(['message' => 'start_time is required'], 400);
        }
        $date = Carbon::parse($start_time_input)->toDateString();
        $is_ot = filter_var($request->get('is_ot', false), FILTER_VALIDATE_BOOLEAN);
        $to_split = filter_var($request->get('to_split', false), FILTER_VALIDATE_BOOLEAN);

        $start = Carbon::parse($request->get('start_time'));
        $end = Carbon::parse($request->get('end_time'));

        if ($end->lessThanOrEqualTo($start)) {
            return response()->json(['message' => 'End time must be after start time'], 400);
        }

        // $calcRegularMinutes = function ($start, $end) {
        //     if ($end->lessThanOrEqualTo($start)) {
        //         return 0;
        //     }
        //     return $end->diffInMinutes($start);
        // };

        $lunch_start = Carbon::parse($date . ' 11:30:00');
        $lunch_end = Carbon::parse($date . ' 12:30:00');

        // Function to calculate minutes for regular hours (7am-7pm), excluding lunch, and before/after allowed range
        // $calcRegularMinutes = function ($start, $end) use ($lunch_start, $lunch_end, $userId, $date) {
        //     $regular_start = Carbon::parse($date . ' 07:00:00');
        //     $regular_end = Carbon::parse($date . ' 19:00:00');
        //     if ($start->lte($regular_start)) $start = $regular_start->copy();
        //     if ($end->gte($regular_end)) $end = $regular_end->copy();
        //     if ($start->gte($end)) return 0;
        //     $duration = $end->diffInMinutes($start);
        //     if ($end->gt($lunch_start) && $start->lt($lunch_end)) {
        //         $overlap_start = $start->gt($lunch_start) ? $start : $lunch_start;
        //         $overlap_end = $end->lt($lunch_end) ? $end : $lunch_end;
        //         $duration -= $overlap_end->diffInMinutes($overlap_start);
        //     }
        //     // Get all leaves for this user on this date (including partial/half-day)
        //     $leaves = Leave::where('user_id', $userId)
        //         ->whereDate('start_time', '<=', $date)
        //         ->whereDate('end_time', '>=', $date)
        //         ->whereNull('deleted_at')
        //         ->get();

        //     $total_leave_minutes = 0;
        //     foreach ($leaves as $leave) {
        //         // Calculate leave duration for this day
        //         $leave_hrs = isset($leave->duration_hrs) ? (int)$leave->duration_hrs : 0;
        //         $leave_mns = isset($leave->duration_mns) ? (int)$leave->duration_mns : 0;
        //         $leave_duration = ($leave_hrs * 60) + $leave_mns;

        //         if ($leave_duration === 0) {
        //             if ($leave->isWholeDay == 1) {
        //                 $leave_duration = 480;
        //             } else {
        //                 // For partial leave, only count the overlap with this day
        //                 $leave_start = Carbon::parse($leave->start_time);
        //                 $leave_end = Carbon::parse($leave->end_time);
        //                 $leave_day_start = Carbon::parse($date . ' 00:00:00');
        //                 $leave_day_end = Carbon::parse($date . ' 23:59:59');
        //                 $actual_start = $leave_start->greaterThan($leave_day_start) ? $leave_start : $leave_day_start;
        //                 $actual_end = $leave_end->lessThan($leave_day_end) ? $leave_end : $leave_day_end;
        //                 if ($actual_start->lt($actual_end)) {
        //                     $leave_duration = $actual_end->diffInMinutes($actual_start);
        //                 }
        //             }
        //         }
        //         $total_leave_minutes += $leave_duration;
        //     }

        //     // If total leave for the day is 8 hours or more, no regular time charge allowed
        //     if ($total_leave_minutes >= 480) {
        //         return 0;
        //     }

        //     // If there is partial leave, deduct the leave time from the available regular time
        //     if ($total_leave_minutes > 0) {
        //         // Priority: leave first, then time charge
        //         $duration = max(0, min($duration, 480 - $total_leave_minutes));
        //     }

        //     return max(0, $duration);
        // };

        // Calculate duration without any rules, just end - start
        // abs() is required because Carbon 3 (Laravel 12) returns signed values from diffInMinutes()
        $raw_duration = abs($end->diffInMinutes($start));
        $duration_hrs = intdiv($raw_duration, 60);
        $duration_min = $raw_duration % 60;

        // $existing_events = TimeCharge::where('user_id', $userId)
        //     ->where('time_charge_date', $date)
        //     ->where('is_ot', false)
        //     ->where('status', '!=', 'declined')
        //     ->get();

        // $existing_minutes = $existing_events->sum(function ($tc) use ($calcRegularMinutes) {
        //     $existing_start = Carbon::parse($tc->start_time);
        //     $existing_end = Carbon::parse($tc->end_time);
        //     return $calcRegularMinutes($existing_start, $existing_end);
        // });

        // $MAX_DAILY_MINUTES = 480;
        // $remaining_minutes = max(0, $MAX_DAILY_MINUTES - $existing_minutes);
        // $final_duration = min($raw_duration, $remaining_minutes);
        // $duration_hrs = intdiv($final_duration, 60);
        // $duration_min = $final_duration % 60;

        // Determine approver based on time_charge_type
        $approver_id = null;
        $time_charge_type = $request->get('time_charge_type', '');

        switch ($time_charge_type) {
            case 1: // Project External
                $project = Project::find($request->get('project_id'));
                $approver_id = $project->owner_id ?? null;
                break;
            case 2: // Project Internal
                $projectInternal = ProjectInternal::find($request->get('project_id'));
                $subsidiary = $projectInternal ? Subsidiary::find($projectInternal->subsidiary_id) : null;
                $approver_id = $subsidiary->manager_id ?? null;
                break;
            // $projectInternal = ProjectInternal::find($request->get('project_id'));
            // $approver_id = $projectInternal ? $projectInternal->owner_id : null;
            // break;
            case 3:
                $departmental_task_id = $request->get('departmental_task_id');
                $department_id = null;
                if ($departmental_task_id) {
                    $departmentalTask = DepartmentalTask::find($departmental_task_id);
                    $department_id = $departmentalTask ? $departmentalTask->department_id : null;
                }
                $department = $department_id ? Department::find($department_id) : null;
                $approver_id = $department ? $department->department_head_id : null;
                break;
        }

        // Prepare base data
        $base_time_charge = [
            'time_charge_date' => $date,
            'user_id' => $userId,
            'start_time' => $start->format('Y-m-d H:i:s'),
            'end_time' => $end->format('Y-m-d H:i:s'),
            'is_ot' => $is_ot,
            'next_day_ot' => $request->get('next_day_ot', false),
            'time_charge_type' => $time_charge_type,
            'project_id' => $request->get('project_id', null),
            'project_code' => $request->get('project_code', null),
            'project_label' => $request->get('project_label', null),
            'stage_id' => $request->get('stage_id', null),
            'stage_label' => $request->get('stage_label', null),
            'departmental_task_id' => $request->get('departmental_task_id', null),
            'activity' => $request->get('activity', ''),
            'remarks' => $request->get('remarks', ''),
            'status' => 'pending',
            'approver_id' => $approver_id,
            'duration_hrs' => $duration_hrs,
            'duration_min' => $duration_min
        ];

        // --- STORE FUNCTION ---
        // 1. is_ot false and to_split true: Split into regular and OT
        // if ((!$is_ot && $to_split) || ($is_ot && $to_split)) {
        //     // Calculate already used regular minutes for the day
        //     $existing_regular_events = TimeCharge::where('user_id', $userId)
        //         ->where('time_charge_date', $date)
        //         ->where('is_ot', false)
        //         ->where('status', '!=', 'declined')
        //         ->get();

        //     $used_regular_minutes = $existing_regular_events->sum(function ($tc) use ($calcRegularMinutes) {
        //         $existing_start = Carbon::parse($tc->start_time);
        //         $existing_end = Carbon::parse($tc->end_time);
        //         return $calcRegularMinutes($existing_start, $existing_end);
        //     });

        //     $MAX_REGULAR_MINUTES = 540; // 9 hours + 1 hour lunch
        //     $remaining_regular_minutes = max(0, $MAX_REGULAR_MINUTES - $used_regular_minutes);

        //     // Adjust $start to 7am if earlier
        //     $regular_start = $start->copy();
        //     $seven_am = Carbon::parse($date . ' 07:00:00');
        //     if ($regular_start->lt($seven_am)) {
        //         $regular_start = $seven_am->copy();
        //     }

        //     // Clamp regular_end so that total regular minutes for the day do not exceed 540
        //     $regular_end = $regular_start->copy()->addMinutes($remaining_regular_minutes);

        //     // Clamp regular_end to not exceed $end
        //     if ($regular_end->gt($end)) {
        //         $regular_end = $end->copy();
        //     }

        //     // Calculate actual regular minutes (capped at remaining regular minutes)
        //     $regular_minutes = $calcRegularMinutes($regular_start, $regular_end);
        //     $regular_entry_data = $base_time_charge;
        //     $regular_entry_data['is_ot'] = false;
        //     $regular_entry_data['duration_hrs'] = intdiv($regular_minutes, 60);
        //     $regular_entry_data['duration_min'] = $regular_minutes % 60;
        //     $regular_entry_data['start_time'] = $regular_start->format('Y-m-d H:i:s');
        //     $regular_entry_data['end_time'] = $regular_end->format('Y-m-d H:i:s');

        //     $regularEntry = null;
        //     if ($regular_minutes > 0) {
        //         $regularEntry = TimeCharge::create($regular_entry_data);
        //     }

        //     $otEntry = null;
        //     if ($end->gte($regular_end)) {
        //         $ot_start = $regular_end->copy();
        //         $ot_end = $end->copy();
        //         $ot_minutes = $ot_end->diffInMinutes($ot_start);
        //         if ($ot_end->gt($lunch_start) && $ot_start->lt($lunch_end)) {
        //             $overlap_start = $ot_start->gt($lunch_start) ? $ot_start : $lunch_start;
        //             $overlap_end = $ot_end->lt($lunch_end) ? $ot_end : $lunch_end;
        //             $ot_minutes -= $overlap_end->diffInMinutes($overlap_start);
        //         }
        //         $ot_minutes = max(0, $ot_minutes);

        //         $ot_entry_data = $base_time_charge;
        //         $ot_entry_data['is_ot'] = true;
        //         $ot_entry_data['duration_hrs'] = intdiv($ot_minutes, 60);
        //         $ot_entry_data['duration_min'] = $ot_minutes % 60;
        //         $ot_entry_data['start_time'] = $ot_start->format('Y-m-d H:i:s');
        //         $ot_entry_data['end_time'] = $ot_end->format('Y-m-d H:i:s');

        //         if ($ot_minutes > 0) {
        //             $otEntry = TimeCharge::create($ot_entry_data);
        //         }
        //     }

        //     return response()->json([
        //         'regular' => $regularEntry,
        //         'ot' => $otEntry
        //     ], 200);
        // }

        // If is_ot true and to_split false: Just create OT entry with calculated duration
        // if ($request->ot_type || $is_ot) {
        //     $raw_duration = $end->diffInMinutes($start);
        //     $duration_hrs = intdiv($raw_duration, 60);
        //     $duration_min = $raw_duration % 60;
        //     $base_time_charge['duration_hrs'] = $duration_hrs;
        //     $base_time_charge['duration_min'] = $duration_min;
        //     $base_time_charge['is_ot'] = true;
        //     $timeCharge = TimeCharge::create($base_time_charge);
        //     return response()->json($timeCharge, 200);
        // }

        // 3. is_ot false and to_split false: Normal time charge, capped at 8 hours if needed
        // if (!$is_ot && !$to_split) {
        //     if ($raw_duration > 480) {
        //         // 4. is_ot false and to_split false and raw_duration > 480: Cap to 8 hours
        //         $base_time_charge['duration_hrs'] = 8;
        //         $base_time_charge['duration_min'] = 0;
        //     } else {
        //         $base_time_charge['duration_hrs'] = $duration_hrs;
        //         $base_time_charge['duration_min'] = $duration_min;
        //     }
        //     $timeCharge = TimeCharge::create($base_time_charge);
        //     return response()->json($timeCharge, 200);
        // }

        // Fallback: Invalid combination
        // return response()->json(['message' => 'Invalid time charge request'], 400);

        // Just create the time charge with the calculated duration (no rules)
        $timeCharge = TimeCharge::create($base_time_charge);
        return response()->json($timeCharge, 200);
    }

    // Display the specified resource.
    public function show($id)
    {
        return TimeCharge::findOrFail($id);
    }

    // Update the specified resource in storage.
    public function update(Request $request, $id)
    {
        if ($request->get('status') == 'approved' || $request->get('status') == 'declined') {
            return response()->json(['message' => "You cannot update a time charge with status approved or declined"], 400);
        }

        $user = Auth::user();
        $userId = $user->id;
        $start_time_input = $request->get('start_time');
        if (!$start_time_input) {
            return response()->json(['message' => 'start_time is required'], 400);
        }
        $date = Carbon::parse($start_time_input)->toDateString();
        $is_ot = filter_var($request->get('is_ot', false), FILTER_VALIDATE_BOOLEAN);
        $to_split = filter_var($request->get('to_split', false), FILTER_VALIDATE_BOOLEAN);

        $start = Carbon::parse($request->get('start_time'));
        $end = Carbon::parse($request->get('end_time'));

        if ($end->lessThanOrEqualTo($start)) {
            return response()->json(['message' => 'End time must be after start time'], 400);
        }

        // $lunch_start = Carbon::parse($date . ' 11:30:00');
        // $lunch_end = Carbon::parse($date . ' 12:30:00');

        // $calcRegularMinutes = function ($start, $end) use ($lunch_start, $lunch_end, $userId, $date) {
        //     $regular_start = Carbon::parse($date . ' 07:00:00');
        //     $regular_end = Carbon::parse($date . ' 19:00:00');
        //     if ($start->lt($regular_start)) $start = $regular_start->copy();
        //     if ($end->gt($regular_end)) $end = $regular_end->copy();
        //     if ($start->gte($end)) return 0;
        //     $duration = $end->diffInMinutes($start);
        //     if ($end->gt($lunch_start) && $start->lt($lunch_end)) {
        //         $overlap_start = $start->gt($lunch_start) ? $start : $lunch_start;
        //         $overlap_end = $end->lt($lunch_end) ? $end : $lunch_end;
        //         $duration -= $overlap_end->diffInMinutes($overlap_start);
        //     }
        //     $leaves = Leave::where('user_id', $userId)
        //         ->whereDate('start_time', '<=', $date)
        //         ->whereDate('end_time', '>=', $date)
        //         ->whereNull('deleted_at')
        //         ->get();

        //     $total_leave_minutes = 0;
        //     foreach ($leaves as $leave) {
        //         // Calculate leave duration for this day
        //         $leave_hrs = isset($leave->duration_hrs) ? (int)$leave->duration_hrs : 0;
        //         $leave_mns = isset($leave->duration_mns) ? (int)$leave->duration_mns : 0;
        //         $leave_duration = ($leave_hrs * 60) + $leave_mns;

        //         if ($leave_duration === 0) {
        //             if ($leave->isWholeDay == 1) {
        //                 $leave_duration = 480;
        //             } else {
        //                 // For partial leave, only count the overlap with this day
        //                 $leave_start = Carbon::parse($leave->start_time);
        //                 $leave_end = Carbon::parse($leave->end_time);
        //                 $leave_day_start = Carbon::parse($date . ' 00:00:00');
        //                 $leave_day_end = Carbon::parse($date . ' 23:59:59');
        //                 $actual_start = $leave_start->greaterThan($leave_day_start) ? $leave_start : $leave_day_start;
        //                 $actual_end = $leave_end->lessThan($leave_day_end) ? $leave_end : $leave_day_end;
        //                 if ($actual_start->lt($actual_end)) {
        //                     $leave_duration = $actual_end->diffInMinutes($actual_start);
        //                 }
        //             }
        //         }
        //         $total_leave_minutes += $leave_duration;
        //     }

        //     // If total leave for the day is 8 hours or more, no regular time charge allowed
        //     if ($total_leave_minutes >= 480) {
        //         return 0;
        //     }

        //     // If there is partial leave, deduct the leave time from the available regular time
        //     if ($total_leave_minutes > 0) {
        //         // Priority: leave first, then time charge
        //         $duration = max(0, min($duration, 480 - $total_leave_minutes));
        //     }

        //     return max(0, $duration);
        // };

        // Calculate duration without any rules, just end - start
        // abs() is required because Carbon 3 (Laravel 12) returns signed values from diffInMinutes()
        $raw_duration = abs($end->diffInMinutes($start));
        $duration_hrs = intdiv($raw_duration, 60);
        $duration_min = $raw_duration % 60;

        // $existing_events = TimeCharge::where('user_id', $userId)
        //     ->where('time_charge_date', $date)
        //     ->where('is_ot', false)
        //     ->where('status', '!=', 'declined')
        //     ->where('id', '!=', $id)
        //     ->get();
        // $existing_minutes = $existing_events->sum(function ($tc) use ($calcRegularMinutes) {
        //     $existing_start = Carbon::parse($tc->start_time);
        //     $existing_end = Carbon::parse($tc->end_time);
        //     return $calcRegularMinutes($existing_start, $existing_end);
        // });

        // $MAX_DAILY_MINUTES = 480;
        // $remaining_minutes = max(0, $MAX_DAILY_MINUTES - $existing_minutes);
        // $final_duration = min($raw_duration, $remaining_minutes);
        // $duration_hrs = intdiv($final_duration, 60);
        // $duration_min = $final_duration % 60;

        // Determine approver based on time_charge_type
        $approver_id = null;
        $time_charge_type = $request->get('time_charge_type', '');

        switch ($time_charge_type) {
            case 1: // Project External
                $project = Project::find($request->get('project_id'));
                $approver_id = $project->owner_id ?? null;
                break;
            case 2: // Project Internal
                $projectInternal = ProjectInternal::find($request->get('project_id'));
                $subsidiary = $projectInternal ? Subsidiary::find($projectInternal->subsidiary_id) : null;
                $approver_id = $subsidiary->manager_id ?? null;
                break;
            // $projectInternal = ProjectInternal::find($request->get('project_id'));
            // $approver_id = $projectInternal ? $projectInternal->owner_id : null;
            // break;
            case 3:
                $departmental_task_id = $request->get('departmental_task_id');
                $department_id = null;
                if ($departmental_task_id) {
                    $departmentalTask = DepartmentalTask::find($departmental_task_id);
                    $department_id = $departmentalTask ? $departmentalTask->department_id : null;
                }
                $department = $department_id ? Department::find($department_id) : null;
                $approver_id = $department ? $department->department_head_id : null;
                break;
        }

        // Prepare base data
        $base_time_charge = [
            'time_charge_date' => $date,
            'user_id' => $userId,
            'start_time' => $start->format('Y-m-d H:i:s'),
            'end_time' => $end->format('Y-m-d H:i:s'),
            'is_ot' => $is_ot,
            'next_day_ot' => $request->get('next_day_ot', false),
            'time_charge_type' => $time_charge_type,
            'project_id' => $request->get('project_id', null),
            'project_code' => $request->get('project_code', null),
            'project_label' => $request->get('project_label', null),
            'stage_id' => $request->get('stage_id', null),
            'stage_label' => $request->get('stage_label', null),
            'departmental_task_id' => $request->get('departmental_task_id', null),
            'activity' => $request->get('activity', ''),
            'remarks' => $request->get('remarks', ''),
            'status' => 'pending',
            'approver_id' => $approver_id,
            'duration_hrs' => $duration_hrs,
            'duration_min' => $duration_min
        ];

        $timeCharge = TimeCharge::find($id);
        if (!$timeCharge) {
            return response()->json(['message' => 'Time charge not found'], 404);
        }

        // --- UPDATE FUNCTION ---
        // 1. is_ot false and to_split true: Split into regular and OT
        // if ((!$is_ot && $to_split) || ($is_ot && $to_split)) {
        //     // Calculate already used regular minutes for the day (excluding this record)
        //     $existing_regular_events = TimeCharge::where('user_id', $userId)
        //         ->where('time_charge_date', $date)
        //         ->where('is_ot', false)
        //         ->where('status', '!=', 'declined')
        //         ->where('id', '!=', $id)
        //         ->get();

        //     $used_regular_minutes = $existing_regular_events->sum(function ($tc) use ($calcRegularMinutes) {
        //         $existing_start = Carbon::parse($tc->start_time);
        //         $existing_end = Carbon::parse($tc->end_time);
        //         return $calcRegularMinutes($existing_start, $existing_end);
        //     });

        //     $MAX_REGULAR_MINUTES = 540; // 9 hours + 1 hour lunch
        //     $remaining_regular_minutes = max(0, $MAX_REGULAR_MINUTES - $used_regular_minutes);

        //     // Adjust $start to 7am if earlier
        //     $regular_start = $start->copy();
        //     $seven_am = Carbon::parse($date . ' 07:00:00');
        //     if ($regular_start->lt($seven_am)) {
        //         $regular_start = $seven_am->copy();
        //     }

        //     // Clamp regular_end so that total regular minutes for the day do not exceed 540
        //     $regular_end = $regular_start->copy()->addMinutes($remaining_regular_minutes);

        //     // Clamp regular_end to not exceed $end
        //     if ($regular_end->gt($end)) {
        //         $regular_end = $end->copy();
        //     }

        //     // Calculate actual regular minutes (capped at remaining regular minutes)
        //     $regular_minutes = $calcRegularMinutes($regular_start, $regular_end);
        //     $regular_entry_data = $base_time_charge;
        //     $regular_entry_data['is_ot'] = false;
        //     $regular_entry_data['duration_hrs'] = intdiv($regular_minutes, 60);
        //     $regular_entry_data['duration_min'] = $regular_minutes % 60;
        //     $regular_entry_data['start_time'] = $regular_start->format('Y-m-d H:i:s');
        //     $regular_entry_data['end_time'] = $regular_end->format('Y-m-d H:i:s');

        //     // Update the main record as regular
        //     $timeCharge->update($regular_entry_data);

        //     $otEntry = null;
        //     if ($end->gt($regular_end)) {
        //         $ot_start = $regular_end->copy();
        //         $ot_end = $end->copy();
        //         $ot_minutes = $ot_end->diffInMinutes($ot_start);
        //         if ($ot_end->gt($lunch_start) && $ot_start->lt($lunch_end)) {
        //             $overlap_start = $ot_start->gt($lunch_start) ? $ot_start : $lunch_start;
        //             $overlap_end = $ot_end->lt($lunch_end) ? $ot_end : $lunch_end;
        //             $ot_minutes -= $overlap_end->diffInMinutes($overlap_start);
        //         }
        //         $ot_minutes = max(0, $ot_minutes);

        //         $ot_entry_data = $base_time_charge;
        //         $ot_entry_data['is_ot'] = true;
        //         $ot_entry_data['duration_hrs'] = intdiv($ot_minutes, 60);
        //         $ot_entry_data['duration_min'] = $ot_minutes % 60;
        //         $ot_entry_data['start_time'] = $ot_start->format('Y-m-d H:i:s');
        //         $ot_entry_data['end_time'] = $ot_end->format('Y-m-d H:i:s');

        //         if ($ot_minutes > 0) {
        //             $otEntry = TimeCharge::create($ot_entry_data);
        //         }
        //     }

        //     return response()->json([
        //         'regular' => $timeCharge,
        //         'ot' => $otEntry
        //     ], 200);
        // }

        // if ($request->ot_type || $is_ot) {
        //     $raw_duration = $end->diffInMinutes($start);
        //     $duration_hrs = intdiv($raw_duration, 60);
        //     $duration_min = $raw_duration % 60;
        //     $base_time_charge['duration_hrs'] = $duration_hrs;
        //     $base_time_charge['duration_min'] = $duration_min;
        //     $base_time_charge['is_ot'] = true;
        //     $timeCharge->update($base_time_charge);
        //     return response()->json($timeCharge, 200);
        // }

        // 3. is_ot false and to_split false: Normal time charge, capped at 8 hours if needed
        // if (!$is_ot && !$to_split) {
        //     if ($raw_duration > 480) {
        //         $base_time_charge['duration_hrs'] = 8;
        //         $base_time_charge['duration_min'] = 0;
        //     } else {
        //         $base_time_charge['duration_hrs'] = $duration_hrs;
        //         $base_time_charge['duration_min'] = $duration_min;
        //     }
        //     $timeCharge->update($base_time_charge);
        //     return response()->json($timeCharge, 200);
        // }
        // Fallback: Invalid combination
        // return response()->json(['message' => 'Invalid time charge request'], 400);

        // Just update the time charge with the calculated duration (no rules)
        $timeCharge->update($base_time_charge);
        return response()->json($timeCharge, 200);
    }

    // Remove the specified resource from storage.
    public function destroy($id)
    {
        $return_data = array(
            "status" => "error",
            "message" => "Something went wrong",
            "data" => null
        );

        $timeCharge = TimeCharge::find($id);

        if (!$timeCharge) {
            $return_data['message'] = "Time charge not found";
            return response()->json($return_data, 404);
        }

        if (Auth::user()->id == $timeCharge->user_id) {
            $timeCharge->deleted_at = now();
            if ($timeCharge->save()) {
                $return_data['status'] = "success";
                $return_data['message'] = "Deleting time charge was a success";

                $to_create_data = array(
                    'user_id' => Auth::user()->id,
                    'payload' => $timeCharge->id,
                    'performed_activity' => "delete"
                );

                $to_create_data['time_charge_id'] = $timeCharge->id;
                TimeChargeLog::create($to_create_data);

                return response()->json($return_data, 200);
            } else {
                return response()->json($return_data, 500);
            }
        } else {
            $return_data = array(
                "status" => "error",
                "message" => "You are not allowed to perform this operation",
                "data" => null
            );

            return response()->json($return_data, 403);
        }
    }

    public function approvers_list(Request $request)
    {
        $timeCharges = TimeCharge::query();
        $start_date = $request->get('start_date', '');
        $end_date = $request->get('end_date', '');
        $is_ot = $request->get('is_ot', '');

        $project_id = $request->get('project_id', '');
        $stage_id = $request->get('stage_id', '');
        $staff_id = $request->get('staff_id', '');
        $status = $request->get('status', '');

        error_log(json_encode($request->input()));

        if (!empty($start_date) && strtotime($start_date)) {
            $timeCharges->where("time_charge_date", ">=", date('Y-m-d', strtotime($start_date)));
        }

        if (!empty($end_date) && strtotime($end_date)) {
            $timeCharges->where("time_charge_date", "<=", date('Y-m-d', strtotime($end_date)));
        }

        $time_charge_type = $request->get('time_charge_type', '');

        // Staff filter (multi-select)
        $staff_ids = $request->get('staff_ids', []);
        if (!empty($staff_ids) && is_array($staff_ids)) {
            $timeCharges->whereIn("user_id", $staff_ids);
        }

        // If time_charge_type is '0', '', or null, do NOT filter by project/stage/task
        if ($time_charge_type === '1') {
            if (!empty($project_id)) {
                $timeCharges->where("project_id", $project_id);
            }
            if (!empty($stage_id)) {
                $timeCharges->where("stage_id", $stage_id);
            }
            $timeCharges->where("time_charge_type", '1');
        } elseif ($time_charge_type === '2') {
            if (!empty($project_id)) {
                $timeCharges->where("project_id", $project_id);
            }
            $timeCharges->where("time_charge_type", '2');
        } elseif ($time_charge_type === '3') {
            if (!empty($project_id)) {
                $timeCharges->where("departmental_task_id", $project_id);
            }
            $timeCharges->where("time_charge_type", '3');
        } else {
            // No filtering by project/stage/task
            $timeCharges->whereIn("time_charge_type", ['1', '2', '3']);
        }

        if (!empty($status)) {
            $timeCharges->where("status", $status);
        }

        if (!empty($is_ot)) {
            $ot_value = 0;
            if ($is_ot) {
                $ot_value = 1;
            }

            $timeCharges->where("is_ot", $ot_value);
        }

        // Only show time charges where the current user is the approver
        $timeCharges->where('approver_id', Auth::user()->id);

        // $time_charges = $timeCharges->with(['user'])->groupBy("project_id", "project_date", "user_id")->orderBy("project_date", "desc")->paginate(5);
        $time_charges = $timeCharges
            ->whereNull('source')
            ->with(['user'])
            ->orderBy("time_charge_date", "desc")
            ->orderBy("start_time", "asc")
            ->paginate($request->get('per_page', 25));

        return $time_charges;
    }

    public function approve(Request $request)
    {
        $return_data = array(
            "status" => "error",
            "message" => "Something went wrong",
            "data" => null
        );

        $time_charge_ids = $request->get("time_charge_ids", '');

        // The data you want to update
        $updateData = [
            'status' => 'approved',
        ];

        if (is_array($time_charge_ids)) {
            $isApprove = TimeCharge::whereIn('id', $time_charge_ids)->update($updateData);
        } else {
            $isApprove = TimeCharge::where('id', $time_charge_ids)->update($updateData);
        }

        if ($isApprove) {
            $return_data['status'] = "success";
            $return_data['message'] = "Approving time charges was a success";
            $return_data['data'] = $isApprove;

            $to_create_data = array(
                'user_id' => Auth::user()->id,
                'payload' => json_encode($request->input()),
                'performed_activity' => "approve"
            );

            if (is_array($time_charge_ids)) {
                foreach ($time_charge_ids as $time_charge_id) {
                    $to_create_data['time_charge_id'] = $time_charge_id;
                    TimeChargeLog::create($to_create_data);
                }
            } else {
                $to_create_data['time_charge_id'] = $time_charge_ids;
                TimeChargeLog::create($to_create_data);
            }

            return response()->json($return_data, 200);
        } else {
            return response()->json($return_data, 500);
        }
    }

    public function decline(Request $request)
    {
        $return_data = array(
            "status" => "error",
            "message" => "Something went wrong",
            "data" => null
        );

        $time_charge_ids = $request->get("time_charge_ids", '');

        // The data you want to update
        $updateData = [
            'status' => 'declined',
        ];

        // Perform the update
        if (is_array($time_charge_ids)) {
            $isDecline = TimeCharge::whereIn('id', $time_charge_ids)->update($updateData);
        } else {
            $isDecline = TimeCharge::where('id', $time_charge_ids)->update($updateData);
        }

        if ($isDecline) {
            $return_data['status'] = "success";
            $return_data['message'] = "Approving time charges was a success";
            $return_data['data'] = $isDecline;

            $to_create_data = array(
                'user_id' => Auth::user()->id,
                'payload' => json_encode($request->input()),
                'performed_activity' => "decline"
            );

            if (is_array($time_charge_ids)) {
                foreach ($time_charge_ids as $time_charge_id) {
                    $to_create_data['time_charge_id'] = $time_charge_id;
                    TimeChargeLog::create($to_create_data);
                }
            } else {
                $to_create_data['time_charge_id'] = $time_charge_ids;
                TimeChargeLog::create($to_create_data);
            }

            return response()->json($return_data, 200);
        } else {
            return response()->json($return_data, 500);
        }
    }

    public function re_open(Request $request)
    {
        $return_data = array(
            "status" => "error",
            "message" => "Something went wrong",
            "data" => null
        );

        $time_charge_ids = $request->get("time_charge_ids", '');

        // The data you want to update
        $updateData = [
            'status' => 'pending',
        ];

        // Perform the update
        if (is_array($time_charge_ids)) {
            $isReopen = TimeCharge::whereIn('id', $time_charge_ids)->update($updateData);
        } else {
            $isReopen = TimeCharge::where('id', $time_charge_ids)->update($updateData);
        }

        if ($isReopen) {
            $return_data['status'] = "success";
            $return_data['message'] = "Approving time charges was a success";
            $return_data['data'] = $isReopen;

            $to_create_data = array(
                'user_id' => Auth::user()->id,
                'payload' => json_encode($request->input()),
                'performed_activity' => "reopen"
            );

            if (is_array($time_charge_ids)) {
                foreach ($time_charge_ids as $time_charge_id) {
                    $to_create_data['time_charge_id'] = $time_charge_id;
                    TimeChargeLog::create($to_create_data);
                }
            } else {
                $to_create_data['time_charge_id'] = $time_charge_ids;
                TimeChargeLog::create($to_create_data);
            }

            return response()->json($return_data, 200);
        } else {
            return response()->json($return_data, 500);
        }
    }

    public function export_data(Request $request)
    {
        // Get filters from request
        $start_date = $request->get('start_date', '');
        $end_date = $request->get('end_date', '');
        $user_ids = $request->get('user_ids', '');
        $department_ids = $request->get('department_ids', []);
        $subsidiary_ids = $request->get('subsidiary_ids', []);

        // Collect user IDs from departments
        $department_user_ids = [];
        if (!empty($department_ids) && is_array($department_ids)) {
            $department_user_ids = User::whereIn('department_id', $department_ids)->pluck('id')->toArray();
        }

        // Collect user IDs from subsidiaries
        $subsidiary_user_ids = [];
        if (!empty($subsidiary_ids) && is_array($subsidiary_ids)) {
            $subsidiary_user_ids = User::whereIn('subsidiary_id', $subsidiary_ids)->pluck('id')->toArray();
        }

        // Merge all user IDs
        $all_user_ids = [];
        if (!empty($user_ids) && is_array($user_ids)) {
            $all_user_ids = array_merge($all_user_ids, $user_ids);
        }
        $all_user_ids = array_merge($all_user_ids, $department_user_ids, $subsidiary_user_ids);
        $all_user_ids = array_unique($all_user_ids);

        // If no user_ids, get all users
        if (empty($all_user_ids)) {
            $users = User::all();
        } else {
            $users = User::whereIn('id', $all_user_ids)->get();
        }

        // Get holidays for the period (may be MM-DD or YYYY-MM-DD)
        $holidays = Holiday::all()->pluck('date')->toArray();

        $data = [];

        foreach ($users as $user) {
            // Get all time charges for this user in the date range
            $query = TimeCharge::where('user_id', $user->id)
                ->whereNull('deleted_at')
                ->where('status', 'approved');
            if (!empty($start_date)) {
                $query->where('time_charge_date', '>=', $start_date);
            }
            if (!empty($end_date)) {
                $query->where('time_charge_date', '<=', $end_date);
            }
            $time_charges = $query->get();

            // Initialize columns
            $REG_DAY_W8 = 0;
            $OT_REG_DAY_W8 = 0;
            $OT_REG_DAY_O8 = 0;
            $OT_NIGHT_DIFF = 0;
            $OT_REST_DAY_W8 = 0;
            $OT_LEG_HOL_W8 = 0;

            // Group time charges by date
            $grouped = $time_charges->groupBy('time_charge_date');

            foreach ($grouped as $date => $charges) {
                // Check if $date is a holiday (match YYYY-MM-DD or MM-DD)
                $date_mmdd = date('m-d', strtotime($date));
                $isHoliday = in_array($date, $holidays) || in_array($date_mmdd, $holidays);
                $isWeekend = (date('N', strtotime($date)) >= 6);

                // Calculate total regular (non-OT) time for the day
                $reg_minutes = 0;
                foreach ($charges as $charge) {
                    if (!$charge->is_ot) {
                        $reg_minutes += ($charge->duration_hrs * 60) + $charge->duration_min;
                    }
                }
                $REG_DAY_W8 += round($reg_minutes / 60, 2);

                // Overtime calculations
                $ot_charges = $charges->where('is_ot', 1);
                $ot_minutes = 0;
                foreach ($ot_charges as $ot) {
                    $start = new DateTime($ot->start_time);
                    $end = new DateTime($ot->end_time);

                    // If end time is 23:59, treat as 23:59:59 and add 1 minute
                    if ($end->format('H:i') === '23:59') {
                        $end = DateTime::createFromFormat('Y-m-d H:i:s', $end->format('Y-m-d') . ' 23:59:59');
                        $interval = $start->diff($end);
                        $minutes = ($interval->h * 60) + $interval->i + 1;
                    } else {
                        $interval = $start->diff($end);
                        $minutes = ($interval->h * 60) + $interval->i;
                    }
                    $ot_minutes += $minutes;

                    // Night diff: 10pm-4am
                    $night_minutes = 0;
                    $cur = clone $start;
                    while ($cur < $end) {
                        $hour = (int) $cur->format('H');
                        if ($hour >= 22 || $hour < 4) {
                            $night_minutes++;
                        }
                        $cur->modify('+1 minute');
                    }
                    $OT_NIGHT_DIFF += round($night_minutes / 60, 2);

                    // Overtime on holidays
                    if ($isHoliday) {
                        $OT_LEG_HOL_W8 += round($minutes / 60, 2);
                    }
                    // Overtime on weekends
                    elseif ($isWeekend) {
                        $OT_REST_DAY_W8 += round($minutes / 60, 2);
                    }
                    // Regular day overtime (only if not holiday)
                    else {
                        // First 8 hours
                        $base = min($minutes, 480);
                        $excess = max($minutes - 480, 0);
                        $OT_REG_DAY_W8 += round($base / 60, 2);
                        $OT_REG_DAY_O8 += round($excess / 60, 2);
                    }
                }
                // You can use $ot_minutes here if you need the total OT duration for the day
            }

            $data[] = [
                'EMP_PAYROLL_ID' => $user->employee_id,
                'EMP_LAST_NAME' => $user->last_name,
                'EMP_FIRST_NAME' => $user->first_name,
                'REG_DAY_W8' => $REG_DAY_W8,
                'OT_REG_DAY_W8' => $OT_REG_DAY_W8,
                'OT_REG_DAY_O8' => $OT_REG_DAY_O8,
                'OT_NIGHT_DIFF' => $OT_NIGHT_DIFF,
                'OT_REST_DAY_W8' => $OT_REST_DAY_W8,
                'OT_LEG_HOL_W8' => $OT_LEG_HOL_W8,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}
