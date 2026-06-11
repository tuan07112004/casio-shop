<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SLIDE_FILES = [
        '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg',
        '06.png', '07.png', '08.png', '09.png',
    ];

    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('gallery_images')->nullable()->after('gallery_video');
        });

        $products = DB::table('products')->orderBy('id')->get();

        foreach ($products as $product) {
            $images = array_values(array_filter([
                $product->image,
                $product->hover_image,
            ]));

            if ($product->category === 'may-tinh') {
                foreach (self::SLIDE_FILES as $file) {
                    $images[] = '/images/products/may-tinh/580-gallery/'.$file;
                }
            }

            $unique = [];
            foreach ($images as $path) {
                $path = trim((string) $path);
                if ($path !== '' && ! in_array($path, $unique, true)) {
                    $unique[] = $path;
                }
            }

            if (count($unique)) {
                DB::table('products')->where('id', $product->id)->update([
                    'gallery_images' => json_encode($unique),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('gallery_images');
        });
    }
};
