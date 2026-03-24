<?php

namespace App\Http\Resources;

use App\Helpers\HashId;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // expose only hashed id to clients (use for URLs)
            'id'                  => HashId::encode($this->id),
            'hash_id'             => HashId::encode($this->id),
            'name'                => $this->name,
            'email'               => $this->email,
            'role'                => $this->role,
            'job_title'           => $this->job_title,
            'employment_type'     => $this->employment_type,
            'phone_number'        => $this->phone_number,
            'avatar'              => $this->avatar_url,
            'address'             => $this->address,
            'national_id'         => $this->national_id,
            'date_of_birth'       => $this->date_of_birth?->toDateString(),
            'education_level'     => $this->education_level,
            'field_of_study'      => $this->field_of_study,
            'university'          => $this->university,
            'certifications'      => $this->certifications,
            'years_of_experience' => $this->years_of_experience,
            'linkedin_url'        => $this->linkedin_url,
            'github_url'          => $this->github_url,
            'contract_type'       => $this->contract_type,
            'contract_start_date' => $this->contract_start_date?->toDateString(),
            'contract_end_date'   => $this->contract_end_date?->toDateString(),
            'salary'              => $this->salary,
            'hire_date'           => $this->hire_date?->toDateString(),
            'manager_id'          => $this->manager_id ? HashId::encode($this->manager_id) : null,
            'manager'             => $this->whenLoaded('manager', fn() => [
                'id'   => HashId::encode($this->manager->id),
                'name' => $this->manager->name,
            ]),
            'created_at'          => $this->created_at?->toISOString(),
            'deleted_at'          => $this->deleted_at?->toISOString(),
        ];
    }
}
