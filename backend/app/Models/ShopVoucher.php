<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopVoucher extends Model
{
    protected $fillable = [
        'name',
        'voucher_type',
        'product_ids',
        'code_prefix',
        'code_suffix',
        'starts_at',
        'ends_at',
        'discount_type',
        'discount_value',
        'min_order_value',
        'max_uses',
        'max_uses_per_user',
        'is_active',
    ];

    protected $casts = [
        'product_ids' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'discount_value' => 'integer',
        'min_order_value' => 'integer',
        'max_uses' => 'integer',
        'max_uses_per_user' => 'integer',
        'is_active' => 'boolean',
    ];

    public function fullCode(): string
    {
        return strtoupper($this->code_prefix.$this->code_suffix);
    }

    public function isCurrentlyActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        return $this->starts_at <= $now && $this->ends_at >= $now;
    }
}
