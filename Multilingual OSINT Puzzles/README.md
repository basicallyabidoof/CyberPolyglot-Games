# Multilingual OSINT Puzzles

A capture-the-flag (CTF) style game built for the **CyberPolyglots** community. Players race through OSINT puzzles that hinge on multilingual clues — Cyrillic storefronts, Persian calendar handles, Punycode'd Arabic domains, and more. Each puzzle has a flag; solving it scores points. Stuck? Reveal a clue — but each clue you peek at lowers the puzzle's reward.

Game-masters get a separate admin panel to author puzzles, attach images or files, and configure tiered hints.

---

## Features

- **Open CTF board** — all puzzles visible at once, filter by category / difficulty, search by text, hide-solved toggle.
- **Tiered clues with point penalties** — each puzzle can have any number of clues; each clue has its own point cost; revealing clues you used reduces the points awarded on solve (floor 0).
- **Multilingual-friendly** — UTF-8 throughout; non-Latin scripts (Cyrillic, Arabic, Hangul, CJK) render in puzzle text and flags out of the box.
- **Image + file evidence** — admins upload images (rendered inline) and/or downloadable attachments (PDF, audio, archives, etc.).
- **Case-sensitive or insensitive flags** — per-puzzle toggle. Default is case-insensitive.
- **Leaderboard** — top 20 agents by score, with solve counts. Password-protected reset.
- **Admin panel** at `/admin` — full CRUD for puzzles and clues, file uploads, password-gated.

---

## Setup

From the repo root (`CyberPolyglot-Games/`):

```bash
# 1. Create a venv (you can also reuse the one at repo root)
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies (the repo-root requirements.txt covers it)
pip install -r requirements.txt

# 3. Initialize the database with 5 sample puzzles
cd "Multilingual OSINT Puzzles"
python init_db.py

# 4. Run the server
python app.py
```

Then open:
- **Player UI** → http://localhost:5002
- **Admin panel** → http://localhost:5002/admin

> The default admin password is **`gamemaster`**. Change it via `ADMIN_PASSWORD` env var (see below).

### Re-initializing the database

`init_db.py` **drops and recreates all tables**, so re-running it wipes all users, scores, solves, hint unlocks, and puzzles. Useful before an event. If you want to keep your custom puzzles, take a backup of `osint.db` first.

---

## Environment variables

| Variable          | Default        | Purpose                                                   |
|-------------------|----------------|-----------------------------------------------------------|
| `ADMIN_PASSWORD`  | `gamemaster`   | Required to access `/admin` and all `/api/admin/*` routes |
| `RESET_PASSWORD`  | `gamemaster`   | Required to clear the leaderboard from the player UI      |

Example:
```bash
ADMIN_PASSWORD='strongPass!' RESET_PASSWORD='resetPass!' python app.py
```

---

## How to play

1. Open http://localhost:5002 and enter an **agent handle** (your display name on the leaderboard). Returning players: re-enter the same handle to resume.
2. The **OSINT Arena** opens — a grid of all puzzles. Each card shows category, language, difficulty, point value, number of clues, and number of solves.
3. **Click a puzzle** to open its detail view. You'll see the question, any attached image or file, the clue list, and the flag input.
4. **Reveal clues** if you need help. Each reveal is permanent and deducts its point cost from your eventual reward. You can still solve for **0 points** if you reveal every clue worth more than the puzzle.
5. **Submit a flag** in the input box. Correct flags award `(puzzle points) − (total cost of clues you revealed)`. Already-solved puzzles disable further input.
6. Use the **Leaderboard** button to see top agents at any time.

---

## How to author puzzles (Admin)

