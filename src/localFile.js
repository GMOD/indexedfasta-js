const fs =
  // eslint-disable-next-line camelcase
  typeof __webpack_require__ !== 'function' ? require('fs-extra') : undefined

export class LocalFile {
  constructor(path) {
    this.fdPromise = fs.open(path, 'r')
  }

  async read(buf, offset, length, position) {
    const fd = await this.fdPromise
    await fs.read(fd, buf, offset, length, position)
  }
  async readFile() {
    const fd = await this.fdPromise
    return fs.readFile(fd)
  }
}

