<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// use Laravel\Sanctum\HasApiTokens;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_id',
        'email',
        'password',
        'name',
        'first_name',
        'last_name',
        'job_title',
        'profile',
        'status',
        'user_type',
        'employee_id',
        'rank',
        'company',
        'subsidiary_id',
        'department_id',
        'sex',
        'is_active',
        'hire_date'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function department() {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function subsidiary() {
        return $this->belongsTo(Subsidiary::class, 'subsidiary_id', 'id');
    }

    public function departmentRelation()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    // public function rank() {
    //     return $this->belongsTo(Rank::class, 'rank', 'id');
    // }
}
