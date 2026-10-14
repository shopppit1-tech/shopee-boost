import {createRoot} from 'react-dom/client';
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

// Register service worker for PWA & Android APK installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        console.log('Shopee Boost PWA Service Worker terdaftar:', registration.scope);
      })
      .catch((error) => {
        console.warn('Shopee Boost PWA Service Worker error:', error);
      });
  });
}
