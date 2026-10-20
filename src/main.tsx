import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HouseProvider } from './store/store';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HouseProvider>
      <App />
    </HouseProvider>
  </StrictMode>
);

if (import.meta.env.PROD && import.meta.env.MODE !== 'demo' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
}
