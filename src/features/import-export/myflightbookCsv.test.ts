import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MFB_HEADER,
  parseCsvRows,
  parseMyFlightbookCsv,
  serializeToMyFlightbookCsv,
} from './myflightbookCsv'
import { decimalHoursToHHMM, formatDecimalComma, hhmmToDecimalHours } from '../../lib/time'

// Synthetic data only (no real crew names / employer routes) - see scripts/gen-synthetic-fixture.mjs.
const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__/myflightbook-sample.csv')
const fixtureText = readFileSync(fixturePath, 'utf-8')

describe('time formatting calibration (from the spec)', () => {
  const cases: [string, number][] = [
    ['1:05', 1.08],
    ['1:10', 1.17],
    ['1:15', 1.25],
    ['1:20', 1.33],
    ['1:23', 1.38],
    ['1:35', 1.58],
    ['1:40', 1.67],
    ['1:50', 1.83],
  ]
  it.each(cases)('%s <-> %s', (hhmm, decimal) => {
    expect(hhmmToDecimalHours(hhmm)).toBeCloseTo(decimal, 2)
    expect(decimalHoursToHHMM(decimal)).toBe(hhmm)
  })

  it('trims a single trailing zero but keeps at least one decimal', () => {
    expect(formatDecimalComma(2.0)).toBe('2,0')
    expect(formatDecimalComma(1.5)).toBe('1,5')
    expect(formatDecimalComma(1.08)).toBe('1,08')
    expect(formatDecimalComma(undefined)).toBe('')
  })
})

describe('parseCsvRows', () => {
  it('splits on ; while respecting quotes, and handles embedded ; inside a quoted field', () => {
    const rows = parseCsvRows('"a";"b;c";"d""e"\r\n"1";"2";"3"\r\n')
    expect(rows).toEqual([
      ['a', 'b;c', 'd"e'],
      ['1', '2', '3'],
    ])
  })
})

describe('parseMyFlightbookCsv against the synthetic fixture', () => {
  const flights = parseMyFlightbookCsv(fixtureText)

  it('parses all 7 flights', () => {
    expect(flights).toHaveLength(7)
  })

  it('parses a Dual Received flight with a modern "AAAA - BBBB" route', () => {
    const f = flights[0]
    expect(f.date).toBe('2026-06-21')
    expect(f.myfbFlightId).toBe('90000001')
    expect(f.model).toBe('BH-412, Test')
    expect(f.icaoModel).toBe('B412')
    expect(f.tailNumber).toBe('EC-TST')
    expect(f.role).toBe('Dual')
    expect(f.totalTimeDecimal).toBeCloseTo(0.83, 2)
    expect(f.landingsDay).toBe(2)
    expect(f.crew).toBe('A. Example')
    expect(f.routeFrom).toBe('AAAA')
    expect(f.routeTo).toBe('BBBB')
  })

  it('parses a PIC flight with discharges', () => {
    const f = flights.find((x) => x.myfbFlightId === '90000002')!
    expect(f.role).toBe('PIC')
    expect(f.slingLoadCarries).toBe(3)
    expect(f.comments).toBe('3x Discharges Foam')
    expect(f.advanced.externalLineUnder50ft).toBe(true)
  })

  it('parses an SIC flight', () => {
    const f = flights.find((x) => x.myfbFlightId === '90000003')!
    expect(f.role).toBe('SIC')
    expect(f.totalTimeDecimal).toBeCloseTo(1.08, 2)
  })

  it('parses a simulator session with an empty route', () => {
    const f = flights.find((x) => x.myfbFlightId === '90000004')!
    expect(f.isSimulator).toBe(true)
    expect(f.tailNumber).toBe('SIM000')
    expect(f.routeFrom).toBeUndefined()
    expect(f.routeTo).toBeUndefined()
  })

  it('preserves a multi-line quoted Comments field', () => {
    const f = flights.find((x) => x.myfbFlightId === '90000005')!
    expect(f.comments).toBe('Skill Test Practice\n 5x Approaches (paid already)')
  })

  it('parses a legacy route with no dash, just a run of spaces', () => {
    const f = flights.find((x) => x.myfbFlightId === '90000006')!
    expect(f.routeFrom).toBe('AAAA')
    expect(f.routeTo).toBe('BBBB')
    expect(f.advanced.flyingTime).toBeCloseTo(1.13, 2)
  })
})

describe('serializeToMyFlightbookCsv', () => {
  const flights = parseMyFlightbookCsv(fixtureText)
  const csv = serializeToMyFlightbookCsv(flights)

  it('starts with a UTF-8 BOM', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('uses CRLF line endings', () => {
    expect(csv.split('\n')[0].endsWith('\r')).toBe(true)
  })

  it('writes the exact 61-column header in order', () => {
    const firstLine = csv.slice(1).split('\r\n')[0]
    const headerCells = parseCsvRows(firstLine)[0]
    expect(headerCells).toEqual([...MFB_HEADER])
  })

  it('quotes every field, including empty and numeric ones', () => {
    const firstDataLine = csv.split('\r\n')[1]
    expect(firstDataLine.startsWith('"')).toBe(true)
    expect(firstDataLine).toMatch(/^(".*?";)+".*?"$/)
  })

  it('round-trips: re-parsing the export yields the same flight count and core values', () => {
    const reparsed = parseMyFlightbookCsv(csv)
    expect(reparsed).toHaveLength(flights.length)
    expect(reparsed[0].date).toBe(flights[0].date)
    expect(reparsed[0].tailNumber).toBe(flights[0].tailNumber)
    expect(reparsed[0].totalTimeDecimal).toBeCloseTo(flights[0].totalTimeDecimal, 2)
  })
})
