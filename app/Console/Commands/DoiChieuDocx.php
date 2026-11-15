<?php

namespace App\Console\Commands;

use App\Services\ChuyenDoi\DocxSangSfdt;
use App\Services\ChuyenDoi\DoiChieu\ChiSoSfdt;
use App\Services\ChuyenDoi\DoiChieu\DichVuDoiChieu;
use App\Services\ChuyenDoi\SfdtSangRtf;
use FilesystemIterator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Throwable;

/**
 * Đối chiếu bộ chuyển đổi PHP với dịch vụ .NET Syncfusion trên một kho DOCX (phục vụ phát triển):
 * (i) DOCX -> SFDT của PHP so với .NET Import cùng file;
 * (ii) khứ hồi RTF: SFDT -> RTF của PHP -> .NET Import, so với SFDT gốc và với khứ hồi qua .NET Export.
 *
 * Báo cáo chỉ gồm tên file, tỷ lệ và loại khác biệt, không in nội dung văn bản.
 */
#[Signature('bo-soan:doi-chieu-docx
    {thu_muc : Thư mục chứa file .docx (quét cả thư mục con)}
    {--dem= : Thư mục lưu đệm đáp án .NET (mặc định <thu_muc>/.dap-an)}
    {--luu= : Lưu SFDT và RTF do PHP sinh (kèm SFDT .NET) vào thư mục này để kiểm tra hiển thị}
    {--loc= : Chỉ xử lý file có tên chứa chuỗi này}
    {--chi-tiet : Liệt kê loại khác biệt của từng file}
    {--dich-vu=http://vi-sos.com:85/api/documenteditor/ : Dịch vụ .NET Syncfusion cũ dùng làm đáp án (bo-soan không còn dùng khi chạy)}')]
#[Description('Đối chiếu DOCX -> SFDT và SFDT -> RTF của PHP với dịch vụ .NET Syncfusion trên một kho DOCX')]
class DoiChieuDocx extends Command
{
    /**
     * Tên các phép đối chiếu.
     *
     * @var array<string, string>
     */
    private const PHEP = [
        'docx' => 'DOCX -> SFDT (PHP so với .NET Import)',
        'rtf' => 'Khứ hồi RTF (PHP RTF -> .NET Import, so với SFDT gốc)',
        'rtfNet' => 'Khứ hồi RTF (so với .NET Export -> .NET Import)',
    ];

    public function handle(DocxSangSfdt $docxSangSfdt, SfdtSangRtf $sfdtSangRtf): int
    {
        $thuMuc = rtrim((string) $this->argument('thu_muc'), '/\\');

        if (! is_dir($thuMuc)) {
            $this->error('Không có thư mục '.$thuMuc);

            return self::FAILURE;
        }

        $dem = (string) ($this->option('dem') ?: $thuMuc.'/.dap-an');
        $luu = $this->option('luu') ? rtrim((string) $this->option('luu'), '/\\') : null;
        $dichVu = new DichVuDoiChieu(rtrim((string) $this->option('dich-vu'), '/').'/', $dem);

        if ($luu !== null && ! is_dir($luu)) {
            mkdir($luu, 0777, true);
        }

        $tep = $this->cacTep($thuMuc);
        $thongKe = array_fill_keys(array_keys(self::PHEP), ['so' => 0, 'chu' => 0, 'cauTruc' => 0, 'dinhDang' => 0, 'khop' => 0, 'loai' => []]);
        $loi = [];
        $chiTiet = [];

        $this->withProgressBar($tep, function (string $duong) use ($docxSangSfdt, $sfdtSangRtf, $dichVu, $luu, &$thongKe, &$loi, &$chiTiet): void {
            $ten = basename($duong);
            $docx = (string) file_get_contents($duong);

            try {
                $sfdt = $docxSangSfdt->chuyen($docx);
                $rtf = $sfdtSangRtf->chuyen($sfdt);
            } catch (Throwable $e) {
                $loi[$ten] = class_basename($e).': '.$e->getMessage();

                return;
            }

            if ($luu !== null) {
                $goc = pathinfo($ten, PATHINFO_FILENAME);
                file_put_contents($luu.'/'.$goc.'.php.json', $sfdt);
                file_put_contents($luu.'/'.$goc.'.rtf', $rtf);
            }

            $cuaPhp = ChiSoSfdt::tuJson($sfdt);
            $netJson = $dichVu->nhap($docx, 'van-ban.docx');
            $cuaNet = $netJson === null ? null : ChiSoSfdt::tuJson($netJson);

            if ($luu !== null && $netJson !== null) {
                file_put_contents($luu.'/'.pathinfo($ten, PATHINFO_FILENAME).'.net.json', $netJson);
            }

            $khuHoiJson = $dichVu->nhap($rtf, 'van-ban.rtf');
            $khuHoi = $khuHoiJson === null ? null : ChiSoSfdt::tuJson($khuHoiJson);
            $rtfNet = $dichVu->xuatRtf($docx);
            $khuHoiNetJson = $rtfNet === null ? null : $dichVu->nhap($rtfNet, 'van-ban.rtf');
            $khuHoiNet = $khuHoiNetJson === null ? null : ChiSoSfdt::tuJson($khuHoiNetJson);

            foreach (['docx' => [$cuaPhp, $cuaNet], 'rtf' => [$khuHoi, $cuaPhp], 'rtfNet' => [$khuHoi, $khuHoiNet]] as $phep => [$a, $b]) {
                if ($b === null || ($phep !== 'docx' && $cuaPhp === null)) {
                    continue;
                }

                $thongKe[$phep]['so']++;
                $khac = $a === null ? ['chu' => ['khong-doc-duoc'], 'cauTruc' => ['khong-doc-duoc'], 'dinhDang' => []] : $a->soVoi($b);

                foreach (['chu', 'cauTruc', 'dinhDang'] as $nhom) {
                    $thongKe[$phep][$nhom] += $khac[$nhom] === [] ? 1 : 0;

                    foreach ($khac[$nhom] as $loai) {
                        $thongKe[$phep]['loai'][$loai] = ($thongKe[$phep]['loai'][$loai] ?? 0) + 1;
                    }
                }

                $tatCa = [...$khac['chu'], ...$khac['cauTruc'], ...$khac['dinhDang']];
                $thongKe[$phep]['khop'] += $tatCa === [] ? 1 : 0;

                if ($tatCa !== []) {
                    $chiTiet[$phep][$ten] = $tatCa;
                }
            }
        });

        $this->newLine(2);
        $this->baoCao($thongKe, $loi, $chiTiet, count($tep));

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function cacTep(string $thuMuc): array
    {
        $loc = (string) ($this->option('loc') ?? '');
        $tep = [];

        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($thuMuc, FilesystemIterator::SKIP_DOTS)) as $f) {
            $duong = $f->getPathname();

            if (strtolower($f->getExtension()) === 'docx' && ! str_contains($duong, '.dap-an') && ($loc === '' || str_contains($f->getFilename(), $loc))) {
                $tep[] = $duong;
            }
        }

        sort($tep);

        return $tep;
    }

    /**
     * @param  array<string, array{so: int, chu: int, cauTruc: int, dinhDang: int, khop: int, loai: array<string, int>}>  $thongKe
     * @param  array<string, string>  $loi
     * @param  array<string, array<string, list<string>>>  $chiTiet
     */
    private function baoCao(array $thongKe, array $loi, array $chiTiet, int $tongTep): void
    {
        $tyLe = fn (int $so, int $tong): string => $tong === 0 ? '-' : sprintf('%d/%d (%.1f%%)', $so, $tong, $so * 100 / $tong);

        $this->info('Số file: '.$tongTep.', lỗi chuyển đổi: '.count($loi));

        foreach ($loi as $ten => $thongDiep) {
            $this->line('  LỖI '.$ten.': '.$thongDiep);
        }

        $this->table(
            ['Phép', 'Khớp chữ', 'Khớp cấu trúc', 'Khớp định dạng', 'Khớp tất cả'],
            array_map(fn (string $phep): array => [
                self::PHEP[$phep],
                $tyLe($thongKe[$phep]['chu'], $thongKe[$phep]['so']),
                $tyLe($thongKe[$phep]['cauTruc'], $thongKe[$phep]['so']),
                $tyLe($thongKe[$phep]['dinhDang'], $thongKe[$phep]['so']),
                $tyLe($thongKe[$phep]['khop'], $thongKe[$phep]['so']),
            ], array_keys(self::PHEP)),
        );

        foreach (self::PHEP as $phep => $tieuDe) {
            if ($thongKe[$phep]['loai'] === []) {
                continue;
            }

            arsort($thongKe[$phep]['loai']);
            $this->line($tieuDe.' - loại khác biệt (số file): '.implode(', ', array_map(
                fn (string $loai, int $so): string => $loai.' '.$so,
                array_keys($thongKe[$phep]['loai']),
                $thongKe[$phep]['loai'],
            )));

            if ($this->option('chi-tiet')) {
                foreach ($chiTiet[$phep] ?? [] as $ten => $cacLoai) {
                    $this->line('    '.$ten.': '.implode(', ', $cacLoai));
                }
            }
        }
    }
}
