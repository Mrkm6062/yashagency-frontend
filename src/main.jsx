// c:\Users\PC\Desktop\Amazon Q CLI\SamriddhiShop\frontend\src\main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx'; // This should now correctly find App.jsx in the same folder
// Defer CSS loading to prevent render blocking
import('./index.css');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);

// Register Service Worker in Vite
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker Registered"))
      .catch((err) => console.log("SW registration failed:", err));
  });
}
