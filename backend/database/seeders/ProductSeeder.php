<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;


class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        
    $products = [
        [
            'id' => 'casio-580vnx',
            'name' => 'Máy tính Casio 580VNX',
            'price' => 253333,
            'original_price' => 333333,
            'image' => '/images/580vnx.png',
            'category' => 'calculator',
            'stock' => 12,
            'description' => 'Máy tính Casio 580VNX chính hãng.',
        ],
        [
            'id' => 'casio-880btg',
            'name' => 'Máy tính Casio 880BTG',
            'price' => 270000,
            'original_price' => 330000,
            'image' => '/images/880btg.png',
            'category' => 'calculator',
            'stock' => 8,
            'description' => 'Máy tính Casio 880BTG chính hãng.',
        ],
        [
            'id' => 'casio-570vn-plus',
            'name' => 'Máy tính Casio 570VN Plus',
            'price' => 120000,
            'original_price' => 180000,
            'image' => '/images/570vn.png',
            'category' => 'calculator',
            'stock' => 15,
            'description' => 'Máy tính Casio 570VN Plus.',
        ],
        [
            'id' => 'tua-vit-pin',
            'name' => 'Tua vít + Pin',
            'price' => 1000,
            'original_price' => 10000,
            'image' => '/images/tovit.png',
            'category' => 'accessory',
            'stock' => 120,
            'description' => 'Tua vít + Pin thay cho máy Casio.',
        ],
        [
            'id' => 'kinh-cuong-luc',
            'name' => 'Kính cường lực',
            'price' => 1000,
            'original_price' => 12000,
            'image' => '/images/cuongluc.png',
            'category' => 'accessory',
            'stock' => 85,
            'description' => 'Kính cường lực bảo vệ màn hình.',
        ],
        [
            'id' => 'bao-da',
            'name' => 'Bao da Casio',
            'price' => 60000,
            'original_price' => 120000,
            'image' => '/images/baoda.png',
            'category' => 'accessory',
            'stock' => 24,
            'description' => 'Bao da bảo vệ máy Casio.',
        ],
        [
            'id' => 'balo-cap-1',
            'name' => 'Balo cấp 1',
            'price' => 99000,
            'original_price' => 159000,
            'image' => '/images/balo.png',
            'category' => 'bag',
            'stock' => 18,
            'description' => 'Balo học sinh cấp 1.',
        ],
        [
            'id' => 'balo-cap-2',
            'name' => 'Balo cấp 2',
            'price' => 139000,
            'original_price' => 199000,
            'image' => '/images/baloc2.png',
            'category' => 'bag',
            'stock' => 10,
            'description' => 'Balo học sinh cấp 2.',
        ],
        [
            'id' => 'balo-cap-3',
            'name' => 'Balo cấp 3',
            'price' => 156800,
            'original_price' => 249000,
            'image' => '/images/cap.png',
            'category' => 'bag',
            'stock' => 6,
            'description' => 'Balo học sinh cấp 3.',
        ],
    ];
    foreach ($products as $data) {
        Product::updateOrCreate(['id' => $data['id']], $data);
    }

    }
}
