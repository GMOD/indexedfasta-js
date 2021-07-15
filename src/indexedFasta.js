import LocalFile from './localFile'

function _faiOffset(idx, pos) {
  return (
    idx.offset +
    idx.lineBytes * Math.floor(pos / idx.lineLength) +
    (pos % idx.lineLength)
  )
}

export default class IndexedFasta {
  constructor({ fasta, fai, path, faiPath, chunkSizeLimit = 1000000 }) {
    if (fasta) {
      this.fasta = fasta
    } else if (path) {
      this.fasta = new LocalFile(path)
    }

    if (fai) {
      this.fai = fai
    } else if (faiPath) {
      this.fai = new LocalFile(faiPath)
    } else if (path) {
      this.fai = new LocalFile(`${path}.fai`)
    }
    this.chunkSizeLimit = chunkSizeLimit
  }

  async _getIndexes(opts) {
    if (!this.indexes) this.indexes = await this._readFAI(opts)
    return this.indexes
  }

  async _readFAI(opts) {
    const text = await this.fai.readFile(opts)
    if (!(text && text.length)) {
      throw new Error('No data read from FASTA index (FAI) file')
    }

    let idCounter = 0
    let currSeq
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

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceNames(opts) {
    return Object.keys((await this._getIndexes(opts)).name)
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceSizes(opts) {
    const returnObject = {}
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
  async getSequenceSize(seqName, opts) {
    const idx = await this._getIndexes(opts)
    return (idx.name[seqName] || {}).length
  }

  /**
   *
   * @param {string} name
   * @returns {Promise[boolean]} true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name, opts) {
    return !!(await this._getIndexes(opts)).name[name]
  }

  /**
   *
   * @param {number} seqId
   * @param {number} min
   * @param {number} max
   */
  async getResiduesById(seqId, min, max, opts) {
    const indexEntry = (await this._getIndexes(opts)).id[seqId]
    if (!indexEntry) return undefined
    return this._fetchFromIndexEntry(indexEntry, min, max)
  }

  /**
   * @param {string} seqName
   * @param {number} min
   * @param {number} max
   */
  async getResiduesByName(seqName, min, max, opts) {
    const indexEntry = (await this._getIndexes(opts)).name[seqName]
    if (!indexEntry) return undefined
    return this._fetchFromIndexEntry(indexEntry, min, max, opts)
  }

  async getSequence(...args) {
    return this.getResiduesByName(...args)
  }

  async _fetchFromIndexEntry(indexEntry, min = 0, max, opts) {
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
