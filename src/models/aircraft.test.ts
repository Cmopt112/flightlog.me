import { describe, expect, it } from 'vitest'
import { createBlankFlight } from './flight'
import { createAircraft, findUnregisteredAircraft } from './aircraft'

describe('findUnregisteredAircraft', () => {
  it('returns one entry per distinct tail number, skipping ones already registered', () => {
    const flights = [
      createBlankFlight({ tailNumber: 'EC-GOP', model: 'BH-412, Bell' }),
      createBlankFlight({ tailNumber: 'EC-GOP', model: 'BH-412, Bell' }),
      createBlankFlight({ tailNumber: 'OE-XCT', model: 'R-22, Robinson' }),
      createBlankFlight({ tailNumber: '', model: '' }),
    ]
    const existing = [createAircraft({ tailNumber: 'EC-GOP' })]

    const found = findUnregisteredAircraft(flights, existing)

    expect(found).toHaveLength(1)
    expect(found[0].tailNumber).toBe('OE-XCT')
    expect(found[0].model).toBe('R-22, Robinson')
  })

  it('returns nothing when everything is already registered', () => {
    const flights = [createBlankFlight({ tailNumber: 'EC-GOP' })]
    const existing = [createAircraft({ tailNumber: 'EC-GOP' })]
    expect(findUnregisteredAircraft(flights, existing)).toHaveLength(0)
  })
})
