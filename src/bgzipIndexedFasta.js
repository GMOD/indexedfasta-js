const { BgzfFilehandle } = require('@gmod/bgzf-filehandle')
const IndexedFasta = require('./indexedFasta')

class BgzipIndexedFasta extends IndexedFasta {
  constructor({ fasta, fai, gzi, chunkSizeLimit = 50000 }) {
    super({ fasta, fai, chunkSizeLimit })
    this.fasta = new BgzfFilehandle({ filehandle: fasta, gziFilehandle: gzi })
    this.fai = fai

    this.chunkSizeLimit = chunkSizeLimit
  }
}

export default BgzipIndexedFasta
