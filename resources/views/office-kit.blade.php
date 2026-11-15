<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $phien['tieu_de'] ?? 'Bộ soạn văn bản' }}</title>
    <style>
        html, body { margin: 0; height: 100%; overflow: hidden; background: #e5e5e5; font-family: 'Segoe UI', Arial, sans-serif; }
        #documenteditor_titlebar { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 12px; background: #1abb9c; color: #fff; font-size: 13px; }
        .bs-tieu-de { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
        /* Office kit tự thêm tên văn bản và các nút Print, Import, Sửa trên Word vào thanh tiêu đề; ribbon đã có In và Tải DOCX. */
        #documenteditor_titlebar > #documenteditor_title_contentEditor, #de-print, #de-open, #documenteditor-share { display: none !important; }
        .bs-ten-van-ban { overflow: hidden; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
        .bs-nut-luu { padding: 5px 14px; border: 0; border-radius: 3px; background: #185abd; color: #fff; font: inherit; cursor: pointer; }
        .bs-nut-luu:disabled { opacity: .6; cursor: default; }
        .bs-trang-thai { opacity: .9; white-space: nowrap; }
        #documenteditor_container_body { position: relative; display: flex; }
        #container { width: 100%; }
    </style>
</head>
<body>
    <div id="documenteditor_titlebar" class="e-de-ctn-title">
        <span class="bs-tieu-de">
            <span class="bs-ten-van-ban">{{ $phien['tieu_de'] ?? 'Bộ soạn văn bản' }}</span>
            @if ($phien)
                <button type="button" id="submit-noidung" class="bs-nut-luu" title="Lưu và gửi văn bản về phần mềm đã mở bộ soạn">Lưu kết quả</button>
                <span class="bs-trang-thai" data-trang-thai></span>
            @endif
        </span>
    </div>
    <div id="documenteditor_container_body">
        <div id="container"></div>
    </div>

    <script>
        // QR và logo khi xuất là cấu hình riêng của phần mềm khách, bộ soạn chung không gắn.
        window.documentExportQrDisabled = true;
        window.documentExportLogoDisabled = true;
    </script>
    {{-- Bộ soạn Office kit (Syncfusion DocumentEditor) của hợp đồng V2, nạp qua cùng script nhúng mà phần mềm khách dùng.
         Đường dẫn tương đối để dịch vụ Syncfusion và chuyển PDF đi qua chính bo-soan, đúng http/https của trang. --}}
    <script src="{{ route('api.nhung', [], false) }}"></script>
    <script>
        (function () {
            var phien = @json($phien);
            var editor = container.documentEditor;

            // Bộ soạn chiếm hết phần còn lại của cửa sổ, bên dưới thanh tiêu đề và ribbon.
            function datChieuCao() {
                var top = document.getElementById('container').getBoundingClientRect().top;
                boSoanVuaKhung(Math.max(window.innerHeight - top, 300));
            }
            window.addEventListener('resize', datChieuCao);
            [0, 300, 1000].forEach(function (delay) { setTimeout(datChieuCao, delay); });

            if (!phien) {
                // Office kit mở sẵn văn bản mẫu ("Van ban mau."); không có phiên thì mở trang trắng như lệnh "Mới".
                editor.open(JSON.stringify(syncfusionOfficeKitDocument([syncfusionOfficeKitParagraph('')])));
                return;
            }

            editor.documentName = phien.tieu_de;
            try {
                if (phien.dinh_dang === 'rtf') {
                    importSyncfusionOfficeKitWordFile(new File([phien.noi_dung], 'van-ban.rtf', { type: 'application/rtf' }), editor, 'van-ban.rtf');
                } else {
                    editor.open(phien.noi_dung);
                }
            } catch (error) {
                console.error('Không mở được văn bản của phiên:', error);
            }

            var nutLuu = document.getElementById('submit-noidung');
            var trangThai = document.querySelector('[data-trang-thai]');

            nutLuu.addEventListener('click', function () {
                nutLuu.disabled = true;
                trangThai.textContent = 'Đang lưu...';
                fetch(phien.ket_qua_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({ noi_dung: editor.serialize() }),
                }).then(function (response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    trangThai.textContent = 'Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN');
                    // Trang nhúng bộ soạn (iframe) nhận tín hiệu rồi tự lấy nội dung qua API bằng token của mình.
                    if (window.parent !== window) {
                        window.parent.postMessage({ type: 'bo-soan:da-luu', ma_phien: phien.ma }, '*');
                    }
                }).catch(function (error) {
                    trangThai.textContent = 'Không lưu được (' + error.message + ')';
                }).finally(function () {
                    nutLuu.disabled = false;
                });
            });
        })();
    </script>
</body>
</html>
