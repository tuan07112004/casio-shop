<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('products')
            ->where('id', 9)
            ->where('name', 'Pin cường lực')
            ->update(['name' => 'Kính cường lực']);
    }

    public function down(): void
    {
        DB::table('products')
            ->where('id', 9)
            ->where('name', 'Kính cường lực')
            ->update(['name' => 'Pin cường lực']);
    }
};
