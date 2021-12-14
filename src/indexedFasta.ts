import LocalFile from './localFile'
import { GenericFilehandle } from 'generic-filehandle'

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
  const text = await fai.readFile(opts)
  if (!(text && text.length)) {
    throw new Error('No data read from FASTA index (FAI) file')
  }

  let idCounter = 0
  let currSeq: { name: string; id: number } | undefined
  const data = text
    .toString('utf8')
    .split(/\r?\n/)
    .filter(line => /\S/.test(line))
    .map(line => line.split('\t'))
    .filter(row => row[0] !== '')
    .map(row => {
      if (!currSeq || currSeq.name !== row[0]) {
        currSeq = { name: row[0], id: idCounter }
        idCounter += 1
      }

      return {
        id: currSeq.id,
        name: row[0],
        length: +row[1],
        start: 0,
        end: +row[1],
        offset: +row[2],
        lineLength: +row[3],
        lineBytes: +row[4],
      }
    })

  return {
    name: Object.fromEntries(data.map(entry => [entry.name, entry])),
    id: Object.fromEntries(data.map(entry => [entry.id, entry])),
  }
}

export default class IndexedFasta {
  fasta: GenericFilehandle
  fai: GenericFilehandle
  chunkSizeLimit: number
  indexes?: ReturnType<typeof readFAI>

  constructor({
    fasta,
    fai,
    path,
    faiPath,
    chunkSizeLimit = 1000000,
  }: {
    fasta?: GenericFilehandle
    fai?: GenericFilehandle
    path?: string
    faiPath?: string
    chunkSizeLimit?: number
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
    this.chunkSizeLimit = chunkSizeLimit
  }

  async _getIndexes(opts?: BaseOpts) {
    if (!this.indexes) {
      this.indexes = readFAI(this.fai, opts)
    }
    return this.indexes
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceNames(opts?: BaseOpts) {
    return Object.keys((await this._getIndexes(opts)).name)
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceSizes(opts?: BaseOpts) {
    const returnObject = {} as { [key: string]: number }
    const idx = await this._getIndexes(opts)
    const vals = Object.values(idx.id)
    for (let i = 0; i < vals.length; i += 1) {
      returnObject[vals[i].name] = vals[i].length
    }
    return returnObject
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceSize(seqName: string, opts?: BaseOpts) {
    const idx = await this._getIndexes(opts)
    return idx.name[seqName]?.length
  }

  /**
   *
   * @param {string} name
   * @returns {Promise[boolean]} true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return !!(await this._getIndexes(opts)).name[name]
  }

  /**
   *
   * @param {number} seqId
   * @param {number} min
   * @param {number} max
   */
  async getResiduesById(
    seqId: number,
    min: number,
    max: number,
    opts?: BaseOpts,
  ) {
    const indexEntry = (await this._getIndexes(opts)).id[seqId]
    if (!indexEntry) {
      return undefined
    }
    return this._fetchFromIndexEntry(indexEntry, min, max, opts)
  }

  /**
   * @param {string} seqName
   * @param {number} min
   * @param {number} max
   */
  async getResiduesByName(
    seqName: string,
    min: number,
    max: number,
    opts?: BaseOpts,
  ) {
    const indexEntry = (await this._getIndexes(opts)).name[seqName]
    if (!indexEntry) {
      return undefined
    }

    return this._fetchFromIndexEntry(indexEntry, min, max, opts)
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
    max: number,
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

    if (readlen > this.chunkSizeLimit) {
      throw new Error(
        `data size of ${readlen.toLocaleString()} bytes exceeded chunk size limit of ${this.chunkSizeLimit.toLocaleString()} bytes`,
      )
    }

    const residues = Buffer.allocUnsafe(readlen)
    await this.fasta.read(residues, 0, readlen, position, opts)
    return residues.toString('utf8').replace(/\s+/g, '')
  }
}
