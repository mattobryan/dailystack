// ============================================================
// GridPanel — week-banded checkbox grid + summary rows
// ============================================================
const CELL = 28, LABEL_W = 172, GAP = 3;

function GridPanel({ t, store, viewDate, setViewDate, onToggle, today }) {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const weeks = window.monthWeeks(year, month);
  const todayISO = window.iso(today);
  const HABITS = window.getHabits(store);

  const dayStats = (date) => {
    const key = window.iso(date);
    const rec = store.data[key] || {};
    const active = HABITS.filter((h) => window.isHabitActiveOn(h, date));
    const done = active.filter((h) => rec[h.id]).length;
    return { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0 };
  };

  const inMonth = (d) => d.getMonth() === month;

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* ---- sticky label column ---- */}
      <div style={{ flex: `0 0 ${LABEL_W}px`, position: 'sticky', left: 0, zIndex: 3, background: t.surface }}>
        <div style={{ height: 56 }} />
        {window.getHabits(store).map((h) => (
          <div key={h.id} style={{
            height: CELL + GAP, display: 'flex', alignItems: 'center', gap: 9,
            fontSize: 13.5, color: t.text, fontWeight: 500, paddingRight: 10,
          }}>
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', filter: 'saturate(1.1)' }}>{h.emoji}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</span>
          </div>
        ))}
        <div style={{ height: 14 }} />
        {['Progress', 'Done', 'Not done'].map((lbl) => (
          <div key={lbl} style={{
            height: CELL - 2, display: 'flex', alignItems: 'center',
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: t.textMuted, fontWeight: 600,
          }}>{lbl}</div>
        ))}
      </div>

      {/* ---- scrollable weeks ---- */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 6 }}>
        {weeks.map((week, wi) => {
          const pal = window.WEEK_PALETTE[wi % window.WEEK_PALETTE.length];
          const weekNo = Math.ceil((week[0].getDate() + (inMonth(week[0]) ? 0 : 0)) / 7);
          return (
            <div key={wi} style={{ flex: '0 0 auto' }}>
              {/* band header — fixed 48px tall + 8px margin = 56 to match label spacer */}
              <div style={{
                background: pal.bg, borderRadius: 10, padding: '5px 6px',
                width: CELL * 7 + GAP * 6, height: 48, marginBottom: 8, boxSizing: 'border-box',
                boxShadow: `0 8px 22px -12px ${pal.bg}`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#fff',
                  opacity: 0.9, textTransform: 'uppercase', paddingLeft: 2, marginBottom: 2 }}>
                  Week {wi + 1}
                </div>
                <div style={{ display: 'flex', gap: GAP }}>
                  {week.map((d, di) => {
                    const isToday = window.iso(d) === todayISO;
                    return (
                      <div key={di} style={{ width: CELL, textAlign: 'center' }}>
                        <div style={{ fontSize: 8, color: '#fff', opacity: 0.6, fontWeight: 600 }}>{window.DOW_ABBR[di]}</div>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: 5, marginTop: 1,
                          background: isToday ? 'rgba(0,0,0,0.35)' : 'transparent',
                          opacity: inMonth(d) ? 1 : 0.45,
                        }}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* habit rows */}
              {HABITS.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: GAP, height: CELL + GAP }}>
                  {week.map((d, di) => {
                    const key = window.iso(d);
                    const rec = store.data[key] || {};
                    const checked = !!rec[h.id];
                    const active = window.isHabitActiveOn(h, d);
                    const out = !inMonth(d);
                    const isToday = key === todayISO;
                    const missed = (rec.__missed || []).includes(h.id);
                    let cell;
                    if (!active) {
                      cell = { opacity: 0.08, pointerEvents: 'none', border: `1.5px solid ${pal.bg}55` };
                    } else if (out) {
                      cell = { opacity: 0.12, pointerEvents: 'none', border: `1.5px solid ${pal.bg}55` };
                    } else if (missed && !checked) {
                      cell = { opacity: 0.35, background: t.surface2, border: `1.5px dashed ${t.border2}` };
                    } else if (checked) {
                      cell = { background: pal.bg, boxShadow: `0 0 14px -2px ${pal.bg}, inset 0 0 0 1px ${pal.light}66` };
                    } else {
                      cell = { border: `1.5px solid ${pal.bg}55`,
                        boxShadow: isToday ? `inset 0 0 0 2px ${pal.light}` : 'none' };
                    }
                    return (
                      <button key={di} onClick={() => active && !out && onToggle(h, key, d)}
                        title={`${h.label} · ${key}`}
                        style={{
                          width: CELL, height: CELL, borderRadius: 7, padding: 0, border: 'none',
                          background: 'transparent', cursor: active && !out ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'transform .12s, box-shadow .2s, background .2s', position: 'relative',
                          ...cell,
                        }}
                        onMouseDown={(e) => { if (active && !out) e.currentTarget.style.transform = 'scale(0.86)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                        {checked && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {missed && !checked && active && !out && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M18 6L6 18" stroke={t.textMuted} strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* summary rows */}
              <div style={{ height: 14 }} />
              {week.map ? null : null}
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', gap: GAP, height: CELL - 2 }}>
                  {week.map((d, di) => {
                    const s = dayStats(d);
                    const out = !inMonth(d);
                    let txt, col;
                    if (rowIdx === 0) { txt = s.total ? `${s.pct}` : '–'; col = s.pct >= 70 ? pal.light : s.pct >= 40 ? t.text : t.textMuted; }
                    else if (rowIdx === 1) { txt = s.done; col = t.text; }
                    else { txt = s.total - s.done; col = t.textMuted; }
                    return (
                      <div key={di} style={{
                        width: CELL, textAlign: 'center', fontSize: 11, fontWeight: 700,
                        color: out ? t.textDim : col, opacity: out ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{txt}{rowIdx === 0 && s.total ? <span style={{ fontSize: 7, opacity: 0.6 }}>%</span> : ''}</div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.GridPanel = GridPanel;
window.GRID_CONST = { CELL, LABEL_W, GAP };

// ============================================================
// WeekGrid — phone-first, one week at a time with prev/next nav
// ============================================================
function startOfWeek(d) {
  const s = new Date(d); s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - window.getDow(s));
  return s;
}

function WeekGrid({ t, store, weekStart, setWeekStart, onToggle, today }) {
  const HABITS = window.getHabits(store);
  const todayISO = window.iso(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });
  const thisWeekStart = startOfWeek(today);
  const isThisWeek = window.iso(weekStart) === window.iso(thisWeekStart);
  const pal = window.WEEK_PALETTE[(Math.floor(weekStart.getTime() / 6048e5)) % window.WEEK_PALETTE.length];

  const navWeek = (delta) => { const d = new Date(weekStart); d.setDate(d.getDate() + delta * 7); setWeekStart(d); };

  const dayStats = (date) => {
    const rec = store.data[window.iso(date)] || {};
    const active = HABITS.filter((h) => window.isHabitActiveOn(h, date));
    const done = active.filter((h) => rec[h.id]).length;
    return { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0 };
  };

  const fmt = (d) => `${window.MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  const rangeLabel = `${fmt(days[0])} – ${fmt(days[6])}`;

  const navBtnS = { width: 38, height: 38, borderRadius: 11, border: `1px solid ${t.border}`,
    background: t.surface, color: t.text, cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* week navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={() => navWeek(-1)} style={navBtnS} aria-label="Previous week">‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>{rangeLabel}</div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{isThisWeek ? 'This week' : weekStart.getFullYear()}</div>
        </div>
        <button onClick={() => navWeek(1)} style={navBtnS} aria-label="Next week">›</button>
      </div>
      {!isThisWeek && (
        <button onClick={() => setWeekStart(startOfWeek(today))} style={{ width: '100%', marginBottom: 14, padding: '9px 0',
          borderRadius: 11, border: 'none', background: pal.bg, color: '#fff', fontWeight: 600, fontSize: 13,
          fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}>Jump to this week</button>
      )}

      {/* day header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, paddingLeft: 0 }}>
          <div style={{ flex: '0 0 92px' }} />
          {days.map((d, i) => {
            const isToday = window.iso(d) === todayISO;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>{window.DOW_ABBR[i]}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: isToday ? '#fff' : t.text,
                  background: isToday ? pal.bg : 'transparent', borderRadius: 8, padding: '2px 0',
                  boxShadow: isToday ? `0 6px 16px -6px ${pal.bg}` : 'none' }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* habit rows */}
        {HABITS.map((h) => (
          <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: '0 0 92px', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{h.emoji}</span>
              <span style={{ fontSize: 12, color: t.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</span>
            </div>
            {days.map((d, di) => {
              const key = window.iso(d);
              const rec = store.data[key] || {};
              const checked = !!rec[h.id];
              const active = window.isHabitActiveOn(h, d);
              const future = d > today && window.iso(d) !== todayISO;
              const isToday = key === todayISO;
              const missed = (rec.__missed || []).includes(h.id);
              let cell;
              if (!active) cell = { opacity: 0.12, pointerEvents: 'none', border: `1.5px solid ${pal.bg}55` };
              else if (missed && !checked) cell = { opacity: 0.5, background: t.surface2, border: `1.5px dashed ${t.border2}` };
              else if (checked) cell = { background: pal.bg, boxShadow: `0 0 12px -2px ${pal.bg}, inset 0 0 0 1px ${pal.light}66` };
              else cell = { border: `1.5px solid ${pal.bg}55`, opacity: future ? 0.55 : 1,
                boxShadow: isToday ? `inset 0 0 0 2px ${pal.light}` : 'none' };
              return (
                <button key={di} onClick={() => active && onToggle(h, key, d)} title={`${h.label} · ${key}`}
                  style={{ flex: 1, aspectRatio: '1 / 1', minWidth: 0, borderRadius: 9, padding: 0,
                    background: 'transparent', border: 'none', cursor: active ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform .12s, box-shadow .2s, background .2s', ...cell }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = 'scale(0.86)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  {checked && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {missed && !checked && active && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke={t.textMuted} strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* completion strip */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
          <div style={{ flex: '0 0 92px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 700 }}>Done</div>
          {days.map((d, di) => {
            const s = dayStats(d);
            const out = d > today && window.iso(d) !== todayISO;
            const col = s.pct >= 70 ? pal.bg : s.pct >= 40 ? t.text : t.textMuted;
            return (
              <div key={di} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: out ? t.textDim : col, opacity: out ? 0.4 : 1 }}>{s.total ? `${s.pct}%` : '–'}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.WeekGrid = WeekGrid;
window.startOfWeek = startOfWeek;
