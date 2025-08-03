
# Google Calendar Habit Streak (Apps Script)

Track your habits with **one all‑day event per day** right in Google Calendar.  
The script counts consecutive days, rotates motivational messages, supports **RESET** and **SKIP** days (now applied **once for ALL habits**, bug‑free!), and emails you a Monday‑morning summary.

> **Everything runs in your Google account** – no external servers or APIs.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| Multiple habits | Configure as many as you like in `CONFIG.habits`. |
| Automatic daily events | Idempotent – won’t create duplicates. |
| Back‑fill first run | First execution sets counter to `days since startDate + 1`. |
| RESET / SKIP | Add an all‑day event titled **RESET** or **SKIP** to today – now processed once and applied to every enabled habit. |
| Themes & Milestones | `general`, `growth`, `sobriety`, `minimal`, or your own `custom` messages + milestone call‑outs (1, 7, 30, 365 …). |
| Weekly summary email | Monday 08:00 (script TZ) – tracked vs. missed days, current streaks, list of titles. |
| Spreadsheet menu | If the script is bound to a Google Sheet you get a **Habit Streak** menu for quick manual runs. |
| Persistent counters | Stored in **Script Properties** as `HABIT_COUNTER_<id>`. |

---

## 🏎️ Quick Start

1. **Create/choose a calendar** named **“Habits”** (or edit `CONFIG.calendarName`).
2. **Open Apps Script**  
   - *Option A*: From a Google Sheet → **Extensions → Apps Script** (to get the custom menu).  
   - *Option B*: Stand‑alone at <https://script.google.com>.
3. **Paste `Code.gs`** (this script) into the editor.
4. **Set time zone** → *Project Settings → Time zone* (e.g., **Europe/Stockholm**).
5. **Configure habits** in the `CONFIG` block.

```js
{ id: "exercise", name: "Daily Exercise", startDate: "2024-12-01",
  theme: "growth", enabled: true }
```

6. **Run `onOpen`** once → grant permissions.  
   This installs:
   - a **daily trigger** at 01:00 for `createDailyHabitEvent`
   - a **weekly trigger** at 08:00 Monday for `sendWeeklySummary`
   - (Sheet‑bound) the **Habit Streak** menu.
7. Click **Habit Streak → Create Today’s Event** (or wait for the trigger) → check your calendar!

---

## 🔄 Daily Logic

1. Detect **RESET**/**SKIP** (once) → delete those marker events.
2. For each **enabled** habit  
   - Skip if today’s event already exists (tag `[habit:<id>]`).  
   - Determine counter:  
     - **RESET** → 1  
     - **SKIP** → keep yesterday’s count  
     - else increment (or back‑fill on first run).  
   - Create event:  
     ```
     <Habit Name> - Day <N> – <message>
     ```
3. Store new counters in batch.

---

## 🎨 Themes & Custom Messages

- `general`, `growth`, `sobriety`, `minimal` — see `HABIT_THEMES`.
- `custom` → add `customMessages: ["Msg 1", "Msg 2", …]` in that habit.
- Non‑milestone days cycle through the theme list (`(day‑1) % messages.length`).

---

## 📧 Weekly Summary Email

- Runs every Monday 08:00 (script TZ).
- Email includes per‑habit tracked/missed, current streak, total resets/skips, and all titles.

Change the schedule in `ensureWeeklyTrigger()` if needed.

---

## 🛠️ Common Helpers

```js
// Enable/disable during runtime
setHabitEnabled('reading', true);

// Manually reset a counter
resetCounterForHabit('exercise', 0);

// Change theme without editing code
changeThemeForHabit('sobriety', 'minimal');

// List available calendars
Logger.log(getAvailableCalendarNames());
```

---

## 🐞 Troubleshooting

| Issue | Fix |
|-------|-----|
| No events created | Check that habit is `enabled:true` and triggers are installed (View → Triggers). |
| “Calendar not found” | Create/rename calendar or change `CONFIG.calendarName`. |
| RESET/SKIP ignored | Ensure it’s **all‑day**, titled exactly `RESET`/`SKIP`, and in the **same calendar**. |
| Weekly email missing | Verify the trigger and check spam. |
| Wrong dates | Set the project time zone correctly. |

---

## 🔐 Permissions

- **Calendar** – read/write events  
- **Properties** – save counters  
- **Mail** – send summary  
- **Spreadsheet UI** (optional) – show custom menu

All data stays inside your Google account.

---

## 🗑️ Uninstall

1. Delete triggers (`createDailyHabitEvent`, `sendWeeklySummary`) in Apps Script → **Triggers**.
2. Remove or archive the Apps Script project.
3. Delete the **Habits** calendar if desired.

---

## ♥️ License

MIT – do what you want, just don’t blame me if your streak breaks 😉