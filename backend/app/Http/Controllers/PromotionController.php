<?php

namespace App\Http\Controllers;

use App\Models\ShopPromotion;
use App\Models\ShopPromotionItem;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller
{
    public function __construct(private PromotionService $promotions) {}

    public function index(): JsonResponse
    {
        $rows = ShopPromotion::query()
            ->withCount('items')
            ->with([
                'items' => function ($query) {
                    $query->with('product')->orderBy('id')->limit(5);
                },
            ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (ShopPromotion $promotion) => $this->mapPromotion($promotion, preview: true));

        return response()->json($rows);
    }

    public function show(ShopPromotion $promotion): JsonResponse
    {
        $promotion->load(['items.product']);

        return response()->json($this->mapPromotion($promotion, true));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePromotion($request);
        $promotion = ShopPromotion::create($data);

        return response()->json([
            'message' => 'Tạo chương trình khuyến mãi thành công.',
            'promotion' => $this->mapPromotion($promotion->fresh()->loadCount('items')),
        ], 201);
    }

    public function update(Request $request, ShopPromotion $promotion): JsonResponse
    {
        $data = $this->validatePromotion($request);
        $promotion->update($data);

        return response()->json([
            'message' => 'Cập nhật chương trình khuyến mãi thành công.',
            'promotion' => $this->mapPromotion($promotion->fresh()->loadCount('items')),
        ]);
    }

    public function destroy(ShopPromotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json([
            'message' => 'Đã xóa chương trình khuyến mãi.',
        ]);
    }

    public function syncItems(Request $request, ShopPromotion $promotion): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.discount_percent' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.is_enabled' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($promotion, $data) {
            $incomingIds = collect($data['items'])->pluck('product_id')->unique()->values();

            $promotion->items()
                ->whereNotIn('product_id', $incomingIds)
                ->delete();

            foreach ($data['items'] as $row) {
                ShopPromotionItem::updateOrCreate(
                    [
                        'promotion_id' => $promotion->id,
                        'product_id' => $row['product_id'],
                    ],
                    [
                        'discount_percent' => (int) $row['discount_percent'],
                        'is_enabled' => array_key_exists('is_enabled', $row)
                            ? (bool) $row['is_enabled']
                            : true,
                    ]
                );
            }
        });

        $promotion->load(['items.product']);

        return response()->json([
            'message' => 'Đã cập nhật sản phẩm khuyến mãi.',
            'promotion' => $this->mapPromotion($promotion, true),
        ]);
    }

    public function batchUpdateItems(Request $request, ShopPromotion $promotion): JsonResponse
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:99'],
            'is_enabled' => ['sometimes', 'boolean'],
        ]);

        $productIds = collect($data['product_ids'])->unique()->values();
        $percent = (int) $data['discount_percent'];
        $enabled = $data['is_enabled'] ?? true;

        DB::transaction(function () use ($promotion, $productIds, $percent, $enabled) {
            foreach ($productIds as $productId) {
                ShopPromotionItem::updateOrCreate(
                    [
                        'promotion_id' => $promotion->id,
                        'product_id' => $productId,
                    ],
                    [
                        'discount_percent' => $percent,
                        'is_enabled' => $enabled,
                    ]
                );
            }
        });

        $promotion->load(['items.product']);

        return response()->json([
            'message' => 'Đã cập nhật hàng loạt.',
            'promotion' => $this->mapPromotion($promotion, true),
        ]);
    }

    /** @return array<string, mixed> */
    private function validatePromotion(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:99'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $starts = strtotime((string) $data['starts_at']);
        $ends = strtotime((string) $data['ends_at']);
        if ($starts !== false && $ends !== false && ($ends - $starts) > 180 * 86400) {
            abort(422, 'Thời gian của chương trình không được quá 180 ngày.');
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function mapPromotion(ShopPromotion $promotion, bool $withItems = false, bool $preview = false): array
    {
        $row = [
            'id' => $promotion->id,
            'name' => $promotion->name,
            'discount_percent' => (int) $promotion->discount_percent,
            'starts_at' => $promotion->starts_at?->toIso8601String(),
            'ends_at' => $promotion->ends_at?->toIso8601String(),
            'is_active' => (bool) $promotion->is_active,
            'is_running' => $promotion->isCurrentlyActive(),
            'items_count' => $promotion->items_count ?? $promotion->items->count(),
            'created_at' => $promotion->created_at?->toIso8601String(),
            'updated_at' => $promotion->updated_at?->toIso8601String(),
        ];

        if ($preview) {
            $row['preview_products'] = $promotion->items
                ->map(function (ShopPromotionItem $item) {
                    $product = $item->product;
                    if (! $product) {
                        return null;
                    }

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'image' => $product->image,
                    ];
                })
                ->filter()
                ->values()
                ->all();
        }

        if ($withItems) {
            $row['items'] = $promotion->items->map(function (ShopPromotionItem $item) {
                $product = $item->product;
                $basePrice = $product ? $this->promotions->resolveBasePrice($product) : 0;
                $salePrice = $this->promotions->discountedPrice($basePrice, (int) $item->product_id);

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'discount_percent' => (int) $item->discount_percent,
                    'is_enabled' => (bool) $item->is_enabled,
                    'product' => $product ? [
                        'id' => $product->id,
                        'name' => $product->name,
                        'image' => $product->image,
                        'price' => $basePrice,
                        'sale_price' => $salePrice,
                    ] : null,
                ];
            })->values();
        }

        return $row;
    }
}
