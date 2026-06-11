<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ShopPromotionItem;
use Illuminate\Support\Collection;

class PromotionService
{
    /** @var Collection<int, ShopPromotionItem|null> */
    private Collection $cache;

    public function __construct()
    {
        $this->cache = collect();
    }

    public function activeItemFor(int $productId): ?ShopPromotionItem
    {
        if ($this->cache->has($productId)) {
            return $this->cache->get($productId);
        }

        $item = ShopPromotionItem::query()
            ->with('promotion')
            ->where('product_id', $productId)
            ->where('is_enabled', true)
            ->whereHas('promotion', function ($query) {
                $query->where('is_active', true)
                    ->where('starts_at', '<=', now())
                    ->where('ends_at', '>=', now());
            })
            ->orderByDesc('discount_percent')
            ->first();

        $this->cache->put($productId, $item);

        return $item;
    }

    public function discountedPrice(int $basePrice, int $productId): int
    {
        $item = $this->activeItemFor($productId);
        if (! $item || $basePrice <= 0) {
            return $basePrice;
        }

        return $this->applyPercent($basePrice, (int) $item->discount_percent);
    }

    /** @return array<string, mixed>|null */
    public function forProduct(Product $product): ?array
    {
        $item = $this->activeItemFor($product->id);
        if (! $item) {
            return null;
        }

        $basePrice = $this->resolveBasePrice($product);
        if ($basePrice <= 0) {
            return null;
        }

        $percent = (int) $item->discount_percent;
        $salePrice = $this->applyPercent($basePrice, $percent);

        return [
            'active' => true,
            'promotion_id' => $item->promotion_id,
            'name' => $item->promotion?->name ?? '',
            'discount_percent' => $percent,
            'compare_at_price' => $basePrice,
            'sale_price' => $salePrice,
        ];
    }

    public function resolveBasePrice(Product $product): int
    {
        $variants = $product->variants;
        if (is_array($variants) && ! empty($variants['skus'])) {
            $prices = collect($variants['skus'])
                ->map(fn ($sku) => (int) ($sku['price'] ?? 0))
                ->filter(fn ($price) => $price > 0);

            if ($prices->isNotEmpty()) {
                return (int) $prices->min();
            }
        }

        return (int) $product->price;
    }

    private function applyPercent(int $price, int $percent): int
    {
        $percent = max(1, min(99, $percent));

        return (int) round($price * (100 - $percent) / 100);
    }
}
