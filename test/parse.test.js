const { expect } = require('chai')

const { FetchableSmallFasta, IndexedFasta, BgzipIndexedFasta } = require('../src')

const { testDataFile } = require('./lib/util')

describe('FASTA parser', () => {
  it('get sequence list', async () => {
    const t = new FetchableSmallFasta(testDataFile('phi-X174.fa'))
    expect(await t.getSequenceList()).to.deep.equal(['NC_001422.1'])
    expect(await t.fetch('NC_001422.1', 1, 100)).to.deep.equal(
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
    expect(await t.getSequenceList()).to.deep.equal(['NC_001422.1'])
    expect(await t.getResiduesByName('NC_001422.1', 1, 100)).to.deep.equal(
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
    expect(await t.getSequenceList()).to.deep.equal(['NC_001422.1'])
    expect(await t.getResiduesByName('NC_001422.1', 1, 100)).to.deep.equal(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})
