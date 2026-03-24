<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id', 'receiver_id', 'manager_id',
        'body', 'is_group', 'is_managers_group', 'read_at',
        'file_path', 'file_name', 'file_type', 'file_size',
    ];

    // Use the $casts property so Eloquent correctly casts these attributes
    protected $casts = [
        'is_group' => 'boolean',
        'is_managers_group' => 'boolean',
        'read_at'  => 'datetime',
    ];

    // ── Auto encrypt on set, decrypt on get ──────────────────────────────
    public function setBodyAttribute(?string $value): void
    {
        $this->attributes['body'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getBodyAttribute(?string $value): ?string
    {
        if (!$value) return null;
        try {
            return Crypt::decryptString($value);
        } catch (\Exception) {
            return $value; // return raw if decryption fails (old unencrypted data)
        }
    }

    public function sender(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function manager(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }
}