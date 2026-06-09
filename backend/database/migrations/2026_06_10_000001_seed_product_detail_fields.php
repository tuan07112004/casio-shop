<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            1 => [
                'description' => 'Casio FX-570VN chính hãng Casio, bảo hành 7 năm, đầy đủ tính năng thi đấu và học tập. Sản phẩm nguyên seal, kèm pin và hướng dẫn sử dụng tiếng Việt.',
                'hover_image' => '/images/products/may-tinh/570Hover.jpg',
                'price_like_new' => 450000,
                'price_85' => 400000,
                'price_70' => 355000,
                'price_55' => 305000,
                'colors' => json_encode([['hex' => '#3d3d3d', 'label' => 'Đen']]),
                'gallery_main_image' => '/images/products/may-tinh/570Hover.jpg',
                'gallery_video' => '/video/may-tinh/580vnx.mp4',
            ],
            2 => [
                'description' => 'Casio fx-580VN X sở hữu màn hình LCD độ phân giải cao, hiển thị rõ nét và nhiều thông tin hơn. Máy có tốc độ xử lý nhanh, hiệu suất cao, phù hợp cho học sinh và sinh viên trong học tập và tính toán.',
                'hover_image' => '/images/products/may-tinh/580Hover.jpg',
                'price_like_new' => 520000,
                'price_85' => 465000,
                'price_70' => 415000,
                'price_55' => 355000,
                'colors' => json_encode([
                    ['hex' => '#3d3d3d', 'label' => 'Đen'],
                    ['hex' => '#b8d4eb', 'label' => 'Xanh'],
                    ['hex' => '#e8c4cf', 'label' => 'Hồng'],
                ]),
                'gallery_main_image' => '/images/products/may-tinh/580Hover.jpg',
                'gallery_video' => '/video/may-tinh/580vnx.mp4',
            ],
            3 => [
                'description' => 'Casio FX-880BTG chính hãng Casio, bảo hành 7 năm, đầy đủ tính năng thi đấu và học tập. Sản phẩm nguyên seal, kèm pin và hướng dẫn sử dụng tiếng Việt.',
                'hover_image' => '/images/products/may-tinh/880Hover.jpg',
                'price_like_new' => 890000,
                'price_85' => 795000,
                'price_70' => 710000,
                'price_55' => 610000,
                'colors' => json_encode([
                    ['hex' => '#ddd8d0', 'label' => 'Xám'],
                    ['hex' => '#e8c4cf', 'label' => 'Hồng'],
                    ['hex' => '#c5e2f2', 'label' => 'Xanh nước biển'],
                    ['hex' => '#3d3d3d', 'label' => 'Đen'],
                ]),
                'gallery_main_image' => '/images/products/may-tinh/880Hover.jpg',
                'gallery_video' => '/video/may-tinh/580vnx.mp4',
            ],
        ];

        foreach ($rows as $id => $data) {
            DB::table('products')->where('id', $id)->update($data);
        }
    }

    public function down(): void
    {
        DB::table('products')->whereIn('id', [1, 2, 3])->update([
            'description' => null,
            'hover_image' => null,
            'price_like_new' => null,
            'price_85' => null,
            'price_70' => null,
            'price_55' => null,
            'colors' => null,
            'gallery_main_image' => null,
            'gallery_video' => null,
        ]);
    }
};
