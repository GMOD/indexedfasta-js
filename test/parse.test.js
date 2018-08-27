import { promisify } from 'es6-promisify'

import { FetchableSmallFasta, IndexedFasta, BgzipIndexedFasta } from '../src'

const { testDataFile, fs } = require('./lib/util')

const readFile = promisify(fs.readFile)

describe('FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new FetchableSmallFasta(testDataFile('phi-X174.fa'))
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
    expect(await t.fetch('NC_001422.1', 1, 100)).toEqual(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})
async function phiTest(t) {
  expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
  expect(await t.getSequenceSizes()).toEqual([{ name: 'NC_001422.1', start: 0, end: 5386}])
  expect(await t.getResiduesByName('NC_001422.1', 1, 100)).toEqual(
    'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
  )
  expect(await t.getResiduesByName('NC_001422.1', -100, 100)).toEqual(
    'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
  )
  let err
  const catchErr = e => {
    err = e
  }
  await t.getResiduesByName('missing', 1, 100).catch(catchErr)
  expect(err.toString()).toContain('not found')
}

async function endTest(t) {
  expect(await t.getSequenceList()).toEqual(['chr1'])
  expect(await t.getSequenceSizes()).toEqual([{ name: 'chr1', start: 0, end: 100100}])
  expect(await t.getResiduesByName('chr1', 100000, 100100)).toEqual(
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  )
  expect(await t.getResiduesByName('chr1', 100000, 100200)).toEqual(
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  )
  expect(await t.getResiduesByName('chr1', 1, 100)).toEqual(
    'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
  )
  // expect(await t.getResiduesByName('chr1', 0, 100)).toEqual(
  //   'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
  // )
}

describe('Indexed FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new IndexedFasta({
      fasta: testDataFile('phi-X174.fa'),
      fai: testDataFile('phi-X174.fa.fai'),
    })
    phiTest(t)
    const e = new IndexedFasta({
      fasta: testDataFile('end.fa'),
      fai: testDataFile('end.fa.fai'),
    })
    endTest(e)
  })
})

describe('Compressed indexed FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new BgzipIndexedFasta({
      fasta: testDataFile('phi-X174.fa.gz'),
      gzi: testDataFile('phi-X174.fa.gz.gzi'),
      fai: testDataFile('phi-X174.fa.fai'),
    })
    phiTest(t)
    const e = new BgzipIndexedFasta({
      fasta: testDataFile('end.fa.gz'),
      gzi: testDataFile('end.fa.gz.gzi'),
      fai: testDataFile('end.fa.fai'),
    })
    endTest(e)
  })
})
