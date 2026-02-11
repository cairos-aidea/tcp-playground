<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimeChargesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('time_charges', function (Blueprint $table) {
            $table->id();

            $table->date('project_date');
            $table->boolean('project_work');

            $table->integer('project_id');
            $table->char('project_label', 100);

            $table->integer('stage_id');
            $table->char('stage_label', 100);

            $table->string('start_time');
            $table->string('end_time');

            $table->string('duration_hrs');
            $table->string('duration_mns');

            $table->text('remarks');
            $table->timestamps();

            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('time_charges');
    }
}
