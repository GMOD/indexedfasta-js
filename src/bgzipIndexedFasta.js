import IndexedFasta from 'indexedFasta';

class BgzipIndexedFasta extends IndexedFasta {
  constructor({ fasta, fai, gzi, chunkSizeLimit = 50000 }) {
    this.fasta = BgzfFilehandle({ bgzfFilehandle: fasta, gziFilehandle: gzi })
    this.fai = fai

    this.chunkSizeLimit = chunkSizeLimit
  }
}

module.exports = BgzipIndexedFasta
