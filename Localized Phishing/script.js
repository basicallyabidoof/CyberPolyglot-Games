const emails = [
    {
        sender: "admin@hmrc-gov-uk.com",
        recipient: "taxpayer@example.com",
        subject: "Tax Refund Notification",
        date: "monday, 14 Mar",
        body: "Dear Mr. Sam,\n\nWe have reviewed your tax return and you are eligible for a refund of £450.00.\n\nPlease click the link below to claim your funds and receive your approval within 24 hours.\n\nRegards,\nHM Revenue & Customs",
        isPhish: true,
        explanation: "Phishing! Cultural/ESL markers: 'Dear Mr. Sam' is an ESL phrasing pattern (using 'Mr.' with a first name). 'monday' is uncapitalized. 'receive your approval' is awkward syntax instead of 'hear back from us' or 'process your claim'. Also, the domain 'hmrc-gov-uk.com' is fake (the real one is gov.uk)."
    },
    {
        sender: "hr@company-internal.com",
        recipient: "employee@company.com",
        subject: "Mandatory: Updated Employee Handbook",
        date: "Tuesday, 15 Mar",
        body: "Hi team,\n\nPlease review the updated employee handbook attached to this email. All employees must acknowledge receipt by Friday.\n\nBest,\nSarah Johnson\nHuman Resources",
        isPhish: false,
        explanation: "Legitimate! The email uses standard corporate communication, proper capitalization, and correct syntax."
    },
    {
        sender: "support@cra-arc.gc-ca.net",
        recipient: "citizen@example.ca",
        subject: "INTERAC e-Transfer: CRA Refund",
        date: "wednesday, 12 Apr",
        body: "Hello Customer,\n\nCanada Revenue Agency (CRA) has sent you an INTERAC e-Transfer for $312.50.\n\nTo deposit your money, please click the secure link and enter your banking details to kindly do the needful.\n\nThank you,\nCRA Admin",
        isPhish: true,
        explanation: "Phishing! 'kindly do the needful' is a very common ESL/regional phrasing not typically used by Canadian government agencies. 'wednesday' is uncapitalized. The sender domain 'cra-arc.gc-ca.net' is fake (CRA uses canada.ca), and 'Hello Customer' is too generic."
    },
    {
        sender: "info@ato.gov.au",
        recipient: "business@example.com.au",
        subject: "BAS Statement Overdue",
        date: "Thursday, 20 Oct",
        body: "Dear Business Owner,\n\nYour Business Activity Statement (BAS) is currently overdue. Please log in to the ATO portal via myGov to submit your statement as soon as possible to avoid penalties.\n\nRegards,\nAustralian Taxation Office",
        isPhish: false,
        explanation: "Legitimate! Uses the correct Australian Taxation Office (ATO) domain, standard professional phrasing, proper capitalization, and doesn't push awkward links directly in the email."
    },
    {
        sender: "service@paypal-security-alert.com",
        recipient: "user@example.com",
        subject: "Your account is restricted",
        date: "friday, 21 Oct",
        body: "Dear User,\n\nWe detect unusual activity on your account. Your account has been limited until you verify your identity.\n\nPlease login your account to restore access.\n\nThanks,\nPayPal Support",
        isPhish: true,
        explanation: "Phishing! 'friday' is uncapitalized. Grammatical errors like 'We detect' instead of 'We have detected' and 'login your account' instead of 'log in to your account' indicate ESL phrasing. The domain is also suspicious."
    },
    {
        sender: "kundenservice@sparkasse-sicherheit.de",
        recipient: "kunde@beispiel.de",
        subject: "Wichtige Mitteilung: Ihr Konto wurde vorübergehend gesperrt",
        date: "dienstag, 12 Mai",
        body: "Sehr geehrter Kunde,\n\nWir haben ungewöhnliche Aktivitäten auf Ihrem Konto festgestellt. Ihr Konto wurde aus Sicherheitsgründen eingeschränkt.\n\nBitte klicken Sie auf den untenstehenden Link, um Ihre Daten zu bestätigen und Ihr Konto zu entsperren.\n\nMit freundlichen Grüßen,\nSparkasse Kundenservice",
        isPhish: true,
        explanation: "Phishing! 'dienstag' is uncapitalized (in German, days of the week are capitalized). The domain 'sparkasse-sicherheit.de' is suspicious. The generic greeting 'Sehr geehrter Kunde' instead of a personalized name, combined with a link to unlock the account, is a classic phishing tactic."
    },
    {
        sender: "recursos.humanos@empresa.com",
        recipient: "empleado@empresa.com",
        subject: "Recordatorio: Evaluación de Desempeño",
        date: "Miércoles, 14 Jun",
        body: "Hola equipo,\n\nEste es un recordatorio de que las evaluaciones de desempeño anuales deben completarse para el final de esta semana. Por favor, asegúrense de subir sus formularios al portal interno de la empresa.\n\nSaludos,\nRecursos Humanos",
        isPhish: false,
        explanation: "Legitimate! The email uses proper capitalization, standard professional communication, and directs users to an internal portal rather than clicking an external link."
    },
    {
        sender: "info@posta-shqiptare-al.com",
        recipient: "qytetar@example.al",
        subject: "Pakoja juaj po pret dorëzimin",
        date: "E hënë, 3 Shtator",
        body: "I dashur klient,\n\nPakoja juaj nuk mund të dorëzohej për shkak të adresës së pasaktë. Ju lutemi klikoni këtu për të përditësuar informacionin tuaj dhe për të paguar tarifën e ridërgesës prej 150 LEK.\n\nFaleminderit,\nPosta Shqiptare",
        isPhish: true,
        explanation: "Phishing! This is a classic package delivery scam. The domain 'posta-shqiptare-al.com' is fake (the real one is postashqiptare.al). The greeting 'I dashur klient' is generic, and the email requests a small fee (150 LEK) via a direct link, which legitimate postal services typically do not do via email."
    }
];

