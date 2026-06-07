import { createClient } from '@libsql/client'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In production set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) to use Turso (cloud
// SQLite). With no env vars set, we fall back to a local SQLite file so the app
// runs out of the box for development.
const url = process.env.TURSO_DATABASE_URL || 'file:' + path.join(__dirname, 'local.db')
const authToken = process.env.TURSO_AUTH_TOKEN

export const db = createClient(
  url.startsWith('file:') ? { url } : { url, authToken }
)

const SEED = [
  ['Meditation', 'Non-Negotiables', 'checkbox'],
  ['Daily Movement', 'Non-Negotiables', 'checkbox'],
  ['Journal', 'Non-Negotiables', 'checkbox'],
  ['Family Time', 'Non-Negotiables', 'time'],
  ["Today's Wins", 'Non-Negotiables', 'checkbox'],
  ["Tomorrow's Wins", 'Non-Negotiables', 'checkbox'],
  ['Bible Passage', 'Non-Negotiables', 'checkbox'],
  ['Big 3', 'Growth & Development', 'checkbox'],
  ['Sales Activity', 'Growth & Development', 'checkbox'],
  ['Content Creation', 'Growth & Development', 'checkbox'],
  ['Task Delegation', 'Growth & Development', 'checkbox'],
  ['Read 1 Chapter', 'Growth & Development', 'checkbox'],
]

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS habits (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT    NOT NULL,
      category TEXT    NOT NULL,
      type     TEXT    NOT NULL DEFAULT 'checkbox',
      sort     INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id  INTEGER NOT NULL,
      date      TEXT    NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      minutes   REAL    NOT NULL DEFAULT 0,
      UNIQUE(habit_id, date)
    );
    CREATE TABLE IF NOT EXISTS daily_wins (
      date       TEXT PRIMARY KEY,
      today_1    TEXT DEFAULT '',
      today_2    TEXT DEFAULT '',
      today_3    TEXT DEFAULT '',
      tomorrow_1 TEXT DEFAULT '',
      tomorrow_2 TEXT DEFAULT '',
      tomorrow_3 TEXT DEFAULT ''
    );
  `)

  const r = await db.execute('SELECT COUNT(*) AS c FROM habits')
  if (Number(r.rows[0].c) === 0) {
    await db.batch(
      SEED.map((row, i) => ({
        sql: 'INSERT INTO habits (name, category, type, sort) VALUES (?, ?, ?, ?)',
        args: [row[0], row[1], row[2], i],
      }))
    )
  }
}
