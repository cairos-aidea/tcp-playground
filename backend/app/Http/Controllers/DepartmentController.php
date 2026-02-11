<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $departments = Department::whereNull('deleted_at')->orderBy("id", "asc")->get();
        return $departments;
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
            'name' => 'required|string|max:255',
            'subsidiary_id' => 'required|integer|exists:subsidiaries,id',
            'department_head_id' => 'nullable|integer|exists:users,id',
        ]);

        $department = Department::create($validated);

        return response()->json($department, 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\Response
     */
    public function show(Department $department)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subsidiary_id' => 'required|integer|exists:subsidiaries,id',
            'department_head_id' => 'nullable|integer|exists:users,id',
        ]);

        $department->update($validated);

        return response()->json($department, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $department = Department::findOrFail($id);
        $department->deleted_at = now();
        $department->save();

        return response()->json(['message' => 'Department deleted successfully.'], 200);
    }
}
