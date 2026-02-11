<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            $table->string('job_title')->nullable();
            $table->integer('role_id')->nullable();
            $table->string('employee_id')->nullable();
            $table->longText('profile')->nullable();
            $table->string('status')->default('active');
            $table->string('user_type')->nullable();
            $table->string('rank')->nullable();
            $table->string('company')->nullable();
            $table->unsignedBigInteger('subsidiary_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('sex')->nullable();
            $table->string('is_active')->default('yes');
            $table->date('hire_date')->nullable();

            $table->text('microsoft_access_token')->nullable();
            $table->text('microsoft_refresh_token')->nullable();

            $table->rememberToken();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
}
