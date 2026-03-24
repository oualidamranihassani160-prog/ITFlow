<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Task;

class NotificationService
{
    public function taskAssigned(Task $task): void
    {
        if (!$task->employee) return;

        Notification::create([
            'user_id' => $task->employee_id,
            'type' => Notification::TYPE_TASK_ASSIGNED,
            'message' => "You have been assigned a new task: \"{$task->title}\"",
            'data' => [
                'task_id' => $task->id,
                'task_title' => $task->title,
                'manager_name' => $task->manager?->name,
            ],
        ]);
    }

    public function taskCompleted(Task $task): void
    {
        if (!$task->manager) return;

        Notification::create([
            'user_id' => $task->manager_id,
            'type' => Notification::TYPE_TASK_COMPLETED,
            'message' => "\"{$task->title}\" has been marked as completed by {$task->employee?->name}",
            'data' => [
                'task_id' => $task->id,
                'task_title' => $task->title,
                'employee_name' => $task->employee?->name,
            ],
        ]);
    }

    public function taskUpdated(Task $task, int $userId): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => Notification::TYPE_TASK_UPDATED,
            'message' => "Task \"{$task->title}\" has been updated",
            'data' => [
                'task_id' => $task->id,
                'task_title' => $task->title,
            ],
        ]);
    }
}
