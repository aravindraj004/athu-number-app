import { useEffect, useState } from 'react'
import { CATEGORIES } from '../lib/habits.js'

// Add or edit a habit. `habit` null => add mode.
export default function HabitModal({ open, habit, defaultCategory, onClose, onSave, onDelete }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(defaultCategory || CATEGORIES[0].name)
  const [type, setType] = useState('checkbox')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(habit ? habit.name : '')
    setCategory(habit ? habit.category : defaultCategory || CATEGORIES[0].name)
    setType(habit ? habit.type : 'checkbox')
    setBusy(false)
  }, [open, habit, defaultCategory])

  if (!open) return null

  async function save() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await onSave({ name: name.trim(), category, type })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    if (!confirm(`Delete "${habit.name}"? Its tracked history will be removed too.`)) return
    setBusy(true)
    try {
      await onDelete(habit)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md p-6">
        <h2 className="mb-5 text-lg font-bold">{habit ? 'Edit habit' : 'New habit'}</h2>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide muted">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="e.g. Cold shower"
          maxLength={40}
          className="w-full rounded-xl border border-line bg-panel2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50"
        />

        <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wide muted">Category</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => {
            const sel = category === c.name
            const on = c.color === 'blue'
              ? 'ring-1 ring-blue/50 bg-blue-soft text-blue'
              : 'ring-1 ring-gold/50 bg-gold-soft text-gold'
            return (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={'rounded-xl border border-line px-3 py-2.5 text-sm transition ' + (sel ? on : 'muted hover:bg-panel2')}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wide muted">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'checkbox', label: '✓ Check' },
            { id: 'time', label: '⏱ Time' },
            { id: 'number', label: '🔢 Number' },
          ].map((t) => {
            const sel = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={'rounded-xl border border-line px-3 py-2.5 text-sm transition ' + (sel ? 'bg-panel2 text-white ring-1 ring-white/20' : 'muted hover:bg-panel2')}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-xs muted">
          {type === 'checkbox' && 'A simple done / not-done tick each day.'}
          {type === 'time' && 'Log minutes per day (e.g. Family Time, Meditation).'}
          {type === 'number' && 'Log a number per day — decimals allowed (e.g. Steps 8000, Weight 72.5).'}
        </p>

        <div className="mt-7 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-line bg-panel2 px-4 py-3 text-sm font-semibold hover:bg-line">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!name.trim() || busy}
            className="flex-1 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Saving…' : habit ? 'Save' : 'Add habit'}
          </button>
        </div>

        {habit && (
          <button onClick={remove} disabled={busy} className="mt-4 w-full text-center text-xs text-red-400 underline hover:text-red-300 disabled:opacity-50">
            Delete this habit
          </button>
        )}
      </div>
    </div>
  )
}
