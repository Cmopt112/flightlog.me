import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Flight } from '../models/flight'
import {
  dischargesInYear,
  hoursByModel,
  hoursByRole,
  hoursInYear,
  hoursSince,
  monthlyBreakdown,
  simulatorHours,
  totalDischarges,
  totalHours,
} from '../lib/stats'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function Dashboard({ flights }: { flights: Flight[] }) {
  const years = useMemo(() => {
    const set = new Set(flights.map((f) => new Date(f.date).getFullYear()))
    set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [flights])
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear())

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const monthly = monthlyBreakdown(flights, year).map((hours, i) => ({ month: MONTH_LABELS[i], hours }))
  const byRole = hoursByRole(flights)
  const byModel = hoursByModel(flights)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <KpiTile label="Total" value={`${totalHours(flights)}h`} />
        <KpiTile label={`This year`} value={`${hoursInYear(flights, new Date().getFullYear())}h`} />
        <KpiTile label="Last 90 days" value={`${hoursSince(flights, ninetyDaysAgo)}h`} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Hours per month</h2>
          <select
            className="text-sm border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-slate-800 px-2 py-1"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="h-56 bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `${v}h`} />
              <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">By role</h2>
        <BreakdownList entries={Object.entries(byRole)} />
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">By aircraft</h2>
        <BreakdownList entries={Object.entries(byModel)} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <KpiTile label="Total discharges" value={`${totalDischarges(flights)}`} />
        <KpiTile label={`Discharges ${year}`} value={`${dischargesInYear(flights, year)}`} />
      </section>

      <section>
        <KpiTile label="Simulator hours (excluded above)" value={`${simulatorHours(flights)}h`} wide />
      </section>
    </div>
  )
}

function KpiTile({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`${wide ? 'col-span-full' : ''} bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 p-4 text-center`}
    >
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  )
}

function BreakdownList({ entries }: { entries: [string, number][] }) {
  const filtered = entries.filter(([, hours]) => hours > 0).sort((a, b) => b[1] - a[1])
  if (filtered.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
  }
  const max = Math.max(...filtered.map(([, h]) => h))
  return (
    <div className="space-y-2">
      {filtered.map(([label, hours]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-20 text-sm text-slate-600 dark:text-slate-300 shrink-0">{label}</span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(hours / max) * 100}%` }} />
          </div>
          <span className="text-sm font-mono text-slate-700 dark:text-slate-200 w-12 text-right">{hours}h</span>
        </div>
      ))}
    </div>
  )
}
