<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
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
        'variants',
        'gallery_main_image',
        'gallery_video',
        'gallery_images',
    ];

    protected $casts = [
        'price' => 'integer',
        'price_like_new' => 'integer',
        'price_85' => 'integer',
        'price_70' => 'integer',
        'price_55' => 'integer',
        'colors' => 'array',
        'variants' => 'array',
        'gallery_images' => 'array',
    ];

    public function resolveRouteBinding($value, $field = null): ?self
    {
        if (is_numeric($value)) {
            return $this->where('id', $value)->firstOrFail();
        }

        return $this->where('slug', $value)->firstOrFail();
    }

    /** @param  array<int, string>  $optionIds */
    public function resolveSku(array $optionIds): array
    {
        $variants = $this->variants;
        if (! is_array($variants) || empty($variants['skus'])) {
            return [
                'price' => $this->price,
                'stock' => null,
                'label' => '',
            ];
        }

        $sorted = $optionIds;
        sort($sorted);

        foreach ($variants['skus'] as $sku) {
            $ids = $sku['optionIds'] ?? [];
            sort($ids);
            if ($ids === $sorted) {
                return [
                    'price' => (int) ($sku['price'] ?? $this->price),
                    'stock' => array_key_exists('stock', $sku) ? (int) $sku['stock'] : null,
                    'label' => $this->variantLabel($optionIds),
                ];
            }
        }

        if (count($optionIds) > 1) {
            foreach ($variants['skus'] as $sku) {
                $ids = $sku['optionIds'] ?? [];
                if (count(array_intersect($optionIds, $ids)) === count($ids)) {
                    return [
                        'price' => (int) ($sku['price'] ?? $this->price),
                        'stock' => array_key_exists('stock', $sku) ? (int) $sku['stock'] : null,
                        'label' => $this->variantLabel($optionIds),
                    ];
                }
            }
        }

        foreach ($optionIds as $optionId) {
            foreach ($variants['skus'] as $sku) {
                $ids = $sku['optionIds'] ?? [];
                if (count($ids) === 1 && $ids[0] === $optionId) {
                    return [
                        'price' => (int) ($sku['price'] ?? $this->price),
                        'stock' => array_key_exists('stock', $sku) ? (int) $sku['stock'] : null,
                        'label' => $this->variantLabel([$optionId]),
                    ];
                }
            }
        }

        $legacy = $this->resolveLegacyConditionPrice($optionIds);
        if ($legacy) {
            return $legacy;
        }

        return [
            'price' => $this->price,
            'stock' => null,
            'label' => $this->variantLabel($optionIds),
        ];
    }

    /** @param  array<int, string>  $optionIds */
    public function deductStock(array $optionIds, int $qty): void
    {
        $variants = $this->variants;
        if (! is_array($variants) || empty($variants['skus'])) {
            return;
        }

        $sorted = $optionIds;
        sort($sorted);
        $updated = false;

        foreach ($variants['skus'] as &$sku) {
            $ids = $sku['optionIds'] ?? [];
            sort($ids);

            $match = $ids === $sorted;
            if (! $match && count($optionIds) > 1) {
                $match = count(array_intersect($optionIds, $ids)) === count($ids);
            }
            if (! $match && count($ids) === 1 && in_array($ids[0], $optionIds, true)) {
                $match = true;
            }

            if (! $match) {
                continue;
            }

            if (! array_key_exists('stock', $sku)) {
                return;
            }

            $stock = (int) $sku['stock'];
            if ($stock < $qty) {
                throw new \RuntimeException('Sản phẩm "'.$this->name.'" không đủ tồn kho.');
            }

            $sku['stock'] = $stock - $qty;
            $updated = true;
            break;
        }
        unset($sku);

        if ($updated) {
            $this->variants = $variants;
            $this->save();
        }
    }

    /** @param  array<int, string>  $optionIds */
    private function resolveLegacyConditionPrice(array $optionIds): ?array
    {
        $map = [
            'like-new' => $this->price_like_new,
            '85' => $this->price_85,
            '70' => $this->price_70,
            '55' => $this->price_55,
        ];

        foreach ($optionIds as $id) {
            if (! empty($map[$id])) {
                return [
                    'price' => (int) $map[$id],
                    'stock' => null,
                    'label' => $this->variantLabel([$id]),
                ];
            }
        }

        return null;
    }

    /** @param  array<int, string>  $optionIds */
    private function variantLabel(array $optionIds): string
    {
        $variants = $this->variants;
        if (! is_array($variants) || empty($variants['groups'])) {
            return '';
        }

        $labels = [];
        foreach ($optionIds as $optionId) {
            foreach ($variants['groups'] as $group) {
                foreach ($group['options'] ?? [] as $opt) {
                    if (($opt['id'] ?? '') === $optionId) {
                        $labels[] = $opt['label'] ?? '';
                    }
                }
            }
        }

        return implode(' / ', array_filter($labels));
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'san-pham';
        $slug = $base;
        $n = 1;

        while (
            static::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }
}
