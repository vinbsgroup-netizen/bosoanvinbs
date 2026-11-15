<?php

namespace App\Console\Commands;

use App\Services\ChuyenDoi\RtfSangSfdt;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Công cụ phát triển: đối chiếu SFDT do RtfSangSfdt sinh với SFDT "đáp án" của dịch vụ .NET (X.net.sfdt cạnh X.rtf).
 *
 * So theo chữ từng đoạn (chuẩn hóa khoảng trắng), số đoạn/bảng/hàng/ô/ảnh/trường/mục danh sách, phần chữ
 * đậm/nghiêng/gạch chân, căn lề và cỡ chữ từng đoạn. Báo cáo chỉ ghi loại khác biệt, không in nội dung văn bản.
 */
#[Signature('bo-soan:doi-chieu-rtf {thu_muc : Thư mục chứa X.rtf và X.net.sfdt} {--ghi : Ghi SFDT sinh ra thành X.php.sfdt} {--loc= : Chỉ xét file có tên chứa chuỗi này}')]
#[Description('Đối chiếu SFDT chuyển từ RTF bằng PHP với SFDT của dịch vụ .NET')]
class DoiChieuRtf extends Command
{
    /**
     * Các số đếm cấu trúc được so.
     *
     * @var list<string>
     */
    private const CAU_TRUC = ['doan', 'bang', 'hang', 'o', 'anh', 'truong', 'mucDanhSach', 'phan', 'dauChan'];

    public function handle(RtfSangSfdt $boChuyen): int
    {
        $thuMuc = rtrim((string) $this->argument('thu_muc'), '/\\');
        $loc = (string) $this->option('loc');
        $cacFile = array_values(array_filter(
            glob($thuMuc.DIRECTORY_SEPARATOR.'*.rtf') ?: [],
            fn (string $tep): bool => is_file(substr($tep, 0, -4).'.net.sfdt') && ($loc === '' || str_contains(basename($tep), $loc)),
        ));

        if ($cacFile === []) {
            $this->error('Không có cặp X.rtf / X.net.sfdt nào trong thư mục.');

            return self::FAILURE;
        }

        $tong = ['chu' => 0, 'cauTruc' => 0, 'canLe' => 0, 'dinhDang' => 0, 'coChu' => 0];
        $loaiKhac = [];
        $thoiGian = 0.0;

        foreach ($cacFile as $tep) {
            $batDau = microtime(true);
            $sfdtPhp = $boChuyen->chuyen((string) file_get_contents($tep));
            $thoiGian += microtime(true) - $batDau;

            if ($this->option('ghi')) {
                file_put_contents(substr($tep, 0, -4).'.php.sfdt', $sfdtPhp);
            }

            $php = $this->tomTat(json_decode($sfdtPhp, true) ?? []);
            $net = $this->tomTat(json_decode((string) file_get_contents(substr($tep, 0, -4).'.net.sfdt'), true) ?? []);
            $khac = $this->soSanh($php, $net);

            $tong['chu'] += isset($khac['chu']) ? 0 : 1;
            $tong['cauTruc'] += array_intersect_key($khac, array_flip(self::CAU_TRUC)) === [] ? 1 : 0;
            $tong['canLe'] += isset($khac['canLe']) ? 0 : 1;
            $tong['dinhDang'] += array_intersect_key($khac, array_flip(['dam', 'nghieng', 'gachChan', 'coChu'])) === [] ? 1 : 0;
            $tong['coChu'] += isset($khac['coChu']) ? 0 : 1;

            foreach (array_keys($khac) as $loai) {
                $loaiKhac[$loai] = ($loaiKhac[$loai] ?? 0) + 1;
            }

            if ($khac !== []) {
                $this->line(sprintf('%-28s %s', basename($tep), implode('; ', array_map(
                    fn (string $loai, string $moTa): string => $loai.' '.$moTa,
                    array_keys($khac),
                    $khac,
                ))));
            }
        }

        $soFile = count($cacFile);
        $tiLe = fn (int $so): string => sprintf('%d/%d (%.1f%%)', $so, $soFile, 100 * $so / $soFile);

        $this->newLine();
        $this->table(['Tiêu chí', 'Số file khớp'], [
            ['Chữ từng đoạn', $tiLe($tong['chu'])],
            ['Số lượng cấu trúc', $tiLe($tong['cauTruc'])],
            ['Căn lề từng đoạn', $tiLe($tong['canLe'])],
            ['Đậm/nghiêng/gạch chân/cỡ chữ', $tiLe($tong['dinhDang'])],
        ]);

        arsort($loaiKhac);
        $this->line('Loại khác biệt (số file): '.implode(', ', array_map(fn (string $l, int $n): string => "$l=$n", array_keys($loaiKhac), $loaiKhac)));
        $this->line(sprintf('Thời gian chuyển trung bình: %.1f ms/file', 1000 * $thoiGian / $soFile));

        return self::SUCCESS;
    }

    /**
     * Rút gọn SFDT thành danh sách đoạn (thân rồi đầu/chân trang) và các số đếm.
     *
     * @param  array<string, mixed>  $sfdt
     * @return array{doan: list<array<string, mixed>>, dem: array<string, int>}
     */
    private function tomTat(array $sfdt): array
    {
        $kq = ['doan' => [], 'dem' => array_fill_keys(self::CAU_TRUC, 0)];

        foreach ($sfdt['sections'] ?? [] as $section) {
            $kq['dem']['phan']++;
            // Section không có khối nào (.NET trả cho tài liệu rỗng) tương đương một đoạn trống.
            $this->duyetKhoi(($section['blocks'] ?? []) ?: [['inlines' => []]], $kq);

            foreach ((array) ($section['headersFooters'] ?? []) as $dauChan) {
                if (($dauChan['blocks'] ?? []) !== []) {
                    $kq['dem']['dauChan']++;
                }
            }
        }

        return $kq;
    }

