<?php

namespace App\Services;

use App\Models\ShopVoucher;
use RuntimeException;

class VoucherService
{
    /**
     * @param  array<int, array{product_id: int, line_total: int}>  $lines
     * @return array{voucher: ShopVoucher, discount: int, eligible_subtotal: int, shipping_discount?: int, free_shipping?: bool}
     */
    public function resolve(
        string $code,
        array $lines,
        int $shippingFee = 0,
        string $deliveryType = 'delivery',
    ): array {
        $normalized = strtoupper(trim($code));
        if ($normalized === '') {
            throw new RuntimeException('Vui lòng nhập mã giảm giá.');
        }

        $voucher = ShopVoucher::query()
            ->whereRaw('UPPER(CONCAT(code_prefix, code_suffix)) = ?', [$normalized])
            ->first();

        if (! $voucher) {
            throw new RuntimeException('Mã giảm giá không hợp lệ.');
        }

        if (! $voucher->isCurrentlyActive()) {
            throw new RuntimeException('Mã giảm giá đã hết hạn hoặc không còn hiệu lực.');
        }

        $subtotal = array_sum(array_column($lines, 'line_total'));
        $eligibleSubtotal = $this->eligibleSubtotal($voucher, $lines);

        if ($eligibleSubtotal <= 0) {
            throw new RuntimeException('Mã giảm giá không áp dụng cho sản phẩm trong giỏ.');
        }

        if ($voucher->min_order_value > 0 && $subtotal < $voucher->min_order_value) {
            throw new RuntimeException(
                'Đơn hàng tối thiểu '.number_format($voucher->min_order_value, 0, ',', '.').'₫ để dùng mã này.'
            );
        }

        if ($voucher->max_uses !== null) {
            $used = $this->countVoucherUses($voucher->fullCode());
            if ($used >= $voucher->max_uses) {
                throw new RuntimeException('Mã giảm giá đã hết lượt sử dụng.');
            }
        }

        if ($voucher->discount_type === 'free_shipping' || $voucher->voucher_type === 'free_ship') {
            if ($deliveryType === 'pickup') {
                throw new RuntimeException('Mã miễn phí ship chỉ áp dụng khi giao tận nơi.');
            }
            if ($shippingFee <= 0) {
                throw new RuntimeException('Chọn địa chỉ giao hàng để áp dụng mã miễn phí ship.');
            }

            return [
                'voucher' => $voucher,
                'discount' => 0,
                'eligible_subtotal' => $eligibleSubtotal,
                'shipping_discount' => $shippingFee,
                'free_shipping' => true,
            ];
        }

        $discount = $this->calculateDiscount($voucher, $eligibleSubtotal);

        return [
            'voucher' => $voucher,
            'discount' => $discount,
            'eligible_subtotal' => $eligibleSubtotal,
        ];
    }

    /**
     * @param  list<string>  $codes
     * @param  array<int, array{product_id: int, line_total: int}>  $lines
     * @return array{
     *   discount: int,
     *   shipping_discount: int,
     *   free_shipping: bool,
     *   codes: list<string>,
     *   items: list<array<string, mixed>>,
     *   vouchers: list<ShopVoucher>
     * }
     */
    public function resolveMany(
        array $codes,
        array $lines,
        int $shippingFee = 0,
        string $deliveryType = 'delivery',
    ): array {
        $normalized = [];
        foreach ($codes as $code) {
            $value = strtoupper(trim($code));
            if ($value === '') {
                continue;
            }
            if (in_array($value, $normalized, true)) {
                throw new RuntimeException('Không thể nhập trùng mã giảm giá.');
            }
            $normalized[] = $value;
        }

        if (count($normalized) > 2) {
            throw new RuntimeException('Chỉ được áp dụng tối đa 2 mã giảm giá.');
        }

        if ($normalized === []) {
            return [
                'discount' => 0,
                'shipping_discount' => 0,
                'free_shipping' => false,
                'codes' => [],
                'items' => [],
                'vouchers' => [],
            ];
        }

        $totalDiscount = 0;
        $shippingDiscount = 0;
        $items = [];
        $vouchers = [];

        foreach ($normalized as $code) {
            $remainingShipping = max(0, $shippingFee - $shippingDiscount);
            $result = $this->resolve($code, $lines, $remainingShipping, $deliveryType);
            $isFreeShip = (bool) ($result['free_shipping'] ?? false);

            if ($isFreeShip) {
                if ($shippingDiscount > 0) {
                    throw new RuntimeException('Chỉ được dùng một mã miễn phí vận chuyển.');
                }
                $shippingDiscount = (int) $result['shipping_discount'];
            } else {
                if ($totalDiscount > 0) {
                    throw new RuntimeException('Chỉ được dùng một mã giảm giá tiền.');
                }
                $totalDiscount = (int) $result['discount'];
            }

            $voucher = $result['voucher'];
            $items[] = [
                'code' => $voucher->fullCode(),
                'discount' => (int) $result['discount'],
                'free_shipping' => $isFreeShip,
                'shipping_discount' => (int) ($result['shipping_discount'] ?? 0),
                'discount_type' => $voucher->discount_type,
                'voucher_type' => $voucher->voucher_type,
                'min_order_value' => $voucher->min_order_value,
            ];
            $vouchers[] = $voucher;
        }

        return [
            'discount' => $totalDiscount,
            'shipping_discount' => $shippingDiscount,
            'free_shipping' => $shippingDiscount > 0,
            'codes' => array_map(fn (ShopVoucher $v) => $v->fullCode(), $vouchers),
            'items' => $items,
            'vouchers' => $vouchers,
        ];
    }

    private function countVoucherUses(string $fullCode): int
    {
        return \App\Models\Order::query()
            ->where('voucher_code', $fullCode)
            ->orWhere('voucher_code', 'like', $fullCode.',%')
            ->orWhere('voucher_code', 'like', '%,'.$fullCode)
            ->orWhere('voucher_code', 'like', '%,'.$fullCode.',%')
            ->count();
    }

    /** @param  array<int, array{product_id: int, line_total: int}>  $lines */
    private function eligibleSubtotal(ShopVoucher $voucher, array $lines): int
    {
        if ($voucher->voucher_type === 'product') {
            $ids = array_map('intval', $voucher->product_ids ?? []);

            return array_sum(array_map(
                fn ($line) => in_array((int) $line['product_id'], $ids, true) ? (int) $line['line_total'] : 0,
                $lines,
            ));
        }

        return array_sum(array_column($lines, 'line_total'));
    }

    private function calculateDiscount(ShopVoucher $voucher, int $eligibleSubtotal): int
    {
        if ($voucher->discount_type === 'percent') {
            $discount = (int) round($eligibleSubtotal * $voucher->discount_value / 100);
        } else {
            $discount = (int) $voucher->discount_value;
        }

        return min($discount, $eligibleSubtotal);
    }
}
