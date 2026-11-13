<?php

namespace Database\Factories;

use App\Models\CauHinhKhach;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CauHinhKhach>
 */
class CauHinhKhachFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ten_khach' => fake()->unique()->company(),
            'url_dich_vu' => 'https://'.fake()->unique()->domainName().'/api/documenteditor/',
        ];
    }
}
