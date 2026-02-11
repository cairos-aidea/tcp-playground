<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimeCharge extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'time_charge_date',
        'user_id',
        'start_time',
        'end_time',
        'duration_hrs',
        'duration_min',
        'is_ot',
        'next_day_ot',
        'time_charge_type',
        'project_id',
        'project_code',
        'project_label',
        'stage_id',
        'stage_label',
        'departmental_task_id',
        'activity',
        'remarks',
        'status',
        'approver_id'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id')
            ->select(['id', 'role_id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id', 'company', 'first_name', 'last_name', 'profile']);
    }

    public function time_charge_logs() {
        return $this->hasMany(TimeChargeLog::class, 'time_charge_id')->with(['user'])->latest();
    }

    public function projects_external() {
        return $this->belongsTo(Project::class, 'project_id', 'id')
            ->where('time_charge_type', 1);
    }

    public function projects_internal() {
        return $this->belongsTo(ProjectInternal::class, 'project_id', 'id')
            ->where('time_charge_type', 2);
    }

    public function departmental_tasks() {
        return $this->belongsTo(DepartmentalTask::class, 'departmental_task_id', 'id')
            ->where('time_charge_type', 3);
    }
};