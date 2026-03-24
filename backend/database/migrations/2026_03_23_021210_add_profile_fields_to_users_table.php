<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('job_title')->nullable()->after('role');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship'])->nullable()->after('job_title');
            $table->text('address')->nullable()->after('phone_number');
            $table->string('national_id', 20)->nullable()->after('address');
            $table->date('date_of_birth')->nullable()->after('national_id');
            $table->string('education_level')->nullable()->after('date_of_birth');
            $table->string('field_of_study')->nullable()->after('education_level');
            $table->string('university')->nullable()->after('field_of_study');
            $table->text('certifications')->nullable()->after('university');
            $table->unsignedTinyInteger('years_of_experience')->nullable()->after('certifications');
            $table->string('linkedin_url')->nullable()->after('years_of_experience');
            $table->string('github_url')->nullable()->after('linkedin_url');
            $table->enum('contract_type', ['CDI', 'CDD', 'freelance', 'internship'])->nullable()->after('github_url');
            $table->date('contract_start_date')->nullable()->after('contract_type');
            $table->date('contract_end_date')->nullable()->after('contract_start_date');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'job_title', 'employment_type', 'address', 'national_id',
                'date_of_birth', 'education_level', 'field_of_study', 'university',
                'certifications', 'years_of_experience', 'linkedin_url', 'github_url',
                'contract_type', 'contract_start_date', 'contract_end_date',
            ]);
        });
    }
};