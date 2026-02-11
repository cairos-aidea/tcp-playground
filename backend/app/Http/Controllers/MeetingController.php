<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Meeting;

use Auth;

class MeetingController extends Controller {
    
    public function index(Request $request) {
        $start_date = $request->get('start_date', '');
        $end_date = $request->get('end_date', '');

        if(!empty($start_date) && $end_date) {
            $time_charges = Meeting::where("isConverted", 0)->where("user_id", Auth::user()->id)->where("start_at", ">=", $start_date)->where("end_at", "<=", $end_date)->get();
        } else {
            $time_charges = Meeting::where("isConverted", 0)->where("user_id", Auth::user()->id)->get();
        }

        return $time_charges;
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
