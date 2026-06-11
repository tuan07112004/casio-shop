<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ShopCategory extends Model
{
    protected $fillable = [
        'slug',
        'label',
        'shop_label',
        'sort_order',
    ];

    /** @return list<string> */
    public static function allowedSlugs(): array
    {
        $slugs = static::query()
            ->orderBy('sort_order')
            ->orderBy('label')
            ->pluck('slug')
            ->all();

        if ($slugs !== []) {
            return $slugs;
        }

        return config('shop.categories', ['may-tinh', 'balo', 'phu-kien']);
    }

    public static function uniqueSlug(string $label): string
    {
        $base = Str::slug($label);
        if ($base === '') {
            $base = 'danh-muc';
        }

        $slug = $base;
        $n = 2;

        while (static::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }
}
