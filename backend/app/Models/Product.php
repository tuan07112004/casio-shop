<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'id',
        'name',
        'price',
        'original_price',
        'image',
        'category',
        'stock',
        'description',
    ];
    
}
