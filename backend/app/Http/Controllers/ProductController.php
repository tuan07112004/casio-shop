<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShopCategory;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(private PromotionService $promotions) {}
    /** @return list<string> */
    private function allowedCategories(): array
    {
        return ShopCategory::allowedSlugs();
    }

    /** @return list<string|object> */
    private function categoryRules(bool $required = true): array
    {
        $allowed = $this->allowedCategories();
        $rules = ['string', 'max:64'];

        if ($allowed !== []) {
            $rules[] = 'in:'.implode(',', $allowed);
        } else {
            $rules[] = 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
        }

        return $required ? array_merge(['required'], $rules) : array_merge(['sometimes'], $rules);
    }

    public function index(): JsonResponse
    {
        $products = Product::orderBy('id')->get();

        return response()->json(
            $products->map(fn (Product $product) => $this->mapProduct($product))
        );
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($this->mapProduct($product));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['slug'] = Product::uniqueSlug($data['name']);

        $product = Product::create($data);

        return response()->json([
            'message' => 'Thêm sản phẩm thành công.',
            'product' => $this->mapProduct($product),
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate($this->rules());

        if (($data['name'] ?? $product->name) !== $product->name) {
            $data['slug'] = Product::uniqueSlug($data['name'], $product->id);
        }

        $product->update($data);

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công.',
            'product' => $this->mapProduct($product->fresh()),
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
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'category' => $this->categoryRules(false),
            'product_name' => ['nullable', 'string', 'max:120'],
            'image_index' => ['nullable', 'integer', 'min:0', 'max:99'],
        ]);

        $category = $validated['category'] ?? 'phu-kien';
        $file = $request->file('image');
        $dir = $this->uploadDir($category);

        $filename = $this->buildProductImageFilename(
            $file,
            $validated['product_name'] ?? null,
            isset($validated['image_index']) ? (int) $validated['image_index'] : 0,
        );

        $file->move($dir, $filename);

        return response()->json([
            'message' => 'Tải ảnh thành công.',
            'path' => '/images/products/'.$category.'/'.$filename,
        ]);
    }

    public function uploadVideo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:20480'],
            'category' => $this->categoryRules(false),
        ]);

        $category = $validated['category'] ?? 'phu-kien';
        $file = $request->file('video');
        $dir = $this->videoUploadDir($category);

        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $base = $base !== '' ? $base : 'san-pham';
        $filename = $base.'-'.time().'.'.$file->getClientOriginalExtension();

        $file->move($dir, $filename);

        return response()->json([
            'message' => 'Tải video thành công.',
            'path' => '/video/'.$category.'/'.$filename,
        ]);
    }

    private function buildProductImageFilename(
        \Illuminate\Http\UploadedFile $file,
        ?string $productName,
        int $imageIndex,
    ): string {
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $slug = Str::slug((string) $productName);
        if ($slug === '') {
            $slug = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        }
        if ($slug === '') {
            $slug = 'san-pham';
        }

        $role = $imageIndex === 0 ? 'bia' : 'anh-'.($imageIndex + 1);

        return $slug.'-'.$role.'-'.time().'.'.$ext;
    }

    private function uploadDir(string $category): string
    {
        $dir = base_path('../casio-shop-react/public/images/products/'.$category);

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    private function videoUploadDir(string $category): string
    {
        $dir = base_path('../casio-shop-react/public/video/'.$category);

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    /** @return array<string, mixed> */
    private function mapProduct(Product $product): array
    {
        $data = $product->toArray();
        $promotion = $this->promotions->forProduct($product);
        if ($promotion) {
            $data['promotion'] = $promotion;
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:1000', 'max:999999999'],
            'image' => ['required', 'string', 'max:500'],
            'category' => $this->categoryRules(),
            'description' => ['nullable', 'string', 'max:5000'],
            'hover_image' => ['nullable', 'string', 'max:500'],
            'price_like_new' => ['nullable', 'integer', 'min:1000', 'max:999999999'],
            'price_85' => ['nullable', 'integer', 'min:1000', 'max:999999999'],
            'price_70' => ['nullable', 'integer', 'min:1000', 'max:999999999'],
            'price_55' => ['nullable', 'integer', 'min:1000', 'max:999999999'],
            'colors' => ['nullable', 'array', 'max:20'],
            'colors.*.hex' => ['required_with:colors', 'string', 'max:20'],
            'colors.*.label' => ['required_with:colors', 'string', 'max:50'],
            'variants' => ['nullable', 'array'],
            'variants.groups' => ['nullable', 'array', 'max:2'],
            'variants.groups.*.id' => ['required_with:variants.groups', 'string', 'max:50'],
            'variants.groups.*.name' => ['required_with:variants.groups', 'string', 'max:14'],
            'variants.groups.*.options' => ['required_with:variants.groups', 'array', 'min:1', 'max:20'],
            'variants.groups.*.options.*.id' => ['required_with:variants.groups', 'string', 'max:50'],
            'variants.groups.*.options.*.label' => ['required_with:variants.groups', 'string', 'max:20'],
            'variants.groups.*.options.*.hex' => ['nullable', 'string', 'max:20'],
            'variants.groups.*.options.*.image' => ['nullable', 'string', 'max:500'],
            'variants.skus' => ['nullable', 'array', 'max:100'],
            // optionIds rỗng [] = sản phẩm không phân loại (chỉ giá + kho)
            'variants.skus.*.optionIds' => ['nullable', 'array'],
            'variants.skus.*.optionIds.*' => ['string', 'max:50'],
            'variants.skus.*.price' => ['required_with:variants.skus', 'integer', 'min:1000', 'max:999999999'],
            'variants.skus.*.stock' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'variants.skus.*.image' => ['nullable', 'string', 'max:500'],
            'gallery_main_image' => ['nullable', 'string', 'max:500'],
            'gallery_video' => ['nullable', 'string', 'max:500'],
            'gallery_images' => ['nullable', 'array', 'max:50'],
            'gallery_images.*' => ['string', 'max:500'],
        ];
    }
}
