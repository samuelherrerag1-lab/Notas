import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático de Service Worker para soporte offline 100% en Chromebooks
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de la app disponible.');
  },
  onOfflineReady() {
    console.log('App lista para trabajar offline sin conexión.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
