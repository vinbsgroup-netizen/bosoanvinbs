<?php

namespace App\Services\ChuyenDoi;

/**
 * Đổi văn bản thuần (.txt) sang SFDT: mỗi dòng một đoạn, tab là inline riêng như SFDT của file Word.
 *
 * Nhận UTF-8 (bỏ BOM), cũng đọc được UTF-16 có BOM; xuống dòng CRLF, LF hoặc CR. Như dịch vụ .NET, không đặt định
 * dạng trang để bộ soạn dùng mặc định, và dòng trống cuối file (sau ký tự xuống dòng cuối cùng) không thành đoạn.
 */
final class VanBanThuanSangSfdt
{
    public function chuyen(string $text): string
    {
        $text = $this->veUtf8($text);
        $cacDong = preg_split('/\r\n|\n|\r/', $text);

        if (count($cacDong) > 1 && end($cacDong) === '') {
            array_pop($cacDong);
        }

        $khoi = array_map(fn (string $dong): array => ['inlines' => $this->inlines($dong)], $cacDong);

        return json_encode([
            'sections' => [['blocks' => $khoi, 'headersFooters' => (object) []]],
            'background' => ['color' => '#FFFFFFFF'],
            'defaultTabWidth' => 36.0,
            'formatting' => false,
            'trackChanges' => false,
            'protectionType' => 'NoProtection',
            'enforcement' => false,
            'dontUseHTMLParagraphAutoSpacing' => false,
        ], JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_THROW_ON_ERROR);
    }

    /**
     * Bỏ BOM, đổi UTF-16 sang UTF-8; byte không hợp lệ UTF-8 thay bằng dấu "?".
     */
    private function veUtf8(string $text): string
    {
        if (str_starts_with($text, "\xFF\xFE") || str_starts_with($text, "\xFE\xFF")) {
            return (string) mb_convert_encoding(substr($text, 2), 'UTF-8', str_starts_with($text, "\xFF\xFE") ? 'UTF-16LE' : 'UTF-16BE');
        }

        if (str_starts_with($text, "\xEF\xBB\xBF")) {
            $text = substr($text, 3);
        }

        return mb_check_encoding($text, 'UTF-8') ? $text : (string) mb_scrub($text, 'UTF-8');
    }

    /**
     * Một dòng thành các inline: chữ, tab ("\t"), ngắt trang ("\f"); ký tự điều khiển khác bị bỏ.
     *
     * @return list<array{text: string}>
     */
    private function inlines(string $dong): array
    {
        $dong = (string) preg_replace('/[\x00-\x08\x0B\x0E-\x1F\x7F]/', '', $dong);
        $ketQua = [];

        foreach (preg_split('/([\t\f])/', $dong, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY) as $phan) {
            $ketQua[] = ['text' => $phan];
        }

        return $ketQua;
    }
}
