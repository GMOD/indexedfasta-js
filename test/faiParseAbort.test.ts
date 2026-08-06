import { expect, test } from 'vitest'

import { IndexedFasta } from '../src/index.ts'

import type { GenericFilehandle } from 'generic-filehandle2'

/**
 * A .fai read that parks until the test releases it and honours the signal, so
 * a parse shared by several callers can be caught mid-flight.
 *
 * SYNC: ~/src/gmod/bam-js/test/cache.test.ts GatedFile,
 * ~/src/gmod/tabix-js/test/indexParseAbort.test.ts GatedFile — same harness,
 * cut down to the one method this package's index read uses.
 */
class GatedFai {
  reads = 0
  private release!: () => void
  private released = new Promise<void>(resolve => {
    this.release = resolve
  })

  open() {
    this.release()
  }

  async readFile(options?: { signal?: AbortSignal }) {
    this.reads++
    await new Promise<void>((resolve, reject) => {
      void this.released.then(resolve)
      options?.signal?.addEventListener('abort', () => {
        reject(new Error('aborted'))
      })
    })
    return new TextEncoder().encode('chr1\t100\t6\t60\t61\n')
  }
}

function fastaWith(fai: GatedFai) {
  return new IndexedFasta({
    fasta: { read: () => Promise.resolve(new Uint8Array(0)) },
    fai: fai as unknown as GenericFilehandle,
  })
}

function tick() {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

// The .fai is read and parsed once and every method here awaits it, so the
// first caller to arrive owns a read all the others depend on. This is the
// reference-sequence track: a pan that abandons one fetch used to fail every
// other fetch in flight.
test('a bystander survives the .fai read owner aborting', async () => {
  const fai = new GatedFai()
  const fasta = fastaWith(fai)

  const starter = new AbortController()
  const bystander = new AbortController()

  const starterP = fasta.getSequenceNames({ signal: starter.signal })
  const bystanderP = fasta.getSequenceSizes({ signal: bystander.signal })
  void Promise.allSettled([starterP, bystanderP])
  await tick()
  expect(fai.reads).toBe(1)

  starter.abort()
  fai.open()

  await expect(starterP).rejects.toThrow(/abort/i)
  // The bystander never asked to be cancelled. Before this it inherited the
  // starter's abort and rejected with it.
  expect(bystander.signal.aborted).toBe(false)
  await expect(bystanderP).resolves.toEqual({ chr1: 100 })
  // one read: the parse the bystander joined is not cancelled, so there is
  // nothing to start over
  expect(fai.reads).toBe(1)
})

// The other half of the rule: a read nobody is waiting on any more IS
// cancelled, rather than left running to fill a memo no caller will read.
test('the .fai read is cancelled once every caller has given up', async () => {
  const fai = new GatedFai()
  const fasta = fastaWith(fai)

  const a = new AbortController()
  const b = new AbortController()

  const aP = fasta.getSequenceNames({ signal: a.signal })
  const bP = fasta.getSequenceNames({ signal: b.signal })
  void Promise.allSettled([aP, bP])
  await tick()
  expect(fai.reads).toBe(1)

  // a alone is not everyone: `aP` is still pending, because a caller learns of
  // its own abort when the read it was waiting on settles
  a.abort()
  await tick()
  expect(fai.reads).toBe(1)

  // ...and now it is. The read is never released — the abort is what unblocks
  // it, so this test hanging is the failure mode.
  b.abort()
  await expect(aP).rejects.toThrow(/abort/i)
  await expect(bP).rejects.toThrow(/abort/i)

  // the rejection was dropped rather than cached, so a later caller starts over
  fai.open()
  await expect(fasta.getSequenceNames()).resolves.toEqual(['chr1'])
  expect(fai.reads).toBe(2)
})

test('a duck-typed signal that has not aborted still reads', async () => {
  const fasta = new IndexedFasta({ path: 'test/data/foo.fa' })
  const signal = { aborted: false } as AbortSignal

  await expect(fasta.getSequenceNames({ signal })).resolves.toContain('chr1')
})
