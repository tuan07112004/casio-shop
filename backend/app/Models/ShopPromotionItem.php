<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopPromotionItem extends Model
{
    protected $fillable = [
        'promotion_id',
        'product_id',
        'discount_percent',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'discount_percent' => 'integer',
            'is_enabled' => 'boolean',
        ];
    }

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(ShopPromotion::class, 'promotion_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
