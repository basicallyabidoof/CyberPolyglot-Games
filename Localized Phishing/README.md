# Phish Catchers: Localized Edition

## Purpose
**Phish Catchers: Localized Edition** is an interactive, browser-based educational game designed to train users in the art of **Cultural Social Engineering**. 

While many anti-phishing training programs focus on generic red flags (like mismatched URLs or urgent requests), this project emphasizes the cultural, regional, and linguistic nuances that attackers exploit. By analyzing hyper-localized phishing lures, players learn to spot:
* **ESL (English as a Second Language) Phrasing Patterns:** Subtle syntax errors, such as using "Dear Mr. [First Name]", leaving days of the week uncapitalized, or awkward phrases like "receive your approval" instead of "hear back from you."
* **Regional Authorities:** Spoofed emails impersonating local government entities, tax agencies (e.g., HMRC in the UK, CRA in Canada, ATO in Australia), or local service providers.
* **Cultural Slang and Markers:** Inappropriate or unnatural use of local expressions that native speakers would easily recognize as fraudulent.

## How to Run
This is a lightweight, client-side web application. No servers or dependencies are required.

1. Clone or download this repository.
2. Navigate to the `Localized Phishing` directory.
3. Double-click the `index.html` file to open it in your default web browser.
4. Read the emails presented and click **Legitimate** or **Phishing** based on the cultural markers you spot!

## Call for Open Source Contributors
We need your help to make this game a truly global educational resource! Cyber criminals localize their attacks for every region, and we want our training to reflect that reality.

We are actively seeking contributors to create new simulated phishing messages (and legitimate control messages) in their **local languages** and incorporating **local references**.

### How to Contribute
1. Fork this repository.
2. Open `script.js` and locate the `emails` array.
3. Add a new object to the array following this structure:
   ```javascript
   {
       sender: "suspicious-or-legit@domain.com",
       recipient: "victim@example.com",
       subject: "Your localized subject line here",
       date: "day, DD Mon",
       body: "The content of your email. Use \n\n for line breaks.",
       isPhish: true, // true if it's a phishing attempt, false if it's a legitimate control email
       explanation: "Explain the cultural markers, ESL patterns, or regional authority spoofing that gives this away as a phish (or why it's legitimate)."
   }
   ```
4. **Be creative!** Use your local tax agencies, popular regional banks, or common slang from your country.
5. Submit a Pull Request with a brief explanation of the cultural context you've added.

Together, we can build a comprehensive database of hyper-localized social engineering attacks to better educate and protect users worldwide.
