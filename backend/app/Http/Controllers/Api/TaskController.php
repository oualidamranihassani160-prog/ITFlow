<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use App\Helpers\HashId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Task::query()->with(['manager', 'employee']);

        if ($user->isAdmin()) {
            // Only show tasks belonging to managers created by this admin
            $query->whereHas('manager', function ($q) use ($user) {
                $q->where('created_by', $user->id)
                ->orWhere('id', $user->id);
            });
        } elseif ($user->isManager()) {
            $query->where('manager_id', $user->id);
        } elseif ($user->isEmployee()) {
            $query->where('employee_id', $user->id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->employee_id) {
            // allow hashed employee_id from clients - decode if necessary
            $employeeId = $request->employee_id;
            if (is_string($employeeId) && !is_numeric($employeeId)) {
                $employeeId = HashId::decode($employeeId);
            }
            if ($employeeId) {
                $query->where('employee_id', $employeeId);
            }
        }

        if ($request->trashed === 'true') {
            $query->onlyTrashed();
        }

        $tasks = $query->orderByDesc('created_at')->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data'    => TaskResource::collection($tasks),
            'meta'    => [
                'total'        => $tasks->total(),
                'per_page'     => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Accept hashed employee_id in request body. Decode before validation if needed.
        if ($request->employee_id && is_string($request->employee_id) && !is_numeric($request->employee_id)) {
            $decoded = HashId::decode($request->employee_id);
            if ($decoded) $request->merge(['employee_id' => $decoded]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'nullable|date|after_or_equal:today',
            'employee_id' => 'required|exists:users,id',
        ]);

        // Ensure employee belongs to this manager
        $employee = User::findOrFail($validated['employee_id']);
        if ($employee->manager_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You can only assign tasks to your own employees',
            ], 403);
        }

        $validated['manager_id'] = $request->user()->id;
        $validated['status'] = Task::STATUS_PENDING;

        $task = Task::create($validated);
        $task->load(['manager', 'employee']);

        // Notify employee
        $this->notificationService->taskAssigned($task);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => new TaskResource($task),
        ], 201);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new TaskResource($task->load(['manager', 'employee'])),
        ]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        // Employee can only update status
        // If incoming payload contains hashed employee_id, decode it first
        if ($request->employee_id && is_string($request->employee_id) && !is_numeric($request->employee_id)) {
            $decoded = HashId::decode($request->employee_id);
            if ($decoded) $request->merge(['employee_id' => $decoded]);
        }

        if ($user->isEmployee()) {
            $validated = $request->validate([
                'status' => 'required|in:pending,in_progress,completed',
            ]);
        } else {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
                'priority' => 'sometimes|in:low,medium,high',
                'status' => 'sometimes|in:pending,in_progress,completed',
                'due_date' => 'sometimes|nullable|date',
                'employee_id' => 'sometimes|exists:users,id',
            ]);
        }

        $previousStatus = $task->status;
        $task->update($validated);
        $task->load(['manager', 'employee']);

        // Notify manager when task completed
        if (
            isset($validated['status']) &&
            $validated['status'] === Task::STATUS_COMPLETED &&
            $previousStatus !== Task::STATUS_COMPLETED
        ) {
            $this->notificationService->taskCompleted($task);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => new TaskResource($task),
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task archived successfully',
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $task = Task::onlyTrashed()->findOrFail($id);
        $task->restore();

        return response()->json([
            'success' => true,
            'message' => 'Task restored successfully',
            'data' => new TaskResource($task->load(['manager', 'employee'])),
        ]);
    }

    public function forceDelete(int $id): JsonResponse
    {
        $task = Task::onlyTrashed()->findOrFail($id);
        $task->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Task permanently deleted',
        ]);
    }
}
