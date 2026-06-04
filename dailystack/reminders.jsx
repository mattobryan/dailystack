// ============================================================
// Reminders + check-in micro-reviews + reflection + retrospective
// ============================================================
const { useState: useStateR, useEffect: useEffectR } = React;

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const nowMin = (d) => d.getHours() * 60 + d.getMinutes();

// ---- time-gated habit reminders (existing) ----
function dueReminders(store, now) {
  const key = window.iso(now);
  const rec = store.data[key] || {};
  const resolved = (store.reminders && store.reminders.fired && store.reminders.fired[key]) || [];
  return window.getHabits(store).filter((h) => h.reminderTime && window.isHabitActiveOn(h, now))
    .filter((h) => nowMin(now) >= toMin(h.reminderTime) - 5)
    .filter((h) => !rec[h.id])
    .filter((h) => !resolved.includes(h.id));
}

// ---- missed-habit reflections: yesterday's unchecked habits + today's at 23:30 ----
function dueReflections(store, now) {
  const HABITS = window.getHabits(store);
  const results = [];
  const check = (d) => {
    const key = window.iso(d);
    const rec = store.data[key] || {};
    const done = rec.reflections || {};
    HABITS.forEach((h) => {
      if (!window.isHabitActiveOn(h, d)) return;
      if (rec[h.id]) return;          // was checked — no reflection needed
      if (done[h.id]) return;         // already reflected
      results.push({ habit: h, date: key });
    });
  };
  // always check yesterday
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  check(yesterday);
  // also check today once past 23:30
  if (nowMin(now) >= toMin('23:30')) check(now);
  return results;
}

// ---- goal retrospectives: elapsed goals with no retrospective yet ----
function dueRetrospectives(store) {
  return (store.goals || []).filter((g) => !g.retrospective && window.daysBetween(g.startDate, new Date()) >= g.duration);
}

// ---- Check-in micro-review ----
function CheckinReviewModal({ t, habit, initial, onConfirm, onCancel }) {
  const m = habit.metric;
  const [val, setVal] = useStateR(initial != null ? initial : (m ? (m.step >= 1 ? 1 : 0.5) : ''));
  const [woke, setWoke] = useStateR(initial && initial.woke ? initial.woke : '06:50');
  const accent = t.accent;
  const wrap = { position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 };
  const sheet = { width: 'min(420px,100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 22,
    padding: 28, boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)' };
  const btn = (bg, fg) => ({ padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, background: bg, color: fg, fontFamily: 'Outfit, sans-serif' });

  if (habit.askTime) {
    return (
      <div style={wrap}><div style={sheet}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>{habit.emoji}</div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 26, color: t.text }}>{habit.askLabel}</div>
        <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, marginBottom: 22 }}>Logging "{habit.label}" for today.</div>
        <input type="time" value={woke} onChange={(e) => setWoke(e.target.value)} style={{
          width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px',
          color: t.text, fontSize: 22, fontFamily: 'Outfit, sans-serif', outline: 'none', textAlign: 'center' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button style={{ ...btn('transparent', t.textMuted), flex: 1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...btn(accent, '#fff'), flex: 2 }} onClick={() => onConfirm({ checked: true, wake_time: woke })}>
            {toMin(woke) <= toMin(habit.reminderTime) ? '✓ On time — save' : 'Save'}
          </button>
        </div>
      </div></div>
    );
  }

  return (
    <div style={wrap}><div style={sheet}>
      <div style={{ fontSize: 34, marginBottom: 8 }}>{habit.emoji}</div>
      <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 26, color: t.text }}>{m.label}</div>
      <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, marginBottom: 22 }}>Quick check-in for "{habit.label}".</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <button onClick={() => setVal(Math.max(0, +(val - m.step).toFixed(2)))}
          style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>−</button>
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: t.text, lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{m.unit}</div>
        </div>
        <button onClick={() => setVal(Math.min(m.max, +(val + m.step).toFixed(2)))}
          style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>+</button>
      </div>
      <input type="range" min="0" max={m.max} step={m.step} value={val} onChange={(e) => setVal(+e.target.value)}
        style={{ width: '100%', marginTop: 22, accentColor: accent, height: 6 }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button style={{ ...btn('transparent', t.textMuted), flex: 1 }} onClick={onCancel}>Cancel</button>
        <button style={{ ...btn(accent, '#fff'), flex: 2 }} onClick={() => onConfirm({ checked: true, [m.key]: val })}>Log {val} {m.unit}</button>
      </div>
    </div></div>
  );
}

