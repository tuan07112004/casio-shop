<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'guest_name', 'guest_phone', 'guest_email', 'guest_address',
        'payment_method', 'payment_status', 'status', 'total_amount', 'note',
        'voucher_code', 'discount_amount', 'shipping_fee', 'delivery_type',
        'shipping_method', 'ghn_service_id',
    ];

    protected $casts = [
        'total_amount' => 'integer',
        'discount_amount' => 'integer',
        'shipping_fee' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}