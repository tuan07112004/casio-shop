<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'price',
        'image',
        'category',
        'description',
        'hover_image',
        'price_like_new',
        'price_85',
        'price_70',
        'price_55',
        'colors',
        'gallery_main_image',
        'gallery_video',
    ];

    protected $casts = [
        'price' => 'integer',
        'price_like_new' => 'integer',
        'price_85' => 'integer',
        'price_70' => 'integer',
        'price_55' => 'integer',
        'colors' => 'array',
    ];
}
