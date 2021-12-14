import { promisify } from 'es6-promisify'
import fs from 'fs'

const fsOpen = promisify(fs.open)
const fsRead = promisify(fs.read)
const fsFStat = promisify(fs.fstat)
const fsReadFile = promisify(fs.readFile)

export default class LocalFile {
  private filename: string
  private position: number
  private fd: Promise<number>
  private _stat?: Promise<fs.Stats>

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
    if (typeof ret === 'object') {
      return ret.bytesRead
    }
    return ret
  }

  async readFile() {
    return fsReadFile(this.filename)
  }

  async stat(): Promise<fs.Stats> {
    if (!this._stat) {
      this._stat = fsFStat(await this.fd) as Promise<fs.Stats>
    }
    return this._stat
  }

  async close(): Promise<void> {}
}
