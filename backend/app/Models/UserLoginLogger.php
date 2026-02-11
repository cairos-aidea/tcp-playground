<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLoginLogger extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_ip',
        'user_id',
        'attempts',
        'type',
        'session',
        'response'
    ];
}
