<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'contract_fee',
        'vat_percentage',
        'target_profitability'
    ];

    public function project() {
        return $this->belongsTo(Project::class, 'project_id', 'id');
    }

}