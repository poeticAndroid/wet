export default class SyncedStorage {
  storage = localStorage
  keys = []
  get length() {
    this.keys = []
    let len = this.storage.length
    for (let i = 0; i < len; i++) {
      let key = this.storage.key(i)
      if (key.slice(0, this.base.length) != this.base) continue
      try {
        let val = JSON.parse(this.storage.getItem(key))
        if (!val?.deleted) this.keys.push(key)
      } catch (error) { }
    }
    return this.keys.length
  }
  base = location.toString()
  reconnectDelay = 1

  constructor() {
    let a = document.createElement("a")
    a.href = "./"
    this.base = a.href
    this.connect()
  }

  getItem(key) {
    try {
      let val = JSON.parse(this.storage.getItem(key))
      if (!val?.deleted) return this.storage.getItem(key)
    } catch (error) { }
  }
  setItem(key, val) {
    if (key.slice(0, this.base.length) != this.base) return this.storage.setItem(key, val)
    let _val = this.storage.getItem(key) || '{"modified":0}'
    try {
      _val = JSON.parse(_val)
      val = JSON.parse(val)
      if (typeof val == "object" && !(val instanceof Array)) {
        delete _val.modified
        delete val.modified

        if (JSON.stringify(val) != JSON.stringify(_val)) {
          val.modified = Date.now()
          this.send({ type: "obj", id: key.replace(this.base, ""), obj: val, to: "others" })
        }
        val = JSON.stringify(val)
      }
    } catch (error) { }
    return this.storage.setItem(key, val)
  }
  updateItem(key, val) {
    let _val = this.storage.getItem(key) || '{"modified":0}'
    try {
      _val = JSON.parse(_val)
      val = JSON.parse(val)
      if (typeof val == "object" && !(val instanceof Array)) {
        if (val?.modified > _val?.modified) this.storage.setItem(key, JSON.stringify(val))
      }
    } catch (error) { }
  }
  removeItem(key) {
    if (key.slice(0, this.base.length) != this.base) return this.storage.removeItem(key)
    let val = this.storage.getItem(key)
    if (!val) return this.storage.removeItem(key)
    return this.setItem(key, '{"deleted":true}')
  }
  key(index) { return this.keys[index] }





  connect() {
    this.ws = new WebSocket("wss://hotater-eu.onrender.com/ws/chat")
    this.user = null
    this.room = null

    this.ws.addEventListener("open", (event) => {
      this.send({ type: "user", name: "Wet user" })
    })

    // Listen for messages
    this.ws.addEventListener("message", (event) => {
      let msg = JSON.parse(event.data)
      console.log("Message from server ", msg)

      switch (msg.type) {
        case "user":
          this.user = msg
          this.sendHashKey()
          break;

        case "topic":
          for (let roomId in msg.rooms) {
            return this.send({ type: "room", id: roomId })
          }
          this.send({ type: "room", name: "party" })
          break;

        case "room":
          if (this.room?.host == this.user?.id) {
            for (let id in msg.users) {
              if (!this.room.users[id]) this.sync(id)
            }
          }
          this.room = msg
          break;

        case "msg":
          switch (msg.cmd) {
            case "sync":
              this.sync()
              break;

            default:
              console.warn(`Unknown network cmd: ${msg.cmd}`)
              break;
          }
          break;

        case "obj":
          this.updateItem(this.base + msg.id, JSON.stringify(msg.obj))
          break;

        case "feedme":
          fetch(msg.url)
          break;

        default:
          console.error("I dunno what to do with", msg)
          break;
      }
    })
  }

  sync(userId) {
    let len = this.storage.length
    for (let i = 0; i < len; i++) {
      let key = this.storage.key(i)
      if (key.slice(0, this.base.length) != this.base) continue
      try {
        let val = JSON.parse(this.storage.getItem(key))
        if (val?.modified) this.send({ type: "obj", id: key.replace(this.base, ""), obj: val, to: userId || "others" })
      } catch (error) { }
    }
    if (userId && this.room?.host == this.user?.id) this.send({ type: "msg", cmd: "sync", to: userId })
  }

  send(msg) {
    if ((msg.type == "obj" || msg.type == "msg") && !this.room) return;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    } else {
      if (this.reconnectDelay > 0) setTimeout(() => {
        this.connect()
        this.reconnectDelay = Math.abs(this.reconnectDelay)
      }, this.reconnectDelay *= 2)
      this.reconnectDelay = -Math.abs(this.reconnectDelay)
    }
  }

  async sendHashKey() {
    const encoder = new TextEncoder()
    const data = encoder.encode(this.user.id + "@" + location.protocol + "//" + location.host + "/secret_key")
    const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", data))
    let hex = ""
    for (let byte of hash) hex += byte.toString(16).padStart(2, "0")
    this.send({ type: "topic", key: hex })
  }
}