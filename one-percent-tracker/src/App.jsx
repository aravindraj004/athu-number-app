import { useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Track from './pages/Track.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Todo from './pages/Todo.jsx'
import { api } from './api.js'

export default function App() {
  const [tab, setTab] = useState('track')
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function refreshHabits() {
    return api
      .getHabits()
      .then((h) => setHabits(h))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    refreshHabits().finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-full">
      <Nav active={tab} onChange={setTab} />
      <main className="mx-auto max-w-7xl px-5 py-6">
        {error && (
          <div className="card border-red-500/40 p-4 text-sm text-red-300">
            Couldn’t reach the server ({error}). Make sure the API is running on port 3001.
          </div>
        )}
        {loading ? (
          <div className="muted py-20 text-center">Loading…</div>
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard habits={habits} />}
            {tab === 'track' && <Track habits={habits} onHabitsChanged={refreshHabits} />}
            {tab === 'todo' && <Todo />}
          </>
        )}
      </main>
    </div>
  )
}
