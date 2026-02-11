<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_number',
        'project_id',
        'project_manager_id',
        'project_architect_id',
        'is_active'
    ];

    public function project() {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }

    public function project_manager() {
        return $this->belongsTo(User::class, 'project_manager_id', 'id')
            ->select(['id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id']);
    }

    public function project_architect() {
        return $this->belongsTo(User::class, 'project_architect_id', 'id')
            ->select(['id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id']);
    }

    public function budget_other_expenses() {
        return $this->hasMany(BudgetOtherExpense::class, 'budget_version_id', 'id');
    }

    // public function etfs() {
    //     return $this->hasMany(Etf::class, 'budget_version_id', 'id');
    // }

};