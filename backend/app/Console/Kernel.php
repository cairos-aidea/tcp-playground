<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Carbon;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        \Log::info('Scheduling time charge reminder command.');
        $scheduleTime = config('timecharge.schedule_time', '08:00');
        $runDays = config('timecharge.schedule_days', ['all']);
        $difference = (int) config('timecharge.schedule_difference', 0);
        $starterDate = config('timecharge.date_start', '2025-09-22');
        \Log::info('Time charge reminder configuration', [
            'schedule_time' => $scheduleTime,
            'run_days' => $runDays,
            'difference' => $difference,
            'starter_date' => $starterDate
        ]);

        $schedule->command('reminder:time-charge')
            ->dailyAt($scheduleTime)
            ->when(function () use ($runDays, $difference, $starterDate) {
                $now = now('Asia/Singapore');

                // Only run if today is starterDate or later
                if ($now->lt(Carbon::parse($starterDate, 'Asia/Singapore'))) {
                    return false;
                }

                // If 'all' is in runDays, run only on weekdays
                if (in_array('all', $runDays)) {
                    // 1 = Monday, 5 = Friday
                    \Log::info('Running on all weekdays');
                    return $now->isWeekday();
                }

                // Check if today matches any adjusted run day (after subtracting $difference), and if not a weekend, or if the adjusted day falls on a weekend, run on the previous working day
                foreach ($runDays as $day) {
                    if ($day === 'last') {
                        $target = $now->copy()->endOfMonth()->subDays($difference);
                    } else {
                        $target = $now->copy()->startOfMonth()->addDays(((int)$day) - 1)->subDays($difference);
                    }

                    // Adjust target backwards if it falls on a weekend
                    while (in_array($target->dayOfWeek, [6, 0])) {
                        $target->subDay();
                    }

                    if ($now->isSameDay($target)) {
                        return true;
                    }
                }
                return false;
            })
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
