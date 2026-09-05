import type { Flight } from '../../models/flight'

const BACKUP_VERSION = 1

interface BackupFile {
  backupVersion: number
  exportedAt: string
  flights: Flight[]
}

export function serializeBackup(flights: Flight[]): string {
  const backup: BackupFile = {
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    flights,
  }
  return JSON.stringify(backup, null, 2)
}

export function parseBackup(text: string): Flight[] {
  const parsed = JSON.parse(text) as BackupFile
  if (!parsed || !Array.isArray(parsed.flights)) {
    throw new Error('Not a valid logbook backup file')
  }
  return parsed.flights
}
