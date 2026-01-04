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
