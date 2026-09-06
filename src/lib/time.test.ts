import { describe, expect, it } from 'vitest'
import { combineDateAndTime, durationBetweenClockTimes, extractTimeOfDay } from './time'

describe('durationBetweenClockTimes', () => {
  it('computes a same-day duration', () => {
    expect(durationBetweenClockTimes('13:40', '14:30')).toBeCloseTo(0.83, 2)
    expect(durationBetweenClockTimes('09:00', '11:00')).toBeCloseTo(2.0, 2)
  })

  it('wraps past midnight', () => {
    expect(durationBetweenClockTimes('23:50', '00:10')).toBeCloseTo(0.33, 2)
  })

  it('is zero when departure equals landing', () => {
    expect(durationBetweenClockTimes('10:00', '10:00')).toBe(0)
  })
})

describe('extractTimeOfDay / combineDateAndTime round-trip', () => {
  it('extracts HH:MM from a MyFlightbook-style datetime string', () => {
    expect(extractTimeOfDay('2025-11-24 11:42:00Z')).toBe('11:42')
    expect(extractTimeOfDay(undefined)).toBe('')
    expect(extractTimeOfDay('')).toBe('')
  })

  it('combines a date and a clock time into the same style', () => {
    expect(combineDateAndTime('2025-11-24', '11:42')).toBe('2025-11-24 11:42:00Z')
  })

  it('round-trips', () => {
    const combined = combineDateAndTime('2026-06-21', '13:40')
    expect(extractTimeOfDay(combined)).toBe('13:40')
  })
})
