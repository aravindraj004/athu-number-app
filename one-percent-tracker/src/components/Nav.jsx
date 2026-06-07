const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'track', label: 'Track', icon: '▣' },
  { id: 'todo', label: 'To-Do', icon: '✓' },
]

export default function Nav({ active, onChange }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-charcoal/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_12px_2px_rgba(231,183,60,0.6)]" />
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight">1% Better Tracker</div>
            <div className="text-[11px] muted">Blake Fontana</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ' +
                (active === t.id
                  ? 'bg-panel2 text-white shadow-sm'
                  : 'muted hover:text-white')
              }
            >
              <span className="text-xs opacity-70">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
