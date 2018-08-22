import { BgzfFilehandle } from '@gmod/bgzf-filehandle'
import IndexedFasta from './indexedFasta'

class BgzipIndexedFasta extends IndexedFasta {
  constructor({ fasta, fai, gzi, chunkSizeLimit = 50000 }) {
    super({ fasta, fai, chunkSizeLimit })
    this.fasta = new BgzfFilehandle({ filehandle: fasta, gziFilehandle: gzi })
    this.fai = fai

    this.chunkSizeLimit = chunkSizeLimit
  }
}

module.exports = BgzipIndexedFasta
