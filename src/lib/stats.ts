import type { Flight, Role } from '../models/flight'

// Simulator flights count toward every total below, matching MyFlightbook's own
// "Total Flight Time" convention - so these numbers stay comparable if cross-checked
// against a MyFlightbook export. simulatorHours() below is purely an informational
// breakdown of how much of that total was synthetic training, not a subtraction.

export function totalHours(flights: Flight[]): number {
  return round2(sum(flights.map((f) => f.totalTimeDecimal)))
}

export function simulatorHours(flights: Flight[]): number {
  return round2(sum(flights.filter((f) => f.isSimulator).map((f) => f.totalTimeDecimal)))
}

export function hoursSince(flights: Flight[], since: Date): number {
  return round2(sum(flights.filter((f) => new Date(f.date) >= since).map((f) => f.totalTimeDecimal)))
}

export function hoursInYear(flights: Flight[], year: number): number {
  return round2(
    sum(flights.filter((f) => new Date(f.date).getFullYear() === year).map((f) => f.totalTimeDecimal)),
  )
}

/** 12 entries, January first, hours flown per calendar month of the given year. */
export function monthlyBreakdown(flights: Flight[], year: number): number[] {
  const months = new Array(12).fill(0)
  for (const f of flights) {
    const d = new Date(f.date)
    if (d.getFullYear() === year) months[d.getMonth()] += f.totalTimeDecimal
  }
  return months.map(round2)
}

export function hoursByModel(flights: Flight[]): Record<string, number> {
  const byModel: Record<string, number> = {}
  for (const f of flights) {
    byModel[f.tailNumber] = (byModel[f.tailNumber] ?? 0) + f.totalTimeDecimal
  }
  for (const key of Object.keys(byModel)) byModel[key] = round2(byModel[key])
  return byModel
}

export function hoursByRole(flights: Flight[]): Record<Role, number> {
  const byRole: Record<Role, number> = { Dual: 0, PIC: 0, SIC: 0, CFI: 0 }
  for (const f of flights) {
    byRole[f.role] += f.totalTimeDecimal
  }
  for (const key of Object.keys(byRole) as Role[]) byRole[key] = round2(byRole[key])
  return byRole
}

export function totalDischarges(flights: Flight[]): number {
  return sum(flights.map((f) => f.slingLoadCarries ?? 0))
}

export function dischargesInYear(flights: Flight[], year: number): number {
  return sum(
    flights.filter((f) => new Date(f.date).getFullYear() === year).map((f) => f.slingLoadCarries ?? 0),
  )
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
