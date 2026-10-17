
# Google Calendar Habit Streak

[![License: Lagom](https://img.shields.io/badge/license-lagom-9E2B25)](https://klppl.github.io/lagom-license/)

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
- Add `[RESET]` to a generated habit event so the following day restarts at Day 1
- Or add a separate all-day event titled exactly `RESET` to reset every enabled habit
- RESET markers remain in Calendar as an audit trail
- Add a separate `SKIP` all-day event to pause the counter for that day
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

- `enableResetByEvent`, `enableSkipByEvent` — honor RESET/SKIP control markers
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

## Resetting a streak

To reset one habit, edit today's generated all-day event and add `[RESET]` to
its title or description. That event marks the break and is not Day 1. The next
calendar day starts the new streak at Day 1, followed by Day 2. You can also
mark yesterday's event before today's daily run. The marker is kept so you can
see where and why the streak restarted.

To reset all enabled habits at once, create a separate all-day event whose title
is exactly `RESET`. You can run `createDailyHabitEvent()` manually after editing
today's event, or let the next scheduled run process it.

Use the bracketed spelling `[RESET]` to make the intent visually clear. Matching
is case-insensitive, so `RESET` and `[reset]` also work. Words such as
`resetting` do not trigger a reset.

The automatic daily job inspects today and yesterday. If you add `[RESET]` to
an older historical event, temporarily move the marker to today's event (or
adjust the later event titles manually); historical rebuilding is intentionally
not performed during every daily run to avoid scanning and rewriting the whole
calendar.

## License

MIT
