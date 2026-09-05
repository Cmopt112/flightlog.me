export type Role = 'Dual' | 'PIC' | 'SIC' | 'CFI'

export type FlightTag = 'Training' | 'Firefighting' | 'Ferry' | 'Simulator' | 'Checkride' | string

export type StagingSource = 'bladelog' | 'myflightbook-import' | null

/** Rarely-used MyFlightbook columns. Collapsed in the UI, always round-tripped on export. */
export interface AdvancedFields {
  approaches?: number
  hold?: number
  xCountry?: number
  night?: number
  imc?: number
  simulatedInstrument?: number
  groundSimulator?: number
  fsNightLandings?: number
  fsDayLandings?: number
  /** MyFlightbook's internal aircraft registry id; not tracked by this app, preserved on round-trip only. */
  aircraftId?: string
  /** Usually identical to tailNumber; preserved verbatim if an import had a different display variant. */
  displayTail?: string
  hobbsStart?: number
  hobbsEnd?: number
  engineStart?: string
  engineEnd?: string
  engineTime?: number
  flightStart?: string
  flightEnd?: string
  flyingTime?: number
  /** MyFlightbook's proprietary "Flight Properties" encoding — passed through verbatim, never parsed or generated. */
  flightPropertiesRaw?: string
  complex?: boolean
  controllablePitchProp?: boolean
  flaps?: boolean
  retract?: boolean
  tailwheel?: boolean
  highPerformance?: boolean
  turbine?: boolean
  taa?: boolean
  signatureState?: string
  dateOfSignature?: string
  cfiComment?: string
  cfiCertificate?: string
  cfiName?: string
  cfiEmail?: string
  cfiExpiration?: string
  isPublic?: boolean
  blockIn?: string
  blockOut?: string
  checkrideNewRating?: boolean
  externalLineUnder50ft?: boolean
  simulatorTrainingDeviceId?: string
}

export interface Flight {
  id: string
  date: string // YYYY-MM-DD
  model: string // "BH-412, Bell"
  icaoModel?: string // "B412"
  tailNumber: string // "EC-GOP"
  categoryClass: 'Helicopter'
  routeFrom?: string
  routeTo?: string
  role: Role
  totalTimeDecimal: number // hours, block time by default
  landingsDay: number
  landingsNight: number
  crew?: string
  comments?: string
  slingLoadCarries?: number
  isSimulator: boolean
  tags: FlightTag[]
  advanced: AdvancedFields
  /** Preserved verbatim from an import; always blank for app-created flights. */
  myfbFlightId?: string
  stagingSource: StagingSource
  ptvLogged?: boolean
  createdAt: string
  updatedAt: string
}

export const emptyAdvancedFields: AdvancedFields = {}

export function createBlankFlight(overrides: Partial<Flight> = {}): Flight {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    model: '',
    tailNumber: '',
    categoryClass: 'Helicopter',
    role: 'PIC',
    totalTimeDecimal: 0,
    landingsDay: 0,
    landingsNight: 0,
    isSimulator: false,
    tags: [],
    advanced: { ...emptyAdvancedFields },
    stagingSource: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
