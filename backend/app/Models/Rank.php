<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rank extends Model
{
    protected $fillable = [
        'name',
        'bec_rate',
        'year',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}