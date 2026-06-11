<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            4 => [
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
                ['hex' => '#6b6b6b', 'label' => 'Xám'],
                ['hex' => '#b8d4eb', 'label' => 'Xanh'],
            ],
            5 => [
                ['hex' => '#e8c4cf', 'label' => 'Hồng'],
                ['hex' => '#b8d4eb', 'label' => 'Xanh'],
                ['hex' => '#ddd8d0', 'label' => 'Xám'],
            ],
            6 => [
                ['hex' => '#e8c4cf', 'label' => 'Hồng'],
                ['hex' => '#b8d4eb', 'label' => 'Xanh'],
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
            ],
            7 => [
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
            ],
            8 => [
                ['hex' => '#b8d4eb', 'label' => 'Xanh'],
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
            ],
            9 => [
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
                ['hex' => '#f2f2f2', 'label' => 'Trắng'],
            ],
        ];

        foreach ($rows as $id => $colors) {
            DB::table('products')
                ->where('id', $id)
                ->whereNull('colors')
                ->update(['colors' => json_encode($colors)]);
        }

        // Bổ sung màu máy tính nếu đã bị xóa khi sửa admin
        $calcColors = [
            1 => [['hex' => '#3d3d3d', 'label' => 'Đen']],
            2 => [
                ['hex' => '#f2f2f2', 'label' => 'Trắng'],
                ['hex' => '#b8d4eb', 'label' => 'Xanh'],
                ['hex' => '#e8c4cf', 'label' => 'Hồng'],
            ],
            3 => [
                ['hex' => '#ddd8d0', 'label' => 'Xám'],
                ['hex' => '#e8c4cf', 'label' => 'Hồng'],
                ['hex' => '#c5e2f2', 'label' => 'Xanh nước biển'],
                ['hex' => '#3d3d3d', 'label' => 'Đen'],
            ],
        ];

        foreach ($calcColors as $id => $colors) {
            DB::table('products')
                ->where('id', $id)
                ->whereNull('colors')
                ->update(['colors' => json_encode($colors)]);
        }
    }

    public function down(): void
    {
        DB::table('products')->whereIn('id', [4, 5, 6, 7, 8, 9])->update(['colors' => null]);
    }
};
