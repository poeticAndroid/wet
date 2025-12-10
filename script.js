function init() {
  console.log("Hello world..")
  document.body.style.background = "#123"
}





init()
navigator.serviceWorker.register("./sw.js", { scope: "./" })
