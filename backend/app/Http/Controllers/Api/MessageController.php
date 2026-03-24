<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageRead;
use App\Models\User;
use App\Helpers\HashId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    // ── Contacts (team members for DM sidebar) ────────────────────────────────

    public function contacts(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isManager()) {
            $contacts = User::where('manager_id', $user->id)
                ->get()
                ->map(fn($u) => $this->formatContact($u));
        } elseif ($user->isEmployee()) {
            $teammates = User::where('manager_id', $user->manager_id)
                ->where('id', '!=', $user->id)
                ->get()
                ->map(fn($u) => $this->formatContact($u));

            $manager = User::find($user->manager_id);

            $contacts = $manager
                ? collect([$this->formatContact($manager)])->merge($teammates)
                : $teammates;
        } else {
            // Admin: no default contacts — uses manager-contacts endpoint
            $contacts = collect();
        }

        return response()->json(['success' => true, 'data' => $contacts->values()]);
    }

    // ── Manager Contacts (other managers + admin) ─────────────────────────────

    public function managerContacts(Request $request): JsonResponse
    {
        $user = $request->user();

        $contacts = User::whereIn('role', ['manager', 'admin'])
            ->where('id', '!=', $user->id)
            ->get()
            ->map(fn($u) => $this->formatContact($u));

        return response()->json(['success' => true, 'data' => $contacts->values()]);
    }

    // ── Group Messages ────────────────────────────────────────────────────────
    // scope: 'team' (default) or 'managers'

    public function groupMessages(Request $request): JsonResponse
    {
        $user  = $request->user();
        $scope = $request->query('scope', 'team');

        if ($scope === 'managers') {
            // Managers group: admin + all managers
            if (!$user->isManager() && !$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }

            $messages = Message::with('sender')
                ->where('is_group', true)
                ->where('is_managers_group', true)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn($m) => $this->formatMessage($m));

            return response()->json(['success' => true, 'data' => $messages]);
        }

        // Default: team group
        $managerId = $user->isManager() ? $user->id : $user->manager_id;

        if (!$managerId) {
            return response()->json(['success' => false, 'message' => 'No team found.'], 404);
        }

        $messages = Message::with('sender')
            ->where('manager_id', $managerId)
            ->where('is_group', true)
            ->where('is_managers_group', false)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($m) => $this->formatMessage($m));

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendGroup(Request $request): JsonResponse
    {
        $request->validate([
            'body'  => 'nullable|string|max:2000',
            'file'  => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt,zip',
            'scope' => 'nullable|string|in:team,managers',
        ]);

        if (!$request->body && !$request->hasFile('file')) {
            return response()->json(['success' => false, 'message' => 'Message or file required.'], 422);
        }

        $user  = $request->user();
        $scope = $request->input('scope', 'team');

        // Log incoming request for debugging admin/managers group send issues
        Log::info('chat:sendGroup request', [
            'auth_user_id' => $user->id,
            'scope' => $scope,
            'has_body' => (bool) $request->body,
            'has_file' => $request->hasFile('file'),
        ]);

        if ($scope === 'managers') {
            if (!$user->isManager() && !$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
            $managerId       = null;
            $isManagersGroup = true;
        } else {
            $managerId = $user->isManager() ? $user->id : $user->manager_id;

            if (!$managerId) {
                return response()->json(['success' => false, 'message' => 'No team found.'], 404);
            }
            $isManagersGroup = false;
        }

        [$filePath, $fileName, $fileType, $fileSize] = $this->storeFile($request);

        $message = Message::create([
            'sender_id'         => $user->id,
            'receiver_id'       => null,
            'manager_id'        => $managerId,
            'body'              => $request->body ?? '',
            'is_group'          => true,
            'is_managers_group' => $isManagersGroup,
            'file_path'         => $filePath,
            'file_name'         => $fileName,
            'file_type'         => $fileType,
            'file_size'         => $fileSize,
        ]);

        MessageRead::create(['message_id' => $message->id, 'user_id' => $user->id]);

        $message->load('sender');

        // Log created message to help debug cases where admin messages disappear
        Log::info('chat:sendGroup created message', [
            'message_id' => $message->id,
            'sender_id' => $message->sender_id,
            'manager_id' => $message->manager_id,
            'is_managers_group' => $message->is_managers_group,
            'created_at' => $message->created_at?->toISOString(),
        ]);

        return response()->json(['success' => true, 'data' => $this->formatMessage($message)], 201);
    }

    // ── Mark group as read ────────────────────────────────────────────────────

    public function markGroupAsRead(Request $request): JsonResponse
    {
        $user  = $request->user();
        $scope = $request->input('scope', 'team');

        if ($scope === 'managers') {
            $query = Message::where('is_group', true)
                ->where('is_managers_group', true)
                ->where('sender_id', '!=', $user->id);
        } else {
            $managerId = $user->isManager() ? $user->id : $user->manager_id;

            if (!$managerId) {
                return response()->json(['success' => false, 'message' => 'No team found.'], 404);
            }

            $query = Message::where('manager_id', $managerId)
                ->where('is_group', true)
                ->where('is_managers_group', false)
                ->where('sender_id', '!=', $user->id);
        }

        $unreadIds = $query->whereNotIn('id', function ($q) use ($user) {
            $q->select('message_id')->from('message_reads')->where('user_id', $user->id);
        })->pluck('id');

        foreach ($unreadIds as $messageId) {
            MessageRead::firstOrCreate(['message_id' => $messageId, 'user_id' => $user->id]);
        }

        return response()->json(['success' => true]);
    }

    // ── Private Messages ──────────────────────────────────────────────────────

    public function privateMessages(Request $request, int $userId): JsonResponse
    {
        $authUser = $request->user();

        $messages = Message::with('sender')
            ->where('is_group', false)
            ->where(function ($q) use ($authUser, $userId) {
                $q->where(function ($i) use ($authUser, $userId) {
                    $i->where('sender_id', $authUser->id)->where('receiver_id', $userId);
                })->orWhere(function ($i) use ($authUser, $userId) {
                    $i->where('sender_id', $userId)->where('receiver_id', $authUser->id);
                });
            })
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($m) => $this->formatMessage($m));

        // Mark as read
        $unreadIds = Message::where('sender_id', $userId)
            ->where('receiver_id', $authUser->id)
            ->where('is_group', false)
            ->whereNotIn('id', function ($q) use ($authUser) {
                $q->select('message_id')->from('message_reads')->where('user_id', $authUser->id);
            })->pluck('id');

        foreach ($unreadIds as $messageId) {
            MessageRead::firstOrCreate(['message_id' => $messageId, 'user_id' => $authUser->id]);
        }

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendPrivate(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'body' => 'nullable|string|max:2000',
            'file' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt,zip',
        ]);

        if (!$request->body && !$request->hasFile('file')) {
            return response()->json(['success' => false, 'message' => 'Message or file required.'], 422);
        }

        $authUser = $request->user();
        $receiver = User::findOrFail($userId);

        // Resolve manager_id anchor — nullable for admin/manager cross-DMs
        if ($authUser->isAdmin() || $authUser->isManager()) {
            if ($receiver->isAdmin() || $receiver->isManager()) {
                $managerId = null; // manager ↔ manager or manager ↔ admin: no team scope needed
            } else {
                $managerId = $authUser->isManager() ? $authUser->id : $receiver->manager_id;
            }
        } elseif ($receiver->isManager()) {
            $managerId = $receiver->id;
        } else {
            $managerId = $authUser->manager_id ?? $receiver->manager_id;
        }

        [$filePath, $fileName, $fileType, $fileSize] = $this->storeFile($request);

        $message = Message::create([
            'sender_id'         => $authUser->id,
            'receiver_id'       => $userId,
            'manager_id'        => $managerId,
            'body'              => $request->body ?? '',
            'is_group'          => false,
            'is_managers_group' => false,
            'file_path'         => $filePath,
            'file_name'         => $fileName,
            'file_type'         => $fileType,
            'file_size'         => $fileSize,
        ]);

        MessageRead::create(['message_id' => $message->id, 'user_id' => $authUser->id]);

        $message->load('sender');

        return response()->json(['success' => true, 'data' => $this->formatMessage($message)], 201);
    }

    // ── Unread Counts ─────────────────────────────────────────────────────────

    public function unreadCounts(Request $request): JsonResponse
    {
        $user      = $request->user();
        $managerId = $user->isManager() ? $user->id : $user->manager_id;

        // Private unread (map keys to encoded ids for clients)
        $privateRaw = Message::where('receiver_id', $user->id)
            ->where('is_group', false)
            ->whereNotIn('id', function ($q) use ($user) {
                $q->select('message_id')->from('message_reads')->where('user_id', $user->id);
            })
            ->selectRaw('sender_id, COUNT(*) as count')
            ->groupBy('sender_id')
            ->get();

        $private = [];
        foreach ($privateRaw as $row) {
            $private[HashId::encode($row->sender_id)] = (int) $row->count;
        }

        // Team group unread
        $groupUnread = 0;
        if ($managerId) {
            $groupUnread = Message::where('manager_id', $managerId)
                ->where('is_group', true)
                ->where('is_managers_group', false)
                ->where('sender_id', '!=', $user->id)
                ->whereNotIn('id', function ($q) use ($user) {
                    $q->select('message_id')->from('message_reads')->where('user_id', $user->id);
                })->count();
        }

        // Managers group unread (only for managers and admin)
        $managersGroupUnread = 0;
        if ($user->isManager() || $user->isAdmin()) {
            $managersGroupUnread = Message::where('is_group', true)
                ->where('is_managers_group', true)
                ->where('sender_id', '!=', $user->id)
                ->whereNotIn('id', function ($q) use ($user) {
                    $q->select('message_id')->from('message_reads')->where('user_id', $user->id);
                })->count();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'private'       => $private,
                'group'         => $groupUnread,
                'managers_group' => $managersGroupUnread,
            ],
        ]);
    }

    // ── Manager Team Monitor ──────────────────────────────────────────────────

    public function allTeamMessages(Request $request): JsonResponse
    {
        $user = $request->user();

        // Managers can see their team messages. Admins may view a specific manager's
        // team messages by providing a manager_id (encoded) query param.
        if ($user->isManager()) {
            $managerId = $user->id;
        } elseif ($user->isAdmin()) {
            $managerHash = $request->query('manager_id');
            if (!$managerHash) {
                return response()->json(['success' => false, 'message' => 'Manager id required for admin.'], 400);
            }
            $managerId = HashId::decode($managerHash);
            if (!$managerId) {
                return response()->json(['success' => false, 'message' => 'Invalid manager id.'], 400);
            }
        } else {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $messages = Message::with('sender', 'receiver')
            ->where('manager_id', $managerId)
            ->where('is_managers_group', false)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($m) => $this->formatMonitorMessage($m));

        return response()->json(['success' => true, 'data' => $messages]);
    }

    // ── Admin Monitor: all manager ↔ manager / manager ↔ admin messages ───────

    public function adminMonitor(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $managerIds = User::whereIn('role', ['manager', 'admin'])->pluck('id');

        $messages = Message::with('sender', 'receiver')
            ->where('is_group', false)
            ->whereIn('sender_id', $managerIds)
            ->whereIn('receiver_id', $managerIds)
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get()
            ->map(fn($m) => $this->formatMonitorMessage($m));

        return response()->json(['success' => true, 'data' => $messages]);
    }

    // ── Delete Message ────────────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        $message = Message::findOrFail($id);

        $user = $request->user();

        // Allow sender to delete. Also allow admins to delete any message. Managers
        // may delete messages belonging to their team (manager_id match).
        if ($message->sender_id !== $user->id) {
            $canDelete = false;
            if ($user->isAdmin()) {
                $canDelete = true;
            } elseif ($user->isManager() && $message->manager_id === $user->id) {
                $canDelete = true;
            }

            if (!$canDelete) {
                return response()->json(['success' => false, 'message' => 'You can only delete your own messages.'], 403);
            }
        }

        if ($message->file_path) {
            Storage::disk('public')->delete($message->file_path);
        }

        $message->delete();

        return response()->json(['success' => true, 'message' => 'Message deleted.']);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function storeFile(Request $request): array
    {
        if (!$request->hasFile('file')) {
            return [null, null, null, null];
        }
        $file = $request->file('file');
        return [
            $file->store('chat_files', 'public'),
            $file->getClientOriginalName(),
            $file->getMimeType(),
            $file->getSize(),
        ];
    }

    private function formatContact(User $u): array
    {
        return [
            // return encoded id for clients
            'id'     => HashId::encode($u->id),
            'name'   => $u->name,
            'avatar' => $u->avatar_url,
            'role'   => $u->role,
        ];
    }

    private function formatMessage(Message $message): array
    {
        return [
            'id'                => $message->id, // keep message id numeric server-side (frontend doesn't rely on encoded message ids)
            'body'              => $message->body,
            'is_group'          => $message->is_group,
            'is_managers_group' => $message->is_managers_group,
            // encode sender/receiver ids for clients
            'sender_id'         => $message->sender_id ? HashId::encode($message->sender_id) : null,
            'receiver_id'       => $message->receiver_id ? HashId::encode($message->receiver_id) : null,
            'sender'            => $message->sender ? [
                'id'     => HashId::encode($message->sender->id),
                'name'   => $message->sender->name,
                'avatar' => $message->sender->avatar_url,
                'role'   => $message->sender->role,
            ] : null,
            'file_url'  => $message->file_path ? asset('storage/' . $message->file_path) : null,
            'file_name' => $message->file_name,
            'file_type' => $message->file_type,
            'file_size' => $message->file_size,
            'created_at' => $message->created_at->toISOString(),
        ];
    }

    private function formatMonitorMessage(Message $message): array
    {
        return [
            'id'       => $message->id,
            'body'     => $message->body,
            'is_group' => $message->is_group,
            'sender'   => $message->sender ? [
                'id'   => HashId::encode($message->sender->id),
                'name' => $message->sender->name,
                'role' => $message->sender->role,
            ] : null,
            'receiver' => $message->receiver ? [
                'id'   => HashId::encode($message->receiver->id),
                'name' => $message->receiver->name,
                'role' => $message->receiver->role,
            ] : null,
            'created_at' => $message->created_at->toISOString(),
        ];
    }
}