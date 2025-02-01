// server.js
const express = require('express');
const moment = require('moment-timezone');
const { google } = require('googleapis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// Constants
const IST_TIMEZONE = 'Asia/Kolkata';
const SLOT_DURATION = 60; // minutes
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
  next();
});

// Initialize Google Calendar API
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

// Test Google Calendar connection on startup
async function testGoogleCalendarConnection() {
  try {
    await calendar.calendarList.list();
    console.log('Successfully connected to Google Calendar API');
  } catch (error) {
    console.error('Failed to connect to Google Calendar API:', {
      error: error.message,
      credentials: {
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Provided' : 'Missing',
        privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Provided' : 'Missing',
        calendarId: process.env.GOOGLE_CALENDAR_ID ? 'Provided' : 'Missing'
      }
    });
  }
}

// Utility function to validate US timezone
function isValidUSTimezone(timezone) {
  const validTimezones = [
    'America/New_York',     // Eastern
    'America/Chicago',      // Central
    'America/Denver',       // Mountain
    'America/Los_Angeles'   // Pacific
  ];
  return validTimezones.includes(timezone);
}

// Convert time between timezones
function convertTime(time, fromTZ, toTZ) {
  return moment(time).tz(fromTZ).clone().tz(toTZ);
}

// Generate available slots
function generateTimeSlots(start, end, timezone) {
  const slots = [];
  const current = moment(start).tz(timezone);
  const endTime = moment(end).tz(timezone);

  while (current.isBefore(endTime)) {
    slots.push(current.format());
    current.add(SLOT_DURATION, 'minutes');
  }
  return slots;
}

/**
 * Check if the desired slot (startTime to endTime) overlaps with any busy intervals.
 *
 * @param {string} startTime - ISO string of the desired slot start time (in IST)
 * @param {string} endTime - ISO string of the desired slot end time (in IST)
 * @returns {Promise<boolean>} - Returns true if the slot is free.
 */
