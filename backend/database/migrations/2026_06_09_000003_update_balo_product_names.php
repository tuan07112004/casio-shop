<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('products')->where('id', 5)->update(['name' => 'Balo cấp 2 Pastel-girl hồng']);
        DB::table('products')->where('id', 7)->update(['name' => 'Cặp đa năng màu đen']);
    }

    public function down(): void
    {
        DB::table('products')->where('id', 5)->update(['name' => 'Balo cấp 2 pastel-girl hồng']);
        DB::table('products')->where('id', 7)->update(['name' => 'Cặp đa năng']);
    }
};
