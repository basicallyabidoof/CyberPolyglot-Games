from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'osint.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'gamemaster')
RESET_PASSWORD = os.environ.get('RESET_PASSWORD', 'gamemaster')

IMAGE_EXTS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'}
ALLOWED_EXTS = IMAGE_EXTS | {
    'pdf', 'txt', 'csv', 'json', 'xml', 'html', 'log',
    'zip', 'tar', 'gz', '7z',
    'mp3', 'wav', 'ogg', 'm4a',
    'mp4', 'mov', 'webm',
    'doc', 'docx', 'rtf', 'eml', 'msg',
}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_BYTES
CORS(app)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def ext_of(filename: str) -> str:
    return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''


def require_admin(payload_or_args) -> bool:
    pw = (payload_or_args or {}).get('admin_password')
    return pw == ADMIN_PASSWORD


def puzzle_row_to_dict(row, include_flag=False):
    d = {
        'id': row['id'],
        'title': row['title'],
        'category': row['category'],
        'language': row['language'],
        'difficulty': row['difficulty'],
        'description': row['description'],
        'points': row['points'],
        'image_path': row['image_path'],
        'file_path': row['file_path'],
        'file_name': row['file_name'],
        'case_sensitive': bool(row['case_sensitive']),
    }
    if include_flag:
        d['flag'] = row['flag']
    return d


