<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'ITFlow API', 'version' => '1.0.0']);
});
