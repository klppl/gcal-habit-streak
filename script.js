// === CONFIGURATION ===
const CONFIG = {
    calendarName: "Habits",              // Name of the calendar to use
    habitName: "General Habit",          // Name of your habit (for reference)
    startDate: new Date("2025-01-01"),   // When your habit started (for reference/future use)
    manualCounter: null,                 // Set to a number to override counter (e.g., 42), or null to auto-increment
    enableResetByEvent: true,            // Set to false if you want to disable RESET detection
    enableLogging: true,                 // Enable console logging for debugging
    maxCounterDays: 10000,              // Safety limit to prevent runaway counters
    theme: "general",                    // Theme: "general", "growth", or "custom"
    customMessages: []                   // Array of custom messages for "custom" theme
  };
  // =======================
  
  // Habit themes and their messages
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
   * Main function to create daily habit tracking event
   * @returns {Object} Result object with success status and details
   */
  function createDailyHabitEvent() {
    try {
      // Validate configuration
      validateConfig();
      
      const calendar = getCalendarByName(CONFIG.calendarName);
      if (!calendar) {
        throw new Error(`Calendar '${CONFIG.calendarName}' not found. Available calendars: ${getAvailableCalendarNames().join(', ')}`);
      }
  
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1); // all-day events are exclusive on end date
  
      const props = PropertiesService.getScriptProperties();
  
      // Check if event already exists for today
      const existingEvents = calendar.getEvents(startOfDay, endOfDay);
      const habitEvents = existingEvents.filter(event => 
        event.isAllDayEvent() && event.getTitle().includes("Day") && event.getTitle().includes("–")
      );
      
      if (habitEvents.length > 0) {
        log(`Event already exists for today: ${habitEvents[0].getTitle()}`);
        return {
          success: false,
          message: "Event already exists for today",
          existingEvent: habitEvents[0].getTitle()
        };
      }
  
      // Detect "RESET" event if enabled
      let resetTriggered = false;
      if (CONFIG.enableResetByEvent) {
        resetTriggered = processResetEvents(calendar, startOfDay, endOfDay);
      }
  
      // Determine counter
      const count = determineCounter(props, resetTriggered);
      
      // Validate counter
      if (count > CONFIG.maxCounterDays) {
        throw new Error(`Counter exceeded maximum limit of ${CONFIG.maxCounterDays} days`);
      }
  
      const message = getHabitMessage(count);
      const title = `Day ${count} – ${message}`;
  
      const event = calendar.createAllDayEvent(title, startOfDay, endOfDay);
      props.setProperty("HABIT_COUNTER", count.toString());
      
      log(`Successfully created event: ${title}`);
      
      return {
        success: true,
        message: "Event created successfully",
        dayCount: count,
        eventTitle: title,
        eventId: event.getId()
      };
      
    } catch (error) {
      log(`Error creating event: ${error.message}`);
      console.error(`Error in createDailyHabitEvent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Validate configuration settings
   */
  function validateConfig() {
    if (!CONFIG.calendarName || typeof CONFIG.calendarName !== 'string') {
      throw new Error('Invalid calendarName in configuration');
    }
    
    if (!CONFIG.habitName || typeof CONFIG.habitName !== 'string') {
      throw new Error('Invalid habitName in configuration');
    }
    
    if (CONFIG.manualCounter !== null && (typeof CONFIG.manualCounter !== 'number' || CONFIG.manualCounter < 0)) {
      throw new Error('manualCounter must be null or a non-negative number');
    }
    
    if (typeof CONFIG.enableResetByEvent !== 'boolean') {
      throw new Error('enableResetByEvent must be a boolean');
    }
    
    if (typeof CONFIG.enableLogging !== 'boolean') {
      throw new Error('enableLogging must be a boolean');
    }
    
    if (typeof CONFIG.maxCounterDays !== 'number' || CONFIG.maxCounterDays <= 0) {
      throw new Error('maxCounterDays must be a positive number');
    }
    
    if (!['general', 'growth', 'sobriety', 'minimal', 'custom'].includes(CONFIG.theme)) {
      throw new Error('theme must be "general", "growth", "sobriety", "minimal", or "custom"');
    }
    
    if (CONFIG.theme === 'custom' && (!Array.isArray(CONFIG.customMessages) || CONFIG.customMessages.length === 0)) {
      throw new Error('customMessages must be a non-empty array when theme is "custom"');
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
   * Determine the counter value based on configuration and current state
   * @param {Properties} props - Script properties
   * @param {boolean} resetTriggered - Whether a reset was triggered
   * @returns {number} The counter value
   */
  function determineCounter(props, resetTriggered) {
    if (CONFIG.manualCounter !== null) {
      log(`Using manual counter: ${CONFIG.manualCounter}`);
      return CONFIG.manualCounter;
    }
    
    if (resetTriggered) {
      log('Reset triggered, starting counter at 1');
      return 1;
    }
    
    const currentCount = parseInt(props.getProperty("HABIT_COUNTER") || "0", 10);
    const newCount = currentCount + 1;
    log(`Incrementing counter from ${currentCount} to ${newCount}`);
    return newCount;
  }
  
  /**
   * Get habit message based on day count and theme
   * @param {number} day - The day count
   * @returns {string} The appropriate message
   */
  function getHabitMessage(day) {
    let messages;
    
    if (CONFIG.theme === 'custom') {
      messages = CONFIG.customMessages;
    } else {
      messages = HABIT_THEMES[CONFIG.theme];
    }
    
    // For milestone days, use special messages
    const milestoneMessage = getMilestoneMessage(day);
    if (milestoneMessage) {
      return milestoneMessage;
    }
    
    // Otherwise, cycle through theme messages
    // return messages[day % messages.length];
    return messages[(day - 1) % messages.length];
  }
  
  /**
   * Get special milestone message for significant days
   * @param {number} day - The day count
   * @returns {string|null} Milestone message or null if not a milestone
   */
  function getMilestoneMessage(day) {
    let milestones;
    
    if (CONFIG.theme === 'sobriety') {
      milestones = {
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
      };
    } else {
      milestones = {
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
      };
    }
    
    return milestones[day] || null;
  }
  
  /**
   * Get calendar by name with better error handling
   * @param {string} name - Calendar name
   * @returns {Calendar|null} The calendar object or null if not found
   */
  function getCalendarByName(name) {
    try {
      const calendars = CalendarApp.getAllCalendars();
      return calendars.find(cal => cal.getName() === name) || null;
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
  
  /**
   * Log message if logging is enabled
   * @param {string} message - Message to log
   */
  function log(message) {
    if (CONFIG.enableLogging) {
      console.log(`[HABIT] ${new Date().toISOString()}: ${message}`);
    }
  }
  
  /**
   * Get current counter value
   * @returns {number} Current counter value
   */
  function getCurrentCounter() {
    const props = PropertiesService.getScriptProperties();
    return parseInt(props.getProperty("HABIT_COUNTER") || "0", 10);
  }
  
  /**
   * Reset counter to specified value
   * @param {number} newValue - New counter value (default: 0)
   */
  function resetCounter(newValue = 0) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty("HABIT_COUNTER", newValue.toString());
    log(`Counter reset to ${newValue}`);
  }
  
  /**
   * Get statistics about the tracking
   * @returns {Object} Statistics object
   */
  function getTrackingStats() {
    const props = PropertiesService.getScriptProperties();
    const currentCount = getCurrentCounter();
    const startDate = CONFIG.startDate;
    const today = new Date();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    return {
      currentCount: currentCount,
      habitName: CONFIG.habitName,
      startDate: startDate.toISOString().split('T')[0],
      daysSinceStart: daysSinceStart,
      calendarName: CONFIG.calendarName,
      theme: CONFIG.theme,
      config: {
        manualCounter: CONFIG.manualCounter,
        enableResetByEvent: CONFIG.enableResetByEvent,
        enableLogging: CONFIG.enableLogging
      }
    };
  }
  
  /**
   * Set custom messages for custom theme
   * @param {string[]} messages - Array of custom messages
   */
  function setCustomMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages must be a non-empty array');
    }
    CONFIG.customMessages = messages;
    CONFIG.theme = 'custom';
    log(`Set ${messages.length} custom messages`);
  }
  
  /**
   * Change theme
   * @param {string} theme - Theme name: "general", "growth", "sobriety", "minimal", or "custom"
   */
  function changeTheme(theme) {
    if (!['general', 'growth', 'sobriety', 'minimal', 'custom'].includes(theme)) {
      throw new Error('theme must be "general", "growth", "sobriety", "minimal", or "custom"');
    }
    CONFIG.theme = theme;
    log(`Changed theme to: ${theme}`);
  }

/**
 * Create a SKIP event for today (pause without incrementing counter)
 */
function skipToday() {
  const calendar = getCalendarByName(CONFIG.calendarName);
  if (!calendar) {
    throw new Error(`Calendar '${CONFIG.calendarName}' not found. Available calendars: ${getAvailableCalendarNames().join(', ')}`);
  }
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1); // all-day events are exclusive on end date

  // Check if a SKIP event already exists for today
  const existingEvents = calendar.getEvents(startOfDay, endOfDay);
  const skipEvents = existingEvents.filter(event =>
    event.isAllDayEvent() && event.getTitle().includes("SKIP")
  );
  if (skipEvents.length > 0) {
    log(`SKIP event already exists for today: ${skipEvents[0].getTitle()}`);
    return {
      success: false,
      message: "SKIP event already exists for today",
      existingEvent: skipEvents[0].getTitle()
    };
  }

  const title = `SKIP – Took a day off`;
  const event = calendar.createAllDayEvent(title, startOfDay, endOfDay);
  log(`Created SKIP event: ${title}`);
  return {
    success: true,
    message: "SKIP event created successfully",
    eventTitle: title,
    eventId: event.getId()
  };
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
}
  