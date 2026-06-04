// ============================================================
// GoalsPanel + SMART NewGoalForm (with edit support)
// ============================================================
const { useState: useStateG } = React;

const SMART_STEPS = [
  { key: 'specific',  letter: 'S', word: 'Specific',   q: 'What exactly will you accomplish?', ph: 'e.g. Read "Atomic Habits" cover to cover' },
  { key: 'measurable',letter: 'M', word: 'Measurable', q: 'How will you measure progress?', ph: 'e.g. 20 chapters · 1 every 2 days' },
  { key: 'achievable',letter: 'A', word: 'Achievable', q: 'What makes this attainable for you?', ph: 'e.g. 25 minutes of reading each night' },
  { key: 'realistic', letter: 'R', word: 'Realistic',  q: 'Why is this realistic right now?', ph: 'e.g. I already own the book and have free evenings' },
  { key: 'timebound', letter: 'T', word: 'Time-bound', q: 'What is the deadline?', ph: 'Pick a duration below' },
];
const DURATIONS = [7, 14, 30, 60, 90];

// initialValues present → edit mode (preserves startDate, id)
function NewGoalForm({ t, store, onSave, onCancel, initialValues }) {
  const isEdit = !!initialValues;
  const [step, setStep] = useStateG(0);
  const [title, setTitle] = useStateG(initialValues?.title || '');
  const [smart, setSmart] = useStateG(initialValues?.smart || { specific: '', measurable: '', achievable: '', realistic: '', timebound: '' });
  const [duration, setDuration] = useStateG(() => {
    if (!initialValues) return 30;
    return DURATIONS.includes(initialValues.duration) ? initialValues.duration : 'custom';
  });
  const [custom, setCustom] = useStateG(
    initialValues && !DURATIONS.includes(initialValues.duration) ? String(initialValues.duration) : ''
  );
  const [colorIdx, setColorIdx] = useStateG(initialValues?.colorIdx ?? 0);
  const [linked, setLinked] = useStateG(initialValues?.linkedHabits || []);
  const [newHabits, setNewHabits] = useStateG([]);
  const [creating, setCreating] = useStateG(false);
  const [nhLabel, setNhLabel] = useStateG('');
  const [nhEmoji, setNhEmoji] = useStateG('✅');
  const [nhCat, setNhCat] = useStateG('body');

  const cur = SMART_STEPS[step - 1];
  const canNext = step === 0 ? title.trim() : (cur.key === 'timebound' ? true : smart[cur.key].trim());
  const total = SMART_STEPS.length + 1;

  const input = { width: '100%', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12,
    padding: '13px 15px', color: t.text, fontSize: 15, fontFamily: 'Outfit, sans-serif', outline: 'none' };
  const btn = (bg, fg, disabled) => ({ padding: '11px 22px', borderRadius: 11, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
    background: bg, color: fg, opacity: disabled ? 0.4 : 1, fontFamily: 'Outfit, sans-serif' });

  const save = () => {
    const dur = duration === 'custom' ? Math.max(1, parseInt(custom) || 30) : duration;
    const base = isEdit
      ? { id: initialValues.id, startDate: initialValues.startDate, retrospective: initialValues.retrospective }
      : { id: String(Date.now()), startDate: window.iso(new Date()) };
    onSave({
      ...base,
      title: title.trim(), description: smart.specific,
      smart, duration: dur, linkedHabits: linked, colorIdx,
      standalone: linked.length === 0 && newHabits.length === 0,
    }, newHabits);
  };

  const EMOJI_CHOICES = ['✅', '🏃', '📖', '💧', '🧘', '🎯', '📝', '🛏️', '🥗', '🧘‍♀️', '📵', '🙏'];
  const addNewHabit = () => {
    if (!nhLabel.trim()) return;
    setNewHabits([...newHabits, { label: nhLabel.trim(), emoji: nhEmoji, category: nhCat }]);
    setNhLabel(''); setNhEmoji('✅'); setNhCat('body'); setCreating(false);
  };

  const pal = window.WEEK_PALETTE[colorIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,6,16,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ width: 'min(560px, 100%)', background: t.surface, border: `1px solid ${t.border2}`, borderRadius: 22,
        padding: 30, boxShadow: '0 40px 100px -30px rgba(0,0,0,0.7)' }}>
        {/* progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? pal.bg : t.surface2, transition: 'background .3s' }} />
          ))}
        </div>

        {step === 0 ? (
          <div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: 'italic', fontSize: 30, color: t.text, marginBottom: 4 }}>
              {isEdit ? 'Edit goal' : 'New goal'}
            </div>
            <div style={{ fontSize: 14, color: t.textMuted, marginBottom: 22 }}>
              {isEdit ? 'Update any field — your start date and progress are preserved.' : "Name it — we'll shape it into a SMART goal together."}
            </div>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Read a book" style={input}
              onKeyDown={(e) => { if (e.key === 'Enter' && canNext) setStep(1); }} />
            <div style={{ fontSize: 12, color: t.textMuted, margin: '22px 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Accent colour</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {window.WEEK_PALETTE.map((p, i) => (
                <button key={i} onClick={() => setColorIdx(i)} style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                  background: p.bg, border: colorIdx === i ? `3px solid ${t.text}` : '3px solid transparent', transition: 'all .15s' }} />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: pal.bg, color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, fontFamily: "var(--serif)", fontStyle: 'italic' }}>{cur.letter}</div>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: pal.bg, fontWeight: 700 }}>{cur.word}</div>
                <div style={{ fontSize: 17, color: t.text, fontWeight: 600 }}>{cur.q}</div>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              {cur.key === 'timebound' ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DURATIONS.map((d) => (
                      <button key={d} onClick={() => { setDuration(d); setSmart({ ...smart, timebound: `${d} days` }); }}
                        style={btn(duration === d ? pal.bg : t.surface2, duration === d ? '#fff' : t.text)}>{d} days</button>
                    ))}
                    <button onClick={() => setDuration('custom')} style={btn(duration === 'custom' ? pal.bg : t.surface2, duration === 'custom' ? '#fff' : t.text)}>Custom</button>
                  </div>
                  {duration === 'custom' && (
                    <input type="number" min="1" autoFocus value={custom}
                      onChange={(e) => { setCustom(e.target.value); setSmart({ ...smart, timebound: `${e.target.value} days` }); }}
                      placeholder="Number of days" style={{ ...input, marginTop: 12 }} />
                  )}
                  {/* habit linker */}
                  <div style={{ fontSize: 12, color: t.textMuted, margin: '22px 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Track habits for this goal</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {window.getHabits(store).filter((h) => h.everyDay).map((h) => {
                      const on = linked.includes(h.id);
                      return (
                        <button key={h.id} onClick={() => setLinked(on ? linked.filter((x) => x !== h.id) : [...linked, h.id])}
                          style={{ ...btn(on ? pal.bg : t.surface2, on ? '#fff' : t.text), padding: '8px 13px', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span>{h.emoji}</span>{h.label}
                        </button>
                      );
                    })}
                    {newHabits.map((h, i) => (
                      <button key={'n' + i} onClick={() => setNewHabits(newHabits.filter((_, j) => j !== i))}
                        style={{ ...btn(pal.bg, '#fff'), padding: '8px 13px', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{h.emoji}</span>{h.label}<span style={{ opacity: 0.7, marginLeft: 2 }}>×</span>
                      </button>
                    ))}
                    {!creating && (
                      <button onClick={() => setCreating(true)}
                        style={{ ...btn('transparent', t.text), padding: '8px 13px', border: `1px dashed ${t.border2}` }}>+ New habit</button>
                    )}
                  </div>
                  {creating && (
                    <div style={{ marginTop: 12, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 600 }}>Create a habit to track daily</div>
                      <input autoFocus value={nhLabel} onChange={(e) => setNhLabel(e.target.value)} placeholder="e.g. Practice guitar"
                        onKeyDown={(e) => { if (e.key === 'Enter') addNewHabit(); }}
                        style={{ ...input, background: t.surface, marginBottom: 10 }} />
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {EMOJI_CHOICES.map((em) => (
                          <button key={em} onClick={() => setNhEmoji(em)} style={{ width: 36, height: 36, borderRadius: 10, fontSize: 18,
                            cursor: 'pointer', background: nhEmoji === em ? pal.bg : t.surface,
                            border: nhEmoji === em ? `1px solid ${pal.bg}` : `1px solid ${t.border}` }}>{em}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        {['body', 'work', 'mind', 'spirit'].map((c) => (
                          <button key={c} onClick={() => setNhCat(c)}
                            style={{ ...btn(nhCat === c ? pal.bg : t.surface, nhCat === c ? '#fff' : t.text), padding: '7px 13px', textTransform: 'capitalize' }}>{window.CAT_LABEL[c]}</button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setCreating(false); setNhLabel(''); }} style={btn('transparent', t.textMuted)}>Cancel</button>
                        <button disabled={!nhLabel.trim()} onClick={addNewHabit} style={btn(pal.bg, '#fff', !nhLabel.trim())}>Add habit</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea autoFocus value={smart[cur.key]} onChange={(e) => setSmart({ ...smart, [cur.key]: e.target.value })}
                  placeholder={cur.ph} rows={3} style={{ ...input, resize: 'none', lineHeight: 1.5 }} />
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button onClick={() => (step === 0 ? onCancel() : setStep(step - 1))} style={btn('transparent', t.textMuted)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < SMART_STEPS.length ? (
            <button disabled={!canNext} onClick={() => canNext && setStep(step + 1)} style={btn(pal.bg, '#fff', !canNext)}>Continue →</button>
          ) : (
            <button onClick={save} style={btn(pal.bg, '#fff')}>{isEdit ? 'Update goal ✓' : 'Create goal'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalCard({ t, goal, habits, onDelete, onEdit, onRemoveHabit }) {
  const pal = window.WEEK_PALETTE[goal.colorIdx];
  const elapsed = window.daysBetween(goal.startDate, new Date());
  const pct = Math.min(100, Math.round((elapsed / goal.duration) * 100));
  const left = Math.max(0, goal.duration - elapsed);
  const isComplete = elapsed >= goal.duration;
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.shadow,
      borderLeft: `4px solid ${pal.bg}`, position: 'relative' }}>
      <div style={{ paddingRight: 64 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{goal.title}</div>
        {goal.description && <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{goal.description}</div>}
      </div>
      {/* edit + delete buttons */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 5 }}>
        <button onClick={() => onEdit(goal)} title="Edit goal" style={{ width: 28, height: 28, borderRadius: 8,
          border: `1px solid ${t.border}`, background: t.surface2, cursor: 'pointer', fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button onClick={() => onDelete(goal.id)} title="Delete" style={{ width: 28, height: 28, borderRadius: 8,
          border: `1px solid ${t.border}`, background: t.surface2, color: t.textMuted, cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
      </div>

      {/* SMART chips */}
      <div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>
        {['S','M','A','R','T'].map((L, i) => {
          const k = ['specific','measurable','achievable','realistic','timebound'][i];
          const filled = goal.smart && goal.smart[k];
          return <span key={L} title={filled || ''} style={{ width: 22, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: filled ? `${pal.bg}22` : t.surface2, color: filled ? pal.bg : t.textDim }}>{L}</span>;
        })}
      </div>

      {goal.smart && goal.smart.measurable && (
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 10 }}>🎯 Target: <span style={{ color: t.text, fontWeight: 600 }}>{goal.smart.measurable}</span></div>
      )}

      {/* retrospective badge */}
      {goal.retrospective && (
        <div style={{ fontSize: 12, marginTop: 8, color: '#00C97A', fontWeight: 600 }}>
          ✓ Retrospective · {'★'.repeat(goal.retrospective.rating)}{'☆'.repeat(5 - goal.retrospective.rating)}
          {goal.retrospective.failedDimension && <span style={{ color: t.textMuted, fontWeight: 400 }}> · flagged <em>{goal.retrospective.failedDimension}</em></span>}
        </div>
      )}

      {/* progress bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ height: 9, background: t.surface2, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pal.bg, borderRadius: 5, transition: 'width 1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 12, color: t.textMuted }}>
          <span>Day {elapsed} / {goal.duration}</span>
          <span style={{ color: isComplete ? '#00C97A' : t.text, fontWeight: 600 }}>{isComplete ? 'Complete ✓' : `${left} days left`}</span>
        </div>
      </div>

      {/* linked habits with per-chip × to unlink */}
      {goal.linkedHabits && goal.linkedHabits.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {goal.linkedHabits.map((hid) => {
            const h = habits.find((x) => x.id === hid);
            if (!h) return null;
            return (
              <span key={hid} style={{ fontSize: 12, padding: '4px 6px 4px 10px', borderRadius: 20,
                background: t.surface2, color: t.text, display: 'flex', gap: 5, alignItems: 'center' }}>
                {h.emoji} {h.label}
                <button onClick={() => onRemoveHabit(goal.id, hid)} title="Unlink habit"
                  style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: t.border2,
                    color: t.textMuted, cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalsPanel({ t, store, addGoalWithHabits, updateGoal, deleteGoal, removeHabitFromGoal }) {
  const [adding, setAdding] = useStateG(false);
  const [editingGoal, setEditingGoal] = useStateG(null);
  const habits = window.getHabits(store);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: t.textMuted }}>{store.goals.length} active goal{store.goals.length !== 1 ? 's' : ''}</div>
        <button onClick={() => setAdding(true)} style={{ padding: '11px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, background: t.accent, color: '#fff', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>+ New SMART goal</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {store.goals.map((g) => (
          <GoalCard key={g.id} t={t} goal={g} habits={habits}
            onDelete={deleteGoal}
            onEdit={(goal) => setEditingGoal(goal)}
            onRemoveHabit={removeHabitFromGoal} />
        ))}
        {store.goals.length === 0 && (
          <div style={{ color: t.textMuted, fontSize: 14, padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
            No goals yet — create your first SMART goal.
          </div>
        )}
      </div>
      {adding && (
        <NewGoalForm t={t} store={store}
          onSave={(g, newHabits) => { addGoalWithHabits(g, newHabits); setAdding(false); }}
          onCancel={() => setAdding(false)} />
      )}
      {editingGoal && (
        <NewGoalForm t={t} store={store} initialValues={editingGoal}
          onSave={(g, newHabits) => { updateGoal(g, newHabits); setEditingGoal(null); }}
          onCancel={() => setEditingGoal(null)} />
      )}
    </div>
  );
}

window.GoalsPanel = GoalsPanel;
