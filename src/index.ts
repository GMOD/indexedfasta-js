import fromEntries from 'object.fromentries'
import type { GenericFilehandle } from 'generic-filehandle'
import LocalFile from './localFile'
import BgzipIndexedFasta from './bgzipIndexedFasta'
import IndexedFasta from './indexedFasta'

if (!Object.fromEntries) {
  // @ts-ignore
  fromEntries.shim()
}

function parseSmallFasta(text: string) {
  return text
    .split('>')
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split('\n')
      const [id, ...description] = defLine.split(' ')
      const sequence = seqLines.join('').replace(/\s/g, '')
      return {
        id,
        description: description.join(' '),
        sequence,
      }
    })
}

// memoized
class FetchableSmallFasta {
  fasta: GenericFilehandle

  data: Promise<{ id: string; description: string; sequence: string }[]>

  constructor({ fasta, path }: { fasta: GenericFilehandle; path: string }) {
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    } else {
      throw new Error('Need to pass fasta or path')
    }
    this.data = this.fasta.readFile().then(buffer => {
      const text = buffer.toString('utf8')
      return parseSmallFasta(text)
    })
  }

  async fetch(id: string, start: number, end: number) {
    const data = await this.data
    const entry = data.find(iter => iter.id === id)
    const length = end - start
    if (!entry) throw new Error(`no sequence with id ${id} exists`)
    return entry.sequence.substr(start, length)
  }

  async getSequenceNames() {
    const data = await this.data
    return data.map(entry => entry.id)
  }
}

export { parseSmallFasta, FetchableSmallFasta, IndexedFasta, BgzipIndexedFasta }
