const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUser() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker Registered');

      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Permission not granted for Notification');
        return;
      }

      const vapidPublicKeyRes = await fetch(`${API_BASE}/api/vapidPublicKey`);
      const vapidPublicKey = await vapidPublicKeyRes.text();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('User is subscribed.');

      await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
    }
  }
}