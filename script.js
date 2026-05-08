// ============================================================
// Leandro Araújo — booking script
// Paste the Apps Script Web App URL below (the one ending in /exec)
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvXSJAL3QP0uPbjQaB3vzZrk8gc0GchvmFDyUrfau6Y440K3IfiqPVrjgFxlexNvjX/exec';

// ============================================================
// Services — keep IDs and durations in sync with apps-script.gs
// ============================================================
const SERVICES = [
  {
    id: 'lawn-mowing',
    name: 'Lawn mowing',
    duration: 90,
    blurb: 'Crisp lines, tidy edges',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 19h18M5 19V13M9 19V11M13 19V14M17 19V12M21 19V15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M3 8C5 5 8 4 12 4C16 4 19 5 21 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'hedge-pruning',
    name: 'Hedge & tree pruning',
    duration: 120,
    blurb: 'Shape, thin, restore',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="7" r="2.5" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="6" cy="17" r="2.5" stroke="currentColor" stroke-width="1.6"/>
      <path d="M8 8.5L20 16M8 15.5L20 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'garden-tidy',
    name: 'Garden tidy-up',
    duration: 60,
    blurb: 'Weeding, raking, refresh',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 21C5 16 8 13 12 13C16 13 19 16 19 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M12 13V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M12 8C12 5.5 14 4 16 4C16 6.5 14 8 12 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M12 8C12 5.5 10 4 8 4C8 6.5 10 8 12 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`
  }
];

const MONTHS_EN = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const DAYS_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ============================================================
// State
// ============================================================
const state = {
  service: null,
  date: null,
  time: null,
  timeLabel: null,
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
};

// ============================================================
// Step 1 — services
// ============================================================
function renderServices() {
  const html = SERVICES.map(s => `
    <button type="button" class="service-card" data-id="${s.id}" aria-label="${s.name}">
      <span class="service-icon">${s.icon}</span>
      <span class="service-info">
        <span class="service-name">${s.name}</span>
        <span class="service-meta">${s.blurb} · ${s.duration} min</span>
      </span>
    </button>
  `).join('');
  document.getElementById('services-grid').innerHTML = html;

  document.querySelectorAll('#services-grid .service-card').forEach(el => {
    el.addEventListener('click', () => {
      state.service = SERVICES.find(s => s.id === el.dataset.id);
      document.querySelectorAll('#services-grid .service-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      setTimeout(() => {
        goToStep('step-date', 2);
        renderCalendar();
      }, 220);
    });
  });
}

// ============================================================
// Step 2 — calendar
// ============================================================
function renderCalendar() {
  const month = state.currentMonth;
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const monthName = `${MONTHS_EN[monthIdx]} ${year}`;

  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = formatDate(today);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoBack = month > thisMonth;

  let html = `
    <div class="month-nav">
      <button id="prev-month" ${canGoBack ? '' : 'disabled'} aria-label="Previous month">← ${MONTHS_EN[monthIdx === 0 ? 11 : monthIdx - 1].slice(0,3)}</button>
      <div class="month-name">${monthName}</div>
      <button id="next-month" aria-label="Next month">${MONTHS_EN[monthIdx === 11 ? 0 : monthIdx + 1].slice(0,3)} →</button>
    </div>
    <div class="calendar-grid">
      ${DAYS_EN.map(d => `<div class="day-header">${d}</div>`).join('')}
      ${Array.from({length: firstDay}, () => '<div class="day empty"></div>').join('')}
  `;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIdx, d);
    const isPast = date < today;
    const isSunday = date.getDay() === 0;
    const disabled = isPast || isSunday;
    const dateStr = formatDate(date);
    const isToday = dateStr === todayStr;
    const classes = ['day'];
    if (disabled) classes.push('disabled');
    if (isToday)  classes.push('today');
    html += `<div class="${classes.join(' ')}" data-date="${dateStr}" role="button" tabindex="${disabled ? -1 : 0}">${d}</div>`;
  }
  html += '</div>';
  document.getElementById('calendar').innerHTML = html;

  document.getElementById('prev-month').addEventListener('click', () => {
    if (!canGoBack) return;
    state.currentMonth = new Date(year, monthIdx - 1, 1);
    renderCalendar();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    state.currentMonth = new Date(year, monthIdx + 1, 1);
    renderCalendar();
  });

  document.querySelectorAll('.day:not(.disabled):not(.empty)').forEach(el => {
    el.addEventListener('click', () => {
      state.date = el.dataset.date;
      document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
      setTimeout(() => {
        goToStep('step-time', 3);
        loadSlots();
      }, 200);
    });
  });
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLong(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const date = new Date(y, m-1, d);
  return date.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ============================================================
// Step 3 — slots
// ============================================================
async function loadSlots() {
  const container = document.getElementById('slots');
  container.innerHTML = '<div class="state-msg"><span class="spinner"></span>Checking the calendar...</div>';

  if (APPS_SCRIPT_URL.startsWith('PASTE_')) {
    container.innerHTML = '<div class="state-msg">Configure the Apps Script URL in <code>script.js</code> to load real availability.</div>';
    return;
  }

  try {
    const url = `${APPS_SCRIPT_URL}?action=getSlots&date=${state.date}&duration=${state.service.duration}`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.error) {
      container.innerHTML = `<div class="state-msg">Couldn't load: ${data.error}</div>`;
      return;
    }
    if (!data.slots || data.slots.length === 0) {
      container.innerHTML = '<div class="state-msg">No times available on this day. Try another date.</div>';
      return;
    }

    container.innerHTML = data.slots.map(s => `
      <button type="button" class="slot" data-iso="${s.iso}" data-time="${s.time}">${s.time}</button>
    `).join('');

    document.querySelectorAll('.slot').forEach(el => {
      el.addEventListener('click', () => {
        state.time = el.dataset.iso;
        state.timeLabel = el.dataset.time;
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        showSummary();
        setTimeout(() => goToStep('step-form', 4), 200);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="state-msg">Connection error: ${err.message}</div>`;
  }
}

function showSummary() {
  document.getElementById('summary').innerHTML = `
    <b>${state.service.name}</b> on <b>${formatDateLong(state.date)}</b> at <b>${state.timeLabel}</b>
  `;
}

// ============================================================
// Step 4 — submit
// ============================================================
document.getElementById('booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Confirming…';

  const fd = new FormData(form);
  const payload = {
    service: state.service.id,
    datetime: state.time,
    name: fd.get('name').trim(),
    phone: fd.get('phone').trim(),
    address: fd.get('address').trim(),
    notes: (fd.get('notes') || '').trim()
  };

  if (APPS_SCRIPT_URL.startsWith('PASTE_')) {
    alert('Please configure APPS_SCRIPT_URL in script.js before submitting.');
    btn.disabled = false; btn.textContent = originalText;
    return;
  }

  try {
    const r = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await r.json();

    if (data.success) {
      document.getElementById('confirmation').innerHTML = `
        Your <b>${state.service.name.toLowerCase()}</b> visit is booked for <b>${data.when}</b>.<br>
        I'll send a quick WhatsApp the day before to confirm.
      `;
      goToStep('step-done', 5);
    } else {
      alert("Couldn't book: " + (data.error || 'please try again'));
      btn.disabled = false; btn.textContent = originalText;
    }
  } catch (err) {
    alert('Connection error: ' + err.message);
    btn.disabled = false; btn.textContent = originalText;
  }
});

// ============================================================
// Navigation + progress
// ============================================================
function goToStep(id, stepNumber) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (stepNumber) updateProgress(stepNumber);
  document.querySelector('.wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress(active) {
  document.querySelectorAll('.progress-step').forEach(s => {
    const step = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (step < active) s.classList.add('done');
    else if (step === active) s.classList.add('active');
  });
}

document.querySelectorAll('button.back').forEach(b => {
  b.addEventListener('click', () => {
    const target = b.dataset.back;
    const stepNum = ({ 'step-service': 1, 'step-date': 2, 'step-time': 3, 'step-form': 4 })[target];
    goToStep(target, stepNum);
  });
});

// Sticky header shadow on scroll
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// ============================================================
// Live availability strip
// ============================================================
async function loadAvailability() {
  const container = document.getElementById('availability-strip');
  if (!container) return;

  if (APPS_SCRIPT_URL.startsWith('PASTE_')) {
    container.innerHTML = '<div class="state-msg">Configure the Apps Script URL to see live availability.</div>';
    return;
  }

  try {
    const r = await fetch(`${APPS_SCRIPT_URL}?action=getAvailability&days=14`);
    const data = await r.json();

    if (data.error || !data.days) {
      container.innerHTML = `<div class="state-msg">Couldn't load availability.</div>`;
      return;
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = formatDate(today);
    const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dowShort    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    container.innerHTML = data.days.map(d => {
      const [y, m, day] = d.date.split('-').map(Number);
      const date = new Date(y, m - 1, day);
      const dow = dowShort[date.getDay()];
      const monthName = monthsShort[date.getMonth()];

      let statusClass, statusLabel;
      if (!d.isWorking) {
        statusClass = 'day-off';
        statusLabel = 'Closed';
      } else if (d.slots === 0) {
        statusClass = 'day-full';
        statusLabel = 'Booked';
      } else if (d.slots <= 3) {
        statusClass = 'day-half';
        statusLabel = `${d.slots} left`;
      } else {
        statusClass = 'day-free';
        statusLabel = `${d.slots} open`;
      }

      const isToday = d.date === todayStr ? ' today' : '';
      const clickable = (statusClass === 'day-free' || statusClass === 'day-half')
        ? `data-date="${d.date}"`
        : '';

      return `
        <div class="day-card ${statusClass}${isToday}" ${clickable} role="${clickable ? 'button' : 'presentation'}" ${clickable ? 'tabindex="0"' : ''}>
          <span class="dow">${dow}</span>
          <span class="num">${day}</span>
          <span class="month">${monthName}</span>
          <span class="status">${statusLabel}</span>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.day-card[data-date]').forEach(el => {
      el.addEventListener('click', () => jumpToBookingWithDate(el.dataset.date));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          jumpToBookingWithDate(el.dataset.date);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="state-msg">Couldn't load availability: ${err.message}</div>`;
  }
}

function jumpToBookingWithDate(dateStr) {
  // If no service selected yet, default to first one (lawn-mowing)
  if (!state.service) state.service = SERVICES[0];

  state.date = dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  state.currentMonth = new Date(y, m - 1, 1);

  // Mark service card as selected (visual sync if user scrolls back)
  document.querySelectorAll('#services-grid .service-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === state.service.id);
  });

  // Scroll to booking and jump to time slot picker
  document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    goToStep('step-time', 3);
    loadSlots();
  }, 400);
}

// Init
renderServices();
loadAvailability();
