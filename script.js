"use strict";

// --------------------
// Config
// --------------------
const FORMATS = ["days", "months-days", "years-months", "minutes", "seconds"];

const CATS = {
  fresno:  { birthISO: "2024-03-29", initialFormat: "years-months" },
  anaheim: { birthISO: "2024-05-28", initialFormat: "years-months" },
};

const CAT_IMAGES = {
  fresno: [
    "./assets/bg/fresno-01.jpeg",
    "./assets/bg/fresno-02.jpeg",
    "./assets/bg/fresno-03.jpeg",
    "./assets/bg/fresno-04.jpeg",
  ],
  anaheim: [
    "./assets/bg/anaheim-01.jpeg",
    "./assets/bg/anaheim-02.jpeg",
    "./assets/bg/anaheim-03.jpeg",
    "./assets/bg/anaheim-04.jpeg",
  ],
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
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function daysInMonthUTC(year, monthIndex0to11) {
  return new Date(Date.UTC(year, monthIndex0to11 + 1, 0)).getUTCDate();
}

function calculateAgeUTC(birthISO, now = new Date()) {
  const birth = parseISODateToUTC(birthISO);
  if (!birth || now.getTime() < birth.getTime()) {
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
      return { yearsText: "", monthsText: formatUnit("month", age.fullMonths), daysText: formatUnit("day", age.days) };
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
// Background hover image helpers
// --------------------
let bgEl = null;

function setHoverBackground(url) {
  if (!bgEl || !url) return;
  bgEl.style.backgroundImage = `url("${url}")`;
  document.body.classList.add("has-bg");
}

function clearHoverBackground() {
  document.body.classList.remove("has-bg");
}

function preloadImages() {
  for (const urls of Object.values(CAT_IMAGES)) {
    for (const url of urls) {
      const img = new Image();
      img.src = url;
    }
  }
}

// --------------------
// Toggle button helpers (arrow rotation)
// --------------------
function ensureToggleMarkup(btn) {
  if (!btn) return null;

  btn.classList.add("toggle-btn");

  // Replace contents so we can rotate only the arrow
  btn.innerHTML = `
    <span class="toggle-icon" aria-hidden="true">↻</span>
    <span class="toggle-label">toggle</span>
  `;

  // Rotation state lives in CSS var on the button
  btn.style.setProperty("--rot", "0deg");

  return {
    icon: btn.querySelector(".toggle-icon"),
    label: btn.querySelector(".toggle-label"),
  };
}

function spinButton(btn, deltaDeg = 180) {
  if (!btn) return;
  const cur = btn.style.getPropertyValue("--rot") || "0deg";
  const curNum = Number(String(cur).replace("deg", "")) || 0;
  const next = curNum + deltaDeg;
  btn.style.setProperty("--rot", `${next}deg`);
}

// --------------------
// App state + init
// --------------------
const state = {}; // cat -> { birthISO, format, els, bgIndex, card }

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

  if (s.els.years)  s.els.years.textContent  = plan.yearsText;
  if (s.els.months) s.els.months.textContent = plan.monthsText;
  if (s.els.days)   s.els.days.textContent   = plan.daysText;
}

function tick() {
  for (const cat of Object.keys(state)) renderCat(cat);
}

function toggleCat(cat) {
  const s = state[cat];
  if (!s) return;

  s.format = nextFormat(s.format);
  renderCat(cat);

  if (s.els.toggle) spinButton(s.els.toggle, 180);
}

function nextImageFor(cat) {
  const pool = CAT_IMAGES[cat] || [];
  if (!pool.length) return null;

  const s = state[cat];
  const idx = s.bgIndex % pool.length;
  const url = pool[idx];
  s.bgIndex = (idx + 1) % pool.length;
  return url;
}

document.addEventListener("DOMContentLoaded", () => {
  bgEl = document.getElementById("bg-image");
  preloadImages();

  for (const [cat, cfg] of Object.entries(CATS)) {
    state[cat] = {
      birthISO: cfg.birthISO,
      format: cfg.initialFormat,
      els: getEls(cat),
      bgIndex: 0,
      card: document.querySelector(`.cat-info[data-cat="${cat}"]`),
    };

    // Toggle button setup + click
    if (state[cat].els.toggle) {
      ensureToggleMarkup(state[cat].els.toggle);
      state[cat].els.toggle.addEventListener("click", () => toggleCat(cat));
    }

    if (state[cat].card) {
      state[cat].card.addEventListener("pointerenter", () => {
        const url = nextImageFor(cat);
        if (url) setHoverBackground(url);
      });

      state[cat].card.addEventListener("pointerleave", () => {
        clearHoverBackground();
      });
    }

    renderCat(cat);
  }

  setInterval(tick, 1000);
});
