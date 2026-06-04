// ============================================================
// Reminders + check-in micro-reviews
// ============================================================
const { useState: useStateR, useEffect: useEffectR } = React;

// time "HH:MM" -> minutes
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const nowMin = (d) => d.getHours() * 60 + d.getMinutes();

// Which time-gated habits are "due" today (deadline passed, not yet checked, not yet resolved)?
function dueReminders(store, now) {
  const key = window.iso(now);
  const rec = store.data[key] || {};
  const resolved = (store.reminders && store.reminders.fired && store.reminders.fired[key]) || [];
  return window.getHabits(store).filter((h) => h.reminderTime && window.isHabitActiveOn(h, now))
    .filter((h) => nowMin(now) >= toMin(h.reminderTime) - 5) // 5-min grace nudge ("before 6:55")
    .filter((h) => !rec[h.id])
    .filter((h) => !resolved.includes(h.id));
}

// ---- Check-in micro-review: enter a metric value when ticking ----
function CheckinReviewModal({ t, habit, initial, onConfirm, onCancel }) {
  const m = habit.metric;
  const [val, setVal] = useStateR(initial != null ? initial : (m ? (m.step >= 1 ? 1 : 0.5) : ''));
  const [woke, setWoke] = useStateR(initial && initial.woke ? initial.woke : '06:50');
  const pal = window.WEEK_PALETTE[habit.colorIdx || 0];
  const accent = t.accent;

  const wrap = { position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 };
  const sheet = { width: 'min(420px,100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 22,
    padding: 28, boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)' };
  const btn = (bg, fg) => ({ padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, background: bg, color: fg, fontFamily: 'Outfit, sans-serif' });

  if (habit.askTime) {
    return (
      <div style={wrap}>
        <div style={sheet}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>{habit.emoji}</div>
          <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 26, color: t.text }}>{habit.askLabel}</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, marginBottom: 22 }}>Logging “{habit.label}” for today.</div>
          <input type="time" value={woke} onChange={(e) => setWoke(e.target.value)} style={{
            width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px',
            color: t.text, fontSize: 22, fontFamily: 'Outfit, sans-serif', outline: 'none', textAlign: 'center' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button style={{ ...btn('transparent', t.textMuted), flex: 1 }} onClick={onCancel}>Cancel</button>
            <button style={{ ...btn(accent, '#fff'), flex: 2 }} onClick={() => onConfirm({ checked: true, wake_time: woke })}>
              {toMin(woke) <= toMin(habit.reminderTime) ? '✓ On time — save' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={sheet}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>{habit.emoji}</div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 26, color: t.text }}>{m.label}</div>
        <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, marginBottom: 22 }}>Quick check-in for “{habit.label}”.</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <button onClick={() => setVal(Math.max(0, +(val - m.step).toFixed(2)))} style={{ width: 48, height: 48, borderRadius: 14,
            border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>−</button>
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: t.text, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{m.unit}</div>
          </div>
          <button onClick={() => setVal(Math.min(m.max, +(val + m.step).toFixed(2)))} style={{ width: 48, height: 48, borderRadius: 14,
            border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>+</button>
        </div>
        <input type="range" min="0" max={m.max} step={m.step} value={val} onChange={(e) => setVal(+e.target.value)}
          style={{ width: '100%', marginTop: 22, accentColor: accent, height: 6 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={{ ...btn('transparent', t.textMuted), flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...btn(accent, '#fff'), flex: 2 }} onClick={() => onConfirm({ checked: true, [m.key]: val })}>Log {val} {m.unit}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Reminder: "Are you up?" deadline nudge ----
function ReminderModal({ t, habit, onConfirmUp, onMissed, onSnooze }) {
  const [stage, setStage] = useStateR('ask'); // 'ask' -> 'time'
  const [woke, setWoke] = useStateR(habit.reminderTime);
  const accent = t.accent;
  const wrap = { position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.78)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20 };
  const sheet = { width: 'min(440px,100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 24,
    padding: 30, boxShadow: '0 50px 120px -30px rgba(0,0,0,0.8)', textAlign: 'center' };
  const btn = (bg, fg) => ({ padding: '13px 22px', borderRadius: 13, border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 600, background: bg, color: fg, fontFamily: 'Outfit, sans-serif' });
  const fmt = (hhmm) => { let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2,'0')} ${ap}`; };
  const nudge = (() => { const mm = toMin(habit.reminderTime) - 5; return `${String(Math.floor(mm/60)).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}`; })();

  return (
    <div style={wrap}>
      <div style={sheet}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: t.accentSoft, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 34, margin: '0 auto 16px', animation: 'pulse 2s ease-in-out infinite' }}>{habit.emoji}</div>
        {stage === 'ask' ? (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>Reminder · due {fmt(habit.reminderTime)}</div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 30, color: t.text, margin: '8px 0' }}>Are you up?</div>
            <div style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
              It's almost {fmt(nudge)} and “{habit.label}” isn't checked yet. If you don't confirm, we'll mark it missed for today.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button style={btn(accent, '#fff')} onClick={() => setStage('time')}>Yes, I'm up 🙌</button>
              <button style={btn(t.surface2, t.text)} onClick={onSnooze}>Snooze 5 min</button>
              <button style={btn('transparent', t.textMuted)} onClick={onMissed}>Not yet — mark missed</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>Nice!</div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 28, color: t.text, margin: '8px 0 4px' }}>What time did you wake up?</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>We'll log it against your “{habit.label}” habit.</div>
            <input type="time" value={woke} onChange={(e) => setWoke(e.target.value)} style={{
              width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '14px 16px',
              color: t.text, fontSize: 26, fontFamily: 'Outfit, sans-serif', outline: 'none', textAlign: 'center' }} />
            <div style={{ fontSize: 13, marginTop: 12, color: toMin(woke) <= toMin(habit.reminderTime) ? '#00C97A' : '#E07B00', fontWeight: 600 }}>
              {toMin(woke) <= toMin(habit.reminderTime) ? `✓ On time — before ${fmt(habit.reminderTime)}` : `Logged after your ${fmt(habit.reminderTime)} target`}
            </div>
            <button style={{ ...btn(accent, '#fff'), width: '100%', marginTop: 20 }} onClick={() => onConfirmUp(woke)}>Save &amp; check off ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.CheckinReviewModal = CheckinReviewModal;
window.ReminderModal = ReminderModal;
window.dueReminders = dueReminders;
window.REM_HELP = { toMin, nowMin };
