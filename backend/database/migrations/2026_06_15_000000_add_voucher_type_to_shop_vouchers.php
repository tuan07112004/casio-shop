<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_vouchers', function (Blueprint $table) {
            $table->string('voucher_type', 16)->default('shop')->after('name');
            $table->json('product_ids')->nullable()->after('voucher_type');
        });
    }

    public function down(): void
    {
        Schema::table('shop_vouchers', function (Blueprint $table) {
            $table->dropColumn(['voucher_type', 'product_ids']);
        });
    }
};
