// ============================================================
// TrackersPanel — mood, water, sleep, Pomodoro, gratitude
// ============================================================
const { useState: useStateT, useEffect: useEffectT, useRef: useRefT } = React;

const MOOD = [
  { e: '😣', l: 'Drained' }, { e: '😕', l: 'Low' }, { e: '😐', l: 'Neutral' },
  { e: '🙂', l: 'Good' }, { e: '😄', l: 'Energised' },
];

function PomodoroTimer({ t }) {
  const WORK = 25 * 60, BREAK = 5 * 60;
  const [phase, setPhase] = useStateT('work');
  const [left, setLeft] = useStateT(WORK);
  const [running, setRunning] = useStateT(false);
  const [sessions, setSessions] = useStateT(0);
  const ref = useRefT();

  useEffectT(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          if (phase === 'work') { setSessions((s) => s + 1); setPhase('break'); return BREAK; }
          else { setRunning(false); setPhase('work'); return WORK; }
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, phase]);

  const total = phase === 'work' ? WORK : BREAK;
  const frac = left / total;
  const R = 78, C = 2 * Math.PI * R;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const ringCol = phase === 'work' ? t.accent : '#00C97A';
  const btn = (bg, fg) => ({ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, background: bg, color: fg, fontFamily: 'Outfit, sans-serif' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 184, height: 184 }}>
        <svg width="184" height="184" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="92" cy="92" r={R} fill="none" stroke={t.surface2} strokeWidth="9" />
          <circle cx="92" cy="92" r={R} fill="none" stroke={ringCol} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: ringCol, fontWeight: 700 }}>{phase}</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: t.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{mm}:{ss}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{sessions} session{sessions !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={btn(t.accent, '#fff')} onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</button>
        <button style={btn(t.surface2, t.text)} onClick={() => { setRunning(false); setLeft(phase === 'work' ? WORK : BREAK); }}>Reset</button>
      </div>
    </div>
  );
}

function TrackersPanel({ t, store, today, update, narrow }) {
  const key = window.iso(today);
  const rec = store.data[key] || {};
  const set = (patch) => update(key, patch);

  const card = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22, boxShadow: t.shadow };
  const cardTitle = { fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 700, marginBottom: 18 };

  const sleep = rec.sleep_hrs ?? 7;
  const sleepInfo = sleep >= 7 ? { c: '#00C97A', l: 'Well rested' }
    : sleep >= 5 ? { c: '#E07B00', l: 'Borderline — aim for 7h' }
    : { c: '#D4156E', l: 'Insufficient — affects performance' };
  const water = rec.water ?? 0;

  return (
    <div style={narrow
      ? { display: 'flex', flexDirection: 'column', gap: 14 }
      : { display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 16, alignItems: 'start' }}>
      {/* Mood */}
      <div style={{ ...card, gridColumn: 'span 6' }}>
        <div style={cardTitle}>Mood &amp; Energy</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {MOOD.map((m, i) => {
            const on = rec.mood === i + 1;
            return (
              <button key={i} onClick={() => set({ mood: i + 1 })} style={{
                flex: 1, border: on ? `2px solid ${t.accent}` : `1px solid ${t.border}`, background: on ? t.accentSoft : 'transparent',
                borderRadius: 14, padding: '14px 0', cursor: 'pointer', transition: 'all .15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 30, filter: on ? 'none' : 'grayscale(0.5)', transition: 'filter .15s' }}>{m.e}</span>
                <span style={{ fontSize: 11, color: on ? t.text : t.textMuted, fontWeight: 600 }}>{m.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Water */}
      <div style={{ ...card, gridColumn: 'span 6' }}>
        <div style={cardTitle}>Water Intake</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <button key={i} onClick={() => set({ water: i + 1 === water ? i : i + 1, water_l: +((i + 1 === water ? i : i + 1) * 0.25).toFixed(2) })}
                title={`${i + 1} cups`} style={{
                  width: 22, height: 32, borderRadius: '5px 5px 7px 7px', cursor: 'pointer', border: `1.5px solid ${i < water ? '#00B4CC' : t.border2}`,
                  background: i < water ? 'linear-gradient(180deg,#40D4EC,#00B4CC)' : 'transparent', transition: 'all .15s',
                }} />
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: t.text, lineHeight: 1 }}>{(water * 0.25).toFixed(2)}<span style={{ fontSize: 15, color: t.textMuted }}> L</span></div>
            <div style={{ fontSize: 12, color: t.textMuted }}>{water}/8 cups · goal 2L</div>
          </div>
        </div>
      </div>

      {/* Sleep */}
      <div style={{ ...card, gridColumn: 'span 6' }}>
        <div style={cardTitle}>Sleep Hours</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: t.text, lineHeight: 1 }}>{sleep.toFixed(1)}<span style={{ fontSize: 16, color: t.textMuted }}> h</span></div>
          <div style={{ fontSize: 13, color: sleepInfo.c, fontWeight: 600 }}>{sleepInfo.l}</div>
        </div>
        <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={(e) => set({ sleep_hrs: +e.target.value })}
          style={{ width: '100%', accentColor: sleepInfo.c, height: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textMuted, marginTop: 6 }}>
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </div>

      {/* Pomodoro */}
      <div style={{ ...card, gridColumn: 'span 6', gridRow: 'span 2' }}>
        <div style={cardTitle}>Focus Sessions</div>
        <PomodoroTimer t={t} />
      </div>

      {/* Gratitude */}
      <div style={{ ...card, gridColumn: 'span 6' }}>
        <div style={cardTitle}>Gratitude Journal</div>
        <textarea value={rec.gratitude || ''} onChange={(e) => set({ gratitude: e.target.value })}
          placeholder="What are you grateful for today?" rows={4} style={{
            width: '100%', resize: 'vertical', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12,
            padding: 14, color: t.text, fontSize: 14, fontFamily: 'Outfit, sans-serif', lineHeight: 1.55, outline: 'none',
          }} />
        <div style={{ textAlign: 'right', fontSize: 11, color: t.textMuted, marginTop: 6 }}>{(rec.gratitude || '').length} chars · auto-saved</div>
      </div>
    </div>
  );
}

window.TrackersPanel = TrackersPanel;
