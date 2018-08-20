import fs from 'fs'
import fasta from '../src'

function readAll(filename) {
  return new Promise((resolve, reject) => {
    const stuff = [];

    // $p->max_lookback(1)
   fasta
      .parseSmallFasta(require.resolve(filename), {
        bufferSize: 10,
      })
      .on('data', d => {
        stuff.push(d);
        console.log(d);
      })
      .on('end', () => {
        resolve(stuff)
      })
      .on('error', reject)
  })
}

describe('FASTA parser', () => {
  it('can parse fasta', async () => {
    const stuff = await readAll('./data/phi-X174.fa')
    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/phi-X174.fa.json')),
    )
    expect(stuff.all).toEqual(referenceResult)
  })


})
