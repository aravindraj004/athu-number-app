import { ymd, addDays, isFuture } from './dates.js'
import { SUCCESS_THRESHOLD } from './habits.js'

// Build a quick lookup map from logs: "habitId|date" -> { completed, minutes }
export function buildLogMap(logs) {
  const map = new Map()
  for (const l of logs) map.set(`${l.habit_id}|${l.date}`, l)
  return map
}

// Is a single habit complete on a given date?
// 'time' (minutes) and 'number' (e.g. steps/weight) both store their value in
// the `minutes` column and count as done once a value is logged.
export function isNumeric(habit) {
  return habit.type === 'time' || habit.type === 'number'
}

export function habitDone(habit, dateStr, logMap) {
  const l = logMap.get(`${habit.id}|${dateStr}`)
  if (!l) return false
  if (isNumeric(habit)) return (l.minutes || 0) > 0
  return !!l.completed
}

export function habitMinutes(habit, dateStr, logMap) {
  const l = logMap.get(`${habit.id}|${dateStr}`)
  return l ? l.minutes || 0 : 0
}

// Completion ratio (0..1) across all habits for one day.
export function dayCompletion(habits, dateStr, logMap) {
  if (!habits.length) return 0
  const done = habits.filter((h) => habitDone(h, dateStr, logMap)).length
  return done / habits.length
}

// Average completion over a set of dates, ignoring future days.
export function rangeScore(habits, dates, logMap) {
  const applicable = dates.filter((d) => !isFuture(d))
  if (!applicable.length) return 0
  const total = applicable.reduce((sum, d) => sum + dayCompletion(habits, ymd(d), logMap), 0)
  return total / applicable.length
}

// Category score for a set of days: completed cells / applicable (non-future) cells.
export function categoryScore(habits, dates, logMap, category) {
  const inCat = habits.filter((h) => h.category === category)
  const applicable = dates.filter((d) => !isFuture(d))
  const total = inCat.length * applicable.length
  if (total === 0) return { completed: 0, total: 0, pct: 0 }
  let completed = 0
  for (const h of inCat)
    for (const d of applicable) if (habitDone(h, ymd(d), logMap)) completed++
  return { completed, total, pct: completed / total }
}

// Consecutive successful days (>= threshold) ending today (or yesterday).
export function streak(habits, logMap, today = new Date()) {
  let count = 0
  let d = new Date(today)
  const ok = (date) => dayCompletion(habits, ymd(date), logMap) >= SUCCESS_THRESHOLD
  if (!ok(d)) d = addDays(d, -1)
  while (ok(d)) {
    count++
    d = addDays(d, -1)
  }
  return count
}

// "1% better" compounded growth across successful days this month.
export function percentBetter(habits, monthDates, logMap) {
  const successful = monthDates.filter(
    (d) => !isFuture(d) && dayCompletion(habits, ymd(d), logMap) >= SUCCESS_THRESHOLD
  ).length
  return (Math.pow(1.01, successful) - 1) * 100
}

// Count of completions for one habit across a set of dates.
export function habitCount(habit, dates, logMap) {
  return dates.filter((d) => habitDone(habit, ymd(d), logMap)).length
}
