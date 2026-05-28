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
    },

    // --- ADDITIONAL EMAILS ---
    {
        type: 'email',
        sender: "info@nta-e-tax.net",
        recipient: "tanaka@example.jp",
        subject: "【国税庁】還付金のお知らせ（重要）",
        date: "2024年3月18日（月曜日）",
        body: "田中 様\n\n国税庁より還付金23,400円が確定しました。\n\n以下のリンクから24時間以内にお手続きください。手続きが遅れた場合、還付金は無効となります。\n\nhttp://nta-e-tax.net/refund/apply\n\n国税庁 e-Tax サービスデスク",
        isPhish: true,
        explanation: "Phishing! All Japanese government websites end in .go.jp — the real National Tax Agency uses nta.go.jp. 'nta-e-tax.net' is entirely fake. The '24時間以内' (within 24 hours) deadline is classic urgency pressure. Legitimate e-Tax refund notifications are sent through the My Number portal, never by email with external links.",
        redFlags: [
            { text: "Fake domain — Japanese government sites always use .go.jp (nta.go.jp)", correct: true },
            { text: "The refund amount (23,400円) is suspiciously specific", correct: false },
            { text: "The National Tax Agency never contacts Japanese taxpayers by email", correct: false },
            { text: "The email doesn't include a case reference number", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "service@alipay-secure.net",
        recipient: "user@example.com",
        subject: "【支付宝】您的账户因异常操作已被限制，请尽快处理",
        date: "2024年4月9日 星期二",
        body: "尊敬的用户您好，\n\n您的支付宝账户于今日检测到异常登录行为，账户已被临时限制。\n\n请在48小时内点击以下链接完成身份验证，否则账户将被永久冻结。\n\nhttp://alipay-secure.net/verify\n\n支付宝安全中心",
        isPhish: true,
        explanation: "Phishing! Alipay's real domain is alipay.com — 'alipay-secure.net' is fake. The threat of '永久冻结' (permanent freeze) within 48 hours is extreme pressure designed to panic the user into acting without thinking. Real Alipay security alerts are delivered inside the Alipay app only, never via email with external links.",
        redFlags: [
            { text: "Fake domain — Alipay only uses alipay.com, not alipay-secure.net", correct: true },
            { text: "Alipay never sends alerts to non-Alipay email addresses", correct: false },
            { text: "'永久冻结' (permanent freeze) is too extreme to appear in a real notification", correct: false },
            { text: "The date format is wrong for Alipay notifications", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "beveiliging@ing-beveiligingsdienst.nl",
        recipient: "klant@example.nl",
        subject: "Uw ING rekening is tijdelijk geblokkeerd",
        date: "dinsdag, 15 April",
        body: "Geachte klant,\n\nOns beveiligingssysteem heeft verdachte activiteit gedetecteerd op uw rekening. Om uw rekening te beveiligen, heeft u uw gegevens moeten bevestigen.\n\nKlik hier om uw account te ontgrendelen en toegang te herstellen.\n\nMet vriendelijke groet,\nING Klantenservice",
        isPhish: true,
        explanation: "Phishing! ING's real domain is ing.nl — 'ing-beveiligingsdienst.nl' is a fake look-alike. The phrase 'heeft u uw gegevens moeten bevestigen' is grammatically incorrect Dutch (correct: 'moet u uw gegevens bevestigen') — a subtle ESL error that a native Dutch speaker would notice immediately. Note: unlike German, Dutch days of the week ARE lowercase, so 'dinsdag' is correct here.",
        redFlags: [
            { text: "Fake domain — ING only emails from @ing.nl", correct: true },
            { text: "'dinsdag' should be capitalised — Dutch days are always capitalised", correct: false },
            { text: "'heeft u uw gegevens moeten bevestigen' is grammatically wrong Dutch", correct: false },
            { text: "The greeting 'Geachte klant' is too formal for ING", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "notifiche@posteitaliane-delivery.com",
        recipient: "cliente@example.it",
        subject: "Il tuo pacco è in attesa di consegna — Azione richiesta",
        date: "mercoledì, 20 marzo",
        body: "Gentile cliente,\n\nIl tuo pacco non è stato consegnato a causa di informazioni di indirizzo incomplete. Una tassa di spedizione di €2,50 deve essere pagata entro 48 ore per evitare la restituzione del pacco.\n\nConferma il tuo indirizzo e paga qui:\nhttp://posteitaliane-delivery.com/pago\n\nSaluti,\nPoste Italiane — Servizio Consegne",
        isPhish: true,
        explanation: "Phishing! The real Poste Italiane uses posteitaliane.it — 'posteitaliane-delivery.com' is a fake domain. The €2,50 fee is deliberately small to seem worth paying without scrutiny. Important: in Italian, days of the week are NOT capitalised ('mercoledì' is correct), so that is not a red flag here — the fake domain is the decisive tell.",
        redFlags: [
            { text: "Fake domain — Poste Italiane uses posteitaliane.it, not .com", correct: true },
            { text: "'mercoledì' must be capitalised — Italian days are always capitalised", correct: false },
            { text: "Italian postal services never send delivery notifications by email", correct: false },
            { text: "The fee amount (€2,50) uses a comma, which is wrong", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "aterbetalning@skatteverket-se.com",
        recipient: "user@example.se",
        subject: "Skatteverket: Du har en skatteåterbäring väntande",
        date: "måndag, 11 mars",
        body: "Hej,\n\nVi har granskat din deklaration och fastställt att du har rätt till en skatteåterbäring på 3 420 kr.\n\nFör att behandla din återbetalning, vänligen bekräfta dina bankuppgifter inom 5 dagar:\n\nhttp://skatteverket-se.com/aterbetalning\n\nMed vänliga hälsningar,\nSkatteverket",
        isPhish: true,
        explanation: "Phishing! The real Swedish Tax Agency uses skatteverket.se — 'skatteverket-se.com' embeds the country code into the domain name, a common trick to look official. The real Skatteverket deposits refunds automatically to the bank account registered in Skattekonto — it never emails you asking to 'confirm bank details' via a link.",
        redFlags: [
            { text: "Fake domain — skatteverket-se.com mimics the real skatteverket.se", correct: true },
            { text: "Swedish tax refunds are never communicated by email", correct: false },
            { text: "'Hej' is too informal an opening for a government agency", correct: false },
            { text: "The refund amount (3 420 kr) is suspiciously round", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "alert@mbank-powiadomienie.pl",
        recipient: "klient@example.pl",
        subject: "mBank: Twoje konto zostało tymczasowo zablokowane",
        date: "wtorek, 16 kwiecień",
        body: "Szanowny Kliencie,\n\nWykryliśmy podejrzaną aktywność na Twoim koncie. W celu ochrony środków, Twoje konto zostało tymczasowo zablokowane.\n\nAby odblokować konto i potwierdzić tożsamość, kliknij poniższy link w ciągu 12 godzin:\n\nhttp://mbank-powiadomienie.pl/odblokuj\n\nPozdrowienia,\nZespół Bezpieczeństwa mBanku",
        isPhish: true,
        explanation: "Phishing! The real mBank uses mbank.pl — 'mbank-powiadomienie.pl' is a look-alike. The date 'wtorek, 16 kwiecień' contains a subtle but glaring Polish grammar error: after a number, the month must take the genitive case — '16 kwietnia', not '16 kwiecień'. No native Polish speaker would write this. The 12-hour deadline is also a pressure tactic.",
        redFlags: [
            { text: "'16 kwiecień' is wrong Polish — the genitive case requires '16 kwietnia'", correct: true },
            { text: "mBank never sends security alerts in Polish", correct: false },
            { text: "The domain mbank-powiadomienie.pl is fake", correct: false },
            { text: "A 12-hour deadline is never used by legitimate banks", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "bildirim@ptt-kargo-bilgi.com",
        recipient: "musteri@example.com.tr",
        subject: "PTT Kargo: Paketiniz teslim bekliyor",
        date: "Pazartesi, 4 Mart",
        body: "Sayın Müşteri,\n\nKargo takip numaranız 7340291847 olan paketiniz yanlış adres bilgisi nedeniyle teslim edilememiştir.\n\nPaketi almak için 24 saat içinde adres bilgilerinizi güncelleyin ve 4,90 TL ücret ödeyin:\n\nhttp://ptt-kargo-bilgi.com/guncelle\n\nSaygılarımızla,\nPTT Kargo",
        isPhish: true,
        explanation: "Phishing! All Turkish government and state services use .gov.tr — PTT's real domain is ptt.gov.tr. 'ptt-kargo-bilgi.com' is entirely fake. The 24-hour deadline and small fee (4,90 TL) mirror delivery smishing campaigns running across Europe and Turkey. PTT never requests address updates or payments via email links.",
        redFlags: [
            { text: "Fake domain — Turkish state PTT uses ptt.gov.tr, not .com", correct: true },
            { text: "The tracking number format is too short for PTT Kargo", correct: false },
            { text: "PTT Kargo never emails customers about delivery issues", correct: false },
            { text: "'Sayın Müşteri' is too generic a greeting for PTT", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "noreply@inps.it",
        recipient: "lavoratore@example.it",
        subject: "INPS: Rinnovo PIN dispositivo completato",
        date: "Mercoledì, 5 giugno",
        body: "Gentile Utente,\n\nLe comunichiamo che il suo PIN dispositivo INPS è stato rinnovato con successo e sarà operativo entro 48 ore lavorative.\n\nPer accedere ai servizi INPS utilizzi il portale ufficiale www.inps.it oppure l'applicazione INPS Mobile.\n\nPer assistenza contatti il Contact Center al numero gratuito 803 164.\n\nCordiali saluti,\nIstituto Nazionale Previdenza Sociale",
        isPhish: false,
        explanation: "Legitimate! The sender is from inps.it — Italy's official national social security institute. The email contains no link to click; it directs you to the known official portal (www.inps.it) or a free phone number. It informs rather than demands, and there is no urgency or credential request."
    },

    // --- ADDITIONAL SMS ---
    {
        type: 'sms',
        from: "ヤマト運輸",
        senderNumber: "0120-01-9625",
        timestamp: "Today 2:14 PM",
        body: "【ヤマト運輸】お荷物のお届けにあがりましたが不在のため持ち帰りました。再配達のお手続きはこちら: yamato-unyu-haiso.com/saihaitatsu",
        isPhish: true,
        explanation: "Smishing! This is Japan's single most common smishing lure. The real Yamato Transport (ヤマト運輸) uses kuronekoyamato.co.jp — 'yamato-unyu-haiso.com' is entirely fake. Real Yamato redelivery requests are made through the official app or by calling the company directly. The Japanese message itself is copied verbatim from millions of real Yamato notifications, making it convincing to native speakers.",
        redFlags: [
            { text: "Fake domain — Yamato Transport uses kuronekoyamato.co.jp", correct: true },
            { text: "The message is in Japanese, which is unusual for a delivery company", correct: false },
            { text: "Yamato Transport never sends SMS delivery notifications", correct: false },
            { text: "The phone number format is incorrect for Japanese freephone numbers", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "경찰청",
        senderNumber: "+82-2-1566-0112",
        timestamp: "Today 10:05 AM",
        body: "【경찰청】귀하의 명의로 금융사기 관련 수사가 진행 중입니다. 출석 요구서 확인 및 사건 조회는 아래 링크를 통해 즉시 확인하십시오: police-cyber-crime.net/confirm",
        isPhish: true,
        explanation: "Smishing! This is Korea's notorious '보이스피싱' (voice phishing) technique — impersonating the National Police Agency (경찰청) to create fear of criminal prosecution. The real Korean National Police Agency uses police.go.kr (.go.kr = Korean government domain). No government authority in South Korea summons citizens through an SMS link — official summons are always delivered in person or by registered mail.",
        redFlags: [
            { text: "Fake domain — Korean police use police.go.kr (.go.kr = Korean government)", correct: true },
            { text: "The Korean police would write in formal honorific Korean only", correct: false },
            { text: "A criminal investigation notice would never be sent by SMS in any country", correct: false },
            { text: "The phone number is too long for a Korean police number", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "BankID",
        senderNumber: "BankID",
        timestamp: "Today 8:33 AM",
        body: "BankID: Din inloggningssession är komprometterad. Avbryt obehörig inloggning omedelbart: bankid-sakerhet.se/avbryt",
        isPhish: true,
        explanation: "Smishing! BankID is Sweden's universal digital identity system used for banking, taxes, and government services — making it a prime smishing target. The real BankID communicates exclusively through the BankID app, never via SMS links. 'bankid-sakerhet.se' is fake. The word 'komprometterad' (compromised) and 'obehörig inloggning' (unauthorised login) are designed to panic Swedish users into clicking without thinking.",
        redFlags: [
            { text: "BankID only communicates through its app — it never sends SMS links", correct: true },
            { text: "Swedish security messages always use English terms like 'compromised'", correct: false },
            { text: "bankid-sakerhet.se sounds official because it uses Swedish words", correct: false },
            { text: "BankID would say 'Dear [name]' not use an impersonal message", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "PostNL",
        senderNumber: "+31 88 868 6868",
        timestamp: "Tue 11:22 AM",
        body: "PostNL: Uw pakket is vastgehouden bij de douane. Betaal €1,95 invoerrechten om vertraging te vermijden: postnl-douane.nl/betalen",
        isPhish: true,
        explanation: "Smishing! This is the Dutch equivalent of the DHL Germany customs fee scam — identical in structure. PostNL's real domain is postnl.nl — 'postnl-douane.nl' is a fake look-alike domain ('douane' = customs). The real PostNL handles customs notices through its tracking portal, not SMS payment links. The €1,95 fee is small enough to seem worth paying without checking.",
        redFlags: [
            { text: "Fake domain — PostNL uses postnl.nl, not postnl-douane.nl", correct: true },
            { text: "Dutch customs fees are always much higher than €1,95", correct: false },
            { text: "PostNL never sends any SMS messages", correct: false },
            { text: "'vastgehouden bij de douane' is an unusual phrasing in Dutch", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "InPost",
        senderNumber: "InPost",
        timestamp: "Wed 9:47 AM",
        body: "InPost: Twoja paczka #PL00183724 oczekuje w paczkomacie. Potwierdź odbiór i opłać zaległą kwotę 3,99 zł: inpost-platnosc.pl/odbior",
        isPhish: true,
        explanation: "Smishing! InPost is Poland's dominant parcel locker network and one of the country's most impersonated brands. The real InPost uses inpost.pl — 'inpost-platnosc.pl' ('platnosc' = payment) is a fake domain. Real InPost paczkomats (lockers) never require payment for pickup — you simply scan a QR code. The fee (3,99 zł) is small enough to seem plausible but the pickup process makes it impossible for a legitimate InPost text.",
        redFlags: [
            { text: "Fake domain — InPost uses inpost.pl, not inpost-platnosc.pl", correct: true },
            { text: "InPost paczkomats never require payment to retrieve a package", correct: false },
            { text: "Polish parcel lockers always require app-based QR code authentication", correct: false },
            { text: "The tracking number format is not standard for InPost", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "BCA",
        senderNumber: "+62 21-500888",
        timestamp: "Today 3:28 PM",
        body: "BCA: Transaksi mencurigakan terdeteksi di akun Anda. Segera verifikasi di: bca-secure.com/verifikasi atau akun Anda akan diblokir dalam 1x24 jam.",
        isPhish: true,
        explanation: "Smishing! Bank Central Asia (BCA) is Indonesia's largest private bank and frequently impersonated. The real BCA uses bca.co.id — 'bca-secure.com' is a fake domain. The phrase '1x24 jam' (literally 'one times 24 hours' — natural Indonesian idiom for 'within 24 hours') is authentic Indonesian phrasing that makes the message convincing to locals. Legitimate BCA security alerts are handled through the myBCA app only.",
        redFlags: [
            { text: "Fake domain — BCA uses bca.co.id, not bca-secure.com", correct: true },
            { text: "'1x24 jam' is an unusual time format that reveals a scam", correct: false },
            { text: "Indonesian banks never send SMS security alerts", correct: false },
            { text: "BCA's real customer service number is different from this one", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "SARS",
        senderNumber: "SARS",
        timestamp: "Today 9:14 AM",
        body: "SARS eFiling: Your OTP is 394827. Valid for 5 minutes. Do NOT share this OTP with anyone. SARS will NEVER ask for your OTP via phone, email, or SMS.",
        isPhish: false,
        explanation: "Legitimate! This South African Revenue Service OTP message follows the genuine SARS format: provides the code, gives a clear validity window, and crucially includes the explicit warning that SARS will 'NEVER ask for your OTP via phone, email, or SMS' — a specific anti-social-engineering statement only a real organisation would include. No link, no external request."
    },
    {
        type: 'sms',
        from: "e&",
        senderNumber: "eand",
        timestamp: "Today 6:00 AM",
        body: "e&: رصيدك الحالي 45.30 درهم. لإضافة رصيد أو تفعيل باقة، اتصل بـ 101 أو استخدم تطبيق My e&. لا تشارك بياناتك مع أي شخص.",
        isPhish: false,
        explanation: "Legitimate! This Arabic-language e& (formerly Etisalat, UAE) balance notification shows only your current credit balance and directs you to call 101 or use the official app. It contains no link, no urgency, and no request for personal details. The reminder 'لا تشارك بياناتك' (don't share your information) is a hallmark of genuine telecoms security messaging."
    },

    // ── ROUND 3: 18 MORE SCENARIOS ──

    // Emails
    {
        type: 'email',
        sender: "support@sberbank-bezopasnost.ru",
        recipient: "klient@example.ru",
        subject: "Ваша карта Сбербанка заблокирована",
        date: "пятница, 15 марта",
        body: "Уважаемый клиент,\n\nМы обнаружили подозрительную активность на вашей карте. В целях безопасности ваша карта была временно заблокирована.\n\nДля разблокировки необходимо подтвердить ваши данные в течение 24 часов:\n\nhttp://sberbank-bezopasnost.ru/razblokir\n\nС уважением,\nСлужба безопасности Сбербанка",
        isPhish: true,
        explanation: "Phishing! The real Sberbank uses sberbank.ru — 'sberbank-bezopasnost.ru' (безопасность = security) is a fake look-alike domain. Note: in Russian, days of the week and months are correctly written in lowercase, so 'пятница' is not a red flag. The fake domain and pressure to confirm card details within 24 hours are the real tells.",
        redFlags: [
            { text: "Fake domain — Sberbank uses sberbank.ru, not sberbank-bezopasnost.ru", correct: true },
            { text: "'пятница' should be capitalised — Russian days are always uppercase", correct: false },
            { text: "Russian banks never communicate with customers by email", correct: false },
            { text: "The greeting 'Уважаемый клиент' is too formal for Sberbank", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "security@alpha-bank-gr.com",
        recipient: "pelatis@example.gr",
        subject: "Σημαντική ειδοποίηση: Ο λογαριασμός σας έχει ανασταλεί",
        date: "Τρίτη, 12 Μαρτίου",
        body: "Αγαπητέ πελάτη,\n\nΕντοπίσαμε ύποπτη δραστηριότητα στον λογαριασμό σας. Για λόγους ασφαλείας, ο λογαριασμός σας έχει προσωρινά ανασταλεί.\n\nΠαρακαλούμε επαληθεύστε τα στοιχεία σας εντός 48 ωρών για να αποφύγετε μόνιμη απενεργοποίηση:\n\nhttp://alpha-bank-gr.com/verify\n\nΜε εκτίμηση,\nΤμήμα Ασφαλείας Alpha Bank",
        isPhish: true,
        explanation: "Phishing! Alpha Bank Greece uses alpha.gr — 'alpha-bank-gr.com' embeds the country code in the domain path, a pattern used by phishing campaigns worldwide to look official. The '48 ωρών' (48 hours) deadline and threat of 'μόνιμη απενεργοποίηση' (permanent deactivation) are urgency tactics. Legitimate Greek bank notices direct you to the official Alpha Web Banking portal.",
        redFlags: [
            { text: "Fake domain — Alpha Bank Greece uses alpha.gr, not alpha-bank-gr.com", correct: true },
            { text: "Greek bank security emails are always written in English", correct: false },
            { text: "The threat of permanent deactivation is always exaggerated", correct: false },
            { text: "'Αγαπητέ πελάτη' is too informal for a bank security notice", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "notificacion@sat-mx.com",
        recipient: "contribuyente@example.com.mx",
        subject: "SAT: Tiene una devolución de impuestos pendiente — $4,820 MXN",
        date: "lunes, 18 de marzo",
        body: "Estimado contribuyente,\n\nEl Servicio de Administración Tributaria (SAT) le informa que tiene una devolución de impuestos por $4,820.00 MXN pendiente de reclamar.\n\nPara recibir su devolución, ingrese sus datos bancarios en el siguiente enlace antes del 31 de marzo:\n\nhttp://sat-mx.com/devolucion\n\nAtentamente,\nServicio de Administración Tributaria\nSAT México",
        isPhish: true,
        explanation: "Phishing! Mexico's SAT (tax authority) uses sat.gob.mx — all Mexican government sites end in .gob.mx. 'sat-mx.com' is entirely fake. The real SAT processes refunds automatically to your registered bank account; it never emails asking you to input banking details via a link. The 'before March 31' deadline is a pressure tactic.",
        redFlags: [
            { text: "Fake domain — Mexican government sites use .gob.mx (sat.gob.mx)", correct: true },
            { text: "SAT refunds are always under $1,000 MXN", correct: false },
            { text: "Mexican government communications are always in English", correct: false },
            { text: "A March 31 deadline for a tax refund is suspicious", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "cskh@vpbank-security.com",
        recipient: "khachhang@example.vn",
        subject: "VPBank: Tài khoản của bạn đã bị tạm khóa",
        date: "Thứ Hai, 11 tháng 3",
        body: "Kính gửi Quý khách hàng,\n\nChúng tôi phát hiện hoạt động bất thường trên tài khoản của bạn. Để bảo vệ tài khoản, chúng tôi đã tạm thời khóa tài khoản của bạn.\n\nVui lòng xác minh thông tin trong vòng 24 giờ để tránh bị khóa vĩnh viễn:\n\nhttp://vpbank-security.com/xacminh\n\nTrân trọng,\nVPBank Dịch vụ Khách hàng",
        isPhish: true,
        explanation: "Phishing! VPBank's real domain is vpbank.com.vn — all legitimate Vietnamese bank domains use .com.vn or .vn. 'vpbank-security.com' is fake. The '24 giờ' (24 hours) deadline and threat of 'khóa vĩnh viễn' (permanent lock) follow the universal urgency template. Real VPBank security notices direct customers to the VPBank NEO app only.",
        redFlags: [
            { text: "Fake domain — VPBank uses vpbank.com.vn, not vpbank-security.com", correct: true },
            { text: "Vietnamese banks never send email security alerts", correct: false },
            { text: "'Kính gửi Quý khách hàng' is too formal for a bank security alert", correct: false },
            { text: "A 24-hour deadline is not used by legitimate Vietnamese banks", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "melding@nav-norge.com",
        recipient: "bruker@example.no",
        subject: "NAV: Du har en ubehandlet utbetaling",
        date: "mandag, 4. mars",
        body: "Hei,\n\nDu har en ubehandlet utbetaling på kr 2 340 fra NAV. For å motta betalingen må du bekrefte bankopplysningene dine innen 5 dager.\n\nKlikk her for å bekrefte:\nhttp://nav-norge.com/bekreft\n\nMed vennlig hilsen,\nNAV Utbetalingstjenesten",
        isPhish: true,
        explanation: "Phishing! Norway's NAV (labour and welfare administration) uses nav.no — 'nav-norge.com' is a fake domain. NAV payments are processed automatically to your registered Norwegian bank account via Altinn; NAV never emails asking you to 'confirm bank details' via a link. Note: in Norwegian, days ARE lowercase ('mandag' is correct) — not a tell here.",
        redFlags: [
            { text: "Fake domain — NAV uses nav.no, not nav-norge.com", correct: true },
            { text: "'mandag' should be capitalised in Norwegian", correct: false },
            { text: "Norwegian welfare payments are always higher than kr 2,340", correct: false },
            { text: "NAV only communicates in Bokmål, never Nynorsk", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "noreply@singpass-gov.com",
        recipient: "resident@example.sg",
        subject: "SingPass: Action Required — Verify Your Identity",
        date: "Wednesday, 6 March",
        body: "Dear SingPass User,\n\nWe have detected suspicious login attempts on your SingPass account. Your account has been temporarily suspended for security reasons.\n\nPlease verify your identity within 48 hours to restore access:\n\nhttp://singpass-gov.com/verify\n\nFailure to verify will result in permanent account deactivation.\n\nRegards,\nSingPass Security Team\nGovTech Singapore",
        isPhish: true,
        explanation: "Phishing! All Singapore government digital services use .gov.sg — the real SingPass is singpass.gov.sg. 'singpass-gov.com' is a fake domain designed to look official. The real SingPass sends notifications through the SingPass app, never via email with external links. GovTech Singapore would never threaten 'permanent account deactivation'.",
        redFlags: [
            { text: "Fake domain — Singapore government services always use .gov.sg", correct: true },
            { text: "SingPass emails are always in both English and Mandarin", correct: false },
            { text: "GovTech Singapore never threatens permanent deactivation", correct: false },
            { text: "The greeting 'Dear SingPass User' is too generic", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "refunds@ird-nz.com",
        recipient: "taxpayer@example.co.nz",
        subject: "Inland Revenue: Your Tax Refund of NZ$892 Is Ready",
        date: "Tuesday, 19 March",
        body: "Dear Taxpayer,\n\nFollowing our review of your tax returns, you are entitled to a refund of NZ$892.00.\n\nTo process your refund, please verify your banking details via the link below. Please action this within 7 days or the refund will be forfeited.\n\nhttp://ird-nz.com/refund/claim\n\nKind regards,\nInland Revenue Department\nTe Tari Taake",
        isPhish: true,
        explanation: "Phishing! New Zealand's Inland Revenue uses ird.govt.nz — all NZ government sites end in .govt.nz. 'ird-nz.com' is fake. The real IRD deposits refunds automatically to your bank account registered in myIR — it never emails asking you to 'verify banking details'. The Māori name 'Te Tari Taake' is included to look authentic, but the domain is conclusive.",
        redFlags: [
            { text: "Fake domain — NZ government sites use .govt.nz (ird.govt.nz)", correct: true },
            { text: "IRD refunds in New Zealand are always paid by cheque", correct: false },
            { text: "Including the Māori name 'Te Tari Taake' is a sign of a fake email", correct: false },
            { text: "A 7-day deadline is not how the IRD operates", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "seguranca@cgd-netbanking.pt",
        recipient: "cliente@example.pt",
        subject: "CGD: A sua conta foi temporariamente suspensa",
        date: "segunda-feira, 11 de março",
        body: "Exmo. Cliente,\n\nInformamos que a sua conta no Caixadirect foi temporariamente suspensa devido a atividade suspeita.\n\nPara reativar a sua conta, por favor confirme os seus dados de acesso nas próximas 24 horas:\n\nhttp://cgd-netbanking.pt/reativar\n\nCom os melhores cumprimentos,\nCaixa Geral de Depósitos — Segurança",
        isPhish: true,
        explanation: "Phishing! CGD (Caixa Geral de Depósitos), Portugal's largest state bank, uses cgd.pt — 'cgd-netbanking.pt' is a fake look-alike. Note: in Portuguese, days of the week are lowercase ('segunda-feira' is correct) — not a red flag. The European Portuguese formal style ('a sua', 'os seus') makes it sound authentic, but the fake domain is the decisive tell.",
        redFlags: [
            { text: "Fake domain — CGD uses cgd.pt, not cgd-netbanking.pt", correct: true },
            { text: "'segunda-feira' must be capitalised — Portuguese days are always uppercase", correct: false },
            { text: "European Portuguese formal style ('a sua') is a sign of inauthenticity", correct: false },
            { text: "Portuguese banks always write in both Portuguese and English", correct: false }
        ]
    },
    {
        type: 'email',
        sender: "nordea@nordea.fi",
        recipient: "asiakas@example.fi",
        subject: "Nordea: Kuukausittainen tiliotteesi on saatavilla",
        date: "Tiistai, 5. maaliskuuta",
        body: "Hei,\n\nKuukausittainen tiliotteesi on nyt saatavilla Nordea Verkkopankissa.\n\nKirjaudu sisään osoitteessa nordea.fi tai Nordea Mobile -sovelluksessa.\n\nYstävällisin terveisin,\nNordea Pankki Suomi",
        isPhish: false,
        explanation: "Legitimate! This Finnish Nordea bank notification uses the correct nordea.fi domain, contains no clickable link (it directs you to type nordea.fi yourself or open the app), and simply informs you that a document is available. It makes no requests, applies no urgency, and asks for no credentials."
    },

    // SMS
    {
        type: 'sms',
        from: "Госуслуги",
        senderNumber: "Gosuslugi",
        timestamp: "Today 3:42 PM",
        body: "Госуслуги: На ваш аккаунт зафиксирован подозрительный вход. Подтвердите личность в течение 2 часов: gosuslugi-proverka.ru/podtverdit",
        isPhish: true,
        explanation: "Smishing! Russia's official government services portal uses gosuslugi.ru — 'gosuslugi-proverka.ru' (proverka = verification) is a fake look-alike. This is one of Russia's most common smishing templates, targeting the millions of citizens registered on the portal. The 2-hour window is extreme urgency pressure. Real Gosuslugi verification is done through the app or official site only.",
        redFlags: [
            { text: "Fake domain — Gosuslugi uses gosuslugi.ru, not gosuslugi-proverka.ru", correct: true },
            { text: "'Госуслуги' is a misspelling of the official service name", correct: false },
            { text: "Russian government services never send SMS notifications", correct: false },
            { text: "A 2-hour deadline is always a sign of a phishing attempt", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "Viettel",
        senderNumber: "Viettel",
        timestamp: "Today 11:22 AM",
        body: "Viettel: Số điện thoại của bạn được tặng gói DATA 5GB miễn phí. Kích hoạt ngay trước 23:59 hôm nay: viettel-kuyenmai.com/kichhoat",
        isPhish: true,
        explanation: "Smishing! Viettel's real domain is viettel.vn — 'viettel-kuyenmai.com' is fake. The domain misspells 'khuyến mãi' (promotion) as 'kuyenmai' — dropping the 'kh' cluster, a subtle error native Vietnamese speakers would catch. Free data prize offers are the top mobile smishing lure in Vietnam, designed to be too tempting to verify.",
        redFlags: [
            { text: "Fake domain — Viettel uses viettel.vn, not viettel-kuyenmai.com", correct: true },
            { text: "'kuyenmai' misspells 'khuyến mãi' — a tell for non-Vietnamese writers", correct: false },
            { text: "Viettel never offers free data promotions to customers", correct: false },
            { text: "The same-day 23:59 deadline is always suspicious", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "GCash",
        senderNumber: "GCash",
        timestamp: "Today 2:05 PM",
        body: "GCash: Your account has been flagged for unusual activity. To avoid suspension, verify your GCash MPIN now: gcash-verify.info/secure",
        isPhish: true,
        explanation: "Smishing! GCash is the Philippines' dominant mobile wallet and a top smishing target. The real GCash uses gcash.com.ph — 'gcash-verify.info' is fake. Critically, GCash will NEVER ask for your MPIN (Mobile PIN) via SMS. Requesting a PIN — even appearing to come from GCash — is always fraud. No legitimate financial service asks for your secret PIN through any channel.",
        redFlags: [
            { text: "No legitimate service ever asks for your MPIN/PIN via SMS or any link", correct: true },
            { text: "GCash only uses gcash.com.ph — gcash-verify.info is a fake domain", correct: false },
            { text: "GCash only sends SMS messages in Filipino, never English", correct: false },
            { text: "The word 'flagged' is too technical for GCash communications", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "M-PESA",
        senderNumber: "MPESA",
        timestamp: "Today 9:33 AM",
        body: "M-PESA: Dear Customer, your account will be deactivated due to KYC non-compliance. Update your details immediately: mpesa-kyc.com/update or call *234#",
        isPhish: true,
        explanation: "Smishing! This contains two simultaneous fakes. Real M-Pesa (Safaricom Kenya) has no domain — KYC updates are done at Safaricom shops or the MySafaricom app, never via SMS links. The USSD code '*234#' is also fake — genuine M-Pesa is accessed via *334#. Spotting either the fake link domain OR the wrong USSD code is enough.",
        redFlags: [
            { text: "Wrong USSD code — real M-Pesa uses *334#, not *234#", correct: true },
            { text: "M-Pesa KYC is always completed in person at a Safaricom shop", correct: false },
            { text: "M-Pesa never sends SMS messages in English", correct: false },
            { text: "'Dear Customer' is too generic for an M-Pesa notification", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "Maybank",
        senderNumber: "Maybank2u",
        timestamp: "Today 4:17 PM",
        body: "Maybank: Akaun anda telah dihadkan kerana aktiviti mencurigakan. Sila sahkan maklumat anda dalam masa 24 jam: maybank2u-secure.com/sahkan",
        isPhish: true,
        explanation: "Smishing! Maybank's real online banking portal is maybank2u.com.my — 'maybank2u-secure.com' drops the Malaysian .my country code and appends 'secure', a classic fake domain trick. This Malay-language smishing targets Malaysian Maybank2u users. Real Maybank security alerts direct you to log in through the official MAE app only, never via SMS links.",
        redFlags: [
            { text: "Fake domain — Maybank uses maybank2u.com.my, not maybank2u-secure.com", correct: true },
            { text: "Maybank never sends SMS messages in Bahasa Malaysia", correct: false },
            { text: "'Akaun anda' is grammatically incorrect in formal Malay", correct: false },
            { text: "A 24-hour security deadline is not used by Malaysian banks", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "MobilePay",
        senderNumber: "MobilePay",
        timestamp: "Wed 10:14 AM",
        body: "MobilePay: Din konto er blevet midlertidigt begrænset pga. mistænkelig aktivitet. Bekræft din identitet: mobilepay-sikker.dk/bekraeft",
        isPhish: true,
        explanation: "Smishing! MobilePay's real domain is mobilepay.dk — 'mobilepay-sikker.dk' (sikker = secure) is a fake look-alike. MobilePay communicates through its app exclusively; it never sends identity confirmation links via SMS. This campaign is especially effective in Denmark where MobilePay is used by roughly 90% of the population for everyday payments.",
        redFlags: [
            { text: "Fake domain — MobilePay uses mobilepay.dk, not mobilepay-sikker.dk", correct: true },
            { text: "MobilePay only communicates through its app, never via SMS links", correct: false },
            { text: "'pga.' is an unusual abbreviation in a professional SMS", correct: false },
            { text: "Danish mobile payment services always write in English", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "HBL",
        senderNumber: "HBL Bank",
        timestamp: "Today 1:48 PM",
        body: "HBL: آپ کا اکاؤنٹ مشکوک سرگرمی کی وجہ سے بند کر دیا گیا ہے۔ 24 گھنٹوں میں تصدیق کریں: hbl-verify.com/account",
        isPhish: true,
        explanation: "Smishing! HBL (Habib Bank Limited) Pakistan uses hbl.com — 'hbl-verify.com' is a fake domain. This Urdu-script text reads: 'Your account has been closed due to suspicious activity. Verify within 24 hours.' The authentic Urdu script makes it highly convincing to Pakistani users, but the fake domain is conclusive. Real HBL security issues are resolved through the HBL Mobile app or by calling 111-425-111.",
        redFlags: [
            { text: "Fake domain — HBL Pakistan uses hbl.com, not hbl-verify.com", correct: true },
            { text: "Pakistani banks never send SMS messages in Urdu script", correct: false },
            { text: "HBL always writes security alerts in English only", correct: false },
            { text: "A 24-hour account closure notice is not how HBL operates", correct: false }
        ]
    },
    {
        type: 'sms',
        from: "GTBank",
        senderNumber: "GTBank",
        timestamp: "Today 10:02 AM",
        body: "GTBank: Your transaction OTP is 726451. Valid for 5 mins. GTBank will NEVER call or SMS you to request this OTP. Beware of fraudsters.",
        isPhish: false,
        explanation: "Legitimate! Guaranty Trust Bank (GTBank) Nigeria follows real OTP best practices: provides the code, gives a short validity window, and includes the explicit warning that GTBank will NEVER request your OTP by any channel. This anti-social-engineering statement — warning specifically about fraudsters who may call to request the code — is a hallmark of genuine Nigerian bank security communications."
    },
    {
        type: 'sms',
        from: "NZ Post",
        senderNumber: "NZPost",
        timestamp: "Today 7:55 AM",
        body: "NZ Post: Your parcel NZP993847261 is out for delivery today. Track at nzpost.co.nz/track",
        isPhish: false,
        explanation: "Legitimate! Real NZ Post delivery notifications include a valid tracking number and link only to nzpost.co.nz — New Zealand's official postal service domain. There is no payment request, no urgency, and no request for personal information. This is exactly how a legitimate delivery notification should look."
    }
];

// --- State ---
let currentIndex        = 0;
let score               = 0;
let streak              = 0;
let gameState           = 'classify';
let teamId              = null;
let teamName            = null;
let shuffledMessages    = [];
let lastSubmittedScore  = 0;   // tracks what has already been posted to the server

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Always reference the active (shuffled) message via this helper */
function currentMsg() { return shuffledMessages[currentIndex]; }

/** Detect right-to-left scripts (Arabic, Urdu, Hebrew, Persian, etc.) */
function isRTL(text) {
    return /[֑-߿‏‫יִ-﷽ﹰ-ﻼ]/.test(text);
}

// --- Session persistence (localStorage) ---
const SESSION_KEY = 'phishcatchers_session';

function saveSession() {
    if (!teamId) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        teamId, teamName, currentIndex, score, streak, lastSubmittedScore,
        messageOrder: shuffledMessages.map(m => messages.indexOf(m))
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
        if (saved && saved.teamId === data.id && saved.currentIndex > 0
                && saved.messageOrder && saved.currentIndex < saved.messageOrder.length) {
            showResumePrompt(saved);
        } else {
            shuffledMessages = shuffle([...messages]);
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
        `You left off at challenge ${saved.currentIndex + 1} of ${saved.messageOrder.length} with ${saved.score} points.`;
    document.getElementById('resume-modal').classList.remove('hidden');
}

document.getElementById('btn-resume').addEventListener('click', () => {
    const saved = loadSession();
    currentIndex       = saved.currentIndex;
    score              = saved.score;
    streak             = saved.streak || 0;
    lastSubmittedScore = saved.lastSubmittedScore || 0;
    shuffledMessages   = saved.messageOrder.map(i => messages[i]);
    updateScore();
    document.getElementById('resume-modal').classList.add('hidden');
    loadMessage();
});

document.getElementById('btn-start-fresh').addEventListener('click', () => {
    clearSession();
    shuffledMessages = shuffle([...messages]);
    document.getElementById('resume-modal').classList.add('hidden');
    loadMessage();
});

// --- Save & Quit ---

document.getElementById('btn-save-quit').addEventListener('click', async () => {
    // Show a saving indicator immediately
    const main = document.querySelector('main');
    const progressBar = document.getElementById('progress-bar');
    const pct = Math.round(currentIndex / shuffledMessages.length * 100);

    main.innerHTML = `
        <div class="game-over">
            <div class="game-over-icon">💾</div>
            <h2>Saving…</h2>
            <p style="text-align:center;color:#555">Posting your score to the leaderboard…</p>
        </div>
    `;
    progressBar.style.width = pct + '%';

    // Submit points earned since last save (avoid double-counting on resume)
    const newPoints = score - lastSubmittedScore;
    let teamTotal = score;
    if (teamId !== null && newPoints > 0) {
        try {
            const result = await submitScore(teamId, newPoints);
            lastSubmittedScore = score;
            teamTotal = result.total_score;
        } catch { /* server may be unreachable — continue to save locally */ }
    }

    // Persist to localStorage so the game can be resumed
    saveSession();

    main.innerHTML = `
        <div class="game-over">
            <div class="game-over-icon">💾</div>
            <h2>Progress Saved!</h2>
            <p style="text-align:center;color:#555;margin-bottom:20px;line-height:1.6">
                Come back and enter <strong>"${escapeHtml(teamName)}"</strong><br>
                to pick up right where you left off.
            </p>
            <div class="score-breakdown">
                <div class="breakdown-row"><span>Challenge</span><span>${currentIndex + 1} / ${shuffledMessages.length}</span></div>
                <div class="breakdown-row"><span>Score so far</span><span>${score}</span></div>
                <div class="breakdown-row"><span>Team total</span><span>${teamTotal}</span></div>
                <div class="breakdown-row"><span>Team</span><span>${escapeHtml(teamName)}</span></div>
            </div>
            <button class="btn btn-next" style="margin-top:20px" onclick="location.reload()">Back to Start</button>
        </div>
    `;
    progressBar.style.width = pct + '%';
});

// --- Core game logic ---

function loadMessage() {
    const msg = currentMsg();
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
        const smsBodyEl = document.getElementById('sms-body');
        smsBodyEl.textContent = msg.body;
        smsBodyEl.dir = isRTL(msg.body) ? 'rtl' : 'ltr';
    }

    document.getElementById('level').textContent = currentIndex + 1;
    document.getElementById('total').textContent = shuffledMessages.length;
    updateProgressBar();
    updateStreakDisplay();
}

function handleGuess(isGuessPhish) {
    if (gameState !== 'classify') return;
    gameState = 'waiting';
    btnLegit.disabled = true;
    btnPhish.disabled = true;

    const msg       = currentMsg();
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
    document.getElementById('feedback-message').textContent = currentMsg().explanation;
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
        (currentIndex / shuffledMessages.length * 100) + '%';
}

document.getElementById('btn-legit').addEventListener('click', () => handleGuess(false));
document.getElementById('btn-phish').addEventListener('click', () => handleGuess(true));

document.getElementById('btn-next').addEventListener('click', () => {
    feedbackModal.classList.add('hidden');
    currentIndex++;
    if (currentIndex < shuffledMessages.length) {
        saveSession();   // auto-save after every challenge
        loadMessage();
    } else {
        clearSession();  // finished naturally — no need to resume
        showGameOver();
    }
});

// --- Game over ---

async function showGameOver() {
    const phishWithFlags = shuffledMessages.filter(m => m.isPhish && m.redFlags).length;
    const maxScore = shuffledMessages.length * 100 + phishWithFlags * 50;
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
                <div class="breakdown-row"><span>Challenges analysed</span><span>${shuffledMessages.length}</span></div>
                <div class="breakdown-row"><span>Emails</span><span>${shuffledMessages.filter(m => m.type === 'email').length}</span></div>
                <div class="breakdown-row"><span>SMS / Smishing</span><span>${shuffledMessages.filter(m => m.type === 'sms').length}</span></div>
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

    // Submit only the points not yet sent (prevents double-counting after Save & Quit)
    const newPoints = score - lastSubmittedScore;
    if (teamId !== null) {
        try {
            const result = await submitScore(teamId, newPoints > 0 ? newPoints : 0);
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
