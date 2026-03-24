<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
{
    $user = User::create([
        'name'         => $request->name,
        'email'        => $request->email,
        'password'     => Hash::make($request->password),
        'role'         => User::ROLE_ADMIN,
        'phone_number' => $request->phone_number,
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Registration successful',
        'data'    => [
            'user'  => new UserResource($user),
            'token' => $token,
        ],
    ], 201);
}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone_number' => 'sometimes|nullable|string|max:20',
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:8|confirmed',
            'avatar' => 'sometimes|nullable|image|max:2048',
        ]);

        if (isset($validated['current_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect',
                ], 422);
            }
        }

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $path;
        }

        unset($validated['current_password']);
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->avatar) {
            return response()->json([
                'success' => false,
                'message' => 'No avatar to delete.',
            ], 422);
        }

        // Delete file from storage
        \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);

        $user->update(['avatar' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar deleted successfully.',
            'data'    => new UserResource($user->fresh()),
        ]);
    }
}