1. Go to http://localhost:5002/admin and enter the admin password.
2. Click **+ New puzzle** (or click an existing row to edit it).
3. Fill in:
   - **Title** — short name shown on the card.
   - **Category** — free-form, e.g. `Geolocation`, `Language ID`, `Social Media`, `DNS / IDN`, `Attribution`. Categories appear in the player's filter dropdown automatically.
   - **Language** — the language/script central to the puzzle (e.g. `Russian`, `Persian (Farsi)`, `Traditional Chinese`).
   - **Difficulty** — `Easy` / `Medium` / `Hard` / `Insane`. Drives the color chip.
   - **Description / Question** — the puzzle itself. Include the **flag format** here (e.g. `Flag format: flag{country_name_lowercase}`).
   - **Flag** — the correct answer. Convention: wrap in `flag{...}`.
   - **Points** — the reward for a clue-free solve.
   - **Case-sensitive** — leave unchecked for typical CTF behavior (the player's `FLAG{X}` matches the stored `flag{x}`).
4. **Upload an image** (rendered inline above the input) and/or an **attachment file** (downloadable link). Both are optional. Max upload size is **25 MB**. Allowed extensions:
   - Images: `png, jpg, jpeg, gif, webp, bmp, svg`
   - Other: `pdf, txt, csv, json, xml, html, log, zip, tar, gz, 7z, mp3, wav, ogg, m4a, mp4, mov, webm, doc, docx, rtf, eml, msg`
5. **Add clues** — click `+ Add clue`, type the clue, set a cost in points. Order matters (top to bottom = clue #1, #2, …). Players see them numbered. There's no fixed limit on the number of clues.
6. Click **Save puzzle**. To remove one, open it and click **Delete** (cascades to solves, hint unlocks, and attempts for that puzzle).

### Authoring tips

- **Always state the flag format in the description.** Players guess wildly without it.
- **Make the first clue cheap and broad**, later clues expensive and specific.
- **Test your own puzzle** by logging in as a player with a throwaway handle. Solving it under your admin handle is fine — it just means you'll appear on the leaderboard.
- **Total clue cost can exceed puzzle points**; that's intentional. Players who reveal everything still get the satisfaction of solving, but for 0 points.

---

## File layout

```
Multilingual OSINT Puzzles/
├── app.py            # Flask server (port 5002)
├── init_db.py        # DB bootstrap + 5 sample puzzles
├── schema.sql        # SQLite schema
├── index.html        # Player UI
├── script.js
├── style.css
├── admin.html        # Admin UI (served at /admin)
├── admin.js
├── osint.db          # SQLite database (created by init_db.py)
└── uploads/          # User-uploaded images and files (created at first upload)
```

---

## API reference (for curious folks)

All routes are JSON-in / JSON-out unless noted. Admin routes require `admin_password` in the JSON body (or `?admin_password=` query string for GET/DELETE).

### Player

| Method | Path                 | Body                                | Notes                                    |
|--------|----------------------|-------------------------------------|------------------------------------------|
| POST   | `/api/register`      | `{handle}`                          | Creates or resumes a user                |
| GET    | `/api/puzzles`       | —                                   | All puzzles + hint metadata (no flags)   |
| POST   | `/api/hint`          | `{user_id, hint_id}`                | Reveals a clue, records the penalty      |
| POST   | `/api/submit`        | `{user_id, puzzle_id, guess}`       | Returns correctness + points awarded     |
| GET    | `/api/leaderboard`   | —                                   | Top 20 agents                            |
| POST   | `/api/reset`         | `{password}`                        | Wipes users, solves, hint unlocks        |

### Admin

| Method | Path                          | Body / Query                        |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/admin/auth`             | `{admin_password}` — boolean check  |
| GET    | `/api/admin/puzzles`          | `?admin_password=…`                 |
| POST   | `/api/admin/puzzles`          | full puzzle JSON + `admin_password` |
| PUT    | `/api/admin/puzzles/<id>`     | full puzzle JSON + `admin_password` |
| DELETE | `/api/admin/puzzles/<id>`     | `?admin_password=…`                 |
| POST   | `/api/admin/upload`           | `multipart/form-data: file + admin_password` |

### Static

| Path                | Serves                  |
|---------------------|-------------------------|
| `/`                 | `index.html`            |
| `/admin`            | `admin.html`            |
| `/uploads/<file>`   | uploaded image/file     |
| `/<other>`          | sibling static files    |

---

## Database schema (SQLite)

- `users(id, handle UNIQUE, total_score, created_at)`
- `puzzles(id, title, category, language, difficulty, description, flag, points, image_path, file_path, file_name, case_sensitive, created_at)`
- `hints(id, puzzle_id → puzzles, ordering, text, cost)` — ON DELETE CASCADE
- `hint_unlocks(id, user_id, hint_id, unlocked_at)` UNIQUE(user_id, hint_id)
- `solves(id, user_id, puzzle_id, points_awarded, solved_at)` UNIQUE(user_id, puzzle_id)
- `attempts(id, user_id, puzzle_id, guess, correct, attempted_at)` — full audit trail of guesses

Foreign keys are enabled per-connection (`PRAGMA foreign_keys = ON`).

---

## Notes & known limits

- **Authentication is handle-only.** Anyone who knows your handle can resume your session. Fine for a community game night; not fine for anything competitive without trust.
- **The admin password is sent on every admin request.** Use HTTPS in any non-localhost deployment.
- **The dev server (Flask debug)** is for local play only. Behind nginx + gunicorn (or similar) for events with many players.
- **Uploads are not virus-scanned.** Trust your admins.
- **SQLite is single-writer.** Fine up to dozens of concurrent players; switch to Postgres for hundreds.
