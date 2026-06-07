import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ymd } from '../lib/dates.js'
import { Card, SectionTitle } from '../components/ui.jsx'

export default function Wins() {
  const date = ymd(new Date())
  const [today, setToday] = useState(['', '', ''])
  const [tomorrow, setTomorrow] = useState(['', '', ''])
  const [status, setStatus] = useState('')

  useEffect(() => {
    api
      .getWins(date)
      .then((w) => {
        setToday(w.today || ['', '', ''])
        setTomorrow(w.tomorrow || ['', '', ''])
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function persist(nextToday, nextTomorrow) {
    setStatus('Saving…')
    try {
      await api.saveWins({ date, today: nextToday, tomorrow: nextTomorrow })
      setStatus('Saved ✓')
    } catch {
      setStatus('Save failed')
    }
  }

  const onToday = (i, v) => setToday((p) => p.map((x, idx) => (idx === i ? v : x)))
  const onTomorrow = (i, v) => setTomorrow((p) => p.map((x, idx) => (idx === i ? v : x)))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold">Wins</h1>
          <p className="text-sm muted">Daily reflection — capture momentum.</p>
        </div>
        <span className="text-xs muted">{status}</span>
      </div>

      <Card>
        <SectionTitle accent="gold">3 Wins of Today</SectionTitle>
        <div className="space-y-3">
          {today.map((v, i) => (
            <WinInput
              key={i}
              index={i}
              value={v}
              onChange={(val) => onToday(i, val)}
              onBlur={() => persist(today, tomorrow)}
              accent="gold"
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle accent="blue">3 Wins for Tomorrow</SectionTitle>
        <div className="space-y-3">
          {tomorrow.map((v, i) => (
            <WinInput
              key={i}
              index={i}
              value={v}
              onChange={(val) => onTomorrow(i, val)}
              onBlur={() => persist(today, tomorrow)}
              accent="blue"
            />
          ))}
        </div>
        <p className="mt-4 text-xs italic muted">
          Tomorrow’s wins will appear on your dashboard as a reminder.
        </p>
      </Card>
    </div>
  )
}

function WinInput({ index, value, onChange, onBlur, accent }) {
  const ring = accent === 'blue' ? 'focus:ring-blue/50' : 'focus:ring-gold/50'
  const num = accent === 'blue' ? 'text-blue' : 'text-gold'
  return (
    <div className="flex items-center gap-3">
      <span className={`w-6 text-center text-sm font-bold ${num}`}>{index + 1}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={`Win #${index + 1}`}
        className={`w-full rounded-xl border border-line bg-panel2/50 px-4 py-3 text-sm outline-none transition focus:ring-2 ${ring}`}
      />
    </div>
  )
}
