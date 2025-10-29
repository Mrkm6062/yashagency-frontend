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
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      return clients.openWindow(urlToOpen);
    })
  );
});