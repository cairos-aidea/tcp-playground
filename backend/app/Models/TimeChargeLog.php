<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeChargeLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'time_charge_id',
        'payload',
        'performed_activity'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function time_charge() {
        return $this->belongsTo(TimeCharge::class, 'time_charge_id');
    }
}
