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

function _faiOffset(idx: IndexEntry, pos: number) {
  return (
    idx.offset +
    idx.lineBytes * Math.floor(pos / idx.lineLength) +
    (pos % idx.lineLength)
  )
}

async function readFAI(fai: GenericFilehandle, opts?: BaseOpts) {
  const decoder = new TextDecoder('utf8')
  return Object.fromEntries(
    decoder
      .decode((await fai.readFile(opts)) as unknown as Uint8Array)
      .split(/\r?\n/)
      .map(r => r.trim())
      .filter(f => !!f)
      .map(line => line.split('\t'))
      .map(row => {
        if (row[0]?.startsWith('>')) {
          throw new Error(
            'found > in sequence name, might have supplied FASTA file for the FASTA index',
          )
        }
        return [
          row[0]!,
          {
            name: row[0]!,
            length: +row[1]!,
            start: 0,
            end: +row[1]!,
            offset: +row[2]!,
            lineLength: +row[3]!,
            lineBytes: +row[4]!,
          },
        ] as const
      }),
  )
}

export default class IndexedFasta {
  fasta: GenericFilehandle
  fai: GenericFilehandle
  indexes?: ReturnType<typeof readFAI>

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
    return Object.keys(await this._getIndexes(opts))
  }

  /**
   * @returns array of string sequence names that are present in the index, in
   * which the array index indicates the sequence ID, and the value is the
   * sequence name
   */
  async getSequenceSizes(opts?: BaseOpts) {
    const returnObject = {} as Record<string, number>
    const idx = await this._getIndexes(opts)
    for (const val of Object.values(idx)) {
      returnObject[val.name] = val.length
    }
    return returnObject
  }

  /**
   * @returns array of string sequence names that are present in the index, in
   * which the array index indicates the sequence ID, and the value is the
   * sequence name
   */
  async getSequenceSize(seqName: string, opts?: BaseOpts) {
    const idx = await this._getIndexes(opts)
    return idx[seqName]?.length
  }

  /**
   * @param name
   *
   * @returns true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return !!(await this._getIndexes(opts))[name]
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
    const indexEntry = (await this._getIndexes(opts))[seqName]
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
    return decoder
      .decode(await this.fasta.read(readlen, position, opts))
      .replace(/\s+/g, '')
  }
}
