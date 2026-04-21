// === CONFIGURATION ===
const CONFIG = {
    calendarName: "Habits",              // Name of the calendar to use
    habits: [
      { id: "general",    name: "General Habit",    startDate: "2025-01-01", acceptTags: ['any'],           enabled: true  },
      { id: "exercise",   name: "Daily Exercise",   startDate: "2024-12-01", acceptTags: ['any', 'growth'], enabled: false },
      { id: "reading",    name: "Reading",          startDate: "2024-11-15", acceptTags: ['any'],           enabled: false },
      { id: "meditation", name: "Daily Meditation", startDate: "2024-12-15", acceptTags: ['any', 'growth'], enabled: false },
      { id: "sobriety",   name: "Sobriety",         startDate: "2024-11-01", acceptTags: ['sobriety'],      enabled: false },
    ],
    enableResetByEvent: true,            // Set to false if you want to disable RESET detection
    enableSkipByEvent: true,             // Set to false if you want to disable SKIP detection
    enableLogging: true,                 // Enable console logging for debugging
    maxCounterDays: 10000,               // Safety limit to prevent runaway counters
    autoResetOnGap: true,                // Reset streak to 1 if yesterday had no habit event
  };
  // =======================

  // Flat list of messages, each with one or more tags. A habit shows a
  // message if any of its tags is in the habit's `acceptTags`. Add a tag to
  // an existing message to share it across more habit types without
  // duplicating the text.
  //
  // Tag conventions:
  //   any      – fits any habit (generic encouragement)
  //   growth   – plant/build metaphors, flavored for growth-type habits
  //   sobriety – first-person recovery voice; don't leak into other habits
  //   minimal  – wordless emoji markers
  const MESSAGES = [
    { text: "Kept the streak alive 🔁",          tags: ['any'] },
    { text: "Commitment Continues 💥",           tags: ['any'] },
    { text: "Progress, Not Perfection 📈",       tags: ['any'] },
    { text: "One Step at a Time 👣",             tags: ['any'] },
    { text: "Showed Up Today ✅",                tags: ['any'] },
    { text: "Staying on Track 🎯",               tags: ['any'] },
    { text: "Consistency is Key 🔑",             tags: ['any'] },
    { text: "Another Day Strong 💪",             tags: ['any'] },
    { text: "Building Momentum 🚀",              tags: ['any'] },
    { text: "Focus Forward 🎯",                  tags: ['any'] },

    { text: "Watering the Habit 🌱",             tags: ['any', 'growth'] },
    { text: "Growing Stronger Each Day 🌿",      tags: ['any', 'growth'] },
    { text: "Another Brick in the Wall 🧱",      tags: ['any', 'growth'] },
    { text: "Building Discipline 🔨",            tags: ['any', 'growth'] },
    { text: "Nurturing Growth 🌳",               tags: ['growth'] },
    { text: "Planting Seeds of Success 🌱",      tags: ['growth'] },
    { text: "Strengthening Roots 🌳",            tags: ['growth'] },
    { text: "Blooming Daily 🌸",                 tags: ['growth'] },
    { text: "Cultivating Excellence 🌟",         tags: ['growth'] },
    { text: "Harvesting Progress 🌾",            tags: ['growth'] },

    { text: "I will not drink today 💪",              tags: ['sobriety'] },
    { text: "I’m staying sober with you today 🫱🫲",  tags: ['sobriety'] },
    { text: "Clear mind, steady path 🧠",             tags: ['sobriety'] },
    { text: "One day at a time 🙏",                   tags: ['sobriety'] },
    { text: "Today, I choose sobriety 🌤️",           tags: ['sobriety'] },
    { text: "Sober and strong, just for today 🦁",    tags: ['sobriety'] },
    { text: "I’m free from alcohol today 🕊️",        tags: ['sobriety'] },
    { text: "Today I live life on my terms 🎯",       tags: ['sobriety'] },
    { text: "No drinks, no regrets 🌅",               tags: ['sobriety'] },
    { text: "I’m sober and grateful 🙌",              tags: ['sobriety'] },
    { text: "Just for today, I will not drink ⛅",    tags: ['sobriety'] },
    { text: "Showing up sober, again 💎",             tags: ['sobriety'] },
    { text: "Sober today, stronger tomorrow 🧱",      tags: ['sobriety'] },
    { text: "Choosing clarity today 🌱",              tags: ['sobriety'] },
    { text: "Another day, no alcohol needed 🛡️",     tags: ['sobriety'] },

    { text: "✅",   tags: ['minimal'] },
    { text: "🟢",   tags: ['minimal'] },
    { text: "🔘",   tags: ['minimal'] },
    { text: "⏺️",  tags: ['minimal'] },
    { text: "➕",   tags: ['minimal'] },
    { text: "🟩",   tags: ['minimal'] },
    { text: "📍",   tags: ['minimal'] },
    { text: "🪙",   tags: ['minimal'] },
    { text: "📅",   tags: ['minimal'] },
    { text: "📈",   tags: ['minimal'] },
    { text: "⚪",   tags: ['minimal'] },
    { text: "🔲",   tags: ['minimal'] },
    { text: "🟠",   tags: ['minimal'] },
    { text: "🧿",   tags: ['minimal'] },
    { text: "🪩",   tags: ['minimal'] }
  ];
  
  /**
   * Main function to create daily habit tracking events for all enabled habits
   * @returns {Object} Result object with success status and details
   */
  function createDailyHabitEvent() {
    try {
      validateConfig();

      const calendar = ensureCalendar(CONFIG.calendarName);

      const { start: startOfDay, end: endOfDay } = getDayBounds();

      const props = PropertiesService.getScriptProperties();
      const allProps = props.getProperties();
      const results = [];
      const newCounters = {};

      // Fetch yesterday + today in one call so gap detection costs no extra API hit.
      const yesterdayStart = new Date(startOfDay);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const rangeEvents = calendar.getEvents(yesterdayStart, endOfDay)
        .filter(event => event.isAllDayEvent());
      const yesterdayEvents = rangeEvents.filter(e => e.getStartTime() < startOfDay);
      const allDayEvents   = rangeEvents.filter(e => e.getStartTime() >= startOfDay);
      log(`Fetched ${allDayEvents.length} events for today, ${yesterdayEvents.length} for yesterday`);

      let resetTriggered = false;
      let skipTriggered = false;
      if (CONFIG.enableResetByEvent) {
        resetTriggered = processResetEventsFromCache(allDayEvents);
      }
      if (CONFIG.enableSkipByEvent) {
        skipTriggered = processSkipEventsFromCache(allDayEvents);
      }

      // Process each enabled habit
      for (const habit of CONFIG.habits) {
        if (!habit.enabled) {
          log(`Skipping disabled habit: ${habit.id}`);
          continue;
        }

        try {
          const result = createHabitEventForDayOptimized(calendar, habit, startOfDay, endOfDay, allProps, newCounters, resetTriggered, skipTriggered, allDayEvents, yesterdayEvents);
          results.push(result);
        } catch (error) {
          log(`Error processing habit ${habit.id}: ${error.message}`);
          results.push({
            habitId: habit.id,
            success: false,
            error: error.message
          });
        }
      }
      
      if (Object.keys(newCounters).length > 0) {
        props.setProperties(newCounters);
        log(`Updated ${Object.keys(newCounters).length} counters in batch`);
      }
      
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      log(`Processed ${results.length} habits: ${successfulResults.length} successful, ${failedResults.length} failed`);

      return {
        success: successfulResults.length > 0,
        message: `Processed ${results.length} habits`,
        results: results,
        successfulCount: successfulResults.length,
        failedCount: failedResults.length
      };
      
    } catch (error) {
      log(`Error creating events: ${error.message}`);
      console.error(`Error in createDailyHabitEvent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete all-day events whose title matches a sentinel (e.g. "RESET", "SKIP")
   * and remove them from the passed-in array in place.
   * @param {Array} allDayEvents - Array of all-day events (mutated)
   * @param {string} sentinel - Title to match, uppercase
   * @returns {boolean} Whether any matching events were found
   */
  function processSentinelEvents(allDayEvents, sentinel) {
    const matches = allDayEvents.filter(event =>
      event.getTitle().trim().toUpperCase() === sentinel
    );
    if (matches.length === 0) return false;

    log(`Found ${matches.length} ${sentinel} event(s)`);
    matches.forEach(event => {
      event.deleteEvent();
      log(`Deleted ${sentinel} event: ${event.getTitle()}`);
    });

    const matchSet = new Set(matches);
    for (let i = allDayEvents.length - 1; i >= 0; i--) {
      if (matchSet.has(allDayEvents[i])) allDayEvents.splice(i, 1);
    }
    return true;
  }

  function processResetEventsFromCache(allDayEvents) {
    return processSentinelEvents(allDayEvents, "RESET");
  }

  function processSkipEventsFromCache(allDayEvents) {
    return processSentinelEvents(allDayEvents, "SKIP");
  }
  
  /**
   * Create a habit event for a specific habit on a specific day.
   * @param {Calendar} calendar - The calendar object
   * @param {Object} habit - The habit configuration
   * @param {Date} startOfDay - Start of the day
   * @param {Date} endOfDay - End of the day
   * @param {Object} allProps - Snapshot of all script properties
   * @param {Object} newCounters - Object to collect property updates (batched)
   * @param {boolean} resetTriggered - Whether a RESET event was present
   * @param {boolean} skipTriggered - Whether a SKIP event was present
   * @param {Array} allDayEvents - Today's all-day events
   * @param {Array} yesterdayEvents - Yesterday's all-day events (for gap detection)
   * @returns {Object} Result object for this habit
   */
  function createHabitEventForDayOptimized(calendar, habit, startOfDay, endOfDay, allProps, newCounters, resetTriggered, skipTriggered, allDayEvents, yesterdayEvents) {
    const habitEvents = findHabitEvents(allDayEvents, habit);
    tagLegacyEvents(habitEvents, habit);

    if (habitEvents.length > 0) {
      log(`Event already exists for habit ${habit.id} today: ${habitEvents[0].getTitle()}`);
      return {
        habitId: habit.id,
        success: false,
        message: "Event already exists for today",
        existingEvent: habitEvents[0].getTitle()
      };
    }

    const count = determineCounterForHabit(allProps, habit, resetTriggered, skipTriggered, yesterdayEvents, startOfDay);

    if (count > CONFIG.maxCounterDays) {
      throw new Error(`Counter exceeded maximum limit of ${CONFIG.maxCounterDays} days for habit ${habit.id}`);
    }

    const message = getHabitMessageForHabit(count, habit);
    const title = `${habit.name} - Day ${count} – ${message}`;

    const event = calendar.createAllDayEvent(title, startOfDay, endOfDay);
    event.setDescription(`[habit:${habit.id}]`);

    allDayEvents.push(event);

    newCounters[`HABIT_COUNTER_${habit.id}`] = count.toString();

    const bestKey = `HABIT_BEST_${habit.id}`;
    const currentBest = parseInt(allProps[bestKey] || "0", 10);
    if (count > currentBest) {
      newCounters[bestKey] = count.toString();
      log(`New best streak for habit ${habit.id}: ${count} (was ${currentBest})`);
    }

    log(`Successfully created event for habit ${habit.id}: ${title}`);

    return {
      habitId: habit.id,
      success: true,
      message: "Event created successfully",
      dayCount: count,
      bestCount: Math.max(count, currentBest),
      eventTitle: title,
      eventId: event.getId()
    };
  }
  
  /**
   * Validate configuration settings and set defaults
   */
  function validateConfig() {
    if (!CONFIG.calendarName || typeof CONFIG.calendarName !== 'string') {
      throw new Error('Invalid calendarName in configuration');
    }
    
    if (!CONFIG.habits || !Array.isArray(CONFIG.habits) || CONFIG.habits.length === 0) {
      throw new Error('habits array must be a non-empty array');
    }

    CONFIG.habits.forEach((habit, index) => {
      if (!habit.id || typeof habit.id !== 'string') {
        throw new Error(`Habit at index ${index} must have an id`);
      }
      if (!habit.name || typeof habit.name !== 'string') {
        throw new Error(`Habit '${habit.id}' must have a name`);
      }
      
      if (!habit.startDate) {
        throw new Error(`Habit '${habit.id}' must have a startDate`);
      }
      if (typeof habit.startDate === 'string') {
        try {
          habit.startDate = parseDate(habit.startDate);
        } catch (error) {
          throw new Error(`Habit '${habit.id}' has invalid startDate format. Use YYYY-MM-DD (e.g., "2024-12-01")`);
        }
      }
      if (!(habit.startDate instanceof Date) || isNaN(habit.startDate.getTime())) {
        throw new Error(`Habit '${habit.id}' must have a valid startDate`);
      }
      
      if (habit.manualCounter === undefined) habit.manualCounter = null;
      if (habit.enabled === undefined) habit.enabled = false;
      if (habit.acceptTags === undefined) habit.acceptTags = ['any'];
      if (habit.customMessages === undefined) habit.customMessages = [];

      if (habit.manualCounter !== null && (typeof habit.manualCounter !== 'number' || habit.manualCounter < 0)) {
        throw new Error(`manualCounter must be null or a non-negative number for habit '${habit.id}'`);
      }
      if (typeof habit.enabled !== 'boolean') {
        throw new Error(`enabled must be a boolean for habit '${habit.id}'`);
      }
      if (!Array.isArray(habit.acceptTags) || !habit.acceptTags.every(t => typeof t === 'string')) {
        throw new Error(`acceptTags must be an array of strings for habit '${habit.id}'`);
      }
      if (!Array.isArray(habit.customMessages) || !habit.customMessages.every(m => typeof m === 'string')) {
        throw new Error(`customMessages must be an array of strings for habit '${habit.id}'`);
      }
      // A habit needs at least one message source: either its acceptTags
      // match something in MESSAGES, or customMessages is non-empty.
      const hasCustom = habit.customMessages.length > 0;
      const hasPoolMatch = MESSAGES.some(m => m.tags.some(t => habit.acceptTags.includes(t)));
      if (!hasCustom && !hasPoolMatch) {
        throw new Error(`habit '${habit.id}' has no matching messages — check acceptTags ${JSON.stringify(habit.acceptTags)} against MESSAGES tags`);
      }
    });
    
    if (typeof CONFIG.enableResetByEvent !== 'boolean') {
      throw new Error('enableResetByEvent must be a boolean');
    }
    
    if (typeof CONFIG.enableSkipByEvent !== 'boolean') {
      throw new Error('enableSkipByEvent must be a boolean');
    }
    
    if (typeof CONFIG.enableLogging !== 'boolean') {
      throw new Error('enableLogging must be a boolean');
    }

    if (typeof CONFIG.maxCounterDays !== 'number' || CONFIG.maxCounterDays <= 0) {
      throw new Error('maxCounterDays must be a positive number');
    }

    if (typeof CONFIG.autoResetOnGap !== 'boolean') {
      throw new Error('autoResetOnGap must be a boolean');
    }
  }
  
  /**
   * Determine the counter value for a specific habit.
   * @param {Object} allProps - Snapshot of all script properties
   * @param {Object} habit - The habit configuration
   * @param {boolean} resetTriggered - Whether a RESET was present today
   * @param {boolean} skipTriggered - Whether a SKIP was present today
   * @param {Array} yesterdayEvents - Yesterday's all-day events (for gap detection)
   * @param {Date} startOfDay - Today's start (used to derive "yesterday")
   * @returns {number} The counter value
   */
  function determineCounterForHabit(allProps, habit, resetTriggered, skipTriggered, yesterdayEvents, startOfDay) {
    if (habit.manualCounter !== null) {
      log(`Using manual counter for habit ${habit.id}: ${habit.manualCounter}`);
      return habit.manualCounter;
    }

    if (resetTriggered) {
      log(`Reset triggered for habit ${habit.id}, starting counter at 1`);
      return 1;
    }

    const currentCount = parseInt(allProps[`HABIT_COUNTER_${habit.id}`] || "0", 10);

    if (skipTriggered) {
      log(`Skip triggered for habit ${habit.id}, keeping counter at ${currentCount}`);
      return currentCount;
    }

    if (currentCount === 0) {
      const { start: today } = getDayBounds();
      const daysSinceStart = Math.floor((today - habit.startDate) / (1000 * 60 * 60 * 24));
      const initialCount = Math.max(1, daysSinceStart + 1);
      log(`First time running habit ${habit.id}, initial count: ${initialCount} (since ${formatDate(habit.startDate)})`);
      return initialCount;
    }

    // Gap detection: if yesterday was on/after startDate but has no habit
    // event, the streak was broken and we reset to 1.
    if (CONFIG.autoResetOnGap) {
      const yesterday = new Date(startOfDay);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday >= habit.startDate) {
        const yesterdayHabitEvents = findHabitEvents(yesterdayEvents, habit);
        if (yesterdayHabitEvents.length === 0) {
          log(`Gap detected for habit ${habit.id}: no event for ${formatDate(yesterday)}, resetting streak to 1`);
          return 1;
        }
      }
    }

    const newCount = currentCount + 1;
    log(`Incrementing counter for habit ${habit.id} from ${currentCount} to ${newCount}`);
    return newCount;
  }
  
  /**
   * Pick the message for a habit on a given day. Milestones take precedence;
   * otherwise cycles through messages whose tags overlap with the habit's
   * `acceptTags`. Per-habit `customMessages` override the shared pool.
   * @param {number} day - The day count
   * @param {Object} habit - The habit configuration
   * @returns {string} The appropriate message
   */
  function getHabitMessageForHabit(day, habit) {
    const milestone = getMilestoneMessage(day);
    if (milestone) return milestone;

    let pool;
    if (habit.customMessages && habit.customMessages.length > 0) {
      pool = habit.customMessages;
    } else {
      const accepted = new Set(habit.acceptTags);
      pool = MESSAGES
        .filter(m => m.tags.some(t => accepted.has(t)))
        .map(m => m.text);
    }

    if (pool.length === 0) {
      log(`No messages match acceptTags for habit ${habit.id}: ${JSON.stringify(habit.acceptTags)}`);
      return `Day ${day}`;
    }
    return pool[(day - 1) % pool.length];
  }

  /**
   * Auto-generated milestone message for round-number days. Returns null if
   * the day isn't a milestone. Covers day 1, weeks 1–4, months 1–6, years,
   * and the 100 / 1000-day marks.
   * @param {number} day
   * @returns {string|null}
   */
  function getMilestoneMessage(day) {
    if (day === 1)    return "Day 1 🌱";
    if (day === 100)  return "100 days 💎";
    if (day === 1000) return "1000 days 👑";
    if (day % 365 === 0) {
      const y = day / 365;
      return `${y} year${y > 1 ? 's' : ''} 🎉`;
    }
    if (day % 30 === 0 && day <= 180) {
      const m = day / 30;
      return `${m} month${m > 1 ? 's' : ''} 📅`;
    }
    if (day % 7 === 0 && day <= 28) {
      const w = day / 7;
      return `${w} week${w > 1 ? 's' : ''} 🔥`;
    }
    return null;
  }
  
  /**
   * Ensure calendar exists and return it, or throw descriptive error
   * @param {string} name - Calendar name
   * @returns {Calendar} The calendar object
   * @throws {Error} If calendar not found
   */
  function ensureCalendar(name) {
    try {
      const calendars = CalendarApp.getAllCalendars();
      const calendar = calendars.find(cal => cal.getName() === name);
      
      if (!calendar) {
        const availableCalendars = calendars.map(cal => cal.getName()).join(', ');
        throw new Error(`Calendar "${name}" not found. Available calendars: ${availableCalendars}`);
      }
      
      return calendar;
    } catch (error) {
      if (error.message.includes('Calendar "')) {
        throw error; // Re-throw our custom error
      }
      log(`Error getting calendar by name: ${error.message}`);
      throw new Error(`Error accessing calendar "${name}": ${error.message}`);
    }
  }
  

  
  /**
   * Log message if logging is enabled
   * @param {string} message - Message to log
   */
  function log(message) {
    if (CONFIG.enableLogging) {
      console.log(`[HABIT] ${new Date().toISOString()}: ${message}`);
    }
  }
  
  const TZ = Session.getScriptTimeZone();
  
  /**
   * Get day bounds (start and end) for a specific day with proper timezone handling
   * @param {number} offsetDays - Days offset from today (0 = today, -1 = yesterday, etc.)
   * @returns {Object} Object with start and end Date objects
   */
  function getDayBounds(offsetDays = 0) {
    // `new Date('YYYY-MM-DD')` parses as UTC, which shifts the day boundary in
    // any non-UTC timezone. Build the date from its parts in the script's TZ.
    const [y, m, d] = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')
      .split('-').map(Number);
    const start = new Date(y, m - 1, d + offsetDays);
    const end   = new Date(y, m - 1, d + offsetDays + 1);
    return { start, end };
  }
  
  /**
   * Parse date string with timezone awareness
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Date} Date object in script timezone
   */
  function parseDate(dateString) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    return Utilities.formatDate(date, TZ, 'yyyy-MM-dd');
  }
  
  /**
   * Find events belonging to a habit. Prefers events tagged with
   * `[habit:<id>]` in the description; falls back to legacy events whose
   * title starts with `<habit name> - Day `.
   * @param {Array} events - Candidate all-day events
   * @param {Object} habit - The habit configuration
   * @returns {Array} Matching events
   */
  function findHabitEvents(events, habit) {
    const tag = `[habit:${habit.id}]`;
    const tagged = events.filter(e => (e.getDescription() || '').includes(tag));
    if (tagged.length > 0) return tagged;

    // Anchored prefix match avoids cross-matching habits whose names overlap
    // (e.g. "Exercise" vs "Daily Exercise").
    const prefix = `${habit.name} - Day `;
    return events.filter(e => e.getTitle().startsWith(prefix));
  }

  /**
   * Tag events missing the habit marker so future lookups hit the fast path.
   * No-op for already-tagged events.
   * @param {Array} events - Events to tag
   * @param {Object} habit - The habit configuration
   */
  function tagLegacyEvents(events, habit) {
    const tag = `[habit:${habit.id}]`;
    events.forEach(event => {
      try {
        const desc = event.getDescription() || '';
        if (desc.includes(tag)) return;
        event.setDescription(`${desc} ${tag}`.trim());
        log(`Added habit tag to legacy event: ${event.getTitle()}`);
      } catch (error) {
        log(`Could not add habit tag to legacy event: ${error.message}`);
      }
    });
  }
  
  /**
   * Read all stored counter + best-streak values in one call.
   * @returns {Object} `{ counters: {id: n}, bests: {id: n} }`
   */
  function readAllStreakProps() {
    const props = PropertiesService.getScriptProperties().getProperties();
    const counters = {};
    const bests = {};
    CONFIG.habits.forEach(h => {
      counters[h.id] = parseInt(props[`HABIT_COUNTER_${h.id}`] || "0", 10);
      bests[h.id]    = parseInt(props[`HABIT_BEST_${h.id}`]    || "0", 10);
    });
    return { counters, bests };
  }
  
  /**
   * Reset counter for a specific habit to specified value
   * @param {string} habitId - The habit ID
   * @param {number} newValue - New counter value (default: 0)
   * @param {Object} batchUpdates - Optional object to collect updates for batch writing
   */
  function resetCounterForHabit(habitId, newValue = 0, batchUpdates = null) {
    if (batchUpdates) {
      batchUpdates[`HABIT_COUNTER_${habitId}`] = newValue.toString();
      log(`Counter reset for habit ${habitId} to ${newValue} (batched)`);
    } else {
      const props = PropertiesService.getScriptProperties();
      props.setProperty(`HABIT_COUNTER_${habitId}`, newValue.toString());
      log(`Counter reset for habit ${habitId} to ${newValue}`);
    }
  }
  
  /**
   * Get statistics about the tracking for all habits
   * @returns {Object} Statistics object
   */
  function getTrackingStats() {
    const stats = {
      habits: [],
      calendarName: CONFIG.calendarName,
      totalHabits: CONFIG.habits.length,
      enabledHabits: CONFIG.habits.filter(h => h.enabled).length
    };

    const { counters, bests } = readAllStreakProps();
    const { start: today } = getDayBounds();

    for (const habit of CONFIG.habits) {
      const daysSinceStart = Math.floor((today - habit.startDate) / (1000 * 60 * 60 * 24));
      stats.habits.push({
        id: habit.id,
        name: habit.name,
        currentCount: counters[habit.id],
        bestCount: bests[habit.id],
        startDate: formatDate(habit.startDate),
        daysSinceStart: daysSinceStart,
        acceptTags: habit.acceptTags,
        enabled: habit.enabled,
        manualCounter: habit.manualCounter
      });
    }

    return stats;
  }
  
  /**
   * Get a specific habit configuration
   * @param {string} habitId - The habit ID
   * @returns {Object|null} The habit configuration or null if not found
   */
  function getHabit(habitId) {
    return CONFIG.habits.find(h => h.id === habitId) || null;
  }

  /**
   * Get all habit configurations
   * @returns {Object[]} Array of habit configurations
   */
  function getAllHabits() {
    return CONFIG.habits;
  }



/**
 * Add custom menu and ensure daily trigger exists
 */
function onOpen(e) {
  // Only create menu if running in Google Sheets
  try {
    SpreadsheetApp.getUi()
      .createMenu('Habit Streak')
      .addItem('Create Today\'s Event', 'createDailyHabitEvent')
      .addToUi();
  } catch (error) {
    // Running in standalone Apps Script - no UI available
    console.log('Running in standalone mode - no menu created');
  }

  setupTriggers();
}

function setupTriggers() {
  // Ensure daily trigger exists
  const hasTrigger = ScriptApp.getProjectTriggers().some(
    t => t.getHandlerFunction() === 'createDailyHabitEvent'
  );
  if (!hasTrigger) {
    ScriptApp.newTrigger('createDailyHabitEvent')
      .timeBased()
      .atHour(1)
      .everyDays(1)
      .create();
  }
  
  // Ensure weekly summary trigger exists
  ensureWeeklyTrigger();
}

/**
 * Summarize last week's habit activity and email it to yourself.
 */
function sendWeeklySummary() {
  const CAL_NAME = CONFIG.calendarName;
  const calendar = ensureCalendar(CAL_NAME);

  const { start: today } = getDayBounds();
  const todayDow = today.getDay(); // 0=Sun,1=Mon...
  const daysSinceMon = (todayDow + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMon);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  // OPTIMIZATION: Get all events for the week once
  const allWeekEvents = calendar.getEvents(monday, nextMonday);
  const allDayWeekEvents = allWeekEvents.filter(event => event.isAllDayEvent());
  
  const habitEvents = {};
  for (const habit of CONFIG.habits) {
    habitEvents[habit.id] = findHabitEvents(allDayWeekEvents, habit);
  }

  const { counters, bests } = readAllStreakProps();

  const totalDays = 7;
  let totalTracked = 0;
  let allTitles = [];

  let summaryText = `Weekly Habit Summary (${formatDate(monday)} – ${formatDate(new Date(nextMonday - 1))})\n\n`;

  for (const habit of CONFIG.habits) {
    if (!habit.enabled) continue;

    const tracked = habitEvents[habit.id]?.length || 0;
    const missed = totalDays - tracked;
    totalTracked += tracked;

    const titles = habitEvents[habit.id]?.map(ev => ev.getTitle()) || [];
    allTitles = allTitles.concat(titles);

    const current = counters[habit.id];
    const best    = bests[habit.id];
    const bestNote = current === best && best > 0 ? ' 🏅' : '';

    summaryText += `${habit.name}:\n`;
    summaryText += `• Tracked days: ${tracked}\n`;
    summaryText += `• Missed days: ${missed}\n`;
    summaryText += `• Current streak: ${current}${bestNote}\n`;
    summaryText += `• Best streak: ${best}\n\n`;
  }

  // OPTIMIZATION: Use cached events for reset/skip counts
  const resets = allDayWeekEvents.filter(ev => 
    ev.getTitle().trim().toUpperCase() === 'RESET'
  ).length;
  const skips = allDayWeekEvents.filter(ev => 
    ev.getTitle().trim().toUpperCase() === 'SKIP'
  ).length;

  summaryText += `Overall:\n`;
  summaryText += `• Total tracked days: ${totalTracked}\n`;
  summaryText += `• Skips logged: ${skips}\n`;
  summaryText += `• Resets triggered: ${resets}\n\n`;

  summaryText += `All Entries:\n`;
  summaryText += `${allTitles.join('\n') || 'No entries found'}\n\n`;
  summaryText += `Keep it up!`;

  // Send to yourself
  const email = Session.getActiveUser().getEmail();
  MailApp.sendEmail({
    to:        email,
    subject:   `🗓️ Weekly Habit Report: ${formatDate(monday)}`,
    body:      summaryText
  });
}

/**
 * Install the weekly‐summary trigger if it doesn't yet exist.
 * Call this once (e.g. from onOpen).
 */
function ensureWeeklyTrigger() {
  const fn = 'sendWeeklySummary';
  const has = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === fn);
  if (!has) {
    ScriptApp.newTrigger(fn)
      .timeBased()
      .everyWeeks(1)
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(8)
      .create();
  }
}