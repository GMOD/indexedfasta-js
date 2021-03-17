import fs from 'fs'
import { FetchableSmallFasta, IndexedFasta, BgzipIndexedFasta } from '../src'

describe('FASTA parser', () => {
  it('process unindexed fasta', async () => {
    const fasta = await fs.promises.open(require.resolve('./phi-X174.fa'))
    const t = new FetchableSmallFasta({ fasta })
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
    expect(await t.fetch('NC_001422.1', 0, 100)).toEqual(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})
async function phiTest(t) {
  let err
  const catchErr = e => {
    err = e
  }
  expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
  expect(await t.getSequenceSizes()).toEqual({ 'NC_001422.1': 5386 })
  expect(await t.getResiduesByName('NC_001422.1', 0, 100)).toEqual(
    'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
  )
  await t.getResiduesByName('NC_001422.1', -100, 100).catch(catchErr)
  expect(err.toString()).toContain('cannot be less than 0')
  expect(await t.getResiduesByName('NC_001422.1', 100, 150)).toEqual(
    'CGAATTAAATCGAAGTGGACTGCTGGCGGAAAATGAGAAAATTCGACCTA',
  )
  expect(await t.getResiduesByName('missing', 1, 100)).toEqual(undefined)
}

async function endTest(t) {
  expect(await t.getSequenceList()).toEqual(['chr1'])
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

async function volvoxTest(t) {
  expect(await t.getSequenceList()).toEqual(['ctgA', 'ctgB'])
  expect(await t.getSequenceSize('ctgA')).toEqual(50001)
  expect(await t.getSequenceSize('ctgC')).toEqual(undefined)
  expect(await t.getSequenceSizes()).toEqual({ ctgA: 50001, ctgB: 6079 })
  expect(await t.getResiduesByName('ctgA', 0, 100)).toEqual(
    'cattgttgcggagttgaacaACGGCATTAGGAACACTTCCGTCTCtcacttttatacgattatgattggttctttagccttggtttagattggtagtagt',
  )
}

describe('Indexed FASTA parser', () => {
  it('process indexed fasta', async () => {
    const t = new IndexedFasta({
      fasta: await fs.promises.open(require.resolve('./phi-X174.fa')),
      fai: await fs.promises.open(require.resolve('./phi-X174.fa.fai')),
    })
    await phiTest(t)
    const e = new IndexedFasta({
      fasta: await fs.promises.open(require.resolve('./end.fa')),
      fai: await fs.promises.open(require.resolve('./end.fa.fai')),
    })
    await endTest(e)
    const v = new IndexedFasta({
      fasta: await fs.promises.open(require.resolve('./volvox.fa')),
      fai: await fs.promises.open(require.resolve('./volvox.fa.fai')),
    })
    await volvoxTest(v)
  })
})

describe('Compressed indexed FASTA parser', () => {
  it('process bgzipped fasta', async () => {
    const t = new BgzipIndexedFasta({
      fasta: await fs.promises.open(require.resolve('./phi-X174.fa.gz')),
      gzi: await fs.promises.open(require.resolve('./phi-X174.fa.gz.gzi')),
      fai: await fs.promises.open(require.resolve('./phi-X174.fa.fai')),
    })
    await phiTest(t)
    const e = new BgzipIndexedFasta({
      fasta: await fs.promises.open(require.resolve('./end.fa.gz')),
      gzi: await fs.promises.open(require.resolve('./end.fa.gz.gzi')),
      fai: await fs.promises.open(require.resolve('./end.fa.fai')),
    })
    await endTest(e)
    const v = new BgzipIndexedFasta({
      fasta: await fs.promises.open(require.resolve('./volvox.fa.gz')),
      gzi: await fs.promises.open(require.resolve('./volvox.fa.gz.gzi')),
      fai: await fs.promises.open(require.resolve('./volvox.fa.gz.fai')),
    })
    await volvoxTest(v)
  })
})
