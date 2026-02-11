<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Leave;

use Auth;
use App\Models\LeaveCredit;

class LeaveController extends Controller {

    public function leave_credits($id){
        $user_id = $id;
        $leaveCredits = LeaveCredit::where('user_id', $user_id)->get();
        return response()->json($leaveCredits);
    }

    public function index(Request $request) {
        $year = $request->get('year', '');
        $start_of_year = $year . "-01-01";
        $end_of_year = $year . "-12-31";
        $user_id = Auth::user()->id;

        $leaves = Leave::where("user_id", $user_id)->where('start_time', '>=', $start_of_year)->where('end_time', '<=', $end_of_year)->get();
        return $leaves;
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function create() {
        //
    }
    
    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function store(Request $request) {
        //
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

    public function update(Request $request, Project $project) {
        //
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function destroy(Project $project) {
        //
    }
}
