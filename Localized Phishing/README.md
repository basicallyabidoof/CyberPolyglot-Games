# Phish Catchers: Localized Edition

## Purpose
**Phish Catchers: Localized Edition** is an interactive educational game that trains players in **Cultural Social Engineering** awareness — the craft of spotting hyper-localized phishing attacks that generic security training misses entirely.

While most anti-phishing programs focus on universal red flags, this game emphasizes the cultural, regional, and linguistic nuances that attackers deliberately exploit. Players analyse both **emails and SMS texts (smishing)** from around the world and learn to identify:

- **ESL phrasing patterns** — subtle syntax errors like "Dear Mr. [First Name]", uncapitalized days of the week, or awkward constructions like "kindly do the needful" that reveal a non-native writer
- **Regional authority spoofing** — fake domains impersonating local government entities such as HMRC (UK), CRA (Canada), ATO (Australia), myGov (Australia), CAF (France), and SBI (India)
- **Cultural tells** — inappropriate or unnatural use of local expressions, payment methods (Pix, INTERAC), or delivery services that a local resident would instantly recognise as wrong

---

## Game Features

| Feature | Description |
|---|---|
| **50 challenges** | 25 localized emails + 25 SMS/smishing texts across 20+ countries |
| **Spot the Red Flag** | After correctly identifying a phish, pick *why* it's suspicious from 4 options for a +50 bonus |
| **Streak counter** | 🔥 badge appears after 2+ consecutive correct answers |
| **Progress bar** | Visual progress across all 50 challenges |
| **Grade system** | Expert Analyst → Solid Defender → Needs Practice → Stay Vigilant |
| **Team leaderboard** | Conference mode: teams pool scores across devices in real time |

---

## How to Run

### Standalone mode (no server required)
If you just want to play the game locally without team features:

1. Clone or download this repository
2. Open `Localized Phishing/index.html` directly in your browser

> **Note:** Team registration will show a "Cannot reach server" error in standalone mode — dismiss it or run the full server below.

---

### Conference / team mode (Flask server)

This mode enables multiple players to register a team name, pool their scores, and compete on a live leaderboard — ideal for security awareness events.

**Requirements:** Python 3.8+ and Flask

```bash
pip install flask
```

**Start the server:**

```bash
cd "Localized Phishing"
python3 app.py
```

The server starts on port `5001` and prints your local network IP:

```
Phish Catchers server → http://0.0.0.0:5001
Share your local network IP (e.g. http://192.168.x.x:5001) with all players.
```

Share that URL with all players on the same WiFi network. The SQLite database (`phishing.db`) is created automatically on first launch — no setup step needed.

**Troubleshooting:**

If you see `Address already in use` on port 5001, another process (or a previous server run) is still holding the port. Free it with:

```bash
kill $(lsof -i :5001 -t)
```

Then start `app.py` again.

---

**API endpoints (for reference):**

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/teams` | Register or rejoin a team by name |
| `POST` | `/api/scores` | Submit a completed run score |
| `GET` | `/api/leaderboard` | Fetch top 25 teams by cumulative score |

---

## Scoring

| Action | Points |
|---|---|
| Correct classification (Legit/Phishing) | +100 |
| Correct red flag identification | +50 bonus |
| Maximum possible score | **6,900** |

Team scores are **cumulative** — every team member's run adds to the team total. A team of four playing through all 50 challenges together can score up to 27,600 points.

---

## Call for Open Source Contributors

Cyber criminals localize their attacks for every region — and this training should reflect that reality. We need contributors to add phishing scenarios in their **local languages** with **local references**.

### Adding an email scenario

Open `script.js` and add an object to the `messages` array:

```javascript
{
    type: 'email',
    sender: "spoofed@fake-domain.com",
    recipient: "victim@example.com",
    subject: "Your localized subject line",
    date: "day, DD Mon",  // intentional errors are fair game
    body: "Email body. Use \\n\\n for paragraph breaks.",
    isPhish: true,  // true = phishing, false = legitimate
    explanation: "Explain what gives it away — ESL patterns, fake domain, cultural tell, etc.",
    // Required for phishing scenarios — omit for legitimate emails:
    redFlags: [
        { text: "The primary red flag (e.g. fake domain, ESL phrase)", correct: true },
        { text: "A plausible-sounding but incorrect distractor", correct: false },
        { text: "Another distractor", correct: false },
        { text: "A fourth option", correct: false }
    ]
}
```

### Adding an SMS / smishing scenario

```javascript
{
    type: 'sms',
    from: "Display name (e.g. DHL, HMRC)",
    senderNumber: "+XX XXX XXX XXXX or alphanumeric sender ID",
    timestamp: "Today 10:34 AM",
    body: "The SMS message content.",
    isPhish: true,
    explanation: "Explain the smishing indicators — fake link domain, urgency tactics, etc.",
    // Required for phishing scenarios:
    redFlags: [
        { text: "Primary indicator", correct: true },
        { text: "Distractor", correct: false },
        { text: "Distractor", correct: false },
        { text: "Distractor", correct: false }
    ]
}
```

### Tips for good contributions

- **Include at least one legitimate control message** for each country/region you add — it makes the game harder and more realistic
- **Keep `redFlags` distractors plausible** — wrong answers should be things players might reasonably suspect
- **Add your explanation in English** even if the message itself is in another language, so the feedback is accessible to all players
- **Use real regional markers**: local tax agencies, popular banks, delivery services, payment methods (BLIK, Pix, INTERAC, UPI, etc.), and government portals

Submit a Pull Request with a brief note on the cultural context you've added. Together we can build a comprehensive, global social engineering training resource.
