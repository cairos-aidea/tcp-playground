<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\TimeCharge;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ProjectController extends Controller {
    
    public function index() {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->role_id == 1) {
            // Only get project (no relations)
            return Project::whereNull('deleted_at')->get();
        } elseif (in_array($user->role_id, [2, 3])) {
            // Get project with owner, client, budget_allocation
            return Project::whereNull('deleted_at')
                ->with(['owner', 'client', 'budget_allocation', 'project_studio', 'budget_subcon_expenses'])
                ->get();
        } else {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function create() {
        //
    }
    
    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function store(Request $request) {

        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'project_code' => 'required|string|max:255',
            'project_name' => 'required|string|max:200',
            'studio' => 'required|string|max:40',
            'owner_id' => 'nullable|integer',
            // 'is_onhold' => 'required|in:y,n',
            // 'U_CoreServices' => 'nullable|string|max:255',
        ]);

        $validated['project_status'] = $request->input('project_status', 'active');

        $projectStage = Project::create($validated);

        // Prepare ProjectStageLog (do not create another function)
        // Assumes you have a ProjectStageLog model and table
        // ProjectStageLog::create([
        //     'project_stage_id' => $projectStage->id,
        //     'action' => 'created',
        //     'performed_by' => auth()->id() ?? null,
        //     'details' => json_encode($validated),
        //     'created_at' => now(),
        // ]);

        return response()->json($projectStage, 200);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function show(Project $project) {
        //
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function edit(Project $project) {
        //

    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Validate input
        $validated = $request->validate([
            'field' => 'required|string',
            'value' => 'required',
        ]);

        // Find the project
        $project = Project::findOrFail($id);

        // Allow only specific fields to be updated (for security)
        $allowedFields = ['project_name', 'project_code', 'owner_id', 'studio', 'project_status'];

        if (!in_array($validated['field'], $allowedFields)) {
            return response()->json([
                'message' => 'Invalid field update.',
            ], 400);
        }

        // Track if owner_id is being updated
        $updatingOwner = $validated['field'] === 'owner_id';

        // Update the project field
        $project->{$validated['field']} = $validated['value'];
        $project->save();

        // If owner_id changed, update related time charges
        if ($updatingOwner) {
            TimeCharge::where('project_id', $project->id)
                ->where('time_charge_type', 1)
                ->update(['approver_id' => $validated['value']]);
        }

        return response()->json([
            'updated_field' => $validated['field'],
            'new_value' => $validated['value'],
            'project' => $project,
        ], 200);
    }


    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function destroy($id) {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $project = Project::findOrFail($id);

        $projectCode = $project->project_code;

        ProjectStage::where('project_code', $projectCode)
            ->update(['deleted_at' => Carbon::now()]);

        $project->deleted_at = Carbon::now();
        $project->save();

        return response()->json([
            'message' => 'Project deleted successfully.',
            'project_code' => $projectCode,
        ], 200);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
}
