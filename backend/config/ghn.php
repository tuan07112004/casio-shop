<?php

return [
    'token' => env('GHN_TOKEN'),
    'shop_id' => (int) env('GHN_SHOP_ID', 0),
    'from_district_id' => (int) env('GHN_FROM_DISTRICT_ID', 0),
    'from_ward_code' => env('GHN_FROM_WARD_CODE', ''),
    'base_url' => env('GHN_BASE_URL', 'https://online-gateway.ghn.vn/shiip/public-api'),
    'default_weight_gram' => (int) env('GHN_DEFAULT_WEIGHT_GRAM', 500),
    'timeout' => (int) env('GHN_TIMEOUT', 12),
    'default_length' => 20,
    'default_width' => 15,
    'default_height' => 10,
];
