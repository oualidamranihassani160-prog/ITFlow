<?php

namespace Tests\Unit;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new NotificationService();
    }

    public function test_task_assigned_stores_correct_data(): void
    {
        $manager  = User::factory()->create(['role' => 'manager', 'name' => 'Alice']);
        $employee = User::factory()->create(['role' => 'employee', 'manager_id' => $manager->id]);
        $task     = Task::factory()->create([
            'title'       => 'Write unit tests',
            'manager_id'  => $manager->id,
            'employee_id' => $employee->id,
        ]);

        $this->service->taskAssigned($task->load(['manager', 'employee']));

        $notif = Notification::where('user_id', $employee->id)->first();

        $this->assertNotNull($notif);
        $this->assertEquals('task_assigned', $notif->type);
        $this->assertStringContainsString('Write unit tests', $notif->message);
        $this->assertEquals($task->id, $notif->data['task_id']);
        $this->assertEquals('Alice', $notif->data['manager_name']);
    }

    public function test_task_completed_stores_correct_data(): void
    {
        $manager  = User::factory()->create(['role' => 'manager']);
        $employee = User::factory()->create(['role' => 'employee', 'name' => 'Bob', 'manager_id' => $manager->id]);
        $task     = Task::factory()->create([
            'title'       => 'Deploy hotfix',
            'manager_id'  => $manager->id,
            'employee_id' => $employee->id,
        ]);

        $this->service->taskCompleted($task->load(['manager', 'employee']));

        $notif = Notification::where('user_id', $manager->id)->first();

        $this->assertNotNull($notif);
        $this->assertEquals('task_completed', $notif->type);
        $this->assertStringContainsString('Deploy hotfix', $notif->message);
        $this->assertEquals('Bob', $notif->data['employee_name']);
    }

    public function test_task_assigned_does_nothing_without_employee(): void
    {
        $task = new Task();
        $task->title = 'Orphan task';
        $task->employee_id = null;

        $this->service->taskAssigned($task);

        $this->assertEquals(0, Notification::count());
    }
}

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_admin_returns_true_for_admin(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isManager());
        $this->assertFalse($user->isEmployee());
    }

    public function test_is_manager_returns_true_for_manager(): void
    {
        $user = User::factory()->create(['role' => 'manager']);
        $this->assertFalse($user->isAdmin());
        $this->assertTrue($user->isManager());
        $this->assertFalse($user->isEmployee());
    }

    public function test_is_employee_returns_true_for_employee(): void
    {
        $user = User::factory()->create(['role' => 'employee']);
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isManager());
        $this->assertTrue($user->isEmployee());
    }

    public function test_employees_relationship(): void
    {
        $manager   = User::factory()->create(['role' => 'manager']);
        $employees = User::factory()->count(3)->create([
            'role'       => 'employee',
            'manager_id' => $manager->id,
        ]);

        $this->assertCount(3, $manager->employees);
    }

    public function test_manager_relationship(): void
    {
        $manager  = User::factory()->create(['role' => 'manager']);
        $employee = User::factory()->create([
            'role'       => 'employee',
            'manager_id' => $manager->id,
        ]);

        $this->assertEquals($manager->id, $employee->manager->id);
    }

    public function test_soft_delete_works(): void
    {
        $user = User::factory()->create();
        $user->delete();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertNull(User::find($user->id));
        $this->assertNotNull(User::withTrashed()->find($user->id));
    }
}
