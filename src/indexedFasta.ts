import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

interface BaseOpts {
  signal?: AbortSignal
}

interface IndexEntry {
  offset: number
  lineBytes: number
  lineLength: number
  length: number
}

interface ParsedIndex {
  entries: Record<string, IndexEntry>
  names: string[]
  sizes: Record<string, number>
}

function _faiOffset(idx: IndexEntry, pos: number) {
  return (
    idx.offset +
    idx.lineBytes * Math.floor(pos / idx.lineLength) +
    (pos % idx.lineLength)
  )
}

async function readFAI(fai: GenericFilehandle, opts: BaseOpts = {}): Promise<ParsedIndex> {
  const decoder = new TextDecoder('utf8')
  const text = decoder.decode((await fai.readFile(opts)) as unknown as Uint8Array)
  const entries: Record<string, IndexEntry> = {}
  const names: string[] = []
  const sizes: Record<string, number> = {}

  let lineStart = 0
  const len = text.length
  while (lineStart < len) {
    let lineEnd = text.indexOf('\n', lineStart)
    if (lineEnd === -1) {
      lineEnd = len
    }
    let line = text.slice(lineStart, lineEnd)
    if (line.endsWith('\r')) {
      line = line.slice(0, -1)
    }
    line = line.trim()
    lineStart = lineEnd + 1

    if (line.length === 0) {
      continue
    }

    const tab1 = line.indexOf('\t')
    const tab2 = line.indexOf('\t', tab1 + 1)
    const tab3 = line.indexOf('\t', tab2 + 1)
    const tab4 = line.indexOf('\t', tab3 + 1)

    const name = line.slice(0, tab1)
    if (name.startsWith('>')) {
      throw new Error(
        'found > in sequence name, might have supplied FASTA file for the FASTA index',
      )
    }

    const length = +line.slice(tab1 + 1, tab2)
    const offset = +line.slice(tab2 + 1, tab3)
    const lineLength = +line.slice(tab3 + 1, tab4)
    const lineBytes = +line.slice(tab4 + 1)

    entries[name] = { offset, lineBytes, lineLength, length }
    names.push(name)
    sizes[name] = length
  }

  return { entries, names, sizes }
}

export default class IndexedFasta {
  fasta: GenericFilehandle
  fai: GenericFilehandle
  indexes?: Promise<ParsedIndex>

  constructor({
    fasta,
    fai,
    path,
    faiPath,
  }: {
    fasta?: GenericFilehandle
    fai?: GenericFilehandle
    path?: string
    faiPath?: string
  }) {
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    } else {
      throw new Error('Need to pass filehandle for fasta or path to localfile')
    }

    if (fai) {
      this.fai = fai
    } else if (faiPath) {
      this.fai = new LocalFile(faiPath)
    } else if (path) {
      this.fai = new LocalFile(`${path}.fai`)
    } else {
      throw new Error('Need to pass filehandle for  or path to localfile')
    }
  }

  async _getIndexes(opts?: BaseOpts) {
    if (!this.indexes) {
      this.indexes = readFAI(this.fai, opts).catch((e: unknown) => {
        this.indexes = undefined
        throw e
      })
    }
    return this.indexes
  }

  /**
   * @returns array of string sequence names that are present in the index, in
   * which the array index indicates the sequence ID, and the value is the
   * sequence name
   */
  async getSequenceNames(opts?: BaseOpts) {
    return (await this._getIndexes(opts)).names
  }

  /**
   * @returns object mapping sequence names to their lengths
   */
  async getSequenceSizes(opts?: BaseOpts) {
    return (await this._getIndexes(opts)).sizes
  }

  /**
   * @returns the length of the given sequence, or undefined if not found
   */
  async getSequenceSize(seqName: string, opts?: BaseOpts) {
    return (await this._getIndexes(opts)).entries[seqName]?.length
  }

  /**
   * @param name
   *
   * @returns true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return !!(await this._getIndexes(opts)).entries[name]
  }

  /**
   * @param seqName
   * @param min
   * @param max
   */
  async getResiduesByName(
    seqName: string,
    min: number,
    max: number,
    opts?: BaseOpts,
  ) {
    const indexEntry = (await this._getIndexes(opts)).entries[seqName]
    return indexEntry
      ? this._fetchFromIndexEntry(indexEntry, min, max, opts)
      : undefined
  }

  //alias for getResiduesByName
  async getSequence(
    seqName: string,
    min: number,
    max: number,
    opts?: BaseOpts,
  ) {
    return this.getResiduesByName(seqName, min, max, opts)
  }

  async _fetchFromIndexEntry(
    indexEntry: IndexEntry,
    min = 0,
    max?: number,
    opts?: BaseOpts,
  ) {
    let end = max
    if (min < 0) {
      throw new TypeError('regionStart cannot be less than 0')
    }
    if (end === undefined || end > indexEntry.length) {
      end = indexEntry.length
    }
    if (min >= end) {
      return ''
    }

    const position = _faiOffset(indexEntry, min)
    const readlen = _faiOffset(indexEntry, end) - position

    const decoder = new TextDecoder('utf8')
    const seq = decoder
      .decode(await this.fasta.read(readlen, position, opts))
      .replace(/\s+/g, '')

    if (/[^\x20-\x7e]/.test(seq.slice(0, 1000))) {
      throw new Error(
        'Non-ASCII characters detected in sequence. The file may be gzip compressed. Use BgzipIndexedFasta for bgzip files, or decompress the file.',
      )
    }

    return seq
  }
}
