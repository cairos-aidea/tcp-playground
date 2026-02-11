<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveCredit extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'leave_type',
        'description',
        'total_credits',
        'total_balance',
        'credit_left',
        'used_approved',
        'used_pending'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
