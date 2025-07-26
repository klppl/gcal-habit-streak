# 🎯 Google Calendar Habit Tracker

A powerful Google Apps Script that automatically creates daily habit tracking events in your Google Calendar with themed messages and milestone celebrations.

## ✨ Features

- **🎨 Multiple Themes**: Choose from General, Growth, Sobriety, or create Custom themes
- **🏆 Milestone Celebrations**: Special messages for significant days (1, 7, 30, 100, 365+ days)
- **🔄 Auto-Incrementing Counter**: Automatically tracks your streak
- **🔄 Reset Functionality**: Reset your counter by creating a "RESET" event
- **📊 Statistics**: Get detailed tracking statistics
- **🔧 Flexible Configuration**: Easy to customize for any habit

## 🚀 Quick Start

### 1. Setup Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy the contents of `script.js` into the editor
4. Save the project

### 2. Configure Your Settings

Edit the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
    calendarName: "Habits",              // Your calendar name
    habitName: "My Habit",               // Name of your habit
    startDate: new Date("2025-01-01"),   // When you started
    theme: "general",                    // "general", "growth", "sobriety", "minimal", or "custom"
    enableResetByEvent: true,            // Allow RESET events
    enableLogging: true,                 // Enable console logging
    maxCounterDays: 10000               // Safety limit
};
```

### 3. Run the Script

1. Click the "Run" button in Google Apps Script
2. Grant necessary permissions when prompted
3. The script will create your first habit tracking event
4. A "Habit Streak" menu will appear in Google Sheets for easy access

## 🎨 Available Themes

### 🌟 General Theme
Perfect for any habit with messages like:
- "Kept the streak alive 🔁"
- "Commitment Continues 💥"
- "Progress, Not Perfection 📈"
- "One Step at a Time 👣"

### 🌱 Growth Theme
Growth-focused messages like:
- "Watering the Habit 🌱"
- "Growing Stronger Each Day 🌿"
- "Another Brick in the Wall 🧱"
- "Building Discipline 🔨"

### 🚫 Sobriety Theme
Inspired by recovery communities:
- "I will not drink today 💪"
- "I'm staying sober with you today 🫱🫲"
- "Clear mind, steady path 🧠"
- "One day at a time 🙏"

### ⚡ Minimal Theme
Simple, abstract symbols:
- "✅"
- "🟢"
- "🔘"
- "⏺️"

### 🎯 Custom Theme
Create your own messages:
```javascript
setCustomMessages([
    "My Custom Message 1 🎯",
    "My Custom Message 2 💪",
    "My Custom Message 3 🌟"
]);
```

## 🏆 Milestone Celebrations

The script automatically celebrates important milestones with special messages:

| Day | General/Growth | Sobriety |
|-----|----------------|----------|
| 1 | First Step Forward 🚀 | First Day Sober 🌱 |
| 7 | Week of Consistency 📅 | One Week Sober 🎉 |
| 30 | Month of Progress 📊 | One Month Sober 📅 |
| 100 | Century Club 💎 | 100 Days Sober 💎 |
| 365 | Year of Transformation 🎉 | One Year Sober 🎊 |
| 1000 | Thousand Day Club 👑 | 1000 Days Sober 👑 |

## 🔧 Functions Reference

### Main Functions

#### `createDailyHabitEvent()`
Creates a daily habit tracking event. Returns an object with:
- `success`: Boolean indicating success
- `message`: Description of the result
- `dayCount`: Current day number
- `eventTitle`: Title of the created event
- `eventId`: Google Calendar event ID

#### `getCurrentCounter()`
Returns the current streak count.

#### `resetCounter(newValue)`
Resets the counter to a specified value (default: 0).



#### `getTrackingStats()`
Returns comprehensive statistics including:
- Current count
- Habit name
- Start date
- Days since start
- Calendar name
- Current theme

### Theme Management

#### `changeTheme(theme)`
Changes the current theme. Valid options: "general", "growth", "sobriety", "custom"

#### `setCustomMessages(messages)`
Sets custom messages for the custom theme. Requires an array of strings.

## 🔄 Reset & Skip Functionality

### Reset Your Counter
To reset your counter, create an all-day event in your calendar with the title "RESET". The script will:
1. Detect the RESET event
2. Delete it automatically
3. Reset your counter to 1
4. Create a new Day 1 event

### Skip a Day
To skip a day without losing your streak, create an all-day event in your calendar with the title "SKIP". The script will:
1. Detect the SKIP event
2. Delete it automatically
3. Keep your counter at the current value (no increment)
4. Create a regular habit event for the day



## 📅 Event Format

Events are created as all-day events with the format:
```
Day [Number] – [Theme Message]
```

Examples:
- `Day 1 – First Step Forward 🚀`
- `Day 7 – Week of Consistency 📅`
- `Day 30 – Month of Progress 📊`

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `calendarName` | string | "Habits" | Name of your Google Calendar |
| `habitName` | string | "General Habit" | Name of your habit |
| `startDate` | Date | "2025-01-01" | When you started your habit |
| `manualCounter` | number/null | null | Override counter (set to number) |
| `enableResetByEvent` | boolean | true | Allow RESET events |
| `enableLogging` | boolean | true | Enable console logging |
| `maxCounterDays` | number | 10000 | Safety limit for counter |
| `theme` | string | "general" | Theme to use ("general", "growth", "sobriety", "minimal", "custom") |
| `customMessages` | array | [] | Custom messages for custom theme |

## 🚨 Safety Features

- **Duplicate Prevention**: Won't create multiple events for the same day
- **Counter Limits**: Maximum counter limit prevents runaway counters
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Validates all configuration settings

## 📝 Usage Examples

### Basic Usage
```javascript
// Create today's habit event
const result = createDailyHabitEvent();
console.log(result.message);
```



### Change Theme
```javascript
// Switch to minimal theme
changeTheme("minimal");
createDailyHabitEvent();
```

### Custom Messages
```javascript
// Set custom messages
setCustomMessages([
    "Meditation Complete 🧘",
    "Mindful Moment 🌸",
    "Inner Peace Found ✨"
]);
createDailyHabitEvent();
```

### Get Statistics
```javascript
const stats = getTrackingStats();
console.log(`Current streak: ${stats.currentCount} days`);
console.log(`Theme: ${stats.theme}`);
```

## 🤝 Contributing

Feel free to contribute by:
- Adding new themes
- Improving milestone messages
- Adding new features
- Fixing bugs

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by habit tracking communities
- Sobriety theme inspired by r/stopdrinking
- Built with Google Apps Script

---

**Happy habit tracking! 🎯✨** 