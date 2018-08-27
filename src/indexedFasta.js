function _faiOffset(idx, pos) {
  return (
    idx.offset +
    idx.lineBytes * Math.floor(pos / idx.lineLength) +
    (pos % idx.lineLength)
  )
}
class IndexedFasta {
  constructor({ fasta, fai, chunkSizeLimit = 50000 }) {
    this.fasta = fasta
    this.fai = fai

    this.chunkSizeLimit = chunkSizeLimit
  }

  async _getIndexes() {
    if (!this.indexes) this.indexes = await this._readFAI()
    return this.indexes
  }

  async _readFAI() {
    const indexByName = {}
    const indexById = {}
    const text = await this.fai.readFile()
    if (!(text && text.length))
      throw new Error('No data read from FASTA index (FAI) file')

    let idCounter = 0
    let currSeq
    text
      .toString('utf8')
      .split(/\r?\n/)
      .filter(line => /\S/.test(line))
      .forEach(line => {
        const row = line.split('\t')
        if (row[0] === '') return

        if (!currSeq || currSeq.name !== row[0]) {
          currSeq = { name: row[0], id: idCounter }
          idCounter += 1
        }

        const entry = {
          id: currSeq.id,
          name: row[0],
          length: +row[1],
          start: 0,
          end: +row[1],
          offset: +row[2],
          lineLength: +row[3],
          lineBytes: +row[4],
        }
        indexByName[entry.name] = entry
        indexById[entry.id] = entry
      })

    return { name: indexByName, id: indexById }
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceList() {
    return Object.entries((await this._getIndexes()).id).map(
      ([key, value]) => value.name,
    )
  }

  /**
   * @returns {array[string]} array of string sequence
   * names that are present in the index, in which the
   * array index indicates the sequence ID, and the value
   * is the sequence name
   */
  async getSequenceSizes() {
    const ret = await this._getIndexes()
    return Object.entries((await this._getIndexes()).id).map(
      ([key, value]) => ({ name: value.name, start: 0, end: value.length }),
    )
  }
  /**
   *
   * @param {string} name
   * @returns {Promise[boolean]} true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name) {
    return !!(await this._getIndexes()).name[name]
  }

  /**
   *
   * @param {number} seqId
   * @param {number} min
   * @param {number} max
   */
  async getResiduesById(seqId, min, max) {
    const indexEntry = (await this._getIndexes()).id[seqId]
    if (!indexEntry) throw new Error('Reference sequence not found')
    return this._fetchFromIndexEntry(indexEntry, min, max)
  }

  /**
   * @param {string} seqName
   * @param {number} min
   * @param {number} max
   */
  async getResiduesByName(seqName, min, max) {
    const indexEntry = (await this._getIndexes()).name[seqName]
    if (!indexEntry) throw new Error('Reference sequence not found')
    return this._fetchFromIndexEntry(indexEntry, min, max)
  }

  async _fetchFromIndexEntry(indexEntry, min, max) {
    if (min < 0) {
      throw new TypeError('regionStart cannot be less than 0')
    }
    if (max === undefined || max > indexEntry.length) {
      max = indexEntry.length
    }

    const position = _faiOffset(indexEntry, min)
    const readlen = _faiOffset(indexEntry, max) - position

    if (readlen > this.chunkSizeLimit)
      throw new Error('chunkSizeLimit exceeded')

    let residues = Buffer.allocUnsafe(readlen)
    await this.fasta.read(residues, 0, readlen, position)
    residues = residues.toString('utf8').replace(/\s+/g, '')

    return residues
  }
}

module.exports = IndexedFasta
