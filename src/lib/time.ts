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
