<?php

namespace App\Http\Controllers;

use App\Models\DepartmentalTask;
use App\Http\Requests\StoreDepartmentalTaskRequest;
use App\Http\Requests\UpdateDepartmentalTaskRequest;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DepartmentalTaskController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // Get the authenticated user
        $user = auth()->user();

        $departments = [];
        $tasks = [];

        // Get user's department_id and config departments
        $userDepartmentId = $user->department_id;

        // Get additional departments from config/users.php
        $additionalDepartments = config('users', []);

        // Merge all department IDs and get unique values
        // Find the departments for the authenticated user's email in config
        $userDepartmentsFromConfig = [];
        if (!empty($additionalDepartments) && is_array($additionalDepartments)) {
            foreach ($additionalDepartments as $userConfig) {
            if (isset($userConfig['email']) && $userConfig['email'] === $user->email) {
                $userDepartmentsFromConfig = $userConfig['departments'] ?? [];
                break;
            }
            }
        }

        // Merge the user's department and departments from config
        $departmentIds = array_unique(array_merge(
            [$userDepartmentId],
            $userDepartmentsFromConfig
        ));
        
        // Get departments info (assuming Department model exists)
        $departments = Department::whereIn('id', $departmentIds)
            ->whereNull('deleted_at')
            ->get();

        // Get tasks
        if ($user->role_id == 3) { // Admin: get all tasks
            $tasks = DepartmentalTask::whereNull('deleted_at')
                ->get();
        } else { // Non-admin: get tasks for allowed departments
            $tasks = DepartmentalTask::whereIn('department_id', $departmentIds)
                ->whereNull('deleted_at')
                ->get();
        }

        $departmentalTasks = [
            'departments' => $departments,
            'tasks' => $tasks,
        ];

        return $departmentalTasks;
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreDepartmentalTaskRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'task_name' => 'required|string|max:255',
            'department_id' => 'required|integer|exists:departments,id',
        ]);

        $departmentalTask = DepartmentalTask::create($validated);

        return response()->json($departmentalTask, 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\DepartmentalTask  $departmentalTask
     * @return \Illuminate\Http\Response
     */
    public function show(DepartmentalTask $departmentalTask)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \App\Http\Requests\UpdateDepartmentalTaskRequest  $request
     * @param  \App\Models\DepartmentalTask  $departmentalTask
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $departmentalTask = DepartmentalTask::findOrFail($id);

        $validated = $request->validate([
            'task_name' => 'required|string|max:255',
            'department_id' => 'required|integer|exists:departments,id',
        ]);

        $departmentalTask->update($validated);

        return response()->json($departmentalTask, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\DepartmentalTask  $departmentalTask
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $departmentalTask = DepartmentalTask::findOrFail($id);
        $departmentalTask->deleted_at = Carbon::now();
        $departmentalTask->save();

        return response()->json(['message' => 'Departmental task deleted successfully.'], 200);
    }
}
