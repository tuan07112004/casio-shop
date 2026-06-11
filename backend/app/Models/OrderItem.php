<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'option_ids',
        'variant_label',
        'product_name',
        'price',
        'quantity',
        'line_total',
    ];

    protected $casts = [
        'option_ids' => 'array',
        'price' => 'integer',
        'quantity' => 'integer',
        'line_total' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}