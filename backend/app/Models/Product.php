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
    ];
    protected $casts = [
        'price' => 'integer',
    ];
}
