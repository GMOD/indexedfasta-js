import { parseSmallFasta, FetchableSmallFasta, IndexedFasta } from '../src'
import { promisify } from 'es6-promisify'

const {
  testDataFile,
  loadTestJSON,
  extended,
  JsonClone,
  REWRITE_EXPECTED_DATA,
  fs,
} = require('./lib/util')

const readFile = promisify(fs.readFile)


describe('FASTA parser', () => {
  // it('can parse fasta', async () => {
  //   const stuff = parseSmallFasta(testDataFile('phi-X174.fa'))
  //   const referenceResult = loadTestJSON('phi-X174.fa.json')
  //   expect(stuff).toEqual(referenceResult)
  // })
  it('get sequence list', async () => {
    const t = new FetchableSmallFasta(testDataFile('phi-X174.fa'))
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
    expect(await t.fetch('NC_001422.1', 1, 100)).toEqual(
      'GAGTTTTATCGCTTCCATGACGCAGAAGTTAACACTTTCGGATATTTCTGATGAGTCGAAAAATTATCTTGATAAAGCAGGAATTACTACTGCTTGTTTA',
    )
  })
})
