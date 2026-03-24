<?php

namespace App\Http\Resources;

use App\Helpers\HashId;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // use encoded id as primary id for clients/URLs
            'id'          => HashId::encode($this->id),
            'hash_id'     => HashId::encode($this->id),
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'due_date'    => $this->due_date?->toDateString(),
            'manager_id'  => $this->manager_id ? HashId::encode($this->manager_id) : null,
            'employee_id' => $this->employee_id ? HashId::encode($this->employee_id) : null,
            'manager'     => $this->whenLoaded('manager', fn() => [
                'id'     => HashId::encode($this->manager->id),
                'name'   => $this->manager->name,
                'avatar' => $this->manager->avatar_url,
            ]),
            'employee'    => $this->whenLoaded('employee', fn() => [
                'id'     => HashId::encode($this->employee->id),
                'name'   => $this->employee->name,
                'avatar' => $this->employee->avatar_url,
            ]),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
            'deleted_at'  => $this->deleted_at?->toISOString(),
        ];
    }
}
