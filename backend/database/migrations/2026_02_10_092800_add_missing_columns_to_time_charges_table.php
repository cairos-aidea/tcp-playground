<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('time_charges', function (Blueprint $table) {
            // Core columns the app expects
            if (!Schema::hasColumn('time_charges', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('time_charges', 'time_charge_date')) {
                $table->date('time_charge_date')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('time_charges', 'time_charge_type')) {
                $table->string('time_charge_type')->nullable()->after('end_time');
            }
            if (!Schema::hasColumn('time_charges', 'project_code')) {
                $table->string('project_code')->nullable()->after('project_id');
            }
            if (!Schema::hasColumn('time_charges', 'departmental_task_id')) {
                $table->unsignedBigInteger('departmental_task_id')->nullable()->after('stage_label');
            }
            if (!Schema::hasColumn('time_charges', 'activity')) {
                $table->text('activity')->nullable()->after('departmental_task_id');
            }
            if (!Schema::hasColumn('time_charges', 'duration_min')) {
                $table->string('duration_min')->nullable()->after('duration_hrs');
            }
            if (!Schema::hasColumn('time_charges', 'is_ot')) {
                $table->boolean('is_ot')->default(false)->after('duration_min');
            }
            if (!Schema::hasColumn('time_charges', 'next_day_ot')) {
                $table->boolean('next_day_ot')->default(false)->after('is_ot');
            }
            if (!Schema::hasColumn('time_charges', 'status')) {
                $table->string('status')->default('pending')->after('remarks');
            }
            if (!Schema::hasColumn('time_charges', 'approver_id')) {
                $table->unsignedBigInteger('approver_id')->nullable()->after('status');
            }
            if (!Schema::hasColumn('time_charges', 'source')) {
                $table->string('source')->nullable()->after('approver_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('time_charges', function (Blueprint $table) {
            $columns = [
                'user_id',
                'time_charge_date',
                'time_charge_type',
                'project_code',
                'departmental_task_id',
                'activity',
                'duration_min',
                'is_ot',
                'next_day_ot',
                'status',
                'approver_id',
                'source'
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('time_charges', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
