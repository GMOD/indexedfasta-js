import { promisify } from 'es6-promisify'
import fs from 'fs'

const fsOpen = fs && promisify(fs.open)
const fsRead = fs && promisify(fs.read)
const fsFStat = fs && promisify(fs.fstat)
const fsReadFile = fs && promisify(fs.readFile)

export default class LocalFile {
  private filename: string
  private position: number
  private fd: Promise<number>
  private _stat: unknown
  constructor(source: string) {
    this.position = 0
    this.filename = source
    this.fd = fsOpen(this.filename, 'r')
  }

  async read(buffer: Buffer, offset = 0, length: number, position: number) {
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
