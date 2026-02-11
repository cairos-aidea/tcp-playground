<?php

namespace App\Http\Controllers;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function calendarHolidays(Request $request) {
        $year = $request->get('year', '');
        $start_of_year = $year . "-01-01";
        $end_of_year = $year . "-12-31";

        $holidays = Holiday::where("isFixedDate", 1)
            ->orWhere(function ($query) use ($start_of_year, $end_of_year){
                $query->where('isFixedDate', 0)
                    ->where('date', '>=', $start_of_year)
                    ->where('date', '<=', $end_of_year);
            })
            ->whereNull('deleted_at')
            ->get();

        $fixedHolidays = array();
        $dynamicHolidays = array();

        foreach($holidays as $holiday) {
            if($holiday->isFixedDate == 1) {
                $fixedHolidays[] = $holiday;
            } else {
                $dynamicHolidays[] = $holiday;
            }
        }

        $return_data = array(
            "fixedHolidays" => $fixedHolidays,
            "dynamicHolidays" => $dynamicHolidays
        );

        return $return_data;
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function index(Request $request) {
        $holidays = Holiday::whereNull('deleted_at')->get();
        return $holidays;
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function store(Request $request) {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'holiday_title' => 'required|string|max:255',
            'holiday_type' => 'required|string|max:255',
            'date' => 'required|date',
            'isFixedDate' => 'boolean'
        ]);

        $holiday_date = $validated['date'];
        $isFixedDate = isset($validated['isFixedDate']) ? $validated['isFixedDate'] : 0;

        if ($isFixedDate) {
            // Keep only mm-dd
            $holiday_date = date('m-d', strtotime($holiday_date));
        } else {
            // Ensure yyyy-mm-dd
            $holiday_date = date('Y-m-d', strtotime($holiday_date));
        }

        $validated['date'] = $holiday_date;

        $holiday = Holiday::create($validated);

        return response()->json($holiday, 200);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */

    public function update(Request $request, $id) {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        
        $validated = $request->validate([
            'holiday_title' => 'required|string|max:255',
            'holiday_type' => 'required|string|max:255',
            'date' => 'required|date',
            'isFixedDate' => 'boolean'
        ]);

        $holiday = Holiday::find($id);
        if (!$holiday) {
            return response()->json(['message' => 'Holiday not found.'], 404);
        }

        $date = $validated['date'];
        $isFixedDate = isset($validated['isFixedDate']) ? $validated['isFixedDate'] : 0;

        if ($isFixedDate) {
            // Keep only mm-dd
            $date = date('m-d', strtotime($date));
        } else {
            // Ensure yyyy-mm-dd
            $date = date('Y-m-d', strtotime($date));
        }

        $holiday->holiday_title = $validated['holiday_title'];
        $holiday->holiday_type = $validated['holiday_type'];
        $holiday->date = $date;
        $holiday->isFixedDate = $isFixedDate;
        $holiday->save();

        return response()->json($holiday, 200);
    }

    /* ---------------------------------------------------------------- FUNCTION SEPARATOR ---------------------------------------------------------------- */
    
    public function destroy($id) {
        $user = auth()->user();
        if (!$user || !$user->role_id == 3) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $holiday = Holiday::find($id);
        if (!$holiday) {
            return response()->json(['message' => 'Holiday not found.'], 404);
        }

        $holiday->deleted_at = Carbon::now();
        $holiday->save();

        return response()->json(['message' => 'Holiday deleted successfully.'], 200);
    }
}
