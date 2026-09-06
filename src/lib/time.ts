/** Decimal hours <-> HH:MM, matching MyFlightbook's own rounding (minutes/60, 2 decimals). */

export function decimalHoursToHHMM(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

export function hhmmToDecimalHours(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const hours = (h || 0) + (m || 0) / 60
  return Math.round(hours * 100) / 100
}

/**
 * Duration between two clock times ("HH:MM", 24h) on the same flight, in decimal
 * hours. Wraps past midnight (landing "00:10" after departure "23:50" -> ~0.33h),
 * since a single flight is always under 24h.
 */
export function durationBetweenClockTimes(departure: string, landing: string): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const diff = (toMinutes(landing) - toMinutes(departure) + 24 * 60) % (24 * 60)
  return Math.round((diff / 60) * 100) / 100
}

/** Extracts "HH:MM" out of a MyFlightbook-style datetime string ("2025-11-24 11:42:00Z"). */
export function extractTimeOfDay(value: string | undefined): string {
  const match = value?.match(/(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

/** Combines a flight's date with a clock time into MyFlightbook's datetime string style. */
export function combineDateAndTime(date: string, time: string): string {
  return `${date} ${time}:00Z`
}

/** Parses a MyFlightbook-style decimal-comma number ("1,5", "2,0", ""). */
export function parseDecimalComma(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const normalized = value.replace(',', '.')
  const num = Number(normalized)
  return Number.isNaN(num) ? undefined : num
}

/**
 * Formats an hours value the way MyFlightbook's role/total-time columns do:
 * decimal comma, rounded to 2 decimals, but trimmed to 1 decimal when the
 * second is zero ("1,08" stays, "1,50" -> "1,5", "2,00" -> "2,0"). Empty for undefined.
 */
export function formatDecimalComma(value: number | undefined): string {
  if (value === undefined || value === null) return ''
  const rounded = Math.round(value * 100) / 100
  let str = rounded.toFixed(2)
  if (str.endsWith('0')) str = str.slice(0, -1)
  return str.replace('.', ',')
}

/** Formats a value the way MyFlightbook's Hobbs columns do: always exactly 2 decimals. */
export function formatFixed2Comma(value: number | undefined): string {
  const v = value ?? 0
  return v.toFixed(2).replace('.', ',')
}

/** Formats a plain integer count column (Landings, Approaches, ...): no decimals, empty if undefined. */
export function formatIntCount(value: number | undefined): string {
  if (value === undefined || value === null) return ''
  return String(Math.round(value))
}
