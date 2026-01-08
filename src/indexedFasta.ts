import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

interface BaseOpts {
  signal?: AbortSignal
}

interface ParsedIndex {
  names: string[]
  nameToIndex: Record<string, number>
  offsets: number[]
  lengths: number[]
  lineLengths: number[]
  lineBytes: number[]
  sizesCache?: Record<string, number>
}

function _faiOffset(
  offset: number,
  lineBytes: number,
  lineLength: number,
  pos: number,
) {
  return offset + lineBytes * Math.floor(pos / lineLength) + (pos % lineLength)
}

async function readFAI(
  fai: GenericFilehandle,
  opts: BaseOpts = {},
): Promise<ParsedIndex> {
  const decoder = new TextDecoder('utf8')
  const text = decoder.decode(
    (await fai.readFile(opts)) as unknown as Uint8Array,
  )

  const names: string[] = []
  const offsets: number[] = []
  const lengths: number[] = []
  const lineLengths: number[] = []
  const lineBytes: number[] = []
  const nameToIndex: Record<string, number> = {}

  let lineStart = 0
  const len = text.length
  let idx = 0
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

    names.push(name)
    lengths.push(+line.slice(tab1 + 1, tab2))
    offsets.push(+line.slice(tab2 + 1, tab3))
    lineLengths.push(+line.slice(tab3 + 1, tab4))
    lineBytes.push(+line.slice(tab4 + 1))
    nameToIndex[name] = idx
    idx++
  }

  return { names, nameToIndex, offsets, lengths, lineLengths, lineBytes }
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
    const idx = await this._getIndexes(opts)
    if (!idx.sizesCache) {
      const sizes: Record<string, number> = {}
      for (let i = 0; i < idx.names.length; i++) {
        sizes[idx.names[i]!] = idx.lengths[i]!
      }
      idx.sizesCache = sizes
    }
    return idx.sizesCache
  }

  /**
   * @returns the length of the given sequence, or undefined if not found
   */
  async getSequenceSize(seqName: string, opts?: BaseOpts) {
    const idx = await this._getIndexes(opts)
    const i = idx.nameToIndex[seqName]
    return i !== undefined ? idx.lengths[i] : undefined
  }

  /**
   * @param name
   *
   * @returns true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return (await this._getIndexes(opts)).nameToIndex[name] !== undefined
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
    const idx = await this._getIndexes(opts)
    const i = idx.nameToIndex[seqName]
    if (i === undefined) {
      return undefined
    }
    return this._fetchFromIndex(
      idx.offsets[i]!,
      idx.lineBytes[i]!,
      idx.lineLengths[i]!,
      idx.lengths[i]!,
      min,
      max,
      opts,
    )
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

  async _fetchFromIndex(
    offset: number,
    lineBytes: number,
    lineLength: number,
    seqLength: number,
    min = 0,
    max?: number,
    opts?: BaseOpts,
  ) {
    let end = max
    if (min < 0) {
      throw new TypeError('regionStart cannot be less than 0')
    }
    if (end === undefined || end > seqLength) {
      end = seqLength
    }
    if (min >= end) {
      return ''
    }

    const position = _faiOffset(offset, lineBytes, lineLength, min)
    const readlen = _faiOffset(offset, lineBytes, lineLength, end) - position

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
