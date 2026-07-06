// ============================================================
// DailyStack — data layer: tokens, habits, helpers, storage
// ============================================================

// ---- Theme tokens (from spec, elevated) ----
const THEME = {
  dark: {
    bg: '#090B18', surface: '#0D0F22', surface2: '#11142E',
    border: '#1A1E3A', border2: '#242850',
    text: '#DDE1FF', textMuted: '#5A60A0', textDim: '#2E3462',
    accent: '#5B54E8', accentSoft: '#5B54E822',
    shadow: '0 18px 50px -20px rgba(0,0,0,0.8)',
  },
  light: {
    bg: '#F4F3FF', surface: '#FFFFFF', surface2: '#EEEEFF',
    border: '#D8D6F8', border2: '#C0BEF0',
    text: '#1A1840', textMuted: '#6860B8', textDim: '#A098D8',
    accent: '#5B54E8', accentSoft: '#5B54E818',
    shadow: '0 18px 50px -28px rgba(91,84,232,0.35)',
  },
};

// ---- Week colour palette (invariant across themes) ----
const WEEK_PALETTE = [
  { name: 'Purple', bg: '#5B54E8', light: '#9B95FF', dim: '#1A1840' },
  { name: 'Teal',   bg: '#00B4CC', light: '#40D4EC', dim: '#00303A' },
  { name: 'Pink',   bg: '#D4156E', light: '#F060A0', dim: '#3A0020' },
  { name: 'Green',  bg: '#00C97A', light: '#40E89A', dim: '#003822' },
  { name: 'Amber',  bg: '#E07B00', light: '#F5A840', dim: '#3A2000' },
];

const CAT_LABEL = { body: 'Body', work: 'Work', spirit: 'Spirit', mind: 'Mind' };

// ---- Active habit set (v1.0) + new metadata for reminders & check-in metrics ----
// metric: prompts a micro-review when checked. reminderTime: deadline for time-gated nudge.
const HABITS = [
  { id: 'sleep',        label: 'Bed by Midnight',   emoji: '🌙', category: 'body',   everyDay: true,  reminderTime: '00:00' },
  { id: 'wake',         label: 'Wake by 7AM',       emoji: '🌅', category: 'body',   everyDay: true,  reminderTime: '07:00',
    askTime: true, askLabel: 'What time did you wake up?' },
  { id: 'deep_work',    label: 'Deep Work Block',   emoji: '🎯', category: 'work',   everyDay: true,
    metric: { key: 'deep_work_hrs', unit: 'hrs', label: 'Hours of deep work', step: 0.5, max: 8 } },
  { id: 'applications', label: 'Job Applications',  emoji: '📨', category: 'work',   everyDay: true,
    metric: { key: 'applications_n', unit: 'sent', label: 'Applications sent', step: 1, max: 20 } },
  { id: 'exercise',     label: 'Exercise',          emoji: '🏃', category: 'body',   everyDay: true,
    metric: { key: 'exercise_km', unit: 'km', label: 'Distance covered', step: 0.5, max: 30 } },
  { id: 'water',        label: 'Water Intake',      emoji: '💧', category: 'body',   everyDay: true,
    metric: { key: 'water_l', unit: 'L', label: 'Litres of water', step: 0.25, max: 5 } },
  { id: 'no_phone',     label: 'No-Phone Morning',  emoji: '📵', category: 'mind',   everyDay: true,  reminderTime: '09:00' },
  { id: 'sabbath_prep', label: 'Sabbath Prep',      emoji: '🕯️', category: 'spirit', everyDay: false, dayOfWeek: 4 },
  { id: 'weekly_review',label: 'Weekly Review',     emoji: '📝', category: 'mind',   everyDay: false, dayOfWeek: 4 },
];

// ---- Date helpers ----
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// ISO Monday-origin weekday: 0=Mon ... 6=Sun
const getDow = (d) => (d.getDay() + 6) % 7;
const DOW_ABBR = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isHabitActiveOn(habit, date) {
  return habit.everyDay === true || getDow(date) === habit.dayOfWeek;
}

// ---- Merged habit list: built-in set + any user/goal-added custom habits ----
function getHabits(store) {
  return [...HABITS, ...((store && store.customHabits) || [])];
}

