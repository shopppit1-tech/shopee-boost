import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Smoothly dismiss the APK splash screen after initial React render
setTimeout(() => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 500);
  }
}, 350);

// Register once through the PWA plugin and check for a newer service worker immediately.
registerSW({
  immediate: true,
  onRegisteredSW: (_serviceWorkerUrl, registration) => {
    if (registration) {
      void registration.update().catch((error) => {
        console.warn('Shopee Boost PWA update check failed:', error);
      });
    }
  },
  onRegisterError: (error) => {
    console.warn('Shopee Boost PWA Service Worker error:', error);
  },
});
