self.addEventListener('fetch', event => {
  if (event.request.url.includes('istockphoto.com') || event.request.url.includes('unsplash.com')) {
    event.respondWith(
      caches.open('images-v1').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});