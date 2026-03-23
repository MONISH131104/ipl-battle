# IPL Prediction Battle 2026 🏏🔥
## Real-time group cricket prediction game — 100% free forever

---

## What's new in v2
- ✅ **Real-time Firebase backend** — all friends see the same data instantly
- 🎉 **Leaderboard popup** — when admin saves a result, an animated leaderboard pops up for EVERYONE simultaneously
- 📅 **IPL 2026 schedule pre-loaded** — all 20 announced matches already in the app
- 🎯 **Weighted points** — Winner=2pts, MOTM=2pts, all others=1pt
- 📊 **Split innings scoring** — 1st innings and 2nd innings tracked separately

---

## STEP 1 — Set up Firebase (10 minutes, completely free)

### 1.1 Create Firebase project
1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `ipl-prediction-battle`
4. Disable Google Analytics (not needed) → **Create project**

### 1.2 Create Firestore database
1. In left sidebar → **Firestore Database** → **Create database**
2. Choose **"Start in test mode"** → Next
3. Pick any location (e.g. `asia-south1` for India) → **Enable**

### 1.3 Get your config
1. In Project Overview → click **"</> Web"** icon (Add a web app)
2. App nickname: `ipl-battle` → **Register app**
3. You'll see a `firebaseConfig` object — copy it

### 1.4 Paste config into the app
Open `src/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← paste your values here
  authDomain: "ipl-battle-xxx.firebaseapp.com",
  projectId: "ipl-battle-xxx",
  storageBucket: "ipl-battle-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

---

## STEP 2 — Run locally

```powershell
cd ipl-battle-v2
npm install
npm start
```

Opens at http://localhost:3000 — you'll see the app. All data syncs via Firebase!

---

## STEP 3 — Deploy to GitHub Pages (free)

### 3.1 Update homepage in package.json
Open `package.json` and change:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/ipl-prediction-battle"
```

### 3.2 Create GitHub repo
1. Go to **github.com** → New repository
2. Name: `ipl-prediction-battle`
3. **Public** → Create (don't add README)

### 3.3 Push and deploy
```powershell
git init
git add .
git commit -m "IPL Battle 2026"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ipl-prediction-battle.git
git push -u origin main
npm run deploy
```

### 3.4 Enable Pages
1. GitHub repo → **Settings** → **Pages**
2. Source: **gh-pages** branch → **Save**
3. Your app is live at: `https://YOUR_USERNAME.github.io/ipl-prediction-battle`

📲 **Share this URL on your group WhatsApp!**

---

## STEP 4 — Add Firebase security rules (optional but recommended)

In Firebase Console → Firestore → **Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Open for your group
    }
  }
}
```

This keeps it open for your group. Since the URL is only shared with friends, this is fine.

---

## How it works (for your group)

### Admin (you):
1. Open app → Admin tab → password: `ipl2026`
2. All IPL 2026 first 20 matches are already loaded
3. Add new matches as BCCI announces the rest of the schedule
4. After each match → Admin → Enter Result
5. 🎉 **The moment you save, everyone's app shows a leaderboard popup with updated scores**

### Friends:
1. Open the GitHub Pages URL
2. Enter name + same Group Code (e.g. "RooftopXI")
3. Click Predict on any upcoming match
4. Lock in 8 predictions (with optional stakes)
5. Results and leaderboard update automatically — no refresh needed

---

## Scoring System

| Prediction | Points |
|---|---|
| Match Winner ✓ | **2 pts** |
| Man of the Match ✓ | **2 pts** |
| Top Scorer ✓ | 1 pt |
| Top Wicket Taker ✓ | 1 pt |
| 1st Innings Score Range ✓ | 1 pt |
| 2nd Innings Score Range ✓ | 1 pt |
| Most Sixes Player ✓ | 1 pt |
| Highest Partnership Range ✓ | 1 pt |
| **Max per match** | **10 pts** |
| **Season Points** | **pts × 10** |

### Score Ranges
**1st Innings:** Under 140 / 140–159 / 160–179 / 180–199 / 200–219 / 220–239 / 240+
**2nd Innings:** Under 130 / 130–149 / 150–169 / 170–189 / 190–209 / 210–229 / 230+
**Partnership:** Under 50 / 50–74 / 75–99 / 100–124 / 125–149 / 150+

---

## Firebase Free Tier Limits
- **Storage**: 1 GB (more than enough for the whole season)
- **Reads**: 50,000/day (your group won't come close)
- **Writes**: 20,000/day (safe even with active predictions)
- **Real-time connections**: Unlimited
- **Cost**: ₹0 forever for this use case

---

## Customization

### Change admin password
Open `src/data.js` → change `ADMIN_PASSWORD`

### Adding more matches (rest of IPL 2026 schedule)
Admin tab → Add Match — automatically syncs to all players instantly

### Change group name
Players just need to use the same Group Code when joining
