const { promisify } = require('es6-promisify')
const { isNode } = require('browser-or-node')

// don't load fs native module if running in the browser
let fsOpen
let fsRead
let fsFStat
let fsReadFile
if (isNode) {
  // eslint-disable-next-line global-require
  const fs = require('fs')
  fsOpen = fs && promisify(fs.open)
  fsRead = fs && promisify(fs.read)
  fsFStat = fs && promisify(fs.fstat)
  fsReadFile = fs && promisify(fs.readFile)
}
export default class LocalFile {
  constructor(source) {
    this.position = 0
    this.filename = source
    this.fd = fsOpen(this.filename, 'r')
  }

  async read(buffer, offset = 0, length, position) {
    let readPosition = position
    if (readPosition === null) {
      readPosition = this.position
      this.position += length
    }
    const ret = await fsRead(await this.fd, buffer, offset, length, position)
    if (typeof ret === 'object') return ret.bytesRead
    return ret
  }

  async readFile() {
    return fsReadFile(this.filename)
  }

  async stat() {
    if (!this._stat) {
      this._stat = await fsFStat(await this.fd)
    }
    return this._stat
  }
}
