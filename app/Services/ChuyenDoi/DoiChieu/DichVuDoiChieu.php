<?php

namespace App\Services\ChuyenDoi\DoiChieu;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Gọi dịch vụ .NET Syncfusion (Import, Export) để lấy "đáp án" đối chiếu, lưu đệm theo sha1 nội dung gửi đi.
 * Chỉ dùng cho lệnh đối chiếu khi phát triển.
 */
final class DichVuDoiChieu
{
    public function __construct(private readonly string $diaChi, private readonly string $thuMucDem)
    {
        if (! is_dir($thuMucDem) && ! mkdir($thuMucDem, 0777, true) && ! is_dir($thuMucDem)) {
            throw new RuntimeException('Không tạo được thư mục đệm '.$thuMucDem);
        }
    }

    /**
     * SFDT do .NET Import sinh cho nội dung (DOCX hoặc RTF); null nếu dịch vụ báo lỗi.
     */
    public function nhap(string $noiDung, string $tenTep, string $hauTo = 'import.json'): ?string
    {
        return $this->goi('Import', $noiDung, $tenTep, [], $hauTo);
    }

    /**
     * RTF do .NET Export sinh cho DOCX; null nếu dịch vụ báo lỗi.
     */
    public function xuatRtf(string $docx): ?string
    {
        return $this->goi('Export', $docx, 'van-ban.docx', ['filename' => 'van-ban.rtf'], 'export.rtf');
    }

    /**
     * @param  array<string, string>  $truong
     */
    private function goi(string $hanhDong, string $noiDung, string $tenTep, array $truong, string $hauTo): ?string
    {
        $tep = $this->thuMucDem.'/'.sha1($noiDung).'.'.$hauTo;

        if (is_file($tep)) {
            return (string) file_get_contents($tep);
        }

        if (is_file($tep.'.loi')) {
            return null;
        }

        try {
            $phanHoi = Http::connectTimeout(10)->timeout(300)->attach('files', $noiDung, $tenTep)->post($this->diaChi.$hanhDong, $truong);
        } catch (ConnectionException) {
            return null;
        }

        if (! $phanHoi->successful() || trim($phanHoi->body()) === '') {
            file_put_contents($tep.'.loi', 'HTTP '.$phanHoi->status());

            return null;
        }

        file_put_contents($tep, $phanHoi->body());

        return $phanHoi->body();
    }
}
