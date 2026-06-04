# DailyStack — Project Summary

**GitHub:** https://github.com/mattobryan/dailystack  
**Date:** 2026-06-04  
**Status:** Live & deployed

---

## What It Is

DailyStack is a fully interactive, offline-first habit and life tracker built as a self-contained HTML/JSX app. No build tools, no server required — open `dailystack/DailyStack.html` in any browser and it works. Designed to run on an 11" tablet served from Termux, and responsive down to iOS and Android phones.

---

## Features Built

### Core Tracking
- **Monthly habit grid** — week-banded checkbox grid with colour-coded weeks (5-colour palette), today highlight, and missed-reminder cells shown as dashed/greyed
- **Week-by-week view** — on phone widths, the grid switches to a focused single-week display with ‹/› navigation and large tap targets
- **localStorage persistence** — all data saved offline, works under Termux with no internet

### New Features Added
- **Time-gated reminders** — "Are you up?" nudge fires before a habit's deadline (e.g. 6:55 for a 7AM habit). Not confirmed → cell greys out as missed. Confirmed → asks what time you woke, logs it
- **SMART goal wizard** — every goal is shaped through 5 steps: Specific · Measurable · Achievable · Realistic · Time-bound, with a duration picker and inline habit creator
- **Metric check-ins** — ticking Water asks for litres, Exercise asks for km, Deep Work asks for hours — a quick stepper/slider per habit type
- **One-page analytics** — KPI strip (30-day average, best streak, active habits, logged days), habit completion bars with streak flames, weekly breakdown chart, 30-day trend line, mood distribution
- **First-run onboarding** — goal selection screen on first launch; picking a goal installs both the goal and its habits into the tracker automatically

### Design & Theming
- **Typography** — Anthropic Serif (`'Anthropic Serif', 'Newsreader', Georgia, serif`) for display headings; Outfit for UI
- **5 accent colour variants** — Indigo, Teal, Pink, Green, Amber (live Tweaks panel)
- **Dark / Light mode** — full parity across every surface, toggle in header or Tweaks panel
- **Live Tweaks panel** — floating panel that relays theme changes into all device frames in real time

### Mobile Experience
- **Native phone shell** — serif header with wordmark + today-ring + bell + theme toggle
- **Fixed bottom tab bar** — Week · Insights · Today · Goals with accent active state
- **Per-platform safe areas** — iOS gets extra bottom padding for home indicator; Android gets gesture-nav inset
- **Responsive stacking** — Insights and Today panels reflow to single-column on narrow screens

### Device Showcase (`DailyStack.html`)
- **11" tablet frame** (landscape, scales to fit the browser window)
- **iOS phone frame** — Dynamic Island, status bar, home indicator
- **Android phone frame** — punch-hole camera, gesture nav bar
- **Colourful progress chart** — completion rings by area (Body/Work/Mind/Spirit) + 14-day colour-coded column chart

---

## File Structure

```
dailystack/
├── DailyStack.html      # Showcase page — open this in a browser
├── app.html             # Full standalone app (also linked from showcase)
├── data.jsx             # Data layer: theme tokens, habits, goals, storage helpers
├── showcase.jsx         # Showcase layout, device frames, progress chart, Tweaks
├── tweaks-panel.jsx     # Reusable Tweaks panel + form controls
├── app-main.jsx         # Root app: tabs, theme, reminders, persistence
├── grid.jsx             # Monthly GridPanel + WeekGrid (phone view)
├── analysis.jsx         # One-page analytics dashboard
├── trackers.jsx         # Daily trackers: mood, water, sleep, Pomodoro, gratitude
├── goals.jsx            # GoalsPanel + SMART goal wizard (NewGoalForm)
├── onboarding.jsx       # First-run goal selection screen
├── reminders.jsx        # ReminderModal + CheckinReviewModal + dueReminders()
├── ios-frame.jsx        # iOS device bezel component
└── android-frame.jsx    # Android device bezel component

push.sh                  # One-liner deploy script
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI framework | React 18 (via CDN, no build step) |
| Language | JSX compiled in-browser by Babel standalone |
| Fonts | Newsreader (Google Fonts) + Outfit |
| Storage | localStorage (offline-first) |
| Hosting | Static files — Termux, any web server, or GitHub Pages |

---

## URL Parameters (for testing/showcase)

| Param | Effect |
|---|---|
| `?tab=analysis` | Open directly to the Analysis tab |
| `?mobile=1` | Force mobile shell at any viewport width |
| `?week=1` | Force week-by-week grid view |
| `?onboard=1` | Force first-run onboarding screen |
| `?demo=reminder` | Fire a reminder nudge on load |
| `?mode=light` | Start in light mode |
| `?accent=00B4CC` | Set accent colour (hex, no #) |
| `?platform=ios` | Apply iOS safe-area insets |
| `?platform=android` | Apply Android safe-area insets |
| `?autoremind=0` | Disable reminder polling (for screenshot/showcase) |

---

## How to Update

**Via Claude Code (recommended):**  
Describe the change, Claude edits the files, then run:
```bash
./push.sh "describe your change"
```

**Manually:**  
Edit any `.jsx` or `.html` file, then:
```bash
./push.sh "describe your change"
```

`push.sh` runs `git add -A && git commit && git push` in one step. If no message is given, it timestamps the commit automatically.

---

## Habits Tracked (Built-in)

| Habit | Category | Reminder | Metric |
|---|---|---|---|
| Bed by Midnight | Body | 00:00 | — |
| Wake by 7AM | Body | 07:00 | Wake time logged |
| Deep Work Block | Work | — | Hours |
| Job Applications | Work | — | Count |
| Exercise | Body | — | km |
| Water Intake | Body | — | Litres |
| No-Phone Morning | Mind | 09:00 | — |
| Sabbath Prep | Spirit | — | Fridays only |
| Weekly Review | Mind | — | Fridays only |

Custom habits can be added via the Goals wizard or onboarding flow and appear in the grid immediately.