// ---- Reminder: time-gated "Are you up?" nudge ----
function ReminderModal({ t, habit, onConfirmUp, onMissed, onSnooze }) {
  const [stage, setStage] = useStateR('ask');
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
    <div style={wrap}><div style={sheet}>
      <div style={{ width: 70, height: 70, borderRadius: '50%', background: t.accentSoft, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 34, margin: '0 auto 16px', animation: 'pulse 2s ease-in-out infinite' }}>{habit.emoji}</div>
      {stage === 'ask' ? (
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>Reminder · due {fmt(habit.reminderTime)}</div>
          <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 30, color: t.text, margin: '8px 0' }}>Are you up?</div>
          <div style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
            It's almost {fmt(nudge)} and "{habit.label}" isn't checked yet. If you don't confirm, we'll mark it missed.
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
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>We'll log it against your "{habit.label}" habit.</div>
          <input type="time" value={woke} onChange={(e) => setWoke(e.target.value)} style={{
            width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '14px 16px',
            color: t.text, fontSize: 26, fontFamily: 'Outfit, sans-serif', outline: 'none', textAlign: 'center' }} />
          <div style={{ fontSize: 13, marginTop: 12, fontWeight: 600,
            color: toMin(woke) <= toMin(habit.reminderTime) ? '#00C97A' : '#E07B00' }}>
            {toMin(woke) <= toMin(habit.reminderTime) ? `✓ On time — before ${fmt(habit.reminderTime)}` : `Logged after your ${fmt(habit.reminderTime)} target`}
          </div>
          <button style={{ ...btn(accent, '#fff'), width: '100%', marginTop: 20 }} onClick={() => onConfirmUp(woke)}>Save &amp; check off ✓</button>
        </div>
      )}
    </div></div>
  );
}

// ---- Missed-habit reflection prompt ----
const REFLECTION_REASONS = ['Forgot', 'Too busy', 'Unwell', 'Not relevant today'];

