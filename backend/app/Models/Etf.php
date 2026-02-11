<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etf extends Model
{
    use HasFactory;

    protected $fillable = [
        'etf_stage_version_id',
        'user_id',
        'start_date',
        'end_date',
        'etf_hours',
        'etf_rank_id',
        'priority',
        'is_subsidiary_manpower',
        'is_actual'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id')
            ->select(['id', 'role_id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id', 'company', 'is_active']);
    }
};