async function checkSlotAvailability(startTime, endTime) {
  try {
    const response = await calendar.freebusy.query({
      resource: {
        timeMin: startTime,
        timeMax: endTime,
        timeZone: IST_TIMEZONE,
        items: [{ id: CALENDAR_ID }]
      }
    });
    const busy = response.data.calendars[CALENDAR_ID].busy;
    console.log('Freebusy query for slot:', { startTime, endTime, busy });

    // Create moment objects for our slot
    const slotStart = moment(startTime);
    const slotEnd = moment(endTime);

    // Check for overlap with any busy interval
    for (const interval of busy) {
      const busyStart = moment(interval.start);
      const busyEnd = moment(interval.end);
      // If the slot overlaps with a busy interval, then it's not available.
      if (slotStart.isBefore(busyEnd) && slotEnd.isAfter(busyStart)) {
        console.log(`Overlap found with busy interval: ${interval.start} - ${interval.end}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check availability endpoint
app.post('/check-availability', async (req, res) => {
  try {
    // Log the raw payload for debugging purposes.
    console.log('Received raw payload in /check-availability:', JSON.stringify(req.body, null, 2));
    
    // Extract dynamic variables from payload.
    // Supports both top-level payload and nested under call.retell_llm_dynamic_variables.
    const dynamicVars = req.body?.call?.retell_llm_dynamic_variables || req.body;
    const timezone = dynamicVars.timeZone || dynamicVars.timezone;
    const startDate = dynamicVars.startDate;
    const endDate = dynamicVars.endDate;

    console.log('Checking availability with extracted variables:', { timezone, startDate, endDate });

    // Validate timezone
    if (!isValidUSTimezone(timezone)) {
      return res.status(400).json({ error: 'Invalid US timezone' });
    }

    // Set default date range if not provided.
    // If startDate and endDate are provided and are the same, adjust the end time to the end of that day.
    const start = startDate ? moment(startDate) : moment();
    let end = endDate ? moment(endDate) : moment().add(14, 'days');
    if (startDate && endDate && start.isSame(end, 'day')) {
      end = moment(endDate).endOf('day');
    }

    // Convert date range to IST for Google Calendar queries
    const startIST = convertTime(start, timezone, IST_TIMEZONE);
    const endIST = convertTime(end, timezone, IST_TIMEZONE);

    console.log('Converted times for calendar query:', {
      startIST: startIST.format(),
      endIST: endIST.format()
    });

    // Get busy slots from Google Calendar
    const busyResponse = await calendar.freebusy.query({
      resource: {
        timeMin: startIST.toISOString(),
        timeMax: endIST.toISOString(),
        timeZone: IST_TIMEZONE,
        items: [{ id: CALENDAR_ID }]
      }
    });
    const busySlots = busyResponse.data.calendars[CALENDAR_ID].busy;
    console.log('Busy slots from calendar:', busySlots);

    // Generate all possible slots in user's timezone
    const allSlots = generateTimeSlots(start, end, timezone);

    // Filter out busy slots
    const availableSlots = await Promise.all(
      allSlots.map(async (slot) => {
        const slotStart = moment(slot);
        const slotEnd = moment(slot).add(SLOT_DURATION, 'minutes');
        const isAvailable = await checkSlotAvailability(
          convertTime(slotStart, timezone, IST_TIMEZONE).toISOString(),
          convertTime(slotEnd, timezone, IST_TIMEZONE).toISOString()
        );
        return isAvailable ? slot : null;
      })
    );

    // Filter out null values and format slots
    const formattedSlots = availableSlots
      .filter(slot => slot !== null)
      .map(slot => ({
        dateTime: slot,
        formatted: moment(slot).format('MMMM D, YYYY h:mm A')
      }));

    console.log(`Found ${formattedSlots.length} available slots`);

    res.json({
      timezone,
      availableSlots: formattedSlots
    });
  } catch (error) {
    console.error('Error in check-availability:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Save booking endpoint
app.post('/save-booking', async (req, res) => {
  try {
    // Log the raw payload for debugging purposes.
    console.log('Received raw payload in /save-booking:', JSON.stringify(req.body, null, 2));

    // Extract dynamic variables from payload.
    // Supports both nested variables and top-level properties.
    const dynamicVars = req.body?.call?.retell_llm_dynamic_variables || req.body;
    const timezone = dynamicVars.timeZone || dynamicVars.timezone;

    // Attempt to extract a full date/time string.
    let selectedDateTime = dynamicVars.selectedDateTime || dynamicVars.selected_date_time;
    // If not found, check if args has separate date and time fields.
    if (!selectedDateTime && req.body.args) {
      const { date, time } = req.body.args;
      if (date && time) {
        // Combine the date and time strings.
        // Adjust the format string below if your input format differs.
        selectedDateTime = moment.tz(`${date} ${time}`, "YYYY-MM-DD hh:mm A", timezone).format();
      }
    }

    console.log('Received booking request with extracted variables:', {
      timezone,
      selectedDateTime,
      parsedDateTime: selectedDateTime ? moment(selectedDateTime).format() : 'undefined'
    });

    // Validate timezone
    if (!isValidUSTimezone(timezone)) {
      return res.status(400).json({ error: 'Invalid US timezone' });
    }

    // Validate selectedDateTime early
    if (!selectedDateTime) {
      return res.status(400).json({ error: 'No appointment time provided. Please select a valid time slot.' });
    }

    // Convert selected time to IST
    const startTimeIST = convertTime(selectedDateTime, timezone, IST_TIMEZONE);
    const endTimeIST = moment(startTimeIST).add(SLOT_DURATION, 'minutes');

    console.log('Converted times for booking:', {
      originalDateTime: selectedDateTime,
      startTimeIST: startTimeIST.format(),
      endTimeIST: endTimeIST.format()
    });

    // Check if slot is still available
    const isAvailable = await checkSlotAvailability(
      startTimeIST.toISOString(),
      endTimeIST.toISOString()
    );

    if (!isAvailable) {
      console.error('Slot not available during booking check:', {
        startTimeIST: startTimeIST.toISOString(),
        endTimeIST: endTimeIST.toISOString()
      });
      return res.status(409).json({ error: 'Selected slot is no longer available' });
    }

    // Create event in Google Calendar
    const event = {
      summary: 'Appointment',
      description: `Booking made from ${timezone}`,
      start: {
        dateTime: startTimeIST.toISOString(),
        timeZone: IST_TIMEZONE
      },
      end: {
        dateTime: endTimeIST.toISOString(),
        timeZone: IST_TIMEZONE
      }
    };

    console.log('Attempting to create event:', event);

    const booking = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event
    });

    console.log('Booking successful:', booking.data);

    res.json({
      success: true,
      booking: {
        id: booking.data.id,
        startTime: startTimeIST.format(),
        endTime: endTimeIST.format(),
        timezone: IST_TIMEZONE
      }
    });
  } catch (error) {
    console.error('Detailed error in save-booking:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    if (error.code === 401 || error.code === 403) {
      res.status(401).json({ error: 'Authentication failed with Google Calendar' });
    } else if (error.code === 404) {
      res.status(404).json({ error: 'Calendar not found' });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testGoogleCalendarConnection();
});
