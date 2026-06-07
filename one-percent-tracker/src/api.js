const json = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  getHabits: () => fetch('/api/habits').then(json),

  createHabit: (habit) =>
    fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    }).then(json),

  updateHabit: (id, habit) =>
    fetch(`/api/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    }).then(json),

  deleteHabit: (id) =>
    fetch(`/api/habits/${id}`, { method: 'DELETE' }).then(json),

  getLogs: (from, to) =>
    fetch(`/api/logs?from=${from}&to=${to}`).then(json),

  saveLog: (entry) =>
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).then(json),

  getWins: (date) => fetch(`/api/wins?date=${date}`).then(json),

  saveWins: (payload) =>
    fetch('/api/wins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json),
}
