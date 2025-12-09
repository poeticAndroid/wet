self.addEventListener("fetch", (event) => {
  caches.open("v1").then(cache => {
    cache.add(event.request)
    event.respondWith(caches.match(event.request))
  })
})
