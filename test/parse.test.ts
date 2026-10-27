import { describe, expect, test } from 'vitest'

import {
  BgzipIndexedFasta,
  FetchableSmallFasta,
  IndexedFasta,
  parseSmallFasta,
} from '../src/index.ts'

test('parseSmallFasta splits id from description', () => {
  expect(
    parseSmallFasta('>seq1 first sequence\nACGT\nACGT\n\n>seq2\nTTTT\n'),
  ).toEqual([
    { id: 'seq1', description: 'first sequence', sequence: 'ACGTACGT' },
    { id: 'seq2', description: '', sequence: 'TTTT' },
  ])
})

describe('parseSmallFasta leading comments', () => {
  const records = '>chr1 desc one\nACGTACGT\nAC\n>chr2\nTTTT\n'
  const expected = [
    { id: 'chr1', description: 'desc one', sequence: 'ACGTACGTAC' },
    { id: 'chr2', description: '', sequence: 'TTTT' },
  ]

  test('skips ; comments, FHR headers and blank lines', () => {
    expect(parseSmallFasta(records)).toEqual(expected)
    expect(parseSmallFasta(`;a comment\n${records}`)).toEqual(expected)
    expect(
      parseSmallFasta(`;~schema: x\n;~taxon:\n\n;~  name: y\n${records}`),
    ).toEqual(expected)
  })

  test('a > inside a comment starts no record', () => {
    expect(parseSmallFasta(`;see >chr2 below\n${records}`)).toEqual(expected)
  })

  test('a file of only comments has no records', () => {
    expect(parseSmallFasta(';one\n;two\n')).toEqual([])
  })

  test('a comment ended by a lone \\r does not swallow a record', () => {
    expect(parseSmallFasta(`;c\r${records}`)).toEqual(expected)
  })

  test('CRLF comment and blank lines', () => {
    const crlf = records.replaceAll('\n', '\r\n')
    expect(parseSmallFasta(`;one\r\n\r\n;two\r\n${crlf}`)).toEqual(expected)
  })

  test('millions of leading lines do not overflow the stack', () => {
    const text = ';c\n'.repeat(1_500_000) + '\n'.repeat(1_500_000) + records
    expect(parseSmallFasta(text)).toEqual(expected)
  })
})

test('a > inside a description does not split the entry', () => {
  expect(
    parseSmallFasta('>ctgA gene A>B fusion\nACGT\n>ctgB\tx\nTT\n'),
  ).toEqual([
    { id: 'ctgA', description: 'gene A>B fusion', sequence: 'ACGT' },
    { id: 'ctgB', description: 'x', sequence: 'TT' },
  ])
})

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
  expect(String(err)).toContain('cannot be less than 0')
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
  expect(await t.hasReferenceSequence('ctgA')).toBe(true)
  expect(await t.hasReferenceSequence('ctgC')).toBe(false)
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

test('IndexedFasta throws error when given gzip file', async () => {
  const t = new IndexedFasta({
    path: 'test/data/volvox.fa.gz',
    faiPath: 'test/data/volvox.fa.gz.fai',
  })
  await expect(t.getResiduesByName('ctgA', 0, 100)).rejects.toThrow(/Non-ASCII/)
})

test('IndexedFasta throws clear error for FAI with LINEBASES=0 (missing trailing newline)', async () => {
  const t = new IndexedFasta({
    path: 'test/data/no-newline.fa',
    faiPath: 'test/data/no-newline.fa.fai',
  })
  await expect(t.getResiduesByName('seq1', 0, 8)).rejects.toThrow(
    /Invalid FAI index.*LINEBASES is 0.*trailing newline/,
  )
})
