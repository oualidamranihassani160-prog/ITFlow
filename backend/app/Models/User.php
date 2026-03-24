<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\Hashidable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, Hashidable;

    const ROLE_ADMIN = 'admin';
    const ROLE_MANAGER = 'manager';
    const ROLE_EMPLOYEE = 'employee';

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'job_title', 'employment_type',
        'phone_number', 'avatar',
        'address', 'national_id', 'date_of_birth',
        'education_level', 'field_of_study', 'university',
        'certifications', 'years_of_experience',
        'linkedin_url', 'github_url',
        'contract_type', 'contract_start_date', 'contract_end_date',
        'salary', 'hire_date',
        'manager_id', 'created_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'hire_date'            => 'date',
            'date_of_birth'        => 'date',
            'contract_start_date'  => 'date',
            'contract_end_date'    => 'date',
            'salary'               => 'decimal:2',
        ];
    }

    // Relationships
    public function manager(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function employees(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    public function tasksAssigned(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class, 'employee_id');
    }

    public function tasksCreated(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class, 'manager_id');
    }

    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Notification::class)->orderByDesc('created_at');
    }

    public function unreadNotifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Notification::class)->whereNull('read_at');
    }

    // Role helpers
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isEmployee(): bool
    {
        return $this->role === self::ROLE_EMPLOYEE;
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        return null;
    }
}
