import { BgzfFilehandle } from '@gmod/bgzf-filehandle'
import { LocalFile } from 'generic-filehandle2'

import IndexedFasta from './indexedFasta.ts'


import type { GenericFilehandle } from 'generic-filehandle2'

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
      // @ts-expect-error
      this.fasta = new BgzfFilehandle({
        filehandle: fasta,
        gziFilehandle: gzi,
      })
    } else if (path && gziPath) {
      // @ts-expect-error
      this.fasta = new BgzfFilehandle({
        filehandle: new LocalFile(path),
        gziFilehandle: new LocalFile(gziPath),
      })
    }
  }
}
