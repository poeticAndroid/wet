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
  candidateRooms = []

  constructor() {
    let a = document.createElement("a")
    a.href = "./"
    this.base = a.href

    this.client = JSON.parse(this.getItem(this.base + "client.json") || '{}')
    if (this.client.modified) {
      delete this.client.modified
      this.client.name = newId()
    }
    this.client.name = this.client.name || newId()
    this.client.timeOffset = this.client.timeOffset || 0

    this.config = JSON.parse(this.getItem(this.base + "sync.json") || '{}')
    this.config.account = this.config.account || newId()
    this.config.password = this.config.password || newId()
    this.setItem(this.base + "sync.json", JSON.stringify(this.config))

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
        let lastModified = _val.modified || 0
        delete _val.modified
        delete val.modified

        val.created = _val.created || this.now()
        if (val.deleted) delete val.created
        if (JSON.stringify(val) == JSON.stringify(_val)) return;
        val.modified = Math.max(this.now(), lastModified + 1)
        this.send({ type: "obj", id: key.replace(this.base, ""), obj: val, to: "others" })

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
      this.send({ type: "user", name: this.client.name })
    })

    // Listen for messages
    this.ws.addEventListener("message", (event) => {
      let msg = JSON.parse(event.data)
      console.log("Message from server ", msg)

      switch (msg.type) {
        case "user":
          this.user = msg
          this.send({ type: "ping", client_time: Date.now() })
          this.sendHashKey()
          break;

        case "topic":
          for (let roomId in msg.rooms) {
            if (msg.rooms[roomId].name == this.config.account && !this.candidateRooms.includes(roomId)) this.candidateRooms.push(roomId)
          }
          if (!this.candidateRooms.includes("")) this.candidateRooms.push("")
          if (this.candidateRooms[0]) this.send({ type: "room", id: this.candidateRooms[0], password: this.config.password })
          else this.send({ type: "room", name: this.config.account, password: this.config.password })
          this.candidateRooms.shift()
          break;

        case "room":
          if (this.room?.host == this.user?.id) {
            for (let id in msg.users) {
              if (!this.room.users[id]) this.sync(id)
            }
          }
          this.room = msg
          break;

        case "ping":
          this.client.timeOffset = msg.server_time - (msg.client_time + Date.now()) / 2
          this.storage.setItem(this.base + "client.json", JSON.stringify(this.client))
          break;

        case "msg":
          switch (msg.cmd) {
            case "sync":
              this.sync()
              break;

            case "goto":
              location.assign(msg.url)
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
        if (val?.deleted) {
          if (val?.expired) {
            if (val.expired < this.now()) this.storage.removeItem(key)
          } else {
            this.modified = (this.modified || 0) + 1
            this.expired = this.now() + 1000 * 60 * 60 * 24 * 10 // in 10 days
            this.storage.setItem(key, JSON.stringify(val))
          }
        }
      } catch (error) { }
    }
    if (this.invited) this.send({ type: "msg", cmd: "goto", url: "./" })
    else if (userId && this.room?.host == this.user?.id) this.send({ type: "msg", cmd: "sync", to: userId })
  }

  generateInvite() {
    this.config.account = newId()
    this.config.password = newId()
    this.invited = true
    this.candidateRooms.unshift("")
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close()
    this.connect()
    return `account=${this.config.account}&password=${this.config.password}`
  }

  uninvite() {
    this.removeItem(base + "sync.json")
    this.removeItem(base + "client.json")
    setTimeout(() => {
      this.send({ type: "msg", cmd: "goto", url: "./" })
    }, 1024)
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

  now() {
    return Math.round(Date.now() + this.client.timeOffset)
  }

  async sendHashKey() {
    const encoder = new TextEncoder()
    const data = encoder.encode(this.user.id + "@" + location.protocol + "//" + location.host + "/duYJOCPvJ2oIvlzX0TgxGGVLTsjM2oDQ")
    const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", data))
    let hex = ""
    for (let byte of hash) hex += byte.toString(16).padStart(2, "0")
    this.send({ type: "topic", key: hex })
  }
}


function newId() {
  let id = ""
  while (id.length < 32) {
    id += Math.random().toString(36).slice(2)
  }
  return id
}