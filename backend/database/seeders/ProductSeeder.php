<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['id' => 1, 'name' => 'Casio FX-570VN', 'price' => 450000, 'image' => '/images/products/may-tinh/570vn.png', 'category' => 'may-tinh'],
            ['id' => 2, 'name' => 'Casio FX-580VNX', 'price' => 520000, 'image' => '/images/products/may-tinh/580vnx.png', 'category' => 'may-tinh'],
            ['id' => 3, 'name' => 'Casio FX-880BTG', 'price' => 890000, 'image' => '/images/products/may-tinh/880btg.png', 'category' => 'may-tinh'],
            ['id' => 4, 'name' => 'Balo thời trang dành cho nam', 'price' => 350000, 'image' => '/images/products/balo/balo.png', 'category' => 'balo'],
            ['id' => 5, 'name' => 'Balo cấp 2 Pastel-girl hồng', 'price' => 380000, 'image' => '/images/products/balo/baloc2.png', 'category' => 'balo'],
            ['id' => 6, 'name' => 'Bao da máy tính', 'price' => 120000, 'image' => '/images/products/phu-kien/baoda.png', 'category' => 'phu-kien'],
            ['id' => 7, 'name' => 'Cặp đa năng màu đen', 'price' => 85000, 'image' => '/images/products/balo/cap.png', 'category' => 'balo'],
            ['id' => 8, 'name' => 'Tô vít', 'price' => 65000, 'image' => '/images/products/phu-kien/tovit.png', 'category' => 'phu-kien'],
            ['id' => 9, 'name' => 'Kính cường lực', 'price' => 45000, 'image' => '/images/products/phu-kien/cuongluc.png', 'category' => 'phu-kien'],
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