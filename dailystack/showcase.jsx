// ============================================================
// DailyStack — device showcase + Tweaks (theme / accent) + colourful chart
// ============================================================
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS } = React;

const APP = 'app.html';

// showcase chrome tokens per mode (mirrors app THEME surfaces)
const SC = {
  dark:  { bg: '#070815', surface: '#0D0F22', surface2: '#11142E', border: '#1A1E3A', border2: '#242850',
           text: '#DDE1FF', muted: '#5A60A0', sub: '#9aa0d8' },
  light: { bg: '#F1F0FC', surface: '#FFFFFF', surface2: '#F4F3FF', border: '#D8D6F8', border2: '#C0BEF0',
           text: '#1A1840', muted: '#6860B8', sub: '#4a4490' },
};

// curated accent variants (week-palette hues)
const ACCENTS = ['#5B54E8', '#00B4CC', '#D4156E', '#00C97A', '#E07B00'];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark",
  "accent": "#5B54E8"
}/*EDITMODE-END*/;

// ---- 11" tablet bezel (landscape) ----
function TabletFrame({ src, tk, w = 1180, h = 800 }) {
  return (
    <div style={{ width: w + 44, height: h + 44, borderRadius: 38,
      background: 'linear-gradient(150deg,#23253a,#0d0e1a)', padding: 22,
      boxShadow: '0 50px 120px -30px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.08)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7,
        borderRadius: '50%', background: '#000', boxShadow: 'inset 0 0 0 1.5px #2a2c40' }} />
      <div style={{ width: w, height: h, borderRadius: 18, overflow: 'hidden', background: '#090B18' }}>
        <iframe src={src} title="tablet" style={{ width: w, height: h, border: 'none', display: 'block' }} />
      </div>
    </div>
  );
}
function PhoneApp({ src, h }) {
  return <iframe src={src} title="phone" style={{ width: '100%', height: h, border: 'none', display: 'block', background: '#090B18' }} />;
}

