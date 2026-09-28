import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Service-worker update UX. `vite-plugin-pwa` runs in `prompt` mode, so a new
 * deploy installs in the background and waits — this toast tells the user and
 * lets them choose when to reload (calling `updateSW(true)` activates the
 * waiting worker and reloads). Mounted once, at the app root.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-xl ring-1 ring-gray-200"
    >
      <span className="text-sm">A new version of loopbox is available.</span>
      <button
        className="btn-brand"
        onClick={() => void updateServiceWorker(true)}
      >
        Reload
      </button>
      <button
        className="btn-muted"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}
