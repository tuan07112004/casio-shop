<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('voucher_code', 32)->nullable()->after('note');
            $table->unsignedInteger('discount_amount')->default(0)->after('voucher_code');
            $table->unsignedInteger('shipping_fee')->default(0)->after('discount_amount');
            $table->string('delivery_type', 16)->default('delivery')->after('shipping_fee');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['voucher_code', 'discount_amount', 'shipping_fee', 'delivery_type']);
        });
    }
};
