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

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if a window/tab for this origin is already open.
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, focus it and navigate to the new URL.
        // This ensures even if the URL is the same, the tab is focused and brought to the user's attention.
        if ('focus' in client) {
          return client.focus().then(client => client.navigate(urlToOpen));
        }
      }
      // If no existing window/tab is found, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});