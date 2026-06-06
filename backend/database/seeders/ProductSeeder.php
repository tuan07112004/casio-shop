<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['id' => 1, 'name' => 'Casio FX-570VN', 'price' => 450000, 'image' => '/images/sanpham/570vn.png', 'category' => 'may-tinh'],
            ['id' => 2, 'name' => 'Casio FX-580VNX', 'price' => 520000, 'image' => '/images/sanpham/580vnx.png', 'category' => 'may-tinh'],
            ['id' => 3, 'name' => 'Casio FX-880BTG', 'price' => 890000, 'image' => '/images/sanpham/880btg.png', 'category' => 'may-tinh'],
            ['id' => 4, 'name' => 'Balo học sinh tiểu học', 'price' => 350000, 'image' => '/images/sanpham/balo.png', 'category' => 'balo'],
            ['id' => 5, 'name' => 'Balo học sinh cấp 2', 'price' => 380000, 'image' => '/images/sanpham/baloc2.png', 'category' => 'balo'],
            ['id' => 6, 'name' => 'Bao da máy tính', 'price' => 120000, 'image' => '/images/sanpham/baoda.png', 'category' => 'phu-kien'],
            ['id' => 7, 'name' => 'Cặp đựng laptop', 'price' => 85000, 'image' => '/images/sanpham/cap.png', 'category' => 'balo'],
            ['id' => 8, 'name' => 'Tô vít', 'price' => 65000, 'image' => '/images/sanpham/tovit.png', 'category' => 'phu-kien'],
            ['id' => 9, 'name' => 'Pin cường lực', 'price' => 45000, 'image' => '/images/sanpham/cuongluc.png', 'category' => 'phu-kien'],
        ];

        foreach ($items as $item) {
            $id = $item['id'];
            Product::updateOrCreate(
                ['id' => $id],
                collect($item)->except('id')->all()
            );
        }
    }
}