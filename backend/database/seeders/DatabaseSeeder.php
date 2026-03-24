<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create one admin
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@itflow.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'phone_number' => '+1-555-0100',
        ]);

        // Create 4 managers
        $managerNames = [
            'Sarah Mitchell', 'James Carter', 'Olivia Wang', 'Michael Brown',
            'Liam Nguyen', 'Emma Thompson', 'Noah Patel'
        ];
        $managers = [];
        foreach ($managerNames as $i => $name) {
            $email = strtolower(str_replace(' ', '.', $name)) . "@itflow.com";
            $managers[] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => User::ROLE_MANAGER,
                'phone_number' => sprintf('+1-555-%04d', 1100 + $i),
                'created_by' => $admin->id,
            ]);
        }

        // Create 30 employees distributed among managers
        $employees = [];
    $employeeCount = 50;
        for ($i = 1; $i <= $employeeCount; $i++) {
            $name = "Employee {$i}";
            $email = "employee{$i}@itflow.com";
            // assign manager round-robin
            $manager = $managers[($i - 1) % count($managers)];
            $employees[] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => User::ROLE_EMPLOYEE,
                'manager_id' => $manager->id,
                'phone_number' => sprintf('+1-555-%04d', 1200 + $i),
                // Mark the admin as the creator so admin stats list employees
                'created_by' => $admin->id,
            ]);
        }

        // Create 50 tasks assigned to random manager -> employee pairs
        $statuses = ['pending', 'in_progress', 'completed'];
        $priorities = ['low', 'medium', 'high'];
    $taskCount = 136;
        for ($t = 1; $t <= $taskCount; $t++) {
            $mgr = $managers[array_rand($managers)];
            // pick an employee that belongs to this manager when possible
            $mgrEmployees = array_values(array_filter($employees, fn($e) => $e->manager_id === $mgr->id));
            if (count($mgrEmployees) === 0) {
                $emp = $employees[array_rand($employees)];
            } else {
                $emp = $mgrEmployees[array_rand($mgrEmployees)];
            }

            Task::create([
                'title' => "Task {$t}: Improve feature set",
                'description' => "Auto-generated task {$t} for testing purposes.",
                'status' => $statuses[array_rand($statuses)],
                'priority' => $priorities[array_rand($priorities)],
                'manager_id' => $mgr->id,
                'employee_id' => $emp->id,
                'due_date' => now()->addDays(rand(1, 60))->toDateString(),
            ]);
        }

        $this->command->info("Seeded: 1 admin, " . count($managers) . " managers, " . count($employees) . " employees, and {$taskCount} tasks.");
        // --- Messages seeding (some group + private messages) ---
        $allUsers = array_merge([$admin], $managers, $employees);

        // Create some group messages for team
        $teamGroupCount = 50;
        for ($i = 0; $i < $teamGroupCount; $i++) {
            $sender = $allUsers[array_rand($allUsers)];
            $managerId = $sender->isManager() ? $sender->id : $sender->manager_id;
            Message::create([
                'sender_id' => $sender->id,
                'manager_id' => $managerId,
                'body' => "Team message {$i} — automated",
                'is_group' => true,
                'is_managers_group' => false,
                'read_at' => null,
            ]);
        }

        // Create some managers-group messages (managers & admin)
        $managersGroupCount = 40;
        for ($i = 0; $i < $managersGroupCount; $i++) {
            // pick sender that is manager or admin
            $pool = array_merge([$admin], $managers);
            $sender = $pool[array_rand($pool)];
            $managerId = $sender->isManager() ? $sender->id : null;
            Message::create([
                'sender_id' => $sender->id,
                'manager_id' => $managerId,
                'body' => "Managers group message {$i} — automated",
                'is_group' => true,
                'is_managers_group' => true,
                'read_at' => null,
            ]);
        }

        // Create private messages between random users
        $privateCount = 120;
        $createdMessages = [];
        for ($i = 0; $i < $privateCount; $i++) {
            $sender = $allUsers[array_rand($allUsers)];
            // pick a receiver not equal to sender
            do { $receiver = $allUsers[array_rand($allUsers)]; } while ($receiver->id === $sender->id);
            $managerId = $sender->isManager() ? $sender->id : ($sender->manager_id ?? $receiver->manager_id);
            $msg = Message::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'manager_id' => $managerId,
                'body' => "Private message {$i} from {$sender->name} to {$receiver->name}",
                'is_group' => false,
                'is_managers_group' => false,
                'read_at' => rand(0, 1) ? now() : null,
            ]);
            $createdMessages[] = $msg;
        }

        // Create some MessageRead rows marking a subset as read by receiver
        $readsToCreate = min(60, count($createdMessages));
        for ($i = 0; $i < $readsToCreate; $i++) {
            $m = $createdMessages[array_rand($createdMessages)];
            MessageRead::create([
                'message_id' => $m->id,
                'user_id' => $m->receiver_id,
                'read_at' => now(),
            ]);
        }

    $this->command->info("Seeded: 1 admin, " . count($managers) . " managers, " . count($employees) . " employees, " . $taskCount . " tasks, and seeded group + private messages.");
    }
}
