<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentalTask;
use App\Models\Project;
use App\Models\ProjectInternal;
use App\Models\Subsidiary;
use App\Models\TimeCharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use Carbon\Carbon;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::whereNull('deleted_at')
            // ->where('is_active', 'yes')
            ->orderBy("id", "asc")
            ->select([
                'id',
                'role_id',
                'name',
                'email',
                'profile',
                'first_name',
                'last_name',
                'status',
                'employee_id',
                'rank',
                'company',
                'subsidiary_id',
                'department_id',
                'sex',
                'is_active',
                'hire_date'
            ])
            ->get();
        return $users;
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'role_id' => 'required',
            'email' => 'string|max:200',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'job_title' => 'nullable|string|max:100',
            'status' => 'required|string|max:45',
            'employee_id' => 'nullable|string|max:45',
            'rank' => 'nullable|string|max:45',
            // 'company' => 'nullable|string|max:45',
            'subsidiary_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'sex' => 'nullable|string|max:10',
            'is_active' => 'required|string',
        ]);

        $validated['name'] = $validated['first_name'] . ' ' . $validated['last_name'];

        $user = User::create($validated);

        // Prepare ProjectStageLog (do not create another function)
        // Assumes you have a ProjectStageLog model and table
        // ProjectStageLog::create([
        //     'project_stage_id' => $projectStage->id,
        //     'action' => 'created',
        //     'performed_by' => auth()->id() ?? null,
        //     'details' => json_encode($validated),
        //     'created_at' => now(),
        // ]);

        return response()->json($user, 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\TimeChargeLog  $timeChargeLog
     * @return \Illuminate\Http\Response
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\TimeChargeLog  $timeChargeLog
     * @return \Illuminate\Http\Response
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\TimeChargeLog  $timeChargeLog
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $authUser = auth()->user();
        if (!$authUser || $authUser->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'role_id' => 'required',
            'email' => 'string|max:200',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'job_title' => 'nullable|string|max:100',
            'status' => 'required|string|max:45',
            'employee_id' => 'nullable|string|max:45',
            'rank' => 'nullable|string|max:45',
            // 'company' => 'nullable|string|max:45',
            'subsidiary_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'sex' => 'nullable|string|max:10',
            'is_active' => 'required|string',
        ]);

        $validated['name'] = $validated['first_name'] . ' ' . $validated['last_name'];

        $user = User::findOrFail($id);
        $user->fill($validated);
        $user->save();

        // Prepare ProjectStageLog (do not create another function)
        // Assumes you have a ProjectStageLog model and table
        // ProjectStageLog::create([
        //     'project_stage_id' => $projectStage->id,
        //     'action' => 'updated',
        //     'performed_by' => auth()->id() ?? null,
        //     'details' => json_encode($validated),
        //     'created_at' => now(),
        // ]);

        return response()->json($user, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\TimeChargeLog  $timeChargeLog
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $user = User::findOrFail($id);
        $user->deleted_at = Carbon::now();
        $user->save();

        // Prepare ProjectStageLog (do not create another function)
        // Assumes you have a ProjectStageLog model and table
        // ProjectStageLog::create([
        //     'project_stage_id' => $projectStage->id,
        //     'action' => 'deleted',
        //     'performed_by' => auth()->id() ?? null,
        //     'details' => json_encode(['id' => $id]),
        //     'created_at' => now(),
        // ]);

        return response()->json(['message' => 'User deleted successfully.'], 200);
    }

    public function ownedByUser($userId)
    {
        $authUser = auth()->user();
        if (!$authUser || !in_array($authUser->role_id, [2, 3])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Load correct relations
        $targetUser = User::with(['subsidiary', 'departmentRelation'])->find($userId);

        if (!$targetUser) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        /**
         * ---------------------------
         * Fetch External Projects
         * ---------------------------
         */
        $projectsExternal = Project::where('owner_id', $userId)
            ->whereNull('deleted_at')
            ->get();

        /**
         * ---------------------------
         * Fetch Internal Projects
         * ---------------------------
         */
        $projectsInternal = collect();

        if ($targetUser->subsidiary && $targetUser->subsidiary->manager_id == $userId) {
            $projectsInternal = ProjectInternal::where('subsidiary_id', $targetUser->subsidiary_id)
                ->whereNull('deleted_at')
                ->with(['owner', 'subsidiary'])
                ->get();
        }

        /**
         * ---------------------------
         * Departmental Tasks
         * ---------------------------
         */
        $departmentalTasks = collect();

        if ($targetUser->departmentRelation && $targetUser->departmentRelation->department_head_id) {
            $departmentalTasks = DepartmentalTask::where('department_id', $targetUser->department_id)
                ->whereNull('deleted_at')
                ->get();
        }

        /**
         * ---------------------------
         * Time Charge Users
         * ---------------------------
         */

        // Fetch charges by approver
        $timeCharges = TimeCharge::where('approver_id', $userId)
            ->whereNull('deleted_at')
            ->get();

        // Unique users with time charges
        $timeChargeUserIds = $timeCharges->pluck('user_id')->unique()->values();

        // Load users + department in 1 query
        $users = User::whereIn('id', $timeChargeUserIds)
            ->with('departmentRelation:id,name')
            ->select([
                'id',
                'name',
                'employee_id',
                'first_name',
                'last_name',
                'department_id',
                'profile'
            ])
            ->get();

        // Group charges by user for quick access
        $chargesGrouped = $timeCharges->groupBy('user_id');

        // Build final payload
        $timeChargeUsers = $users->map(function ($u) use ($chargesGrouped) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'employee_id' => $u->employee_id,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'department_id' => $u->departmentRelation->name ?? null,
                'profile' => $u->profile,
                'time_charges_filed' => $chargesGrouped[$u->id]
                    ->pluck('time_charge_type')
                    ->unique()
                    ->values()
                    ->toArray(),
            ];
        });

        return response()->json([
            'projects_external'   => $projectsExternal,
            'projects_internal'   => $projectsInternal,
            'departmental_tasks'  => $departmentalTasks,
            'time_charge_users'   => $timeChargeUsers,
        ]);
    }
}
