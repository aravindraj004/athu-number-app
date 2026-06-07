import { Card } from '../components/ui.jsx'

export default function Coach() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-soft text-3xl">
          ◈
        </div>
        <h1 className="text-2xl font-bold">Coach</h1>
        <p className="mt-2 max-w-md text-sm muted">
          Your personal performance coach is coming soon — AI-guided reviews of your
          week, tailored nudges, and accountability built around the 1% philosophy.
        </p>
        <span className="mt-6 rounded-full border border-line bg-panel2 px-4 py-1.5 text-xs muted">
          Coming soon
        </span>
      </Card>
    </div>
  )
}
