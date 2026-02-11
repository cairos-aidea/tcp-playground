<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Leave extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'start_time',
        'end_time',
        'user_id',
        'leave_type',
        'duration_hrs',
        'duration_mns',
        'description',
        'isWholeDay',
        // 'status',
        // 'reason',
        'created_at',
        'updated_at',
    ];
}
