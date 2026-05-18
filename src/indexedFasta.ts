import { LocalFile } from 'generic-filehandle2'

import type { GenericFilehandle } from 'generic-filehandle2'

const decoder = new TextDecoder('utf8')

export interface BaseOpts {
  signal?: AbortSignal
}

// Narrower than GenericFilehandle: only requires positional read. Lets us
// accept handles like BgzfFilehandle that don't implement readFile/stat/close.
export interface SeqReader {
  read(
    length: number,
    position: number,
    opts?: BaseOpts,
  ): Promise<Uint8Array>
}

export interface SeqRecord {
  offset: number
  length: number
  lineLength: number
  lineBytes: number
}

function faiOffset(
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
): Promise<Map<string, SeqRecord>> {
  const text = decoder.decode(await fai.readFile(opts))

  const index = new Map<string, SeqRecord>()
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const cols = line.split('\t')
    if (cols.length < 5) {
      throw new Error(
        `Malformed FAI line (expected 5 tab-separated columns, got ${String(cols.length)}): ${line}`,
      )
    }
    const [name, seqLenStr, offsetStr, lineLengthStr, lineBytesStr] = cols
    if (name!.startsWith('>')) {
      throw new Error(
        'found > in sequence name, might have supplied FASTA file for the FASTA index',
      )
    }

    const length = +seqLenStr!
    const lineLength = +lineLengthStr!
    if (length > 0 && lineLength === 0) {
      throw new Error(
        `Invalid FAI index for "${name!}": LINEBASES is 0, FASTA likely missing trailing newline; regenerate the .fai index`,
      )
    }
    index.set(name!, {
      length,
      offset: +offsetStr!,
      lineLength,
      lineBytes: +lineBytesStr!,
    })
  }

  return index
}

export async function fetchFromIndex(
  fasta: SeqReader,
  rec: SeqRecord,
  min = 0,
  max?: number,
  opts?: BaseOpts,
) {
  if (min < 0) {
    throw new TypeError('regionStart cannot be less than 0')
  }
  const end = Math.min(max ?? rec.length, rec.length)
  if (min >= end) {
    return ''
  }

  const position = faiOffset(rec.offset, rec.lineBytes, rec.lineLength, min)
  const readlen =
    faiOffset(rec.offset, rec.lineBytes, rec.lineLength, end) - position

  const seq = decoder
    .decode(await fasta.read(readlen, position, opts))
    .replace(/\s+/g, '')

  if (/[^\x20-\x7e]/.test(seq.slice(0, 1000))) {
    throw new Error(
      'Non-ASCII bytes in sequence; file may be gzip — use BgzipIndexedFasta or decompress',
    )
  }

  return seq
}

export default class IndexedFasta {
  fasta: SeqReader
  fai: GenericFilehandle
  indexes?: Promise<Map<string, SeqRecord>>

  constructor({
    fasta,
    fai,
    path,
    faiPath,
  }: {
    fasta?: SeqReader
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
      throw new Error('Need to pass filehandle for fai or path to localfile')
    }
  }

  private async getIndexes(opts?: BaseOpts) {
    this.indexes ??= readFAI(this.fai, opts).catch((e: unknown) => {
      this.indexes = undefined
      throw e
    })
    return this.indexes
  }

  /**
   * @returns array of string sequence names that are present in the index, in
   * which the array index indicates the sequence ID, and the value is the
   * sequence name
   */
  async getSequenceNames(opts?: BaseOpts) {
    return [...(await this.getIndexes(opts)).keys()]
  }

  /**
   * @returns object mapping sequence names to their lengths
   */
  async getSequenceSizes(opts?: BaseOpts) {
    const sizes: Record<string, number> = {}
    for (const [name, rec] of await this.getIndexes(opts)) {
      sizes[name] = rec.length
    }
    return sizes
  }

  /**
   * @returns the length of the given sequence, or undefined if not found
   */
  async getSequenceSize(seqName: string, opts?: BaseOpts) {
    return (await this.getIndexes(opts)).get(seqName)?.length
  }

  /**
   * @returns true if the file contains the given reference sequence name
   */
  async hasReferenceSequence(name: string, opts?: BaseOpts) {
    return (await this.getIndexes(opts)).has(name)
  }

  async getResiduesByName(
    seqName: string,
    min: number,
    max: number,
    opts?: BaseOpts,
  ) {
    const rec = (await this.getIndexes(opts)).get(seqName)
    if (rec === undefined) {
      return undefined
    }
    return fetchFromIndex(this.fasta, rec, min, max, opts)
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
}
