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
  // Get the URL to open from the notification's data payload
  const urlToOpen = event.notification.data.url;
  
  // Close the notification
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if a window/tab for this origin is already open.
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, focus it and navigate to the new URL.
        if ('focus' in client) {
          return client.focus().then(client => client.navigate(urlToOpen));
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});