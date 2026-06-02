"""Initialize the OSINT puzzles database with schema and a curated puzzle set.

Re-running this DROPS and recreates all tables (wipes users, scores, solves,
hint unlocks, and puzzles). It also (re)generates any file-based challenge
artifacts under uploads/ so the database is self-contained on a fresh checkout.
"""
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'osint.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')


def generate_zero_width_stego_file():
    """Create a cover text with a flag hidden in zero-width characters.

    Encoding scheme (documented for fair hinting):
      - U+200B ZERO WIDTH SPACE        -> bit 0
      - U+200C ZERO WIDTH NON-JOINER   -> bit 1
      - 8 bits per character, MSB first; the decoded ASCII is the flag.
    Returns the public URL path to reference as a puzzle attachment.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ZERO, ONE = '​', '‌'
    secret = 'flag{zero_width_smuggler}'
    bits = ''.join(format(ord(c), '08b') for c in secret)
    payload = ''.join(ONE if b == '1' else ZERO for b in bits)

    cover_pre = (
        "Profile export — capture date 2026-05-31\n\n"
        "Name: Lena K.\n"
        "Bio: Travel photographer. Coffee, trains, and old maps. "
        "Verified"
    )
    cover_post = (
        " account. DM for prints.\n"
        "Location: “somewhere between two time zones”\n"
        "Note: nothing to see here — just a normal bio. Or is it?\n"
    )
    doc = cover_pre + payload + cover_post

    fname = 'profile_export.txt'
    with open(os.path.join(UPLOAD_DIR, fname), 'w', encoding='utf-8') as f:
        f.write(doc)
    return f'/uploads/{fname}', fname


# Each puzzle: title, category, language, difficulty, description, flag, points,
# case_sensitive, optional image_path / file_path / file_name, and hints [(text, cost)].
def build_puzzles():
    stego_path, stego_name = generate_zero_width_stego_file()

    return [
        # ---------------- Original seed set ----------------
        {
            'title': 'Cyrillic Storefront',
            'category': 'Geolocation', 'language': 'Russian', 'difficulty': 'Easy',
            'description': (
                "A photo shows a storefront sign reading «Аптека 24». "
                "Identify the country where this image was most likely taken. "
                "Flag format: flag{country_name_lowercase}"
            ),
            'flag': 'flag{russia}', 'points': 100,
            'hints': [
                ('The script is Cyrillic — narrow it to the Slavic-language belt.', 25),
                ('"Аптека" means "pharmacy". The "24" suffix is a common branding convention in one specific country.', 50),
            ],
        },
        {
            'title': 'Tokyo or Taipei?',
            'category': 'Language ID', 'language': 'Chinese/Japanese', 'difficulty': 'Medium',
            'description': (
                "You receive a leaked memo. It contains the characters: 公司, 軟體, 資訊. "
                "Identify the language/region of the writer. "
                "Flag format: flag{language-region} e.g. flag{japanese-tokyo}"
            ),
            'flag': 'flag{traditional-chinese-taiwan}', 'points': 200,
            'hints': [
                ('These characters are Traditional, not Simplified — that rules out mainland China.', 50),
                ('"軟體" (software) and "資訊" (information) are Taiwan-specific terms; Hong Kong uses different vocabulary.', 100),
            ],
        },
        {
            'title': 'The Persian Handle',
            'category': 'Social Media', 'language': 'Persian (Farsi)', 'difficulty': 'Medium',
            'description': (
                "A threat actor uses the handle «ابوذر۱۳۶۲». "
                "The digits at the end are a Persian-calendar year. Convert it to the Gregorian year of their likely birth. "
                "Flag format: flag{YYYY}"
            ),
            'flag': 'flag{1983}', 'points': 250,
            'hints': [
                ('۱۳۶۲ in Eastern Arabic numerals is 1362.', 50),
                ('Solar Hijri year + 621 ≈ Gregorian year (for dates after the Persian new year, ~March 21).', 75),
            ],
        },
        {
            'title': 'Arabic Domain Drift',
            'category': 'DNS / IDN', 'language': 'Arabic', 'difficulty': 'Hard',
            'description': (
                "A phishing domain appears as «بنك-الراجحي.com» in a victim's inbox. "
                "What is the Punycode (xn--) representation of the Arabic label (without .com)? "
                "Flag format: flag{xn--...}"
            ),
            'flag': 'flag{xn----ymcbab1bk0bb6h3a}', 'points': 350,
            'hints': [
                ('IDN labels are encoded with Punycode per RFC 3492. Python: label.encode("idna").', 75),
                ('The hyphen in the middle of the Arabic label is preserved; the result begins with "xn--".', 100),
            ],
        },
        {
            'title': 'Korean Keyboard Tell',
            'category': 'Attribution', 'language': 'Korean', 'difficulty': 'Easy',
            'description': (
                "Malware metadata contains the artifact string \"한글\" inside a resource section. "
                "Which Korean Hangul Input Method does the substring strongly suggest the developer used? "
                "Flag format: flag{ime_name_lowercase}  (one word)"
            ),
            'flag': 'flag{hangul}', 'points': 150,
            'hints': [
                ('"한글" is itself the Korean word for the Hangul script.', 25),
            ],
        },

        # ---------------- Easy: numerals, scripts, ccTLDs ----------------
        {
            'title': 'Numerals in the Wild',
            'category': 'Numerals', 'language': 'Arabic', 'difficulty': 'Easy',
            'description': (
                "A surveillance still shows a bus route placard reading «٤٢٧». "
                "These are Eastern Arabic-Indic numerals. What is the route number in Western (ASCII) digits? "
                "Flag format: flag{NUMBER}"
            ),
            'flag': 'flag{427}', 'points': 100,
            'hints': [
                ('Each glyph maps to one Western digit; the order reads the same left-to-right.', 20),
                ('٤ = 4, ٢ = 2, ٧ = 7.', 40),
            ],
        },
        {
            'title': 'Good Morning, Stranger',
            'category': 'Language ID', 'language': 'Estonian', 'difficulty': 'Easy',
            'description': (
                "An intercepted voicemail transcript opens with the greeting: «Tere hommikust!» "
                "Name the language. "
                "Flag format: flag{language_lowercase}"
            ),
            'flag': 'flag{estonian}', 'points': 100,
            'hints': [
                ('It is a Finnic (Uralic) language of the Baltic region — not Latvian or Lithuanian, which are Baltic.', 25),
                ('"Tere" = hello and "hommikust" = morning. The double vowels/consonants are a strong Estonian tell.', 40),
            ],
        },
        {
            'title': 'Top-Level Tell',
            'category': 'DNS / ccTLD', 'language': 'n/a', 'difficulty': 'Easy',
            'description': (
                "An evidence URL ends in the country-code TLD «.is». "
                "Which country does this ccTLD belong to? "
                "Flag format: flag{country_lowercase}"
            ),
            'flag': 'flag{iceland}', 'points': 100,
            'hints': [
                ('It is a Nordic island nation — the TLD is not an abbreviation of the English name.', 25),
                ('"Ísland" is the endonym; the ccTLD takes its first two letters.', 40),
            ],
        },
        {
            'title': 'Devanagari Digits',
            'category': 'Numerals', 'language': 'Hindi', 'difficulty': 'Easy',
            'description': (
                "A scanned form lists a PIN-area code written in Devanagari numerals: «९२३». "
                "Convert it to Western (ASCII) digits. "
                "Flag format: flag{NUMBER}"
            ),
            'flag': 'flag{923}', 'points': 125,
            'hints': [
                ('Devanagari is used for Hindi, Marathi, Nepali and others.', 25),
                ('९ = 9, २ = 2, ३ = 3.', 50),
            ],
        },

        # ---------------- Medium: calendars, transliteration, telephony ----------------
        {
            'title': 'Receipt from Bangkok',
            'category': 'Calendars', 'language': 'Thai', 'difficulty': 'Medium',
            'description': (
                "A market receipt is dated «พ.ศ. ๒๕๖๕». The prefix พ.ศ. marks the Buddhist Era and "
                "the digits are Thai numerals. Give the equivalent Gregorian (CE) year. "
                "Flag format: flag{YYYY}"
            ),
            'flag': 'flag{2022}', 'points': 175,
            'hints': [
                ('First convert the Thai numerals: ๒=2, ๕=5, ๖=6, ๕=5.', 35),
                ('Thai Buddhist Era year minus 543 = Gregorian year.', 70),
            ],
        },
        {
            'title': 'The Era Stamp',
            'category': 'Calendars', 'language': 'Japanese', 'difficulty': 'Medium',
            'description': (
                "A Japanese certificate is stamped «令和6年». Convert this Japanese era (nengō) year "
                "to the Gregorian year. "
                "Flag format: flag{YYYY}"
            ),
            'flag': 'flag{2024}', 'points': 175,
            'hints': [
                ('令和 (Reiwa) is the current era; year 1 (元年) began in 2019.', 35),
                ('Reiwa year + 2018 = Gregorian year.', 70),
            ],
        },
        {
            'title': 'Two Ways to Spell Mao',
            'category': 'Transliteration', 'language': 'Chinese', 'difficulty': 'Medium',
            'description': (
                "An archived document spells the name «Mao Tse-tung», while a modern source writes "
                "«Mao Zedong». Name the older romanization system used by the first spelling. "
                "Flag format: flag{system-name-lowercase} (hyphenated)"
            ),
            'flag': 'flag{wade-giles}', 'points': 200,
            'hints': [
                ('Hyphenated syllables and apostrophes (e.g. ch’i vs chi) signal the pre-Pinyin standard.', 50),
                ('It is named after two 19th-century British diplomats/scholars.', 90),
            ],
        },
        {
            'title': 'Dial Tone',
            'category': 'Telephony', 'language': 'Persian (Farsi)', 'difficulty': 'Medium',
            'description': (
                "A leaked contact list shows a landline beginning «+98 21 …». "
                "Using the country calling code and the area code, name the CITY this number is in. "
                "Flag format: flag{city_lowercase}"
            ),
            'flag': 'flag{tehran}', 'points': 200,
            'hints': [
                ('+98 is the country calling code for Iran.', 50),
                ('Area code 21 is the national capital.', 80),
            ],
        },

        # ---------------- Hard: era + culture, IDN, encoding ----------------
        {
            'title': 'Olympic Stamp',
            'category': 'Calendars & Culture', 'language': 'Japanese', 'difficulty': 'Hard',
            'description': (
                "The back of a vintage photo is stamped «昭和39年». The handwritten caption notes it was "
                "taken \"the year the Games came to the capital.\" Give the Gregorian year — and use the "
                "cultural clue to sanity-check your math. "
                "Flag format: flag{YYYY}"
            ),
            'flag': 'flag{1964}', 'points': 275,
            'hints': [
                ('昭和 (Shōwa) year 1 began in 1926; the conversion is Shōwa year + 1925.', 60),
                ('Tokyo hosted the Summer Olympics that year — the cultural cross-check confirms the arithmetic.', 110),
            ],
        },
        {
            'title': 'Lookalike Login',
            'category': 'DNS / IDN', 'language': 'Cyrillic', 'difficulty': 'Hard',
            'description': (
                "A phishing email links to «аррӏе.com» — but every letter before \".com\" is actually a "
                "Cyrillic homoglyph, not Latin. Give the Punycode (xn--) form of that label (without \".com\") "
                "that DNS actually resolves. "
                "Flag format: flag{xn--...}"
            ),
            'flag': 'flag{xn--80ak6aa92e}', 'points': 325,
            'hints': [
                ('Browsers display the Unicode label but resolve the ASCII-Compatible Encoding. Try: label.encode("idna").', 75),
                ('The label impersonates a famous fruit-named tech brand; the result is xn--80ak6aa92e.', 130),
            ],
        },
        {
            'title': 'Garbled Cable',
            'category': 'Encoding', 'language': 'Russian', 'difficulty': 'Hard',
            'description': (
                "A recovered message body reads exactly: «Ð¿Ñ€Ð¸Ð²ÐµÑ‚». This is mojibake — UTF-8 text that "
                "was mistakenly decoded as Windows-1252. Recover the original word and give its English meaning. "
                "Flag format: flag{english_word_lowercase}"
            ),
            'flag': 'flag{hello}', 'points': 300,
            'hints': [
                ('Reverse it: take the garbled text, re-encode as Windows-1252, then decode as UTF-8.', 70),
                ('The recovered Cyrillic word is «привет» — a casual greeting.', 120),
            ],
        },

        # ---------------- Insane: chained IDN decode, steganography ----------------
        {
            'title': 'Unmask the Brand',
            'category': 'DNS / IDN', 'language': 'Cyrillic', 'difficulty': 'Insane',
            'description': (
                "Threat intel logs a malicious domain whose DNS name is «xn--80aa0cbo65f.com». "
                "Decode the Punycode, observe the Cyrillic homoglyphs, and name the well-known payment brand "
                "being impersonated. "
                "Flag format: flag{brand_lowercase}"
            ),
            'flag': 'flag{paypal}', 'points': 450,
            'hints': [
                ('Decode it: "xn--80aa0cbo65f".encode("ascii").decode("idna") — or use any Punycode decoder.', 90),
                ('The decoded string «раураӏ» is built from Cyrillic letters that mimic six Latin ones.', 160),
            ],
        },
        {
            'title': 'Invisible Ink',
            'category': 'Steganography', 'language': 'Multilingual', 'difficulty': 'Insane',
            'description': (
                "Download the attached profile export. It looks like an ordinary social-media bio, but a flag "
                "is smuggled inside it using zero-width characters. Extract the hidden message. "
                "Encoding: U+200B (zero-width space) = bit 0, U+200C (zero-width non-joiner) = bit 1, "
                "8 bits per character (MSB first), decoded as ASCII. "
                "Flag format: flag{...}"
            ),
            'flag': 'flag{zero_width_smuggler}', 'points': 500,
            'file_path': stego_path, 'file_name': stego_name,
            'hints': [
                ('Open the file in a hex editor or a script — the visible text is a decoy. Look for U+200B / U+200C runs.', 100),
                ('Map the zero-width run to bits, group into bytes (MSB first), and ASCII-decode. The payload sits right after the word "Verified".', 180),
            ],
        },
    ]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())
    cur = conn.cursor()

    puzzles = build_puzzles()
    for p in puzzles:
        cur.execute(
            'INSERT INTO puzzles (title, category, language, difficulty, description, flag, points, '
            'image_path, file_path, file_name, case_sensitive) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (
                p['title'], p['category'], p.get('language'), p['difficulty'],
                p['description'], p['flag'], p['points'],
                p.get('image_path'), p.get('file_path'), p.get('file_name'),
                1 if p.get('case_sensitive') else 0,
            ),
        )
        pid = cur.lastrowid
        for i, (text, cost) in enumerate(p.get('hints', []), start=1):
            cur.execute(
                'INSERT INTO hints (puzzle_id, ordering, text, cost) VALUES (?, ?, ?, ?)',
                (pid, i, text, cost),
            )

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH} with {len(puzzles)} puzzles.")


if __name__ == '__main__':
    init_db()
