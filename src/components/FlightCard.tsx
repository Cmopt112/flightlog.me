import type { Flight } from '../models/flight'
import { decimalHoursToHHMM } from '../lib/time'

export function FlightCard({ flight, onClick }: { flight: Flight; onClick: () => void }) {
  const route =
    flight.routeFrom || flight.routeTo ? `${flight.routeFrom ?? '?'} → ${flight.routeTo ?? '?'}` : null
  const landings = flight.landingsDay + flight.landingsNight

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{flight.date}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {flight.tailNumber || flight.model || 'Flight'}
          </div>
          {route && <div className="text-sm text-slate-600 dark:text-slate-300">{route}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {decimalHoursToHHMM(flight.totalTimeDecimal)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{flight.role}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {landings > 0 && <Badge>{landings} ldg</Badge>}
        {(flight.slingLoadCarries ?? 0) > 0 && <Badge tone="brand">{flight.slingLoadCarries} discharges</Badge>}
        {flight.isSimulator && <Badge tone="muted">Simulator</Badge>}
        {flight.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </button>
  )
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'brand' | 'muted' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    brand: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    muted: 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-600',
  }[tone]
  return <span className={`text-xs px-2 py-0.5 rounded-full ${toneClasses}`}>{children}</span>
}
