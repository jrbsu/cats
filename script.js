"use strict";

// --------------------
// Config
// --------------------
const FORMATS = ["days", "months-days", "years-months", "minutes", "seconds"];

const FORMAT_LABEL = {
  "days": "days",
  "months-days": "months and days",
  "years-months": "years and months",
  "minutes": "minutes",
  "seconds": "seconds",
};

const CATS = {
  fresno:  { birthISO: "2024-03-29", initialFormat: "years-months" },
  anaheim: { birthISO: "2024-05-28", initialFormat: "years-months" },
};

// --------------------
// Intl helpers
// --------------------
const nf = new Intl.NumberFormat(undefined);
const pr = new Intl.PluralRules(undefined);

function formatUnit(unit, value) {
  const n = Math.trunc(value);
  const suffix = pr.select(n) === "one" ? "" : "s";
  return `${nf.format(n)} ${unit}${suffix}`;
}

// --------------------
// Date / age helpers (UTC-stable)
// --------------------
const DAY_MS = 24 * 60 * 60 * 1000;

function parseISODateToUTC(iso) {
  // iso = "YYYY-MM-DD"
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function daysInMonthUTC(year, monthIndex0to11) {
  // day 0 of next month = last day of current month
  return new Date(Date.UTC(year, monthIndex0to11 + 1, 0)).getUTCDate();
}

function calculateAgeUTC(birthISO, now = new Date()) {
  const birth = parseISODateToUTC(birthISO);
  if (!birth) {
    return { years: 0, months: 0, days: 0, fullDays: 0, fullMonths: 0, minutes: 0, seconds: 0 };
  }

  // If birth is in the future, clamp to zero-ish.
  if (now.getTime() < birth.getTime()) {
    return { years: 0, months: 0, days: 0, fullDays: 0, fullMonths: 0, minutes: 0, seconds: 0 };
  }

  const nowY = now.getUTCFullYear();
  const nowM = now.getUTCMonth();
  const nowD = now.getUTCDate();

  const birthY = birth.getUTCFullYear();
  const birthM = birth.getUTCMonth();
  const birthD = birth.getUTCDate();

  let years  = nowY - birthY;
  let months = nowM - birthM;
  let days   = nowD - birthD;

  if (days < 0) {
    months -= 1;
    const prevMonthIndex = (nowM - 1 + 12) % 12;
    const prevMonthYear = prevMonthIndex === 11 ? nowY - 1 : nowY;
    days += daysInMonthUTC(prevMonthYear, prevMonthIndex);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const fullMonths = years * 12 + months;

  const utcNowMidnight   = Date.UTC(nowY, nowM, nowD);
  const utcBirthMidnight = Date.UTC(birthY, birthM, birthD);
  const fullDays = Math.floor((utcNowMidnight - utcBirthMidnight) / DAY_MS);

  const ms = now.getTime() - birth.getTime();
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor(ms / 1000);

  return { years, months, days, fullDays, fullMonths, minutes, seconds };
}

// --------------------
// Rendering
// --------------------
function buildRenderPlan(formatKey, age) {
  switch (formatKey) {
    case "days":
      return { yearsText: "", monthsText: "", daysText: formatUnit("day", age.fullDays) };

    case "months-days":
      return {
        yearsText: "",
        monthsText: formatUnit("month", age.fullMonths),
        daysText: formatUnit("day", age.days),
      };

    case "years-months":
      return {
        yearsText: formatUnit("year", age.years),
        monthsText: formatUnit("month", age.months),
        daysText: formatUnit("day", age.days),
      };

    case "minutes":
      return { yearsText: "", monthsText: "", daysText: formatUnit("minute", age.minutes) };

    case "seconds":
      return { yearsText: "", monthsText: "", daysText: formatUnit("second", age.seconds) };

    default:
      return { yearsText: "", monthsText: "", daysText: "" };
  }
}

function nextFormat(current) {
  const i = FORMATS.indexOf(current);
  return FORMATS[(i + 1 + FORMATS.length) % FORMATS.length];
}

// --------------------
// App state + init
// --------------------
const state = {}; // cat -> { birthISO, format, els }

function getEls(cat) {
  return {
    years:  document.getElementById(`${cat}-years`),
    months: document.getElementById(`${cat}-months`),
    days:   document.getElementById(`${cat}-days`),
    toggle: document.getElementById(`toggle-${cat}`),
  };
}

function renderCat(cat) {
  const s = state[cat];
  if (!s) return;

  const age = calculateAgeUTC(s.birthISO);
  const plan = buildRenderPlan(s.format, age);

  // Only write if node exists
  if (s.els.years)  s.els.years.textContent  = plan.yearsText;
  if (s.els.months) s.els.months.textContent = plan.monthsText;
  if (s.els.days)   s.els.days.textContent   = plan.daysText;

  const next = nextFormat(s.format);
  if (s.els.toggle) s.els.toggle.textContent = FORMAT_LABEL[next] ?? next;
}

function tick() {
  for (const cat of Object.keys(state)) renderCat(cat);
}

function toggleCat(cat) {
  const s = state[cat];
  if (!s) return;
  s.format = nextFormat(s.format);
  renderCat(cat);
}

document.addEventListener("DOMContentLoaded", () => {
  for (const [cat, cfg] of Object.entries(CATS)) {
    state[cat] = {
      birthISO: cfg.birthISO,
      format: cfg.initialFormat,
      els: getEls(cat),
    };

    // Hook up button
    if (state[cat].els.toggle) {
      state[cat].els.toggle.addEventListener("click", () => toggleCat(cat));
    }

    // Initial render
    renderCat(cat);
  }

  // Update once per second (needed for seconds/minutes mode)
  setInterval(tick, 1000);
});