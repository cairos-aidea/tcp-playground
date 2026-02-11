<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\ProjectInternal;
use App\Http\Requests\StoreProjectInternalRequest;
use App\Http\Requests\UpdateProjectInternalRequest;
use App\Models\Subsidiary;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProjectInternalController extends Controller
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

        $subsidiaries = [];
        $projects = [];

        // Get user's subsidiary_id (assuming it's stored as 'subsidiary_id' on user)
        $userSubsidiaryId = $user->subsidiary_id ?? null;

        // Get additional subsidiaries from config/users.php
        $additionalSubsidiaries = config('users', []);

        // Find the config user entry matching the authenticated user's email
        $userConfig = collect($additionalSubsidiaries)
            ->first(function ($item) use ($user) {
            return isset($item['email']) && $item['email'] === $user->email;
            });

        // Get subsidiaries from config for this user, or empty array
        $configSubsidiaries = $userConfig['subsidiaries'] ?? [];

        // Merge user's subsidiary_id and config subsidiaries, then get unique values
        $subsidiaryIds = array_unique(array_merge(
            $userSubsidiaryId ? [$userSubsidiaryId] : [],
            $configSubsidiaries
        ));

        // Get subsidiaries info (assuming Subsidiary model exists)
        $subsidiaries = Subsidiary::whereIn('id', $subsidiaryIds)
            ->whereNull('deleted_at')
            ->get();

        // Get projects
        if ($user->role_id == 3) { // Admin: get all projects
            $projects = ProjectInternal::whereNull('deleted_at')
                ->with('owner')
                ->get();
        } else { // Non-admin: get projects for allowed subsidiaries
            $projects = ProjectInternal::whereIn('subsidiary_id', $subsidiaryIds)
                ->whereNull('deleted_at')
                ->with('owner')
                ->get();
        }

        $result = [
            'subsidiaries' => $subsidiaries,
            'projects' => $projects,
        ];

        return response()->json($result, 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreProjectInternalRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'project_code' => 'required|string|max:255',
            'project_name' => 'required|string|max:255',
            'subsidiary_id' => 'required|integer|exists:subsidiaries,id',
            'project_status' => 'required|string|max:255',
            // 'start_date' => 'nullable|date',
            // 'end_date' => 'nullable|date',
            // 'is_indefinite_date' => 'nullable|boolean',
            // 'owner_id' => 'required|integer',
        ]);

        $projectInternal = ProjectInternal::create($validated);

        return response()->json($projectInternal, 200);

    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\ProjectInternal  $projectInternal
     * @return \Illuminate\Http\Response
     */
    public function show(ProjectInternal $projectInternal)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \App\Http\Requests\UpdateProjectInternalRequest  $request
     * @param  \App\Models\ProjectInternal  $projectInternal
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $projectInternal = ProjectInternal::findOrFail($id);

        $validated = $request->validate([
            'project_code' => 'required|string|max:255',
            'project_name' => 'required|string|max:255',    
            'subsidiary_id' => 'required|integer|exists:subsidiaries,id',
            'project_status' => 'required|string|max:255',
            // 'start_date' => 'nullable|date',
            // 'end_date' => 'nullable|date',
            // 'is_indefinite_date' => 'nullable|boolean',
            // 'owner_id' => 'required|integer',
        ]);

        $projectInternal->update($validated);

        return response()->json($projectInternal, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\ProjectInternal  $projectInternal
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $projectInternal = ProjectInternal::findOrFail($id);
        $projectInternal->deleted_at = Carbon::now();
        $projectInternal->save();

        return response()->json(['message' => 'Project Internal deleted successfully.'], 200);
    }
}
