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

describe('Indexed FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new IndexedFasta({
      fasta: testDataFile('phi-X174.fa'),
      fai: testDataFile('phi-X174.fa.fai'),
    })
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
    expect(await t.getSequenceSizes()).toEqual([{ name: 'NC_001422.1', start: 0, end: 5386}])
    expect(await t.getResiduesByName('NC_001422.1', 1, 100)).toEqual(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})

describe('Compressed indexed FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new BgzipIndexedFasta({
      fasta: testDataFile('phi-X174.fa.gz'),
      gzi: testDataFile('phi-X174.fa.gz.gzi'),
      fai: testDataFile('phi-X174.fa.fai'),
    })
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
    expect(await t.getSequenceSizes()).toEqual([{ name: 'NC_001422.1', start: 0, end: 5386}])
    expect(await t.getResiduesByName('NC_001422.1', 1, 100)).toEqual(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})
