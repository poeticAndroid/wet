import SyncedStorage from "./SyncedStorage.js"

import File from "./File.js"
import Folder from "./Folder.js"

function init() {
  console.log("Hello world..")
  document.body.style.background = "#123"
  urlfs.storage = new SyncedStorage()
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" })
