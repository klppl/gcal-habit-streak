# Google Calendar Habit Streak Tracker

A Google Apps Script that automatically creates daily habit tracking events in Google Calendar with customizable themes and messages.

## Features

- **Multi-Habit Support**: Track multiple habits simultaneously with different start dates
- **Customizable Themes**: Choose from general, growth, sobriety, minimal, or custom themes
- **Automatic Daily Events**: Creates calendar events for each habit every day
- **Streak Tracking**: Maintains individual counters for each habit
- **Reset/Skip Support**: Add "RESET" or "SKIP" events to control tracking
- **Weekly Summaries**: Receive email summaries of your progress
- **Milestone Messages**: Special messages for significant streak milestones

## Setup

1. **Create a Google Apps Script project**:
   - Go to [script.google.com](https://script.google.com)
   - Create a new project
   - Copy the contents of `script.js` into the editor

2. **Configure your habits**:
   Edit the `CONFIG` object in the script:

```javascript
const CONFIG = {
  calendarName: "Habits",              // Name of your calendar
  habits: [                            // Array of habits to track
    {
      id: "exercise",                   // Unique identifier
      name: "Daily Exercise",           // Display name
      startDate: "2024-12-01",         // When you started (YYYY-MM-DD format)
      manualCounter: null,              // Set to override counter, or null for auto
      theme: "growth",                  // Theme: general, growth, sobriety, minimal, custom
      customMessages: [],               // Custom messages for "custom" theme
      enabled: true                     // Whether this habit is active
    },
    {
      id: "reading",
      name: "Reading",
      startDate: "2024-11-15",
      manualCounter: null,
      theme: "general",
      customMessages: [],
      enabled: true
    }
  ],
  enableResetByEvent: true,            // Enable RESET detection
  enableSkipByEvent: true,             // Enable SKIP detection
  enableLogging: true,                 // Enable console logging
  maxCounterDays: 10000               // Safety limit
};
```

3. **Set up triggers**:
   - Run the `onOpen()` function once to set up the menu
   - The script will automatically create daily triggers

## How Start Dates Work

The `startDate` is now functional! When you first run the script for a habit:

- **If you set a past start date**: The counter will calculate how many days have passed since that date
  - Example: If you started on "2024-12-01" and today is "2024-12-15", your counter will start at 15
- **If you set today's date**: The counter will start at 1
- **If you set a future date**: The counter will start at 1 (minimum)

This is perfect for habits you've already been doing for a while - just set your actual start date and the script will give you an accurate count of your progress!

## Usage

### Adding New Habits

You can add habits programmatically or by editing the config:

```javascript
// Add a new habit
addHabit({
  id: "meditation",
  name: "Daily Meditation",
  startDate: new Date("2024-12-15"),
  theme: "growth",
  enabled: true
});
```

### Managing Habits

```javascript
// Enable/disable a habit
setHabitEnabled("exercise", false);

// Remove a habit
removeHabit("reading");

// Get habit info
const habit = getHabit("exercise");

// Get all habits
const allHabits = getAllHabits();
```

### Custom Themes

For custom themes, set your own messages:

```javascript
setCustomMessagesForHabit("exercise", [
  "Workout Complete 💪",
  "Stronger Today 🏋️",
  "Fitness First 🎯",
  "Building Strength 🔥"
]);
```

### Reset and Skip Events

- Create an all-day event titled "RESET" to reset a habit's counter to 1
- Create an all-day event titled "SKIP" to skip a day without incrementing the counter

**Note**: You can disable these features in the configuration:
- Set `enableResetByEvent: false` to disable RESET events
- Set `enableSkipByEvent: false` to disable SKIP events

### Weekly Summaries

The script automatically sends weekly email summaries every Monday at 8 AM, including:
- Individual habit statistics
- Overall progress
- Current streaks
- Reset/skip activity

## Available Themes

### General
- "Kept the streak alive 🔁"
- "Commitment Continues 💥"
- "Progress, Not Perfection 📈"

### Growth
- "Watering the Habit 🌱"
- "Growing Stronger Each Day 🌿"
- "Building Discipline 🔨"

### Sobriety
- "I will not drink today 💪"
- "Clear mind, steady path 🧠"
- "Today, I choose sobriety 🌤️"

### Minimal
- Simple symbols: ✅ 🟢 🔘 ⏺️ ➕

### Custom
- Define your own messages

## Functions Reference

### Core Functions
- `createDailyHabitEvent()` - Creates events for all enabled habits
- `getTrackingStats()` - Get statistics for all habits
- `sendWeeklySummary()` - Send weekly summary email

### Habit Management
- `addHabit(habitConfig)` - Add a new habit
- `removeHabit(habitId)` - Remove a habit
- `setHabitEnabled(habitId, enabled)` - Enable/disable a habit
- `getHabit(habitId)` - Get habit configuration
- `getAllHabits()` - Get all habits

### Counter Management
- `getCurrentCounterForHabit(habitId)` - Get current counter for a habit
- `resetCounterForHabit(habitId, newValue)` - Reset counter for a habit

### Theme Management
- `changeThemeForHabit(habitId, theme)` - Change theme for a habit
- `setCustomMessagesForHabit(habitId, messages)` - Set custom messages

## Event Format

Each habit creates events with the format:
`[Habit Name] - Day [Count] – [Message]`

Example:
- "Daily Exercise - Day 15 – Growing Stronger Each Day 🌿"
- "Reading - Day 7 – Week of Consistency 📅"

## Tips

1. **Start with one habit** and add more as you get comfortable
2. **Use meaningful IDs** for your habits (e.g., "exercise", "reading", "meditation")
3. **Set realistic start dates** - the script will calculate days since you started
4. **Use the weekly summaries** to track your progress over time
5. **Experiment with themes** to find what motivates you most

## Troubleshooting

- **Calendar not found**: Make sure the calendar name in CONFIG matches exactly
- **Events not creating**: Check that habits are enabled and triggers are set up
- **Wrong counter**: Use manualCounter to set a specific value, or create a RESET event
- **No weekly emails**: Check that the weekly trigger is created in the script editor

## License

This project is open source and available under the MIT License. 