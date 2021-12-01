import { BgzfFilehandle } from '@gmod/bgzf-filehandle'
import IndexedFasta from './indexedFasta'

export default class BgzipIndexedFasta extends IndexedFasta {
  constructor({ fasta, path, fai, faiPath, gzi, gziPath, chunkSizeLimit }) {
    super({ fasta, path, fai, faiPath, chunkSizeLimit })
    if (fasta && gzi) {
      this.fasta = new BgzfFilehandle({
        filehandle: fasta,
        gziFilehandle: gzi,
      })
    } else if (path && gziPath) {
      this.fasta = new BgzfFilehandle({ path, gziPath })
    }
  }
}
