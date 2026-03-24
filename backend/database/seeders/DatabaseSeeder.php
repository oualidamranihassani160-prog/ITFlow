<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
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
    }
}
