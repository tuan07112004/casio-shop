<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private const CATEGORIES = ['may-tinh', 'balo', 'phu-kien'];

    public function index(): JsonResponse
    {
        return response()->json(Product::orderBy('id')->get());
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $product = Product::create($data);

        return response()->json([
            'message' => 'Thêm sản phẩm thành công.',
            'product' => $product,
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate($this->rules());

        $product->update($data);

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công.',
            'product' => $product->fresh(),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Đã xóa sản phẩm.',
        ]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $file = $request->file('image');
        $dir = $this->uploadDir();

        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $base = $base !== '' ? $base : 'san-pham';
        $filename = $base.'-'.time().'.'.$file->getClientOriginalExtension();

        $file->move($dir, $filename);

        return response()->json([
            'message' => 'Tải ảnh thành công.',
            'path' => '/images/sanpham/'.$filename,
        ]);
    }

    private function uploadDir(): string
    {
        $dir = base_path('../casio-shop-react/public/images/sanpham');

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    /** @return array<string, list<string|\Illuminate\Validation\Rules\In>> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:1000', 'max:999999999'],
            'image' => ['required', 'string', 'max:500'],
            'category' => ['required', 'string', 'in:'.implode(',', self::CATEGORIES)],
        ];
    }
}
