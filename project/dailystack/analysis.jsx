// ============================================================
// AnalysisPanel — one-page analytics: bars, weekly, 30d trend, mood
// ============================================================
function AnalysisPanel({ t, store, today, narrow }) {
  // ---- gather last-30-day window ----
  const days = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days.push(d); }

  const recOf = (d) => store.data[window.iso(d)] || {};
  const HABITS = window.getHabits(store);

  // per-habit completion over active days
  const habitStats = HABITS.map((h) => {
    let active = 0, done = 0, streak = 0, running = 0;
    days.forEach((d) => {
      if (!window.isHabitActiveOn(h, d)) return;
      active++;
      if (recOf(d)[h.id]) { done++; running++; streak = Math.max(streak, running); } else { running = 0; }
    });
    // current streak (from today backwards)
    let cur = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (!window.isHabitActiveOn(h, d)) continue;
      if (recOf(d)[h.id]) cur++; else break;
    }
    return { ...h, pct: active ? Math.round((done / active) * 100) : 0, done, active, streak, cur };
  }).sort((a, b) => b.pct - a.pct);

  // overall daily completion for trend
  const trend = days.map((d) => {
    const active = HABITS.filter((h) => window.isHabitActiveOn(h, d));
    const done = active.filter((h) => recOf(d)[h.id]).length;
    return active.length ? done / active.length : 0;
  });
  const avg = Math.round((trend.reduce((a, b) => a + b, 0) / trend.length) * 100);

  // weekly breakdown (last 4 ISO weeks)
  const weeks = [3, 2, 1, 0].map((wb) => {
    let active = 0, done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() - (wb * 7 + i));
      HABITS.forEach((h) => { if (window.isHabitActiveOn(h, d)) { active++; if (recOf(d)[h.id]) done++; } });
    }
    return { label: wb === 0 ? 'This wk' : `${wb}w ago`, pct: active ? Math.round((done / active) * 100) : 0 };
  });

  // mood distribution
  const moodCount = [0, 0, 0, 0, 0];
  days.forEach((d) => { const m = recOf(d).mood; if (m) moodCount[m - 1]++; });
  const moodMax = Math.max(1, ...moodCount);
  const MOOD_EMOJI = ['😣', '😕', '😐', '🙂', '😄'];

  // 30d trend SVG path
  const W = 100, H = 34;
  const pts = trend.map((v, i) => [(i / (trend.length - 1)) * W, H - v * H]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  const card = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow };
  const cardTitle = { fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 700, marginBottom: 16 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)', gap: narrow ? 12 : 16 }}>
      {/* KPI strip */}
      {[
        { k: '30-day average', v: `${avg}%`, sub: 'completion' },
        { k: 'Best streak', v: Math.max(...habitStats.map((h) => h.streak)), sub: `${habitStats.sort((a,b)=>b.streak-a.streak)[0].label}` },
        { k: 'Active habits', v: HABITS.length, sub: `${HABITS.filter((h) => h.everyDay).length} daily · ${HABITS.filter((h) => !h.everyDay).length} weekly` },
        { k: 'Logged days', v: days.filter((d) => Object.keys(recOf(d)).length).length, sub: 'of 30' },
      ].map((kpi, i) => (
        <div key={i} style={{ ...card, gridColumn: narrow ? 'span 1' : 'span 3', padding: narrow ? 15 : 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 600 }}>{kpi.k}</div>
          <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700, fontSize: narrow ? 38 : 46, lineHeight: 1, color: t.text, marginTop: 6 }}>{kpi.v}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{kpi.sub}</div>
        </div>
      ))}

      {/* Habit completion bars */}
      <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 7' }}>
        <div style={cardTitle}>Habit completion · last 30 days</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {habitStats.sort((a, b) => b.pct - a.pct).map((h) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: narrow ? 104 : 150, fontSize: 13, color: t.text, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{h.emoji}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.label}</span>
              </div>
              <div style={{ flex: 1, height: 12, background: t.surface2, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${h.pct}%`, height: '100%', borderRadius: 6,
                  background: `linear-gradient(90deg, ${t.accent}, ${t.accent}cc)`,
                  transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} />
              </div>
              <div style={{ width: narrow ? 44 : 64, textAlign: 'right', fontSize: 13, fontWeight: 700, color: t.text }}>{h.pct}%</div>
              <div style={{ width: 52, textAlign: 'right', fontSize: 11, color: h.cur > 2 ? '#E07B00' : t.textMuted, fontWeight: 600, display: narrow ? 'none' : 'block' }}>
                {h.cur > 0 ? `🔥${h.cur}` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly breakdown */}
      <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 5' }}>
        <div style={cardTitle}>Weekly breakdown</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 150, gap: 14 }}>
          {weeks.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>{w.pct}%</div>
              <div style={{ width: '70%', height: `${w.pct}%`, borderRadius: '8px 8px 0 0',
                background: i === weeks.length - 1 ? t.accent : `${t.accent}66`, transition: 'height 1s cubic-bezier(.2,.8,.2,1)', minHeight: 4 }} />
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day trend */}
      <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 7' }}>
        <div style={cardTitle}>30-day completion trend</div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 130 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.accent} stopOpacity="0.45" />
              <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" y1={H - g * H} x2={W} y2={H - g * H} stroke={t.border} strokeWidth="0.3" />
          ))}
          <path d={area} fill="url(#trendFill)" />
          <path d={line} fill="none" stroke={t.accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textMuted, marginTop: 4 }}>
          <span>30 days ago</span><span>today</span>
        </div>
      </div>

      {/* Mood distribution */}
      <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 5' }}>
        <div style={cardTitle}>Mood distribution</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 150, gap: 10 }}>
          {moodCount.map((c, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>{c}</div>
              <div style={{ width: '64%', height: `${(c / moodMax) * 100}%`, borderRadius: '8px 8px 0 0', minHeight: 4,
                background: `linear-gradient(180deg, ${window.WEEK_PALETTE[i % 5].bg}, ${window.WEEK_PALETTE[i % 5].bg}88)`,
                transition: 'height 1s cubic-bezier(.2,.8,.2,1)' }} />
              <div style={{ fontSize: 20, marginTop: 8 }}>{MOOD_EMOJI[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.AnalysisPanel = AnalysisPanel;
