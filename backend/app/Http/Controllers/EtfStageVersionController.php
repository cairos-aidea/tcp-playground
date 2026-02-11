<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Etf;
use App\Models\EtfStageVersion;
use App\Models\User;
use Illuminate\Http\Request;

class EtfStageVersionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // TODO: Return a list of EtfStageVerion resources
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Store a new EtfStageVerion resource
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // TODO: Show a specific EtfStageVerion resource
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // TODO: Update a specific EtfStageVerion resource
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // TODO: Delete a specific EtfStageVerion resource
    }

    /**
     * Update the start and end dates of an ETF stage version.
     */
    /**
     * Update the start and end dates of multiple ETF stage versions.
     */
    public function updateDates(Request $request)
    {
        $data = $request->all();

        // Collect all IDs to update in one go
        $idsToUpdate = collect($data)->pluck('id')->all();
        $stageVersionsToUpdate = EtfStageVersion::whereIn('id', $idsToUpdate)->get()->keyBy('id');

        // Bulk update start_date and end_date
        foreach ($data as $item) {
            if (isset($stageVersionsToUpdate[$item['id']])) {
            $stageVersion = $stageVersionsToUpdate[$item['id']];
            $stageVersion->start_date = $item['start_date'];
            $stageVersion->end_date = $item['end_date'];
            $stageVersion->save();
            }
        }

        // Use the first updated stage version for project_code reference
        $projectCode = $stageVersionsToUpdate->first()->project_code ?? null;
        if (!$projectCode) {
            return response()->json([], 200);
        }

        // Get all stage version IDs for the project
        $stageVersionIds = EtfStageVersion::where('project_code', $projectCode)->pluck('id')->all();

        // Get all affected Etfs in one query
        $affectedEtfs = Etf::where('is_actual', 0)
            ->whereIn('etf_stage_version_id', $stageVersionIds)
            ->whereNull('deleted_at')
            ->get();

        // Prepare a cache for stage versions by id
        $stageVersionsById = EtfStageVersion::whereIn('id', $stageVersionIds)->get()->keyBy('id');

        foreach ($affectedEtfs as $etf) {
            $stageVersion = $stageVersionsById->get($etf->etf_stage_version_id);
            if ($stageVersion) {
            // If etf's start_date or end_date is not within the stage version's date range, mark as deleted
            if (
                $etf->start_date <= $stageVersion->start_date &&
                $etf->end_date >= $stageVersion->end_date
            ) {
                // $etf->deleted_at = now();
                // $etf->save();
            }
            }
        }

        // Refresh affected Etfs after updates
        $affectedEtfs = Etf::where('is_actual', 0)
            ->whereIn('etf_stage_version_id', $stageVersionIds)
            ->whereNull('deleted_at')
            ->get();

        // Get all users referenced by affectedEtfs in one query
        $userIds = $affectedEtfs->pluck('user_id')->unique()->all();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $result = $affectedEtfs->map(function ($etf) use ($users) {
            $user = $users->get($etf->user_id);
            return [
                'id' => $etf->id,
                'user_id' => $etf->user_id,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'employee_id' => $user->employee_id,
                    'rank' => $user->rank,
                    'department_id' => $user->departmentRelation->name ?? null,
                    'is_active' => $user->is_active,
                ] : null,
                'stage_id' => $etf->etf_stage_version_id,
                'start_date' => Carbon::parse($etf->start_date, 'Asia/Singapore')->toDateString(),
                'end_date' => Carbon::parse($etf->end_date, 'Asia/Singapore')->toDateString(),
                'etf_hours' => $etf->etf_hours,
                'is_subsidiary_manpower' => $etf->is_subsidiary_manpower,
                'is_actual' => $etf->is_actual,
            ];
        });

        return response()->json($result, 200);
    }
}