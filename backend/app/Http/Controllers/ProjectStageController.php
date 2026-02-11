<?php

namespace App\Http\Controllers;

use App\Models\ProjectStage;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ProjectStageController extends Controller
{

    public function index()
    {
        return ProjectStage::whereNull('deleted_at')
            ->get(['id', 'project_code', 'stage_name', 'start_date', 'end_date', 'description', 'is_onhold', 'u_coreservices', 'phase']);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function create()
    {
        //
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'project_code' => 'required|string|max:255',
            'stage_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            // 'is_onhold' => 'required|in:y,n',
            // 'U_CoreServices' => 'nullable|string|max:255',
        ]);

        $validated['is_onhold'] = $request->input('is_onhold', 'n'); // Default to 'n' if not provided
        $validated['U_CoreServices'] = $request->input('U_CoreServices', 'na'); // Default to null if not provided

        // Convert date to m-d-Y string for database (since columns are varchar)
        $validated['start_date'] = Carbon::parse($validated['start_date'])->format('m-d-Y');
        $validated['end_date'] = Carbon::parse($validated['end_date'])->format('m-d-Y');

        $projectStage = ProjectStage::create($validated);

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

    public function show(ProjectStage $projectStage)
    {
        //
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function edit(ProjectStage $projectStage)
    {
        //
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function update(Request $request, $id)
    {
        //
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
        $projectStage = ProjectStage::findOrFail($id);

        // Allow only specific fields to be updated (for security)
        $allowedFields = ['stage_name', 'start_date', 'end_date'];

        if (!in_array($validated['field'], $allowedFields)) {
            return response()->json([
                'message' => 'Invalid field update.',
            ], 400);
        }

        // Update the field dynamically
        $projectStage->{$validated['field']} = $validated['value'];
        $projectStage->save();

        return response()->json([
            'updated_field' => $validated['field'],
            'new_value' => $validated['value'],
            'project_stage' => $projectStage,
        ], 200);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function destroy($id) {
        //
        $user = auth()->user();
        if (!$user || $user->role_id == 1) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Find the project
        $projectStage = ProjectStage::findOrFail($id);

        // Soft delete the project
        $projectStage->deleted_at = Carbon::now();
        $projectStage->save();

         return response()->json([
            'message' => 'Project Stage deleted successfully.',
        ], 200);
    }
}
