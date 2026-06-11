<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\GhnService;
use App\Services\PromotionService;
use App\Services\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;
use RuntimeException;

class OrderController extends Controller
{
    /** Đặt hàng — guest hoặc user (token tùy chọn) */
    public function store(Request $request, VoucherService $voucherService, GhnService $ghn, PromotionService $promotionService): JsonResponse
    {
        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:20', 'regex:/^0\d{8,10}$/'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_address' => ['required', 'string', 'max:500'],
            'payment_method' => ['required', 'in:cod,bank_transfer,momo,vnpay'],
            'delivery_type' => ['nullable', 'in:delivery,pickup'],
            'shipping_method' => ['nullable', 'string', 'max:32'],
            'shipping_fee' => ['nullable', 'integer', 'min:0', 'max:9999999'],
            'ghn_to_district_id' => ['nullable', 'integer', 'min:1'],
            'ghn_to_ward_code' => ['nullable', 'string', 'max:20'],
            'ghn_service_id' => ['nullable', 'integer', 'min:1'],
            'voucher_code' => ['nullable', 'string', 'max:40'],
            'voucher_codes' => ['nullable', 'array', 'max:2'],
            'voucher_codes.*' => ['string', 'max:20'],
            'note' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.option_ids' => ['nullable', 'array'],
            'items.*.option_ids.*' => ['string', 'max:50'],
        ]);

        $user = $this->resolveUserFromToken($request);
        $deliveryType = $data['delivery_type'] ?? 'delivery';

        try {
            [$shippingFee, $shippingMethod, $ghnServiceId] = $this->resolveShippingFee(
                $data,
                $deliveryType,
                $ghn,
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        try {
            $order = DB::transaction(function () use (
                $data,
                $user,
                $voucherService,
                $promotionService,
                $deliveryType,
                $shippingFee,
                $shippingMethod,
                $ghnServiceId,
            ) {
            $subtotal = 0;
            $lineRows = [];
            $products = [];
            $voucherLines = [];

            foreach ($data['items'] as $row) {
                $product = Product::lockForUpdate()->findOrFail($row['product_id']);
                $products[] = $product;
                $qty = (int) $row['quantity'];
                $optionIds = array_values($row['option_ids'] ?? []);
                $resolved = $product->resolveSku($optionIds);

                if ($resolved['stock'] !== null && $resolved['stock'] < $qty) {
                    throw new RuntimeException(
                        'Sản phẩm "'.$product->name.'" chỉ còn '.$resolved['stock'].' trong kho.'
                    );
                }

                $unitPrice = $promotionService->discountedPrice(
                    (int) $resolved['price'],
                    $product->id,
                );
                $lineTotal = $unitPrice * $qty;
                $subtotal += $lineTotal;

                $voucherLines[] = [
                    'product_id' => $product->id,
                    'line_total' => $lineTotal,
                ];

                $displayName = $product->name;
                if (! empty($resolved['label'])) {
                    $displayName .= ' ('.$resolved['label'].')';
                }

                $lineRows[] = [
                    'product_id' => $product->id,
                    'option_ids' => $optionIds ?: null,
                    'variant_label' => $resolved['label'] ?: null,
                    'product_name' => $displayName,
                    'price' => $unitPrice,
                    'quantity' => $qty,
                    'line_total' => $lineTotal,
                ];
            }

            $discount = 0;
            $voucherCode = null;
            $shippingDiscount = 0;

            $voucherCodes = $data['voucher_codes'] ?? [];
            if ($voucherCodes === [] && ! empty($data['voucher_code'])) {
                $voucherCodes = array_map(
                    'trim',
                    explode(',', (string) $data['voucher_code']),
                );
            }

            if ($voucherCodes !== []) {
                $resolved = $voucherService->resolveMany(
                    $voucherCodes,
                    $voucherLines,
                    $shippingFee,
                    $deliveryType,
                );
                $discount = (int) $resolved['discount'];
                $shippingDiscount = (int) $resolved['shipping_discount'];
                $voucherCode = $resolved['codes'] !== []
                    ? implode(',', $resolved['codes'])
                    : null;
            }

            $chargedShipping = max(0, $shippingFee - $shippingDiscount);
            $total = max(0, $subtotal - $discount + $chargedShipping);

            foreach ($data['items'] as $i => $row) {
                $optionIds = array_values($row['option_ids'] ?? []);
                $products[$i]->deductStock($optionIds, (int) $row['quantity']);
            }

            $order = Order::create([
                'user_id' => $user?->id,
                'guest_name' => $data['guest_name'],
                'guest_phone' => $data['guest_phone'],
                'guest_email' => $data['guest_email'],
                'guest_address' => $data['guest_address'],
                'payment_method' => $data['payment_method'],
                'payment_status' => 'unpaid',
                'status' => 'pending',
                'total_amount' => $total,
                'voucher_code' => $voucherCode,
                'discount_amount' => $discount,
                'shipping_fee' => $chargedShipping,
                'delivery_type' => $deliveryType,
                'shipping_method' => $shippingMethod,
                'ghn_service_id' => $ghnServiceId,
                'note' => $data['note'] ?? null,
            ]);

            foreach ($lineRows as $line) {
                $order->items()->create($line);
            }

            return $order->load('items');
            });
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Đặt hàng thành công.',
            'order' => $this->orderPayload($order),
        ], 201);
    }

    /** User đăng nhập — đơn của mình */
    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::with('items')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($o) => $this->orderPayload($o));

        return response()->json(['orders' => $orders]);
    }

    /** Admin — danh sách đơn */
    public function index(): JsonResponse
    {
        $orders = Order::with('items')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($o) => $this->orderPayload($o));

        return response()->json(['orders' => $orders]);
    }

    /** Admin — thống kê doanh thu */
    public function stats(): JsonResponse
    {
        $activeStatuses = ['pending', 'confirmed', 'shipping', 'completed'];

        $totalRevenue = (int) Order::whereIn('status', $activeStatuses)->sum('total_amount');
        $completedRevenue = (int) Order::where('status', 'completed')->sum('total_amount');
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $completedOrders = Order::where('status', 'completed')->count();

        $today = now()->startOfDay();
        $todayOrders = Order::where('created_at', '>=', $today)->count();
        $todayRevenue = (int) Order::where('created_at', '>=', $today)
            ->whereIn('status', $activeStatuses)
            ->sum('total_amount');

        $toShipOrders = Order::whereIn('status', ['pending', 'confirmed'])->count();
        $processedOrders = Order::whereIn('status', ['shipping', 'completed'])->count();
        $cancelledOrders = Order::where('status', 'cancelled')->count();

        $todayToShipOrders = Order::where('created_at', '>=', $today)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();
        $todayProcessedOrders = Order::where('created_at', '>=', $today)
            ->whereIn('status', ['shipping', 'completed'])
            ->count();
        $todayUniqueBuyers = (int) Order::where('created_at', '>=', $today)
            ->whereIn('status', $activeStatuses)
            ->distinct('guest_phone')
            ->count('guest_phone');
        $todayCancelledOrders = Order::where('created_at', '>=', $today)
            ->where('status', 'cancelled')
            ->count();

        $chart7d = [];
        for ($i = 6; $i >= 0; $i--) {
            $dayStart = now()->subDays($i)->startOfDay();
            $dayEnd = $dayStart->copy()->addDay();

            $chart7d[] = [
                'date' => $dayStart->format('Y-m-d'),
                'label' => $dayStart->format('d/m'),
                'orders' => Order::where('created_at', '>=', $dayStart)
                    ->where('created_at', '<', $dayEnd)
                    ->count(),
                'revenue' => (int) Order::where('created_at', '>=', $dayStart)
                    ->where('created_at', '<', $dayEnd)
                    ->whereIn('status', $activeStatuses)
                    ->sum('total_amount'),
            ];
        }

        $chartTodayHourly = [];
        for ($hour = 0; $hour <= 22; $hour += 2) {
            $bucketStart = $today->copy()->addHours($hour);
            $bucketEnd = $today->copy()->addHours($hour + 2);

            $chartTodayHourly[] = [
                'hour' => $hour,
                'label' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT),
                'revenue' => (int) Order::where('created_at', '>=', $bucketStart)
                    ->where('created_at', '<', $bucketEnd)
                    ->whereIn('status', $activeStatuses)
                    ->sum('total_amount'),
            ];
        }

        $uniqueBuyers = (int) Order::whereIn('status', $activeStatuses)
            ->distinct('guest_phone')
            ->count('guest_phone');

        $topProducts = $this->topProductsByRevenue();
        $todayTopProducts = $this->topProductsByRevenue($today);

        return response()->json([
            'stats' => [
                'total_revenue' => $totalRevenue,
                'completed_revenue' => $completedRevenue,
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'today_orders' => $todayOrders,
                'today_revenue' => $todayRevenue,
                'today_to_ship_orders' => $todayToShipOrders,
                'today_processed_orders' => $todayProcessedOrders,
                'today_unique_buyers' => $todayUniqueBuyers,
                'today_cancelled_orders' => $todayCancelledOrders,
                'to_ship_orders' => $toShipOrders,
                'processed_orders' => $processedOrders,
                'cancelled_orders' => $cancelledOrders,
                'product_count' => Product::count(),
                'unique_buyers' => $uniqueBuyers,
                'chart_7d' => $chart7d,
                'chart_today_hourly' => $chartTodayHourly,
                'top_products' => $topProducts,
                'today_top_products' => $todayTopProducts,
            ],
        ]);
    }

    /** Guest tra cứu — mã đơn + SĐT phải khớp */
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^0\d{8,10}$/'],
        ]);

        $phone = trim($data['phone']);

        $orders = Order::with('items')
            ->where('guest_phone', $phone)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn ($o) => $this->orderPayload($o));

        if ($orders->isEmpty()) {
            return response()->json([
                'message' => 'Không tìm thấy đơn hàng với số điện thoại này.',
            ], 404);
        }

        return response()->json(['orders' => $orders->values()]);
    }

    /** Admin — xác nhận đã thanh toán chuyển khoản */
    public function updatePaymentStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'payment_status' => ['required', 'in:unpaid,paid'],
        ]);

        $onlineMethods = ['bank_transfer', 'momo', 'vnpay'];
        if (! in_array($order->payment_method, $onlineMethods, true) && $data['payment_status'] === 'paid') {
            return response()->json([
                'message' => 'Chỉ đơn thanh toán trực tuyến mới cập nhật trạng thái thanh toán.',
            ], 422);
        }

        $order->update(['payment_status' => $data['payment_status']]);

        return response()->json([
            'message' => 'Cập nhật thanh toán thành công.',
            'order' => $this->orderPayload($order->load('items')),
        ]);
    }

    /** Admin — đổi trạng thái */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,confirmed,shipping,completed,cancelled'],
        ]);

        $order->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Cập nhật trạng thái thành công.',
            'order' => $this->orderPayload($order->load('items')),
        ]);
    }

    /** @return array{0: int, 1: ?string, 2: ?int} */
    private function resolveShippingFee(array $data, string $deliveryType, GhnService $ghn): array
    {
        if ($deliveryType === 'pickup') {
            return [0, null, null];
        }

        $itemQty = array_sum(array_column($data['items'], 'quantity'));
        $weight = max((int) config('ghn.default_weight_gram'), $itemQty * 300);

        if (($data['shipping_method'] ?? '') === 'ghn' && $ghn->isConfigured()) {
            $districtId = (int) ($data['ghn_to_district_id'] ?? 0);
            $wardCode = (string) ($data['ghn_to_ward_code'] ?? '');
            if ($districtId < 1 || $wardCode === '') {
                throw new RuntimeException('Vui lòng chọn địa chỉ GHN đầy đủ để tính phí ship.');
            }

            $quote = $ghn->calculateFee(
                $districtId,
                $wardCode,
                $weight,
                isset($data['ghn_service_id']) ? (int) $data['ghn_service_id'] : null,
            );

            return [$quote['fee'], 'ghn', $quote['service_id']];
        }

        return [(int) ($data['shipping_fee'] ?? 0), $data['shipping_method'] ?? 'standard', null];
    }

    /** @return list<array{name: string, image: ?string, revenue: int}> */
    private function topProductsByRevenue(?\Illuminate\Support\Carbon $since = null): array
    {
        $activeStatuses = ['pending', 'confirmed', 'shipping', 'completed'];

        $query = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('orders.status', $activeStatuses);

        if ($since !== null) {
            $query->where('orders.created_at', '>=', $since);
        }

        return $query
            ->select(
                'order_items.product_name',
                'products.image as image',
                DB::raw('SUM(order_items.line_total) as revenue'),
            )
            ->groupBy('order_items.product_name', 'products.image')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->product_name,
                'image' => $row->image,
                'revenue' => (int) $row->revenue,
            ])
            ->values()
            ->all();
    }

    private function resolveUserFromToken(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $access = PersonalAccessToken::findToken($token);

        return $access?->tokenable instanceof User ? $access->tokenable : null;
    }

    private function orderPayload(Order $order): array
    {
        return [
            'id' => $order->id,
            'user_id' => $order->user_id,
            'guest_name' => $order->guest_name,
            'guest_phone' => $order->guest_phone,
            'guest_email' => $order->guest_email,
            'guest_address' => $order->guest_address,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'status' => $order->status,
            'total_amount' => $order->total_amount,
            'voucher_code' => $order->voucher_code,
            'discount_amount' => $order->discount_amount,
            'shipping_fee' => $order->shipping_fee,
            'delivery_type' => $order->delivery_type,
            'note' => $order->note,
            'created_at' => $order->created_at?->toIso8601String(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'option_ids' => $item->option_ids,
                'variant_label' => $item->variant_label,
                'product_name' => $item->product_name,
                'price' => $item->price,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ])->values(),
        ];
    }
}