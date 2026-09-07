import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import './styles/app.css';
import App from './ui/App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Analytics run only in production and never block rendering — an adblocker or
// tracking protection throwing here must not blank the app (it did in dev).
if (import.meta.env.PROD) {
  void (async () => {
    try {
      const [{ inject }, { injectSpeedInsights }] = await Promise.all([
        import('@vercel/analytics'),
        import('@vercel/speed-insights'),
      ]);
      inject();
      injectSpeedInsights();
    } catch {
      // ignore — analytics are best-effort
    }
  })();
}
