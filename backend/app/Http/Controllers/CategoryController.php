<?php

namespace App\Http\Controllers;

use App\Models\ShopCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ShopCategory::query()
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get(['id', 'slug', 'label', 'shop_label', 'sort_order']);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'shop_label' => ['nullable', 'string', 'max:80'],
        ]);

        $label = trim($data['label']);
        $shopLabel = trim($data['shop_label'] ?? $label);

        $maxSort = (int) ShopCategory::query()->max('sort_order');

        $category = ShopCategory::create([
            'slug' => ShopCategory::uniqueSlug($label),
            'label' => $label,
            'shop_label' => $shopLabel !== '' ? $shopLabel : $label,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'message' => 'Đã thêm danh mục.',
            'category' => $category,
        ], 201);
    }
}
