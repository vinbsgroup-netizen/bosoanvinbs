import { getHeaderFooter, setHeaderFooter } from './headerFooter';

/**
 * Bảng cấu hình đầu trang và chân trang. Thay đổi có hiệu lực ngay trên các tờ.
 */
export const bindHeaderFooterPanel = (root, onChange) => {
    const panel = root.querySelector('[data-hf-panel]');
    const read = () => {
        const field = (name) => panel.querySelector(`[data-hf="${name}"]`);
        const value = {
            dau: { text: field('dauText').value, canh: field('dauCanh').value },
            chan: { text: field('chanText').value, canh: field('chanCanh').value },
            trangDauKhac: field('trangDauKhac').checked,
            dauTrangDau: { text: field('dauTrangDauText').value, canh: 'giua' },
            chanTrangDau: { text: field('chanTrangDauText').value, canh: 'giua' },
            soTrang: { viTri: field('soTrangViTri').value, dinhDang: field('soTrangDinhDang').value },
        };
        setHeaderFooter(value);
        panel.querySelector('[data-hf-first]').hidden = !value.trangDauKhac;
        onChange();
    };

    const fill = () => {
        const s = getHeaderFooter();
        const set = (name, value) => { panel.querySelector(`[data-hf="${name}"]`).value = value; };
        set('dauText', s.dau.text); set('dauCanh', s.dau.canh);
        set('chanText', s.chan.text); set('chanCanh', s.chan.canh);
        panel.querySelector('[data-hf="trangDauKhac"]').checked = s.trangDauKhac;
        set('dauTrangDauText', s.dauTrangDau.text);
        set('chanTrangDauText', s.chanTrangDau.text);
        set('soTrangViTri', s.soTrang.viTri);
        set('soTrangDinhDang', s.soTrang.dinhDang);
        panel.querySelector('[data-hf-first]').hidden = !s.trangDauKhac;
    };

    panel.querySelectorAll('input, select').forEach((element) => {
        element.addEventListener('input', read);
        if (element.tagName === 'SELECT' || element.type === 'checkbox') {
            element.addEventListener('change', read);
        }
    });
    panel.querySelector('[data-action="closeHf"]').addEventListener('click', () => { panel.hidden = true; });

    root.addEventListener('bs-hf-open', () => { fill(); panel.hidden = false; });

    return {
        open: () => { fill(); panel.hidden = false; },
    };
};
