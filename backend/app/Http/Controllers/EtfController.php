<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Etf;
use App\Models\EtfStageVersion;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\Rank;
use App\Models\TimeCharge;
use App\Models\User;
use Carbon\Carbon;
use DateTime;
use Illuminate\Http\Request;

class ETFController extends Controller
{
    public function save(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $payload = $request->all();
        if (!is_array($payload) || count($payload) === 0) {
            return response()->json([], 200);
        }

        // Validate all items first and collect unique keys
        $validatedItems = [];
        $userIds = [];
        $etfKeys = [];
        foreach ($payload as $item) {
            $validated = validator($item, [
                'stage_id' => 'required',
                'user_id' => 'required',
                'start_date' => 'required|date',
                'end_date' => 'required|date',
                'etf_hours' => '',
                'type' => 'required',
                'is_actual' => '',
            ])->validate();

            $validated['stage_id'] = (int) $validated['stage_id'];
            $validated['user_id'] = (int) $validated['user_id'];
            // Support decimals
            $validated['etf_hours'] = $validated['etf_hours'] === '' || $validated['etf_hours'] === null ? null : (float) $validated['etf_hours'];
            $validated['etf_hours'] = $validated['etf_hours'] === 0 ? null : $validated['etf_hours'];
            $validated['is_subsidiary_manpower'] = $validated['type'] === 'subsidiary' ? 1 : 0;

            $startDate = Carbon::parse($validated['start_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateString();
            $endDate = Carbon::parse($validated['end_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateString();

            $etfKey = $validated['stage_id'] . '|' . $validated['user_id'] . '|' . $startDate . '|' . $endDate . '|' . $validated['is_subsidiary_manpower'];
            $etfKeys[] = $etfKey;
            $userIds[] = $validated['user_id'];

            $validatedItems[] = array_merge($validated, [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'etfKey' => $etfKey,
            ]);
        }

        // Fetch all users in one go
        $users = User::whereIn('id', array_unique($userIds))->get()->keyBy('id');

        // Fetch all existing ETFs in one go
        $existingEtfs = Etf::whereIn('etf_stage_version_id', array_unique(array_column($validatedItems, 'stage_id')))
            ->whereIn('user_id', array_unique($userIds))
            ->whereIn('is_subsidiary_manpower', [0, 1])
            ->whereNull('deleted_at')
            ->get()
            ->filter(function ($etf) use ($validatedItems) {
                foreach ($validatedItems as $item) {
                    if (
                        $etf->etf_stage_version_id == $item['stage_id'] &&
                        $etf->user_id == $item['user_id'] &&
                        Carbon::parse($etf->start_date)->toDateString() == $item['startDate'] &&
                        Carbon::parse($etf->end_date)->toDateString() == $item['endDate'] &&
                        $etf->is_subsidiary_manpower == $item['is_subsidiary_manpower']
                    ) {
                        return true;
                    }
                }
                return false;
            })
            ->keyBy(function ($etf) {
                return $etf->etf_stage_version_id . '|' . $etf->user_id . '|' . Carbon::parse($etf->start_date)->toDateString() . '|' . Carbon::parse($etf->end_date)->toDateString() . '|' . $etf->is_subsidiary_manpower;
            });

        $result = [];
        foreach ($validatedItems as $item) {
            $etf = $existingEtfs->get($item['etfKey']);
            if (!$etf) {
                $etf = Etf::create([
                    'etf_stage_version_id' => $item['stage_id'],
                    'user_id' => $item['user_id'],
                    'start_date' => Carbon::parse($item['start_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString(),
                    'end_date' => Carbon::parse($item['end_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString(),
                    'etf_hours' => $item['etf_hours'],
                    'is_subsidiary_manpower' => $item['is_subsidiary_manpower'],
                    'is_actual' => $item['is_actual'] ?? 0,
                ]);
            } else {
                $etf->etf_hours = $item['etf_hours'];
                $etf->start_date = Carbon::parse($item['start_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString();
                $etf->end_date = Carbon::parse($item['end_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString();
                $etf->save();
            }

            $user = $users->get($item['user_id']);
            $result[] = [
                'id' => $etf->id,
                'user_id' => $etf->user_id,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'employee_id' => $user->employee_id,
                    'rank' => $user->rank,
                    'department_id' => $user->department_id,
                    'is_active' => $user->is_active,
                ] : null,
                'stage_id' => $etf->etf_stage_version_id,
                'start_date' => Carbon::parse($etf->start_date, 'Asia/Singapore')->toDateString(),
                'end_date' => Carbon::parse($etf->end_date, 'Asia/Singapore')->toDateString(),
                'etf_hours' => $etf->etf_hours,
                'is_subsidiary_manpower' => $etf->is_subsidiary_manpower,
                'is_actual' => $etf->is_actual,
            ];
        }

        return response()->json($result, 200);
    }

    public function delete(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $payload = $request->all();

        $deletedEtfs = [];

        $project = Project::find($payload['project_id']);
        if ($project) {
            $projectCode = $project->project_code;

            $stageVersionIds = EtfStageVersion::where('project_code', $projectCode)
                ->pluck('id')
                ->toArray();

            $etfs = Etf::whereIn('etf_stage_version_id', $stageVersionIds)
                ->where('user_id', $payload['user_id'])
                ->where('is_subsidiary_manpower', $payload['is_subsidiary_manpower'])
                ->whereNull('deleted_at')
                ->get();

            foreach ($etfs as $etf) {
                $etf->deleted_at = Carbon::now();
                $etf->save();
                $deletedEtfs[] = $etf;
            }
        }

        return response()->json($deletedEtfs, 200);
    }

    public function etfTimeChargesByProject($id)
    {
        $today = Carbon::now('Asia/Singapore');
        $year = $today->year;
        $month = $today->month;

        $firstOfMonth = Carbon::create($year, $month, 1, 0, 0, 0, 'Asia/Singapore');
        $monthStart = $firstOfMonth->copy();

        // weekEnd = earlier of (sunday, today) — still used for grouping later
        $weekSunday = $today->copy()->endOfWeek(Carbon::SUNDAY);
        $weekEnd = $weekSunday->lessThan($today)
            ? $weekSunday->copy()
            : $today->copy();

        $time_charges = TimeCharge::where('project_id', $id)
            ->whereNull('deleted_at')
            ->whereNotNull('stage_id')
            ->whereNotNull('user_id')
            //->where('status', 'approved')
            ->whereDate('time_charge_date', '<', $monthStart->toDateString())   // <-- CHANGED: from month start
            ->select('id', 'user_id', 'stage_id', 'duration_hrs', 'duration_min', 'time_charge_date')
            ->orderBy('time_charge_date')
            ->get();

        if ($time_charges->isEmpty()) {
            return response()->json([], 200);
        }

        $project = Project::select('id', 'project_code', 'studio')->find($id);
        if (!$project) return response()->json([], 200);

        $projectCode = $project->project_code;
        $studioId = $project->studio;

        $department = $studioId
            ? Department::select('id', 'subsidiary_id')->find($studioId)
            : null;

        $projectSubsidiaryId = $department ? $department->subsidiary_id : null;

        $userIds = $time_charges->pluck('user_id')->unique()->values();

        $users = User::select('id', 'name', 'employee_id', 'rank', 'department_id', 'subsidiary_id', 'is_active')
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $stageVersions = EtfStageVersion::where('project_code', $projectCode)
            ->select('id', 'stage_id', 'start_date', 'end_date')
            ->get();

        $minDate = $time_charges->min('time_charge_date');
        $maxDate = $time_charges->max('time_charge_date');

        $weeks = $this->getWeeksSplitByMonthAligned($minDate, $maxDate);
        if (empty($weeks)) return response()->json([], 200);

        $grouped = [];
        $chargesByUser = [];

        foreach ($time_charges as $tc) {
            $chargesByUser[$tc->user_id][] = $tc;
        }

        foreach ($userIds as $userId) {
            if (!isset($chargesByUser[$userId])) continue;

            $userCharges = $chargesByUser[$userId];

            foreach ($weeks as $week) {
                $weekStartDate = $week['start'];
                $weekEndDate = $week['end'];

                // Group charges by stage_id (including null)
                $chargesByStage = [];
                foreach ($userCharges as $tc) {
                    if ($tc->time_charge_date >= $weekStartDate && $tc->time_charge_date <= $weekEndDate) {
                        $stageKey = $tc->stage_id === null ? 'null' : $tc->stage_id;
                        $chargesByStage[$stageKey][] = $tc;
                    }
                }

                foreach ($chargesByStage as $stageKey => $charges) {
                    if (empty($charges)) continue;

                    $totalHours = 0;
                    foreach ($charges as $tc) {
                        $totalHours += $tc->duration_hrs + ($tc->duration_min / 60);
                    }

                    // If stage_id is null, set stageVersionId to null, else find as before
                    if ($stageKey === 'null') {
                        // $stageVersionId = null;
                        continue;
                    } else {
                        $stageVersionId = $this->findStageVersionForCharges(
                            $charges,
                            $stageVersions,
                            $weekStartDate,
                            $weekEndDate
                        );
                    }

                    $user = $users[$userId] ?? null;

                    $isSubsidiaryMatch =
                        ($projectSubsidiaryId && $user && $user->subsidiary_id == $projectSubsidiaryId)
                        ? 1 : 0;

                    $grouped[] = [
                        'user_id' => $userId,
                        'user' => $user ? [
                            'id' => $user->id,
                            'name' => $user->name,
                            'employee_id' => $user->employee_id,
                            'rank' => $user->rank,
                            'department_id' => $user->department_id,
                            'is_active' => $user->is_active,
                        ] : null,
                        'stage_id' => $stageVersionId,
                        'phase' => $stageVersionId ? (ProjectStage::where('id', EtfStageVersion::where('id', $stageVersionId)->value('stage_id'))->value('phase')) : null,
                        'start_date' => $weekStartDate,
                        'end_date' => $weekEndDate,
                        'etf_hours' => number_format($totalHours, 2),
                        'is_subsidiary_manpower' => $isSubsidiaryMatch,
                        'is_actual' => 1
                    ];
                }
            }
        }

        return response()->json($grouped, 200);
    }

    private function getWeeksSplitByMonthAligned($startDate, $endDate)
    {
        $weeks = [];

        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $end->setTime(23, 59, 59, 999999);

        $current = clone $start;

        // Move to Monday
        while ($current->format('N') != 1) {
            $current->modify('-1 day');
        }

        while ($current <= $end) {
            $weekStart = clone $current;
            $weekEnd = (clone $current)->modify('+6 days');

            $tempStart = clone $weekStart;

            while ($tempStart <= $weekEnd && $tempStart <= $end) {
                $tempEnd = (clone $tempStart)->modify('+6 days');
                if ($tempEnd > $weekEnd) $tempEnd = clone $weekEnd;
                if ($tempEnd > $end) $tempEnd = clone $end;

                // Month break
                if ($tempStart->format('m') !== $tempEnd->format('m')) {
                    $splitEnd = (clone $tempStart)->modify('last day of this month');
                    if ($splitEnd > $weekEnd) $splitEnd = clone $weekEnd;
                    if ($splitEnd > $end) $splitEnd = clone $end;

                    $working = $this->countWorkingDays($tempStart, $splitEnd);
                    if ($working > 0) {
                        $weeks[] = $this->makeWeekEntry($tempStart, $splitEnd, $working);
                    }

                    $tempStart = (clone $splitEnd)->modify('+1 day');
                } else {
                    $working = $this->countWorkingDays($tempStart, $tempEnd);
                    if ($working > 0) {
                        $weeks[] = $this->makeWeekEntry($tempStart, $tempEnd, $working);
                    }

                    $tempStart = (clone $tempEnd)->modify('+1 day');
                }
            }

            $current->modify('+7 days');
        }

        return $weeks;
    }

    private function countWorkingDays($start, $end)
    {
        $count = 0;
        $cur = clone $start;

        while ($cur <= $end) {
            $day = $cur->format('w');
            if ($day >= 1 && $day <= 5) $count++;
            $cur->modify('+1 day');
        }

        return $count;
    }

    private function makeWeekEntry($start, $end, $working)
    {
        return [
            'year'  => $start->format('Y'),
            'month' => $start->format('n'),
            'monthName' => $start->format('M'),
            'weekNum' => $this->getWeekOfMonthPhp($start),
            'start' => $start->format('Y-m-d'),
            'end' => $end->format('Y-m-d'),
            'workingDays' => $working,
        ];
    }

    private function getWeekOfMonthPhp(DateTime $date)
    {
        $startOfMonth = new DateTime($date->format('Y-m-01'));
        $dow = $startOfMonth->format('w') == 0 ? 7 : $startOfMonth->format('w');
        $offset = $date->format('j') + $dow - 1;
        return (int) ceil($offset / 7);
    }

    private function findStageVersionForCharges($charges, $stageVersions, $weekStart, $weekEnd)
    {
        foreach ($charges as $tc) {
            if (!empty($tc->stage_id)) {
                $sv = $stageVersions->first(function ($s) use ($tc) {
                    return $s->stage_id == $tc->stage_id;
                });
                return $sv ? $sv->id : null;
            }
        }

        $sv = $stageVersions->first(function ($s) use ($weekStart, $weekEnd) {
            return $s->start_date <= $weekStart && $s->end_date >= $weekEnd;
        });

        return $sv ? $sv->id : null;
    }

    // public function etfTimeChargesByProject($id)
    // {
    //     $time_charges = TimeCharge::where('project_id', $id)
    //         ->whereNull('deleted_at')
    //         ->get();

    //     if ($time_charges->isEmpty()) {
    //         return response()->json([], 200);
    //     }

    //     // Get project, studio department, and subsidiary
    //     $project = Project::find($id);
    //     if (!$project) {
    //         return response()->json([], 200);
    //     }
    //     $project_code = $project->project_code;
    //     $studio_id = $project->studio;
    //     $department = $studio_id ? Department::find($studio_id) : null;
    //     $subsidiary_id = $department ? $department->subsidiary_id : null;

    //     // Get all users involved
    //     $userIds = $time_charges->pluck('user_id')->unique()->all();
    //     $users = User::whereIn('id', $userIds)->get()->keyBy('id');

    //     // Get all EtfStageVersions for this project
    //     $stageVersions = EtfStageVersion::where('project_code', $project_code)->get();

    //     // Group time charges by user and week (using etfHelpers logic)
    //     $allDates = $time_charges->pluck('time_charge_date')->unique()->sort()->values();
    //     $minDate = $allDates->first();
    //     $maxDate = $allDates->last();
    //     if (!$minDate || !$maxDate) {
    //         return response()->json([], 200);
    //     }

    //     // PHP version of getWeeksSplitByMonth (returns array of weeks with working days > 0)
    //     function getWeeksSplitByMonth($startDate, $endDate)
    //     {
    //         $weeks = [];
    //         $start = new \DateTime($startDate);
    //         $end = new \DateTime($endDate);
    //         $end->setTime(23, 59, 59, 999999);

    //         $current = clone $start;
    //         while ((int)$current->format('N') !== 1) { // 1 = Monday
    //             $current->modify('-1 day');
    //         }

    //         while ($current <= $end) {
    //             $weekStart = clone $current;
    //             $weekEnd = clone $current;
    //             $weekEnd->modify('+6 days');

    //             $tempStart = clone $weekStart;
    //             while ($tempStart <= $weekEnd && $tempStart <= $end) {
    //                 $tempEnd = clone $tempStart;
    //                 $tempEnd->modify('+6 days');
    //                 if ($tempEnd > $weekEnd) $tempEnd = clone $weekEnd;
    //                 if ($tempEnd > $end) $tempEnd = clone $end;

    //                 // Only include weeks with at least 1 working day (Mon-Fri)
    //                 $daysArr = [];
    //                 $cur = clone $tempStart;
    //                 $workingDays = 0;
    //                 while ($cur <= $tempEnd) {
    //                     $daysArr[] = clone $cur;
    //                     $day = (int)$cur->format('w');
    //                     if ($day >= 1 && $day <= 5) $workingDays++;
    //                     $cur->modify('+1 day');
    //                 }

    //                 if (count($daysArr) > 0 && $workingDays > 0) {
    //                     $weeks[] = [
    //                         'start' => clone $tempStart,
    //                         'end' => clone $tempEnd,
    //                         'workingDays' => $workingDays,
    //                     ];
    //                 }

    //                 // Split if month changes
    //                 if ($tempStart->format('m') !== $tempEnd->format('m')) {
    //                     $splitEnd = (clone $tempStart)->modify('last day of this month');
    //                     if ($splitEnd > $weekEnd) $splitEnd = clone $weekEnd;
    //                     if ($splitEnd > $end) $splitEnd = clone $end;
    //                     $tempStart = (clone $splitEnd)->modify('+1 day');
    //                 } else {
    //                     $tempStart = (clone $tempEnd)->modify('+1 day');
    //                 }
    //             }
    //             $current->modify('+7 days');
    //         }
    //         return $weeks;
    //     }

    //     $weeks = getWeeksSplitByMonth($minDate, $maxDate);

    //     // Get today's date
    //     $today = Carbon::now('Asia/Singapore')->toDateString();

    //     // Group time charges by user and week
    //     $grouped = [];
    //     foreach ($userIds as $userId) {
    //         foreach ($weeks as $week) {
    //             $weekStart = $week['start']->format('Y-m-d');
    //             $weekEnd = $week['end']->format('Y-m-d');

    //             // Do not include weeks where weekEnd is after today
    //             if ($weekEnd > $today) {
    //                 continue;
    //             }

    //             // If the week includes today and today is not Sunday, skip this week (incomplete working week)
    //             // (Sunday = 0, Monday = 1, ..., Saturday = 6)
    //             $todayDate = new \DateTime($today);
    //             if ($today >= $weekStart && $today <= $weekEnd) {
    //                 // Only allow if today is Sunday (week is complete)
    //                 if ((int)$todayDate->format('w') !== 0) {
    //                     continue;
    //                 }
    //             }

    //             $charges = $time_charges->where('user_id', $userId)
    //                 ->filter(function ($tc) use ($weekStart, $weekEnd) {
    //                     return $tc->time_charge_date >= $weekStart && $tc->time_charge_date <= $weekEnd;
    //                 });
    //             if ($charges->isEmpty()) continue;

    //             // Sum durations
    //             $totalHrs = $charges->sum('duration_hrs');
    //             $totalMin = $charges->sum('duration_min');
    //             $etf_hours = $totalHrs + ($totalMin / 60);

    //             // Find matching stage_id from EtfStageVersion
    //             $chargesWithStage = $charges->filter(function ($tc) {
    //                 return !empty($tc->stage_id);
    //             });

    //             if ($chargesWithStage->isNotEmpty()) {
    //                 // Use the first non-empty stage_id from time_charges
    //                 $tcStageId = $chargesWithStage->first()->stage_id;
    //                 $stageVersion = $stageVersions->first(function ($sv) use ($tcStageId) {
    //                     return $sv->stage_id == $tcStageId;
    //                 });
    //                 $stage_id = $stageVersion ? $stageVersion->id : null;
    //             } else {
    //                 // Fallback to weekStart/weekEnd logic
    //                 $stageVersion = $stageVersions->first(function ($sv) use ($weekStart, $weekEnd) {
    //                     return $sv->start_date <= $weekStart && $sv->end_date >= $weekEnd;
    //                 });
    //                 $stage_id = $stageVersion ? $stageVersion->id : null;
    //             }

    //             // Determine is_subsidiary_manpower
    //             $user = $users->get($userId);
    //             $is_subsidiary_manpower = 0;
    //             if ($subsidiary_id && $user && $user->subsidiary_id) {
    //                 $is_subsidiary_manpower = ((string)$user->subsidiary_id === (string)$subsidiary_id) ? 1 : 0;
    //             }

    //             $grouped[] = [
    //                 'user_id' => $userId,
    //                 'user' => $user ? [
    //                     'id' => $user->id,
    //                     'name' => $user->name,
    //                     'employee_id' => $user->employee_id,
    //                     'rank' => $user->rank,
    //                     'department' => $user->department,
    //                 ] : null,
    //                 'stage_id' => $stage_id,
    //                 'start_date' => $weekStart,
    //                 'end_date' => $weekEnd,
    //                 'etf_hours' => number_format($etf_hours, 2, '.', ''),
    //                 'is_subsidiary_manpower' => $is_subsidiary_manpower,
    //                 'is_actual' => 1,
    //             ];
    //         }
    //     }

    //     return response()->json($grouped, 200);
    // }

    /**
     * Display a listing of the resource.`
     */
    public function index() {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // $payload = $request->all();
        // // Validate the incoming request
        // $items = is_array($payload) && isset($payload[0]['stage_id']) ? $payload : [$payload];

        // $createdEtfs = [];

        // foreach ($items as $item) {
        //     $validated = validator($item, [
        //         'stage_id' => 'required|integer',
        //         'user_id' => 'required|integer',
        //         'start_date' => 'required|date',
        //         'end_date' => 'required|date',
        //         'etf_hours' => 'required',
        //         'is_subsidiary_manpower' => 'required',
        //     ])->validate();

        //     $startDateUtc = Carbon::parse($item['start_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString();
        //     $endDateUtc = Carbon::parse($item['end_date'], 'UTC')->setTimezone('Asia/Singapore')->toDateTimeString();

        //     $userRankName = User::find($validated['user_id'])->rank;
        //     $rank = Rank::where('name', $userRankName)->first();
        //     $user_rank_id = $rank ? $rank->id : null;

        //     $etf = Etf::create([
        //         'etf_stage_version_id' => $validated['stage_id'],
        //         'user_id' => $validated['user_id'],
        //         'start_date' => $startDateUtc,
        //         'end_date' => $endDateUtc,
        //         'etf_hours' => (int) $validated['etf_hours'],
        //         'etf_rank_id' => $user_rank_id,
        //         'is_subsidiary_manpower' => $validated['is_subsidiary_manpower'],
        //     ]);

        //     // Optionally, convert dates back to GMT+8 for the response
        //     $etf->start_date = Carbon::parse($etf->start_date, 'Asia/Singapore')->toDateString();
        //     $etf->end_date = Carbon::parse($etf->end_date, 'Asia/Singapore')->toDateString();

        //     $createdEtfs[] = $etf;
        // }

        // return response()->json($createdEtfs, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id) {}

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        // $payload = $request->all();

        // // Check if payload is a batch (array of objects) or single object
        // $items = is_array($payload) && isset($payload[0]['stage_id']) ? $payload : [$payload];

        // $updatedEtfs = [];

        // foreach ($items as $item) {
        //     $validated = validator($item, [
        //         'stage_id' => 'required|integer',
        //         'user_id' => 'required|integer',
        //         'start_date' => 'required|date',
        //         'end_date' => 'required|date',
        //         'etf_hours' => '',
        //         'is_subsidiary_manpower' => 'required',
        //     ])->validate();

        //     $etf = Etf::where('etf_stage_version_id', $validated['stage_id'])
        //         ->where('user_id', $validated['user_id'])
        //         ->whereDate('start_date', Carbon::parse($item['start_date'], 'Asia/Singapore')->toDateString())
        //         ->whereDate('end_date', Carbon::parse($item['end_date'], 'Asia/Singapore')->toDateString())
        //         ->where('etf_hours', '!=', $validated['etf_hours'])
        //         ->where('is_subsidiary_manpower', $validated['is_subsidiary_manpower'])
        //         ->where('deleted_at', null)
        //         ->first();

        //     if ($etf) {
        //         $etf->etf_hours = isset($validated['etf_hours']) && $validated['etf_hours'] !== null && $validated['etf_hours'] !== '' ? (int)$validated['etf_hours'] : 0;
        //         $etf->save();
        //         $updatedEtfs[] = $etf;
        //     }
        // }

        // return response()->json($updatedEtfs, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        //
    }
    // public function etfVersionsByProject($projectId)
    // {
    //     $project = Project::where('id', $projectId)->first();

    //     $etfStageVersions = EtfStageVersion::where('project_code', $project->project_code)
    //         ->get(['id', 'version_number', 'project_code', 'stage_id', 'start_date', 'end_date']);

    //     $groupedVersions = $etfStageVersions->groupBy('version_number');

    //     $etf_stages = [];
    //     foreach ($groupedVersions as $version_number => $versions) {
    //         $projectForVersion = Project::where('project_code', $versions->first()->project_code)->first();

    //         $etf_stages[] = [
    //             'version_number' => $version_number,
    //             'project' => $projectForVersion,
    //             'stages' => $versions->map(function ($version) {
    //                 $stage = ProjectStage::where('id', $version->stage_id)
    //                     ->whereNull('deleted_at')
    //                     ->first();
    //                 return [
    //                     'id' => $version->id,
    //                     'stage_id' => $version->stage_id,
    //                     'stage_name' => $stage ? $stage->stage_name : null,
    //                     'start_date' => $version->start_date,
    //                     'end_date' => $version->end_date,
    //                 ];
    //             })
    //             // Filter out stages with null stage_id, start_date, end_date
    //             ->filter(function ($stage) {
    //                 return $stage['stage_id'] !== null
    //                     && $stage['start_date'] !== null
    //                     && $stage['end_date'] !== null;
    //             })
    //             ->values()
    //             ->all()
    //         ];
    //     }

    //     $etfs = collect($etf_stages);

    //     if ($etfs->isEmpty()) {
    //         $project = Project::with(['stages' => function ($query) {
    //             $query->whereNull('deleted_at');
    //         }])->find($projectId);
    //         if ($project && $project->stages) {
    //             $newVersions = [];
    //             foreach ($project->stages as $stage) {
    //                 $newVersion = EtfStageVersion::create([
    //                     'version_number' => 0,
    //                     'project_code' => $project->project_code,
    //                     'stage_id' => $stage->id,
    //                     'start_date' => $stage->start_date,
    //                     'end_date' => $stage->end_date,
    //                     'created_at' => Carbon::now(),
    //                 ]);
    //                 $newVersions[] = $newVersion;
    //             }

    //             $etf_stages = [];
    //             $etf_stages[] = [
    //                 'version_number' => 0,
    //                 'project' => $project,
    //                 'stages' => collect($newVersions)->map(function ($version) {
    //                     $stage = ProjectStage::where('id', $version->stage_id)
    //                         ->whereNull('deleted_at')
    //                         ->first();
    //                     return [
    //                         'id' => $version->id,
    //                         'stage_id' => $version->stage_id,
    //                         'stage_name' => $stage ? $stage->stage_name : null,
    //                         'start_date' => $version->start_date,
    //                         'end_date' => $version->end_date,
    //                     ];
    //                 })
    //                 // Filter out stages with null stage_id, start_date, end_date
    //                 ->filter(function ($stage) {
    //                     return $stage['stage_id'] !== null
    //                         && $stage['start_date'] !== null
    //                         && $stage['end_date'] !== null;
    //                 })
    //                 ->values()
    //                 ->all()
    //             ];

    //             $etfs = collect($etf_stages)->take(1);
    //         } else {
    //             $etfs = collect();
    //         }
    //     } else {
    //         if ($etfs->count() === 1) {
    //             $etfs = $etfs->take(1);
    //         }
    //     }

    //     return response()->json($etfs, 200);
    // }

    public function etfVersionsByProject($projectId)
    {
        $project = Project::where('id', $projectId)->first();
        if (!$project) {
            return response()->json([], 200);
        }

        // Get all project stages (not deleted)
        $projectStages = ProjectStage::where('project_code', $project->project_code)
            ->whereNull('deleted_at')
            ->get();

        // Get all ETF stage versions for this project
        $etfStageVersions = EtfStageVersion::where('project_code', $project->project_code)
            ->whereNull('deleted_at')
            ->get(['id', 'version_number', 'project_code', 'stage_id', 'start_date', 'end_date']);

        // Find projectStages not present in any EtfStageVersion
        $existingStageIds = $etfStageVersions->pluck('stage_id')->unique()->toArray();
        $missingStages = $projectStages->filter(function ($stage) use ($existingStageIds) {
            return !in_array($stage->id, $existingStageIds);
        });

        // If there are missing stages, add them to EtfStageVersion (version_number = 0)
        $newVersions = [];
        foreach ($missingStages as $stage) {
            $newVersion = EtfStageVersion::create([
                'version_number' => 0,
                'project_code' => $project->project_code,
                'stage_id' => $stage->id,
                'start_date' => $stage->start_date,
                'end_date' => $stage->end_date,
                'created_at' => Carbon::now(),
            ]);
            $newVersions[] = $newVersion;
            $etfStageVersions->push($newVersion);
        }

        // Group by version_number
        $groupedVersions = $etfStageVersions->groupBy('version_number');

        $etf_stages = [];
        foreach ($groupedVersions as $version_number => $versions) {
            $projectForVersion = Project::where('project_code', $versions->first()->project_code)->first();

            $etf_stages[] = [
                'version_number' => $version_number,
                'project' => $projectForVersion,
                'stages' => $versions->map(function ($version) {
                    $stage = ProjectStage::where('id', $version->stage_id)
                        ->whereNull('deleted_at')
                        ->first();
                    return [
                        'id' => $version->id,
                        'stage_id' => $version->stage_id,
                        'stage_name' => $stage ? $stage->stage_name : null,
                        'start_date' => $version->start_date,
                        'end_date' => $version->end_date,
                        'phase' => $stage ? $stage->phase : null,
                    ];
                })
                // Filter out stages with null stage_id, start_date, end_date
                ->filter(function ($stage) {
                    return $stage['stage_id'] !== null
                        && $stage['start_date'] !== null
                        && $stage['end_date'] !== null;
                }),
                'phases' => $versions->map(function ($version) {
                    $stage = ProjectStage::where('id', $version->stage_id)
                        ->whereNull('deleted_at')
                        ->first();
                    return $stage ? $stage->phase : null;
                })->filter(function ($phase) {
                    return $phase !== null;
                })->unique()->values()
            ];
        }

        $etfs = collect($etf_stages);

        // Always return all versions (including new stages just added)
        return response()->json($etfs, 200);
    }

    // public function etfsByProjectAndVersion($projectId, $versionNumber)
    // {
    //     $project = Project::where('id', $projectId)->first();
    //     if (!$project) {
    //         return response()->json([], 200);
    //     }

    //     $stageVersions = EtfStageVersion::where('project_code', $project->project_code)
    //         ->where('version_number', $versionNumber)
    //         ->pluck('id');

    //     $etfs = Etf::whereIn('etf_stage_version_id', $stageVersions)
    //         ->whereNull('deleted_at')
    //         ->with('user')
    //         ->get();

    //     $result = $etfs->filter(function ($etf) {
    //         return $etf->user_id !== null
    //             && $etf->etf_stage_version_id !== null
    //             && $etf->start_date !== null
    //             && $etf->end_date !== null;
    //     })->map(function ($etf) {
    //         return [
    //             'id' => $etf->id,
    //             'user_id' => $etf->user_id,
    //             'user' => $etf->user ? [
    //                 'id' => $etf->user->id,
    //                 'name' => $etf->user->name,
    //                 'employee_id' => $etf->user->employee_id,
    //                 'rank' => $etf->user->rank,
    //                 'department_id' => $etf->user->department_id,
    //                 'is_active' => $etf->user->is_active,
    //             ] : null,
    //             'stage_id' => $etf->etf_stage_version_id,
    //             'start_date' => $etf->start_date,
    //             'end_date' => $etf->end_date,
    //             'etf_hours' => $etf->etf_hours,
    //             'is_subsidiary_manpower' => $etf->is_subsidiary_manpower,
    //             'is_actual' => $etf->is_actual,
    //         ];
    //     })->values();

    //     return response()->json($result, 200);
    // }
    
    public function etfsByProjectAndVersion(Request $request, $projectId, $versionNumber)
    {
        $project = Project::where('id', $projectId)->first();
        if (!$project) {
            return response()->json([], 200);
        }

        $phaseParam = $request->get('phase');

        // Get all stage versions for this project/version
        $stageVersions = EtfStageVersion::where('project_code', $project->project_code)
            ->where('version_number', $versionNumber)
            ->whereNull('deleted_at')
            ->get();

        // Get all related ProjectStages
        $stageIds = $stageVersions->pluck('stage_id')->unique()->toArray();
        $projectStages = ProjectStage::whereIn('id', $stageIds)->get()->keyBy('id');

        // Map stage_id to phase
        $stageIdToPhase = [];
        foreach ($projectStages as $stage) {
            $stageIdToPhase[$stage->id] = $stage->phase;
        }

        // Get all unique phases
        $phases = collect($stageIdToPhase)->unique()->filter(function ($v) {
            return $v !== null;
        })->values();

        // // Determine which phase to use
        // if ($phases->isEmpty()) {
        //     // No phases, so use all stageIds for filtering
        //     $filteredStageVersionIds = $stageVersions->pluck('id');
        // } else {
        //     if ($phaseParam !== null && $phases->contains($phaseParam)) {
        //         $selectedPhase = $phaseParam;
        //     } else {
        //         $selectedPhase = $phases->first();
        //     }

        //     // Filter stageVersions by selected phase
        //     $filteredStageVersionIds = $stageVersions->filter(function ($sv) use ($stageIdToPhase, $selectedPhase) {
        //         return isset($stageIdToPhase[$sv->stage_id]) && $stageIdToPhase[$sv->stage_id] == $selectedPhase;
        //     })->pluck('id');
        // }

        $filteredStageVersionIds = $stageVersions->pluck('id');
        
        $etfs = Etf::whereIn('etf_stage_version_id', $filteredStageVersionIds)
            ->whereNull('deleted_at')
            ->with('user')
            ->get();
        
        $result = $etfs->filter(function ($etf) {
            return $etf->user_id !== null
            && $etf->etf_stage_version_id !== null
            && $etf->start_date !== null
            && $etf->end_date !== null;
        })->map(function ($etf) use ($projectStages, $stageIdToPhase) {
            // Find the phase for this ETF
            $stageVersion = EtfStageVersion::find($etf->etf_stage_version_id);
            $phase = null;
            if ($stageVersion && isset($stageIdToPhase[$stageVersion->stage_id])) {
            $phase = $stageIdToPhase[$stageVersion->stage_id];
            }
            // If there are no phases at all, phase will remain null for all
            return [
            'id' => $etf->id,
            'user_id' => $etf->user_id,
            'user' => $etf->user ? [
                'id' => $etf->user->id,
                'name' => $etf->user->name,
                'employee_id' => $etf->user->employee_id,
                'rank' => $etf->user->rank,
                'department_id' => $etf->user->department_id,
                'is_active' => $etf->user->is_active,
            ] : null,
            'stage_id' => $etf->etf_stage_version_id,
            'start_date' => $etf->start_date,
            'end_date' => $etf->end_date,
            'etf_hours' => $etf->etf_hours,
            'is_subsidiary_manpower' => $etf->is_subsidiary_manpower,
            'is_actual' => $etf->is_actual,
            'phase' => $phase, // will be null if no phase, or the phase string if present
            ];
        })->values();

        return response()->json($result, 200);
    }
}
