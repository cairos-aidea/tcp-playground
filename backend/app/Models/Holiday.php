<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Holiday extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'holiday_title',
        'holiday_type',
        'description',
        'date',
        'isFixedDate',
        'created_by',
        'updated_by',
    ];
}
