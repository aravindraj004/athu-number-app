import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { ymd, startOfWeek, weekDays, addDays, DOW, isFuture, isSameDay } from '../lib/dates.js'
import { CATEGORIES } from '../lib/habits.js'
import {
  buildLogMap,
  habitDone,
  habitMinutes,
  dayCompletion,
  categoryScore,
} from '../lib/scoring.js'
import { pct } from '../components/ui.jsx'
import HabitModal from '../components/HabitModal.jsx'

export default function Track({ habits, onHabitsChanged }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [logs, setLogs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [addCategory, setAddCategory] = useState(null)
  const days = useMemo(() => weekDays(weekStart), [weekStart])
  const logMap = useMemo(() => buildLogMap(logs), [logs])

  const from = ymd(days[0])
  const to = ymd(days[6])

  function reload() {
    api.getLogs(from, to).then(setLogs).catch(() => {})
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  async function toggle(habit, date) {
    if (habit.type === 'time') return
    const dateStr = ymd(date)
    const done = habitDone(habit, dateStr, logMap)
    const saved = await api.saveLog({ habit_id: habit.id, date: dateStr, completed: done ? 0 : 1 })
    upsert(saved)
  }

  async function setMinutes(habit, date, value) {
    const dateStr = ymd(date)
    const raw = parseFloat(value)
    let m = isNaN(raw) || raw < 0 ? 0 : raw
    if (habit.type === 'time') m = Math.round(m) // minutes stay whole
    const saved = await api.saveLog({ habit_id: habit.id, date: dateStr, minutes: m, completed: m > 0 ? 1 : 0 })
    upsert(saved)
  }

  function upsert(saved) {
    setLogs((prev) => {
      const rest = prev.filter((l) => !(l.habit_id === saved.habit_id && l.date === saved.date))
      return [...rest, saved]
    })
  }

  function openAdd(category) {
    setEditing(null)
    setAddCategory(category)
    setModalOpen(true)
  }
  function openEdit(habit) {
    setEditing(habit)
    setAddCategory(null)
    setModalOpen(true)
  }
  async function handleSave(data) {
    if (editing) await api.updateHabit(editing.id, data)
    else await api.createHabit(data)
    await onHabitsChanged?.()
    setModalOpen(false)
    setEditing(null)
    reload()
  }
  async function handleDelete(habit) {
    await api.deleteHabit(habit.id)
    await onHabitsChanged?.()
    setModalOpen(false)
    setEditing(null)
    reload()
  }

  const grid = '160px repeat(7, minmax(0, 1fr))'

  return (
    <div className="space-y-5">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Track</h1>
          <p className="text-sm muted">Weekly habit grid — tap a cell to complete.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm hover:bg-panel2"
            onClick={() => setWeekStart(addDays(weekStart, -7))}>‹</button>
          <button className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm hover:bg-panel2"
            onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
          <button className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm hover:bg-panel2"
            onClick={() => setWeekStart(addDays(weekStart, 7))}>›</button>
        </div>
      </div>

      <div className="card overflow-x-auto p-4">
        <div className="min-w-[760px]">
          {/* Day columns + daily completion */}
          <div className="grid items-end gap-2 pb-3" style={{ gridTemplateColumns: grid }}>
            <div />
            {days.map((d) => {
              const today = isSameDay(d, new Date())
              const comp = dayCompletion(habits, ymd(d), logMap)
              return (
                <div key={ymd(d)} className={'rounded-xl px-2 py-2 text-center ' + (today ? 'bg-panel2 ring-1 ring-gold/40' : '')}>
                  <div className="text-[11px] uppercase tracking-wide muted">{DOW[(d.getDay() + 6) % 7]}</div>
                  <div className="text-lg font-bold leading-tight">{d.getDate()}</div>
                  <div className={'text-[11px] font-semibold ' + (comp >= 1 ? 'text-gold' : 'muted')}>
                    {comp >= 1 ? '★ ' : ''}{isFuture(d) ? '—' : pct(comp)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Categories */}
          {CATEGORIES.map((cat) => {
            const rows = habits.filter((h) => h.category === cat.name)
            if (!rows.length) return null
            return (
              <div key={cat.name} className="mb-1">
                <div className="flex items-center justify-between px-1 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <span className={'h-2 w-2 rounded-full ' + (cat.color === 'blue' ? 'bg-blue' : 'bg-gold')} />
                    <span className={'text-xs font-semibold uppercase tracking-[0.14em] ' + (cat.color === 'blue' ? 'text-blue' : 'text-gold')}>
                      {cat.name}
                    </span>
                  </div>
                  <button
                    onClick={() => openAdd(cat.name)}
                    className={'rounded-lg border border-line px-2 py-1 text-xs transition hover:bg-panel2 ' + (cat.color === 'blue' ? 'text-blue' : 'text-gold')}
                  >
                    + Add
                  </button>
                </div>
                {rows.map((h) => (
                  <div key={h.id} className="grid items-center gap-2 py-1" style={{ gridTemplateColumns: grid }}>
                    <div className="group flex min-w-0 items-center gap-1 pr-2 text-sm">
                      <button
                        onClick={() => openEdit(h)}
                        title="Edit habit"
                        className="truncate text-left transition hover:text-white"
                      >
                        {h.type === 'time' && <span className="mr-1 opacity-60">⏱</span>}
                        {h.type === 'number' && <span className="mr-1 opacity-60">#</span>}
                        {h.name}
                      </button>
                      <button
                        onClick={() => openEdit(h)}
                        title="Edit habit"
                        className="text-xs opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
                      >
                        ✎
                      </button>
                    </div>
                    {days.map((d) => (
                      <Cell
                        key={ymd(d)}
                        habit={h}
                        date={d}
                        color={cat.color}
                        done={habitDone(h, ymd(d), logMap)}
                        minutes={habitMinutes(h, ymd(d), logMap)}
                        onToggle={() => toggle(h, d)}
                        onMinutes={(m) => setMinutes(h, d, m)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Category summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const s = categoryScore(habits, days, logMap, cat.name)
          return (
            <div key={cat.name} className="card p-5 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] muted">{cat.name}</div>
              <div className={'mt-1 text-4xl font-extrabold ' + (cat.color === 'blue' ? 'text-blue' : 'text-gold')}>
                {pct(s.pct)}
              </div>
              <div className="mt-0.5 text-xs muted">{s.completed}/{s.total}</div>
            </div>
          )
        })}
      </div>

      <HabitModal
        open={modalOpen}
        habit={editing}
        defaultCategory={addCategory}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

function Cell({ habit, date, color, done, minutes, onToggle, onMinutes }) {
  const future = isFuture(date)
  const ring = color === 'blue' ? 'ring-blue/30' : 'ring-gold/30'
  const fill = color === 'blue'
    ? 'bg-blue-soft text-blue ring-1 ring-blue/40'
    : 'bg-gold-soft text-gold ring-1 ring-gold/40'
  const base = 'flex h-11 items-center justify-center rounded-xl border border-line transition select-none'

  if (habit.type === 'time' || habit.type === 'number') {
    const isTime = habit.type === 'time'
    return (
      <input
        type="number"
        min="0"
        step={isTime ? '1' : 'any'}
        inputMode={isTime ? 'numeric' : 'decimal'}
        placeholder={isTime ? '0m' : '0'}
        value={minutes ? minutes : ''}
        onChange={(e) => onMinutes(e.target.value)}
        title={isTime ? 'Minutes' : 'Value'}
        className={
          base + ' w-full bg-transparent text-center text-sm outline-none focus:ring-2 ' +
          ring + ' ' + (minutes > 0 ? fill : 'muted ' + (future ? 'opacity-50' : 'hover:bg-panel2'))
        }
      />
    )
  }

  return (
    <button
      onClick={onToggle}
      className={
        base + ' ' + (done ? fill : 'bg-transparent hover:bg-panel2 ' + (future ? 'opacity-50' : 'muted'))
      }
    >
      {done ? '✓' : ''}
    </button>
  )
}
