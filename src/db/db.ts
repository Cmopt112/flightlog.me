import Dexie, { type Table } from 'dexie'
import type { Flight } from '../models/flight'

export class LogbookDatabase extends Dexie {
  flights!: Table<Flight, string>

  constructor() {
    super('flightlog-pwa')
    this.version(1).stores({
      // Indexed on id (primary key), date (list sorting) and tailNumber (dashboard breakdowns).
      flights: 'id, date, tailNumber, stagingSource',
    })
  }
}

export const db = new LogbookDatabase()
