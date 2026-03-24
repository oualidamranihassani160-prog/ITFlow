<?php

namespace App\Http\Middleware;

use App\Helpers\HashId;
use Closure;
use Illuminate\Http\Request;

class DecodeHashId
{
    public function handle(Request $request, Closure $next): mixed
    {
        // Decode any route parameters that look like hash IDs
        $route = $request->route();
        if (!$route) return $next($request);

        foreach (['id', 'user', 'task', 'userId', 'messageId', 'notification'] as $param) {
            $value = $route->parameter($param);
            if ($value && is_string($value) && !is_numeric($value)) {
                $decoded = HashId::decode($value);
                if ($decoded) {
                    $route->setParameter($param, $decoded);
                }
            }
        }

        return $next($request);
    }
}