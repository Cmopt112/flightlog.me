import type { Flight } from '../../models/flight'
import { createBlankFlight } from '../../models/flight'
import {
  decimalHoursToHHMM,
  formatDecimalComma,
  formatFixed2Comma,
  formatIntCount,
  parseDecimalComma,
} from '../../lib/time'

/**
 * Exact MyFlightbook CSV export/import format (verified against a real export):
 * semicolon-delimited, UTF-8 with BOM, CRLF line endings, every field quoted.
 * 60 official MyFlightbook columns + 1 custom "Sling Load Carries" column, in this order.
 */
export const MFB_HEADER = [
  'Date',
  'Flight ID',
  'Model',
  'ICAO Model',
  'Tail Number',
  'Display Tail',
  'Aircraft ID',
  'Category/Class',
  'Approaches',
  'Hold',
  'Landings',
  'FS Night Landings',
  'FS Day Landings',
  'X-Country',
  'Night',
  'IMC',
  'Simulated Instrument',
  'Ground Simulator',
  'Dual Received',
  'CFI',
  'SIC',
  'PIC',
  'Total Flight Time',
  'CFI Time (HH:MM)',
  'SIC Time (HH:MM)',
  'PIC (HH:MM)',
  'Total Flight Time (HH:MM)',
  'Route',
  'Flight Properties',
  'Comments',
  'Hobbs Start',
  'Hobbs End',
  'Engine Start',
  'Engine End',
  'Engine Time',
  'Flight Start',
  'Flight End',
  'Flying Time',
  'Complex',
  'Controllable pitch prop',
  'Flaps',
  'Retract',
  'Tailwheel',
  'High Performance',
  'Turbine',
  'TAA',
  'Signature State',
  'Date of Signature',
  'CFI Comment',
  'CFI Certificate',
  'CFI Name',
  'CFI Email',
  'CFI Expiration',
  'Public',
  'Additional Crew Member(s)',
  'Block In Time',
  'Block Out Time',
  'Checkride - New Rating',
  'External Line - Under 50ft',
  'Simulator/Training Device Identifier',
  'Sling Load Carries',
] as const

const BOM = '﻿'

function yesNo(value: boolean | undefined): string {
  return value ? 'Yes' : ''
}

function roleHours(flight: Flight, role: Flight['role']): number | undefined {
  return flight.role === role ? flight.totalTimeDecimal : undefined
}

