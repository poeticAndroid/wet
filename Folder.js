import File from "./File.js"

export default class Folder extends File {
  static observedAttributes = ["src", "file-tag", "folder-tag"]
  file_tag = "wet-file"
  folder_tag = "wet-folder"

  update(file, content) {
    let files = urlfs.ls(this.src)
    for (let i = 0; i < files.length; i++) {
      files[i] = (new URL(files[i], this.src)).toString()
    }
    for (let file of files) {
      if (!this.querySelector(`[src=${JSON.stringify(file)}]`)) {
        let child
        if ("/".includes(file.slice(-1))) child = document.createElement(this.folder_tag)
        else if (!"?&=#".includes(file.slice(-1))) child = document.createElement(this.file_tag)
        if (child) {
          child.setAttribute("src", file)
          this.appendChild(child)
        }
      }
    }
    for (let child of this.children) {
      if (!files.includes(child.getAttribute("src"))) {
        this.removeChild(child)
      }
    }
  }
}

customElements.define('wet-folder', Folder)
