import SyncedStorage from "./SyncedStorage.js"

import File from "./File.js"
import Folder from "./Folder.js"

function init() {
  urlfs.storage = new SyncedStorage()
  console.log("Hello world..")
  setTimeout(() => {
    if (urlfs.readJson("sync.json").created < 1766198645095) {
      urlfs.rm("./")
      location.reload(true)
    }
  }, 1024 * 64)
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" })
