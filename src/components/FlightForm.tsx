import { useEffect, useRef, useState } from 'react'
import type { Aircraft } from '../models/aircraft'
import type { AdvancedFields, Flight, FlightTag, Role } from '../models/flight'
import {
  combineDateAndTime,
  decimalHoursToHHMM,
  durationBetweenClockTimes,
  extractTimeOfDay,
  hhmmToDecimalHours,
} from '../lib/time'

const ROLES: Role[] = ['Dual', 'PIC', 'SIC', 'CFI']
const PRESET_TAGS: FlightTag[] = ['Training', 'Firefighting', 'Ferry', 'Simulator', 'Checkride']

type AdvancedFieldConfig =
  | { key: keyof AdvancedFields; label: string; type: 'text' }
  | { key: keyof AdvancedFields; label: string; type: 'number' }
  | { key: keyof AdvancedFields; label: string; type: 'boolean' }

const ADVANCED_FIELDS: AdvancedFieldConfig[] = [
  { key: 'approaches', label: 'Approaches', type: 'number' },
  { key: 'hold', label: 'Hold', type: 'number' },
  { key: 'xCountry', label: 'Cross-country (hrs)', type: 'number' },
  { key: 'night', label: 'Night (hrs)', type: 'number' },
  { key: 'imc', label: 'IMC (hrs)', type: 'number' },
  { key: 'simulatedInstrument', label: 'Simulated instrument (hrs)', type: 'number' },
  { key: 'groundSimulator', label: 'Ground simulator (hrs)', type: 'number' },
  { key: 'fsNightLandings', label: 'Full-stop night landings', type: 'number' },
  { key: 'fsDayLandings', label: 'Full-stop day landings', type: 'number' },
  { key: 'hobbsStart', label: 'Hobbs start', type: 'number' },
  { key: 'hobbsEnd', label: 'Hobbs end', type: 'number' },
  { key: 'engineStart', label: 'Engine start (UTC)', type: 'text' },
  { key: 'engineEnd', label: 'Engine end (UTC)', type: 'text' },
  { key: 'blockIn', label: 'Block in', type: 'text' },
  { key: 'blockOut', label: 'Block out', type: 'text' },
  { key: 'complex', label: 'Complex', type: 'boolean' },
  { key: 'controllablePitchProp', label: 'Controllable pitch prop', type: 'boolean' },
  { key: 'flaps', label: 'Flaps', type: 'boolean' },
  { key: 'retract', label: 'Retractable gear', type: 'boolean' },
  { key: 'tailwheel', label: 'Tailwheel', type: 'boolean' },
  { key: 'highPerformance', label: 'High performance', type: 'boolean' },
  { key: 'turbine', label: 'Turbine', type: 'boolean' },
  { key: 'taa', label: 'TAA', type: 'boolean' },
  { key: 'checkrideNewRating', label: 'Checkride - new rating', type: 'boolean' },
  { key: 'externalLineUnder50ft', label: 'External line - under 50ft', type: 'boolean' },
  { key: 'simulatorTrainingDeviceId', label: 'Simulator/training device ID', type: 'text' },
  { key: 'signatureState', label: 'Signature state', type: 'text' },
  { key: 'cfiName', label: 'CFI name', type: 'text' },
  { key: 'cfiComment', label: 'CFI comment', type: 'text' },
]

