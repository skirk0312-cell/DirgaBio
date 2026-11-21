(() => {
    'use strict';
    const base = 'https://apisbbltuupvuclrngrv.supabase.co';
    const publicKey = 'sb_publishable_wemQxWgjq7W7pLsw77M_PQ_24CS8fiC';
    const $ = id => document.getElementById(id);
    let session = null, rows = [], tab = 'home', busy = false;
    let profile = null, products = [], dirty = false;
    const SESSION_KEY = 'dirga-room-session-v3';
    let refreshPromise = null;
    function storeSession(value) {
        session = value;
        if (value) {
            if (value.expires_in)
                value.expires_at = Math.floor(Date.now() / 1000) + value.expires_in;
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
            }
            catch {
            }
        }
        else {
            try {
                sessionStorage.removeItem(SESSION_KEY);
            }
            catch {
            }
        }
    }
    async function refreshSession() {
        if (!session?.refresh_token)
            throw Object.assign(Error('Sesi habis. Masuk lagi.'), { code: 401 });
        if (!refreshPromise)
            refreshPromise = api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: session.refresh_token } }).then(storeSession).finally(() => refreshPromise = null);
        await refreshPromise;
    }
    async function ensureSession() {
        if (session?.expires_at && session.expires_at < Math.floor(Date.now() / 1000) + 60)
            await refreshSession();
    }
    function uid() {
        return globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
            return (c === 'x' ? r : (r & 3) | 8).toString(16);
        });
    }
    const names = { profile: 'Profil & About Me', products: 'Produk', home: 'Home', social: 'Social media', commission: 'Commission' };
    const status = (message = '', type = 'info') => {
        $('status').textContent = message;
        $('status').dataset.type = type;
    };
    const safeURL = value => {
        if (value === 'index.html' || value === 'bisnis.html')
            return true;
        if (/[\s\x00-\x1f\x7f]/.test(value))
            return false;
        try {
            const url = new URL(value);
            return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
        }
        catch {
            return false;
        }
    };
    async function api(path, { method = 'GET', body, auth = true, representation = false } = {}) {
        if (auth)
            await ensureSession();
        const headers = { apikey: publicKey, 'Content-Type': 'application/json' };
        if (auth && session?.access_token)
            headers.Authorization = `Bearer ${session.access_token}`;
        if (representation)
            headers.Prefer = 'return=representation';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        let response;
        try {
            response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', signal: controller.signal });
        }
        catch (e) {
            throw Error('Tidak bisa terhubung ke Supabase. Periksa internet, lalu coba lagi.');
        }
        finally {
            clearTimeout(timer);
        }
        const raw = await response.text();
        let data = null;
        try {
            data = raw ? JSON.parse(raw) : null;
        }
        catch {
        }
        if (!response.ok) {
            const err = new Error(data?.message || data?.msg || data?.error_description || `HTTP ${response.status}`);
            err.code = response.status;
            throw err;
        }
        return data;
    }
    function loggedOut(message = '') {
        storeSession(null);
        clearPreviewFiles();
        rows = [];
        $('editor').hidden = true;
        $('login').hidden = false;
        $('logout').hidden = true;
        closePreview();
        $('password').value = '';
        $('list').replaceChildren();
        status(message, message ? 'error' : 'info');
    }
    function lock(value) {
        busy = value;
        $('editor').querySelectorAll('button,input,textarea').forEach(el => el.disabled = value);
        $('logout').disabled = value;
    }
    async function authorize() {
        const membership = await api('/rest/v1/dirga_admins?select=user_id&limit=1');
        if (!Array.isArray(membership) || membership.length !== 1)
            throw Error('Akun ini belum diberi akses admin.');
    }
    async function load() {
        rows = await api('/rest/v1/dirga_links?select=id,placement,label,hover_label,url,position&order=position.asc,id.asc');
        if (!Array.isArray(rows))
            throw Error('Database tidak dapat dibaca.');
        [profile, products] = await Promise.all([api('/rest/v1/dirga_profile?id=eq.1&select=*').then(x => x[0]), api('/rest/v1/dirga_products?select=*&order=position.asc,id.asc')]);
        if (!profile || !Array.isArray(products))
            throw Error('Data profil belum tersedia.');
        render();
        $('accountAvatar').src = profile?.profile_path ? mediaURL(profile.profile_path) : '/assets/images/profile.jpeg';
    }
    function showEditor() {
        $('login').hidden = true;
        $('editor').hidden = false;
        $('logout').hidden = false;
        status('');
    }
    $('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('username').value.trim().toLowerCase();
        const password = $('password').value;
        if (!/^[a-z0-9_]{1,40}$/.test(username)) {
            status('Username tidak valid.', 'error');
            return;
        }
        $('loginSubmit').disabled = true;
        status('Memeriksa akun…');
        try {
            storeSession(await api('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: `${username}@dirgabio.invalid`, password } }));
            $('password').value = '';
            await authorize();
            await load();
            showEditor();
        }
        catch (error) {
            loggedOut(error.code === 400 || error.code === 401 ? 'Username atau password salah, atau akun belum dibuat.' : error.message);
        }
        finally {
            $('loginSubmit').disabled = false;
        }
    });
    $('reveal').addEventListener('click', () => {
        const field = $('password');
        const visible = field.type === 'password';
        field.type = visible ? 'text' : 'password';
        $('reveal').textContent = visible ? 'Tutup' : 'Lihat';
        $('reveal').setAttribute('aria-label', visible ? 'Sembunyikan password' : 'Tampilkan password');
    });
    $('logout').addEventListener('click', async () => {
        try {
            await api('/auth/v1/logout', { method: 'POST' });
        }
        catch {
        }
        finally {
            loggedOut();
        }
    });
    function render() {
        dirty = false;
        clearPreviewFiles();
        $('sectionTitle').textContent = names[tab];
        if (tab === 'profile' || tab === 'products') {
            renderContent();
            attachPreviewActions();
            syncPreview();
            return;
        }
        const visible = rows.filter(row => row.placement === tab);
        $('count').textContent = `${visible.length} tombol`;
        $('add').hidden = tab === 'social';
        $('add').textContent = '+ Tambah tombol';
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
            btn.setAttribute('aria-pressed', String(btn.dataset.tab === tab));
        });
        const list = $('list');
        list.replaceChildren();
        if (!visible.length) {
            const p = document.createElement('p');
            p.className = 'empty';
            p.textContent = 'Belum ada tombol.';
            list.append(p);
        }
        for (const row of visible)
            list.append(buildRow(row));
        attachPreviewActions();
        syncPreview();
    }
    const mediaURL = path => base + '/storage/v1/object/public/dirga-media/' + path;
    async function upload(file, folder) {
        if (!file)
            return null;
        if (file.size > 20 * 1024 * 1024)
            throw Error('File maksimal 20 MB sebelum kompresi.');
        let img;
        try {
            img = await createImageBitmap(file);
        }
        catch {
            img = await new Promise((resolve, reject) => {
                const i = new Image(), u = URL.createObjectURL(file);
                i.onload = () => {
                    URL.revokeObjectURL(u);
                    resolve(i);
                };
                i.onerror = () => {
                    URL.revokeObjectURL(u);
                    reject(Error('Gambar tidak bisa dibuka.'));
                };
                i.src = u;
            });
        }
        const scale = Math.min(1, (folder === 'profile' ? 640 : 1600) / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        img.close?.();
        const blob = await new Promise(resolve => c.toBlob(resolve, 'image/webp', .82));
        if (!blob || blob.type !== 'image/webp' || blob.size > 3145728)
            throw Error('Tidak dapat mengompresi gambar.');
        await ensureSession();
        const path = folder + '/' + uid() + '.webp';
        const r = await fetch(base + '/storage/v1/object/dirga-media/' + path, { method: 'POST', headers: { apikey: publicKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'image/webp', 'x-upsert': 'false' }, body: blob });
        if (!r.ok)
            throw Error('Upload gambar gagal: ' + r.status + ' ' + (await r.text()).slice(0, 180));
        return path;
    }
    async function cleanup() {
        const pending = await api('/rest/v1/dirga_media_cleanup?select=path');
        for (const { path } of pending) {
            const result = await api('/storage/v1/object/dirga-media', { method: 'DELETE', body: { prefixes: [path] } });
            if (!Array.isArray(result) || !result.some(x => x.name === path)) {
                const found = await api('/storage/v1/object/list/dirga-media', { method: 'POST', body: { prefix: path.substring(0, path.lastIndexOf('/')), search: path.split('/').pop(), limit: 100 } });
                if (found.some(x => x.name === path.split('/').pop()))
                    throw Error('File lama masih ada.');
            }
            await api('/rest/v1/dirga_media_cleanup?path=eq.' + encodeURIComponent(path), { method: 'DELETE' });
        }
    }
    async function rollbackUploads(paths) {
        for (const path of paths) {
            try {
                await api('/rest/v1/dirga_media_cleanup', { method: 'POST', body: { path } });
            }
            catch {
            }
        }
        try {
            await cleanup();
        }
        catch {
        }
    }
    function one(result) {
        if (!Array.isArray(result) || result.length !== 1)
            throw Error('Perubahan ditolak.');
    }
    function renderContent() {
        const list = $('list');
        list.replaceChildren();
        $('add').hidden = tab === 'profile';
        $('add').textContent = tab === 'products' ? '+ Tambah produk' : '+ Tambah tombol';
        $('count').textContent = tab === 'products' ? products.length + ' produk' : '';
        document.querySelectorAll('[data-tab]').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
            b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
        });
        if (tab === 'profile') {
            const a = $('profileTemplate').content.firstElementChild.cloneNode(true), f = a.querySelector('form');
            a.dataset.profile = '1';
            const keys = ['display_name', 'handle', 'quote', 'about_title', 'about_text'];
            f.elements.minigame_enabled.checked = profile.minigame_enabled !== false;
            for (const k of keys)
                f.elements[k].value = profile[k];
            a.querySelector('.bannerPreview').src = profile.banner_path ? mediaURL(profile.banner_path) : '/assets/images/banner.jpeg';
            a.querySelector('.avatarPreview').src = profile.profile_path ? mediaURL(profile.profile_path) : '/assets/images/profile.jpeg';
            f.onsubmit = async (e) => {
                e.preventDefault();
                if (busy)
                    return;
                const files = [f.elements.profileFile.files[0], f.elements.bannerFile.files[0]], values = Object.fromEntries(keys.map(k => [k, f.elements[k].value.trim()]));
                values.minigame_enabled = f.elements.minigame_enabled.checked;
                await save(async () => {
                    const paths = [];
                    try {
                        for (let i = 0; i < 2; i++)
                            if (files[i]) {
                                const p = await upload(files[i], i ? 'banner' : 'profile');
                                paths.push(p);
                                values[i ? 'banner_path' : 'profile_path'] = p;
                            }
                        one(await api('/rest/v1/dirga_profile?id=eq.1', { method: 'PATCH', body: values, representation: true }));
                    }
                    catch (err) {
                        await rollbackUploads(paths);
                        throw err;
                    }
                }, 'Profil disimpan.');
            };
            list.append(a);
            return;
        }
        for (const p of products) {
            const a = $('productTemplate').content.firstElementChild.cloneNode(true), f = a.querySelector('form'), keys = ['title', 'price', 'order_url', 'position'];
            a.dataset.product = p.id;
            a.querySelector('.rowtitle').textContent = p.title || 'Produk baru';
            for (const k of keys)
                f.elements[k].value = p[k];
            if (p.image_path) {
                const im = a.querySelector('img');
                im.src = mediaURL(p.image_path);
                im.hidden = false;
            }
            f.onsubmit = async (e) => {
                e.preventDefault();
                if (busy)
                    return;
                const values = Object.fromEntries(keys.map(k => [k, f.elements[k].value.trim()]));
                values.position = Number(values.position);
                if (!safeURL(values.order_url) || !/^https?:/i.test(values.order_url)) {
                    status('Link order tidak valid.', 'error');
                    return;
                }
                const file = f.elements.imageFile.files[0];
                await save(async () => {
                    const paths = [];
                    try {
                        if (file) {
                            values.image_path = await upload(file, 'products');
                            paths.push(values.image_path);
                        }
                        one(await api('/rest/v1/dirga_products' + (p.draft ? '' : '?id=eq.' + p.id), { method: p.draft ? 'POST' : 'PATCH', body: p.draft ? { ...values, id: p.id } : values, representation: true }));
                    }
                    catch (err) {
                        await rollbackUploads(paths);
                        throw err;
                    }
                }, 'Produk disimpan.');
            };
            a.querySelector('.remove').onclick = async () => {
                if (busy)
                    return;
                if (p.draft) {
                    products = products.filter(x => x.id !== p.id);
                    render();
                    return;
                }
                if (confirm('Hapus produk dan fotonya secara permanen?'))
                    await save(async () => one(await api('/rest/v1/dirga_products?id=eq.' + p.id, { method: 'DELETE', representation: true })), 'Produk dihapus.');
            };
            list.append(a);
        }
        if (!products.length)
            list.textContent = 'Belum ada produk. Tambahkan produk baru.';
    }
    function buildRow(row) {
        const article = $('rowTemplate').content.firstElementChild.cloneNode(true);
        const custom = row.id.startsWith('custom-');
        const draft = Boolean(row.draft);
        const form = article.querySelector('form');
        article.querySelector('.kind').textContent = draft ? 'TOMBOl BARU' : custom ? 'TAMBAHAN' : 'BAWAAN';
        article.querySelector('.rowtitle').textContent = row.label || 'Tombol baru';
        article.dataset.link = row.id;
        const remove = article.querySelector('.remove');
        if (custom) {
            form.elements.url.type = 'url';
            form.elements.url.placeholder = 'https://djaja.com';
        }
        else {
            article.querySelector('.urlhelp').textContent = 'Link bawaan atau URL https://';
        }
        remove.hidden = !custom;
        remove.textContent = draft ? 'Batal' : 'Hapus';
        for (const key of ['label', 'hover_label', 'url', 'position'])
            form.elements[key].value = row[key] ?? '';
        if (tab === 'social') {
            article.querySelector('.hoverfield').hidden = true;
            article.querySelector('.orderfield').hidden = true;
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (busy)
                return;
            const values = { label: form.elements.label.value.trim(), hover_label: form.elements.hover_label.value.trim(), url: form.elements.url.value.trim(), position: Number(form.elements.position.value), updated_at: new Date().toISOString() };
            if (!values.label || !safeURL(values.url) || (custom && !/^https?:\/\//i.test(values.url))) {
                status('Isi nama tombol dan link lengkap, misalnya https://djaja.com.', 'error');
                return;
            }
            await save(async () => {
                const result = draft ? await api('/rest/v1/dirga_links', { method: 'POST', body: { ...values, id: row.id, placement: row.placement }, representation: true }) : await api(`/rest/v1/dirga_links?id=eq.${encodeURIComponent(row.id)}`, { method: 'PATCH', body: values, representation: true });
                if (!Array.isArray(result) || result.length !== 1)
                    throw Error('Perubahan ditolak. Cek akses admin.');
            }, 'Tombol berhasil disimpan.');
        });
        remove.addEventListener('click', async () => {
            if (busy)
                return;
            if (draft) {
                rows = rows.filter(r => r.id !== row.id);
                render();
                return;
            }
            if (!confirm(`Hapus tombol “${row.label}”?`))
                return;
            await save(async () => {
                const result = await api(`/rest/v1/dirga_links?id=eq.${encodeURIComponent(row.id)}`, { method: 'DELETE', representation: true });
                if (!Array.isArray(result) || result.length !== 1)
                    throw Error('Penghapusan ditolak.');
            }, 'Tombol berhasil dihapus.');
        });
        return article;
    }
    async function save(action, message) {
        lock(true);
        status('Menyimpan…');
        try {
            await action();
            let warning = '';
            try {
                await cleanup();
            }
            catch (e) {
                warning = ' Gambar lama belum terhapus; akan dicoba lagi saat menyimpan.';
            }
            await load();
            status(message + ' Perubahan sudah dipublikasikan.' + warning, 'success');
        }
        catch (err) {
            if (err.code === 401) {
                loggedOut('Sesi habis. Silakan masuk lagi.');
            }
            else
                status(err.message, 'error');
        }
        finally {
            lock(false);
        }
    }
    document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
        if (busy)
            return;
        if (btn.dataset.tab === tab)
            return;
        if ((dirty || rows.some(r => r.draft) || products.some(r => r.draft)) && !confirm('Perubahan belum disimpan. Pindah menu dan batalkan perubahan?'))
            return;
        rows = rows.filter(r => !r.draft);
        products = products.filter(r => !r.draft);
        tab = btn.dataset.tab;
        render();
        if (previewOpen)
            navigatePreview(tab === 'products' || tab === 'commission' ? 'bisnis.html' : 'index.html');
    }));
    $('add').addEventListener('click', () => {
        if (tab === 'social' || tab === 'profile' || busy)
            return;
        if (dirty && !confirm('Ada perubahan belum disimpan. Batalkan dan tambahkan item baru?'))
            return;
        if (tab === 'products') {
            if (products.some(p => p.draft))
                return;
            products.push({ id: uid(), title: '', price: '', order_url: '', position: Math.min(10000, Math.max(0, ...products.map(x => x.position)) + 10), image_path: null, draft: true });
            render();
            $('list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
            $('list').lastElementChild.querySelector('input').focus();
            return;
        }
        if (rows.some(r => r.draft)) {
            status('Simpan atau batalkan tombol baru terlebih dahulu.', 'error');
            return;
        }
        const pos = Math.min(10000, Math.max(0, ...rows.filter(r => r.placement === tab).map(r => r.position)) + 10);
        rows.push({ id: 'custom-' + uid(), placement: tab, label: '', hover_label: '', url: '', position: pos, draft: true });
        render();
        $('list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('list').lastElementChild.querySelector('input').focus();
    });
    function attachPreviewActions() {
        for (const form of $('list').querySelectorAll('form')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'secondary previewform';
            button.textContent = 'Lihat preview perubahan';
            button.onclick = () => {
                if (!previewOpen)
                    $('previewToggle').click();
                else
                    syncPreview();
                $('previewToggle').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
            form.append(button);
        }
    }
    const previewFrame = $('webPreview');
    let previewOpen = false, previewPage = 'index.html', previewReady = false;
    const previewFiles = new Map();
    function clearPreviewFiles() {
        for (const u of previewFiles.values())
            URL.revokeObjectURL(u);
        previewFiles.clear();
    }
    function closePreview() {
        previewOpen = false;
        previewReady = false;
        $('previewBody').hidden = true;
        $('previewToggle').textContent = 'Tampilkan';
        $('previewToggle').setAttribute('aria-expanded', 'false');
        previewFrame.removeAttribute('src');
    }
    function filePreview(input) {
        const file = input?.files?.[0];
        if (!file)
            return null;
        if (!previewFiles.has(file))
            previewFiles.set(file, URL.createObjectURL(file));
        return previewFiles.get(file);
    }
    function snapshot() {
        const data = { type: 'dirga:preview', profile: { ...profile }, rows: rows.map(x => ({ ...x })), products: products.map(x => ({ ...x })) };
        const pf = $('list').querySelector('[data-profile] form');
        if (pf) {
            for (const k of ['display_name', 'handle', 'quote', 'about_title', 'about_text'])
                data.profile[k] = pf.elements[k].value;
            data.profile.minigame_enabled = pf.elements.minigame_enabled.checked;
            data.profile.profile_preview = filePreview(pf.elements.profileFile);
            data.profile.banner_preview = filePreview(pf.elements.bannerFile);
        }
        for (const card of $('list').querySelectorAll('[data-link]')) {
            const row = data.rows.find(x => x.id === card.dataset.link), f = card.querySelector('form');
            if (row) {
                for (const k of ['label', 'hover_label', 'url'])
                    row[k] = f.elements[k].value;
                row.position = Number(f.elements.position.value);
            }
        }
        for (const card of $('list').querySelectorAll('[data-product]')) {
            const p = data.products.find(x => x.id === card.dataset.product), f = card.querySelector('form');
            if (p) {
                for (const k of ['title', 'price', 'order_url'])
                    p[k] = f.elements[k].value;
                p.position = Number(f.elements.position.value);
                p.image_preview = filePreview(f.elements.imageFile);
            }
        }
        return data;
    }
    function syncPreview() {
        if (previewOpen && previewReady && profile)
            previewFrame.contentWindow?.postMessage(snapshot(), location.origin);
    }
    function navigatePreview(page) {
        previewPage = page;
        previewReady = false;
        previewFrame.src = '/' + page + '?preview=1';
        document.querySelectorAll('[data-preview]').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.preview === page));
        });
    }
    $('previewToggle').onclick = () => {
        if (previewOpen) {
            closePreview();
            return;
        }
        previewOpen = true;
        $('previewBody').hidden = false;
        $('previewToggle').textContent = 'Sembunyikan';
        $('previewToggle').setAttribute('aria-expanded', 'true');
        navigatePreview(tab === 'products' || tab === 'commission' ? 'bisnis.html' : 'index.html');
    };
    document.querySelectorAll('[data-preview]').forEach(b => b.onclick = () => navigatePreview(b.dataset.preview));
    window.addEventListener('message', e => {
        if (e.origin === location.origin && e.source === previewFrame.contentWindow && e.data?.type === 'dirga:ready') {
            previewReady = true;
            syncPreview();
        }
    });
    $('list').addEventListener('input', () => {
        dirty = true;
        syncPreview();
    });
    $('list').addEventListener('change', e => {
        dirty = true;
        if (e.target.type === 'file' && e.target.files[0]) {
            const card = e.target.closest('article');
            const selector = { profileFile: '.avatarPreview', bannerFile: '.bannerPreview', imageFile: '.productPreview' }[e.target.name];
            const im = selector && card?.querySelector(selector);
            if (im) {
                im.src = filePreview(e.target);
                im.hidden = false;
            }
        }
        syncPreview();
    });
    $('list').addEventListener('invalid', e => {
        status('Periksa kolom ' + (e.target.closest('label')?.childNodes[0]?.textContent?.trim() || 'yang belum lengkap') + ': ' + e.target.validationMessage, 'error');
    }, true);
    window.addEventListener('unhandledrejection', e => {
        status(e.reason?.message || 'Terjadi masalah. Coba muat ulang data.', 'error');
    });
    window.addEventListener('error', e => {
        if (e.message)
            status('Terjadi masalah pada panel: ' + e.message, 'error');
    });
    $('refreshData').onclick = async () => {
        if (busy || ((dirty || rows.some(r => r.draft) || products.some(r => r.draft)) && !confirm('Muat ulang? Perubahan yang belum disimpan akan hilang.')))
            return;
        lock(true);
        try {
            await load();
            status('Data terbaru dimuat.');
        }
        catch (e) {
            status(e.message, 'error');
        }
        finally {
            lock(false);
        }
    };
    (async () => {
        let previousSession;

        try {
            previousSession = sessionStorage.getItem(SESSION_KEY);
        } catch {
            return;
        }

        if (!previousSession) {
            return;
        }

        try {
            session = JSON.parse(previousSession);
            await ensureSession();
            await authorize();
            await load();
            showEditor();
        } catch {
            loggedOut('Sesi sebelumnya berakhir. Silakan masuk lagi.');
        }
    })();
})();
