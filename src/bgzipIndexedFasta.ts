import { BgzfFilehandle } from '@gmod/bgzf-filehandle'
import { GenericFilehandle } from 'generic-filehandle'
import IndexedFasta from './indexedFasta'

export default class BgzipIndexedFasta extends IndexedFasta {
  constructor({
    fasta,
    path,
    fai,
    faiPath,
    gzi,
    gziPath,
  }: {
    fasta?: GenericFilehandle
    path?: string
    fai?: GenericFilehandle
    faiPath?: string
    gzi?: GenericFilehandle
    gziPath?: string
  }) {
    super({ fasta, path, fai, faiPath })
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
