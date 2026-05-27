import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'phishing.db')

app = Flask(__name__)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    schema = open(os.path.join(BASE_DIR, 'schema.sql')).read()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(schema)
    conn.commit()
    conn.close()


# --- Static file serving ---

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def static_file(filename):
    return send_from_directory(BASE_DIR, filename)


# --- API ---

@app.route('/api/teams', methods=['POST'])
def register_team():
    data = request.get_json(silent=True) or {}
    name = str(data.get('name', '')).strip()
    if not name or len(name) > 50:
        return jsonify({'error': 'Team name must be 1–50 characters'}), 400

    db = get_db()
    try:
        db.execute('INSERT OR IGNORE INTO teams (name) VALUES (?)', (name,))
        db.commit()
        row = db.execute(
            'SELECT id, name, total_score, play_count FROM teams WHERE name = ?',
            (name,)
        ).fetchone()
        return jsonify(dict(row))
    finally:
        db.close()


@app.route('/api/scores', methods=['POST'])
def submit_score():
    data = request.get_json(silent=True) or {}
    team_id = data.get('team_id')
    score   = data.get('score')

    if not isinstance(team_id, int) or not isinstance(score, int) or not (0 <= score <= 2100):
        return jsonify({'error': 'Invalid team_id or score'}), 400

    db = get_db()
    try:
        if not db.execute('SELECT id FROM teams WHERE id = ?', (team_id,)).fetchone():
            return jsonify({'error': 'Team not found'}), 404

        db.execute('INSERT INTO plays (team_id, score) VALUES (?, ?)', (team_id, score))
        db.execute(
            'UPDATE teams SET total_score = total_score + ?, play_count = play_count + 1 WHERE id = ?',
            (score, team_id)
        )
        db.commit()

        row = db.execute(
            'SELECT total_score, play_count FROM teams WHERE id = ?', (team_id,)
        ).fetchone()
        rank = db.execute(
            'SELECT COUNT(*) + 1 AS r FROM teams WHERE total_score > ?',
            (row['total_score'],)
        ).fetchone()['r']

        return jsonify({
            'total_score': row['total_score'],
            'play_count':  row['play_count'],
            'rank':        rank
        })
    finally:
        db.close()


@app.route('/api/leaderboard')
def leaderboard():
    db = get_db()
    try:
        rows = db.execute('''
            SELECT name, total_score, play_count,
                   CASE WHEN play_count > 0
                        THEN ROUND(CAST(total_score AS REAL) / play_count)
                        ELSE 0 END AS avg_score
            FROM teams
            ORDER BY total_score DESC
            LIMIT 25
        ''').fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        db.close()


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        init_db()
        print('Database initialised.')
    print('Phish Catchers server → http://0.0.0.0:5001')
    print('Share your local network IP (e.g. http://192.168.x.x:5001) with all players.')
    app.run(host='0.0.0.0', port=5001, debug=False)
