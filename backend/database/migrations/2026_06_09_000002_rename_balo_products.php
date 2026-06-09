<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $names = [
            4 => 'Balo thời trang dành cho nam',
            5 => 'Balo cấp 2 pastel-girl hồng',
            7 => 'Cặp đa năng',
        ];

        foreach ($names as $id => $name) {
            DB::table('products')->where('id', $id)->update(['name' => $name]);
        }
    }

    public function down(): void
    {
        $names = [
            4 => 'Balo học sinh tiểu học',
            5 => 'Balo học sinh cấp 2',
            7 => 'Cặp đựng laptop',
        ];

        foreach ($names as $id => $name) {
            DB::table('products')->where('id', $id)->update(['name' => $name]);
        }
    }
};
