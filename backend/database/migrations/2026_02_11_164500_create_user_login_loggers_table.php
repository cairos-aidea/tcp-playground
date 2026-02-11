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
        if (!Schema::hasTable('user_login_loggers')) {
            Schema::create('user_login_loggers', function (Blueprint $table) {
                $table->id();
                $table->string('user_ip')->index();
                $table->integer('user_id')->nullable()->default(0)->index();
                $table->integer('attempts')->default(0);
                $table->string('type')->index();
                $table->string('session', 100)->nullable();
                $table->longText('response')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_login_loggers');
    }
};
