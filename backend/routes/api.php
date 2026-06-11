<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/vouchers', [VoucherController::class, 'index']);
Route::get('/vouchers/checkout', [VoucherController::class, 'checkout']);
Route::post('/vouchers/validate', [VoucherController::class, 'validateCode']);

Route::get('/shipping/ghn/status', [ShippingController::class, 'ghnStatus']);
Route::get('/shipping/ghn/provinces', [ShippingController::class, 'ghnProvinces']);
Route::get('/shipping/ghn/districts', [ShippingController::class, 'ghnDistricts']);
Route::get('/shipping/ghn/wards', [ShippingController::class, 'ghnWards']);
Route::post('/shipping/ghn/quote', [ShippingController::class, 'ghnQuote']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Đặt hàng — không bắt buộc đăng nhập
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/lookup', [OrderController::class, 'lookup']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);

    Route::middleware('admin')->group(function () {
        Route::get('/orders/stats', [OrderController::class, 'stats']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::patch('/orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus']);

        Route::post('/categories', [CategoryController::class, 'store']);

        Route::post('/products/upload-image', [ProductController::class, 'uploadImage']);
        Route::post('/products/upload-video', [ProductController::class, 'uploadVideo']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        Route::get('/admin/vouchers', [VoucherController::class, 'adminIndex']);
        Route::post('/admin/vouchers', [VoucherController::class, 'store']);
        Route::put('/admin/vouchers/{voucher}', [VoucherController::class, 'update']);
        Route::delete('/admin/vouchers/{voucher}', [VoucherController::class, 'destroy']);

        Route::get('/admin/promotions', [PromotionController::class, 'index']);
        Route::post('/admin/promotions', [PromotionController::class, 'store']);
        Route::get('/admin/promotions/{promotion}', [PromotionController::class, 'show']);
        Route::put('/admin/promotions/{promotion}', [PromotionController::class, 'update']);
        Route::delete('/admin/promotions/{promotion}', [PromotionController::class, 'destroy']);
        Route::put('/admin/promotions/{promotion}/items', [PromotionController::class, 'syncItems']);
        Route::post('/admin/promotions/{promotion}/items/batch', [PromotionController::class, 'batchUpdateItems']);
    });
});