<?php

namespace App\Helpers;

use Hashids\Hashids;

class HashId
{
    private static ?Hashids $instance = null;

    private static function getInstance(): Hashids
    {
        if (!self::$instance) {
            self::$instance = new Hashids(
                config('app.key'), // salt — uses your APP_KEY
                12                 // minimum length of hash
            );
        }
        return self::$instance;
    }

    public static function encode(int $id): string
    {
        return self::getInstance()->encode($id);
    }

    public static function decode(string $hash): ?int
    {
        $decoded = self::getInstance()->decode($hash);
        return isset($decoded[0]) ? $decoded[0] : null;
    }
}