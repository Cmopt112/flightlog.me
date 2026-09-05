import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { createDraftFromLast, type Flight } from './models/flight'
import { FlightCard } from './components/FlightCard'
import { FlightForm } from './components/FlightForm'
import { Dashboard } from './components/Dashboard'
import { Settings } from './components/Settings'
import { UpdateBanner } from './components/UpdateBanner'

type Tab = 'flights' | 'dashboard' | 'settings'
type View = { tab: Tab; editing?: Flight | 'new' }

const TAGS_FILTER_ALL = 'All'

function recentDistinct(flights: Flight[], pick: (f: Flight) => string | undefined, limit: number): string[] {
  const seen: string[] = []
  for (const f of flights) {
    const value = pick(f)
    if (value && !seen.includes(value)) seen.push(value)
    if (seen.length >= limit) break
  }
  return seen
}

export default function App() {
  const [view, setView] = useState<View>({ tab: 'flights' })
  const [tagFilter, setTagFilter] = useState<string>(TAGS_FILTER_ALL)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const flights = useLiveQuery(() => db.flights.orderBy('date').reverse().toArray(), []) ?? []

  const allTags = useMemo(() => {
    const set = new Set<string>()
    flights.forEach((f) => f.tags.forEach((t) => set.add(t)))
    return [TAGS_FILTER_ALL, ...Array.from(set)]
  }, [flights])

  // Quick-pick chips for the form: most recent distinct values first (flights is
  // already sorted newest-first), so a repeat aircraft/crew is one tap, not a retype.
  const recentTails = useMemo(() => recentDistinct(flights, (f) => f.tailNumber, 5), [flights])
  const recentCrew = useMemo(() => recentDistinct(flights, (f) => f.crew, 5), [flights])

  const visibleFlights =
    tagFilter === TAGS_FILTER_ALL ? flights : flights.filter((f) => f.tags.includes(tagFilter))

  async function saveFlight(flight: Flight) {
    await db.flights.put(flight)
    setView({ tab: 'flights' })
  }

  async function deleteFlight(id: string) {
    await db.flights.delete(id)
    setView({ tab: 'flights' })
  }

  async function importFlights(imported: Flight[]) {
    await db.flights.bulkPut(imported)
  }

  function duplicateLast() {
    const last = flights[0]
    const draft = last
      ? { ...last, id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10) }
      : createDraftFromLast(undefined)
    setView({ tab: 'flights', editing: draft })
  }

  if (view.editing) {
    const initial = view.editing === 'new' ? createDraftFromLast(flights[0]) : view.editing
    return (
      <>
        <UpdateBanner />
        <FlightForm
          initial={initial}
          recentTails={recentTails}
          recentCrew={recentCrew}
          onSave={saveFlight}
          onCancel={() => setView({ tab: view.tab })}
          onDelete={
            view.editing !== 'new' ? () => deleteFlight((view.editing as Flight).id) : undefined
          }
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <UpdateBanner />
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-black/10 dark:border-white/10 p-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">flightlog.me</h1>
      </header>

      {view.tab === 'flights' && (
        <div className="max-w-lg mx-auto p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setView({ tab: 'flights', editing: 'new' })}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium"
            >
              + New flight
            </button>
            <button
              onClick={duplicateLast}
              disabled={flights.length === 0}
              className="py-3 px-4 rounded-lg border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              Duplicate last
            </button>
          </div>

          {allTags.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    tagFilter === tag
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {visibleFlights.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">
              No flights yet. Add your first one, or import your existing logbook from Settings.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleFlights.map((f) => (
                <FlightCard key={f.id} flight={f} onClick={() => setView({ tab: 'flights', editing: f })} />
              ))}
            </div>
          )}
        </div>
      )}

      {view.tab === 'dashboard' && <Dashboard flights={flights} />}

      {view.tab === 'settings' && (
        <Settings
          flights={flights}
          onImport={importFlights}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-black/10 dark:border-white/10 flex max-w-lg mx-auto">
        {(['flights', 'dashboard', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setView({ tab })}
            className={`flex-1 py-3 text-sm font-medium capitalize ${
              view.tab === tab ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  )
}
