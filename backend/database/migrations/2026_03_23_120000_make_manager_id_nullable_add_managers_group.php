<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Drop the old FK constraint first, then re-add as nullable
            $table->dropForeign(['manager_id']);
            $table->foreignId('manager_id')->nullable()->change();
            $table->foreign('manager_id')->references('id')->on('users')->nullOnDelete();

            // Flag to identify messages belonging to the managers-only group chat
            $table->boolean('is_managers_group')->default(false)->after('is_group');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('is_managers_group');
            $table->dropForeign(['manager_id']);
            $table->foreignId('manager_id')->nullable(false)->change();
            $table->foreign('manager_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
