<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    // Admin: list only OWN managers and employees
    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        $query = User::query()->with(['manager']);

        // Admin sees only users THEY created
        if ($authUser->isAdmin()) {
            $query->where('created_by', $authUser->id);
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->trashed === 'true') {
            $query->onlyTrashed();
        }

        $users = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users),
            'meta'    => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // Admin: create manager — tag with created_by
    public function createManager(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:users,email',
            'password'            => 'required|string|min:8',
            'phone_number'        => 'nullable|string|max:20',
            'avatar'              => 'nullable|image|max:2048',
            'salary'              => 'nullable|numeric|min:0',
            'hire_date'           => 'nullable|date',
            'job_title'           => 'nullable|string|max:100',
            'employment_type'     => 'nullable|in:full_time,part_time,contract,internship',
            'address'             => 'nullable|string|max:500',
            'national_id'         => 'nullable|string|max:20',
            'date_of_birth'       => 'nullable|date',
            'education_level'     => 'nullable|string|max:100',
            'field_of_study'      => 'nullable|string|max:100',
            'university'          => 'nullable|string|max:150',
            'certifications'      => 'nullable|string|max:500',
            'years_of_experience' => 'nullable|integer|min:0|max:60',
            'linkedin_url'        => 'nullable|url|max:255',
            'github_url'          => 'nullable|url|max:255',
            'contract_type'       => 'nullable|in:CDI,CDD,freelance,internship',
            'contract_start_date' => 'nullable|date',
            'contract_end_date'   => 'nullable|date|after_or_equal:contract_start_date',   
        ]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $validated['password']   = Hash::make($validated['password']);
        $validated['role']       = User::ROLE_MANAGER;
        $validated['created_by'] = $request->user()->id;  // ← track owner

        $manager = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Manager created successfully',
            'data'    => new UserResource($manager),
        ], 201);
    }

    // Manager: create employee — tag with created_by
    public function createEmployee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:users,email',
            'password'            => 'required|string|min:8',
            'phone_number'        => 'nullable|string|max:20',
            'avatar'              => 'nullable|image|max:2048',
            'salary'              => 'nullable|numeric|min:0',      
            'hire_date'           => 'nullable|date',
            'job_title'           => 'nullable|string|max:100',
            'employment_type'     => 'nullable|in:full_time,part_time,contract,internship',
            'address'             => 'nullable|string|max:500',
            'national_id'         => 'nullable|string|max:20',
            'date_of_birth'       => 'nullable|date',
            'education_level'     => 'nullable|string|max:100',
            'field_of_study'      => 'nullable|string|max:100',
            'university'          => 'nullable|string|max:150',
            'certifications'      => 'nullable|string|max:500',
            'years_of_experience' => 'nullable|integer|min:0|max:60',
            'linkedin_url'        => 'nullable|url|max:255',
            'github_url'          => 'nullable|url|max:255',
            'contract_type'       => 'nullable|in:CDI,CDD,freelance,internship',
            'contract_start_date' => 'nullable|date',
            'contract_end_date'   => 'nullable|date|after_or_equal:contract_start_date',  
        ]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $manager = $request->user();

        $validated['password']   = Hash::make($validated['password']);
        $validated['role']       = User::ROLE_EMPLOYEE;
        $validated['manager_id'] = $manager->id;

        // If the creator is a manager, trace back to their admin (created_by)
        // If the creator is an admin, use their own id directly
        $validated['created_by'] = $manager->isAdmin()
            ? $manager->id
            : $manager->created_by;

        $employee = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data'    => new UserResource($employee),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'sometimes|email|unique:users,email,' . $user->id,
            'password'            => 'sometimes|string|min:8',
            'phone_number'        => 'nullable|string|max:20',
            'avatar'              => 'nullable|image|max:2048',
            'salary'              => 'nullable|numeric|min:0',      
            'hire_date'           => 'nullable|date',
            'job_title'           => 'nullable|string|max:100',
            'employment_type'     => 'nullable|in:full_time,part_time,contract,internship',
            'address'             => 'nullable|string|max:500',
            'national_id'         => 'nullable|string|max:20',
            'date_of_birth'       => 'nullable|date',
            'education_level'     => 'nullable|string|max:100',
            'field_of_study'      => 'nullable|string|max:100',
            'university'          => 'nullable|string|max:150',
            'certifications'      => 'nullable|string|max:500',
            'years_of_experience' => 'nullable|integer|min:0|max:60',
            'linkedin_url'        => 'nullable|url|max:255',
            'github_url'          => 'nullable|url|max:255',
            'contract_type'       => 'nullable|in:CDI,CDD,freelance,internship',
            'contract_start_date' => 'nullable|date',
            'contract_end_date'   => 'nullable|date|after_or_equal:contract_start_date',   
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $path;
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        // Delete avatar file from storage if it exists
        if ($user->avatar) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User archived successfully',
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return response()->json([
            'success' => true,
            'message' => 'User restored successfully',
            'data' => new UserResource($user->fresh()),
        ]);
    }
    public function forceDelete(int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);

        // Delete avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Delete all chat files sent by this user
        Message::where('sender_id', $user->id)
            ->whereNotNull('file_path')
            ->get()
            ->each(function ($message) {
                Storage::disk('public')->delete($message->file_path);
            });

        $user->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'User permanently deleted.',
        ]);
    }

    // Manager: get own employees
    public function myEmployees(Request $request): JsonResponse
    {
        $query = $request->user()->employees()->with([]);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $employees = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($employees),
            'meta' => [
                'total' => $employees->total(),
                'per_page' => $employees->perPage(),
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'success' => true,
                'data'    => [
                    'total_managers'    => User::where('role', User::ROLE_MANAGER)->where('created_by', $user->id)->count(),
                    'total_employees'   => User::where('role', User::ROLE_EMPLOYEE)->where('created_by', $user->id)->count(),
                    'total_tasks'       => \App\Models\Task::whereHas('manager', fn($q) =>
                                            $q->where('created_by', $user->id)->orWhere('id', $user->id))->count(),
                    'pending_tasks'     => \App\Models\Task::where('status', 'pending')
                                            ->whereHas('manager', fn($q) =>
                                                $q->where('created_by', $user->id)->orWhere('id', $user->id))->count(),
                    'in_progress_tasks' => \App\Models\Task::where('status', 'in_progress')
                                            ->whereHas('manager', fn($q) =>
                                                $q->where('created_by', $user->id)->orWhere('id', $user->id))->count(),
                    'completed_tasks'   => \App\Models\Task::where('status', 'completed')
                                            ->whereHas('manager', fn($q) =>
                                                $q->where('created_by', $user->id)->orWhere('id', $user->id))->count(),
                ],
            ]);
        }

        if ($user->isManager()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_employees' => $user->employees()->count(),
                    'total_tasks' => $user->tasksCreated()->count(),
                    'pending_tasks' => $user->tasksCreated()->where('status', 'pending')->count(),
                    'in_progress_tasks' => $user->tasksCreated()->where('status', 'in_progress')->count(),
                    'completed_tasks' => $user->tasksCreated()->where('status', 'completed')->count(),
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_tasks' => $user->tasksAssigned()->count(),
                'pending_tasks' => $user->tasksAssigned()->where('status', 'pending')->count(),
                'in_progress_tasks' => $user->tasksAssigned()->where('status', 'in_progress')->count(),
                'completed_tasks' => $user->tasksAssigned()->where('status', 'completed')->count(),
            ],
        ]);
    }
}
