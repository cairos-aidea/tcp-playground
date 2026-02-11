<?php

namespace App\Http\Controllers\Microsoft;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Holiday;
use App\Models\TimeCharge;
use App\Microsoft\TeamsMessageService;

class TeamsMessageController extends Controller
{
  /**
   * Handle a request from the frontend to send a Teams message.
   */
  public function sendTimeChargeReminders(Request $request)
  {
    $teamsMessageService = new TeamsMessageService();

    $validated = $request->validate([
      'token'    => 'required|string',
      'emails'   => 'required|array',
      'month'    => 'required|integer',
      'year'     => 'required|integer',
      'senderId' => 'required|integer',
    ]);

    $emails = $validated['emails'];
    $month = $validated['month'];
    $year = $validated['year'];
    $senderId = $validated['senderId'];
    $sender = User::find($senderId);
    $senderEmail = $sender ? $sender->email : null;

    // Get user IDs for the emails
    $users = User::whereIn('email', $emails)->get(['id', 'first_name', 'email']);
    $userIds = $users->pluck('id', 'email');

    // Get holidays for the month/year
    $holidays = Holiday::all()->filter(function ($holiday) use ($month, $year) {
      // Fixed date holiday: MM-DD
      if (preg_match('/^\d{2}-\d{2}$/', $holiday->date)) {
        return (int)substr($holiday->date, 0, 2) == $month;
      }
      // Specific date holiday: YYYY-MM-DD
      if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $holiday->date)) {
        $date = Carbon::parse($holiday->date);
        return $date->month == $month && $date->year == $year;
      }
      return false;
    });

    // Get working days for the month/year
    $start = Carbon::create($year, $month, 1);
    $end = $start->copy()->endOfMonth();

    // If current month/year, limit to today
    $today = Carbon::today();
    if ($month == $today->month && $year == $today->year) {
      $end = $today;
    }

    $workingDays = [];
    for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
      // Exclude weekends
      if ($date->isWeekend()) continue;
      // Exclude holidays
      $isHoliday = $holidays->contains(function ($holiday) use ($date, $year) {
        if (preg_match('/^\d{2}-\d{2}$/', $holiday->date)) {
          // Fixed date holiday
          return $date->format('m-d') == $holiday->date;
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $holiday->date)) {
          return $date->toDateString() == $holiday->date;
        }
        return false;
      });
      if ($isHoliday) continue;
      $workingDays[] = $date->copy();
    }

    $requiredHours = count($workingDays) * 8 + $holidays->count() * 8;

    $results = [];
    foreach ($users as $user) {
      // Get time charges for user for the month/year, not overtime
      $timeCharges = TimeCharge::where('user_id', $user->id)
        ->where('is_ot', 0)
        ->where()
        ->whereMonth('time_charge_date', $month)
        ->whereYear('time_charge_date', $year)
        ->whereBetween('time_charge_date', [$start->toDateString(), $end->toDateString()])
        ->get();

      $totalHours = $timeCharges->sum('hours'); 

      $isComplete = $totalHours >= $requiredHours;

      // Prepare message if not complete
      if (!$isComplete) {
        // Get recipient's first name
        $recipientFirstName = $user->first_name ?? 'there';
        $monthYear = $start->format('F Y');
        $startDateStr = $start->format('F j, Y');
        $endDateStr = $end->format('F j, Y');
        $message = "Hi {$recipientFirstName},<br><br>"
          . "This is a friendly reminder to file your time charges for <b>{$monthYear}</b>.<br><br>"
          . "Filed: <b>{$totalHours} hours</b><br>"
          . "Required: <b>{$requiredHours} hours</b><br><br>"
          . "Please make sure to complete your time entries as soon as possible.<br>"
          . "Thank you!";

        $teamsMessageService->sendMessage($validated['token'], $senderEmail, $user->email, $message);
      }

      $results[] = [
        'email' => $user->email,
        'total_hours' => $totalHours,
        'required_hours' => $requiredHours,
        'is_complete' => $isComplete,
      ];
    }

    return response()->json($results);
  }
}
