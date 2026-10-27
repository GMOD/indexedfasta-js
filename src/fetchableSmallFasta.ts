import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

const decoder = new TextDecoder('utf8')

export interface SmallFastaEntry {
  id: string
  description: string
  sequence: string
}

// ';' lines (the original FASTA comment marker, used by FHR metadata headers)
// and blank lines before the first record would otherwise become a record. A
// loop rather than one anchored regex, which overflows the stack on millions
// of lines.
function skipLeadingComments(text: string) {
  const lineBreak = /\r\n?|\n/g
  let start = 0
  while (start < text.length) {
    lineBreak.lastIndex = start
    const match = lineBreak.exec(text)
    const end = match ? match.index : text.length
    if (text[start] !== ';' && /\S/.test(text.slice(start, end))) {
      break
    }
    start = match ? lineBreak.lastIndex : end
  }
  return text.slice(start)
}

// Split on a '>' that starts a line: a description is free text and may
// contain one ("gene A>B"). Any whitespace ends the id, as samtools does it.
export function parseSmallFasta(text: string): SmallFastaEntry[] {
  return skipLeadingComments(text)
    .split(/^>/m)
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split(/\r?\n/)
      const [id, ...description] = defLine!.split(/\s+/)
      const sequence = seqLines.join('').replaceAll(/\s/g, '')
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
    this.indexed ??= this.data.then(arr => new Map(arr.map(e => [e.id, e])))
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
