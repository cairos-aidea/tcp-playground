<?php

namespace App\Http\Controllers;

use App\Models\BudgetOtherExpense;
use App\Models\BudgetVersion;
use App\Models\OtherExpense;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BudgetOtherExpenseController extends Controller
{
    // Display a listing of the resource.
    public function index()
    {
        $expenses = BudgetOtherExpense::all();
        return response()->json($expenses);
    }

    // Store a newly created resource in storage.
    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_type' => 'required|string|max:255',
            'budget_allocated' => 'required|string|max:255',
            'budget_version_id' => 'nullable|integer',
            'project_id' => 'nullable|integer',
        ]);

        $validated['is_draft'] = 1;

        if (empty($validated['budget_version_id']) || $validated['budget_version_id'] === "") {
            $projectId = $request->input('project_id');
            $project = Project::findOrFail($projectId);

            // Check for existing BudgetVersion with version_number == 0 and project_id == $projectId
            $existingBudgetVersion = BudgetVersion::where('version_number', 0)
                ->where('project_id', $projectId)
                ->first();

            if ($existingBudgetVersion) {
                $validated['budget_version_id'] = $existingBudgetVersion->id;
            } else {
                $budgetVersion = BudgetVersion::create([
                    'version_number' => 0,
                    'project_id' => $projectId,
                    'project_manager_id' => $project->owner_id,
                    'created_by' => auth()->user()->id,
                ]);
                $validated['budget_version_id'] = $budgetVersion->id;
            }
        }

        $expense = BudgetOtherExpense::create($validated);

        return response()->json($expense, 200);
    }

    // Display the specified resource.
    public function show($id)
    {
        $expense = BudgetOtherExpense::findOrFail($id);
        return response()->json($expense);
    }

    // Update the specified resource in storage.
    public function update(Request $request, $id)
    {
        $expense = BudgetOtherExpense::findOrFail($id);

        $validated = $request->validate([
            'expense_type' => 'required|string|max:255',
        ]);

        $validated['budget_allocated'] = $request->input('budget_allocated', $expense->budget_allocated);
        $validated['is_draft'] = 1;

        $expense->update($validated);

        return response()->json($expense, 200);
    }

    // Remove the specified resource from storage.
    public function destroy($id)
    {
        $expense = BudgetOtherExpense::findOrFail($id);
        $expense->deleted_at = Carbon::now();
        $expense->save();

        return response()->json(null, 200);
    }

    public function getOtherExpenses()
    {
        $expenses = OtherExpense::get();

        return response()->json($expenses);
    }
}
