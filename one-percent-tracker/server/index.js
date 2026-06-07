import './env.js' // must be first: loads .env before db.js reads credentials
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { db, initDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

// ---------- Password gate (enabled only when APP_PASSWORD is set) ----------
const PASSWORD = process.env.APP_PASSWORD
app.use((req, res, next) => {
  if (!PASSWORD) return next()
  const header = req.headers.authorization || ''
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const pass = decoded.slice(decoded.indexOf(':') + 1)
    if (pass === PASSWORD) return next()
  }
  res.set('WWW-Authenticate', 'Basic realm="1% Better Tracker"')
  return res.status(401).send('Authentication required')
})

const CATEGORIES = ['Non-Negotiables', 'Growth & Development']
const normType = (t) => (t === 'time' || t === 'number' ? t : 'checkbox')

// small wrapper so async errors become 500s instead of crashing the process
const h = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  })

// ---------- Habits ----------
app.get('/api/habits', h(async (req, res) => {
  const r = await db.execute('SELECT * FROM habits ORDER BY sort, id')
  res.json(r.rows)
}))

app.post('/api/habits', h(async (req, res) => {
  const { name, category, type = 'checkbox' } = req.body || {}
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' })
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'invalid category' })
  const max = await db.execute('SELECT COALESCE(MAX(sort), -1) + 1 AS m FROM habits')
  const sort = Number(max.rows[0].m)
  const ins = await db.execute({
    sql: 'INSERT INTO habits (name, category, type, sort) VALUES (?, ?, ?, ?)',
    args: [name.trim(), category, normType(type), sort],
  })
  const row = await db.execute({ sql: 'SELECT * FROM habits WHERE id = ?', args: [Number(ins.lastInsertRowid)] })
  res.json(row.rows[0])
}))

app.put('/api/habits/:id', h(async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.execute({ sql: 'SELECT * FROM habits WHERE id = ?', args: [id] })
  const existing = cur.rows[0]
  if (!existing) return res.status(404).json({ error: 'not found' })
  const name = (req.body?.name ?? existing.name).trim()
  const category = req.body?.category ?? existing.category
  const type = normType(req.body?.type ?? existing.type)
  if (!name) return res.status(400).json({ error: 'name required' })
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'invalid category' })
  await db.execute({
    sql: 'UPDATE habits SET name = ?, category = ?, type = ? WHERE id = ?',
    args: [name, category, type, id],
  })
  const row = await db.execute({ sql: 'SELECT * FROM habits WHERE id = ?', args: [id] })
  res.json(row.rows[0])
}))

app.delete('/api/habits/:id', h(async (req, res) => {
  const id = Number(req.params.id)
  await db.execute({ sql: 'DELETE FROM habit_logs WHERE habit_id = ?', args: [id] })
  await db.execute({ sql: 'DELETE FROM habits WHERE id = ?', args: [id] })
  res.json({ ok: true })
}))

// ---------- Logs ----------
app.get('/api/logs', h(async (req, res) => {
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from and to required' })
  const r = await db.execute({
    sql: 'SELECT habit_id, date, completed, minutes FROM habit_logs WHERE date >= ? AND date <= ?',
    args: [from, to],
  })
  res.json(r.rows)
}))

app.post('/api/logs', h(async (req, res) => {
  const { habit_id, date, completed = 0, minutes = 0 } = req.body || {}
  if (!habit_id || !date) return res.status(400).json({ error: 'habit_id and date required' })
  await db.execute({
    sql: `INSERT INTO habit_logs (habit_id, date, completed, minutes)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(habit_id, date)
          DO UPDATE SET completed = excluded.completed, minutes = excluded.minutes`,
    args: [habit_id, date, completed ? 1 : 0, Math.max(0, Number(minutes) || 0)],
  })
  const row = await db.execute({
    sql: 'SELECT habit_id, date, completed, minutes FROM habit_logs WHERE habit_id = ? AND date = ?',
    args: [habit_id, date],
  })
  res.json(row.rows[0])
}))

