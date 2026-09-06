import Dexie, { type Table } from 'dexie'
import type { Aircraft } from '../models/aircraft'
import type { Flight } from '../models/flight'

export class LogbookDatabase extends Dexie {
  flights!: Table<Flight, string>
  aircraft!: Table<Aircraft, string>

  constructor() {
    super('flightlog-pwa')
    this.version(1).stores({
      // Indexed on id (primary key), date (list sorting) and tailNumber (dashboard breakdowns).
      flights: 'id, date, tailNumber, stagingSource',
    })
    this.version(2).stores({
      flights: 'id, date, tailNumber, stagingSource',
      // The saved aircraft registry (Settings) - indexed on tailNumber for the picker lookup.
      aircraft: 'id, tailNumber',
    })
  }
}

export const db = new LogbookDatabase()
