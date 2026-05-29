"""Initialize the OSINT puzzles database with schema and a few sample puzzles."""
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'osint.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

SAMPLE_PUZZLES = [
    {
        'title': 'Cyrillic Storefront',
        'category': 'Geolocation',
        'language': 'Russian',
        'difficulty': 'Easy',
        'description': (
            "A photo shows a storefront sign reading «Аптека 24». "
            "Identify the country where this image was most likely taken. "
            "Flag format: flag{country_name_lowercase}"
        ),
        'flag': 'flag{russia}',
        'points': 100,
        'case_sensitive': 0,
        'hints': [
            ('The script is Cyrillic — narrow it to the Slavic-language belt.', 25),
            ('"Аптека" means "pharmacy". The "24" suffix is a common branding convention in one specific country.', 50),
        ],
    },
    {
        'title': 'Tokyo or Taipei?',
        'category': 'Language ID',
        'language': 'Chinese/Japanese',
        'difficulty': 'Medium',
        'description': (
            "You receive a leaked memo. It contains the characters: 公司, 軟體, 資訊. "
            "Identify the language/region of the writer. "
            "Flag format: flag{language-region} e.g. flag{japanese-tokyo}"
        ),
        'flag': 'flag{traditional-chinese-taiwan}',
        'points': 200,
        'case_sensitive': 0,
        'hints': [
            ('These characters are Traditional, not Simplified — that rules out mainland China.', 50),
            ('"軟體" (software) and "資訊" (information) are Taiwan-specific terms; Hong Kong uses different vocabulary.', 100),
        ],
    },
    {
        'title': 'The Persian Handle',
        'category': 'Social Media',
        'language': 'Persian (Farsi)',
        'difficulty': 'Medium',
        'description': (
            "A threat actor uses the handle «ابوذر۱۳۶۲». "
            "The digits at the end are a Persian-calendar year. Convert it to the Gregorian year of their likely birth. "
            "Flag format: flag{YYYY}"
        ),
        'flag': 'flag{1983}',
        'points': 250,
        'case_sensitive': 0,
        'hints': [
            ('۱۳۶۲ in Eastern Arabic numerals is 1362.', 50),
            ('Solar Hijri year + 621 ≈ Gregorian year (for dates after the Persian new year, ~March 21).', 75),
        ],
    },
    {
        'title': 'Arabic Domain Drift',
        'category': 'DNS / IDN',
        'language': 'Arabic',
        'difficulty': 'Hard',
        'description': (
            "A phishing domain appears as «بنك-الراجحي.com» in a victim's inbox. "
            "What is the Punycode (xn--) representation of the Arabic label (without .com)? "
            "Flag format: flag{xn--...}"
        ),
        'flag': 'flag{xn----ymcbab1bk0bb6h3a}',
        'points': 350,
        'case_sensitive': 0,
        'hints': [
            ('IDN labels are encoded with Punycode per RFC 3492. Python: label.encode("idna").', 75),
            ('The hyphen in the middle of the Arabic label is preserved; the result begins with "xn--".', 100),
        ],
    },
    {
        'title': 'Korean Keyboard Tell',
        'category': 'Attribution',
        'language': 'Korean',
        'difficulty': 'Easy',
        'description': (
            "Malware metadata contains the artifact string \"한글\" inside a resource section. "
            "Which Korean Hangul Input Method does the substring strongly suggest the developer used? "
            "Flag format: flag{ime_name_lowercase}  (one word)"
        ),
        'flag': 'flag{hangul}',
        'points': 150,
        'case_sensitive': 0,
        'hints': [
            ('"한글" is itself the Korean word for the Hangul script.', 25),
        ],
    },
]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(open(SCHEMA_PATH).read())
    cur = conn.cursor()

    for p in SAMPLE_PUZZLES:
        cur.execute(
            'INSERT INTO puzzles (title, category, language, difficulty, description, flag, points, case_sensitive) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (p['title'], p['category'], p['language'], p['difficulty'],
             p['description'], p['flag'], p['points'], p['case_sensitive']),
        )
        pid = cur.lastrowid
        for i, (text, cost) in enumerate(p['hints'], start=1):
            cur.execute(
                'INSERT INTO hints (puzzle_id, ordering, text, cost) VALUES (?, ?, ?, ?)',
                (pid, i, text, cost),
            )

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH} with {len(SAMPLE_PUZZLES)} sample puzzles.")


if __name__ == '__main__':
    init_db()
