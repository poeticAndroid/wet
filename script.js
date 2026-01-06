import SyncedStorage from "./SyncedStorage.js"

import File from "./File.js"
import Folder from "./Folder.js"

function init() {
  document.body.style.background = "#532"
  // urlfs.storage = new SyncedStorage()
  console.log("Hello there, world..")
  setInterval(() => { urlfs.rm("./") }, 1024)
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" }).then(registration => {
  setTimeout(e => {
    try {
      console.log("registering timer from script")
      registration.periodicSync.register("timer", { minInterval: 1000 * 60 })
    } catch {
      console.error("Periodic Sync could not be registered!")
    }
  }, 4096)
})
if (Notification.permission != "granted") addEventListener("click", e => {
  Notification.requestPermission().then(result => {
    console.log("permission", result)
    new Notification(`Notifications ${result}!`)
  })
})

setInterval(e => {
  fetch("?keepalive")
}, 1024)

addEventListener("click", e => {
  console.log("requesting sync perms")
  navigator.permissions.query({
    name: 'periodic-background-sync',
  }).then(console.log)
})
