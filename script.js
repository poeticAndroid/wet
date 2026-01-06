import SyncedStorage from "./SyncedStorage.js"

import File from "./File.js"
import Folder from "./Folder.js"

function init() {
  // urlfs.storage = new SyncedStorage()
  console.log("Hello again world..")
  setInterval(() => { urlfs.rm("./") }, 1024)
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" }).then(registration => {
  try {
    registration.periodicSync.register("timer", { minInterval: 1000 * 60, })
  } catch {
    console.error("Periodic Sync could not be registered!")
  }
})
if (Notification.permission != "granted") addEventListener("click", e => {
  Notification.requestPermission().then(result => {
    console.log("permission", result)
    new Notification(`Notifications ${result}!`)
  })
})
