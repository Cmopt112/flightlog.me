import { useState } from 'react'
import type { Aircraft, AircraftCharacteristics } from '../models/aircraft'
import { createAircraft, findUnregisteredAircraft } from '../models/aircraft'
import type { Flight } from '../models/flight'

const CHARACTERISTICS: { key: keyof AircraftCharacteristics; label: string }[] = [
  { key: 'turbine', label: 'Turbine' },
  { key: 'complex', label: 'Complex' },
  { key: 'controllablePitchProp', label: 'Controllable pitch prop' },
  { key: 'flaps', label: 'Flaps' },
  { key: 'retract', label: 'Retractable gear' },
  { key: 'tailwheel', label: 'Tailwheel' },
  { key: 'highPerformance', label: 'High performance' },
  { key: 'taa', label: 'TAA' },
]

export function AircraftSettings({
  aircraft,
  flights,
  onSave,
  onDelete,
  onBulkAdd,
}: {
  aircraft: Aircraft[]
  flights: Flight[]
  onSave: (a: Aircraft) => void
  onDelete: (id: string) => void
  onBulkAdd: (list: Aircraft[]) => void
}) {
  const [editing, setEditing] = useState<Aircraft | null>(null)
  const unregistered = findUnregisteredAircraft(flights, aircraft)

  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">Aircraft</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Saved aircraft show up as one-tap picks on the flight entry form.
      </p>

      {aircraft.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No aircraft saved yet.</p>
      ) : (
        <div className="space-y-2">
          {aircraft.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 p-3"
            >
              <button className="text-left flex-1" onClick={() => setEditing(a)}>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{a.tailNumber}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{a.model}</div>
              </button>
              <button
                onClick={() => onDelete(a.id)}
                className="text-sm text-red-600 dark:text-red-400 px-3 py-1"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200"
          onClick={() => setEditing(createAircraft())}
        >
          + Add aircraft
        </button>
        {unregistered.length > 0 && (
          <button
            className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200"
            onClick={() => onBulkAdd(unregistered)}
          >
            Add {unregistered.length} from flight history
          </button>
        )}
      </div>

      {editing && (
        <AircraftForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(a) => {
            onSave(a)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function AircraftForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Aircraft
  onSave: (a: Aircraft) => void
  onCancel: () => void
}) {
  const [aircraft, setAircraft] = useState(initial)
  const inputClass =
    'w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 text-sm'

  function toggleCharacteristic(key: keyof AircraftCharacteristics) {
    setAircraft((a) => ({
      ...a,
      characteristics: { ...a.characteristics, [key]: !a.characteristics[key] },
    }))
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-3">
      <input
        className={inputClass}
        placeholder="Tail number, e.g. EC-GOP"
        value={aircraft.tailNumber}
        onChange={(e) => setAircraft((a) => ({ ...a, tailNumber: e.target.value }))}
      />
      <input
        className={inputClass}
        placeholder="Model, e.g. BH-412, Bell"
        value={aircraft.model}
        onChange={(e) => setAircraft((a) => ({ ...a, model: e.target.value }))}
      />
      <input
        className={inputClass}
        placeholder="ICAO model, e.g. B412"
        value={aircraft.icaoModel ?? ''}
        onChange={(e) => setAircraft((a) => ({ ...a, icaoModel: e.target.value || undefined }))}
      />
      <div className="flex flex-wrap gap-2">
        {CHARACTERISTICS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleCharacteristic(key)}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              aircraft.characteristics[key]
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...aircraft, updatedAt: new Date().toISOString() })}
          disabled={!aircraft.tailNumber}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}
