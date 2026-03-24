<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private User $employee;
    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->manager  = User::factory()->create(['role' => 'manager']);
        $this->employee = User::factory()->create([
            'role'       => 'employee',
            'manager_id' => $this->manager->id,
        ]);
        $this->service = new NotificationService();
    }

    // ── Service ───────────────────────────────────────────────────────────────

    public function test_task_assigned_creates_notification_for_employee(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
            'title'       => 'Deploy to production',
        ]);

        $this->service->taskAssigned($task->load(['manager', 'employee']));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->employee->id,
            'type'    => 'task_assigned',
        ]);

        $notification = Notification::where('user_id', $this->employee->id)->first();
        $this->assertStringContainsString('Deploy to production', $notification->message);
    }

    public function test_task_completed_creates_notification_for_manager(): void
    {
        $task = Task::factory()->create([
            'manager_id'  => $this->manager->id,
            'employee_id' => $this->employee->id,
            'title'       => 'Fix critical bug',
        ]);

        $this->service->taskCompleted($task->load(['manager', 'employee']));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->manager->id,
            'type'    => 'task_completed',
        ]);

        $notification = Notification::where('user_id', $this->manager->id)->first();
        $this->assertStringContainsString('Fix critical bug', $notification->message);
    }

    // ── API: list ─────────────────────────────────────────────────────────────

    public function test_user_can_list_own_notifications(): void
    {
        Notification::factory()->count(3)->create(['user_id' => $this->employee->id]);
        Notification::factory()->count(2)->create(['user_id' => $this->manager->id]);

        $response = $this->actingAs($this->employee)
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_notifications_response_includes_unread_count(): void
    {
        Notification::factory()->count(3)->create(['user_id' => $this->employee->id, 'read_at' => null]);
        Notification::factory()->count(1)->create(['user_id' => $this->employee->id, 'read_at' => now()]);

        $response = $this->actingAs($this->employee)
                         ->getJson('/api/notifications');

        $response->assertStatus(200)
                 ->assertJsonPath('meta.unread_count', 3);
    }

    // ── API: mark as read ─────────────────────────────────────────────────────

    public function test_user_can_mark_notification_as_read(): void
    {
        $notification = Notification::factory()->create([
            'user_id'  => $this->employee->id,
            'read_at'  => null,
        ]);

        $response = $this->actingAs($this->employee)
                         ->patchJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)
                 ->assertJsonPath('data.is_read', true);

        $this->assertNotNull(Notification::find($notification->id)->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->manager->id,
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->employee)
                         ->patchJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(403);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Notification::factory()->count(4)->create([
            'user_id' => $this->employee->id,
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->employee)
                         ->postJson('/api/notifications/read-all');

        $response->assertStatus(200);

        $unread = Notification::where('user_id', $this->employee->id)
                               ->whereNull('read_at')
                               ->count();

        $this->assertEquals(0, $unread);
    }

    // ── API: delete ───────────────────────────────────────────────────────────

    public function test_user_can_delete_own_notification(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->employee->id,
        ]);

        $response = $this->actingAs($this->employee)
                         ->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_user_cannot_delete_another_users_notification(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->manager->id,
        ]);

        $response = $this->actingAs($this->employee)
                         ->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);
    }

    // ── Unauthenticated ───────────────────────────────────────────────────────

    public function test_notifications_require_authentication(): void
    {
        $response = $this->getJson('/api/notifications');
        $response->assertStatus(401);
    }
}
