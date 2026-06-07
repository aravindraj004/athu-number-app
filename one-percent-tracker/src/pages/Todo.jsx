import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { ymd, friendlyDate } from '../lib/dates.js'
import { Card, SectionTitle } from '../components/ui.jsx'
import TodoModal from '../components/TodoModal.jsx'

export default function Todo() {
  const today = ymd(new Date())
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(today)
  const [editing, setEditing] = useState(null)

  function reload() {
    api.getTodos(today).then(setTodos).catch(() => {})
  }
  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const todayList = useMemo(() => todos.filter((t) => t.due_date === today), [todos, today])
  const upcoming = useMemo(() => todos.filter((t) => t.due_date > today), [todos, today])

  // group upcoming by date
  const upcomingGroups = useMemo(() => {
    const map = new Map()
    for (const t of upcoming) {
      if (!map.has(t.due_date)) map.set(t.due_date, [])
      map.get(t.due_date).push(t)
    }
    return [...map.entries()] // [ [date, items], ... ] already sorted (todos sorted by date)
  }, [upcoming])

  async function add() {
    const text = title.trim()
    if (!text) return
    await api.createTodo({ title: text, due_date: due || today })
    setTitle('')
    setDue(today)
    reload()
  }
  async function toggle(t) {
    await api.updateTodo(t.id, { completed: t.completed ? 0 : 1 })
    reload()
  }
  async function save(data) {
    await api.updateTodo(editing.id, data)
    setEditing(null)
    reload()
  }
  async function remove(t) {
    await api.deleteTodo(t.id)
    setEditing(null)
    reload()
  }

  const remaining = todayList.filter((t) => !t.completed).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">To-Do List</h1>
        <p className="text-sm muted">
          Tasks due today plus what’s coming up. Anything left unfinished rolls over to the next day.
        </p>
      </div>

      {/* Quick add */}
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a task…"
            maxLength={140}
            className="flex-1 rounded-xl border border-line bg-panel2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            title="Due date"
            className="rounded-xl border border-line bg-panel2/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50"
          />
          <button
            onClick={add}
            disabled={!title.trim()}
            className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </Card>

      {/* Today */}
      <Card>
        <SectionTitle accent="gold">
          Today{remaining > 0 ? ` · ${remaining} left` : ''}
        </SectionTitle>
        {todayList.length === 0 ? (
          <div className="py-6 text-center text-sm muted">Nothing due today. 🎉</div>
        ) : (
          <div className="space-y-1">
            {todayList.map((t) => (
              <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onEdit={() => setEditing(t)} accent="gold" />
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming */}
      <Card>
        <SectionTitle accent="blue">Upcoming</SectionTitle>
        {upcomingGroups.length === 0 ? (
          <div className="py-6 text-center text-sm muted">No upcoming tasks. Add one with a future date above.</div>
        ) : (
          <div className="space-y-4">
            {upcomingGroups.map(([date, items]) => (
              <div key={date}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue">{friendlyDate(date)}</div>
                <div className="space-y-1">
                  {items.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={() => toggle(t)} onEdit={() => setEditing(t)} accent="blue" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TodoModal open={!!editing} todo={editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />
    </div>
  )
}

function TaskRow({ t, onToggle, onEdit, accent }) {
  const ring = accent === 'blue' ? 'ring-blue/50' : 'ring-gold/50'
  const fill = accent === 'blue' ? 'bg-blue border-blue text-ink' : 'bg-gold border-gold text-ink'
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-panel2/50">
      <button
        onClick={onToggle}
        className={
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm transition ' +
          (t.completed ? fill : 'border-line hover:' + ring + ' hover:ring-2')
        }
        title={t.completed ? 'Mark not done' : 'Mark done'}
      >
        {t.completed ? '✓' : ''}
      </button>
      <span className={'flex-1 text-sm ' + (t.completed ? 'muted line-through' : '')}>{t.title}</span>
      <button
        onClick={onEdit}
        title="Edit task"
        className="text-sm opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
      >
        ✎
      </button>
    </div>
  )
}
