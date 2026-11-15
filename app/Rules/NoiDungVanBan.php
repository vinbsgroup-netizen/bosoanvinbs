<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Nội dung văn bản của bộ soạn: SFDT (JSON của Syncfusion DocumentEditor, dạng chuỗi hoặc đối tượng)
 * hoặc RTF (văn bản cũ soạn bằng TX). Kết quả bộ soạn gửi về luôn là SFDT, nên có thể chỉ nhận SFDT.
 */
class NoiDungVanBan implements ValidationRule
{
    /**
     * Độ dài tối đa của nội dung (ký tự), đủ cho văn bản có ảnh nhúng.
     */
    public const DO_DAI_TOI_DA = 20_000_000;

    public function __construct(private bool $chiNhanSfdt = false) {}

    /**
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $noiDung = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;

        if (! is_string($noiDung) || strlen($noiDung) > self::DO_DAI_TOI_DA) {
            $fail('Nội dung văn bản không hợp lệ hoặc quá lớn.');

            return;
        }

        $dinhDang = self::dinhDang($noiDung);

        if ($dinhDang === null || ($this->chiNhanSfdt && $dinhDang !== 'sfdt')) {
            $fail($this->chiNhanSfdt
                ? 'Nội dung phải là SFDT của bộ soạn.'
                : 'Nội dung phải là SFDT của bộ soạn hoặc RTF.');
        }
    }

    /**
     * Đưa nội dung đã kiểm tra về dạng chuỗi để lưu.
     *
     * @param  string|array<string, mixed>  $noiDung
     */
    public static function chuanHoa(string|array $noiDung): string
    {
        return is_array($noiDung) ? (string) json_encode($noiDung, JSON_UNESCAPED_UNICODE) : $noiDung;
    }

    /**
     * "rtf", "sfdt", hoặc null nếu không phải hai dạng này. SFDT đầy đủ có khóa "sections", dạng rút gọn có "sec".
     */
    public static function dinhDang(string $noiDung): ?string
    {
        if (str_starts_with(ltrim($noiDung), '{\rtf')) {
            return 'rtf';
        }

        $duLieu = json_decode($noiDung, true);

        if (is_array($duLieu) && (is_array($duLieu['sections'] ?? null) || is_array($duLieu['sec'] ?? null))) {
            return 'sfdt';
        }

        return null;
    }
}
