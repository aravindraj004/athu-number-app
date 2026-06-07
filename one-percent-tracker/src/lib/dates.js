// Local-time date helpers (no UTC drift).

export function ymd(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// Monday-based start of week.
export function startOfWeek(d) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Mon=0 ... Sun=6
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}

export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function monthDays(d) {
  const start = startOfMonth(d)
  const end = endOfMonth(d)
  const out = []
  for (let i = 1; i <= end.getDate(); i++) {
    out.push(new Date(d.getFullYear(), d.getMonth(), i))
  }
  return [out, start, end]
}

export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function isFuture(d) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(d).setHours(0, 0, 0, 0) > today.getTime()
}

export function isSameDay(a, b) {
  return ymd(a) === ymd(b)
}
