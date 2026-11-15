<?php

namespace Tests\Unit;

use App\Rules\NoiDungVanBan;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class NoiDungVanBanTest extends TestCase
{
    private function loiKhiKiemTra(mixed $giaTri, bool $chiNhanSfdt = false): ?string
    {
        $loi = null;
        (new NoiDungVanBan($chiNhanSfdt))->validate('noi_dung', $giaTri, function (string $thongBao) use (&$loi): void {
            $loi = $thongBao;
        });

        return $loi;
    }

    /**
     * @return array<string, array{mixed, string}>
     */
    public static function noiDungHopLe(): array
    {
        return [
            'SFDT đầy đủ dạng chuỗi' => ['{"sections":[{"blocks":[]}]}', 'sfdt'],
            'SFDT rút gọn dạng chuỗi' => ['{"sec":[{"b":[]}]}', 'sfdt'],
            'SFDT dạng đối tượng' => [['sections' => [['blocks' => []]]], 'sfdt'],
            'RTF của TX' => ['{\\rtf1\\ansi Xin chào}', 'rtf'],
        ];
    }

    #[DataProvider('noiDungHopLe')]
    public function test_sfdt_and_rtf_content_is_accepted(mixed $giaTri, string $dinhDang): void
    {
        $this->assertNull($this->loiKhiKiemTra($giaTri));
        $this->assertSame($dinhDang, NoiDungVanBan::dinhDang(NoiDungVanBan::chuanHoa($giaTri)));
    }

    /**
     * @return array<string, array{mixed, string}>
     */
    public static function noiDungKhongHopLe(): array
    {
        $khongPhaiSfdt = 'Nội dung phải là SFDT của bộ soạn hoặc RTF.';

        return [
            'JSON không phải SFDT' => ['{"type":"doc","content":[]}', $khongPhaiSfdt],
            'HTML' => ['<p>Xin chào</p>', $khongPhaiSfdt],
            'mảng không phải SFDT' => [['type' => 'doc'], $khongPhaiSfdt],
            'số' => [123, 'Nội dung văn bản không hợp lệ hoặc quá lớn.'],
        ];
    }

    #[DataProvider('noiDungKhongHopLe')]
    public function test_content_that_is_neither_sfdt_nor_rtf_is_rejected(mixed $giaTri, string $thongBao): void
    {
        $this->assertSame($thongBao, $this->loiKhiKiemTra($giaTri));
    }

    public function test_rtf_is_rejected_when_only_sfdt_is_allowed(): void
    {
        $this->assertSame('Nội dung phải là SFDT của bộ soạn.', $this->loiKhiKiemTra('{\rtf1 Xin chào}', chiNhanSfdt: true));
        $this->assertNull($this->loiKhiKiemTra('{"sections":[]}', chiNhanSfdt: true));
    }

    public function test_content_longer_than_the_limit_is_rejected(): void
    {
        $quaDai = '{"sections":[],"x":"'.str_repeat('a', NoiDungVanBan::DO_DAI_TOI_DA).'"}';

        $this->assertSame('Nội dung văn bản không hợp lệ hoặc quá lớn.', $this->loiKhiKiemTra($quaDai));
    }
}
