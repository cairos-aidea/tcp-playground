<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentalTask extends Model
{
    use HasFactory; 

    protected $fillable = [
        'task_name',
        'department_id',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function time_charges() {
        return $this->hasMany(TimeCharge::class, 'departmental_task_id', 'id')
            ->where('time_charge_type', 3);
    }
}
