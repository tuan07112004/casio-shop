<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GhnService
{
    private string $baseUrl;

    private ?string $token;

    private int $shopId;

    private int $fromDistrictId;

    private string $fromWardCode;

    private ?int $resolvedShopId = null;

    /** @var array<string, mixed>|null */
    private ?array $primaryShop = null;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('ghn.base_url'), '/');
        $this->token = config('ghn.token') ?: null;
        $this->shopId = (int) config('ghn.shop_id');
        $this->fromDistrictId = (int) config('ghn.from_district_id');
        $this->fromWardCode = (string) config('ghn.from_ward_code');
    }

    public function hasToken(): bool
    {
        return (bool) $this->token;
    }

    public function isConfigured(): bool
    {
        return $this->hasToken()
            && $this->resolveShopId() > 0
            && $this->resolveFromDistrictId() > 0
            && $this->resolveFromWardCode() !== '';
    }

    /** @return array{shop_id: int, name: string, district_id: int, ward_code: string, shop_needs_address: bool, missing: list<string>} */
    public function getSetupInfo(): array
    {
        $shop = $this->getPrimaryShop();
        $fromDistrict = $this->resolveFromDistrictId();
        $fromWard = $this->resolveFromWardCode();
        $missing = [];

        if (! $this->hasToken()) {
            $missing[] = 'GHN_TOKEN';
        }
        if ($this->resolveShopId() < 1) {
            $missing[] = 'GHN_SHOP_ID';
        }
        if ($fromDistrict < 1) {
            $missing[] = 'GHN_FROM_DISTRICT_ID';
        }
        if ($fromWard === '') {
            $missing[] = 'GHN_FROM_WARD_CODE';
        }

        return [
            'shop_id' => $this->resolveShopId(),
            'name' => $shop['name'] ?? '',
            'district_id' => $fromDistrict,
            'ward_code' => $fromWard,
            'shop_needs_address' => $shop
                ? ((int) ($shop['district_id'] ?? 0)) < 1
                : true,
            'missing' => $missing,
        ];
    }

    private function resolveShopId(): int
    {
        if ($this->resolvedShopId !== null) {
            return $this->resolvedShopId;
        }

        if ($this->shopId > 0) {
            return $this->resolvedShopId = $this->shopId;
        }

        $shops = $this->fetchShops();

        return $this->resolvedShopId = (int) ($shops[0]['_id'] ?? 0);
    }

    /** @return array<string, mixed>|null */
    private function getPrimaryShop(): ?array
    {
        if ($this->primaryShop !== null) {
            return $this->primaryShop ?: null;
        }

        $shops = $this->fetchShops();
        $this->primaryShop = $shops[0] ?? [];

        return $shops[0] ?? null;
    }

    private function resolveFromDistrictId(): int
    {
        if ($this->fromDistrictId > 0) {
            return $this->fromDistrictId;
        }

        return (int) ($this->getPrimaryShop()['district_id'] ?? 0);
    }

    private function resolveFromWardCode(): string
    {
        if ($this->fromWardCode !== '') {
            return $this->fromWardCode;
        }

        return (string) ($this->getPrimaryShop()['ward_code'] ?? '');
    }

    /** @return list<array<string, mixed>> */
    private function fetchShops(): array
    {
        if (! $this->token) {
            return [];
        }

        try {
            $data = $this->request('POST', '/v2/shop/all', []);
        } catch (RuntimeException) {
            return [];
        }

        return $data['data']['shops'] ?? [];
    }

    public function getProvinces(): array
    {
        return Cache::remember('ghn:provinces', 86400 * 7, function () {
            $data = $this->request('GET', '/master-data/province');

            return collect($data['data'] ?? [])
            ->map(fn ($row) => [
                'id' => (int) ($row['ProvinceID'] ?? $row['province_id'] ?? 0),
                'name' => $row['ProvinceName'] ?? $row['province_name'] ?? '',
            ])
            ->filter(fn ($row) => $row['id'] > 0 && $row['name'] !== '')
            ->values()
            ->all();
        });
    }

    public function getDistricts(int $provinceId): array
    {
        return Cache::remember("ghn:districts:{$provinceId}", 86400 * 7, function () use ($provinceId) {
            $data = $this->request('POST', '/master-data/district', [
                'province_id' => $provinceId,
            ]);

            return collect($data['data'] ?? [])
            ->map(fn ($row) => [
                'id' => (int) ($row['DistrictID'] ?? $row['district_id'] ?? 0),
                'name' => $row['DistrictName'] ?? $row['district_name'] ?? '',
            ])
            ->filter(fn ($row) => $row['id'] > 0 && $row['name'] !== '')
            ->values()
            ->all();
        });
    }

    public function getWards(int $districtId): array
    {
        return Cache::remember("ghn:wards:{$districtId}", 86400 * 7, function () use ($districtId) {
            $data = $this->request('GET', '/master-data/ward?district_id='.$districtId);

            return collect($data['data'] ?? [])
            ->map(fn ($row) => [
                'code' => (string) ($row['WardCode'] ?? $row['ward_code'] ?? ''),
                'name' => $row['WardName'] ?? $row['ward_name'] ?? '',
            ])
            ->filter(fn ($row) => $row['code'] !== '' && $row['name'] !== '')
            ->values()
            ->all();
        });
    }

    /** @return list<array{service_id: int, short_name: string, service_type_id: int}> */
    public function getAvailableServices(int $toDistrictId): array
    {
        $this->assertConfigured();

        return Cache::remember("ghn:services:{$toDistrictId}", 3600, function () use ($toDistrictId) {
            $data = $this->request('POST', '/v2/shipping-order/available-services', [
            'shop_id' => $this->resolveShopId(),
            'from_district' => $this->resolveFromDistrictId(),
            'to_district' => $toDistrictId,
            ], true);

            return collect($data['data'] ?? [])
                ->map(fn ($row) => [
                    'service_id' => (int) ($row['service_id'] ?? 0),
                    'short_name' => $row['short_name'] ?? $row['service_type_name'] ?? 'GHN',
                    'service_type_id' => (int) ($row['service_type_id'] ?? 0),
                ])
                ->filter(fn ($row) => $row['service_id'] > 0)
                ->values()
                ->all();
        });
    }

    /**
     * @return array{fee: int, service_id: int, service_name: string, raw: array}
     */
    public function calculateFee(
        int $toDistrictId,
        string $toWardCode,
        int $weightGram,
        ?int $serviceId = null,
        int $codValue = 0,
    ): array {
        $this->assertConfigured();

        $weightGram = max(1, $weightGram);
        $serviceKey = $serviceId ?? 0;
        $cacheKey = "ghn:fee:{$toDistrictId}:{$toWardCode}:{$weightGram}:{$serviceKey}";

        return Cache::remember($cacheKey, 600, function () use (
            $toDistrictId,
            $toWardCode,
            $weightGram,
            $serviceId,
            $codValue,
        ) {
            return $this->calculateFeeUncached(
                $toDistrictId,
                $toWardCode,
                $weightGram,
                $serviceId,
                $codValue,
            );
        });
    }

    /**
     * @return array{fee: int, service_id: int, service_name: string, raw: array}
     */
    private function calculateFeeUncached(
        int $toDistrictId,
        string $toWardCode,
        int $weightGram,
        ?int $serviceId = null,
        int $codValue = 0,
    ): array {
        $services = $this->getAvailableServices($toDistrictId);
        if ($services === []) {
            throw new RuntimeException('GHN không hỗ trợ giao đến khu vực này.');
        }

        $service = $serviceId
            ? collect($services)->firstWhere('service_id', $serviceId)
            : $services[0];

        if (! $service) {
            $service = $services[0];
        }

        $payload = [
            'service_id' => $service['service_id'],
            'from_district_id' => $this->resolveFromDistrictId(),
            'from_ward_code' => $this->resolveFromWardCode(),
            'to_district_id' => $toDistrictId,
            'to_ward_code' => $toWardCode,
            'weight' => $weightGram,
            'length' => (int) config('ghn.default_length'),
            'width' => (int) config('ghn.default_width'),
            'height' => (int) config('ghn.default_height'),
            'insurance_value' => 0,
            'cod_value' => max(0, $codValue),
        ];

        $data = $this->request('POST', '/v2/shipping-order/fee', $payload, true);
        $feeData = $data['data'] ?? [];
        $fee = (int) ($feeData['total'] ?? $feeData['service_fee'] ?? 0);

        if ($fee <= 0) {
            throw new RuntimeException('GHN không trả về phí vận chuyển cho khu vực này.');
        }

        return [
            'fee' => $fee,
            'service_id' => $service['service_id'],
            'service_name' => $service['short_name'],
            'raw' => $feeData,
        ];
    }

    private function assertConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GHN chưa được cấu hình (Token, Shop ID, địa chỉ kho).');
        }
    }

    /** @param  array<string, mixed>  $body */
    private function request(string $method, string $path, array $body = [], bool $withShop = false): array
    {
        if (! $this->token) {
            throw new RuntimeException('Thiếu GHN_TOKEN.');
        }

        $headers = [
            'Token' => $this->token,
            'Content-Type' => 'application/json',
        ];

        $shopId = $this->resolveShopId();
        if ($withShop && $shopId > 0) {
            $headers['ShopId'] = (string) $shopId;
        }

        $url = $this->baseUrl.$path;
        $client = Http::withHeaders($headers)->timeout((int) config('ghn.timeout', 12));
        $response = $method === 'GET'
            ? $client->get($url)
            : $client->post($url, $body);

        $json = $response->json();
        if (! is_array($json)) {
            throw new RuntimeException('GHN trả về dữ liệu không hợp lệ.');
        }

        $code = (int) ($json['code'] ?? 0);
        if (! $response->successful() || ($code !== 200 && $code !== 0)) {
            $message = $json['message'] ?? $json['code_message'] ?? 'GHN API lỗi';
            throw new RuntimeException((string) $message);
        }

        return $json;
    }
}
