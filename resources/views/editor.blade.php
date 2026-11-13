<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bộ soạn văn bản</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script>window.BO_SOAN = @json($phien ?? null);</script>
    @vite(['resources/css/app.css', 'resources/css/editor.css', 'resources/js/app.js'])
</head>
<body>
<div id="bo-soan">
    <div class="bs-topbar">
        <div class="bs-qat" role="toolbar" aria-label="Truy cập nhanh">
            <button type="button" data-action="qatSave" title="Tải về JSON"><span class="bs-icon" data-icon="save"></span></button>
            <button type="button" data-action="undo" title="Hoàn tác"><span class="bs-icon" data-icon="undo"></span></button>
            <button type="button" data-action="redo" title="Làm lại"><span class="bs-icon" data-icon="redo"></span></button>
        </div>
        <div class="bs-tabs wk-tabs" role="tablist" data-tabs></div>
    </div>

    <div data-home-panel></div>

    <div class="bs-hf-panel" data-hf-panel hidden>
        <div class="bs-hf-row">
            <label>Đầu trang <input type="text" data-hf="dauText" style="width:220px"></label>
            <label>Căn <select data-hf="dauCanh"><option value="trai">Trái</option><option value="giua">Giữa</option><option value="phai">Phải</option></select></label>
        </div>
        <div class="bs-hf-row">
            <label>Chân trang <input type="text" data-hf="chanText" style="width:220px"></label>
            <label>Căn <select data-hf="chanCanh"><option value="trai">Trái</option><option value="giua">Giữa</option><option value="phai">Phải</option></select></label>
        </div>
        <div class="bs-hf-row">
            <label><input type="checkbox" data-hf="trangDauKhac"> Trang đầu khác</label>
        </div>
        <div class="bs-hf-row" data-hf-first hidden>
            <label>Đầu trang trang đầu <input type="text" data-hf="dauTrangDauText" style="width:200px"></label>
            <label>Chân trang trang đầu <input type="text" data-hf="chanTrangDauText" style="width:200px"></label>
        </div>
        <div class="bs-hf-row">
            <label>Số trang <select data-hf="soTrangViTri">
                <option value="khong">Không</option>
                <option value="duoi_trai">Chân trang, trái</option>
                <option value="duoi_giua">Chân trang, giữa</option>
                <option value="duoi_phai">Chân trang, phải</option>
            </select></label>
            <label>Định dạng <select data-hf="soTrangDinhDang">
                <option value="{n}">1</option>
                <option value="Trang {n}">Trang 1</option>
                <option value="{n}/{tong}">1/N</option>
            </select></label>
            <span class="bs-hint">Dùng {n} cho số trang, {tong} cho tổng số trang.</span>
            <button type="button" data-action="closeHf" title="Đóng">✕</button>
        </div>
    </div>

    <div class="bs-findbar" data-findbar hidden>
        <input type="text" data-control="findText" placeholder="Tìm" style="width:180px">
        <button type="button" data-action="findNext">Tìm tiếp</button>
        <input type="text" data-control="replaceText" placeholder="Thay bằng" style="width:180px">
        <button type="button" data-action="replaceOne">Thay</button>
        <button type="button" data-action="replaceAll">Thay tất cả</button>
        <span data-control="findStatus" class="bs-hint"></span>
        <button type="button" data-action="closeFind" title="Đóng">✕</button>
    </div>

    <div data-ribbon-panels></div>

    <div class="bs-page-wrap">
        <div class="bs-page-row">
            <div class="bs-vcol">
                <button type="button" class="bs-corner" data-corner title="Chọn kiểu điểm dừng tab">L</button>
                <div class="bs-vruler" data-vruler></div>
            </div>
            <div>
                <div class="bs-ruler"></div>
                <div class="bs-page">
                    <div data-editor-surface></div>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
