// ============================================================
// Onboarding — first-run goal selection. Picking goals installs
// the goal AND its habits into the tracker.
// ============================================================
const { useState: useStateO } = React;

function Onboarding({ t, onComplete, onSkip }) {
  const presets = window.GOAL_PRESETS;
  const [picked, setPicked] = useStateO([]); // preset ids

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const n = picked.length;

  const wrap = { position: 'fixed', inset: 0, zIndex: 200, background: t.bg, color: t.text,
    fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column' };
  const accent = t.accent;

  return (
    <div style={wrap}>
      {/* header */}
      <div style={{ padding: 'clamp(22px,5vw,40px) clamp(20px,5vw,48px) 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: `0 6px 18px -4px ${accent}` }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: '2.5px solid #fff' }} />
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textMuted }}>Welcome to DailyStack · Step 1 of 1</div>
        </div>
        <h1 style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700,
          fontSize: 'clamp(28px,5vw,44px)', margin: '0 0 8px', lineHeight: 1.05 }}>What do you want to build?</h1>
        <p style={{ fontSize: 'clamp(14px,2.4vw,16px)', color: t.textMuted, margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
          Pick the goals you'll work on. We'll add the habits behind each one to your daily tracker — you can change them anytime.
        </p>
      </div>

      {/* scrollable goal grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px clamp(20px,5vw,48px) 20px' }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', maxWidth: 1100, margin: '0 auto' }}>
          {presets.map((p) => {
            const on = picked.includes(p.id);
            const pal = window.WEEK_PALETTE[p.colorIdx];
            return (
              <button key={p.id} onClick={() => toggle(p.id)} style={{
                textAlign: 'left', cursor: 'pointer', borderRadius: 18, padding: 18, position: 'relative',
                background: on ? `${pal.bg}1A` : t.surface,
                border: on ? `2px solid ${pal.bg}` : `2px solid ${t.border}`,
                boxShadow: on ? `0 14px 36px -16px ${pal.bg}` : 'none',
                transition: 'all .16s', fontFamily: 'Outfit, sans-serif',
                transform: on ? 'translateY(-2px)' : 'none' }}>
                {/* check badge */}
                <div style={{ position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: '50%',
                  background: on ? pal.bg : 'transparent', border: on ? 'none' : `2px solid ${t.border2}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .16s' }}>
                  {on && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${pal.bg}22`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>{p.emoji}</div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: pal.bg, fontWeight: 700, marginBottom: 3 }}>{p.tag} · {p.duration} days</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 5 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.45, marginBottom: 13 }}>{p.blurb}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.habits.map((h, i) => (
                    <span key={i} style={{ fontSize: 11.5, padding: '4px 9px', borderRadius: 20, background: t.surface2,
                      color: t.textMuted, display: 'flex', gap: 5, alignItems: 'center' }}>{h.emoji} {h.label}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* footer */}
      <div style={{ flexShrink: 0, padding: '16px clamp(20px,5vw,48px)', borderTop: `1px solid ${t.border}`,
        background: `${t.surface}cc`, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, color: t.textMuted }}>
          {n === 0 ? 'Select one or more goals to get started' : <span><strong style={{ color: t.text }}>{n}</strong> goal{n !== 1 ? 's' : ''} · {picked.reduce((a, id) => a + presets.find((x) => x.id === id).habits.length, 0)} habits will be added</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSkip} style={{ padding: '12px 20px', borderRadius: 12, border: `1px solid ${t.border2}`,
            background: 'transparent', color: t.textMuted, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Skip for now</button>
          <button disabled={n === 0} onClick={() => onComplete(picked.map((id) => presets.find((x) => x.id === id)))}
            style={{ padding: '12px 26px', borderRadius: 12, border: 'none', background: accent, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: n === 0 ? 'not-allowed' : 'pointer', opacity: n === 0 ? 0.4 : 1,
              fontFamily: 'Outfit, sans-serif', boxShadow: n === 0 ? 'none' : `0 10px 26px -10px ${accent}`, transition: 'opacity .16s' }}>
            Start tracking{n > 0 ? ` (${n})` : ''} →
          </button>
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
