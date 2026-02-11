<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetSubconExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'project_code',
        'trade',
        'consultant_type',
        'subcon_id',
        'subcon_name',
        'budget_allocated'
    ];

    public function project() {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }
}