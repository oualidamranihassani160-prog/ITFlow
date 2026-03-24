<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum', 'decode.hashid'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/profile', [AuthController::class, 'updateProfile']);

    // Stats
    Route::get('/stats', [UserController::class, 'stats']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    Route::post('/tasks/{id}/restore', [TaskController::class, 'restore']);
    Route::delete('/tasks/{id}/force', [TaskController::class, 'forceDelete']);

    // ── SPECIFIC named routes FIRST (before any wildcards) ──────────────────

    // Admin + Manager: fixed-path routes
    Route::middleware('role:admin,manager')->group(function () {
        Route::get('/my-employees', [UserController::class, 'myEmployees']);
        Route::post('/users/employees', [UserController::class, 'createEmployee']);
    });

    // Chat
    Route::get('/chat/contacts',            [MessageController::class, 'contacts']);
    Route::get('/chat/manager-contacts',    [MessageController::class, 'managerContacts']);
    Route::get('/chat/group',               [MessageController::class, 'groupMessages']);
    Route::post('/chat/group',              [MessageController::class, 'sendGroup']);
    Route::get('/chat/private/{userId}',    [MessageController::class, 'privateMessages']);
    Route::post('/chat/private/{userId}',   [MessageController::class, 'sendPrivate']);
    Route::get('/chat/team-monitor',        [MessageController::class, 'allTeamMessages']);
    Route::get('/chat/admin-monitor',       [MessageController::class, 'adminMonitor']);
    Route::get('/chat/unread',              [MessageController::class, 'unreadCount']);
    Route::delete('/chat/messages/{id}',    [MessageController::class, 'destroy']);
    Route::get('/chat/unread-counts',       [MessageController::class, 'unreadCounts']);
    Route::post('/chat/group/read',         [MessageController::class, 'markGroupAsRead']);

    // Admin only: fixed-path routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users/managers', [UserController::class, 'createManager']);
        Route::post('/users/{id}/restore', [UserController::class, 'restore']);
        Route::delete('/users/{id}/force', [UserController::class, 'forceDelete']);
    });

    // ── WILDCARD routes LAST ─────────────────────────────────────────────────

    // Admin + Manager: wildcard {user} routes
    Route::middleware('role:admin,manager')->group(function () {
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::post('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    //delete avatar
    Route::delete('/auth/avatar', [AuthController::class, 'deleteAvatar']);
});