// ---- Onboarding goal presets: each picks a goal AND the habits it installs ----
// Picking one on first run creates the goal and adds its habits to the tracker.
const GOAL_PRESETS = [
  { id: 'fitness', emoji: '🏃', title: 'Get fitter', tag: 'Body', colorIdx: 3, duration: 60,
    blurb: 'Move every day and build endurance toward a 10K.',
    smart: { specific: 'Build a consistent movement habit and run a continuous 10K',
      measurable: '10 km continuous · 5 sessions / week', achievable: 'Add ~1 km each week',
      realistic: 'Start from a comfortable base and progress slowly', timebound: '60 days' },
    habits: [
      { label: 'Daily Movement', emoji: '🏃', category: 'body',
        metric: { key: 'move_km', unit: 'km', label: 'Distance covered', step: 0.5, max: 30 } },
      { label: 'Stretch & Mobility', emoji: '🧘', category: 'body' },
    ] },
  { id: 'mind', emoji: '📖', title: 'Read more', tag: 'Mind', colorIdx: 0, duration: 30,
    blurb: 'Finish a book by reading a little every night.',
    smart: { specific: 'Read one book cover to cover', measurable: '1 book · ~25 min / night',
      achievable: 'A short, distraction-free evening session', realistic: 'Most evenings are free after dinner',
      timebound: '30 days' },
    habits: [
      { label: 'Read 25 min', emoji: '📖', category: 'mind' },
      { label: 'No-Phone Wind-down', emoji: '📵', category: 'mind', reminderTime: '22:00' },
    ] },
  { id: 'hydrate', emoji: '💧', title: 'Stay hydrated', tag: 'Body', colorIdx: 1, duration: 30,
    blurb: 'Hit 2 L of water and sleep on time, daily.',
    smart: { specific: 'Drink enough water and keep a steady sleep schedule',
      measurable: '2 L water · lights out by midnight', achievable: 'A bottle on the desk + a wind-down alarm',
      realistic: 'No new gear needed', timebound: '30 days' },
    habits: [
      { label: 'Water Intake', emoji: '💧', category: 'body',
        metric: { key: 'water_l', unit: 'L', label: 'Litres of water', step: 0.25, max: 5 } },
      { label: 'Bed by Midnight', emoji: '🌙', category: 'body', reminderTime: '00:00' },
    ] },
  { id: 'career', emoji: '🎯', title: 'Land a new role', tag: 'Work', colorIdx: 2, duration: 60,
    blurb: 'Apply consistently and protect deep-work time.',
    smart: { specific: 'Run a focused job search with daily deep work',
      measurable: '50 applications · 2 hrs deep work / day', achievable: 'Two protected blocks each morning',
      realistic: 'Pipeline already started', timebound: '60 days' },
    habits: [
      { label: 'Deep Work Block', emoji: '🎯', category: 'work',
        metric: { key: 'deep_work_hrs', unit: 'hrs', label: 'Hours of deep work', step: 0.5, max: 8 } },
      { label: 'Job Applications', emoji: '📨', category: 'work',
        metric: { key: 'applications_n', unit: 'sent', label: 'Applications sent', step: 1, max: 20 } },
    ] },
  { id: 'mindful', emoji: '🧠', title: 'Calmer mind', tag: 'Mind', colorIdx: 4, duration: 30,
    blurb: 'Meditate daily and keep a gratitude note.',
    smart: { specific: 'Build a short daily mindfulness practice',
      measurable: '10 min meditation · 1 gratitude note / day', achievable: 'First thing after waking',
      realistic: 'Ten minutes is realistic on any day', timebound: '30 days' },
    habits: [
      { label: 'Meditate 10 min', emoji: '🧘‍♀️', category: 'spirit',
        metric: { key: 'meditate_min', unit: 'min', label: 'Minutes meditated', step: 5, max: 60 } },
      { label: 'Gratitude Note', emoji: '🙏', category: 'spirit' },
    ] },
  { id: 'earlybird', emoji: '🌅', title: 'Win the morning', tag: 'Body', colorIdx: 3, duration: 30,
    blurb: 'Wake by 7 and keep a phone-free first hour.',
    smart: { specific: 'Establish an early, intentional morning routine',
      measurable: 'Up by 7:00 AM · phone-free until 8:00', achievable: 'Move the alarm across the room',
      realistic: 'Builds on an existing wake time', timebound: '30 days' },
    habits: [
      { label: 'Wake by 7AM', emoji: '🌅', category: 'body', reminderTime: '07:00',
        askTime: true, askLabel: 'What time did you wake up?' },
      { label: 'No-Phone Morning', emoji: '📵', category: 'mind', reminderTime: '09:00' },
    ] },
];

// Build a real, storable habit from a preset's habit definition (stable id from label).
let __customSeq = 0;
function makeCustomHabit(def) {
  const slug = (def.label || 'habit').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  __customSeq += 1;
  return { id: `c_${slug}_${Date.now().toString(36)}${__customSeq}`, everyDay: true, ...def, custom: true };
}

function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

function daysBetween(aISO, bDate) {
  const a = parseISO(aISO);
  return Math.max(0, Math.floor((bDate - a) / 86400000));
}

// Build weeks (Mon-origin) covering a month, including spill days.
function monthWeeks(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - getDow(first));
  const last = new Date(year, month + 1, 0);
  const weeks = [];
  let cur = new Date(start);
  while (cur <= last || getDow(cur) !== 0) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(week);
    if (weeks.length > 6) break;
  }
  return weeks;
}

// ---- Persistence (single localStorage key, per spec) ----
const STORE_KEY = 'ht_v4';
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { data: {}, goals: [], customHabits: [], onboarded: false, mode: 'dark', reminders: { fired: {}, settings: {} } };
}
function persist(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
}

function seedIfEmpty(store) { return store; }

Object.assign(window, {
  THEME, WEEK_PALETTE, HABITS, CAT_LABEL, DOW_ABBR, MONTHS,
  GOAL_PRESETS, getHabits, makeCustomHabit,
  pad, iso, getDow, isHabitActiveOn, parseISO, daysBetween, monthWeeks,
  STORE_KEY, loadStore, persist, seedIfEmpty,
});
