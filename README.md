# FahadFit 💪

Your personal workout tracker — built for the **103kg → 80kg** journey (customizable in-app).

Cycle sessions, 30 home workout programs, exercise GIF guides, Coach Maya voice cues, and lifetime free JSON storage on your device. Works offline at the gym.

## Features

- **Dashboard** — Weight progress ring, streak counter, BMI, calorie targets, weekly stats, quick-start today’s workout
- **Profile & Settings** — Settings tab: name, current/start/target weight, height, journey start date; export/import JSON backup
- **Coach Maya** — Female voice coach with per-exercise form cues, animated coach panel, and profile-aware motivation
- **Cycle Tracker** — Timer or manual duration; auto-pauses when the app goes to background
- **Home Workouts** — **30 programs** across 8 weeks, 7-day rotation, progressive difficulty, animated GIF demos, built-in timer
- **Workout swap** — Swap today’s session with another day in the same week
- **Rest panel** — Dedicated “Rest & Breathe” UI with breathing orb, next exercise preview, +15/+30 sec, and Back to undo accidental skips
- **History** — Calendar view, weight trend chart, session log
- **Offline / PWA** — Built Tailwind CSS, local fonts, and service worker cache the full app shell offline (exercise GIFs cache after first view)
- **Accessibility** — Respects `prefers-reduced-motion` to tone down coach and breathing animations
- **Data** — Everything stored in browser localStorage as JSON; export/import for backup

## Development

Styles are compiled locally (no Tailwind CDN at runtime):

```bash
npm install
npm run build
```

Run `npm run build` after changing classes in `index.html`/`js/` or updating fonts. Commit `css/tailwind.css` and `css/fonts/` for GitHub Pages.

Serve locally:

```bash
python3 -m http.server 8000
```

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `fahad-fit`)
2. Build CSS and push:

```bash
cd "/Users/fahadnadeem/Desktop/workout tracker"
npm install && npm run build
git init
git add .
git commit -m "Initial FahadFit workout tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fahad-fit.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Source: Deploy from branch → main → / (root) → Save**
4. Open `https://YOUR_USERNAME.github.io/fahad-fit/`

## iPhone (Safari)

Works in **Safari** and is best as a **Home Screen app**:

1. Open the site in Safari
2. Tap **Share → Add to Home Screen**
3. Launch from the icon — full screen, offline cache, no browser chrome

**Safari tips:**
- Tap **Start Workout** once so Coach Maya audio unlocks (iOS requires a tap before speech)
- Open each workout once on Wi‑Fi so exercise GIFs cache for the gym
- Log weight in **Settings → Current weight** each morning

Web push notifications are **not reliable in iPhone Safari**, so the app does not include them.

## Daily Routine Suggestion

| Day | Activity |
|-----|----------|
| Mon | Home Workout (Leg Day) |
| Tue | Cycle 45–50 min |
| Wed | Home Workout (Upper Body) |
| Thu | Cycle 40–45 min |
| Fri | Home Workout (HIIT) |
| Sat | Home Workout (Full Body) |
| Sun | Cycle or rest |

Adjust based on how you feel. Consistency beats perfection.

## Weight Loss Tips (103 → 80kg)

- Aim for **~750 kcal daily deficit** (shown on dashboard)
- Target **0.7–1 kg/week** — sustainable and effective
- Combine cycle (steady burn) + home workout (muscle + HIIT)
- Log weight **every morning** in **Settings → Current weight**
- Export JSON weekly as backup

---

Built with HTML, Tailwind CSS (built locally), and vanilla JS. No backend. No subscriptions. Yours forever.
