function init() {
  try { navigator.serviceWorker.register("./sw.js") } catch (error) { console.error(error) }
}








init()