    /**
     * @param  list<array<string, mixed>>  $khoi
     * @param  array{doan: list<array<string, mixed>>, dem: array<string, int>}  $kq
     */
    private function duyetKhoi(array $khoi, array &$kq): void
    {
        foreach ($khoi as $k) {
            if (isset($k['rows'])) {
                $kq['dem']['bang']++;

                foreach ($k['rows'] as $hang) {
                    $kq['dem']['hang']++;

                    foreach ($hang['cells'] ?? [] as $o) {
                        $kq['dem']['o']++;
                        $this->duyetKhoi($o['blocks'] ?? [], $kq);
                    }
                }

                continue;
            }

            $kq['dem']['doan']++;

            if (isset($k['paragraphFormat']['listFormat']['listId'])) {
                $kq['dem']['mucDanhSach']++;
            }

            $doan = ['chu' => '', 'dam' => '', 'nghieng' => '', 'gachChan' => '', 'co' => [], 'canLe' => $k['paragraphFormat']['textAlignment'] ?? 'Left'];
            $trongMa = 0;

            foreach ($k['inlines'] ?? [] as $inline) {
                if (isset($inline['fieldType'])) {
                    if ($inline['fieldType'] === 0) {
                        $kq['dem']['truong']++;
                        $trongMa++;
                    } elseif ($inline['fieldType'] === 2) {
                        $trongMa = max(0, $trongMa - 1);
                    }

                    continue;
                }

                if (isset($inline['imageString'])) {
                    if (preg_match('#^data:image/(png|jpeg);base64,(iVBOR|/9j/)#', $inline['imageString'])) {
                        $kq['dem']['anh']++;
                    }

                    continue;
                }

                if (! isset($inline['text']) || $trongMa > 0) {
                    continue;
                }

                $chu = $inline['text'];
                $dd = $inline['characterFormat'] ?? [];
                $doan['chu'] .= $chu;
                $gon = $this->boKhoangTrang($chu);

                if ($gon === '') {
                    continue;
                }

                $doan['dam'] .= ! empty($dd['bold']) ? $gon : '';
                $doan['nghieng'] .= ! empty($dd['italic']) ? $gon : '';
                $doan['gachChan'] .= ($dd['underline'] ?? 'None') !== 'None' ? $gon : '';
                $doan['co'][(string) (float) ($dd['fontSize'] ?? 0)] = true;
            }

            $doan['chu'] = trim((string) preg_replace('/[\s\x{00A0}\x{2000}-\x{200B}\x{FEFF}]+/u', ' ', $doan['chu']));
            ksort($doan['co']);
            $kq['doan'][] = $doan;
        }
    }

    private function boKhoangTrang(string $chu): string
    {
        return (string) preg_replace('/[\s\x{00A0}\x{2000}-\x{200B}\x{FEFF}]+/u', '', $chu);
    }

    /**
     * Các loại khác biệt và mô tả ngắn (chỉ số lượng, vị trí; không có nội dung văn bản).
     *
     * @param  array{doan: list<array<string, mixed>>, dem: array<string, int>}  $php
     * @param  array{doan: list<array<string, mixed>>, dem: array<string, int>}  $net
     * @return array<string, string>
     */
    private function soSanh(array $php, array $net): array
    {
        $khac = [];

        foreach (self::CAU_TRUC as $loai) {
            if ($php['dem'][$loai] !== $net['dem'][$loai]) {
                $khac[$loai] = sprintf('php=%d net=%d', $php['dem'][$loai], $net['dem'][$loai]);
            }
        }

        $chuPhp = array_column($php['doan'], 'chu');
        $chuNet = array_column($net['doan'], 'chu');

        if ($chuPhp !== $chuNet) {
            $lech = 0;
            $dau = null;

            foreach ($chuNet as $i => $chu) {
                if (($chuPhp[$i] ?? null) !== $chu) {
                    $lech++;
                    $dau ??= $i;
                }
            }

            $giongNoiChung = $this->boKhoangTrang(implode('', $chuPhp)) === $this->boKhoangTrang(implode('', $chuNet));
            $khac['chu'] = sprintf('%d đoạn lệch, đầu tiên ở đoạn %d%s', $lech, $dau ?? count($chuNet), $giongNoiChung ? ' (cùng chữ, khác chia đoạn/khoảng trắng)' : '');
        }

        if (count($php['doan']) !== count($net['doan'])) {
            return $khac;
        }

        foreach (['canLe' => 'canLe', 'dam' => 'dam', 'nghieng' => 'nghieng', 'gachChan' => 'gachChan', 'coChu' => 'co'] as $loai => $khoa) {
            $lech = [];

            foreach ($net['doan'] as $i => $doan) {
                if ($php['doan'][$i][$khoa] !== $doan[$khoa]) {
                    $lech[] = $i;
                }
            }

            if ($lech !== []) {
                $khac[$loai] = sprintf('%d đoạn (vd. đoạn %s)', count($lech), implode(',', array_slice($lech, 0, 3)));
            }
        }

        return $khac;
    }
}
