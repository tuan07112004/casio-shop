<?php

namespace App\Http\Controllers;

use App\Services\GhnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class ShippingController extends Controller
{
    public function ghnStatus(GhnService $ghn): JsonResponse
    {
        $setup = $ghn->getSetupInfo();

        return response()->json([
            'enabled' => $ghn->isConfigured(),
            'addresses_available' => $ghn->hasToken(),
            'setup' => $setup,
        ]);
    }

    public function ghnProvinces(GhnService $ghn): JsonResponse
    {
        try {
            return response()->json($ghn->getProvinces());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function ghnDistricts(Request $request, GhnService $ghn): JsonResponse
    {
        $data = $request->validate([
            'province_id' => ['required', 'integer', 'min:1'],
        ]);

        try {
            return response()->json($ghn->getDistricts((int) $data['province_id']));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function ghnWards(Request $request, GhnService $ghn): JsonResponse
    {
        $data = $request->validate([
            'district_id' => ['required', 'integer', 'min:1'],
        ]);

        try {
            return response()->json($ghn->getWards((int) $data['district_id']));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function ghnQuote(Request $request, GhnService $ghn): JsonResponse
    {
        $data = $request->validate([
            'to_district_id' => ['required', 'integer', 'min:1'],
            'to_ward_code' => ['required', 'string', 'max:20'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:1600000'],
            'service_id' => ['nullable', 'integer', 'min:1'],
            'cod_value' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $quote = $ghn->calculateFee(
                (int) $data['to_district_id'],
                $data['to_ward_code'],
                (int) ($data['weight'] ?? config('ghn.default_weight_gram')),
                isset($data['service_id']) ? (int) $data['service_id'] : null,
                (int) ($data['cod_value'] ?? 0),
            );

            return response()->json([
                'provider' => 'ghn',
                'fee' => $quote['fee'],
                'service_id' => $quote['service_id'],
                'service_name' => $quote['service_name'],
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
