<?php

return [
    ################ FOR SCHEDULER OF MS TEAMS NOTIFS ################

    'date_start'      => env('TIMECHARGE_DATE_START', '2025-07-01'), // Date to start gathering data
    'sender_email'    => env('TIMECHARGE_SENDER_EMAIL', 'j.pamittan@aidea.co'),
    'schedule_time'   => env('TIMECHARGE_SCHEDULE_TIME', '08:00'),
    'schedule_difference' => (int) env('TIMECHARGE_SCHEDULE_DIFFERENCE', 2),
    'schedule_days'   => explode(',', env('TIMECHARGE_SCHEDULE_DAYS', 'all')),
    'timecharge.portal_url' => env('TIMECHARGE_PORTAL_URL', 'https://time-staging.aidea.co'),

    ################ FOR SCHEDULER OF MS TEAMS NOTIFS ################

];
