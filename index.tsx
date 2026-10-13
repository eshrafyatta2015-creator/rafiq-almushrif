
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// تسجيل عامل الخدمة لدعم PWA (نسخة الويب الإنتاجية فقط)
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  !(window as any).Capacitor?.isNativePlatform?.()
) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || './';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* التخزين المؤقت غير متاح */
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
