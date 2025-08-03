// === CONFIGURATION ===
const CONFIG = {
    calendarName: "Habits",              // Name of the calendar to use
    habits: [
      { id: "general",    name: "General Habit",   startDate: "2025-01-01", enabled: true },
      { id: "exercise",   name: "Daily Exercise",  startDate: "2024-12-01", theme: "growth", enabled: false },
      { id: "reading",    name: "Reading",         startDate: "2024-11-15", enabled: false },
      { id: "meditation", name: "Daily Meditation", startDate: "2024-12-15", theme: "growth", enabled: false },
      { id: "sobriety",   name: "Sobriety",        startDate: "2024-11-01", theme: "sobriety", enabled: false },
    ],
    enableResetByEvent: true,            // Set to false if you want to disable RESET detection
    enableSkipByEvent: true,             // Set to false if you want to disable SKIP detection
    enableLogging: true,                 // Enable console logging for debugging
    maxCounterDays: 10000,              // Safety limit to prevent runaway counters
    milestones: {                        // Customizable milestone messages
      sobriety: {
        1: "First Day Sober 🌱",
        3: "Three Days Strong 💪",
        7: "One Week Sober 🎉",
        14: "Two Weeks Sober 🏆",
        21: "Three Weeks Sober 🧠",
        30: "One Month Sober 📅",
        60: "Two Months Sober 🔥",
        90: "Three Months Sober 🎯",
        100: "100 Days Sober 💎",
        180: "Six Months Sober 🦸",
        365: "One Year Sober 🎊",
        500: "500 Days Sober ⚡",
        730: "Two Years Sober 🎯",
        1000: "1000 Days Sober 👑",
        1095: "Three Years Sober 🌳",
        1825: "Five Years Sober 🌟",
        3650: "Ten Years Sober 🎪"
      },
      default: {
        1: "First Step Forward 🚀",
        7: "Week of Consistency 📅",
        14: "Two Weeks Strong 💪",
        21: "Habit Formation 🧠",
        30: "Month of Progress 📊",
        60: "Two Months Deep 🔥",
        90: "Quarter of Excellence 🏆",
        100: "Century Club 💎",
        180: "Half Year Hero 🦸",
        365: "Year of Transformation 🎉",
        500: "500 Days of Power ⚡",
        730: "Two Years Strong 🎯",
        1000: "Thousand Day Club 👑",
        1095: "Three Years of Growth 🌳",
        1825: "Five Years of Excellence 🌟",
        3650: "Decade of Dedication 🎪"
      }
    }
  };
  // =======================
  const HABIT_THEMES = {
    general: [
      "Kept the streak alive 🔁",
      "Commitment Continues 💥",
      "Progress, Not Perfection 📈",
      "One Step at a Time 👣",
      "Showed Up Today ✅",
      "Staying on Track 🎯",
      "Consistency is Key 🔑",
      "Another Day Strong 💪",
      "Building Momentum 🚀",
      "Focus Forward 🎯"
    ],
    growth: [
      "Watering the Habit 🌱",
      "Growing Stronger Each Day 🌿",
      "Another Brick in the Wall 🧱",
      "Building Discipline 🔨",
      "Nurturing Growth 🌳",
      "Planting Seeds of Success 🌱",
      "Strengthening Roots 🌳",
      "Blooming Daily 🌸",
      "Cultivating Excellence 🌟",
      "Harvesting Progress 🌾"
    ],
    sobriety: [
      "I will not drink today 💪",
      "I’m staying sober with you today 🫱🫲",
      "Clear mind, steady path 🧠",
      "One day at a time 🙏",
      "Today, I choose sobriety 🌤️",
      "Sober and strong, just for today 🦁",
      "I’m free from alcohol today 🕊️",
      "Today I live life on my terms 🎯",
      "No drinks, no regrets 🌅",
      "I’m sober and grateful 🙌",
      "Just for today, I will not drink ⛅",
      "Showing up sober, again 💎",
      "Sober today, stronger tomorrow 🧱",
      "Choosing clarity today 🌱",
      "Another day, no alcohol needed 🛡️"
    ],
    minimal: [
      "✅",
      "🟢",
      "🔘",
      "⏺️",
      "➕",
      "🟩",
      "📍",
      "🪙",
      "📅",
      "📈",
      "⚪",
      "🔲",
      "🟠",
      "🧿",
      "🪩"
    ]    
  };
  
  /**
   * Main function to create daily habit tracking events for all enabled habits
   * @returns {Object} Result object with success status and details
   */
  function createDailyHabitEvent() {
    try {
      // Validate configuration
      validateConfig();
      
      const calendar = ensureCalendar(CONFIG.calendarName);
  
      const { start: startOfDay, end: endOfDay } = getDayBounds();
  
      const props = PropertiesService.getScriptProperties();
      const results = [];
      const newCounters = {};
      
      // Process each enabled habit
      for (const habit of CONFIG.habits) {
        if (!habit.enabled) {
          log(`Skipping disabled habit: ${habit.id}`);
          continue;
        }
        
        try {
          const result = createHabitEventForDay(calendar, habit, startOfDay, endOfDay, props, newCounters);
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
   * Create a habit event for a specific habit on a specific day
   * @param {Calendar} calendar - The calendar object
   * @param {Object} habit - The habit configuration
   * @param {Date} startOfDay - Start of the day
   * @param {Date} endOfDay - End of the day
   * @param {Properties} props - Script properties
   * @param {Object} newCounters - Object to collect counter updates
   * @returns {Object} Result object for this habit
   */
  function createHabitEventForDay(calendar, habit, startOfDay, endOfDay, props, newCounters) {
    const habitEvents = getHabitEvents(calendar, startOfDay, endOfDay, habit);
    
    if (habitEvents.length > 0) {
      log(`Event already exists for habit ${habit.id} today: ${habitEvents[0].getTitle()}`);
      return {
        habitId: habit.id,
        success: false,
        message: "Event already exists for today",
        existingEvent: habitEvents[0].getTitle()
      };
    }
  
    let resetTriggered = false;
    let skipTriggered = false;
    if (CONFIG.enableResetByEvent) {
      resetTriggered = processResetEvents(calendar, startOfDay, endOfDay);
    }
    if (CONFIG.enableSkipByEvent) {
      skipTriggered = processSkipEvents(calendar, startOfDay, endOfDay);
    }
  
    const count = determineCounterForHabit(props, habit, resetTriggered, skipTriggered);
      
    if (count > CONFIG.maxCounterDays) {
      throw new Error(`Counter exceeded maximum limit of ${CONFIG.maxCounterDays} days for habit ${habit.id}`);
    }
  
    const message = getHabitMessageForHabit(count, habit);
    const title = `${habit.name} - Day ${count} – ${message}`;
  
    const event = calendar.createAllDayEvent(title, startOfDay, endOfDay);
    event.setDescription(`[habit:${habit.id}]`);
    
    newCounters[`HABIT_COUNTER_${habit.id}`] = count.toString();
    
    log(`Successfully created event for habit ${habit.id}: ${title}`);
    
    return {
      habitId: habit.id,
      success: true,
      message: "Event created successfully",
      dayCount: count,
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
      if (habit.theme === undefined) habit.theme = 'general';
      if (habit.customMessages === undefined) habit.customMessages = [];
      
      if (habit.manualCounter !== null && (typeof habit.manualCounter !== 'number' || habit.manualCounter < 0)) {
        throw new Error(`manualCounter must be null or a non-negative number for habit '${habit.id}'`);
      }
      if (typeof habit.enabled !== 'boolean') {
        throw new Error(`enabled must be a boolean for habit '${habit.id}'`);
      }
      if (!['general', 'growth', 'sobriety', 'minimal', 'custom'].includes(habit.theme)) {
        throw new Error(`theme must be "general", "growth", "sobriety", "minimal", or "custom" for habit '${habit.id}'`);
      }
      if (habit.theme === 'custom' && (!Array.isArray(habit.customMessages) || habit.customMessages.length === 0)) {
        throw new Error(`customMessages must be a non-empty array when theme is "custom" for habit '${habit.id}'`);
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
    
    if (!CONFIG.milestones || typeof CONFIG.milestones !== 'object') {
      throw new Error('milestones must be an object');
    }
    
    if (!CONFIG.milestones.default || typeof CONFIG.milestones.default !== 'object') {
      throw new Error('milestones.default must be an object');
    }
    
    if (!CONFIG.milestones.sobriety || typeof CONFIG.milestones.sobriety !== 'object') {
      throw new Error('milestones.sobriety must be an object');
    }
  }
  
  /**
   * Process RESET events and return whether a reset was triggered
   * @param {Calendar} calendar - The calendar object
   * @param {Date} startOfDay - Start of the day
   * @param {Date} endOfDay - End of the day
   * @returns {boolean} Whether a reset was triggered
   */
  function processResetEvents(calendar, startOfDay, endOfDay) {
    const events = calendar.getEvents(startOfDay, endOfDay, {search: "RESET"});
    const resetEvents = events.filter(event =>
      event.isAllDayEvent() && event.getTitle().trim().toUpperCase() === "RESET"
    );
  
    if (resetEvents.length > 0) {
      log(`Found ${resetEvents.length} RESET event(s)`);
      
      // Delete RESET events after processing
      resetEvents.forEach(event => {
        event.deleteEvent();
        log(`Deleted RESET event: ${event.getTitle()}`);
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Process SKIP events and return whether a skip was triggered
   * @param {Calendar} calendar - The calendar object
   * @param {Date} startOfDay - Start of the day
   * @param {Date} endOfDay - End of the day
   * @returns {boolean} Whether a skip was triggered
   */
  function processSkipEvents(calendar, startOfDay, endOfDay) {
    const events = calendar.getEvents(startOfDay, endOfDay, {search: "SKIP"});
    const skipEvents = events.filter(event =>
      event.isAllDayEvent() && event.getTitle().trim().toUpperCase() === "SKIP"
    );
  
    if (skipEvents.length > 0) {
      log(`Found ${skipEvents.length} SKIP event(s)`);
      
      // Delete SKIP events after processing
      skipEvents.forEach(event => {
        event.deleteEvent();
        log(`Deleted SKIP event: ${event.getTitle()}`);
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine the counter value for a specific habit
   * @param {Properties} props - Script properties
   * @param {Object} habit - The habit configuration
   * @param {boolean} resetTriggered - Whether a reset was triggered
   * @param {boolean} skipTriggered - Whether a skip was triggered
   * @returns {number} The counter value
   */
  function determineCounterForHabit(props, habit, resetTriggered, skipTriggered) {
    if (habit.manualCounter !== null) {
      log(`Using manual counter for habit ${habit.id}: ${habit.manualCounter}`);
      return habit.manualCounter;
    }
    
    if (resetTriggered) {
      log(`Reset triggered for habit ${habit.id}, starting counter at 1`);
      return 1;
    }
    
    if (skipTriggered) {
      log(`Skip triggered for habit ${habit.id}, keeping counter at current value`);
      return parseInt(props.getProperty(`HABIT_COUNTER_${habit.id}`) || "0", 10);
    }
    
    const currentCount = parseInt(props.getProperty(`HABIT_COUNTER_${habit.id}`) || "0", 10);
    
    if (currentCount === 0) {
      const { start: today } = getDayBounds();
      const startDate = habit.startDate;
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      
      const initialCount = Math.max(1, daysSinceStart + 1);
      log(`First time running habit ${habit.id}, calculating initial count: ${initialCount} days since ${formatDate(startDate)}`);
      return initialCount;
    }
    
    const newCount = currentCount + 1;
    log(`Incrementing counter for habit ${habit.id} from ${currentCount} to ${newCount}`);
    return newCount;
  }
  
  /**
   * Get habit message for a specific habit based on day count and theme
   * @param {number} day - The day count
   * @param {Object} habit - The habit configuration
   * @returns {string} The appropriate message
   */
  function getHabitMessageForHabit(day, habit) {
    let messages;
    
    if (habit.theme === 'custom') {
      messages = habit.customMessages;
    } else {
      messages = HABIT_THEMES[habit.theme];
    }
    
    // For milestone days, use special messages
    const milestoneMessage = getMilestoneMessageForHabit(day, habit);
    if (milestoneMessage) {
      return milestoneMessage;
    }
    
    // Otherwise, cycle through theme messages
    return messages[(day - 1) % messages.length];
  }
  
  /**
   * Get special milestone message for significant days for a specific habit
   * @param {number} day - The day count
   * @param {Object} habit - The habit configuration
   * @returns {string|null} Milestone message or null if not a milestone
   */
  function getMilestoneMessageForHabit(day, habit) {
    const milestoneSet = habit.theme === 'sobriety' ? CONFIG.milestones.sobriety : CONFIG.milestones.default;
    
    return milestoneSet[day] || null;
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
   * Get list of available calendar names
   * @returns {string[]} Array of calendar names
   */
  function getAvailableCalendarNames() {
    try {
      return CalendarApp.getAllCalendars().map(cal => cal.getName());
    } catch (error) {
      log(`Error getting calendar names: ${error.message}`);
      return [];
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
    const now = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    const day = new Date(now);
    day.setDate(day.getDate() + offsetDays);
    const start = new Date(day);
    const end = new Date(day);
    end.setDate(end.getDate() + 1);
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
   * Get habit events with fallback for legacy events without description tags
   * @param {Calendar} calendar - The calendar object
   * @param {Date} startOfDay - Start of the day
   * @param {Date} endOfDay - End of the day
   * @param {Object} habit - The habit configuration
   * @returns {Array} Array of habit events
   */
  function getHabitEvents(calendar, startOfDay, endOfDay, habit) {
    const existingEvents = calendar.getEvents(startOfDay, endOfDay);
    
    const taggedEvents = existingEvents.filter(event => 
      event.isAllDayEvent() && 
      event.getDescription() && 
      event.getDescription().includes(`[habit:${habit.id}]`)
    );
    
    if (taggedEvents.length > 0) {
      return taggedEvents;
    }
    
    const legacyEvents = existingEvents.filter(event => 
      event.isAllDayEvent() && 
      event.getTitle().includes("Day") && 
      event.getTitle().includes("–") &&
      event.getTitle().includes(habit.name)
    );
    
    legacyEvents.forEach(event => {
      try {
        const currentDesc = event.getDescription() || '';
        event.setDescription(`${currentDesc} [habit:${habit.id}]`);
        log(`Added habit tag to legacy event: ${event.getTitle()}`);
      } catch (error) {
        log(`Could not add habit tag to legacy event: ${error.message}`);
      }
    });
    
    return legacyEvents;
  }
  
  /**
   * Get current counter value for a specific habit
   * @param {string} habitId - The habit ID
   * @returns {number} Current counter value
   */
  function getCurrentCounterForHabit(habitId) {
    const props = PropertiesService.getScriptProperties();
    return parseInt(props.getProperty(`HABIT_COUNTER_${habitId}`) || "0", 10);
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
    
    for (const habit of CONFIG.habits) {
      const currentCount = getCurrentCounterForHabit(habit.id);
      const startDate = habit.startDate;
      const { start: today } = getDayBounds();
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      
      stats.habits.push({
        id: habit.id,
        name: habit.name,
        currentCount: currentCount,
        startDate: formatDate(startDate),
        daysSinceStart: daysSinceStart,
        theme: habit.theme,
        enabled: habit.enabled,
        manualCounter: habit.manualCounter
      });
    }
    
    return stats;
  }
  
  /**
   * Set custom messages for custom theme for a specific habit
   * @param {string} habitId - The habit ID
   * @param {string[]} messages - Array of custom messages
   */
  function setCustomMessagesForHabit(habitId, messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages must be a non-empty array');
    }
    
    const habit = CONFIG.habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit with id '${habitId}' not found`);
    }
    
    habit.customMessages = messages;
    habit.theme = 'custom';
    log(`Set ${messages.length} custom messages for habit ${habitId}`);
  }
  
  /**
   * Change theme for a specific habit
   * @param {string} habitId - The habit ID
   * @param {string} theme - Theme name: "general", "growth", "sobriety", "minimal", or "custom"
   */
  function changeThemeForHabit(habitId, theme) {
    if (!['general', 'growth', 'sobriety', 'minimal', 'custom'].includes(theme)) {
      throw new Error('theme must be "general", "growth", "sobriety", "minimal", or "custom"');
    }
    
    const habit = CONFIG.habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit with id '${habitId}' not found`);
    }
    
    habit.theme = theme;
    log(`Changed theme for habit ${habitId} to: ${theme}`);
  }
  
  /**
   * Add a new habit to the configuration
   * @param {Object} habitConfig - The habit configuration object
   */
  function addHabit(habitConfig) {
    if (!habitConfig.id || typeof habitConfig.id !== 'string') {
      throw new Error('Habit must have an id');
    }
    
    if (!habitConfig.name || typeof habitConfig.name !== 'string') {
      throw new Error('Habit must have a name');
    }
    
    if (!habitConfig.startDate || !(habitConfig.startDate instanceof Date)) {
      throw new Error('Habit must have a valid startDate');
    }
    
    // Check if habit with this ID already exists
    const existingHabit = CONFIG.habits.find(h => h.id === habitConfig.id);
    if (existingHabit) {
      throw new Error(`Habit with id '${habitConfig.id}' already exists`);
    }
    
    // Set defaults for optional fields
    const newHabit = {
      id: habitConfig.id,
      name: habitConfig.name,
      startDate: habitConfig.startDate,
      manualCounter: habitConfig.manualCounter || null,
      theme: habitConfig.theme || 'general',
      customMessages: habitConfig.customMessages || [],
      enabled: habitConfig.enabled !== undefined ? habitConfig.enabled : true
    };
    
    CONFIG.habits.push(newHabit);
    log(`Added new habit: ${newHabit.name} (${newHabit.id})`);
  }
  
  /**
   * Remove a habit from the configuration
   * @param {string} habitId - The habit ID to remove
   */
  function removeHabit(habitId) {
    const index = CONFIG.habits.findIndex(h => h.id === habitId);
    if (index === -1) {
      throw new Error(`Habit with id '${habitId}' not found`);
    }
    
    const removedHabit = CONFIG.habits.splice(index, 1)[0];
    log(`Removed habit: ${removedHabit.name} (${habitId})`);
  }
  
  /**
   * Enable or disable a habit
   * @param {string} habitId - The habit ID
   * @param {boolean} enabled - Whether to enable or disable the habit
   */
  function setHabitEnabled(habitId, enabled) {
    const habit = CONFIG.habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit with id '${habitId}' not found`);
    }
    
    habit.enabled = enabled;
    log(`${enabled ? 'Enabled' : 'Disabled'} habit: ${habit.name} (${habitId})`);
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
function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Habit Streak')
    .addItem('Create Today’s Event', 'createDailyHabitEvent')
    .addToUi();

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

  const habitEvents = {};
  for (const habit of CONFIG.habits) {
    habitEvents[habit.id] = getHabitEvents(calendar, monday, nextMonday, habit);
  }

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
    
    summaryText += `${habit.name}:\n`;
    summaryText += `• Tracked days: ${tracked}\n`;
    summaryText += `• Missed days: ${missed}\n`;
    summaryText += `• Current streak: ${getCurrentCounterForHabit(habit.id)}\n\n`;
  }

  const resets = calendar
    .getEvents(monday, nextMonday, { search: 'RESET' })
    .filter(ev => ev.isAllDayEvent()).length;
  const skips = calendar
    .getEvents(monday, nextMonday, { search: 'SKIP' })
    .filter(ev => ev.isAllDayEvent()).length;

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

// --- LEGACY / BACKWARDS COMPATIBILITY — DELETE WHEN READY ---

/**
 * Determine the counter value based on configuration and current state (legacy function)
 * @param {Properties} props - Script properties
 * @param {boolean} resetTriggered - Whether a reset was triggered
 * @param {boolean} skipTriggered - Whether a skip was triggered
 * @returns {number} The counter value
 */
function determineCounter(props, resetTriggered, skipTriggered) {
  const habit = CONFIG.habits[0];
  return determineCounterForHabit(props, habit, resetTriggered, skipTriggered);
}

/**
 * Get habit message based on day count and theme (legacy function)
 * @param {number} day - The day count
 * @returns {string} The appropriate message
 */
function getHabitMessage(day) {
  const habit = CONFIG.habits[0];
  return getHabitMessageForHabit(day, habit);
}

/**
 * Get special milestone message for significant days (legacy function)
 * @param {number} day - The day count
 * @returns {string|null} Milestone message or null if not a milestone
 */
function getMilestoneMessage(day) {
  const habit = CONFIG.habits[0];
  return getMilestoneMessageForHabit(day, habit);
}

/**
 * Get current counter value (legacy function)
 * @returns {number} Current counter value
 */
function getCurrentCounter() {
  const habit = CONFIG.habits[0];
  return getCurrentCounterForHabit(habit.id);
}

/**
 * Reset counter to specified value (legacy function)
 * @param {number} newValue - New counter value (default: 0)
 */
function resetCounter(newValue = 0) {
  const habit = CONFIG.habits[0];
  resetCounterForHabit(habit.id, newValue);
}

/**
 * Set custom messages for custom theme (legacy function)
 * @param {string[]} messages - Array of custom messages
 */
function setCustomMessages(messages) {
  const habit = CONFIG.habits[0];
  setCustomMessagesForHabit(habit.id, messages);
}

/**
 * Change theme (legacy function)
 * @param {string} theme - Theme name: "general", "growth", "sobriety", "minimal", or "custom"
 */
function changeTheme(theme) {
  const habit = CONFIG.habits[0];
  changeThemeForHabit(habit.id, theme);
}

/**
 * Get calendar by name with better error handling (legacy function)
 * @param {string} name - Calendar name
 * @returns {Calendar|null} The calendar object or null if not found
 */
function getCalendarByName(name) {
  try {
    return ensureCalendar(name);
  } catch (error) {
    log(`Error getting calendar by name: ${error.message}`);
    return null;
  }
}

/**
 * Get list of available calendar names
 * @returns {string[]} Array of calendar names
 */
function getAvailableCalendarNames() {
  try {
    return CalendarApp.getAllCalendars().map(cal => cal.getName());
  } catch (error) {
    log(`Error getting calendar names: ${error.message}`);
    return [];
  }
}

/** Helper: YYYY‑MM‑DD (legacy function) */
function formatDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy‑MM‑dd');
}

// --- END LEGACY SECTION ---