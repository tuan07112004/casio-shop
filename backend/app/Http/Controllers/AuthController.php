<?php

namespace App\Http\Controllers;


use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;  
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** @var list<string> */
    private const ALLOWED_COM_DOMAINS = [
        'gmail.com',
        'yahoo.com',
        'outlook.com',
        'hotmail.com',
        'live.com',
        'icloud.com',
    ];

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', $this->allowedEmailRule(), 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
'password' => $data['password'],
            'role' => 'customer',
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ], 201);
    }


    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', $this->allowedEmailRule()],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        $token = $user->createToken('api') -> plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Đăng xuất thành công.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }

    private function allowedEmailRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (! is_string($value) || ! $this->isAllowedEmail($value)) {
                $fail('Email phải là @gmail.com, đuôi .vn hoặc .com phổ biến (yahoo, outlook...).');
            }
        };
    }

    private function isAllowedEmail(string $email): bool
    {
        $email = strtolower(trim($email));

        if (! preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/', $email)) {
            return false;
        }

        $domain = substr(strrchr($email, '@'), 1);

        foreach (explode('.', $domain) as $label) {
            if (strlen($label) < 2) {
                return false;
            }
        }

        if (str_ends_with($domain, '.vn')) {
            return true;
        }

        return in_array($domain, self::ALLOWED_COM_DOMAINS, true);
    }
}


