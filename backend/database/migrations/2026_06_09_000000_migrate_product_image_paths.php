<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var array<string, string> */
    private const PATH_MAP = [
        '/images/sanpham/570vn.png' => '/images/products/may-tinh/570vn.png',
        '/images/sanpham/580vnx.png' => '/images/products/may-tinh/580vnx.png',
        '/images/sanpham/880btg.png' => '/images/products/may-tinh/880btg.png',
        '/images/sanpham/balo.png' => '/images/products/balo/balo.png',
        '/images/sanpham/baloc2.png' => '/images/products/balo/baloc2.png',
        '/images/sanpham/cap.png' => '/images/products/balo/cap.png',
        '/images/sanpham/baoda.png' => '/images/products/phu-kien/baoda.png',
        '/images/sanpham/tovit.png' => '/images/products/phu-kien/tovit.png',
        '/images/sanpham/cuongluc.png' => '/images/products/phu-kien/cuongluc.png',
    ];

    public function up(): void
    {
        foreach (self::PATH_MAP as $old => $new) {
            DB::table('products')->where('image', $old)->update(['image' => $new]);
        }

        DB::table('products')
            ->where('image', 'like', '/images/sanpham/%')
            ->update([
                'image' => DB::raw("REPLACE(image, '/images/sanpham/', '/images/products/_legacy/')"),
            ]);
    }

    public function down(): void
    {
        foreach (self::PATH_MAP as $old => $new) {
            DB::table('products')->where('image', $new)->update(['image' => $old]);
        }

        DB::table('products')
            ->where('image', 'like', '/images/products/_legacy/%')
            ->update([
                'image' => DB::raw("REPLACE(image, '/images/products/_legacy/', '/images/sanpham/')"),
            ]);
    }
};
