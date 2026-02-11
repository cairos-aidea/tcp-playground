<?php

namespace App\Http\Controllers;

use App\Models\BudgetAllocation;
use App\Models\BudgetOtherExpense;
use Illuminate\Http\Request;
use App\Models\BudgetVersion;
use App\Models\Project;

class BudgetVersionController extends Controller
{
    public function getProjectBudget($projectId) {
        $latestVersion = BudgetVersion::where('project_id', $projectId)
            ->where('version_number', 0)
            ->with([
                'budget_other_expenses' => function ($query) {
                    $query->whereNull('deleted_at');
                }
            ])
            ->first();

        $budgetAllocation = BudgetAllocation::where('project_id', $projectId)->first();

        // Get subcon expenses from the Project model
        $project = Project::with([
            'budget_subcon_expenses' => function ($query) {
                $query->whereNull('deleted_at');
            }
        ])->find($projectId);

        $subconExpenses = $project && $project->budget_subcon_expenses ? $project->budget_subcon_expenses : collect();

        $directCost = 0;
        if ($latestVersion) {
            $directCost += $latestVersion->budget_other_expenses->sum('budget_allocated');
            $directCost += $subconExpenses->sum('budget_allocated');
        }

        $contractFee = $budgetAllocation ? (float)$budgetAllocation->contract_fee : 0;
        $vatPercentage = $budgetAllocation ? (float)$budgetAllocation->vat_percentage : 0;
        $targetProfitability = $budgetAllocation ? (float)$budgetAllocation->target_profitability : 0;

        $contractFeeVatExcl = $vatPercentage > 0 ? $contractFee / (1 + $vatPercentage / 100) : $contractFee;
        $netAideaFee = $contractFeeVatExcl - $directCost;
        $targetProfitAmount = $netAideaFee * ($targetProfitability / 100);
        $manpowerBudget = $netAideaFee - $targetProfitAmount;

        return response()->json([
            'budget_allocation' => $budgetAllocation,
            'latest_version' => $latestVersion,
            'direct_cost' => $directCost,
            'contract_fee_vat_excl' => $contractFeeVatExcl,
            'net_aidea_fee' => $netAideaFee,
            'target_profit_amount' => $targetProfitAmount,
            'manpower_budget' => $manpowerBudget,
            'subcon_expenses' => $subconExpenses,
        ]);
    }

    public function getBudgetVersions($projectId) {
        // Logic to fetch project versions based on the project ID
        // This is a placeholder implementation; replace it with actual logic
        $budgetVersions = BudgetVersion::where('project_id', $projectId)
            ->with([
                'project',
                'project_manager',
                'project_architect',
                'budget_other_expenses' => function ($query) {
                    $query->whereNull('deleted_at');
                }
            ])
            ->get();
        return response()->json($budgetVersions);
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // $validated = $request->validate([
        //     'project_details.project_id' => 'required|integer|exists:projects,id',
        //     'project_details.client_id' => 'required|integer|exists:clients,id',
        //     'project_details.project_studio_id' => 'required|integer|exists:studios,id',
        //     'project_details.project_manager_id' => 'required|integer|exists:users,id',
        //     'project_details.project_architect_id' => 'required|integer|exists:users,id',
        //     'project_details.project_version' => 'required|integer',
        //     'other_expenses' => 'array',
        //     'other_expenses.*.id' => 'nullable|integer|exists:budget_other_expenses,id',
        //     'other_expenses.*.expense_type' => 'required|string',
        //     'other_expenses.*.budget_allocated' => 'required|numeric',
        // ]);

        // Get the current draft version (version_number = 0) for the project
        $currentDraft = BudgetVersion::where('project_id', $request['project_details']['project_id'])
            ->where('version_number', 0)
            ->first();

        // Get the max version_number for the project
        $maxVersionNumber = BudgetVersion::where('project_id', $request['project_details']['project_id'])
            ->max('version_number');

        if ($currentDraft) {
            // If there is a current draft, update its version_number to max + 1 (finalize it)
            $currentDraft->version_number = $maxVersionNumber ? $maxVersionNumber + 1 : 1;
            $currentDraft->project_architect_id = $request['project_details']['project_architect_id'];
            $currentDraft->created_by = auth()->user()->id;
            $currentDraft->save();
            $budgetVersion = $currentDraft;

            // Move draft other_expenses to finalized version
            $draftOtherExpenses = BudgetOtherExpense::where('budget_version_id', $currentDraft->id)
            ->where('is_draft', 1)
            ->get();

            foreach ($draftOtherExpenses as $expense) {
            $expense->is_draft = 0;
            $expense->save();
            }
        } else {
            // No draft exists, create a new finalized version
            $budgetVersion = new BudgetVersion();
            $budgetVersion->version_number = $maxVersionNumber ? $maxVersionNumber + 1 : 1;
            $budgetVersion->project_id = $request['project_details']['project_id'];
            $budgetVersion->project_manager_id = $request['project_details']['project_manager_id'];
            $budgetVersion->project_architect_id = $request['project_details']['project_architect_id'];
            $budgetVersion->created_by = auth()->user()->id;
            $budgetVersion->save();
        }

        // Create a new draft version for next edits
        $draftVersion = new BudgetVersion();
        $draftVersion->version_number = 0;
        $draftVersion->project_id = $request['project_details']['project_id'];
        $draftVersion->project_manager_id = $request['project_details']['project_manager_id'];
        $draftVersion->project_architect_id = $request['project_details']['project_architect_id'];
        $draftVersion->created_by = auth()->user()->id;
        $draftVersion->save();

        // Handle other_expenses for the new draft version
        $previousDraftId = $currentDraft ? $currentDraft->id : null;
        $draftOtherExpenses = $previousDraftId
            ? BudgetOtherExpense::where('budget_version_id', $previousDraftId)->where('is_draft', 1)->get()
            : collect();

        if ($draftOtherExpenses->count()) {
            // Move previous draft other_expenses to finalized version
            foreach ($draftOtherExpenses as $expense) {
            $expense->is_draft = 0;
            $expense->budget_version_id = $budgetVersion->id;
            $expense->save();
            }
        }

        // Create new other_expenses for the new draft version
        if (isset($request['other_expenses']) && is_array($request['other_expenses'])) {
            foreach ($request['other_expenses'] as $expenseData) {
                if (
                    isset($expenseData['expense_type'], $expenseData['budget_allocated']) &&
                    $expenseData['expense_type'] !== null &&
                    $expenseData['budget_allocated'] !== null
                ) {
                    $expense = new BudgetOtherExpense();
                    $expense->budget_version_id = $draftVersion->id;
                    $expense->expense_type = $expenseData['expense_type'];
                    $expense->budget_allocated = $expenseData['budget_allocated'];
                    $expense->is_draft = 1;
                    $expense->save();
                }
            }
        }

        return response()->json([
            'finalized_version' => $budgetVersion->load(['budget_other_expenses']),
            'current_version' => $draftVersion->load(['budget_other_expenses']),
        ], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        //
    }
}