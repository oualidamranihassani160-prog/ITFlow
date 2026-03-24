<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Registration ─────────────────────────────────────────────────────────

    public function test_first_registered_user_becomes_admin(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Admin User',
            'email'                 => 'admin@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.user.role', 'admin');

        $this->assertDatabaseHas('users', [
            'email' => 'admin@test.com',
            'role'  => 'admin',
        ]);
    }

    public function test_second_registered_user_becomes_employee(): void
    {
        User::factory()->create(['role' => 'admin']);

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'John Doe',
            'email'                 => 'john@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.user.role', 'employee');
    }

    public function test_register_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dupe@test.com']);

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Another User',
            'email'                 => 'dupe@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_register_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test',
            'email'                 => 'test@test.com',
            'password'              => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_register_fails_when_passwords_dont_match(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test',
            'email'                 => 'test@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'different123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'user@test.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'user@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['token', 'user']])
                 ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'user@test.com',
            'password' => bcrypt('correctpassword'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'user@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
                 ->assertJsonPath('success', false);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'nobody@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }

    // ── Auth guards ───────────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $user->id)
                 ->assertJsonPath('data.email', $user->email);
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
                         ->postJson('/api/auth/logout');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }
}
