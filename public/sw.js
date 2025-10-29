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
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Close the notification first
      event.notification.close();

      // Check if a window/tab for this origin is already open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          // If so, focus it and navigate to the new URL
          return client.focus().then(client => client.navigate(urlToOpen));
        }
      }
      // If not, open a new window
      return clients.openWindow(urlToOpen);
    })
  );
});
