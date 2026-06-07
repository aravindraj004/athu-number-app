// Small shared presentational components.

export function Card({ className = '', children }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}

export function SectionTitle({ children, accent }) {
  const dot = accent === 'blue' ? 'bg-blue' : accent === 'gold' ? 'bg-gold' : 'bg-[#8b8f9a]'
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] muted">{children}</h3>
    </div>
  )
}

export function ProgressBar({ value, color = 'gold', height = 8 }) {
  const pct = Math.max(0, Math.min(100, value))
  const bar = color === 'blue' ? 'bg-blue' : 'bg-gold'
  return (
    <div className="w-full rounded-full bg-panel2" style={{ height }}>
      <div
        className={`${bar} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%`, height }}
      />
    </div>
  )
}

export function Stat({ label, value, sub, color }) {
  const text = color === 'blue' ? 'text-blue' : color === 'gold' ? 'text-gold' : 'text-white'
  return (
    <div className="card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] muted">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${text}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs muted">{sub}</div>}
    </div>
  )
}

export function pct(n) {
  return `${Math.round(n * 100)}%`
}