function escapeField(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

/** Builds one CSV row (61 raw string values, unescaped) for a single flight, in MFB_HEADER order. */
function buildRow(flight: Flight): string[] {
  const a = flight.advanced
  const route =
    flight.routeFrom || flight.routeTo ? `${flight.routeFrom ?? ''} - ${flight.routeTo ?? ''}` : ''
  const totalLandings = (flight.landingsDay || 0) + (flight.landingsNight || 0)
  const externalLine = a.externalLineUnder50ft || (flight.slingLoadCarries ?? 0) > 0

  return [
    flight.date,
    flight.myfbFlightId ?? '',
    flight.model,
    flight.icaoModel ?? '',
    flight.tailNumber,
    a.displayTail ?? flight.tailNumber,
    a.aircraftId ?? '',
    flight.categoryClass,
    formatIntCount(a.approaches),
    formatIntCount(a.hold),
    formatIntCount(totalLandings),
    formatIntCount(a.fsNightLandings),
    formatIntCount(a.fsDayLandings),
    formatDecimalComma(a.xCountry),
    formatDecimalComma(a.night),
    formatDecimalComma(a.imc),
    formatDecimalComma(a.simulatedInstrument),
    formatDecimalComma(a.groundSimulator),
    formatDecimalComma(roleHours(flight, 'Dual')),
    formatDecimalComma(roleHours(flight, 'CFI')),
    formatDecimalComma(roleHours(flight, 'SIC')),
    formatDecimalComma(roleHours(flight, 'PIC')),
    formatDecimalComma(flight.totalTimeDecimal),
    roleHours(flight, 'CFI') !== undefined ? decimalHoursToHHMM(flight.totalTimeDecimal) : '',
    roleHours(flight, 'SIC') !== undefined ? decimalHoursToHHMM(flight.totalTimeDecimal) : '',
    roleHours(flight, 'PIC') !== undefined ? decimalHoursToHHMM(flight.totalTimeDecimal) : '',
    decimalHoursToHHMM(flight.totalTimeDecimal),
    route,
    a.flightPropertiesRaw ?? '',
    flight.comments ?? '',
    formatFixed2Comma(a.hobbsStart),
    formatFixed2Comma(a.hobbsEnd),
    a.engineStart ?? '',
    a.engineEnd ?? '',
    formatDecimalComma(a.engineTime),
    a.flightStart ?? '',
    a.flightEnd ?? '',
    formatDecimalComma(a.flyingTime),
    yesNo(a.complex),
    yesNo(a.controllablePitchProp),
    yesNo(a.flaps),
    yesNo(a.retract),
    yesNo(a.tailwheel),
    yesNo(a.highPerformance),
    yesNo(a.turbine),
    yesNo(a.taa),
    a.signatureState ?? '',
    a.dateOfSignature ?? '',
    a.cfiComment ?? '',
    a.cfiCertificate ?? '',
    a.cfiName ?? '',
    a.cfiEmail ?? '',
    a.cfiExpiration ?? '',
    yesNo(a.isPublic),
    flight.crew ?? '',
    a.blockIn ?? '',
    a.blockOut ?? '',
    yesNo(a.checkrideNewRating),
    yesNo(externalLine),
    a.simulatorTrainingDeviceId ?? '',
    formatIntCount(flight.slingLoadCarries),
  ]
}

export function serializeToMyFlightbookCsv(flights: Flight[]): string {
  const lines = [MFB_HEADER.map(escapeField).join(';')]
  for (const flight of flights) {
    lines.push(buildRow(flight).map(escapeField).join(';'))
  }
  return BOM + lines.join('\r\n') + '\r\n'
}

/** Minimal RFC4180-style parser for ';'-delimited, fully-quoted CSV (handles embedded ';' and doubled quotes). */
export function parseCsvRows(text: string): string[][] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ';') {
      row.push(field)
      field = ''
    } else if (ch === '\r') {
      // ignore, \n handles the row break
    } else if (ch === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function parseRoute(route: string): { from?: string; to?: string } {
  if (!route) return {}
  // Modern exports use " - "; some older entries just use a run of spaces with no dash.
  let parts = route.split(' - ')
  if (parts.length !== 2) parts = route.split(/\s{2,}/)
  if (parts.length !== 2) return { from: route }
  return { from: parts[0] || undefined, to: parts[1] || undefined }
}

function col(values: string[], name: (typeof MFB_HEADER)[number]): string {
  return values[MFB_HEADER.indexOf(name)] ?? ''
}

/** Parses one MFB_HEADER-ordered row into a Flight. Any column value not owned by a core field is preserved in `advanced`. */
function flightFromRow(values: string[]): Flight {
  const g = (name: (typeof MFB_HEADER)[number]) => col(values, name)
  const yes = (name: (typeof MFB_HEADER)[number]) => g(name).trim().toLowerCase() === 'yes'
  const num = (name: (typeof MFB_HEADER)[number]) => parseDecimalComma(g(name))

  const dual = num('Dual Received')
  const cfi = num('CFI')
  const sic = num('SIC')
  const pic = num('PIC')
  const total = num('Total Flight Time') ?? 0
  let role: Flight['role'] = 'PIC'
  if (cfi !== undefined) role = 'CFI'
  else if (sic !== undefined) role = 'SIC'
  else if (pic !== undefined) role = 'PIC'
  else if (dual !== undefined) role = 'Dual'

  const { from, to } = parseRoute(g('Route'))
  const landings = num('Landings') ?? 0

  const flight = createBlankFlight({
    date: g('Date'),
    myfbFlightId: g('Flight ID') || undefined,
    model: g('Model'),
    icaoModel: g('ICAO Model') || undefined,
    tailNumber: g('Tail Number'),
    routeFrom: from,
    routeTo: to,
    role,
    totalTimeDecimal: total,
    landingsDay: landings,
    landingsNight: 0,
    comments: g('Comments') || undefined,
    crew: g('Additional Crew Member(s)') || undefined,
    slingLoadCarries: num('Sling Load Carries'),
    isSimulator: g('Simulator/Training Device Identifier') !== '',
    stagingSource: 'myflightbook-import',
  })

  flight.advanced = {
    approaches: num('Approaches'),
    hold: num('Hold'),
    xCountry: num('X-Country'),
    night: num('Night'),
    imc: num('IMC'),
    simulatedInstrument: num('Simulated Instrument'),
    groundSimulator: num('Ground Simulator'),
    fsNightLandings: num('FS Night Landings'),
    fsDayLandings: num('FS Day Landings'),
    aircraftId: g('Aircraft ID') || undefined,
    displayTail: g('Display Tail') || undefined,
    hobbsStart: num('Hobbs Start'),
    hobbsEnd: num('Hobbs End'),
    engineStart: g('Engine Start') || undefined,
    engineEnd: g('Engine End') || undefined,
    engineTime: num('Engine Time'),
    flightStart: g('Flight Start') || undefined,
    flightEnd: g('Flight End') || undefined,
    flyingTime: num('Flying Time'),
    complex: yes('Complex'),
    controllablePitchProp: yes('Controllable pitch prop'),
    flaps: yes('Flaps'),
    retract: yes('Retract'),
    tailwheel: yes('Tailwheel'),
    highPerformance: yes('High Performance'),
    turbine: yes('Turbine'),
    taa: yes('TAA'),
    signatureState: g('Signature State') || undefined,
    dateOfSignature: g('Date of Signature') || undefined,
    cfiComment: g('CFI Comment') || undefined,
    cfiCertificate: g('CFI Certificate') || undefined,
    cfiName: g('CFI Name') || undefined,
    cfiEmail: g('CFI Email') || undefined,
    cfiExpiration: g('CFI Expiration') || undefined,
    isPublic: yes('Public'),
    blockIn: g('Block In Time') || undefined,
    blockOut: g('Block Out Time') || undefined,
    checkrideNewRating: yes('Checkride - New Rating'),
    externalLineUnder50ft: yes('External Line - Under 50ft'),
    simulatorTrainingDeviceId: g('Simulator/Training Device Identifier') || undefined,
    flightPropertiesRaw: g('Flight Properties') || undefined,
  }

  return flight
}

export function parseMyFlightbookCsv(text: string): Flight[] {
  const rows = parseCsvRows(text)
  if (rows.length === 0) return []
  const [, ...dataRows] = rows // first row is the header, already known via MFB_HEADER
  return dataRows
    .filter((r) => r.some((cell) => cell !== ''))
    .map((r) => flightFromRow(r))
}
