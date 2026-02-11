<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetOtherExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_version_id',
        'expense_type',
        'other_expense_id',
        'budget_allocated',
        'is_draft',
    ];

    public function budget_version() {
        return $this->belongsTo(BudgetVersion::class, 'budget_version_id', 'id');
    }

    public function other_expense() {
        return $this->belongsTo(OtherExpense::class, 'other_expense_id', 'id');
    }
}