function ReflectionModal({ t, habit, date, onSave, onDismiss }) {
  const [reason, setReason] = useStateR('');
  const [text, setText] = useStateR('');
  const accent = t.accent;
  const wrap = { position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.72)', backdropFilter: 'blur(7px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 115, padding: 20 };
  const sheet = { width: 'min(420px,100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 22,
    padding: 28, boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)' };
  const btn = (bg, fg, outline) => ({ padding: '11px 18px', borderRadius: 11, cursor: 'pointer', fontSize: 14,
    fontWeight: 600, background: bg, color: fg, fontFamily: 'Outfit, sans-serif',
    border: outline ? `1px solid ${t.border2}` : 'none' });
  return (
    <div style={wrap}><div style={sheet}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{habit.emoji}</div>
      <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 23, color: t.text, lineHeight: 1.2 }}>
        You missed <em>{habit.label}</em>
      </div>
      <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, marginBottom: 18 }}>
        What got in the way? <span style={{ opacity: 0.6 }}>(optional — helps pattern tracking)</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {REFLECTION_REASONS.map((r) => (
          <button key={r} onClick={() => setReason(reason === r ? '' : r)}
            style={btn(reason === r ? accent : t.surface2, reason === r ? '#fff' : t.text)}>
            {r}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Or describe what happened…" rows={2}
        style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12,
          padding: '12px 14px', color: t.text, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'none' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button style={{ ...btn(t.surface2, t.textMuted), flex: 1 }} onClick={onDismiss}>Skip</button>
        <button style={{ ...btn(accent, '#fff'), flex: 2 }} onClick={() => onSave({ reason: reason || text || 'No reason given', text, date, habitId: habit.id })}>
          Save reflection
        </button>
      </div>
    </div></div>
  );
}

// ---- Goal-period retrospective ----
const SMART_DIMS = ['Specific', 'Measurable', 'Achievable', 'Realistic', 'Time-bound'];
const SMART_DIM_HINTS = {
  Specific: 'Goal was too vague — I didn\'t know what "done" looked like',
  Measurable: 'No clear metric — couldn\'t tell if I was making progress',
  Achievable: 'Set too high for this season of life',
  Realistic: 'External constraints I didn\'t account for at goal-setting time',
  'Time-bound': 'Duration was too short, too long, or not enforced',
};

function buildSummary(goal, store, rating, failedDimension) {
  const HABITS = window.getHabits(store);
  const linked = goal.linkedHabits ? HABITS.filter((h) => goal.linkedHabits.includes(h.id)) : [];
  let totalSlots = 0, doneSlots = 0;
  const reasons = {};
  const start = window.parseISO(goal.startDate);
  for (let i = 0; i < goal.duration; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const rec = store.data[window.iso(d)] || {};
    const active = linked.filter((h) => window.isHabitActiveOn(h, d));
    if (!active.length) continue;
    totalSlots++;
    if (active.every((h) => rec[h.id])) doneSlots++;
    const refs = rec.reflections || {};
    active.forEach((h) => { if (refs[h.id] && refs[h.id].reason) { const r = refs[h.id].reason; reasons[r] = (reasons[r] || 0) + 1; } });
  }
  const pct = totalSlots ? Math.round((doneSlots / totalSlots) * 100) : 0;
  const topReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  let s = `You completed ${pct}% of linked habit days over ${goal.duration} days. `;
  if (rating >= 4) s += 'A strong performance — ';
  else if (rating >= 3) s += 'A solid effort — ';
  else s += 'A challenging period — ';
  if (failedDimension === 'Achievable') s += 'the goal may have been set above current capacity. Consider a smaller step next time.';
  else if (failedDimension === 'Realistic') s += 'external factors made it harder than expected. Account for life constraints next time.';
  else if (failedDimension === 'Specific') s += 'a clearer definition of "done" will help stay on track.';
  else if (failedDimension === 'Measurable') s += 'adding a concrete metric (km, pages, minutes) makes progress visible.';
  else if (failedDimension === 'Time-bound') s += 'experiment with a shorter duration to build momentum first.';
  else s += 'keep reflecting after each goal to spot patterns over time.';
  if (topReason) s += ` Most common reason for missed days: "${topReason[0]}".`;
  return s;
}

function RetrospectiveModal({ t, goal, store, onSave, onDismiss }) {
  const [stage, setStage] = useStateR(0); // 0=rating, 1=dimension, 2=narrative, 3=summary
  const [rating, setRating] = useStateR(3);
  const [failedDim, setFailedDim] = useStateR('');
  const [narrative, setNarrative] = useStateR('');
  const pal = window.WEEK_PALETTE[goal.colorIdx];
  const accent = t.accent;
  const wrap = { position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 125, padding: 20 };
  const sheet = { width: 'min(520px,100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 24,
    padding: 32, boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85)' };
  const btn = (bg, fg, disabled) => ({ padding: '12px 20px', borderRadius: 12, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
    background: bg, color: fg, opacity: disabled ? 0.4 : 1, fontFamily: 'Outfit, sans-serif' });

  const summary = buildSummary(goal, store, rating, failedDim);

  const STAGES = ['Rating', 'Reflection', 'Narrative', 'Summary'];
  return (
    <div style={wrap}><div style={sheet}>
      {/* header */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {STAGES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stage ? pal.bg : t.surface2 }} />
        ))}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: pal.bg, fontWeight: 700, marginBottom: 4 }}>Goal complete — retrospective</div>
      <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 26, color: t.text, marginBottom: 20 }}>{goal.title}</div>

      {stage === 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 14 }}>How did this goal period go overall?</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} style={{ width: 52, height: 52, borderRadius: 14, fontSize: 26,
                border: `2px solid ${rating >= n ? pal.bg : t.border}`, background: rating >= n ? `${pal.bg}22` : t.surface2,
                cursor: 'pointer', transition: 'all .15s' }}>{'★'}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: t.textMuted, marginBottom: 4 }}>
            {['','Difficult','Challenging','Okay','Good','Excellent'][rating]} · {rating}/5
          </div>
        </div>
      )}

      {stage === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 6 }}>Which SMART dimension was hardest?</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 14 }}>Optional — skip if everything went well.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SMART_DIMS.map((d) => (
              <button key={d} onClick={() => setFailedDim(failedDim === d ? '' : d)}
                style={{ ...btn(failedDim === d ? pal.bg : t.surface2, failedDim === d ? '#fff' : t.text),
                  textAlign: 'left', padding: '10px 14px' }}>
                <div style={{ fontWeight: 700 }}>{d}</div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 400, marginTop: 2 }}>{SMART_DIM_HINTS[d]}</div>
              </button>
            ))}
            <button onClick={() => setFailedDim('')}
              style={{ ...btn('transparent', t.textMuted), border: `1px dashed ${t.border2}`, textAlign: 'center' }}>
              None — all dimensions held up
            </button>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 6 }}>Anything else you'd like to note?</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 14 }}>Free text — what worked, what didn't, what you'd change.</div>
          <textarea autoFocus value={narrative} onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. The first two weeks were strong, but work pressure in week 3 broke the streak…" rows={5}
            style={{ width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12,
              padding: '13px 15px', color: t.text, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'none', lineHeight: 1.55 }} />
        </div>
      )}

      {stage === 3 && (
        <div>
          <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 700, marginBottom: 10 }}>Interpretive summary</div>
          <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16,
            fontSize: 14, color: t.text, lineHeight: 1.65, marginBottom: 16 }}>{summary}</div>
          {failedDim && (
            <div style={{ fontSize: 13, color: pal.bg, fontWeight: 600, marginBottom: 8 }}>
              Flagged dimension: <strong>{failedDim}</strong>
            </div>
          )}
          {narrative && (
            <div style={{ fontSize: 13, color: t.textMuted, fontStyle: 'italic', lineHeight: 1.5 }}>"{narrative}"</div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={stage === 0 ? onDismiss : () => setStage(stage - 1)}
          style={btn('transparent', t.textMuted)}>{stage === 0 ? 'Skip for now' : '← Back'}</button>
        {stage < 3 ? (
          <button onClick={() => setStage(stage + 1)} style={btn(pal.bg, '#fff')}>Continue →</button>
        ) : (
          <button onClick={() => onSave({ rating, failedDimension: failedDim, narrative, summary, date: window.iso(new Date()) })}
            style={btn(pal.bg, '#fff')}>Save retrospective ✓</button>
        )}
      </div>
    </div></div>
  );
}

window.CheckinReviewModal = CheckinReviewModal;
window.ReminderModal = ReminderModal;
window.ReflectionModal = ReflectionModal;
window.RetrospectiveModal = RetrospectiveModal;
window.dueReminders = dueReminders;
window.dueReflections = dueReflections;
window.dueRetrospectives = dueRetrospectives;
window.REM_HELP = { toMin, nowMin };
