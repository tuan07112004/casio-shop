<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->after('category');
            $table->string('hover_image', 500)->nullable()->after('description');
            $table->unsignedInteger('price_like_new')->nullable()->after('hover_image');
            $table->unsignedInteger('price_85')->nullable()->after('price_like_new');
            $table->unsignedInteger('price_70')->nullable()->after('price_85');
            $table->unsignedInteger('price_55')->nullable()->after('price_70');
            $table->json('colors')->nullable()->after('price_55');
            $table->string('gallery_main_image', 500)->nullable()->after('colors');
            $table->string('gallery_video', 500)->nullable()->after('gallery_main_image');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'hover_image',
                'price_like_new',
                'price_85',
                'price_70',
                'price_55',
                'colors',
                'gallery_main_image',
                'gallery_video',
            ]);
        });
    }
};
