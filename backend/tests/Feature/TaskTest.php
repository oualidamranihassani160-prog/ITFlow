<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
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

    // ── Create ────────────────────────────────────────────────────────────────

    public function test_manager_can_create_task(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/tasks', [
                             'title'       => 'Fix the login bug',
                             'description' => 'Users cannot login with SSO',
                             'priority'    => 'high',
                             'employee_id' => $this->employee->id,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.title', 'Fix the login bug')
                 ->assertJsonPath('data.status', 'pending')
                 ->assertJsonPath('data.priority', 'high');

        $this->assertDatabaseHas('tasks', [
            'title'      => 'Fix the login bug',
            'manager_id' => $this->manager->id,
            'employee_id'=> $this->employee->id,
        ]);
    }

    public function test_manager_cannot_assign_task_to_another_managers_employee(): void
    {
        $otherManager  = User::factory()->create(['role' => 'manager']);
        $otherEmployee = User::factory()->create([
            'role'       => 'employee',
            'manager_id' => $otherManager->id,
        ]);

        $response = $this->actingAs($this->manager)
                         ->postJson('/api/tasks', [
                             'title'       => 'Hack attempt',
                             'priority'    => 'low',
                             'employee_id' => $otherEmployee->id,
                         ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_create_task(): void
    {
        $response = $this->actingAs($this->employee)
                         ->postJson('/api/tasks', [
                             'title'       => 'Self assigned task',
                             'priority'    => 'low',
                             'employee_id' => $this->employee->id,
                         ]);

        // Employee can't assign to others — backend will reject
        $response->assertStatus(403);
    }

    public function test_task_creation_sends_notification_to_employee(): void
    {
        $this->actingAs($this->manager)
             ->postJson('/api/tasks', [
                 'title'       => 'New task assigned',
                 'priority'    => 'medium',
                 'employee_id' => $this->employee->id,
             ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->employee->id,
            'type'    => 'task_assigned',
        ]);
    }

    public function test_task_requires_title(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/tasks', [
                             'priority'    => 'medium',
                             'employee_id' => $this->employee->id,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title']);
    }

    public function test_task_requires_valid_priority(): void
    {
        $response = $this->actingAs($this->manager)
                         ->postJson('/api/tasks', [
                             'title'       => 'Test task',
                             'priority'    => 'urgent', // invalid
                             'employee_id' => $this->employee->id,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['priority']);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public function test_manager_only_sees_own_tasks(): void
    {
        $otherManager = User::factory()->create(['role' => 'manager']);
        $otherEmp     = User::factory()->create(['role' => 'employee', 'manager_id' => $otherManager->id]);

        Task::factory()->create(['manager_id' => $this->manager->id, 'employee_id' => $this->employee->id]);
        Task::factory()->create(['manager_id' => $otherManager->id, 'employee_id' => $otherEmp->id]);

        $response = $this->actingAs($this->manager)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_employee_only_sees_assigned_tasks(): void
    {
        $otherEmployee = User::factory()->create(['role' => 'employee', 'manager_id' => $this->manager->id]);

        Task::factory()->create(['manager_id' => $this->manager->id, 'employee_id' => $this->employee->id]);
        Task::factory()->create(['manager_id' => $this->manager->id, 'employee_id' => $otherEmployee->id]);

        $response = $this->actingAs($this->employee)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_sees_all_tasks(): void
    {
        Task::factory()->count(5)->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_tasks_can_be_filtered_by_status(): void
    {
        Task::factory()->create(['manager_id' => $this->manager->id, 'employee_id' => $this->employee->id, 'status' => 'pending']);
        Task::factory()->create(['manager_id' => $this->manager->id, 'employee_id' => $this->employee->id, 'status' => 'completed']);

        $response = $this->actingAs($this->manager)->getJson('/api/tasks?status=pending');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('pending', $response->json('data.0.status'));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_employee_can_update_task_status(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
            'status'      => 'pending',
        ]);

        $response = $this->actingAs($this->employee)
                         ->patchJson("/api/tasks/{$task->id}", [
                             'status' => 'in_progress',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'in_progress');
    }

    public function test_completing_task_notifies_manager(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
            'status'      => 'in_progress',
        ]);

        $this->actingAs($this->employee)
             ->patchJson("/api/tasks/{$task->id}", ['status' => 'completed']);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->manager->id,
            'type'    => 'task_completed',
        ]);
    }

    public function test_manager_can_update_task_details(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
        ]);

        $response = $this->actingAs($this->manager)
                         ->patchJson("/api/tasks/{$task->id}", [
                             'title'    => 'Updated title',
                             'priority' => 'low',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'Updated title')
                 ->assertJsonPath('data.priority', 'low');
    }

    // ── Delete / Restore ──────────────────────────────────────────────────────

    public function test_manager_can_soft_delete_task(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
        ]);

        $response = $this->actingAs($this->manager)
                         ->deleteJson("/api/tasks/{$task->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('tasks', ['id' => $task->id]);
    }

    public function test_admin_can_restore_soft_deleted_task(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
        ]);
        $task->delete();

        $response = $this->actingAs($this->admin)
                         ->postJson("/api/tasks/{$task->id}/restore");

        $response->assertStatus(200);
        $this->assertNotSoftDeleted('tasks', ['id' => $task->id]);
    }

    public function test_admin_can_force_delete_task(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
        ]);
        $task->delete();

        $response = $this->actingAs($this->admin)
                         ->deleteJson("/api/tasks/{$task->id}/force");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
