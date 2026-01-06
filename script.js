import SyncedStorage from "./SyncedStorage.js"

import File from "./File.js"
import Folder from "./Folder.js"

function init() {
  // urlfs.storage = new SyncedStorage()
  console.log("Hello world..")
  setInterval(() => { urlfs.rm("./") }, 1024)
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" })
if (Notification.permission != "granted") addEventListener("click", e => {
  Notification.requestPermission().then(result => {
    console.log("permission", result)
    new Notification(`Notifications ${result}!`)
  })
})
