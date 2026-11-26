/*
 * Điều chỉnh của bo-soan cho Office kit, chạy ngay sau office-kit.js (api/nhung nạp file này).
 * Dùng chung cho trang soạn của bo-soan và các phần mềm nhúng bộ soạn, nên sửa ở đây là mọi nơi cùng nhận.
 * Các file Office kit khác giữ nguyên như bản của hợp đồng V2 để có thể chép đè khi cập nhật.
 */
(function () {
    if (!window.container || !window.container.documentEditor) {
        return;
    }

    // Office kit đặt pageOutline = "FF000" (mã màu sai nên canvas vẽ viền đen quanh trang). Bỏ khung trang.
    container.documentEditor.pageOutline = 'transparent';

    /*
     * Đặt chiều cao bộ soạn vừa khít một khung. Office kit đặt ribbon và thước ngang bên trong #container, phía trên
     * vùng soạn (.e-de-ctn), nhưng vùng soạn vẫn lấy đủ container.height: bộ soạn cao hơn khung đúng bằng ribbon + thước,
     * thanh trạng thái bị khuất. Syncfusion còn trừ chiều cao thanh công cụ gốc (Office kit đã ẩn), nên bù phần trống đó.
     * Ribbon thu gọn hay mở rộng thì tự tính lại.
     */
    window.boSoanVuaKhung = function (chieuCaoKhung) {
        var khung = container.element;
        window.boSoanVuaKhung.khung = chieuCaoKhung;
        container.height = chieuCaoKhung + 'px';
        khung.style.overflow = 'hidden';

        var vungSoan = khung.querySelector('.e-de-ctn');
        if (vungSoan) {
            var phanTren = Math.max(0, vungSoan.getBoundingClientRect().top - khung.getBoundingClientRect().top);
            var cao = Math.max(300, chieuCaoKhung - phanTren);
            vungSoan.style.height = cao + 'px';
            container.resize();

            var thanhTrangThai = khung.querySelector('.e-de-status-bar');
            if (thanhTrangThai) {
                var trong = Math.round(khung.getBoundingClientRect().top + chieuCaoKhung - thanhTrangThai.getBoundingClientRect().bottom);
                if (Math.abs(trong) > 1) {
                    vungSoan.style.height = Math.max(300, cao + trong) + 'px';
                    container.resize();
                }
            }
        }

        var ribbon = document.getElementById('syncfusion-office-kit-ribbon');
        if (ribbon && window.ResizeObserver && !window.boSoanVuaKhung.dangTheoDoi) {
            window.boSoanVuaKhung.dangTheoDoi = true;
            var caoRibbon = ribbon.offsetHeight;
            new ResizeObserver(function () {
                if (ribbon.offsetHeight !== caoRibbon) {
                    caoRibbon = ribbon.offsetHeight;
                    window.boSoanVuaKhung(window.boSoanVuaKhung.khung);
                }
            }).observe(ribbon);
        }
    };

    // "Mở file Word" của Office kit chỉ lọc .doc, .docx, .sfdt; dịch vụ mở file của bo-soan nhận cả RTF và văn bản thuần (.txt).
    if (typeof getSyncfusionOfficeKitImportInput === 'function') {
        getSyncfusionOfficeKitImportInput().accept = '.doc,.docx,.rtf,.txt,.sfdt,application/msword,'
            + 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,application/json';
    }

    giuTabKhiGianDeu(container.documentEditor.documentHelper && container.documentEditor.documentHelper.layout);
    danhLaiSoTrang(container.documentEditor.documentHelper && container.documentEditor.documentHelper.layout);

    /*
     * Đánh lại số trang khi trang bị xóa hoặc chèn vào giữa văn bản.
     * Syncfusion dàn đầu/chân trang (cùng số trang trong đó) đúng một lần lúc tạo trang. Bỏ một trang thì các trang sau dồn lên
     * nhưng vẫn giữ đầu/chân trang cũ: 4 trang xóa trang 2 thì số trang còn 1, 3, 4. Sau mỗi lần dàn lại (updateFieldElements),
     * trang nào đã đổi vị trí thì dàn lại đầu/chân trang theo vị trí mới, nên đúng cả số trang lẫn kiểu trang đầu, trang chẵn/lẻ.
     */
    function danhLaiSoTrang(layout) {
        var nguyenMau = layout && Object.getPrototypeOf(layout);
        if (!nguyenMau || typeof nguyenMau.layoutHeaderFooter !== 'function' || typeof nguyenMau.updateFieldElements !== 'function'
            || nguyenMau.boSoanDanhLaiSoTrang) {
            return;
        }
        nguyenMau.boSoanDanhLaiSoTrang = true;

        // Vị trí của trang lúc đầu/chân trang của nó được dàn.
        var viTriLucDan = new WeakMap();
        var layoutHeaderFooterGoc = nguyenMau.layoutHeaderFooter;
        var updateFieldElementsGoc = nguyenMau.updateFieldElements;

        nguyenMau.layoutHeaderFooter = function (thanTrang, viewer, trang) {
            var ketQua = layoutHeaderFooterGoc.apply(this, arguments);
            if (trang) {
                viTriLucDan.set(trang, trang.index);
            }

            return ketQua;
        };

        nguyenMau.updateFieldElements = function () {
            var ketQua = updateFieldElementsGoc.apply(this, arguments);
            danLaiDauChanTrangDoiViTri(this, viTriLucDan);

            return ketQua;
        };
    }

    function danLaiDauChanTrangDoiViTri(layout, viTriLucDan) {
        var helper = layout.documentHelper;
        var viewer = layout.viewer;
        var soanThao = helper && helper.owner && helper.owner.editorModule;
        if (!soanThao || typeof soanThao.updateHeaderFooterWidgetToPageInternal !== 'function' || !viewer
            || typeof viewer.getCurrentHeaderFooter !== 'function' || helper.owner.layoutType !== 'Pages') {
            return;
        }

        var vungCu = null;
        helper.pages.forEach(function (trang) {
            var viTri = trang.index;
            if (!viTriLucDan.has(trang)) {
                viTriLucDan.set(trang, viTri);
                return;
            }
            if (viTriLucDan.get(trang) === viTri || !trang.bodyWidgets || !trang.bodyWidgets[0]) {
                return;
            }

            // Dàn đầu/chân trang làm đổi vùng soạn của viewer; giữ lại để trả về như cũ.
            vungCu = vungCu || { clientArea: viewer.clientArea, clientActiveArea: viewer.clientActiveArea };
            [true, false].forEach(function (laDauTrang) {
                var mau = viewer.getCurrentHeaderFooter(loaiDauChanTrang(trang, laDauTrang), trang.bodyWidgets[0].index);
                if (mau && (laDauTrang ? trang.headerWidget : trang.footerWidget)) {
                    soanThao.updateHeaderFooterWidgetToPageInternal(trang, mau, laDauTrang);
                }
            });
            viTriLucDan.set(trang, viTri);
        });

        if (vungCu) {
            viewer.clientArea = vungCu.clientArea;
            viewer.clientActiveArea = vungCu.clientActiveArea;
        }
    }

    /*
     * Kiểu đầu/chân trang theo vị trí trang, như Viewer.getHeaderFooterType của Syncfusion
     * (bản gốc lấy theo số trang hiện có lúc tạo trang, chỉ đúng với trang thêm vào cuối).
     */
    function loaiDauChanTrang(trang, laDauTrang) {
        var dinhDang = trang.bodyWidgets[0].sectionFormat;
        var trangTruoc = trang.previousPage;
        if (dinhDang.differentFirstPage && (!trangTruoc || trang.sectionIndex !== trangTruoc.sectionIndex)) {
            return laDauTrang ? 'FirstPageHeader' : 'FirstPageFooter';
        }
        if (dinhDang.differentOddAndEvenPages && (trang.index + 1) % 2 === 0) {
            return laDauTrang ? 'EvenHeader' : 'EvenFooter';
        }

        return laDauTrang ? 'OddHeader' : 'OddFooter';
    }

    /*
     * Giãn đều như Word: dòng có tab thì chỉ giãn dấu cách nằm sau tab cuối cùng của dòng.
     * Syncfusion chia khoảng dư cho mọi dấu cách trên dòng, kể cả dấu cách trong nhãn trước tab ("Căn cước công dân số"),
     * nhưng độ rộng tab đã tính từ trước nên phần sau tab bị đẩy sang phải: dấu ":" của dòng xuống hàng lệch với dòng một hàng.
     * Vá trên prototype của Layout nên mọi bộ soạn trên trang, bản in và PDF đều nhận.
     */
    function giuTabKhiGianDeu(layout) {
        var nguyenMau = layout && Object.getPrototypeOf(layout);
        if (!nguyenMau || typeof nguyenMau.getSubWidth !== 'function' || typeof nguyenMau.alignLineElements !== 'function'
            || nguyenMau.boSoanGiuTabKhiGianDeu) {
            return;
        }
        nguyenMau.boSoanGiuTabKhiGianDeu = true;

        // Dòng đang được giãn đều (theo từng Layout) và vị trí tab cuối của nó; getSubWidth luôn chạy ngay trước alignLineElements của dòng.
        var dongDangGian = new WeakMap();
        var getSubWidthGoc = nguyenMau.getSubWidth;
        var alignLineElementsGoc = nguyenMau.alignLineElements;

        nguyenMau.getSubWidth = function (dong, gianDeu) {
            var ketQua = getSubWidthGoc.apply(this, arguments);
            dongDangGian.delete(this);
            if (!gianDeu || !ketQua || !(ketQua.spaceCount > 0) || !(ketQua.subWidth > 0) || !dong || !dong.children
                || (dong.paragraph && dong.paragraph.paragraphFormat && dong.paragraph.paragraphFormat.bidi)) {
                return ketQua;
            }

            var viTriTab = viTriTabCuoi(dong);
            if (viTriTab < 0) {
                return ketQua;
            }

            dongDangGian.set(this, { dong: dong, viTriTab: viTriTab });
            var soCach = demCachSeGian(dong, viTriTab);

            return soCach > 0
                ? { subWidth: ketQua.subWidth * ketQua.spaceCount / soCach, spaceCount: soCach }
                : { subWidth: 0, spaceCount: 0 };
        };

        nguyenMau.alignLineElements = function (phanTu, tren, duoi, doSauChu, batDauGian, doRongMoiCach, canLe, soCachConLai) {
            var dangGian = canLe === 'Justify' && soCachConLai > 0 ? dongDangGian.get(this) : null;
            var viTri = dangGian ? dangGian.dong.children.indexOf(phanTu) : -1;
            if (viTri < 0 || viTri > dangGian.viTriTab) {
                return alignLineElementsGoc.apply(this, arguments);
            }

            // Phần từ tab cuối trở về trước giữ nguyên độ rộng; chữ sau tab bắt đầu giãn lại từ đầu (bỏ dấu cách ngay sau tab).
            var thamSo = Array.prototype.slice.call(arguments);
            thamSo[7] = 0;
            var ketQua = alignLineElementsGoc.apply(this, thamSo);
            ketQua.addSubWidth = false;
            ketQua.whiteSpaceCount = soCachConLai;

            return ketQua;
        };
    }

    function viTriTabCuoi(dong) {
        for (var i = dong.children.length - 1; i >= 0; i--) {
            if (dong.children[i] && dong.children[i].text === '\t') {
                return i;
            }
        }

        return -1;
    }

    /*
     * Số dấu cách sau tab mà alignLineElements sẽ giãn: bỏ dấu cách đầu (ngay sau tab) và dấu cách cuối dòng,
     * đếm như HelperMethods.removeSpace của Syncfusion để khớp đúng số khoảng nó cộng thêm.
     */
    function demCachSeGian(dong, viTriTab) {
        var phanTu = dong.children;
        var daGapChu = false;
        var soCach = 0;

        for (var i = viTriTab + 1; i < phanTu.length; i++) {
            var hienTai = phanTu[i];
            if (!(hienTai.width > 0)) {
                daGapChu = true;
                continue;
            }
            if (typeof hienTai.text !== 'string') {
                continue;
            }

            var chu = hienTai.text;
            if (!daGapChu) {
                chu = chu.replace(/^ +/, '');
                daGapChu = chu.length > 0;
            }
            if (daGapChu) {
                var cach = demCachKieuSyncfusion(chu);
                if (i === phanTu.length - 1) {
                    cach -= chu.length - chu.replace(/ +$/, '').length;
                }
                soCach += Math.max(0, cach);
            }
        }

        return soCach;
    }

    function demCachKieuSyncfusion(chu) {
        var conLai = chu;
        for (var i = 0; i < conLai.length; i++) {
            if (conLai.charAt(i) === ' ') {
                conLai = conLai.replace(' ', '');
            }
        }

        return chu.length - conLai.length;
    }
})();
