import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { api } from '../api.js'
import {
  ymd, addDays, startOfWeek, weekDays, monthDays, startOfMonth, endOfMonth, isFuture, MONTHS,
} from '../lib/dates.js'
import { CATEGORIES, TARGETS, CATEGORY_COLOR, COLOR_HEX } from '../lib/habits.js'
import {
  buildLogMap, dayCompletion, rangeScore, categoryScore, streak, percentBetter, habitCount,
} from '../lib/scoring.js'
import { Card, Stat, ProgressBar, SectionTitle, pct } from '../components/ui.jsx'

export default function Dashboard({ habits }) {
  const now = new Date()
  const [logs, setLogs] = useState([])
  const [todos, setTodos] = useState([])

  const week = useMemo(() => weekDays(startOfWeek(now)), []) // eslint-disable-line
  const [mDays, mStart, mEnd] = useMemo(() => monthDays(now), []) // eslint-disable-line

  useEffect(() => {
    const from = ymd(addDays(startOfMonth(now), -40))
    const to = ymd(endOfMonth(now))
    api.getLogs(from, to).then(setLogs).catch(() => {})
    api.getTodos(ymd(now)).then(setTodos).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayStr = ymd(now)
  const tomorrowStr = ymd(addDays(now, 1))
  const openToday = todos.filter((t) => !t.completed && t.due_date === todayStr).length
  const openTomorrow = todos.filter((t) => !t.completed && t.due_date === tomorrowStr).length
  const openLater = todos.filter((t) => !t.completed && t.due_date > tomorrowStr).length

  const logMap = useMemo(() => buildLogMap(logs), [logs])

  const daily = dayCompletion(habits, ymd(now), logMap)
  const weekly = rangeScore(habits, week, logMap)
  const monthly = rangeScore(habits, mDays, logMap)
  const stk = streak(habits, logMap, now)
  const better = percentBetter(habits, mDays, logMap)

  const trend = mDays
    .filter((d) => !isFuture(d))
    .map((d) => ({ day: d.getDate(), score: Math.round(dayCompletion(habits, ymd(d), logMap) * 100) }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm muted">Your performance at a glance.</p>
      </div>

      {/* Scores + streak + % better */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Daily Score" value={pct(daily)} sub="today" />
        <Stat label="Weekly Score" value={pct(weekly)} sub="this week" />
        <Stat label="Monthly Score" value={pct(monthly)} sub="this month" />
        <Stat label="Streak" value={`${stk}`} sub={stk === 1 ? 'day' : 'days'} color="gold" />
        <Stat label="% Better" value={`+${better.toFixed(1)}%`} sub="compounded" color="blue" />
      </div>

      {/* To-Do summary */}
      <Card>
        <SectionTitle>To-Do — open items</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <TodoTile label="Today" value={openToday} accent="gold" />
          <TodoTile label="Tomorrow" value={openTomorrow} accent="blue" />
          <TodoTile label="Later" value={openLater} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <SectionTitle>{MONTHS[now.getMonth()]} Trend</SectionTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#23232b" vertical={false} />
                <XAxis dataKey="day" stroke="#6b6f7a" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#6b6f7a" tickLine={false} axisLine={false} fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#16161a', border: '1px solid #26262e', borderRadius: 12, color: '#e7e8ec' }}
                  formatter={(v) => [`${v}%`, 'Completion']}
                  labelFormatter={(l) => `${MONTHS[now.getMonth()]} ${l}`}
                />
                <Line type="monotone" dataKey="score" stroke={COLOR_HEX.gold} strokeWidth={2.5} dot={{ r: 2.5, fill: COLOR_HEX.gold }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category breakdown */}
        <Card>
          <SectionTitle>Category Breakdown</SectionTitle>
          <p className="mb-4 text-xs muted">This week</p>
          <div className="space-y-5">
            {CATEGORIES.map((cat) => {
              const s = categoryScore(habits, week, logMap, cat.name)
              return (
                <div key={cat.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className={cat.color === 'blue' ? 'text-blue' : 'text-gold'}>{cat.name}</span>
                    <span className="muted">{pct(s.pct)} · {s.completed}/{s.total}</span>
                  </div>
                  <ProgressBar value={s.pct * 100} color={cat.color} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Habit goals */}
      <Card>
        <SectionTitle>Habit Goals</SectionTitle>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {habits
            .filter((h) => TARGETS[h.name])
            .map((h) => {
              const t = TARGETS[h.name]
              const wk = habitCount(h, week, logMap)
              const mo = habitCount(h, mDays, logMap)
              const color = CATEGORY_COLOR[h.category]
              return (
                <div key={h.id} className="rounded-xl border border-line bg-panel2/40 p-4">
                  <div className="mb-3 text-sm font-semibold">{h.name}</div>
                  <GoalRow label="Weekly" value={wk} target={t.week} color={color} />
                  <div className="h-3" />
                  <GoalRow label="Monthly" value={mo} target={t.month} color={color} />
                </div>
              )
            })}
        </div>
      </Card>
    </div>
  )
}

function TodoTile({ label, value, accent }) {
  const color = accent === 'blue' ? 'text-blue' : accent === 'gold' ? 'text-gold' : 'text-white'
  return (
    <div className="rounded-xl border border-line bg-panel2/40 p-4 text-center">
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="mt-0.5 text-xs muted">{label}{value === 1 ? ' · 1 task' : ` · ${value} tasks`}</div>
    </div>
  )
}

function GoalRow({ label, value, target, color }) {
  const ratio = target ? Math.min(1, value / target) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="muted">{label}</span>
        <span className="font-medium">{value} / {target}</span>
      </div>
      <ProgressBar value={ratio * 100} color={color} height={6} />
    </div>
  )
}