// ---------- Daily Wins ----------
const emptyWins = (date) => ({ date, today: ['', '', ''], tomorrow: ['', '', ''] })

app.get('/api/wins', h(async (req, res) => {
  const { date } = req.query
  if (!date) return res.status(400).json({ error: 'date required' })
  const r = await db.execute({ sql: 'SELECT * FROM daily_wins WHERE date = ?', args: [date] })
  const row = r.rows[0]
  if (!row) return res.json(emptyWins(date))
  res.json({
    date,
    today: [row.today_1, row.today_2, row.today_3],
    tomorrow: [row.tomorrow_1, row.tomorrow_2, row.tomorrow_3],
  })
}))

app.put('/api/wins', h(async (req, res) => {
  const { date, today = ['', '', ''], tomorrow = ['', '', ''] } = req.body || {}
  if (!date) return res.status(400).json({ error: 'date required' })
  await db.execute({
    sql: `INSERT INTO daily_wins (date, today_1, today_2, today_3, tomorrow_1, tomorrow_2, tomorrow_3)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            today_1 = excluded.today_1, today_2 = excluded.today_2, today_3 = excluded.today_3,
            tomorrow_1 = excluded.tomorrow_1, tomorrow_2 = excluded.tomorrow_2, tomorrow_3 = excluded.tomorrow_3`,
    args: [
      date,
      today[0] || '', today[1] || '', today[2] || '',
      tomorrow[0] || '', tomorrow[1] || '', tomorrow[2] || '',
    ],
  })
  res.json({ date, today, tomorrow })
}))

// ---------- To-Do list ----------
const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
function serverToday() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

app.get('/api/todos', h(async (req, res) => {
  const today = isYmd(req.query.today) ? req.query.today : serverToday()
  // Roll any overdue, still-incomplete task forward to today so it's never lost.
  await db.execute({
    sql: 'UPDATE todos SET due_date = ? WHERE due_date < ? AND completed = 0',
    args: [today, today],
  })
  // Return today + future (past completed tasks stay done and drop off the list).
  const r = await db.execute({
    sql: 'SELECT * FROM todos WHERE due_date >= ? ORDER BY due_date, id',
    args: [today],
  })
  res.json(r.rows)
}))

app.post('/api/todos', h(async (req, res) => {
  const { title, due_date } = req.body || {}
  if (!title || !title.trim()) return res.status(400).json({ error: 'title required' })
  if (!isYmd(due_date)) return res.status(400).json({ error: 'valid due_date required' })
  const ins = await db.execute({
    sql: 'INSERT INTO todos (title, due_date, completed) VALUES (?, ?, 0)',
    args: [title.trim(), due_date],
  })
  const row = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [Number(ins.lastInsertRowid)] })
  res.json(row.rows[0])
}))

app.put('/api/todos/:id', h(async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [id] })
  const e = cur.rows[0]
  if (!e) return res.status(404).json({ error: 'not found' })
  const title = (req.body?.title ?? e.title).trim()
  const due_date = req.body?.due_date ?? e.due_date
  const completed = req.body?.completed != null ? (req.body.completed ? 1 : 0) : e.completed
  if (!title) return res.status(400).json({ error: 'title required' })
  if (!isYmd(due_date)) return res.status(400).json({ error: 'valid due_date required' })
  await db.execute({
    sql: 'UPDATE todos SET title = ?, due_date = ?, completed = ? WHERE id = ?',
    args: [title, due_date, completed, id],
  })
  const row = await db.execute({ sql: 'SELECT * FROM todos WHERE id = ?', args: [id] })
  res.json(row.rows[0])
}))

app.delete('/api/todos/:id', h(async (req, res) => {
  await db.execute({ sql: 'DELETE FROM todos WHERE id = ?', args: [Number(req.params.id)] })
  res.json({ ok: true })
}))

// ---------- Serve built client in production ----------
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const PORT = process.env.PORT || 3001
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`1% Better Tracker API running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Database init failed:', err)
    process.exit(1)
  })
