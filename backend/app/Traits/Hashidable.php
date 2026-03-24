<?php

namespace App\Traits;

use App\Helpers\HashId;

trait Hashidable
{
    /**
     * Resolve route binding and accept hashed ids (HashId encoded strings).
     * If a hashed id is provided, decode it before deferring to the parent resolver.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if (is_string($value) && !is_numeric($value)) {
            $decoded = HashId::decode($value);
            if ($decoded) {
                $value = $decoded;
            }
        }

        return parent::resolveRouteBinding($value, $field);
    }
}
