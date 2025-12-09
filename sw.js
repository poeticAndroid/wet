const cached = []

setInterval(() => {
  cached.shift()
}, 1024 * 64)


addEventListener("fetch", async (event) => {
  let method = "" + event.request.method
  let url = "" + event.request.url
  // console.log("Fetch detected:", method, url)
  if (method.toLowerCase() != "get") return event.respondWith(fetch(event.request))

  event.respondWith((async () => (await caches.match(event.request)) || (await fetch(event.request)))())

  if (!cached.includes(url)) {
    let cache = await caches.open("v1")
    // console.log("Fetching", url, "...")
    cache.add(url)
    cached.push(url)
  }
})
