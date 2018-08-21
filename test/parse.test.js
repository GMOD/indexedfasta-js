import {parseSmallFasta,FetchableSmallFasta,IndexedFasta} from '../src'
import {promisify} from 'es6-promisify';

const {
    testDataFile,
    loadTestJSON,
    extended,
    JsonClone,
    REWRITE_EXPECTED_DATA,
    fs,
} = require('./lib/util')
const readFile = promisify(fs.readFile);

async function readAll(filename) {
  var t = await readFile(require.resolve(filename), {encoding: 'utf8'});
  return parseSmallFasta(t);
}

describe('FASTA parser', () => {
  it('can parse fasta', async () => {
    const stuff = await readAll('./data/phi-X174.fa')
    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/phi-X174.fa.json')),
    )
    expect(stuff).toEqual(referenceResult)
  })
  it('get sequence list', async () => {
    var t = new FetchableSmallFasta(testDataFile('./phi-X174.fa'));
    expect(await t.getSequenceList()).toEqual(['NC_001422.1'])
  })
})

