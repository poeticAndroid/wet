export default class File extends HTMLElement {
  static observedAttributes = ["src"]
  set src(val) {
    urlfs.removeListenerFromPath(this.src, this.update)
    this._src.href = val
    if (this.getAttribute("src") != this.src) this.setAttribute("src", this.src)
    if (this.parentElement) urlfs.addListenerToPath(this.src, this.update)
  }
  get src() {
    return this._src.href
  }

  constructor() {
    super()
    this._src = document.createElement("a")
    this.update = this.update.bind(this)
  }

  connectedCallback() {
    if (this.src) {
      urlfs.addListenerToPath(this.src, this.update)
      setTimeout(() => { this.update(this.src, urlfs.readText(this.src)) })
    }
  }

  disconnectedCallback() {
    urlfs.removeListenerFromPath(this.src, this.update)
  }

  connectedMoveCallback() {
  }

  adoptedCallback() {
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name.replaceAll("-", "_")] = newValue
  }

  update(file, content) {
    this.textContent = content
  }
}
window.customElements.define('wet-file', File)
