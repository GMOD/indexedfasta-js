import { LocalFile } from 'generic-filehandle2'

import { readFAI } from './readFAI.ts'

import type { BaseOpts, Entry } from './types'
import type { GenericFilehandle } from 'generic-filehandle2'

function _faiOffset(idx: Entry, pos: number) {
  return (
    idx.offset +
    idx.lineBytes * Math.floor(pos / idx.lineLength) +
    (pos % idx.lineLength)
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
    return (await this._getIndexes(opts)).sequenceNames
  }

  /**
   * @returns array of string sequence names that are present in the index, in
   * which the array index indicates the sequence ID, and the value is the
   * sequence name
   */
  async getSequenceSizes(opts?: BaseOpts) {
    const returnObject = {} as Record<string, number>
    const { sequenceInfo } = await this._getIndexes(opts)
    for (const val of Object.values(sequenceInfo)) {
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
    const { sequenceInfo } = await this._getIndexes(opts)
    return sequenceInfo[seqName]?.length
  }

  /**
   * @param name
   *
   * @returns true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return !!(await this._getIndexes(opts)).sequenceInfo[name]
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
    const indexEntry = (await this._getIndexes(opts)).sequenceInfo[seqName]
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
    indexEntry: Entry,
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
