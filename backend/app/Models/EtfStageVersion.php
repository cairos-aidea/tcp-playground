<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class EtfStageVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_number',
        'project_code',
        'stage_id',
        'start_date',
        'end_date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_code', 'project_code');
    }

    public function stage()
    {
        return $this->belongsTo(ProjectStage::class, 'stage_id', 'id');
    }
}