let currentEmailIndex = 0;
let score = 0;

// DOM Elements
const emailSender = document.getElementById('email-sender');
const emailRecipient = document.getElementById('email-recipient');
const emailSubject = document.getElementById('email-subject');
const emailDate = document.getElementById('email-date');
const emailBody = document.getElementById('email-body');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const btnLegit = document.getElementById('btn-legit');
const btnPhish = document.getElementById('btn-phish');
const feedbackModal = document.getElementById('feedback-modal');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackMessage = document.getElementById('feedback-message');
const btnNext = document.getElementById('btn-next');

function loadEmail() {
    const email = emails[currentEmailIndex];
    emailSender.textContent = email.sender;
    emailRecipient.textContent = email.recipient;
    emailSubject.textContent = email.subject;
    emailDate.textContent = email.date;
    emailBody.textContent = email.body;
    levelDisplay.textContent = currentEmailIndex + 1;
}

function handleGuess(isGuessPhish) {
    const email = emails[currentEmailIndex];
    const isCorrect = isGuessPhish === email.isPhish;

    if (isCorrect) {
        score += 100;
        scoreDisplay.textContent = score;
        feedbackTitle.textContent = "Correct!";
        feedbackTitle.style.color = "green";
    } else {
        feedbackTitle.textContent = "Incorrect!";
        feedbackTitle.style.color = "red";
    }

    feedbackMessage.textContent = email.explanation;
    feedbackModal.classList.remove('hidden');
}

btnLegit.addEventListener('click', () => handleGuess(false));
btnPhish.addEventListener('click', () => handleGuess(true));

btnNext.addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
    currentEmailIndex++;
    
    if (currentEmailIndex < emails.length) {
        loadEmail();
    } else {
        // End of game
        emailBody.innerHTML = `<h2>Game Over!</h2><p>Your final score: ${score}/${emails.length * 100}</p>`;
        document.querySelector('.action-buttons').style.display = 'none';
        
        // Hide email headers for game over screen
        emailSender.parentElement.style.display = 'none';
        emailRecipient.parentElement.style.display = 'none';
        emailSubject.parentElement.style.display = 'none';
        emailDate.parentElement.style.display = 'none';
    }
});

// Init game
loadEmail();