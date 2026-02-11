<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtherExpense extends Model
{
    use HasFactory;
    protected $fillable = [
        'name'
    ];

    public function budget_other_expenses() {
        return $this->hasMany(BudgetOtherExpense::class, 'other_expense_id', 'id');
    }
}
