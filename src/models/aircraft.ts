import type { Flight } from './flight'

/** Characteristics that describe the airframe itself, not a single flight - copied onto a flight when picked. */
export interface AircraftCharacteristics {
  turbine?: boolean
  complex?: boolean
  controllablePitchProp?: boolean
  flaps?: boolean
  retract?: boolean
  tailwheel?: boolean
  highPerformance?: boolean
  taa?: boolean
}

export interface Aircraft {
  id: string
  model: string // "BH-412, Bell"
  icaoModel?: string // "B412"
  tailNumber: string // "EC-GOP"
  categoryClass: 'Helicopter'
  characteristics: AircraftCharacteristics
  createdAt: string
  updatedAt: string
}

export function createAircraft(overrides: Partial<Aircraft> = {}): Aircraft {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    model: '',
    tailNumber: '',
    categoryClass: 'Helicopter',
    characteristics: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/** Distinct (model, tailNumber) pairs seen in flight history that aren't in `existing` yet, newest first. */
export function findUnregisteredAircraft(flights: Flight[], existing: Aircraft[]): Aircraft[] {
  const knownTails = new Set(existing.map((a) => a.tailNumber))
  const seen = new Set<string>()
  const found: Aircraft[] = []
  for (const f of flights) {
    if (!f.tailNumber || knownTails.has(f.tailNumber) || seen.has(f.tailNumber)) continue
    seen.add(f.tailNumber)
    found.push(
      createAircraft({
        model: f.model,
        icaoModel: f.icaoModel,
        tailNumber: f.tailNumber,
        characteristics: {
          turbine: f.advanced.turbine,
          complex: f.advanced.complex,
          controllablePitchProp: f.advanced.controllablePitchProp,
          flaps: f.advanced.flaps,
          retract: f.advanced.retract,
          tailwheel: f.advanced.tailwheel,
          highPerformance: f.advanced.highPerformance,
          taa: f.advanced.taa,
        },
      }),
    )
  }
  return found
}
