
# Google Calendar Habit Streak

Track your daily habits with Google Calendar events. Automatically counts streaks, tracks your personal best, sends weekly summaries, and supports RESET/SKIP days.

## Quick Setup

1. Open [Google Apps Script](https://script.google.com)
2. Paste the `script.js` code
3. Configure your habits in the `CONFIG` section
4. Run `setupTriggers()` once to set up triggers
5. Done! Events will be created daily at 1 AM

## How It Works

- Creates one all-day event per habit each day
- Counts consecutive days automatically, tracks your best streak
- Add a "RESET" or "SKIP" all-day event to reset / pause your streak
- If yesterday had no habit event, the streak auto-resets (toggle with `autoResetOnGap`)
- Sends weekly summary emails on Mondays with current + best streak per habit
- Everything runs in your Google account

## Configuration

Each habit picks its message flavor via `acceptTags`:

```js
{ id: "exercise", name: "Daily Exercise", startDate: "2024-12-01",
  acceptTags: ['any', 'growth'], enabled: true }
```

A message is shown if any of its tags matches the habit's `acceptTags`. Built-in tags:

- `any` — generic encouragement, fits any habit
- `growth` — plant/build metaphors (some also tagged `any`, so they leak into generic habits)
- `sobriety` — first-person recovery voice; doesn't leak into other habits
- `minimal` — wordless emoji markers

Mix tags freely. To add flavors, drop new messages into `MESSAGES` with whatever tags you want — no other wiring needed. For a fully custom message pool on one habit, set `customMessages: ['...', '...']`; that overrides the tag pool.

Global flags (under `CONFIG`):

- `enableResetByEvent`, `enableSkipByEvent` — honor RESET/SKIP sentinel events
- `autoResetOnGap` — reset streak to 1 if yesterday's event is missing
- `enableLogging` — verbose console logs
- `maxCounterDays` — safety cap on counter values

## Features

- Multiple habits with shared, tag-based message pools
- Auto-generated milestones (day 1, weeks 1–4, months 1–6, years, 100/1000 marks)
- Current + best streak tracking
- Weekly email summary (current/best streak, tracked/missed days, reset/skip counts)
- RESET / SKIP sentinel events
- Gap detection — missed days auto-break the streak
- No external dependencies

## License

MIT
