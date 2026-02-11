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
            // Make legacy columns nullable as they are not used in new logic or conditionally used
            $table->date('project_date')->nullable()->change();
            $table->boolean('project_work')->nullable()->change();
            $table->integer('project_id')->nullable()->change();
            $table->char('project_label', 100)->nullable()->change();
            $table->integer('stage_id')->nullable()->change();
            $table->char('stage_label', 100)->nullable()->change();
            $table->string('duration_mns')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We generally don't want to revert this as it restricts data, 
        // but for completeness we could try to make them not null again 
        // if we were sure data existed. skipping for safety.
    }
};
