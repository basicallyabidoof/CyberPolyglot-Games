const API = '';  // same origin — Flask serves both static files and API

const messages = [
    // --- EMAILS ---
    {
        type: 'email',
        sender: "admin@hmrc-gov-uk.com",
        recipient: "taxpayer@example.com",
        subject: "Tax Refund Notification",
        date: "monday, 14 Mar",
        body: "Dear Mr. Sam,\n\nWe have reviewed your tax return and you are eligible for a refund of £450.00.\n\nPlease click the link below to claim your funds and receive your approval within 24 hours.\n\nRegards,\nHM Revenue & Customs",
        isPhish: true,
        explanation: "Phishing! 'Dear Mr. Sam' pairs 'Mr.' with a first name — a common ESL error. 'monday' is uncapitalized. 'receive your approval' is awkward phrasing no native English speaker would write. Most critically, 'hmrc-gov-uk.com' is a fake domain — real HMRC emails only come from gov.uk.",
        redFlags: [
            { text: "Fake domain: hmrc-gov-uk.com (real HMRC uses gov.uk)", correct: true },
            { text: "The refund amount (£450) is unusually high", correct: false },
            { text: "HMRC never contacts taxpayers by email", correct: false },
            { text: "The email was sent on a Monday", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "hr@company-internal.com",
        recipient: "employee@company.com",
        subject: "Mandatory: Updated Employee Handbook",
        date: "Tuesday, 15 Mar",
        body: "Hi team,\n\nPlease review the updated employee handbook attached to this email. All employees must acknowledge receipt by Friday.\n\nBest,\nSarah Johnson\nHuman Resources",
        isPhish: false,
        explanation: "Legitimate! Standard corporate communication: sender matches the company domain, proper capitalization, correct grammar, and no suspicious links. The named sender (Sarah Johnson) adds accountability."
    },
    {
        type: 'email',
        sender: "support@cra-arc.gc-ca.net",
        recipient: "citizen@example.ca",
        subject: "INTERAC e-Transfer: CRA Refund",
        date: "wednesday, 12 Apr",
        body: "Hello Customer,\n\nCanada Revenue Agency (CRA) has sent you an INTERAC e-Transfer for $312.50.\n\nTo deposit your money, please click the secure link and enter your banking details to kindly do the needful.\n\nThank you,\nCRA Admin",
        isPhish: true,
        explanation: "Phishing! 'kindly do the needful' is a well-known ESL phrase (common in South Asian English) that Canadian government agencies never use. 'wednesday' is uncapitalized. The domain 'cra-arc.gc-ca.net' is fake — CRA only uses canada.ca. 'Hello Customer' is too generic for a government communication.",
        redFlags: [
            { text: "'kindly do the needful' — an ESL phrase no Canadian agency would write", correct: true },
            { text: "CRA never sends INTERAC e-Transfers", correct: false },
            { text: "The transfer amount ($312.50) is an odd number", correct: false },
            { text: "Government emails are always in both French and English", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "info@ato.gov.au",
        recipient: "business@example.com.au",
        subject: "BAS Statement Overdue",
        date: "Thursday, 20 Oct",
        body: "Dear Business Owner,\n\nYour Business Activity Statement (BAS) is currently overdue. Please log in to the ATO portal via myGov to submit your statement as soon as possible to avoid penalties.\n\nRegards,\nAustralian Taxation Office",
        isPhish: false,
        explanation: "Legitimate! Correct domain (ato.gov.au), professional phrasing, proper capitalization throughout, and directs users to myGov — not a suspicious third-party link. No request for credentials or payment via link."
    },
    {
        type: 'email',
        sender: "service@paypal-security-alert.com",
        recipient: "user@example.com",
        subject: "Your account is restricted",
        date: "friday, 21 Oct",
        body: "Dear User,\n\nWe detect unusual activity on your account. Your account has been limited until you verify your identity.\n\nPlease login your account to restore access.\n\nThanks,\nPayPal Support",
        isPhish: true,
        explanation: "Phishing! 'friday' is uncapitalized. 'We detect' should be 'We have detected' and 'login your account' should be 'log in to your account' — both are ESL verb errors. The sender domain 'paypal-security-alert.com' is entirely fake; PayPal only emails from paypal.com.",
        redFlags: [
            { text: "Fake domain — PayPal only emails from @paypal.com", correct: true },
            { text: "PayPal never restricts accounts without warning", correct: false },
            { text: "The greeting 'Dear User' is too generic", correct: false },
            { text: "'login' should be 'log in' — but this alone proves nothing", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "kundenservice@sparkasse-sicherheit.de",
        recipient: "kunde@beispiel.de",
        subject: "Wichtige Mitteilung: Ihr Konto wurde vorübergehend gesperrt",
        date: "dienstag, 12 Mai",
        body: "Sehr geehrter Kunde,\n\nWir haben ungewöhnliche Aktivitäten auf Ihrem Konto festgestellt. Ihr Konto wurde aus Sicherheitsgründen eingeschränkt.\n\nBitte klicken Sie auf den untenstehenden Link, um Ihre Daten zu bestätigen und Ihr Konto zu entsperren.\n\nMit freundlichen Grüßen,\nSparkasse Kundenservice",
        isPhish: true,
        explanation: "Phishing! In German, all nouns and days of the week are capitalized — 'dienstag' should be 'Dienstag'. This is a fundamental grammar rule no German speaker would miss. The domain 'sparkasse-sicherheit.de' is fake, and asking you to click a link to 'unlock your account' is a classic credential theft setup.",
        redFlags: [
            { text: "'dienstag' must be capitalized in German — a rule no native speaker breaks", correct: true },
            { text: "German banks never send security emails", correct: false },
            { text: "The greeting 'Sehr geehrter Kunde' is too formal", correct: false },
            { text: "The email is too short for a legitimate bank notification", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "recursos.humanos@empresa.com",
        recipient: "empleado@empresa.com",
        subject: "Recordatorio: Evaluación de Desempeño",
        date: "Miércoles, 14 Jun",
        body: "Hola equipo,\n\nEste es un recordatorio de que las evaluaciones de desempeño anuales deben completarse para el final de esta semana. Por favor, asegúrense de subir sus formularios al portal interno de la empresa.\n\nSaludos,\nRecursos Humanos",
        isPhish: false,
        explanation: "Legitimate! Both sender and recipient are on the same company domain (empresa.com), capitalization is correct throughout, and employees are directed to an internal portal — not an external link. No urgency or credential request."
    },
    {
        type: 'email',
        sender: "info@posta-shqiptare-al.com",
        recipient: "qytetar@example.al",
        subject: "Pakoja juaj po pret dorëzimin",
        date: "E hënë, 3 Shtator",
        body: "I dashur klient,\n\nPakoja juaj nuk mund të dorëzohej për shkak të adresës së pasaktë. Ju lutemi klikoni këtu për të përditësuar informacionin tuaj dhe për të paguar tarifën e ridërgesës prej 150 LEK.\n\nFaleminderit,\nPosta Shqiptare",
        isPhish: true,
        explanation: "Phishing! This Albanian package delivery scam uses the fake domain 'posta-shqiptare-al.com' — the real Albanian Post uses postashqiptare.al. The generic greeting 'I dashur klient' (Dear customer) and a small re-delivery fee requested via link are hallmarks of this widespread scam format.",
        redFlags: [
            { text: "Fake domain — Albanian Post uses postashqiptare.al, not .com", correct: true },
            { text: "150 LEK is an unusually small amount", correct: false },
            { text: "Albanian Post never sends emails", correct: false },
            { text: "The subject line uses special characters (ë)", correct: false }
        ]
    },

    // --- SMS / SMISHING ---
    {
        type: 'sms',
        from: "USPS",
        senderNumber: "+1-800-275-8777",
        timestamp: "Today 10:34 AM",
        body: "USPS: Ur pkg #9400136895 cud not b delivered. Update ur delivery address now or it will b returned: usps-redeliver.info/9400",
        isPhish: true,
        explanation: "Smishing! Real USPS texts never use SMS abbreviations like 'ur', 'cud', or 'b' — a major postal service uses proper grammar. The link 'usps-redeliver.info' is not a USPS domain (usps.com). If a package is undeliverable, USPS leaves a physical notice — it does not send text links demanding address updates.",
        redFlags: [
            { text: "Link domain usps-redeliver.info is fake — USPS only uses usps.com", correct: true },
            { text: "USPS never texts about undelivered packages", correct: false },
            { text: "The tracking number is too long to be real", correct: false },
            { text: "SMS abbreviations like 'ur' and 'cud' prove it's a phish", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "Barclays",
        senderNumber: "BARCLAY",
        timestamp: "Today 2:17 PM",
        body: "Barclays: Fraud alert on card ending 4821. Did you make a £49.99 purchase at AMAZON UK? Reply YES or NO. Do NOT click any links.",
        isPhish: false,
        explanation: "Legitimate! Real bank fraud alerts show the last 4 digits of your specific card, ask you to reply YES/NO, and explicitly tell you not to click links. There is no URL included. This is how genuine fraud alerts work — they confirm a known transaction, not request credentials."
    },
    {
        type: 'sms',
        from: "myGov",
        senderNumber: "+61 400 111 000",
        timestamp: "Yesterday 9:02 AM",
        body: "myGov: Your account requires immediate verification. Failure to verify within 24 hours will result in suspension. Tap here: mygov-verify.net/au",
        isPhish: true,
        explanation: "Smishing! The Australian myGov service never sends links via SMS — all communications go through the secure myGov inbox. The domain 'mygov-verify.net' is fake (real site is my.gov.au). The '24 hours or suspended' threat is a textbook urgency pressure tactic designed to bypass careful thinking.",
        redFlags: [
            { text: "myGov never sends links via SMS — they use the secure inbox only", correct: true },
            { text: "Australian phone numbers don't start with +61 400", correct: false },
            { text: "Government services never use the word 'immediate'", correct: false },
            { text: "The message is too short for an official communication", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "DHL",
        senderNumber: "+49 800 1111 222",
        timestamp: "Mon 11:45 AM",
        body: "DHL: Ihr Paket wartet. Zollgebühr ausstehend: €2,99. Zahlen Sie jetzt um Rücksendung zu vermeiden: dhl-zoll-zahlung.de/paket382",
        isPhish: true,
        explanation: "Smishing! This German 'customs fee' SMS is one of Europe's most common smishing lures. The domain 'dhl-zoll-zahlung.de' is fake — DHL Germany operates through dhl.de. Legitimate customs notices arrive via official DHL tracking, not an SMS payment link. The small fee (€2,99) is designed to seem worth paying without thinking twice.",
        redFlags: [
            { text: "Fake domain — DHL Germany uses dhl.de, not dhl-zoll-zahlung.de", correct: true },
            { text: "DHL never charges customs fees under €5", correct: false },
            { text: "German texts don't use commas in decimal numbers", correct: false },
            { text: "The fee is suspiciously specific (€2,99)", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "Bradesco",
        senderNumber: "Bradesco",
        timestamp: "Today 3:55 PM",
        body: "Bradesco: Uma transferência Pix de R$850,00 foi iniciada em seu nome. Não reconhece? Cancele AGORA: bradesco-pix-cancel.com/urgente",
        isPhish: true,
        explanation: "Smishing! This Brazilian Pix cancellation scam creates panic with 'AGORA' (NOW) and a large unexpected transfer. Real Bradesco Pix disputes are handled entirely inside the Bradesco app — not through SMS links. The domain 'bradesco-pix-cancel.com' is fake; the real domain is bradesco.com.br. The .com vs .com.br distinction is the key tell.",
        redFlags: [
            { text: "bradesco-pix-cancel.com is fake — Brazilian Bradesco uses bradesco.com.br", correct: true },
            { text: "Pix transfers over R$500 are always flagged as fraud", correct: false },
            { text: "Brazilian banks never send fraud alerts via SMS", correct: false },
            { text: "'AGORA' in all caps is always suspicious", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "FedEx",
        senderNumber: "FedEx",
        timestamp: "Today 8:44 AM",
        body: "FedEx: Your shipment #772458820014 is out for delivery today between 10am–2pm. Track at fedex.com/track",
        isPhish: false,
        explanation: "Legitimate! Real FedEx delivery SMS messages include a valid tracking number, link only to fedex.com, give a delivery window, and request nothing from you. No urgency, no fee, no request for credentials — just useful information."
    },
    {
        type: 'sms',
        from: "CAF",
        senderNumber: "+33 9 69 39 39 39",
        timestamp: "Tue 4:12 PM",
        body: "CAF: Vous avez un remboursement de 180€ en attente. Validez votre RIB ici pour recevoir vos fonds: caf-remboursement.fr/valider",
        isPhish: true,
        explanation: "Smishing! France's CAF (family benefits agency) communicates exclusively through the CAF app or caf.fr — never through SMS links. 'caf-remboursement.fr' is a fake domain. Asking you to 'validate your RIB' (bank account details) via SMS link is a financial credential theft attempt targeting French benefits recipients.",
        redFlags: [
            { text: "CAF only contacts through caf.fr or the app — never SMS payment links", correct: true },
            { text: "French government agencies always write in formal French", correct: false },
            { text: "A €180 refund is too round a number to be legitimate", correct: false },
            { text: "The phone number format is incorrect for France", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "SBI",
        senderNumber: "SBI-OTP",
        timestamp: "Today 1:30 PM",
        body: "SBI: Your OTP for login is 847291. NEVER share this OTP with anyone including bank officials. Valid for 10 mins. If not requested by you, call 1800-11-2211.",
        isPhish: false,
        explanation: "Legitimate! Real bank OTP messages include the code, explicitly warn you never to share it (even with 'bank officials' — a social engineering countermeasure), give a validity window, and provide a callback number. No link, no request to click anything."
    }
];

// --- State ---
let currentIndex = 0;
let score        = 0;
let streak       = 0;
let gameState    = 'classify';
let teamId       = null;
let teamName     = null;

// --- Session persistence (localStorage) ---
const SESSION_KEY = 'phishcatchers_session';

function saveSession() {
    if (!teamId) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        teamId, teamName, currentIndex, score, streak
    }));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
}

// --- DOM refs ---
const emailView    = document.getElementById('email-view');
const smsView      = document.getElementById('sms-view');
const feedbackModal  = document.getElementById('feedback-modal');
const redflagModal   = document.getElementById('redflag-modal');
const leaderboardModal = document.getElementById('leaderboard-modal');
const teamScreen     = document.getElementById('team-screen');
const btnLegit = document.getElementById('btn-legit');
const btnPhish = document.getElementById('btn-phish');

// --- Team registration ---

async function joinTeam(name) {
    const errorEl = document.getElementById('team-error');
    const btn     = document.getElementById('btn-join-team');
    btn.disabled  = true;
    btn.textContent = 'Joining…';
    errorEl.classList.add('hidden');

    try {
        const res  = await fetch(`${API}/api/teams`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Server error');
        }

        teamId   = data.id;
        teamName = data.name;

        document.getElementById('team-name-display').textContent = `Team: ${teamName}`;
        document.getElementById('team-name-display').classList.remove('hidden');
        document.getElementById('btn-leaderboard').classList.remove('hidden');
        document.getElementById('btn-save-quit').classList.remove('hidden');

        teamScreen.classList.add('hidden');

        // Check for a saved session for this team
        const saved = loadSession();
        if (saved && saved.teamId === data.id && saved.currentIndex > 0 && saved.currentIndex < messages.length) {
            showResumePrompt(saved);
        } else {
            loadMessage();
        }
    } catch (err) {
        errorEl.textContent = err.message === 'Failed to fetch'
            ? 'Cannot reach server. Make sure app.py is running.'
            : err.message;
        errorEl.classList.remove('hidden');
        btn.disabled    = false;
        btn.textContent = 'Join / Create Team →';
    }
}

document.getElementById('btn-join-team').addEventListener('click', () => {
    const name = document.getElementById('team-name-input').value.trim();
    if (!name) {
        const e = document.getElementById('team-error');
        e.textContent = 'Please enter a team name.';
        e.classList.remove('hidden');
        return;
    }
    joinTeam(name);
});

document.getElementById('team-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-join-team').click();
});

// --- Score submission ---

async function submitScore(id, s) {
    const res  = await fetch(`${API}/api/scores`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ team_id: id, score: s })
    });
    if (!res.ok) throw new Error('Score submission failed');
    return res.json();
}

// --- Leaderboard ---

async function fetchLeaderboard() {
    const res  = await fetch(`${API}/api/leaderboard`);
    if (!res.ok) throw new Error('Could not load leaderboard');
    return res.json();
}

function renderLeaderboard(rows) {
    const body = document.getElementById('leaderboard-body');
    if (!rows.length) {
        body.innerHTML = '<p class="leaderboard-loading">No scores yet.</p>';
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    body.innerHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>Total</th>
                    <th>Plays</th>
                    <th>Avg</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map((r, i) => `
                    <tr class="${r.name === teamName ? 'leaderboard-own-row' : ''}">
                        <td>${medals[i] || i + 1}</td>
                        <td class="leaderboard-team-name">${escapeHtml(r.name)}</td>
                        <td><strong>${r.total_score}</strong></td>
                        <td>${r.play_count}</td>
                        <td>${Math.round(r.avg_score)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function showLeaderboard() {
    document.getElementById('leaderboard-body').innerHTML = '<p class="leaderboard-loading">Loading…</p>';
    leaderboardModal.classList.remove('hidden');
    try {
        const rows = await fetchLeaderboard();
        renderLeaderboard(rows);
    } catch {
        document.getElementById('leaderboard-body').innerHTML =
            '<p class="leaderboard-loading">Could not load leaderboard.</p>';
    }
}

document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboard);
document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
    leaderboardModal.classList.add('hidden');
});

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// --- Session resume ---

function showResumePrompt(saved) {
    document.getElementById('resume-details').textContent =
        `You left off at challenge ${saved.currentIndex + 1} of ${messages.length} with ${saved.score} points.`;
    document.getElementById('resume-modal').classList.remove('hidden');
}

document.getElementById('btn-resume').addEventListener('click', () => {
    const saved = loadSession();
    currentIndex = saved.currentIndex;
    score        = saved.score;
    streak       = saved.streak || 0;
    updateScore();
    document.getElementById('resume-modal').classList.add('hidden');
    loadMessage();
});

document.getElementById('btn-start-fresh').addEventListener('click', () => {
    clearSession();
    document.getElementById('resume-modal').classList.add('hidden');
    loadMessage();
});

// --- Save & Quit ---

document.getElementById('btn-save-quit').addEventListener('click', () => {
    saveSession();
    document.querySelector('main').innerHTML = `
        <div class="game-over">
            <div class="game-over-icon">💾</div>
            <h2>Progress Saved!</h2>
            <p style="text-align:center;color:#555;margin-bottom:20px;line-height:1.6">
                Come back and enter <strong>"${escapeHtml(teamName)}"</strong><br>
                to pick up right where you left off.
            </p>
            <div class="score-breakdown">
                <div class="breakdown-row"><span>Challenge</span><span>${currentIndex + 1} / ${messages.length}</span></div>
                <div class="breakdown-row"><span>Score so far</span><span>${score}</span></div>
                <div class="breakdown-row"><span>Team</span><span>${escapeHtml(teamName)}</span></div>
            </div>
            <button class="btn btn-next" style="margin-top:20px" onclick="location.reload()">Back to Start</button>
        </div>
    `;
    document.getElementById('progress-bar').style.width =
        (currentIndex / messages.length * 100) + '%';
});

// --- Core game logic ---

function loadMessage() {
    const msg = messages[currentIndex];
    gameState  = 'classify';
    btnLegit.disabled = false;
    btnPhish.disabled = false;

    const badge = document.getElementById('type-badge');
    badge.textContent = msg.type === 'sms' ? 'SMS' : 'EMAIL';
    badge.className   = 'type-badge type-' + msg.type;

    if (msg.type === 'email') {
        emailView.classList.remove('hidden');
        smsView.classList.add('hidden');
        document.getElementById('email-sender').textContent    = msg.sender;
        document.getElementById('email-recipient').textContent = msg.recipient;
        document.getElementById('email-subject').textContent   = msg.subject;
        document.getElementById('email-date').textContent      = msg.date;
        document.getElementById('email-body').textContent      = msg.body;
    } else {
        emailView.classList.add('hidden');
        smsView.classList.remove('hidden');
        document.getElementById('sms-from').textContent      = msg.from;
        document.getElementById('sms-number').textContent    = msg.senderNumber;
        document.getElementById('sms-timestamp').textContent = msg.timestamp;
        document.getElementById('sms-body').textContent      = msg.body;
    }

    document.getElementById('level').textContent = currentIndex + 1;
    document.getElementById('total').textContent = messages.length;
    updateProgressBar();
    updateStreakDisplay();
}

function handleGuess(isGuessPhish) {
    if (gameState !== 'classify') return;
    gameState = 'waiting';
    btnLegit.disabled = true;
    btnPhish.disabled = true;

    const msg       = messages[currentIndex];
    const isCorrect = isGuessPhish === msg.isPhish;

    if (isCorrect) {
        score += 100;
        streak++;
        updateScore();
        updateStreakDisplay();
        if (isGuessPhish && msg.redFlags) {
            showRedFlagQuestion(msg);
            return;
        }
    } else {
        streak = 0;
        updateStreakDisplay();
    }

    showFeedback(isCorrect, false);
}

function showRedFlagQuestion(msg) {
    gameState = 'redflag';
    const optionsEl = document.getElementById('redflag-options');
    optionsEl.innerHTML = '';
    [...msg.redFlags].sort(() => Math.random() - 0.5).forEach(flag => {
        const btn = document.createElement('button');
        btn.className = 'redflag-btn';
        btn.textContent = flag.text;
        btn.addEventListener('click', () => handleRedFlagGuess(flag.correct));
        optionsEl.appendChild(btn);
    });
    redflagModal.classList.remove('hidden');
}

function handleRedFlagGuess(isCorrect) {
    redflagModal.classList.add('hidden');
    if (isCorrect) { score += 50; updateScore(); }
    showFeedback(true, isCorrect);
}

function showFeedback(correct, bonusCorrect) {
    gameState = 'feedback';
    const title   = document.getElementById('feedback-title');
    const bonusEl = document.getElementById('feedback-bonus');
    title.textContent = correct ? 'Correct!' : 'Incorrect!';
    title.style.color = correct ? '#27ae60' : '#e74c3c';
    bonusEl.classList.toggle('hidden', !bonusCorrect);
    document.getElementById('feedback-message').textContent = messages[currentIndex].explanation;
    feedbackModal.classList.remove('hidden');
}

function updateScore()  { document.getElementById('score').textContent = score; }

function updateStreakDisplay() {
    const d = document.getElementById('streak-display');
    document.getElementById('streak-count').textContent = streak;
    d.classList.toggle('hidden', streak < 2);
}

function updateProgressBar() {
    document.getElementById('progress-bar').style.width =
        (currentIndex / messages.length * 100) + '%';
}

document.getElementById('btn-legit').addEventListener('click', () => handleGuess(false));
document.getElementById('btn-phish').addEventListener('click', () => handleGuess(true));

document.getElementById('btn-next').addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
    currentIndex++;
    if (currentIndex < messages.length) {
        saveSession();   // auto-save after every challenge
        loadMessage();
    } else {
        clearSession();  // finished naturally — no need to resume
        showGameOver();
    }
});

// --- Game over ---

async function showGameOver() {
    const phishWithFlags = messages.filter(m => m.isPhish && m.redFlags).length;
    const maxScore = messages.length * 100 + phishWithFlags * 50;
    const pct      = Math.round((score / maxScore) * 100);

    let grade, gradeColor;
    if (pct >= 90)      { grade = 'Expert Analyst';  gradeColor = '#27ae60'; }
    else if (pct >= 70) { grade = 'Solid Defender';  gradeColor = '#2980b9'; }
    else if (pct >= 50) { grade = 'Needs Practice';  gradeColor = '#e67e22'; }
    else                { grade = 'Stay Vigilant';   gradeColor = '#e74c3c'; }

    document.querySelector('main').innerHTML = `
        <div class="game-over">
            <div class="game-over-icon">🎣</div>
            <h2>Mission Complete!</h2>
            <div class="final-score">${score}</div>
            <div class="final-score-label">out of ${maxScore} possible points</div>
            <div class="grade-badge" style="color:${gradeColor};border-color:${gradeColor}">${grade}</div>
            <div class="score-breakdown">
                <div class="breakdown-row"><span>Challenges analysed</span><span>${messages.length}</span></div>
                <div class="breakdown-row"><span>Emails</span><span>${messages.filter(m => m.type === 'email').length}</span></div>
                <div class="breakdown-row"><span>SMS / Smishing</span><span>${messages.filter(m => m.type === 'sms').length}</span></div>
                <div class="breakdown-row"><span>Score</span><span>${pct}%</span></div>
            </div>
            <div id="team-result" class="team-result">
                <div class="team-result-loading">Submitting score to team…</div>
            </div>
            <div class="game-over-actions">
                <button class="btn btn-next" onclick="location.reload()">Play Again</button>
                <button class="btn btn-leaderboard-gameover" id="btn-gameover-leaderboard">🏆 Leaderboard</button>
            </div>
        </div>
    `;
    document.getElementById('progress-bar').style.width = '100%';

    document.getElementById('btn-gameover-leaderboard').addEventListener('click', showLeaderboard);

    // Submit score and update team result panel
    if (teamId !== null) {
        try {
            const result = await submitScore(teamId, score);
            document.getElementById('team-result').innerHTML = `
                <div class="team-result-card">
                    <div class="team-result-name">Team: ${escapeHtml(teamName)}</div>
                    <div class="team-result-stats">
                        <div class="team-stat">
                            <span class="team-stat-value">${result.total_score}</span>
                            <span class="team-stat-label">Team Total</span>
                        </div>
                        <div class="team-stat">
                            <span class="team-stat-value">#${result.rank}</span>
                            <span class="team-stat-label">Rank</span>
                        </div>
                        <div class="team-stat">
                            <span class="team-stat-value">${result.play_count}</span>
                            <span class="team-stat-label">Plays</span>
                        </div>
                    </div>
                </div>
            `;
        } catch {
            document.getElementById('team-result').innerHTML =
                '<p class="team-result-error">Could not submit score — check server connection.</p>';
        }
    } else {
        document.getElementById('team-result').innerHTML = '';
    }
}
