// ============================================================
// AnalysisPanel — one-page analytics: bars, weekly, 30d trend, mood,
//                 monthly retrospective, SMART failure chart
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

  // ---- monthly retrospective data ----
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthDays = [];
  for (let i = 0; i < today.getDate(); i++) {
    const d = new Date(monthStart); d.setDate(1 + i); monthDays.push(d);
  }
  const currentMonthName = window.MONTHS[today.getMonth()];

  // missed counts per habit this month
  const monthMissed = HABITS.map((h) => {
    let active = 0, missed = 0;
    monthDays.forEach((d) => {
      if (!window.isHabitActiveOn(h, d)) return;
      active++;
      if (!recOf(d)[h.id]) missed++;
    });
    return { ...h, missed, active, pct: active ? Math.round(((active - missed) / active) * 100) : 100 };
  }).filter((h) => h.active > 0).sort((a, b) => b.missed - a.missed);

  // reflection reason tally from this month
  const reasonTally = {};
  monthDays.forEach((d) => {
    const refs = recOf(d).reflections || {};
    Object.values(refs).forEach((r) => {
      if (r.reason) reasonTally[r.reason] = (reasonTally[r.reason] || 0) + 1;
    });
  });
  const topReason = Object.entries(reasonTally).sort((a, b) => b[1] - a[1])[0];

  // plain-language recommendation
  const topMissed = monthMissed.slice(0, 3).filter((h) => h.missed > 0);
  let recommendation = '';
  if (topMissed.length > 0) {
    const worstPct = topMissed[0].pct;
    if (worstPct < 40) recommendation = `Try scaling back ${topMissed[0].label} — consistency beats intensity. Start with 3 days a week before going daily.`;
    else if (worstPct < 70) recommendation = `You're close with ${topMissed[0].label}. Stack it onto an existing routine to make it harder to skip.`;
    else recommendation = `Solid month overall. Keep the momentum — your weakest habit is still above 70%.`;
    if (topReason && topReason[0] === 'Too busy') recommendation += ' Consider scheduling a fixed time slot for your top habits.';
    if (topReason && topReason[0] === 'Forgot') recommendation += ' Set a reminder for your most-missed habit.';
  }

  // ---- SMART failure chart data ----
  const SMART_DIMS = ['Specific', 'Measurable', 'Achievable', 'Realistic', 'Time-bound'];
  const SMART_DESC = {
    Specific: 'Goal wasn\'t clear or well-defined',
    Measurable: 'Progress was hard to track or quantify',
    Achievable: 'The target was too ambitious for the time frame',
    Realistic: 'External factors made success unlikely',
    'Time-bound': 'The deadline didn\'t create enough urgency',
  };
  const dimCounts = {};
  SMART_DIMS.forEach((d) => { dimCounts[d] = 0; });
  (store.goals || []).forEach((g) => {
    if (g.retrospective?.failedDimension) dimCounts[g.retrospective.failedDimension] = (dimCounts[g.retrospective.failedDimension] || 0) + 1;
  });
  const smartTotal = Object.values(dimCounts).reduce((a, b) => a + b, 0);
  const smartMax = Math.max(1, ...Object.values(dimCounts));
  const retroCount = (store.goals || []).filter((g) => g.retrospective).length;

  const card = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow };
  const cardTitle = { fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 700, marginBottom: 16 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)', gap: narrow ? 12 : 16 }}>
      {/* KPI strip */}
      {[
        { k: '30-day average', v: `${avg}%`, sub: 'completion' },
        { k: 'Best streak', v: Math.max(0, ...habitStats.map((h) => h.streak)), sub: habitStats.length ? `${[...habitStats].sort((a,b)=>b.streak-a.streak)[0].label}` : '—' },
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
          {[...habitStats].sort((a, b) => b.pct - a.pct).map((h) => (
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

      {/* Monthly Retrospective */}
      {topMissed.length > 0 && (
        <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 12' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={cardTitle}>Monthly retrospective · {currentMonthName}</div>
            {topReason && (
              <div style={{ fontSize: 12, color: t.textMuted, background: t.surface2, borderRadius: 20, padding: '5px 12px' }}>
                Top reason: <strong style={{ color: t.text }}>{topReason[0]}</strong> ({topReason[1]}×)
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr auto', gap: 14, alignItems: 'start' }}>
            {/* Top 3 missed habits */}
            {topMissed.map((h, i) => {
              const pal = window.WEEK_PALETTE[i % 5];
              return (
                <div key={h.id} style={{ background: t.surface2, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${pal.bg}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{h.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.label}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Missed {h.missed} of {h.active} days</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: h.pct < 50 ? '#D4156E' : h.pct < 75 ? '#E07B00' : t.accent, flexShrink: 0 }}>{h.pct}%</div>
                  </div>
                  <div style={{ height: 6, background: t.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${h.pct}%`, height: '100%', borderRadius: 3, background: h.pct < 50 ? '#D4156E' : h.pct < 75 ? '#E07B00' : pal.bg, transition: 'width .8s' }} />
                  </div>
                </div>
              );
            })}
            {/* Recommendation callout */}
            {recommendation && (
              <div style={{ background: `${t.accent}15`, border: `1px solid ${t.accent}40`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: narrow ? '1' : 'auto' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>💡</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.accent, marginBottom: 5 }}>Recommendation</div>
                  <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>{recommendation}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMART Failure Dimensions */}
      {smartTotal > 0 && (
        <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 12' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div style={cardTitle}>SMART failure dimensions · {retroCount} retrospective{retroCount !== 1 ? 's' : ''} completed</div>
            <div style={{ fontSize: 12, color: t.textMuted }}>Which SMART dimension most often caused goals to fall short</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SMART_DIMS.map((dim, i) => {
              const count = dimCounts[dim] || 0;
              const pct = Math.round((count / smartMax) * 100);
              const pal = window.WEEK_PALETTE[i % 5];
              return (
                <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: narrow ? 90 : 130, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{dim}</div>
                    {!narrow && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>{SMART_DESC[dim]}</div>}
                  </div>
                  <div style={{ flex: 1, height: 24, background: t.surface2, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 8,
                      background: count === 0 ? 'transparent' : `linear-gradient(90deg, ${pal.bg}, ${pal.bg}bb)`,
                      transition: 'width 1s cubic-bezier(.2,.8,.2,1)', minWidth: count > 0 ? 4 : 0 }} />
                    {count > 0 && (
                      <div style={{ position: 'absolute', left: `min(${pct}% + 8px, calc(100% - 50px))`, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap' }}>
                        {count} goal{count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ width: 32, textAlign: 'right', fontSize: 15, fontWeight: 700, color: count > 0 ? pal.bg : t.textMuted, flexShrink: 0 }}>
                    {count > 0 ? count : '—'}
                  </div>
                </div>
              );
            })}
          </div>
          {!narrow && (
            <div style={{ marginTop: 18, padding: '12px 16px', background: t.surface2, borderRadius: 10, fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              <strong style={{ color: t.text }}>How to read this:</strong> When you complete a goal retrospective, you rate which SMART dimension held you back most. This chart reveals patterns — if Achievable keeps appearing, your goals may need smaller milestones. If Realistic dominates, external constraints are the issue.
            </div>
          )}
        </div>
      )}

      {/* Empty state for SMART chart when no retros yet */}
      {smartTotal === 0 && retroCount === 0 && (store.goals || []).length > 0 && (
        <div style={{ ...card, gridColumn: narrow ? 'span 2' : 'span 12', opacity: 0.6 }}>
          <div style={cardTitle}>SMART failure dimensions</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: t.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 28 }}>📊</div>
            <div>Complete a goal retrospective to see which SMART dimensions are hardest for you. When a goal's duration elapses, you'll be prompted to review it.</div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AnalysisPanel = AnalysisPanel;
