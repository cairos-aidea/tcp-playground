<?php

return [

    'microsoft_app_id' => env('MICROSOFT_APP_ID', NULL),

    'microsoft_tenant_id' => env('MICROSOFT_TENANT_ID', NULL),

    'microsoft_secret' => env('MICROSOFT_SECRET', null),

    'microsoft_scope' => env('MICROSOFT_SCOPE', NULL),

    'microsoft_redirect_uri' => env('MICROSOFT_REDIRECT_URI', NULL),

    'corporate_email_domain' => env('CORPORATE_EMAIL_DOMAIN', NULL),

    'mapping' => [
        'first_name' => 'givenName',
        'last_name' => 'surname',
        'nickname' => 'displayName',
        'email' => 'mail',
        'position' => 'jobTitle'
    ],

    'user_roles' => [
        'admin' => [
            'Deputy Medical Director',
            'IT Operations System Administrator',
            'IT Operations Support Specialist',
            'Data Analyst',
            'Software QA and Testing',
            'Vice president of Medical Operations',
            'Junior Software Engineer',
            'iOS Developer',
            'Human Resource',
            'Medical Admin',
            'Admin & Finance Assistant',
            'Software Engineer'
        ],
        'tma' => [
            null,
            'Telemedical Assistant'
        ],
        'crm' => [
            'Marketing and Communications Officer',
            'Clients Relations Management Consultant'
        ],
        'doctor' => [
            'Physician'
        ]
    ]

];
