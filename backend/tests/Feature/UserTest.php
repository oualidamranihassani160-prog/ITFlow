<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $manager;
    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin    = User::factory()->create(['role' => 'admin']);
        $this->manager  = User::factory()->create(['role' => 'manager']);
        $this->employee = User::factory()->create([
            'role'       => 'employee',
            'manager_id' => $this->manager->id,
        ]);
    }

    // ── Admin: create manager ─────────────────────────────────────────────────

    public function test_admin_can_create_manager(): void
    {
        $response = $this->actingAs($this->admin)
                         ->postJson('/api/users/managers', [
                             'name'     => 'New Manager',
                             'email'    => 'manager@test.com',
                             'password' => 'password123',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.role', 'manager')
                 ->assertJsonPath('data.name', 'New Manager');

        $this->assertDatabaseHas('users', [
            'email' => 'manager@test.com',
            'role'  => 'manager',
        ]);
    }

    public function test_manager_cannot_create_another_manager(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/users/managers', [
                             'name'     => 'Rogue Manager',
                             'email'    => 'rogue@test.com',
                             'password' => 'password123',
                         ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_create_manager(): void
    {
        $response = $this->actingAs($this->employee)
                         ->postJson('/api/users/managers', [
                             'name'     => 'Sneaky Manager',
                             'email'    => 'sneaky@test.com',
                             'password' => 'password123',
                         ]);

        $response->assertStatus(403);
    }

    // ── Manager: create employee ──────────────────────────────────────────────

    public function test_manager_can_create_employee(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/users/employees', [
                             'name'     => 'New Employee',
                             'email'    => 'emp@test.com',
                             'password' => 'password123',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.role', 'employee');

        $this->assertDatabaseHas('users', [
            'email'      => 'emp@test.com',
            'role'       => 'employee',
            'manager_id' => $this->manager->id,
        ]);
    }

    public function test_employee_cannot_create_another_employee(): void
    {
        $response = $this->actingAs($this->employee)
                         ->postJson('/api/users/employees', [
                             'name'     => 'Another Emp',
                             'email'    => 'another@test.com',
                             'password' => 'password123',
                         ]);

        $response->assertStatus(403);
    }

    public function test_create_employee_fails_with_duplicate_email(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/users/employees', [
                             'name'     => 'Duplicate',
                             'email'    => $this->employee->email,
                             'password' => 'password123',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    // ── Avatar upload ─────────────────────────────────────────────────────────

    public function test_admin_can_upload_avatar_for_manager(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin)
                         ->post("/api/users/{$this->manager->id}", [
                             'name'   => $this->manager->name,
                             'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
                         ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.avatar'));
    }

    // ── List users ────────────────────────────────────────────────────────────

    public function test_admin_can_list_all_users(): void
    {
        User::factory()->count(3)->create(['role' => 'employee']);

        $response = $this->actingAs($this->admin)
                         ->getJson('/api/users');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'meta']);
    }

    public function test_manager_cannot_list_all_users(): void
    {
        $response = $this->actingAs($this->manager)
                         ->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_manager_can_list_own_employees(): void
    {
        User::factory()->count(2)->create([
            'role'       => 'employee',
            'manager_id' => $this->manager->id,
        ]);

        // Employee from another manager — should NOT appear
        $otherManager = User::factory()->create(['role' => 'manager']);
        User::factory()->create(['role' => 'employee', 'manager_id' => $otherManager->id]);

        $response = $this->actingAs($this->manager)
                         ->getJson('/api/my-employees');

        $response->assertStatus(200);
        // 2 new + 1 from setUp = 3 total
        $this->assertEquals(3, $response->json('meta.total'));
    }

    // ── Soft delete / restore / force delete ─────────────────────────────────

    public function test_admin_can_soft_delete_user(): void
    {
        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/users/{$this->employee->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('users', ['id' => $this->employee->id]);
    }

    public function test_admin_can_restore_user(): void
    {
        $this->employee->delete();

        $response = $this->actingAs($this->admin)
                         ->postJson("/api/users/{$this->employee->id}/restore");

        $response->assertStatus(200);
        $this->assertNotSoftDeleted('users', ['id' => $this->employee->id]);
    }

    public function test_admin_can_force_delete_user(): void
    {
        $this->employee->delete();

        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/users/{$this->employee->id}/force");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $this->employee->id]);
    }

    public function test_manager_cannot_force_delete_user(): void
    {
        $this->employee->delete();

        $response = $this->actingAs($this->manager)
                         ->deleteJson("/api/users/{$this->employee->id}/force");

        $response->assertStatus(403);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    public function test_admin_stats_returns_correct_counts(): void
    {
        User::factory()->count(2)->create(['role' => 'manager']);
        User::factory()->count(4)->create(['role' => 'employee']);

        $response = $this->actingAs($this->admin)->getJson('/api/stats');

        $response->assertStatus(200);
        // 1 original manager + 2 new = 3
        $this->assertEquals(3, $response->json('data.total_managers'));
        // 1 original employee + 4 new = 5
        $this->assertEquals(5, $response->json('data.total_employees'));
    }

    public function test_manager_stats_only_counts_own_employees(): void
    {
        User::factory()->count(2)->create([
            'role'       => 'employee',
            'manager_id' => $this->manager->id,
        ]);
        // Another manager's employee — should NOT be counted
        $other = User::factory()->create(['role' => 'manager']);
        User::factory()->create(['role' => 'employee', 'manager_id' => $other->id]);

        $response = $this->actingAs($this->manager)->getJson('/api/stats');

        $response->assertStatus(200);
        // 1 from setUp + 2 new = 3
        $this->assertEquals(3, $response->json('data.total_employees'));
    }
}