export function FlightForm({
  initial,
  aircraft = [],
  recentTails = [],
  recentCrew = [],
  onSave,
  onDelete,
  onCancel,
}: {
  initial: Flight
  aircraft?: Aircraft[]
  recentTails?: string[]
  recentCrew?: string[]
  onSave: (flight: Flight) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const [flight, setFlight] = useState<Flight>(initial)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAircraftPicker, setShowAircraftPicker] = useState(false)

  function pickAircraft(a: Aircraft) {
    setFlight((f) => ({
      ...f,
      model: a.model,
      icaoModel: a.icaoModel,
      tailNumber: a.tailNumber,
      categoryClass: a.categoryClass,
      advanced: { ...f.advanced, ...a.characteristics },
    }))
    setShowAircraftPicker(false)
  }

  // Only the 5 most recently flown aircraft show as chips; anything else is one tap
  // away via "More" instead of dumping every saved aircraft into the form at once.
  const recentAircraft = recentTails
    .map((tail) => aircraft.find((a) => a.tailNumber === tail))
    .filter((a): a is Aircraft => !!a)
    .slice(0, 5)

  // Only show tails as plain "recent" chips when they aren't already covered by a
  // saved aircraft above, so the same tail number doesn't appear in both rows.
  const unregisteredRecentTails = recentTails.filter((t) => !aircraft.some((a) => a.tailNumber === t))

  // Clock times (Flight Start/End) are the primary, fast way to log a time - duration
  // is derived from them. Falls back to typing a duration directly for flights where
  // there's no precise clock time (older entries, quick logging, imported data that
  // only ever had a total).
  const [timeMode, setTimeMode] = useState<'clock' | 'duration'>(() =>
    initial.advanced.flightStart && initial.advanced.flightEnd
      ? 'clock'
      : initial.totalTimeDecimal
        ? 'duration'
        : 'clock',
  )
  const [departure, setDeparture] = useState(() => extractTimeOfDay(initial.advanced.flightStart))
  const [landing, setLanding] = useState(() => extractTimeOfDay(initial.advanced.flightEnd))

  function update<K extends keyof Flight>(key: K, value: Flight[K]) {
    setFlight((f) => ({ ...f, [key]: value }))
  }

  function updateClockTimes(nextDeparture: string, nextLanding: string) {
    setDeparture(nextDeparture)
    setLanding(nextLanding)
    setFlight((f) => ({
      ...f,
      totalTimeDecimal:
        nextDeparture && nextLanding
          ? durationBetweenClockTimes(nextDeparture, nextLanding)
          : f.totalTimeDecimal,
      advanced: {
        ...f.advanced,
        flightStart: nextDeparture ? combineDateAndTime(f.date, nextDeparture) : undefined,
        flightEnd: nextLanding ? combineDateAndTime(f.date, nextLanding) : undefined,
      },
    }))
  }

  function updateAdvanced<K extends keyof AdvancedFields>(key: K, value: AdvancedFields[K]) {
    setFlight((f) => ({ ...f, advanced: { ...f.advanced, [key]: value } }))
  }

  function toggleTag(tag: FlightTag) {
    setFlight((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
      <Field label="Date">
        <input
          type="date"
          className={inputClass}
          value={flight.date}
          onChange={(e) => update('date', e.target.value)}
        />
      </Field>
      {timeMode === 'clock' ? (
        <>
          <div className="grid grid-cols-2 gap-6">
            <Field label="Departure">
              <input
                type="time"
                className={inputClass}
                value={departure}
                onChange={(e) => updateClockTimes(e.target.value, landing)}
              />
            </Field>
            <Field label="Landing">
              <input
                type="time"
                className={inputClass}
                value={landing}
                onChange={(e) => updateClockTimes(departure, e.target.value)}
              />
            </Field>
          </div>
          {departure && landing && (
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
              Duration: <span className="font-mono">{decimalHoursToHHMM(flight.totalTimeDecimal)}</span>
            </p>
          )}
        </>
      ) : (
        <Field label="Total time (HH:MM)">
          <input
            type="text"
            className={inputClass}
            placeholder="1:30"
            defaultValue={decimalHoursToHHMM(flight.totalTimeDecimal)}
            onBlur={(e) => update('totalTimeDecimal', hhmmToDecimalHours(e.target.value || '0:00'))}
          />
        </Field>
      )}
      <button
        type="button"
        onClick={() => setTimeMode((m) => (m === 'clock' ? 'duration' : 'clock'))}
        className="text-xs text-blue-600 dark:text-blue-400 font-medium -mt-2"
      >
        {timeMode === 'clock' ? 'Enter duration directly instead' : 'Enter departure/landing time instead'}
      </button>

      {aircraft.length > 0 && (
        <Field label="Aircraft">
          <div className="flex flex-wrap gap-1.5">
            {recentAircraft.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAircraft(a)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {a.tailNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAircraftPicker(true)}
              className="text-xs px-2.5 py-1 rounded-full border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-medium"
            >
              {aircraft.length > recentAircraft.length ? 'More…' : 'Select…'}
            </button>
          </div>
        </Field>
      )}

      {showAircraftPicker && (
        <AircraftPickerModal
          aircraft={aircraft}
          onPick={pickAircraft}
          onClose={() => setShowAircraftPicker(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Model">
          <input
            type="text"
            className={inputClass}
            placeholder="BH-412, Bell"
            value={flight.model}
            onChange={(e) => update('model', e.target.value)}
          />
        </Field>
        <Field label="Tail number">
          <input
            type="text"
            className={inputClass}
            placeholder="EC-GOP"
            value={flight.tailNumber}
            onChange={(e) => update('tailNumber', e.target.value)}
          />
        </Field>
      </div>

      {unregisteredRecentTails.length > 0 && (
        <ChipRow
          options={unregisteredRecentTails}
          onPick={(tail) => update('tailNumber', tail)}
        />
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <Field label="Route from">
          <input
            type="text"
            className={inputClass}
            placeholder="HHER"
            value={flight.routeFrom ?? ''}
            onChange={(e) => update('routeFrom', e.target.value || undefined)}
          />
        </Field>
        <button
          type="button"
          aria-label="Swap route direction"
          onClick={() =>
            setFlight((f) => ({ ...f, routeFrom: f.routeTo, routeTo: f.routeFrom }))
          }
          className="h-10 w-10 rounded-lg border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center"
        >
          ⇄
        </button>
        <Field label="Route to">
          <input
            type="text"
            className={inputClass}
            placeholder="LEON"
            value={flight.routeTo ?? ''}
            onChange={(e) => update('routeTo', e.target.value || undefined)}
          />
        </Field>
      </div>

      <Field label="Role">
        <div className="flex gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => update('role', role)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                flight.role === role
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Landings (day)">
          <NumberStepper value={flight.landingsDay} onChange={(v) => update('landingsDay', v)} />
        </Field>
        <Field label="Landings (night)">
          <NumberStepper value={flight.landingsNight} onChange={(v) => update('landingsNight', v)} />
        </Field>
      </div>

      <Field label="Sling load carries / discharges">
        <NumberStepper
          value={flight.slingLoadCarries ?? 0}
          onChange={(v) => update('slingLoadCarries', v)}
        />
      </Field>

      <Field label="Crew">
        <input
          type="text"
          className={inputClass}
          placeholder="J. Doe"
          value={flight.crew ?? ''}
          onChange={(e) => update('crew', e.target.value || undefined)}
        />
      </Field>
      {recentCrew.length > 0 && <ChipRow options={recentCrew} onPick={(crew) => update('crew', crew)} />}

      <Field label="Comments">
        <textarea
          className={inputClass}
          rows={2}
          value={flight.comments ?? ''}
          onChange={(e) => update('comments', e.target.value || undefined)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={flight.isSimulator}
          onChange={(e) => update('isSimulator', e.target.checked)}
        />
        This is a simulator / synthetic training session
      </label>

      <Field label="Tags">
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-sm px-3 py-1 rounded-full border ${
                flight.tags.includes(tag)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm text-blue-600 dark:text-blue-400 font-medium"
        >
          {showAdvanced ? '▾ Hide advanced fields' : '▸ Show advanced fields'}
        </button>
        {showAdvanced && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {ADVANCED_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.type === 'boolean' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!flight.advanced[f.key]}
                      onChange={(e) => updateAdvanced(f.key, e.target.checked as never)}
                    />
                  </label>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    className={inputClass}
                    value={(flight.advanced[f.key] as string | number | undefined) ?? ''}
                    onChange={(e) =>
                      updateAdvanced(
                        f.key,
                        (f.type === 'number'
                          ? e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                          : e.target.value || undefined) as never,
                      )
                    }
                  />
                )}
              </Field>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-black/10 dark:border-white/10 p-3 flex gap-2 max-w-lg mx-auto">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200"
        >
          Cancel
        </button>
        {onDelete && (
          <button onClick={onDelete} className="py-3 px-4 rounded-lg border border-red-300 text-red-600">
            Delete
          </button>
        )}
        <button
          onClick={() => onSave({ ...flight, updatedAt: new Date().toISOString() })}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium"
        >
          Save
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  )
}

/** Full aircraft list, for when the wanted one isn't in the recent-5 row. */
function AircraftPickerModal({
  aircraft,
  onPick,
  onClose,
}: {
  aircraft: Aircraft[]
  onPick: (a: Aircraft) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 px-3 pt-2 pb-1">
          Select aircraft
        </h3>
        {aircraft.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a)}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <div className="font-medium text-slate-900 dark:text-slate-100">{a.tailNumber}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{a.model}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center py-2.5 mt-1 text-sm text-slate-500 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/** Tap-to-fill chips for a recently-used value (aircraft, crew), so a repeat entry is one tap. */
function ChipRow({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 -mt-2">
      {options.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function StepperButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-11 h-11 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center"
    >
      {children}
    </button>
  )
}

/**
 * +/- stepper for quick one-handed use; tapping the number itself switches to a
 * plain numeric input for the rare case of entering a large count directly.
 */
function NumberStepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit(raw: string) {
    const n = Number(raw)
    onChange(Number.isFinite(n) ? Math.max(min, Math.round(n)) : value)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3">
      <StepperButton onClick={() => onChange(Math.max(min, value - 1))}>−</StepperButton>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          defaultValue={value}
          className="w-14 text-center text-2xl font-mono font-semibold rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-2xl font-mono font-semibold w-10 text-center"
        >
          {value}
        </button>
      )}
      <StepperButton onClick={() => onChange(value + 1)}>+</StepperButton>
    </div>
  )
}
