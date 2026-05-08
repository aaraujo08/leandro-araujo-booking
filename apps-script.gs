// ============================================================
// Leandro Araújo — Booking backend (Google Apps Script)
// IDs and durations must mirror the SERVICES array in script.js
// ============================================================

const SERVICES = {
  'lawn-mowing':      { name: 'Lawn mowing',           durationMin: 90 },
  'hedge-pruning':    { name: 'Hedge & tree pruning',  durationMin: 120 },
  'garden-tidy':      { name: 'Garden tidy-up',        durationMin: 60 },
  'landscape-design': { name: 'Landscape design',      durationMin: 60 }
};

// Working hours (24h). Slots start on the hour.
const WORK_HOURS = { start: 8, end: 18 };

// Working days (0=Sun, 1=Mon, ..., 6=Sat). Mon–Sat by default.
const WORK_DAYS = [1, 2, 3, 4, 5, 6];

// Timezone — Dublin
const TZ = 'Europe/Dublin';

// 'primary' = your main calendar. To use a separate one,
// open calendar.google.com → Settings → "Calendar ID" → paste here.
const CALENDAR_ID = 'primary';

// ============================================================
// Endpoints
// ============================================================
function doGet(e) {
  try {
    if (e.parameter.action === 'getSlots') {
      return jsonResponse(getAvailableSlots(e.parameter.date, e.parameter.duration));
    }
    return jsonResponse({ error: 'unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return jsonResponse(createBooking(data));
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Logic
// ============================================================
function getAvailableSlots(dateStr, durationMin) {
  const duration = parseInt(durationMin) || 60;
  const date = new Date(dateStr + 'T00:00:00');

  if (!WORK_DAYS.includes(date.getDay())) return { slots: [] };

  const dayStart = new Date(date);
  dayStart.setHours(WORK_HOURS.start, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(WORK_HOURS.end, 0, 0, 0);

  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const events = cal.getEvents(dayStart, dayEnd);
  const busy = events.map(ev => ({
    start: ev.getStartTime().getTime(),
    end:   ev.getEndTime().getTime()
  }));

  const now = new Date();
  const slots = [];
  for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
    const slotStart = new Date(date);
    slotStart.setHours(h, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotEnd > dayEnd) continue;
    if (slotStart < now) continue;

    const conflicts = busy.some(b =>
      slotStart.getTime() < b.end && slotEnd.getTime() > b.start
    );
    if (!conflicts) {
      slots.push({
        time: Utilities.formatDate(slotStart, TZ, 'HH:mm'),
        iso:  slotStart.toISOString()
      });
    }
  }

  return { slots: slots };
}

function createBooking(data) {
  const service  = data.service;
  const datetime = data.datetime;
  const name     = data.name;
  const phone    = data.phone;
  const address  = data.address;
  const notes    = data.notes;

  if (!service || !datetime || !name || !phone || !address) {
    return { success: false, error: 'Missing required fields' };
  }
  const svc = SERVICES[service];
  if (!svc) return { success: false, error: 'Unknown service' };

  const start = new Date(datetime);
  const end   = new Date(start.getTime() + svc.durationMin * 60000);

  const cal = CalendarApp.getCalendarById(CALENDAR_ID);

  // Re-check availability (anti race-condition)
  const conflicts = cal.getEvents(start, end);
  if (conflicts.length > 0) {
    return { success: false, error: 'That slot was just booked — please pick another' };
  }

  const title = svc.name + ' — ' + name;
  const description = [
    'Service: '  + svc.name,
    'Client: '   + name,
    'Phone: '    + phone,
    'Address: '  + address,
    notes ? 'Notes: ' + notes : ''
  ].filter(Boolean).join('\n');

  const event = cal.createEvent(title, start, end, {
    description: description,
    location: address
  });

  return {
    success: true,
    eventId: event.getId(),
    when: Utilities.formatDate(start, TZ, "EEEE d MMMM 'at' HH:mm")
  };
}

// ============================================================
// Manual test helpers (run from the Apps Script editor)
// ============================================================
function _testGetSlots() {
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  Logger.log(getAvailableSlots(today, 60));
}

function _testCreateBooking() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  Logger.log(createBooking({
    service: 'lawn-mowing',
    datetime: tomorrow.toISOString(),
    name: 'Test Client',
    phone: '+353 87 000 0000',
    address: '1 Test Lane, Dublin'
  }));
}
