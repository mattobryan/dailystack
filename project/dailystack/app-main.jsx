// ============================================================
// HabitTracker — root: tabs, theme, persistence, reminder logic
// ============================================================
const { useState, useEffect, useMemo } = React;

const TABS = [
  { key: 'grid', label: 'Monthly Grid' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'trackers', label: 'Daily Trackers' },
  { key: 'goals', label: 'Goals' },
];

// ---- mobile bottom-nav destinations ----
const MTABS = [
  { key: 'grid', label: 'Week', icon: 'cal' },
  { key: 'analysis', label: 'Insights', icon: 'chart' },
  { key: 'trackers', label: 'Today', icon: 'check' },
  { key: 'goals', label: 'Goals', icon: 'target' },
];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function fmtLong(d) { return `${WEEKDAYS[d.getDay()]}, ${window.MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`; }

function MTabIcon({ name, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'cal') return (<svg width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2.5" {...p} /><path d="M3 9h18M8 2.5v4M16 2.5v4" {...p} /></svg>);
  if (name === 'chart') return (<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6" {...p} /></svg>);
  if (name === 'check') return (<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path d="M8.5 12.2l2.4 2.4 4.6-5" {...p} /></svg>);
  return (<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" {...p} /><circle cx="12" cy="12" r="4" {...p} /><circle cx="12" cy="12" r="0.7" fill={color} stroke="none" /></svg>);
}

function MobileTabBar({ t, tab, setTab, accent, bottomInset }) {
  return (
    <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: `${t.surface}f5`,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: `1px solid ${t.border}`,
      paddingBottom: bottomInset, display: 'flex' }}>
      {MTABS.map((it) => {
        const on = tab === it.key; const col = on ? accent : t.textMuted;
        return (
          <button key={it.key} onClick={() => setTab(it.key)} aria-label={it.label} style={{ flex: 1, border: 'none',
            background: 'transparent', cursor: 'pointer', padding: '9px 0 7px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, position: 'relative' }}>
            {on && <div style={{ position: 'absolute', top: 0, width: 26, height: 3, borderRadius: 3, background: accent }} />}
            <MTabIcon name={it.icon} color={col} />
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: col }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileHeader({ t, mode, toggleMode, onBell, dueCount, todayPct, doneToday, activeCount, tab, weekStart, today, goalsCount }) {
  const R = 15, C = 2 * Math.PI * R;
  let title, sub;
  if (tab === 'grid') { title = 'This week'; sub = fmtLong(today); }
  else if (tab === 'analysis') { title = 'Insights'; sub = 'Last 30 days'; }
  else if (tab === 'trackers') { title = 'Today'; sub = fmtLong(today); }
  else { title = 'Goals'; sub = `${goalsCount} active goal${goalsCount !== 1 ? 's' : ''}`; }
  const iconBtn = { width: 38, height: 38, borderRadius: 11, border: `1px solid ${t.border}`, background: t.surface,
    cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' };
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: `${t.bg}f2`, backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${t.border}`, padding: '12px 16px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: t.accent, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: `0 5px 14px -4px ${t.accent}` }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, border: '2px solid #fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 19 }}>DailyStack</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onBell} style={iconBtn} aria-label="Reminders">🔔{dueCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 8, background: '#D4156E', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dueCount}</span>}</button>
          <button onClick={toggleMode} style={iconBtn} aria-label="Toggle theme">{mode === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 32, lineHeight: 1.04, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg width="38" height="38" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="19" cy="19" r={R} fill="none" stroke={t.surface2} strokeWidth="3.5" />
            <circle cx="19" cy="19" r={R} fill="none" stroke={t.accent} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - todayPct / 100)} style={{ transition: 'stroke-dashoffset .6s' }} />
          </svg>
          <div style={{ whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{todayPct}%</div>
            <div style={{ fontSize: 10.5, color: t.textMuted }}>{doneToday}/{activeCount}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HabitTracker() {
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') || 'grid';
  const autoRemind = params.get('autoremind') !== '0';
  const forceRemind = params.get('demo') === 'reminder';
  const forceOnboard = params.get('onboard') === '1';
  const forceWeek = params.get('week') === '1';
  const platform = params.get('platform'); // 'ios' | 'android' | null — tunes safe-area insets
  const bottomInset = platform === 'ios' ? 26 : platform === 'android' ? 8 : 12;
  const [store, setStore] = useState(() => window.seedIfEmpty(window.loadStore()));
  const [tab, setTab] = useState(TABS.some((x) => x.key === initialTab) ? initialTab : 'grid');
  // theme overrides driven by the showcase Tweaks panel (query param + live postMessage)
  const [modeOv, setModeOv] = useState(params.get('mode') || null);
  const [accentOv, setAccentOv] = useState(params.get('accent') ? '#' + params.get('accent').replace('#', '') : null);
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type !== 'ds-tweak') return;
      if (d.mode) setModeOv(d.mode);
      if (d.accent) setAccentOv(d.accent);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => window.startOfWeek(new Date()));
  const [now, setNow] = useState(() => new Date());
  // phone-first: narrow viewports get the paginated week-by-week grid
  const [narrow, setNarrow] = useState(() => (params.get('mobile') === '1') || (typeof window !== 'undefined' ? window.innerWidth < 680 : false));
  useEffect(() => {
    if (params.get('mobile') === '1') return;
    const onResize = () => setNarrow(window.innerWidth < 680);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [checkPrompt, setCheckPrompt] = useState(null); // {habit, dateKey, initial}
  const [reminder, setReminder] = useState(null);       // {habit}
  const [snoozed, setSnoozed] = useState([]);
  const [onboardOpen, setOnboardOpen] = useState(() => forceOnboard || (!store.onboarded && Object.keys(store.data || {}).length === 0));

  const today = now;
  const mode = modeOv || store.mode;
  const baseT = window.THEME[mode];
  const t = accentOv ? { ...baseT, accent: accentOv, accentSoft: accentOv + (mode === 'dark' ? '22' : '18') } : baseT;

  // single write path
  const save = (next) => { setStore(next); window.persist(next); };
  const update = (key, patch) => {
    const next = { ...store, data: { ...store.data, [key]: { ...(store.data[key] || {}), ...patch } } };
    save(next);
  };

  // ---- toggle a habit cell ----
  const onToggle = (habit, key, date) => {
    const rec = store.data[key] || {};
    if (rec[habit.id]) {
      // uncheck: clear value + missed flag
      const nr = { ...rec }; delete nr[habit.id];
      if (habit.metric) delete nr[habit.metric.key];
      if (habit.id === 'wake') delete nr.wake_time;
      nr.__missed = (nr.__missed || []).filter((x) => x !== habit.id);
      save({ ...store, data: { ...store.data, [key]: nr } });
      return;
    }
    // checking — if metric or askTime, open micro-review
    if (habit.metric || habit.askTime) { setCheckPrompt({ habit, dateKey: key }); return; }
    update(key, { [habit.id]: true, __missed: (rec.__missed || []).filter((x) => x !== habit.id) });
  };

  // ---- resolve reminder helpers ----
  const markResolved = (next, key, habitId) => {
    const fired = { ...(next.reminders?.fired || {}) };
    fired[key] = [...(fired[key] || []), habitId];
    next.reminders = { ...(next.reminders || {}), fired };
    return next;
  };

  // ---- reminder polling (demo: checks every few seconds) ----
  useEffect(() => {
    if (!autoRemind && !forceRemind) return;
    const tick = () => {
      const n = new Date(); setNow(n);
      if (reminder || checkPrompt) return;
      const due = window.dueReminders(store, n).filter((h) => !snoozed.includes(h.id));
      if (due.length) setReminder({ habit: due[0] });
    };
    const id = setInterval(tick, 4000);
    const f = setTimeout(tick, forceRemind ? 200 : 800); // initial fire
    return () => { clearInterval(id); clearTimeout(f); };
  }, [store, reminder, checkPrompt, snoozed]);

  const addGoal = (g) => save({ ...store, goals: [g, ...store.goals] });
  // create a goal and (optionally) install brand-new habits it should track
  const addGoalWithHabits = (g, newHabits = []) => {
    const built = newHabits.map((def) => window.makeCustomHabit(def));
    const linked = [...(g.linkedHabits || []), ...built.map((h) => h.id)];
    save({
      ...store,
      customHabits: [...(store.customHabits || []), ...built],
      goals: [{ ...g, linkedHabits: linked, standalone: linked.length === 0 }, ...store.goals],
    });
  };
  const deleteGoal = (id) => save({ ...store, goals: store.goals.filter((x) => x.id !== id) });
  // finish first-run onboarding: install chosen presets as goals + habits
  const completeOnboarding = (selected) => {
    let custom = [...(store.customHabits || [])];
    const goals = [];
    selected.forEach((preset) => {
      const built = (preset.habits || []).map((def) => {
        // reuse a matching custom habit if one already exists (by label)
        const existing = custom.find((h) => h.label === def.label);
        if (existing) return existing;
        const h = window.makeCustomHabit(def); custom.push(h); return h;
      });
      goals.push({
        id: `${Date.now()}_${preset.id}`, title: preset.title, description: preset.blurb,
        smart: preset.smart, duration: preset.duration, startDate: window.iso(new Date()),
        linkedHabits: built.map((h) => h.id), colorIdx: preset.colorIdx, standalone: false,
      });
    });
    save({ ...store, customHabits: custom, goals: [...goals, ...store.goals], onboarded: true });
    setOnboardOpen(false);
  };
  const skipOnboarding = () => { save({ ...store, onboarded: true }); setOnboardOpen(false); };
  const toggleMode = () => { const m = mode === 'dark' ? 'light' : 'dark'; setModeOv(m); save({ ...store, mode: m }); };

  // today summary ring
  const todayKey = window.iso(today);
  const todayRec = store.data[todayKey] || {};
  const activeToday = window.getHabits(store).filter((h) => window.isHabitActiveOn(h, today));
  const doneToday = activeToday.filter((h) => todayRec[h.id]).length;
  const todayPct = activeToday.length ? Math.round((doneToday / activeToday.length) * 100) : 0;
  const dueCount = window.dueReminders(store, now).length;

  const monthName = window.MONTHS[viewDate.getMonth()];
  const navMonth = (delta) => { const d = new Date(viewDate); d.setMonth(d.getMonth() + delta); setViewDate(d); };

  const R = 17, C = 2 * Math.PI * R;

  return (
    <div style={{ minHeight: '100%', background: t.bg, color: t.text, fontFamily: 'Outfit, sans-serif',
      transition: 'background .3s, color .3s', display: 'flex', flexDirection: 'column' }}>
      {/* ---- desktop / tablet header ---- */}
      {!narrow && (
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: `${t.bg}f2`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${t.border}`, padding: '14px clamp(16px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: t.accent, display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: `0 6px 18px -4px ${t.accent}` }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: '2.5px solid #fff' }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700, fontSize: 23, lineHeight: 1 }}>DailyStack</div>
              <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.textMuted, marginTop: 1 }}>Habit &amp; Life Tracker</div>
            </div>
          </div>

          {/* today ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 4 }}>
            <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r={R} fill="none" stroke={t.surface2} strokeWidth="4" />
              <circle cx="20" cy="20" r={R} fill="none" stroke={t.accent} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - todayPct / 100)} style={{ transition: 'stroke-dashoffset .6s' }} />
            </svg>
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{todayPct}% today</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>{doneToday}/{activeToday.length} habits</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* reminder bell */}
          <button onClick={() => { const due = window.dueReminders(store, now); if (due.length) setReminder({ habit: due[0] }); }}
            title="Reminders" style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, border: `1px solid ${t.border}`,
              background: t.surface, cursor: 'pointer', fontSize: 18 }}>
            🔔
            {dueCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px',
              borderRadius: 9, background: '#D4156E', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.6s infinite' }}>{dueCount}</span>}
          </button>

          {/* theme toggle */}
          <button onClick={toggleMode} title="Toggle theme" style={{ width: 40, height: 40, borderRadius: 11,
            border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer', fontSize: 17 }}>
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14, overflowX: 'auto' }}>
          {TABS.map((tb) => {
            const on = tab === tb.key;
            return (
              <button key={tb.key} onClick={() => setTab(tb.key)} style={{
                padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: 13.5, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                background: on ? t.accent : 'transparent', color: on ? '#fff' : t.textMuted,
                transition: 'all .15s' }}>{tb.label}</button>
            );
          })}
        </div>
      </header>
      )}

      {/* ---- mobile header ---- */}
      {narrow && (
        <MobileHeader t={t} mode={mode} toggleMode={toggleMode} dueCount={dueCount}
          onBell={() => { const due = window.dueReminders(store, now); if (due.length) setReminder({ habit: due[0] }); }}
          todayPct={todayPct} doneToday={doneToday} activeCount={activeToday.length}
          tab={tab} weekStart={weekStart} today={today} goalsCount={store.goals.length} />
      )}

      {/* ---- panels ---- */}
      <main style={{ flex: 1, padding: narrow ? `16px 14px ${84 + bottomInset}px` : 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 36px)', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        {tab === 'grid' && (
          <div>
            {(narrow || forceWeek) ? (
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: 16, boxShadow: t.shadow }}>
                <window.WeekGrid t={t} store={store} weekStart={weekStart} setWeekStart={setWeekStart} onToggle={onToggle} today={today} />
              </div>
            ) : (
              <React.Fragment>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                  <h1 style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(30px,4vw,42px)', margin: 0 }}>
                    {monthName} <span style={{ color: t.textMuted, fontStyle: 'normal', fontSize: '0.6em', fontWeight: 400 }}>{viewDate.getFullYear()}</span>
                  </h1>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => navMonth(-1)} style={navBtn(t)}>‹</button>
                    <button onClick={() => { setViewDate(new Date()); }} style={{ ...navBtn(t), width: 'auto', padding: '0 14px', fontSize: 13 }}>Today</button>
                    <button onClick={() => navMonth(1)} style={navBtn(t)}>›</button>
                  </div>
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: 20, boxShadow: t.shadow, overflow: 'hidden' }}>
                  <window.GridPanel t={t} store={store} viewDate={viewDate} setViewDate={setViewDate} onToggle={onToggle} today={today} />
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <span>● Tap a cell to check in</span>
                  <span>◌ Today shows an inset ring</span>
                  <span>⨯ Dashed = missed reminder</span>
                  <span>Friday-only habits dim on other days</span>
                </div>
              </React.Fragment>
            )}
          </div>
        )}
        {tab === 'analysis' && <window.AnalysisPanel t={t} store={store} today={today} narrow={narrow} />}
        {tab === 'trackers' && <window.TrackersPanel t={t} store={store} today={today} update={update} narrow={narrow} />}
        {tab === 'goals' && <window.GoalsPanel t={t} store={store} addGoalWithHabits={addGoalWithHabits} deleteGoal={deleteGoal} />}
      </main>

      {/* ---- mobile bottom nav ---- */}
      {narrow && <MobileTabBar t={t} tab={tab} setTab={setTab} accent={t.accent} bottomInset={bottomInset} />}

      {/* ---- first-run onboarding ---- */}
      {onboardOpen && (
        <window.Onboarding t={t} onComplete={completeOnboarding} onSkip={skipOnboarding} />
      )}

      {/* ---- check-in micro-review ---- */}
      {checkPrompt && (
        <window.CheckinReviewModal t={t} habit={checkPrompt.habit} initial={checkPrompt.initial}
          onCancel={() => setCheckPrompt(null)}
          onConfirm={(patch) => {
            const key = checkPrompt.dateKey; const rec = store.data[key] || {};
            const clean = { ...patch, __missed: (rec.__missed || []).filter((x) => x !== checkPrompt.habit.id) };
            update(key, clean); setCheckPrompt(null);
          }} />
      )}

      {/* ---- reminder nudge ---- */}
      {reminder && (
        <window.ReminderModal t={t} habit={reminder.habit}
          onSnooze={() => { setSnoozed((s) => [...s, reminder.habit.id]); setReminder(null);
            setTimeout(() => setSnoozed((s) => s.filter((x) => x !== reminder.habit.id)), 8000); }}
          onMissed={() => {
            const key = window.iso(now); const rec = store.data[key] || {};
            let next = { ...store, data: { ...store.data, [key]: { ...rec, [reminder.habit.id]: false,
              __missed: [...new Set([...(rec.__missed || []), reminder.habit.id])] } } };
            next = markResolved(next, key, reminder.habit.id); save(next); setReminder(null);
          }}
          onConfirmUp={(woke) => {
            const key = window.iso(now); const rec = store.data[key] || {};
            const patch = { [reminder.habit.id]: true };
            if (reminder.habit.id === 'wake') patch.wake_time = woke;
            patch.__missed = (rec.__missed || []).filter((x) => x !== reminder.habit.id);
            let next = { ...store, data: { ...store.data, [key]: { ...rec, ...patch } } };
            next = markResolved(next, key, reminder.habit.id); save(next); setReminder(null);
          }} />
      )}
    </div>
  );
}

function navBtn(t) {
  return { width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface,
    color: t.text, cursor: 'pointer', fontSize: 18, fontFamily: 'Outfit, sans-serif', lineHeight: 1 };
}

window.HabitTracker = HabitTracker;
