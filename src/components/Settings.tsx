import { useRef, useState } from 'react'
import type { Flight } from '../models/flight'
import { parseBackup, serializeBackup } from '../features/import-export/backupJson'
import { parseMyFlightbookCsv, serializeToMyFlightbookCsv } from '../features/import-export/myflightbookCsv'

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Settings({
  flights,
  onImport,
  darkMode,
  onToggleDarkMode,
}: {
  flights: Flight[]
  onImport: (flights: Flight[]) => void
  darkMode: boolean
  onToggleDarkMode: () => void
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const backupInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  async function checkForUpdate() {
    setUpdateStatus('Checking…')
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) {
      setUpdateStatus('Not installed as an app yet — nothing to check.')
      return
    }
    await reg.update()
    // The browser now fetches/installs any new build in the background; if it finds
    // one, the reload banner at the top appears on its own a moment later.
    setUpdateStatus('Checked — the reload banner will appear above if a new version was found.')
  }

  async function handleBackupFile(file: File) {
    const text = await file.text()
    const imported = parseBackup(text)
    onImport(imported)
    setMessage(`Imported ${imported.length} flights from backup.`)
  }

  async function handleCsvFile(file: File) {
    const text = await file.text()
    const imported = parseMyFlightbookCsv(text)
    onImport(imported)
    setMessage(`Imported ${imported.length} flights from MyFlightbook CSV.`)
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        <label className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-black/10 dark:border-white/10 p-4">
          <span className="text-sm text-slate-700 dark:text-slate-200">Dark mode</span>
          <input type="checkbox" checked={darkMode} onChange={onToggleDarkMode} />
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Full backup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A lossless JSON export of everything in this app. Use this to move your logbook to another
          device — browser storage can be cleared at any time, so keep a copy somewhere safe.
        </p>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            onClick={() => downloadFile(serializeBackup(flights), `logbook-backup-${today}.json`, 'application/json')}
          >
            Export backup
          </button>
          <button className={buttonClass} onClick={() => backupInputRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={(e) => e.target.files?.[0] && handleBackupFile(e.target.files[0])}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">MyFlightbook</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Export in MyFlightbook's exact import format, or import an existing MyFlightbook export to
          migrate your flights into this app.
        </p>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            onClick={() =>
              downloadFile(serializeToMyFlightbookCsv(flights), `myflightbook-export-${today}.csv`, 'text/csv')
            }
          >
            Export CSV
          </button>
          <button className={buttonClass} onClick={() => csvInputRef.current?.click()}>
            Import CSV
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Updates</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Build {__APP_COMMIT__} · {new Date(__APP_BUILD_TIME__).toLocaleDateString()}
        </p>
        <button className={buttonClass} onClick={checkForUpdate}>
          Check for updates
        </button>
        {updateStatus && <p className="text-sm text-slate-500 dark:text-slate-400">{updateStatus}</p>}
      </section>

      {message && (
        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
          {message}
        </p>
      )}
    </div>
  )
}

const buttonClass =
  'flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200'
