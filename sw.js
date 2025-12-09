const addResourcesToCache = async (resources) => {
  const cache = await caches.open("v1")
  await cache.addAll(resources)
}

self.addEventListener("install", (event) => {
  event.waitUntil(addResourcesToCache(["./", "./sw.js"]))
})


self.addEventListener("fetch", (event) => {
  caches.open("v1").then(cache => {
    cache.add(event.request)
    event.respondWith(caches.match(event.request))
  })
})