// ---- colourful progress chart (reads shared localStorage) ----
function ProgressChart({ tk, accent }) {
  const data = useMemoS(() => {
    let store; try { store = window.seedIfEmpty(window.loadStore()); window.persist(store); } catch (e) { store = { data: {} }; }
    const today = new Date();
    const recOf = (d) => store.data[window.iso(d)] || {};
    const CATS = [
      { key: 'body', label: 'Body', color: '#00B4CC' },
      { key: 'work', label: 'Work', color: '#5B54E8' },
      { key: 'mind', label: 'Mind', color: '#D4156E' },
      { key: 'spirit', label: 'Spirit', color: '#E07B00' },
    ];
    const cats = CATS.map((c) => {
      let active = 0, done = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        window.getHabits(store).filter((h) => h.category === c.key).forEach((h) => {
          if (window.isHabitActiveOn(h, d)) { active++; if (recOf(d)[h.id]) done++; }
        });
      }
      return { ...c, pct: active ? Math.round((done / active) * 100) : 0 };
    });
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const active = window.getHabits(store).filter((h) => window.isHabitActiveOn(h, d));
      const done = active.filter((h) => recOf(d)[h.id]).length;
      days.push({ d, pct: active.length ? done / active.length : 0, label: d.getDate() });
    }
    const overall = Math.round((days.reduce((a, b) => a + b.pct, 0) / days.length) * 100);
    return { cats, days, overall };
  }, []);

  const card = { background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 18, padding: 24 };
  const ring = (pct, color, size = 92) => {
    const R = size / 2 - 7, C = 2 * Math.PI * R;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={tk.surface2} strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
    );
  };

  // colour each day column by its completion bucket across the full palette
  const colFor = (p) => p >= 0.85 ? '#00C97A' : p >= 0.65 ? '#5B54E8' : p >= 0.45 ? '#00B4CC' : p >= 0.25 ? '#E07B00' : '#D4156E';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(320px,1.4fr)', gap: 18, marginBottom: 20 }}>
      {/* category rings */}
      <div style={card}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: tk.muted, fontWeight: 700, marginBottom: 18 }}>Completion by area · 30 days</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {data.cats.map((c) => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12, background: tk.surface2, borderRadius: 14, padding: 12 }}>
              <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
                {ring(c.pct, c.color)}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: tk.text }}>{c.pct}<span style={{ fontSize: 11, color: tk.muted }}>%</span></div>
              </div>
              <div>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, marginBottom: 5 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: tk.text }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 14-day colourful columns */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: tk.muted, fontWeight: 700 }}>Daily completion · last 14 days</div>
          <div style={{ fontSize: 13, color: tk.sub }}>avg <strong style={{ color: accent }}>{data.overall}%</strong></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 168 }}>
          {data.days.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
              <div title={`${Math.round(day.pct * 100)}%`} style={{ width: '78%', height: `${Math.max(4, day.pct * 100)}%`,
                borderRadius: '7px 7px 3px 3px', background: `linear-gradient(180deg, ${colFor(day.pct)}, ${colFor(day.pct)}aa)`,
                boxShadow: `0 4px 14px -4px ${colFor(day.pct)}`, transition: 'height 1s cubic-bezier(.2,.8,.2,1)' }} />
              <div style={{ fontSize: 10, color: tk.muted }}>{day.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Showcase() {
  const [tw, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const mode = tw.mode === 'light' ? 'light' : 'dark';
  const accent = tw.accent || '#5B54E8';
  const tk = SC[mode];

  // capture initial iframe srcs ONCE (param-seeded) so tweaks don't reload frames
  const initial = useRefS(null);
  if (!initial.current) {
    const q = (extra) => `${APP}?${extra ? extra + '&' : ''}mode=${tw.mode === 'light' ? 'light' : 'dark'}&accent=${(tw.accent || '#5B54E8').replace('#', '')}`;
    initial.current = { tablet: q('autoremind=0'), ios: q('demo=reminder&platform=ios'), android: q('tab=grid&autoremind=0&platform=android') };
  }

  // relay live changes to every app frame
  useEffectS(() => {
    const post = () => document.querySelectorAll('iframe').forEach((f) => {
      try { f.contentWindow.postMessage({ type: 'ds-tweak', mode, accent }, '*'); } catch (e) {}
    });
    post();
    const id = setTimeout(post, 600);
    return () => clearTimeout(id);
  }, [mode, accent]);

  const sectionTitle = (n, title, sub) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 22, color: accent, fontWeight: 700 }}>{n}</span>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: tk.text, letterSpacing: '-0.01em' }}>{title}</h2>
      <span style={{ fontSize: 14, color: tk.muted }}>{sub}</span>
    </div>
  );
  const card = { background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 16, padding: 20 };

  return (
    <div style={{ minHeight: '100%', background: tk.bg, color: tk.text, fontFamily: 'Outfit, sans-serif',
      padding: 'clamp(28px,5vw,64px)', transition: 'background .3s, color .3s' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        {/* hero */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px -6px ${accent}` }}>
                <div style={{ width: 16, height: 16, borderRadius: 5, border: '3px solid #fff' }} />
              </div>
              <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: tk.muted }}>Product design · v1.0</span>
            </div>
            <h1 style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(40px,6vw,68px)', lineHeight: 1.02, margin: '0 0 18px' }}>
              DailyStack, framed<br />across every surface.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: tk.sub, margin: '0 0 26px' }}>
              One single-page habit &amp; life tracker — high-density grid, on-page analytics, SMART goal capture,
              metric check-ins, and time-gated reminders. Built offline-first for an 11&Prime; tablet served from Termux,
              and responsive down to iOS &amp; Android.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={initial.current.tablet} style={{ textDecoration: 'none', padding: '13px 24px', borderRadius: 12, background: accent, color: '#fff', fontWeight: 600, fontSize: 15 }}>Open the full app →</a>
              <a href={`${APP}?tab=analysis&autoremind=0&mode=${mode}&accent=${accent.replace('#','')}`} style={{ textDecoration: 'none', padding: '13px 24px', borderRadius: 12, background: tk.surface2, color: tk.text, fontWeight: 600, fontSize: 15, border: `1px solid ${tk.border2}` }}>One-page analytics</a>
              <a href={`${APP}?onboard=1&mode=${mode}&accent=${accent.replace('#','')}`} style={{ textDecoration: 'none', padding: '13px 24px', borderRadius: 12, background: 'transparent', color: tk.sub, fontWeight: 600, fontSize: 15, border: `1px dashed ${tk.border2}` }}>See first-run setup</a>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12, minWidth: 280, flex: '1 1 280px', maxWidth: 360 }}>
            {[
              ['⏰', 'Time-gated reminders', '“Are you up?” nudges before a deadline. Miss it → the cell greys out.'],
              ['🎯', 'SMART goal wizard', 'Every goal is shaped Specific · Measurable · Achievable · Realistic · Time-bound.'],
              ['💧', 'Metric check-ins', 'Ticking Water or Exercise asks how many litres / km — logged per day.'],
              ['🎨', 'Tweak the look', 'Switch light / dark and pick from five accent palettes — live, here.'],
            ].map(([e, ti, d], i) => (
              <div key={i} style={{ ...card, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>{e}</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{ti}</div>
                  <div style={{ fontSize: 12.5, color: tk.muted, marginTop: 3, lineHeight: 1.45 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* colourful progress chart */}
        {sectionTitle('01', 'Your progress', 'Live from saved check-ins · colour-coded by area & day')}
        <ProgressChart tk={tk} accent={accent} />
        <div style={{ marginBottom: 56 }} />

        {/* tablet */}
        {sectionTitle('02', '11-inch tablet · Web', 'Served locally from Termux · offline-first · the primary surface')}
        <div style={{ ...card, padding: 36, display: 'flex', justifyContent: 'center', marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ transform: 'scale(var(--ts))', transformOrigin: 'top center' }} className="tablet-scale">
            <TabletFrame src={initial.current.tablet} tk={tk} />
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: tk.muted, marginBottom: 56, maxWidth: 760 }}>
          Fully interactive. Tap any cell to check a habit — Water and Exercise open a metric review. Switch to the
          <strong style={{ color: tk.text }}> Analysis</strong> tab for the one-page dashboard, or
          <strong style={{ color: tk.text }}> Goals</strong> to run the SMART wizard.
        </p>

        {/* phones */}
        {sectionTitle('03', 'Phone · iOS &amp; Android', 'Same app, responsive single-column — installable as a PWA')}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
              <window.IOSDevice dark>
                <div style={{ paddingTop: 50, height: '100%' }}><PhoneApp src={initial.current.ios} h={824} /></div>
              </window.IOSDevice>
            </div>
            <div style={{ fontSize: 13, color: tk.muted, marginTop: 6 }}>iOS · native tab bar &amp; today ring</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
              <window.AndroidDevice dark>
                <div style={{ height: '100%' }}><PhoneApp src={initial.current.android} h={842} /></div>
              </window.AndroidDevice>
            </div>
            <div style={{ fontSize: 13, color: tk.muted, marginTop: 6 }}>Android · week-by-week habit grid</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: tk.muted, textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>
          On phones the app becomes a proper native experience — a focused
          <strong style={{ color: tk.text }}> week-by-week</strong> grid, a clean serif header with your live today-ring,
          and a <strong style={{ color: tk.text }}>bottom tab bar</strong> for Week · Insights · Today · Goals.
        </p>
      </div>

      {/* ---- Tweaks ---- */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Theme" />
        <window.TweakRadio label="Mode" value={mode} options={['dark', 'light']} onChange={(v) => setTweak('mode', v)} />
        <window.TweakColor label="Accent" value={accent} options={ACCENTS} onChange={(v) => setTweak('accent', v)} />
        <div style={{ fontSize: 11.5, color: '#8a8aa8', padding: '4px 2px 2px', lineHeight: 1.5 }}>
          Changes apply live to the tablet &amp; phone frames and the progress chart.
        </div>
      </window.TweaksPanel>
    </div>
  );
}

window.Showcase = Showcase;
