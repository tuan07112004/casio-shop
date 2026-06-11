<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $products = DB::table('products')
            ->whereNull('variants')
            ->whereNotNull('colors')
            ->get(['id', 'price', 'colors']);

        foreach ($products as $product) {
            $colors = json_decode($product->colors, true);
            if (! is_array($colors) || $colors === []) {
                continue;
            }

            $options = [];
            $skus = [];

            foreach ($colors as $i => $color) {
                $label = trim((string) ($color['label'] ?? ''));
                if ($label === '') {
                    continue;
                }

                $optionId = 'o-color-'.$i;
                $options[] = [
                    'id' => $optionId,
                    'label' => $label,
                    'hex' => $color['hex'] ?? '#cccccc',
                ];

                $skus[] = [
                    'optionIds' => [$optionId],
                    'price' => (int) $product->price,
                    'stock' => null,
                    'image' => null,
                ];
            }

            if ($options === []) {
                continue;
            }

            DB::table('products')->where('id', $product->id)->update([
                'variants' => json_encode([
                    'groups' => [
                        [
                            'id' => 'g-colors',
                            'name' => 'Màu sắc',
                            'options' => $options,
                        ],
                    ],
                    'skus' => $skus,
                ]),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('products')
            ->whereIn('id', [4, 5, 6, 7, 8, 9])
            ->update(['variants' => null]);
    }
};
