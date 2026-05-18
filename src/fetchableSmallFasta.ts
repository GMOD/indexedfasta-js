import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

const decoder = new TextDecoder('utf8')

export interface SmallFastaEntry {
  id: string
  description: string
  sequence: string
}

export function parseSmallFasta(text: string): SmallFastaEntry[] {
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

export class FetchableSmallFasta {
  data: Promise<SmallFastaEntry[]>
  private indexed?: Promise<Map<string, SmallFastaEntry>>

  constructor({ fasta, path }: { fasta?: GenericFilehandle; path?: string }) {
    let filehandle: GenericFilehandle
    if (fasta) {
      filehandle = fasta
    } else if (path) {
      filehandle = new LocalFile(path)
    } else {
      throw new Error('Need to pass fasta or path')
    }
    this.data = filehandle
      .readFile()
      .then(buffer => parseSmallFasta(decoder.decode(buffer)))
  }

  private getIndexed() {
    this.indexed ??= this.data.then(
      arr => new Map(arr.map(e => [e.id, e])),
    )
    return this.indexed
  }

  async fetch(id: string, start: number, end: number) {
    const entry = (await this.getIndexed()).get(id)
    if (!entry) {
      throw new Error(`no sequence with id ${id} exists`)
    }
    return entry.sequence.slice(start, end)
  }

  async getSequenceNames() {
    return (await this.data).map(entry => entry.id)
  }
}
