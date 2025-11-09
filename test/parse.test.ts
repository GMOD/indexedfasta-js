import { expect, test } from 'vitest'

import {
  BgzipIndexedFasta,
  FetchableSmallFasta,
  IndexedFasta,
} from '../src/index.ts'

test('process unindexed fasta', async () => {
  const t = new FetchableSmallFasta({ path: 'test/data/phi-X174.fa' })
  expect(await t.getSequenceNames()).toEqual(['NC_001422.1'])
  expect(await t.fetch('NC_001422.1', 0, 100)).toEqual(
    'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
  )
})

async function phiTest(t: IndexedFasta) {
  let err: unknown
  const catchErr = (e: unknown) => {
    err = e
  }

  expect(await t.getSequenceNames()).toEqual(['NC_001422.1'])
  expect(await t.getSequenceSizes()).toEqual({ 'NC_001422.1': 5386 })
  expect(await t.getResiduesByName('NC_001422.1', 0, 100)).toEqual(
    'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
  )
  await t.getResiduesByName('NC_001422.1', -100, 100).catch(catchErr)
  expect(`${err}`).toContain('cannot be less than 0')
  expect(await t.getResiduesByName('NC_001422.1', 100, 150)).toEqual(
    'CGAATTAAATCGAAGTGGACTGCTGGCGGAAAATGAGAAAATTCGACCTA',
  )
  expect(await t.getResiduesByName('missing', 1, 100)).toEqual(undefined)
}

async function endTest(t: IndexedFasta) {
  expect(await t.getSequenceNames()).toEqual(['chr1'])
  expect(await t.getSequenceSizes()).toEqual({ chr1: 100100 })
  expect(await t.getResiduesByName('chr1', 100000, 100100)).toEqual(
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  )
  expect(await t.getResiduesByName('chr1', 100000, 100200)).toEqual(
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  )
  expect(await t.getResiduesByName('chr1', 0, 100)).toEqual(
    'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
  )
}

async function volvoxTest(t: IndexedFasta) {
  expect(await t.getSequenceNames()).toEqual(['ctgA', 'ctgB'])
  expect(await t.getSequenceSize('ctgA')).toEqual(50001)
  expect(await t.getSequenceSize('ctgC')).toEqual(undefined)
  expect(await t.getSequenceSizes()).toEqual({ ctgA: 50001, ctgB: 6079 })
  expect(await t.getResiduesByName('ctgA', 0, 100)).toEqual(
    'cattgttgcggagttgaacaACGGCATTAGGAACACTTCCGTCTCtcacttttatacgattatgattggttctttagccttggtttagattggtagtagt',
  )
}

test('process indexed fasta', async () => {
  const t = new IndexedFasta({
    path: 'test/data/phi-X174.fa',
    faiPath: 'test/data/phi-X174.fa.fai',
  })
  await phiTest(t)
  const e = new IndexedFasta({
    path: 'test/data/end.fa',
    faiPath: 'test/data/end.fa.fai',
  })
  await endTest(e)
  const v = new IndexedFasta({
    path: 'test/data/volvox.fa',
    faiPath: 'test/data/volvox.fa.fai',
  })
  await volvoxTest(v)
})

test('process bgzipped path', async () => {
  const t = new BgzipIndexedFasta({
    path: 'test/data/phi-X174.fa.gz',
    gziPath: 'test/data/phi-X174.fa.gz.gzi',
    faiPath: 'test/data/phi-X174.fa.fai',
  })
  await phiTest(t)
  const e = new BgzipIndexedFasta({
    path: 'test/data/end.fa.gz',
    gziPath: 'test/data/end.fa.gz.gzi',
    faiPath: 'test/data/end.fa.fai',
  })
  await endTest(e)
  const v = new BgzipIndexedFasta({
    path: 'test/data/volvox.fa.gz',
    gziPath: 'test/data/volvox.fa.gz.gzi',
    faiPath: 'test/data/volvox.fa.gz.fai',
  })
  await volvoxTest(v)
})
