<?php

namespace App\Services\ChuyenDoi;

use App\Services\ChuyenDoi\Rtf\BoPhanTichRtf;
use Throwable;

/**
 * Chuyển một tài liệu RTF (TX Text Control, Word, Syncfusion DocIO...) sang SFDT của Syncfusion EJ2 DocumentEditor v19,
 * thay cho dịch vụ .NET Import. Cấu trúc và giá trị mặc định bám theo SFDT dịch vụ .NET trả về.
 *
 * Không ném lỗi: RTF hỏng vẫn cho SFDT hợp lệ (tệ nhất là chữ thuần trong các đoạn).
 */
class RtfSangSfdt
{
    /**
     * Cờ json_encode khi ghi SFDT.
     */
    private const CO_JSON = JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_INVALID_UTF8_SUBSTITUTE;

    /**
     * Chuyển RTF sang chuỗi JSON SFDT.
     */
    public function chuyen(string $rtf): string
    {
        try {
            $sfdt = (new BoPhanTichRtf($rtf))->phanTich();
        } catch (Throwable) {
            $sfdt = self::taiLieuChuThuan(BoPhanTichRtf::chuThuan($rtf));
        }

        $json = json_encode($sfdt, self::CO_JSON);

        return $json !== false ? $json : (string) json_encode(self::taiLieuChuThuan(''), self::CO_JSON);
    }

    /**
     * SFDT tối thiểu: mỗi dòng chữ là một đoạn.
     *
     * @return array<string, mixed>
     */
    private static function taiLieuChuThuan(string $chu): array
    {
        $khoi = [];

        foreach (preg_split('/\R/u', $chu) ?: [''] as $dong) {
            $khoi[] = ['inlines' => $dong === '' ? [] : [['text' => $dong]]];
        }

        return [
            'sections' => [['blocks' => $khoi, 'headersFooters' => (object) [], 'sectionFormat' => [
                'pageWidth' => 595.3, 'pageHeight' => 841.9, 'leftMargin' => 85.05, 'rightMargin' => 56.7, 'topMargin' => 56.7, 'bottomMargin' => 56.7,
            ]]],
            'styles' => [
                ['type' => 'Paragraph', 'name' => 'Normal', 'next' => 'Normal', 'characterFormat' => ['fontSize' => 12.0, 'fontFamily' => 'Times New Roman']],
                ['type' => 'Character', 'name' => 'Default Paragraph Font'],
            ],
        ];
    }
}
