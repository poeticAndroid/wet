import SyncedStorage from "./SyncedStorage.js"

function init() {
  console.log("Hello world..")
  document.body.style.background = "#123"
  urlfs.storage = new SyncedStorage()
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" })