# ---------------- Player APIs ----------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    handle = (data.get('handle') or '').strip()
    if not handle:
        return jsonify({'error': 'Handle is required'}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT id, handle, total_score FROM users WHERE handle = ?', (handle,))
    user = cur.fetchone()
    if not user:
        cur.execute('INSERT INTO users (handle) VALUES (?)', (handle,))
        conn.commit()
        user_id, score = cur.lastrowid, 0
    else:
        user_id, score = user['id'], user['total_score']

    cur.execute('SELECT puzzle_id FROM solves WHERE user_id = ?', (user_id,))
    solved = [r['puzzle_id'] for r in cur.fetchall()]
    cur.execute('SELECT hint_id FROM hint_unlocks WHERE user_id = ?', (user_id,))
    unlocked = [r['hint_id'] for r in cur.fetchall()]
    conn.close()
    return jsonify({
        'id': user_id, 'handle': handle, 'score': score,
        'solved_puzzle_ids': solved, 'unlocked_hint_ids': unlocked,
    })


@app.route('/api/puzzles', methods=['GET'])
def list_puzzles():
    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM puzzles ORDER BY points ASC, id ASC')
    puzzles = []
    for row in cur.fetchall():
        p = puzzle_row_to_dict(row)
        cur.execute('SELECT id, ordering, cost FROM hints WHERE puzzle_id = ? ORDER BY ordering ASC', (row['id'],))
        p['hints'] = [{'id': h['id'], 'ordering': h['ordering'], 'cost': h['cost']} for h in cur.fetchall()]
        cur.execute('SELECT COUNT(*) as c FROM solves WHERE puzzle_id = ?', (row['id'],))
        p['solve_count'] = cur.fetchone()['c']
        puzzles.append(p)
    conn.close()
    return jsonify(puzzles)


@app.route('/api/hint', methods=['POST'])
def reveal_hint():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    hint_id = data.get('hint_id')
    if not isinstance(user_id, int) or not isinstance(hint_id, int):
        return jsonify({'error': 'user_id and hint_id required'}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT id, puzzle_id, text, cost FROM hints WHERE id = ?', (hint_id,))
    hint = cur.fetchone()
    if not hint:
        conn.close()
        return jsonify({'error': 'Hint not found'}), 404

    # Block hint reveals on already-solved puzzles (no penalty farming)
    cur.execute('SELECT 1 FROM solves WHERE user_id = ? AND puzzle_id = ?', (user_id, hint['puzzle_id']))
    if cur.fetchone():
        conn.close()
        return jsonify({'error': 'Puzzle already solved'}), 400

    cur.execute('SELECT 1 FROM hint_unlocks WHERE user_id = ? AND hint_id = ?', (user_id, hint_id))
    already = cur.fetchone()
    if not already:
        cur.execute('INSERT INTO hint_unlocks (user_id, hint_id) VALUES (?, ?)', (user_id, hint_id))
        conn.commit()

    conn.close()
    return jsonify({
        'hint_id': hint['id'],
        'puzzle_id': hint['puzzle_id'],
        'text': hint['text'],
        'cost': hint['cost'],
        'already_unlocked': bool(already),
    })


@app.route('/api/submit', methods=['POST'])
def submit_flag():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    puzzle_id = data.get('puzzle_id')
    guess = (data.get('guess') or '').strip()

    if not isinstance(user_id, int) or not isinstance(puzzle_id, int) or not guess:
        return jsonify({'error': 'user_id, puzzle_id, and guess required'}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT id, flag, points, case_sensitive FROM puzzles WHERE id = ?', (puzzle_id,))
    p = cur.fetchone()
    if not p:
        conn.close()
        return jsonify({'error': 'Puzzle not found'}), 404

    cur.execute('SELECT 1 FROM solves WHERE user_id = ? AND puzzle_id = ?', (user_id, puzzle_id))
    if cur.fetchone():
        conn.close()
        return jsonify({'correct': True, 'already_solved': True})

    if p['case_sensitive']:
        correct = guess == p['flag']
    else:
        correct = guess.lower() == p['flag'].lower()

    cur.execute('INSERT INTO attempts (user_id, puzzle_id, guess, correct) VALUES (?, ?, ?, ?)',
                (user_id, puzzle_id, guess, 1 if correct else 0))

    awarded = 0
    if correct:
        # Sum costs of hints unlocked for this puzzle by this user
        cur.execute(
            'SELECT COALESCE(SUM(h.cost), 0) AS total '
            'FROM hint_unlocks u JOIN hints h ON h.id = u.hint_id '
            'WHERE u.user_id = ? AND h.puzzle_id = ?',
            (user_id, puzzle_id),
        )
        hint_cost = cur.fetchone()['total']
        awarded = max(0, p['points'] - hint_cost)

        cur.execute('INSERT INTO solves (user_id, puzzle_id, points_awarded) VALUES (?, ?, ?)',
                    (user_id, puzzle_id, awarded))
        cur.execute('UPDATE users SET total_score = total_score + ? WHERE id = ?', (awarded, user_id))

    conn.commit()
    cur.execute('SELECT total_score FROM users WHERE id = ?', (user_id,))
    new_score = cur.fetchone()['total_score']
    conn.close()

    return jsonify({
        'correct': correct,
        'points_awarded': awarded,
        'new_score': new_score,
        'already_solved': False,
    })


@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    conn = db()
    cur = conn.cursor()
    cur.execute(
        'SELECT u.handle, u.total_score, COUNT(s.id) AS solves '
        'FROM users u LEFT JOIN solves s ON s.user_id = u.id '
        'GROUP BY u.id ORDER BY u.total_score DESC, solves DESC LIMIT 20'
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route('/api/reset', methods=['POST'])
def reset_leaderboard():
    data = request.get_json(silent=True) or {}
    if data.get('password') != RESET_PASSWORD:
        return jsonify({'error': 'Incorrect password'}), 403
    conn = db()
    cur = conn.cursor()
    cur.execute('DELETE FROM attempts')
    cur.execute('DELETE FROM solves')
    cur.execute('DELETE FROM hint_unlocks')
    cur.execute('DELETE FROM users')
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ---------------- Uploads ----------------

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# ---------------- Admin APIs ----------------

@app.route('/api/admin/auth', methods=['POST'])
def admin_auth():
    data = request.get_json() or {}
    return jsonify({'ok': require_admin(data)})


@app.route('/api/admin/puzzles', methods=['GET'])
def admin_list_puzzles():
    if not require_admin(request.args):
        return jsonify({'error': 'Unauthorized'}), 403
    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM puzzles ORDER BY id ASC')
    puzzles = []
    for row in cur.fetchall():
        p = puzzle_row_to_dict(row, include_flag=True)
        cur.execute('SELECT id, ordering, text, cost FROM hints WHERE puzzle_id = ? ORDER BY ordering ASC', (row['id'],))
        p['hints'] = [dict(h) for h in cur.fetchall()]
        puzzles.append(p)
    conn.close()
    return jsonify(puzzles)


@app.route('/api/admin/puzzles', methods=['POST'])
def admin_create_puzzle():
    data = request.get_json() or {}
    if not require_admin(data):
        return jsonify({'error': 'Unauthorized'}), 403

    required = ['title', 'description', 'flag']
    for k in required:
        if not data.get(k):
            return jsonify({'error': f'{k} is required'}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO puzzles (title, category, language, difficulty, description, flag, points, image_path, file_path, file_name, case_sensitive) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (
            data['title'],
            data.get('category') or 'OSINT',
            data.get('language'),
            data.get('difficulty') or 'Easy',
            data['description'],
            data['flag'],
            int(data.get('points') or 100),
            data.get('image_path'),
            data.get('file_path'),
            data.get('file_name'),
            1 if data.get('case_sensitive') else 0,
        ),
    )
    pid = cur.lastrowid
    for i, h in enumerate(data.get('hints') or [], start=1):
        if not h.get('text'):
            continue
        cur.execute('INSERT INTO hints (puzzle_id, ordering, text, cost) VALUES (?, ?, ?, ?)',
                    (pid, i, h['text'], int(h.get('cost') or 25)))
    conn.commit()
    conn.close()
    return jsonify({'id': pid})


@app.route('/api/admin/puzzles/<int:pid>', methods=['PUT'])
def admin_update_puzzle(pid):
    data = request.get_json() or {}
    if not require_admin(data):
        return jsonify({'error': 'Unauthorized'}), 403

    conn = db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM puzzles WHERE id = ?', (pid,))
    if not cur.fetchone():
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    cur.execute(
        'UPDATE puzzles SET title=?, category=?, language=?, difficulty=?, description=?, flag=?, points=?, '
        'image_path=?, file_path=?, file_name=?, case_sensitive=? WHERE id=?',
        (
            data.get('title'),
            data.get('category') or 'OSINT',
            data.get('language'),
            data.get('difficulty') or 'Easy',
            data.get('description'),
            data.get('flag'),
            int(data.get('points') or 100),
            data.get('image_path'),
            data.get('file_path'),
            data.get('file_name'),
            1 if data.get('case_sensitive') else 0,
            pid,
        ),
    )

    # Replace hints
    cur.execute('DELETE FROM hints WHERE puzzle_id = ?', (pid,))
    for i, h in enumerate(data.get('hints') or [], start=1):
        if not h.get('text'):
            continue
        cur.execute('INSERT INTO hints (puzzle_id, ordering, text, cost) VALUES (?, ?, ?, ?)',
                    (pid, i, h['text'], int(h.get('cost') or 25)))

    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/puzzles/<int:pid>', methods=['DELETE'])
def admin_delete_puzzle(pid):
    if not require_admin(request.args):
        return jsonify({'error': 'Unauthorized'}), 403
    conn = db()
    cur = conn.cursor()
    cur.execute('DELETE FROM puzzles WHERE id = ?', (pid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/upload', methods=['POST'])
def admin_upload():
    if request.form.get('admin_password') != ADMIN_PASSWORD:
        return jsonify({'error': 'Unauthorized'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Empty filename'}), 400

    ext = ext_of(f.filename)
    if ext not in ALLOWED_EXTS:
        return jsonify({'error': f'Extension .{ext} not allowed'}), 400

    safe_base = secure_filename(f.filename.rsplit('.', 1)[0]) or 'file'
    stored_name = f"{uuid.uuid4().hex}_{safe_base}.{ext}"
    f.save(os.path.join(UPLOAD_DIR, stored_name))

    is_image = ext in IMAGE_EXTS
    return jsonify({
        'stored_name': stored_name,
        'original_name': f.filename,
        'url': f'/uploads/{stored_name}',
        'is_image': is_image,
    })


# ---------------- Static ----------------

@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/admin')
def serve_admin():
    return send_from_directory(BASE_DIR, 'admin.html')


@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('uploads/'):
        abort(404)
    return send_from_directory(BASE_DIR, filename)


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print('Database not found; run `python init_db.py` first.')
    app.run(debug=True, port=5002)
