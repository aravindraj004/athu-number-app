import { useEffect, useState } from 'react'

// Edit an existing task (title + due date), or delete it.
export default function TodoModal({ open, todo, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !todo) return
    setTitle(todo.title)
    setDue(todo.due_date)
    setBusy(false)
  }, [open, todo])

  if (!open || !todo) return null

  async function save() {
    if (!title.trim() || !due || busy) return
    setBusy(true)
    try {
      await onSave({ title: title.trim(), due_date: due })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    if (!confirm('Delete this task?')) return
    setBusy(true)
    try {
      await onDelete(todo)
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
        <h2 className="mb-5 text-lg font-bold">Edit task</h2>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide muted">Task</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          maxLength={140}
          className="w-full rounded-xl border border-line bg-panel2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50"
        />

        <label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-wide muted">Due date</label>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full rounded-xl border border-line bg-panel2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50"
        />

        <div className="mt-7 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-line bg-panel2 px-4 py-3 text-sm font-semibold hover:bg-line">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || !due || busy}
            className="flex-1 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>

        <button onClick={remove} disabled={busy} className="mt-4 w-full text-center text-xs text-red-400 underline hover:text-red-300 disabled:opacity-50">
          Delete this task
        </button>
      </div>
    </div>
  )
}
