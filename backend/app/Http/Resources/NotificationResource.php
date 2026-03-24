<?php

namespace App\Http\Resources;

use App\Helpers\HashId;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // expose hashed id
            'id' => HashId::encode($this->id),
            'hash_id'    => HashId::encode($this->id),
            'type' => $this->type,
            'message' => $this->message,
            'data' => $this->data,
            'read_at' => $this->read_at?->toISOString(),
            'is_read' => $this->isRead(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
