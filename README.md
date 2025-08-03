
# Google Calendar Habit Streak

Track your daily habits with Google Calendar events. Automatically counts streaks, sends weekly summaries, and supports RESET/SKIP days.

## Quick Setup

1. Open [Google Apps Script](https://script.google.com)
2. Paste the `script.js` code
3. Configure your habits in the `CONFIG` section
4. Run `setupTriggers()` once to set up triggers
5. Done! Events will be created daily at 1 AM

## How It Works

- Creates one all-day event per habit each day
- Counts consecutive days automatically  
- Add a "RESET" or "SKIP" event to reset/continue your streak
- Sends weekly summary emails on Mondays
- Everything runs in your Google account

## Configuration

Edit the habits in the script:

```js
{ id: "exercise", name: "Daily Exercise", startDate: "2024-12-01", 
  theme: "growth", enabled: true }
```

## Features

- Multiple habits supported
- Motivational messages and milestones
- Weekly email summaries
- RESET/SKIP functionality
- No external dependencies

## License

MIT
