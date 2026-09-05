import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// The service worker itself notices a new build on load, and `registration.update()`
// re-checks it on demand. Nothing swaps in automatically: registerType 'prompt'
// (vite.config.ts) means an update just sits ready until the user hits Reload.
// Re-checked on an interval and whenever the app regains focus, since an installed
// home-screen icon can otherwise sit on a stale build for a long time unnoticed.
const CHECK_INTERVAL_MS = 60 * 60 * 1000

export function UpdateBanner() {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration
    },
  })

  useEffect(() => {
    const check = () => registrationRef.current?.update()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div className="bg-amber-500 text-black px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap text-sm">
      <span className="font-semibold">A new version is ready</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1 bg-black text-amber-400 rounded-md text-xs font-bold uppercase tracking-widest"
      >
        Reload
      </button>
    </div>
  )
}
