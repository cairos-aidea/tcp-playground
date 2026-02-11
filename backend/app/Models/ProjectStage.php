<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectStage extends Model {
    use HasFactory;
    protected $fillable = [
        'project_code',
        'stage_name',
        'description',
        'start_date',
        'end_date',
        'is_onhold',
        'u_coreservices',
        'phase'
    ];

    public function project() {
        return $this->belongsTo(Project::class, 'project_code', 'project_code');
    }
}
