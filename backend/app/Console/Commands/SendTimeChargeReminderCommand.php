<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Holiday;
use App\Models\TimeCharge;
use App\Microsoft\TeamsMessageService;
use App\Models\Leave;
use Illuminate\Support\Facades\Cache;

class SendTimeChargeReminderCommand extends Command
{
    protected $signature = 'reminder:time-charge';
    protected $description = 'Send Teams reminders for incomplete time charges';
    protected $service;

    public function __construct()
    {
        parent::__construct();
        $this->service = new TeamsMessageService();
    }

    public function handle()
    {
        $senderEmail = config('timecharge.sender_email', 'j.pamittan@aidea.co');
        $starterDate = config('timecharge.date_start', '2025-09-22');

        $sender = User::where('email', $senderEmail)->first();
        if (!$sender || !$sender->microsoft_access_token) {
            $this->error("Sender not found or missing Microsoft token.");
            return;
        }

        // Use cache for token and sender ID
        $accessToken = Cache::remember("teams_token_{$senderEmail}", 3300, function () use ($sender, $senderEmail) {
            return $this->service->refreshAccessToken($senderEmail) ?? $sender->microsoft_access_token;
        });

        $senderId = $this->service->getUserId($accessToken, $senderEmail);
        if (!$senderId) {
            $this->error("Failed to retrieve sender ID.");
            return;
        }
        
        $end = Carbon::yesterday();
        $holidays = Holiday::all();

        foreach (User::whereNull('deleted_at')->where('is_active', 'yes')->whereNotNull('email')->cursor() as $user) {
            $userHireDate = $user->hire_date ? Carbon::parse($user->hire_date) : null;
            $start = $userHireDate ? ($userHireDate->gt(Carbon::parse($starterDate)) ? $userHireDate->copy() : Carbon::parse($starterDate)) : Carbon::parse($starterDate);

            if ($start->gt($end)) continue;

            $leaves = Leave::where('user_id', $user->id)
                ->whereBetween('start_time', [$start->toDateString(), $end->toDateString()])
                ->get();

            $leaveMap = [];
            foreach ($leaves as $leave) {
                $leaveMap[Carbon::parse($leave->start_time)->toDateString()][] = $leave;
            }

            $requiredHours = 0;
            for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
                if ($date->isWeekend()) continue;

                $isHoliday = $holidays->contains(fn($h) =>
                    preg_match('/^\d{2}-\d{2}$/', $h->date)
                        ? ($date->format('m-d') == $h->date)
                        : (preg_match('/^\d{4}-\d{2}-\d{2}$/', $h->date)
                            ? ($date->toDateString() == $h->date)
                            : false)
                );

                if (!$isHoliday) {
                    $dayHours = 8;
                    $dateStr = $date->toDateString();

                    if (isset($leaveMap[$dateStr])) {
                        foreach ($leaveMap[$dateStr] as $leave) {
                            $dayHours -= $leave->isWholeDay ? 8 : ((float)$leave->duration_hrs + ((float)$leave->duration_mns / 60));
                        }
                        $dayHours = max($dayHours, 0);
                    }

                    $requiredHours += $dayHours;
                }
            }
            $timeCharges = TimeCharge::where('user_id', $user->id)
                ->where('is_ot', 0)
                ->whereBetween('time_charge_date', [$start->toDateString(), $end->toDateString()])
                ->get(['duration_hrs', 'duration_min']);

            $totalHours = round($timeCharges->reduce(function ($carry, $tc) {
                return $carry + (float)$tc->duration_hrs + ((float)$tc->duration_min / 60);
            }, 0), 2);

            if ($totalHours < $requiredHours) {
                $message = "Hi {$user->first_name},<br><br>"
                    . "This is a friendly reminder to file your time charges.<br><br>"
                    . "Filed: <b>{$totalHours} hours</b><br>"
                    . "Required: <b>{$requiredHours} hours</b><br><br>"
                    . "Please complete your time entries ASAP.<br>"
                    . "You can file them here: <a href=\"" . config('timecharge.portal_url', 'https://time-staging.aidea.co') . "\">"
                    . "AIDEA TIME CHARGING PORTAL</a><br><br>"
                    . "Thank you!";

                $result = $this->service->sendMessage($accessToken, $senderEmail, $user->email, $message, $senderId);

                if ($result['success']) {
                    \Log::info("Reminder sent to {$user->email}. Total hours: {$totalHours}, Required: {$requiredHours}");
                } else {
                    \Log::error("Failed to send to {$user->email}: {$result['error']}");
                }
            }
        }

        $this->info("Reminders completed.");
    }
}