// ---------- State ----------
let adminPassword = null;
let puzzles = [];
let editing = null; // null = new, else puzzle object being edited

const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

// ---------- Gate ----------
$('btn-admin-login').addEventListener('click', tryAuth);
$('admin-pw-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryAuth(); });

async function tryAuth() {
    const pw = $('admin-pw-input').value;
    const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: pw }),
    }).then(r => r.json());
    if (res.ok) {
        adminPassword = pw;
        hide($('admin-gate'));
        show($('admin-app'));
        loadPuzzles();
    } else {
        show($('admin-pw-err'));
    }
}

// ---------- Load puzzles ----------
async function loadPuzzles() {
    const res = await fetch(`/api/admin/puzzles?admin_password=${encodeURIComponent(adminPassword)}`);
    if (!res.ok) { toast('Failed to load puzzles', 'err'); return; }
    puzzles = await res.json();
    renderList();
}

function renderList() {
    const list = $('puzzle-list');
    if (!puzzles.length) {
        list.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;padding:8px;">No puzzles yet. Create one →</p>';
        return;
    }
    list.innerHTML = puzzles.map(p => `
        <div class="puzzle-row ${editing && editing.id === p.id ? 'active' : ''}" data-id="${p.id}">
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="sub">${escapeHtml(p.category || '')} · ${p.points} pts · ${p.hints.length} clue${p.hints.length === 1 ? '' : 's'}</div>
        </div>
    `).join('');
    list.querySelectorAll('.puzzle-row').forEach(row => {
        row.addEventListener('click', () => startEdit(parseInt(row.dataset.id)));
    });
}

// ---------- Editor ----------
$('btn-new-puzzle').addEventListener('click', startNew);

function startNew() {
    editing = null;
    $('editor-title').textContent = 'New puzzle';
    show($('editor-form'));
    hide($('btn-delete'));
    fillForm({
        title: '', category: 'OSINT', language: '', difficulty: 'Easy',
        description: '', flag: '', points: 100, case_sensitive: false,
        image_path: '', file_path: '', file_name: '',
        hints: [],
    });
    renderList();
}

function startEdit(id) {
    const p = puzzles.find(x => x.id === id);
    if (!p) return;
    editing = p;
    $('editor-title').textContent = `Edit: ${p.title}`;
    show($('editor-form'));
    show($('btn-delete'));
    fillForm(p);
    renderList();
}

function fillForm(p) {
    $('e-title').value = p.title || '';
    $('e-category').value = p.category || 'OSINT';
    $('e-language').value = p.language || '';
    $('e-difficulty').value = p.difficulty || 'Easy';
    $('e-description').value = p.description || '';
    $('e-flag').value = p.flag || '';
    $('e-points').value = p.points || 100;
    $('e-case').checked = !!p.case_sensitive;

    $('e-image-path').value = p.image_path || '';
    const preview = $('image-preview');
    if (p.image_path) { preview.src = p.image_path; show(preview); }
    else { preview.removeAttribute('src'); hide(preview); }
    $('image-status').textContent = p.image_path ? 'Image attached' : '';
    $('e-image-input').value = '';

    $('e-file-path').value = p.file_path || '';
    $('e-file-name').value = p.file_name || '';
    $('file-status').textContent = p.file_name ? `Attached: ${p.file_name}` : '';
    $('e-file-input').value = '';

    renderHintsEditor(p.hints || []);
}

function renderHintsEditor(hints) {
    const list = $('hints-list');
    list.innerHTML = hints.map((h, i) => hintRowHtml(h, i)).join('');
    attachHintHandlers();
}

function hintRowHtml(h, i) {
    return `
    <div class="hint-edit-row" data-i="${i}">
        <input type="text" class="hint-text" placeholder="Clue text" value="${escapeHtml(h.text || '')}" />
        <input type="number" class="hint-cost" placeholder="cost" value="${h.cost ?? 25}" min="0" />
        <button type="button" class="hint-remove">Remove</button>
    </div>`;
}

function attachHintHandlers() {
    $('hints-list').querySelectorAll('.hint-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.hint-edit-row').remove();
        });
    });
}

$('btn-add-hint').addEventListener('click', () => {
    const list = $('hints-list');
    const wrap = document.createElement('div');
    wrap.innerHTML = hintRowHtml({ text: '', cost: 25 }, list.children.length);
    list.appendChild(wrap.firstElementChild);
    attachHintHandlers();
});

function collectHints() {
    return [...$('hints-list').querySelectorAll('.hint-edit-row')].map(row => ({
        text: row.querySelector('.hint-text').value.trim(),
        cost: parseInt(row.querySelector('.hint-cost').value) || 0,
    })).filter(h => h.text);
}

// ---------- Uploads ----------
$('btn-upload-image').addEventListener('click', () => uploadFile('e-image-input', true));
$('btn-upload-file').addEventListener('click', () => uploadFile('e-file-input', false));

async function uploadFile(inputId, isImage) {
    const input = $(inputId);
    const file = input.files[0];
    if (!file) { toast('Pick a file first', 'err'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('admin_password', adminPassword);
    const statusEl = isImage ? $('image-status') : $('file-status');
    statusEl.textContent = 'Uploading…';
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd }).then(r => r.json());
    if (res.error) { statusEl.textContent = res.error; toast(res.error, 'err'); return; }

    if (isImage) {
        $('e-image-path').value = res.url;
        const preview = $('image-preview');
        preview.src = res.url;
        show(preview);
        statusEl.textContent = `Uploaded: ${res.original_name}`;
    } else {
        $('e-file-path').value = res.url;
        $('e-file-name').value = res.original_name;
        statusEl.textContent = `Attached: ${res.original_name}`;
    }
}

// ---------- Save / delete ----------
$('btn-save').addEventListener('click', async () => {
    const payload = {
        admin_password: adminPassword,
        title: $('e-title').value.trim(),
        category: $('e-category').value.trim() || 'OSINT',
        language: $('e-language').value.trim() || null,
        difficulty: $('e-difficulty').value,
        description: $('e-description').value.trim(),
        flag: $('e-flag').value.trim(),
        points: parseInt($('e-points').value) || 100,
        case_sensitive: $('e-case').checked,
        image_path: $('e-image-path').value || null,
        file_path: $('e-file-path').value || null,
        file_name: $('e-file-name').value || null,
        hints: collectHints(),
    };

    if (!payload.title || !payload.description || !payload.flag) {
        toast('Title, description, and flag are required', 'err');
        return;
    }

    const url = editing ? `/api/admin/puzzles/${editing.id}` : '/api/admin/puzzles';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(r => r.json());

    if (res.error) { toast(res.error, 'err'); return; }
    toast(editing ? 'Saved.' : 'Created.', 'ok');
    await loadPuzzles();
    const newId = editing ? editing.id : res.id;
    startEdit(newId);
});

$('btn-delete').addEventListener('click', async () => {
    if (!editing) return;
    if (!confirm(`Delete "${editing.title}"? This removes all solves and hint unlocks for it.`)) return;
    const res = await fetch(
        `/api/admin/puzzles/${editing.id}?admin_password=${encodeURIComponent(adminPassword)}`,
        { method: 'DELETE' },
    ).then(r => r.json());
    if (res.error) { toast(res.error, 'err'); return; }
    toast('Deleted.', 'ok');
    editing = null;
    $('editor-title').textContent = 'Select or create a puzzle';
    hide($('editor-form'));
    await loadPuzzles();
});

// ---------- Toast ----------
function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = msg;
    $('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 2600);
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
