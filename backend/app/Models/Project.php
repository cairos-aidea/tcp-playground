<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model {
    use HasFactory;
    protected $fillable = [
        'project_code',
        'project_name',
        'studio',
        'project_status',
        'is_probono',
        'is_marketing',
        'allow_no_dates',
        'owner_id',
        'client_id'
    ];

    public function stages(){
        return $this->hasMany(ProjectStage::class, 'project_code', 'project_code');
    }

    public function etfStages(){
        return $this->hasMany(EtfStageVersion::class, 'project_code', 'project_code');
    }

    public function owner() {
        return $this->belongsTo(User::class, 'owner_id', 'id')
        ->select(['id', 'role_id', 'name', 'email', 'employee_id', 'rank', 'subsidiary_id', 'department_id', 'company']);
    }

    public function client() {
        return $this->belongsTo(Company::class, 'client_id', 'id');
    }
    
    public function project_studio() {
        return $this->belongsTo(Department::class, 'studio_id', 'id');
    }    

    public function budget_allocation() {
        return $this->hasOne(BudgetAllocation::class, 'project_id', 'id');
    }

    public function budget_subcon_expenses() {
        return $this->hasMany(BudgetSubconExpense::class, 'project_id', 'id');
    }

   public function time_charges() {
        return $this->hasMany(TimeCharge::class, 'project_id', 'id')
            ->where('time_charge_type', 1);
    }
};
