<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class OrderController extends Controller
{
    /** Đặt hàng — guest hoặc user (token tùy chọn) */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:20', 'regex:/^0\d{8,10}$/'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_address' => ['required', 'string', 'max:500'],
            'payment_method' => ['required', 'in:cod,bank_transfer'],
            'note' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $user = $this->resolveUserFromToken($request);

        $order = DB::transaction(function () use ($data, $user) {
            $total = 0;
            $lineRows = [];

            foreach ($data['items'] as $row) {
                $product = Product::findOrFail($row['product_id']);
                $qty = (int) $row['quantity'];
                $lineTotal = $product->price * $qty;
                $total += $lineTotal;

                $lineRows[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $qty,
                    'line_total' => $lineTotal,
                ];
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
                'note' => $data['note'] ?? null,
            ]);

            foreach ($lineRows as $line) {
                $order->items()->create($line);
            }

            return $order->load('items');
        });

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

        return response()->json([
            'stats' => [
                'total_revenue' => $totalRevenue,
                'completed_revenue' => $completedRevenue,
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'completed_orders' => $completedOrders,
                'today_orders' => $todayOrders,
                'today_revenue' => $todayRevenue,
            ],
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
            'note' => $order->note,
            'created_at' => $order->created_at?->toIso8601String(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'price' => $item->price,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ])->values(),
        ];
    }
}