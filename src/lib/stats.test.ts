import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseMyFlightbookCsv } from '../features/import-export/myflightbookCsv'
import { hoursByRole, monthlyBreakdown, simulatorHours, totalDischarges, totalHours } from './stats'

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../features/import-export/__fixtures__/myflightbook-sample.csv',
)
const flights = parseMyFlightbookCsv(readFileSync(fixturePath, 'utf-8'))

describe('stats cross-check against the synthetic fixture', () => {
  it('total hours (including simulator) matches a manual sum, same convention as MyFlightbook', () => {
    const manual = flights.reduce((acc, f) => acc + f.totalTimeDecimal, 0)
    expect(totalHours(flights)).toBeCloseTo(manual, 2)
  })

  it('simulator hours are a breakdown of the total, not a subtraction', () => {
    expect(simulatorHours(flights)).toBeCloseTo(3.5, 2) // the two SIM000 flights: 2.0 + 1.5
    expect(simulatorHours(flights)).toBeLessThan(totalHours(flights))
  })

  it('hoursByRole sums back up to totalHours', () => {
    const byRole = hoursByRole(flights)
    const sum = Object.values(byRole).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(totalHours(flights), 1)
  })

  it('monthlyBreakdown for a year sums to that year\'s total hours', () => {
    const year = new Date(flights[0].date).getFullYear()
    const months = monthlyBreakdown(flights, year)
    const monthSum = months.reduce((a, b) => a + b, 0)
    const manualYearSum = flights
      .filter((f) => new Date(f.date).getFullYear() === year)
      .reduce((acc, f) => acc + f.totalTimeDecimal, 0)
    expect(monthSum).toBeCloseTo(manualYearSum, 1)
  })

  it('totalDischarges matches the sum of Sling Load Carries across all flights', () => {
    const manual = flights.reduce((acc, f) => acc + (f.slingLoadCarries ?? 0), 0)
    expect(totalDischarges(flights)).toBe(manual)
    expect(totalDischarges(flights)).toBe(3)
  })
})
