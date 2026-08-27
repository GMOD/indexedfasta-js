import { LocalFile } from 'generic-filehandle2'
import { describe, expect, it, vi } from 'vitest'

import { IndexedFasta } from '../src/index.ts'

// Counts what a read actually pulls off disk, because over HTTP every one of
// these is a range request. The numbers here are the ones the README quotes.
class CountingFile extends LocalFile {
  reads: { position: number; length: number }[] = []

  override async read(length: number, position = 0) {
    const data = await super.read(length, position)
    this.reads.push({ position, length: data.length })
    return data
  }

  get bytes() {
    return this.reads.reduce((sum, r) => sum + r.length, 0)
  }
}

const CACHE_CHUNK = 256 * 1024

describe('what getSequence reads', () => {
  it('reads the fai once and then one range per call', async () => {
    const fasta = new CountingFile('test/data/T_ko.fa')
    const fai = new CountingFile('test/data/T_ko.fa.fai')
    const readIndex = vi.spyOn(fai, 'readFile')
    const file = new IndexedFasta({ fasta, fai })

    for (let i = 0; i < 10; i++) {
      const sequence = await file.getSequence('chr1', i * 100, i * 100 + 100)
      expect(sequence).toHaveLength(100)
    }

    expect(readIndex).toHaveBeenCalledTimes(1)
    expect(fai.reads).toEqual([])
    expect(fasta.reads).toHaveLength(10)

    // ten requests covering 1 kb, which one chunk of a byte-range cache holds
    expect(fasta.bytes).toBeLessThan(1100)
    const first = fasta.reads[0]!
    const last = fasta.reads.at(-1)!
    expect(last.position + last.length - first.position).toBeLessThan(
      CACHE_CHUNK,
    )
  })
})
