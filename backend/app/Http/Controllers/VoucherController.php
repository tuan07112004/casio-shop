<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShopVoucher;
use App\Services\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $productId = $request->query('product_id');

        $vouchers = ShopVoucher::query()
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->where('voucher_type', '!=', 'private')
            ->orderBy('id')
            ->get()
            ->filter(function (ShopVoucher $v) use ($productId) {
                if (in_array($v->voucher_type, ['shop', 'free_ship'], true)) {
                    return true;
                }

                if ($v->voucher_type === 'product') {
                    if (! $productId) {
                        return false;
                    }

                    return in_array((int) $productId, $v->product_ids ?? [], true);
                }

                return false;
            })
            ->values()
            ->map(fn (ShopVoucher $v) => $this->mapVoucher($v));

        return response()->json($vouchers);
    }

    /** Voucher áp dụng được cho giỏ hàng (shop + product) */
    public function checkout(Request $request): JsonResponse
    {
        $raw = $request->query('product_ids', '');
        $productIds = array_values(array_unique(array_filter(array_map(
            'intval',
            is_array($raw) ? $raw : explode(',', (string) $raw),
        ))));

        $vouchers = ShopVoucher::query()
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->whereIn('voucher_type', ['shop', 'product', 'free_ship'])
            ->orderBy('id')
            ->get()
            ->filter(function (ShopVoucher $v) use ($productIds) {
                if (in_array($v->voucher_type, ['shop', 'free_ship'], true)) {
                    return true;
                }

                if ($v->voucher_type === 'product' && $productIds !== []) {
                    return count(array_intersect(
                        $productIds,
                        array_map('intval', $v->product_ids ?? []),
                    )) > 0;
                }

                return false;
            })
            ->values()
            ->map(fn (ShopVoucher $v) => $this->mapVoucher($v));

        return response()->json($vouchers);
    }

    /** Kiểm tra mã giảm giá trước khi đặt hàng */
    public function validateCode(Request $request, VoucherService $voucherService): JsonResponse
    {
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:20'],
            'codes' => ['nullable', 'array', 'max:2'],
            'codes.*' => ['string', 'max:20'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.option_ids' => ['nullable', 'array'],
            'items.*.option_ids.*' => ['string', 'max:50'],
            'shipping_fee' => ['nullable', 'integer', 'min:0'],
            'delivery_type' => ['nullable', 'in:delivery,pickup'],
        ]);

        $codes = $data['codes'] ?? [];
        if ($codes === [] && ! empty($data['code'])) {
            $codes = [$data['code']];
        }

        if ($codes === []) {
            return response()->json(['message' => 'Vui lòng nhập mã giảm giá.'], 422);
        }

        $lines = $this->buildVoucherLines($data['items']);

        try {
            $result = $voucherService->resolveMany(
                $codes,
                $lines,
                (int) ($data['shipping_fee'] ?? 0),
                $data['delivery_type'] ?? 'delivery',
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'codes' => $result['codes'],
            'discount' => $result['discount'],
            'free_shipping' => $result['free_shipping'],
            'shipping_discount' => $result['shipping_discount'],
            'items' => $result['items'],
            'code' => $result['codes'][0] ?? null,
        ]);
    }

    public function adminIndex(): JsonResponse
    {
        $vouchers = ShopVoucher::query()
            ->orderBy('id')
            ->get()
            ->map(fn (ShopVoucher $v) => $this->mapVoucher($v));

        return response()->json($vouchers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $voucher = ShopVoucher::create($data);

        return response()->json([
            'message' => 'Tạo voucher thành công.',
            'voucher' => $this->mapVoucher($voucher),
        ], 201);
    }

    public function update(Request $request, ShopVoucher $voucher): JsonResponse
    {
        $data = $this->validated($request, $voucher->id);
        $voucher->update($data);

        return response()->json([
            'message' => 'Cập nhật voucher thành công.',
            'voucher' => $this->mapVoucher($voucher->fresh()),
        ]);
    }

    public function destroy(ShopVoucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json([
            'message' => 'Đã xóa voucher.',
        ]);
    }

    private function rules(Request $request, ?int $ignoreId = null): array
    {
        $prefix = strtoupper($request->input('code_prefix', 'LYTU'));
        $type = $request->input('voucher_type', 'shop');

        return [
            'name' => ['required', 'string', 'max:100'],
            'voucher_type' => ['required', 'in:shop,product,private,free_ship'],
            'product_ids' => [
                Rule::requiredIf($type === 'product'),
                'nullable',
                'array',
                'min:1',
            ],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'code_prefix' => ['sometimes', 'string', 'max:10', 'regex:/^[A-Za-z0-9]+$/'],
            'code_suffix' => [
                'required',
                'string',
                'min:1',
                'max:5',
                'regex:/^[A-Za-z0-9]+$/',
                Rule::unique('shop_vouchers')
                    ->where(fn ($q) => $q->where('code_prefix', $prefix))
                    ->ignore($ignoreId),
            ],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'discount_value' => $type === 'free_ship'
                ? ['nullable', 'integer', 'min:0', 'max:0']
                : ['required', 'integer', 'min:1000', 'max:999999999'],
            'min_order_value' => ['nullable', 'integer', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_user' => ['nullable', 'integer', 'min:1', 'max:99'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate($this->rules($request, $ignoreId));
        $data['code_prefix'] = strtoupper($data['code_prefix'] ?? 'LYTU');
        $data['code_suffix'] = strtoupper($data['code_suffix']);
        if (($data['voucher_type'] ?? 'shop') === 'free_ship') {
            $data['discount_type'] = 'free_shipping';
            $data['discount_value'] = 0;
            $data['min_order_value'] = (int) ($data['min_order_value'] ?? 0);
        } else {
            $data['discount_type'] = 'fixed';
            $data['discount_value'] = (int) ($data['discount_value'] ?? 0);
            $data['min_order_value'] = (int) ($data['min_order_value'] ?? 0);
        }

        $data['max_uses_per_user'] = (int) ($data['max_uses_per_user'] ?? 1);
        $data['is_active'] = $data['is_active'] ?? true;

        if (($data['voucher_type'] ?? 'shop') !== 'product') {
            $data['product_ids'] = null;
        } else {
            $data['product_ids'] = array_values(array_unique(array_map('intval', $data['product_ids'] ?? [])));
        }

        return $data;
    }

    /** @param  array<int, array{product_id: int, quantity: int, option_ids?: array}>  $items */
    private function buildVoucherLines(array $items): array
    {
        $lines = [];

        foreach ($items as $row) {
            $product = Product::findOrFail($row['product_id']);
            $optionIds = array_values($row['option_ids'] ?? []);
            $resolved = $product->resolveSku($optionIds);
            $qty = (int) $row['quantity'];
            $lines[] = [
                'product_id' => $product->id,
                'line_total' => (int) $resolved['price'] * $qty,
            ];
        }

        return $lines;
    }

    private function mapVoucher(ShopVoucher $voucher): array
    {
        return [
            'id' => $voucher->id,
            'name' => $voucher->name,
            'voucher_type' => $voucher->voucher_type ?? 'shop',
            'product_ids' => $voucher->product_ids ?? [],
            'code_prefix' => $voucher->code_prefix,
            'code_suffix' => $voucher->code_suffix,
            'code' => $voucher->fullCode(),
            'starts_at' => $voucher->starts_at?->toIso8601String(),
            'ends_at' => $voucher->ends_at?->toIso8601String(),
            'discount_type' => $voucher->discount_type,
            'discount_value' => $voucher->discount_value,
            'min_order_value' => $voucher->min_order_value,
            'max_uses' => $voucher->max_uses,
            'max_uses_per_user' => $voucher->max_uses_per_user,
            'is_active' => $voucher->is_active,
            'is_live' => $voucher->isCurrentlyActive(),
        ];
    }
}
