<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code_prefix', 10)->default('LYTU');
            $table->string('code_suffix', 5);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('discount_type', 16)->default('fixed');
            $table->unsignedInteger('discount_value');
            $table->unsignedInteger('min_order_value')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('max_uses_per_user')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['code_prefix', 'code_suffix']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_vouchers');
    }
};
