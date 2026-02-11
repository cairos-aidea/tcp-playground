<?php

namespace App\Models;

use App\Models\Subsidiary;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectInternal extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_code',
        'project_name',
        'subsidiary_id',
        'project_status',
        'start_date',
        'end_date',
        'is_indefinite_date',
        'owner_id'
    ];

    public function subsidiary()
    {
        return $this->belongsTo(Subsidiary::class, 'subsidiary_id');
    }

    public function owner() {
        return $this->belongsTo(User::class, 'owner_id', 'id')
        ->select(['id', 'role_id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id', 'company']);
    }

    public function time_charges() {
        return $this->hasMany(TimeCharge::class, 'project_id', 'id')
            ->where('time_charge_type', 2);
    }
}
