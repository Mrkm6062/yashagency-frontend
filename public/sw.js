console.log("Service Worker Loaded");

self.addEventListener("push", e => {
    const data = e.data.json();
    console.log("Push Recieved...");
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "https://storage.googleapis.com/samriddhi-blog-images-123/bigsize.png", // Use the new logo URL
        data: {
            url: data.url // Pass the URL to open on click
        }
    });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.stopImmediatePropagation(); // Prevent duplicate events

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if app window or tab is already open
        let matchingClient = null;

        for (const client of windowClients) {
          const clientUrl = new URL(client.url);

          // Match same origin (PWA or tab)
          if (clientUrl.origin === self.location.origin) {
            matchingClient = client;
            break;
          }
        }

        if (matchingClient) {
          // ✅ Case 1: App/tab is already open
          // Focus and navigate if needed
          matchingClient.focus();
          if (matchingClient.url !== urlToOpen && 'navigate' in matchingClient) {
            try {
              return matchingClient.navigate(urlToOpen);
            } catch (err) {
              console.warn('Navigate failed, opening new window instead:', err);
              return clients.openWindow(urlToOpen);
            }
          }
          return;
        }

        // ✅ Case 2: No window open — open in correct context
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

