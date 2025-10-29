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
  event.stopImmediatePropagation(); // optional but helps on desktop

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          const clientUrl = new URL(client.url);

          if (clientUrl.origin === self.location.origin) {
            client.focus();

            if (clientUrl.href !== urlToOpen && 'navigate' in client) {
              try {
                return client.navigate(urlToOpen);
              } catch (err) {
                console.warn("Navigation failed, opening new window instead:", err);
                return clients.openWindow(urlToOpen);
              }
            }

            return;
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
