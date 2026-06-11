<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->json('option_ids')->nullable()->after('product_id');
            $table->string('variant_label')->nullable()->after('option_ids');
        });

        $products = DB::table('products')->orderBy('id')->get();
        $used = [];

        foreach ($products as $product) {
            $base = Str::slug($product->name) ?: 'san-pham-'.$product->id;
            $slug = $base;
            $n = 1;
            while (isset($used[$slug])) {
                $slug = $base.'-'.$n;
                $n++;
            }
            $used[$slug] = true;

            $update = ['slug' => $slug];

            if ($product->category === 'may-tinh' && empty($product->variants)) {
                $variants = $this->buildVariantsFromLegacy($product);
                if ($variants) {
                    $update['variants'] = json_encode($variants);
                }
            }

            DB::table('products')->where('id', $product->id)->update($update);
        }
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['option_ids', 'variant_label']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }

    private function buildVariantsFromLegacy(object $product): ?array
    {
        $groups = [];
        $skus = [];

        $colors = $product->colors ? json_decode($product->colors, true) : null;
        if (is_array($colors) && count($colors)) {
            $machineGroup = null;
            if ((int) $product->id === 2) {
                $machineGroup = [
                    'id' => 'g-machine',
                    'name' => 'Loại máy',
                    'options' => [
                        ['id' => 'trang', 'label' => 'Casio 580 Trắng'],
                        ['id' => 'xanh', 'label' => 'Casio 580 Xanh'],
                        ['id' => 'hong', 'label' => 'Casio 580 Hồng'],
                    ],
                ];
                $groups[] = $machineGroup;
            } else {
                $groups[] = [
                    'id' => 'g-colors',
                    'name' => 'Màu sắc',
                    'options' => array_map(
                        fn ($c, $i) => [
                            'id' => 'o-color-'.$i,
                            'label' => $c['label'] ?? 'Màu',
                            'hex' => $c['hex'] ?? '#cccccc',
                        ],
                        $colors,
                        array_keys($colors),
                    ),
                ];
            }
        }

        $conditions = [];
        $map = [
            'like-new' => $product->price_like_new,
            '85' => $product->price_85,
            '70' => $product->price_70,
            '55' => $product->price_55,
        ];
        $labels = [
            'like-new' => 'LIKE NEW',
            '85' => '85%',
            '70' => '70%',
            '55' => '55%',
        ];

        foreach ($map as $id => $price) {
            if ($price) {
                $conditions[] = ['id' => $id, 'label' => $labels[$id]];
                $skus[] = [
                    'optionIds' => [$id],
                    'price' => (int) $price,
                    'stock' => 99,
                    'image' => null,
                ];
            }
        }

        if (count($conditions)) {
            $groups[] = [
                'id' => 'g-condition',
                'name' => 'Độ mới',
                'options' => $conditions,
            ];
        }

        if (!count($groups)) {
            return null;
        }

        if (!count($skus) && $product->price) {
            $skus[] = [
                'optionIds' => [],
                'price' => (int) $product->price,
                'stock' => 99,
                'image' => null,
            ];
        }

        return ['groups' => $groups, 'skus' => $skus];
    }
};
