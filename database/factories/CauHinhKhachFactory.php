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
            'ma_giay_phep' => (string) fake()->unique()->numberBetween(1, 999999),
            'url_dich_vu' => 'https://'.fake()->unique()->domainName().'/api/documenteditor/',
        ];
    }
}
