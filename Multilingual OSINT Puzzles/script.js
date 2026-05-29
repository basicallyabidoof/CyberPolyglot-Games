// ---------- State ----------
const API = ''; // same-origin
let user = null;          // { id, handle, score, solved_puzzle_ids: [], unlocked_hint_ids: [] }
let puzzles = [];         // list of puzzles from /api/puzzles
let currentPuzzleId = null;
let revealedHints = {};   // hint_id -> text (cached after reveal)

// ---------- Element shortcuts ----------
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

// ---------- API helpers ----------
async function api(path, opts = {}) {
    const res = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    return res.json();
}

// ---------- Login flow ----------
$('btn-login').addEventListener('click', login);
$('handle-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
$('btn-leaderboard-login').addEventListener('click', () => openLeaderboard());

async function login() {
    const handle = $('handle-input').value.trim();
    if (!handle) return;
    const data = await api('/api/register', { method: 'POST', body: JSON.stringify({ handle }) });
    if (data.error) { alert(data.error); return; }
    user = data;
    hide($('login-screen'));
    show($('board-screen'));
    $('agent-handle').textContent = user.handle;
    updateStatus();
    await loadPuzzles();
}

$('btn-logout').addEventListener('click', () => {
    user = null;
    show($('login-screen'));
    hide($('board-screen'));
});

function updateStatus() {
    $('agent-score').textContent = user.score;
    $('agent-solves').textContent = user.solved_puzzle_ids.length;
}

// ---------- Board ----------
async function loadPuzzles() {
    puzzles = await api('/api/puzzles');
    populateCategoryFilter();
    renderBoard();
}

function populateCategoryFilter() {
    const sel = $('filter-category');
    const cats = [...new Set(puzzles.map(p => p.category).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">All categories</option>' +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

['search-puzzles', 'filter-category', 'filter-difficulty', 'filter-unsolved'].forEach(id => {
    $(id).addEventListener('input', renderBoard);
});

function renderBoard() {
    const q = $('search-puzzles').value.toLowerCase();
    const cat = $('filter-category').value;
    const diff = $('filter-difficulty').value;
    const hideSolved = $('filter-unsolved').checked;

    const filtered = puzzles.filter(p => {
        if (hideSolved && user.solved_puzzle_ids.includes(p.id)) return false;
        if (cat && p.category !== cat) return false;
        if (diff && p.difficulty !== diff) return false;
        if (q && !(`${p.title} ${p.category} ${p.language || ''} ${p.difficulty}`.toLowerCase().includes(q))) return false;
        return true;
    });

    const grid = $('puzzle-grid');
    if (!filtered.length) {
        grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px;">No puzzles match your filters.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const solved = user.solved_puzzle_ids.includes(p.id);
        const diffClass = `chip-diff-${(p.difficulty || 'easy').toLowerCase()}`;
        return `
        <div class="puzzle-card ${solved ? 'solved' : ''}" data-id="${p.id}">
            <h3>${escapeHtml(p.title)}</h3>
            <div class="meta">
                <span class="chip">${escapeHtml(p.category || 'OSINT')}</span>
                ${p.language ? `<span class="chip chip-lang">${escapeHtml(p.language)}</span>` : ''}
                <span class="chip ${diffClass}">${escapeHtml(p.difficulty || 'Easy')}</span>
                <span class="chip chip-points">${p.points} pts</span>
            </div>
            <div class="footer">
                <span>${p.hints.length} clue${p.hints.length === 1 ? '' : 's'}</span>
                <span>${p.solve_count} solve${p.solve_count === 1 ? '' : 's'}</span>
            </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.puzzle-card').forEach(card => {
        card.addEventListener('click', () => openPuzzle(parseInt(card.dataset.id)));
    });
}

// ---------- Puzzle modal ----------
$('close-puzzle').addEventListener('click', () => hide($('puzzle-modal')));

function openPuzzle(id) {
    const p = puzzles.find(x => x.id === id);
    if (!p) return;
    currentPuzzleId = id;

    $('pm-title').textContent = p.title;
    $('pm-category').textContent = p.category || 'OSINT';
    $('pm-language').textContent = p.language || '';
    $('pm-language').style.display = p.language ? '' : 'none';
    const diff = p.difficulty || 'Easy';
    const diffChip = $('pm-difficulty');
    diffChip.textContent = diff;
    diffChip.className = `chip chip-diff-${diff.toLowerCase()}`;
    $('pm-points').textContent = `${p.points} pts`;
    $('pm-description').textContent = p.description;

    if (p.image_path) {
        $('pm-image').src = p.image_path;
        show($('pm-image-wrap'));
    } else {
        hide($('pm-image-wrap'));
    }

    if (p.file_path) {
        const link = $('pm-file-link');
        link.href = p.file_path;
        $('pm-file-name').textContent = p.file_name || 'attachment';
        link.download = p.file_name || '';
        show($('pm-file-wrap'));
    } else {
        hide($('pm-file-wrap'));
    }

    renderHints(p);

    $('flag-input').value = '';
    hide($('submit-feedback'));
    const solved = user.solved_puzzle_ids.includes(id);
    $('flag-input').disabled = solved;
    $('btn-submit-flag').disabled = solved;
    if (solved) {
        const f = $('submit-feedback');
        f.textContent = '✓ Already solved.';
        f.className = 'submit-feedback correct';
        show(f);
    }

    show($('puzzle-modal'));
}

function renderHints(p) {
    const container = $('pm-hints');
    if (!p.hints.length) {
        container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No clues available for this puzzle.</p>';
        return;
    }
    const solved = user.solved_puzzle_ids.includes(p.id);
    container.innerHTML = p.hints.map(h => {
        const unlocked = user.unlocked_hint_ids.includes(h.id);
        const text = revealedHints[h.id];
        return `
        <div class="hint-row ${unlocked ? 'unlocked' : ''}" data-hint-id="${h.id}">
            <div class="hint-text ${unlocked ? '' : 'locked'}">
                ${unlocked
                    ? `<strong>Clue #${h.ordering}:</strong> ${escapeHtml(text || '(unlocked)')}`
                    : `Clue #${h.ordering} — locked`}
            </div>
            <button data-cost="${h.cost}" ${unlocked || solved ? 'disabled' : ''}>
                ${unlocked ? `−${h.cost} pts (used)` : `Reveal (−${h.cost} pts)`}
            </button>
        </div>`;
    }).join('');

    container.querySelectorAll('button[data-cost]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const row = btn.closest('.hint-row');
            const hid = parseInt(row.dataset.hintId);
            if (!confirm(`Reveal this clue for −${btn.dataset.cost} pts off this puzzle's reward?`)) return;
            const res = await api('/api/hint', {
                method: 'POST',
                body: JSON.stringify({ user_id: user.id, hint_id: hid }),
            });
            if (res.error) { alert(res.error); return; }
            revealedHints[hid] = res.text;
            if (!user.unlocked_hint_ids.includes(hid)) user.unlocked_hint_ids.push(hid);
            renderHints(p);
        });
    });
}

// ---------- Submit flag ----------
$('btn-submit-flag').addEventListener('click', submitFlag);
$('flag-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitFlag(); });

async function submitFlag() {
    const guess = $('flag-input').value.trim();
    if (!guess || currentPuzzleId == null) return;
    const res = await api('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, puzzle_id: currentPuzzleId, guess }),
    });
    const feedback = $('submit-feedback');
    show(feedback);

    if (res.correct) {
        feedback.className = 'submit-feedback correct';
        feedback.textContent = res.already_solved
            ? '✓ Already solved.'
            : `✓ Correct! +${res.points_awarded} pts. New score: ${res.new_score}.`;
        if (!res.already_solved) {
            user.score = res.new_score;
            if (!user.solved_puzzle_ids.includes(currentPuzzleId)) user.solved_puzzle_ids.push(currentPuzzleId);
            updateStatus();
            await loadPuzzles();
        }
        $('flag-input').disabled = true;
        $('btn-submit-flag').disabled = true;
    } else {
        feedback.className = 'submit-feedback wrong';
        feedback.textContent = '✗ Incorrect flag. Try again.';
    }
}

// ---------- Leaderboard ----------
$('btn-leaderboard').addEventListener('click', () => openLeaderboard());
$('close-leaderboard').addEventListener('click', () => hide($('leaderboard-modal')));

async function openLeaderboard() {
    const data = await api('/api/leaderboard');
    const tbody = $('leaderboard-body');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">No agents on the board yet.</td></tr>';
    } else {
        tbody.innerHTML = data.map((r, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.handle)}</td>
                <td>${r.solves}</td>
                <td><strong>${r.total_score}</strong></td>
            </tr>`).join('');
    }
    hide($('reset-form'));
    hide($('reset-message'));
    $('reset-password').value = '';
    show($('leaderboard-modal'));
}

// ---------- Leaderboard reset ----------
$('btn-reset-toggle').addEventListener('click', () => {
    $('reset-form').classList.toggle('hidden');
});
$('btn-reset-confirm').addEventListener('click', async () => {
    const password = $('reset-password').value;
    const msg = $('reset-message');
    show(msg);
    const res = await api('/api/reset', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
    if (res.success) {
        msg.className = 'reset-message ok';
        msg.textContent = 'Leaderboard cleared.';
        $('reset-password').value = '';
        setTimeout(() => openLeaderboard(), 700);
    } else {
        msg.className = 'reset-message err';
        msg.textContent = res.error || 'Reset failed.';
    }
});

// ---------- utils ----------
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
