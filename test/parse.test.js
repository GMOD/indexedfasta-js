import fs from 'fs'
import * as fasta from '../src'
import {promisify} from 'es6-promisify';

const readFile = promisify(fs.readFile);


async function readAll(filename) {
  var t = await readFile(require.resolve(filename), {encoding: 'utf8'});
  return fasta.parseSmallFasta(t);
}

describe('FASTA parser', () => {
  it('can parse fasta', async () => {
    const stuff = await readAll('./data/phi-X174.fa')
    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/phi-X174.fa.json')),
    )
    expect(stuff).toEqual(referenceResult)
  })



})
