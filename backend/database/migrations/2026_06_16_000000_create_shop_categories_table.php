<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->string('label', 120);
            $table->string('shop_label', 80);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $defaults = [
            ['may-tinh', 'Máy tính Casio', 'Máy tính', 1],
            ['balo', 'Balo & Cặp', 'Balo', 2],
            ['phu-kien', 'Phụ kiện', 'Phụ kiện', 3],
            ['but-ky', 'Bút ký', 'Bút ký', 4],
            ['sach', 'Sách', 'Sách', 5],
        ];

        foreach ($defaults as [$slug, $label, $shopLabel, $sort]) {
            DB::table('shop_categories')->insert([
                'slug' => $slug,
                'label' => $label,
                'shop_label' => $shopLabel,
                'sort_order' => $sort,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_categories');
    }
};
