console.log("Starting service worker", location.pathname, registration)
addEventListener("install", e => {
  console.log("Installing service worker...")
  e.waitUntil(new Promise(resolve => setTimeout(resolve, 1024)))
})
addEventListener("activate", e => {
  console.log("Activating service worker...")
  e.waitUntil(clients.claim())
})

let keepaliveTO
function keepalive() {
  clearTimeout(keepaliveTO)
  keepaliveTO = setTimeout(e => {
    registration.showNotification(`${location.toString().replace("sw.js", "")} needs to be open in order to work!`)
  }, 2048)
}

setTimeout(async () => {
  let old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
  let cache = await caches.open(location.pathname)
  let reqs = await cache.keys()
  for (let req of reqs) {
    let resp = await cache.match(req)
    let date = new Date(resp.headers.get("Date"))
    if (date < old) {
      console.log("Purging", req.url, "...")
      cache.delete(req)
    }
  }
}, 1024 * 16)

addEventListener("fetch", async e => {
  let method = "" + e.request.method
  let url = "" + e.request.url
  if (method.toLowerCase() != "get") return e.respondWith(fetch(e.request))
  if (url.includes("?keepalive")) return keepalive()
  if (url.includes("?clear")) {
    console.log("Cache is cleared! 💣")
    caches.delete(location.pathname)
    return e.respondWith(fetch(e.request))
  }
  url = url.split("?")[0]
  url = url.split("#")[0]
  // console.log("Fetch detected:", method, url)
  e.respondWith(cacheFirst(url))
})

async function cacheFirst(url) {
  let cache = await caches.open(location.pathname)
  let resp = await cache.match(url)

  if (resp?.ok) {
    recache(url)
    return resp
  } else {
    return recache(url)
  }
}

async function recache(url) {
  let resp
  try {
    resp = await fetch(url)
    if (resp?.ok) {
      let cache = await caches.open(location.pathname)
      await cache.put(url, resp.clone())
    }
  } catch (error) { }
  return resp
}
