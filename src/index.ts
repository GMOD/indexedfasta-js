import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

function parseSmallFasta(text: string) {
  return text
    .split('>')
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split('\n')
      const [id, ...description] = defLine!.split(' ')
      const sequence = seqLines.join('').replace(/\s/g, '')
      return {
        id: id!,
        description: description.join(' '),
        sequence,
      }
    })
}

class FetchableSmallFasta {
  fasta: GenericFilehandle

  data: Promise<{ id: string; description: string; sequence: string }[]>

  constructor({ fasta, path }: { fasta?: GenericFilehandle; path?: string }) {
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    } else {
      throw new Error('Need to pass fasta or path')
    }
    this.data = this.fasta.readFile().then(buffer => {
      const decoder = new TextDecoder('utf8')
      const text = decoder.decode(buffer)
      return parseSmallFasta(text)
    })
  }

  async fetch(id: string, start: number, end: number) {
    const data = await this.data
    const entry = data.find(iter => iter.id === id)
    const length = end - start
    if (!entry) {
      throw new Error(`no sequence with id ${id} exists`)
    }
    return entry.sequence.slice(start, length)
  }

  async getSequenceNames() {
    const data = await this.data
    return data.map(entry => entry.id)
  }
}

export { FetchableSmallFasta, parseSmallFasta }

export { default as BgzipIndexedFasta } from './bgzipIndexedFasta'
export { default as IndexedFasta } from './indexedFasta'
