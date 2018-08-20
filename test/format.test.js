import fs from 'fs'
import tmp from 'tmp-promise'

import { promisify } from 'es6-promisify'
import getStream from 'get-stream'

import fasta from '../src'

const readfile = promisify(fs.readFile)
const fdatasync = promisify(fs.fdatasync)

describe('FASTA formatting', () => {
  ;['phi-X174'].forEach(file => {
    it(`can roundtrip ${file}.fa with formatSync`, () => {
      const inputFasta = fs
        .readFileSync(require.resolve(`./data/${file}.fa`))
        .toString('utf8')

      const expectedFasta = fs
        .readFileSync(require.resolve(`./data/${file}.fasta`))
        .toString('utf8')

      const items = fasta.parseStringSync(inputFasta)
      const resultFasta = fasta.formatSync(items)
      expect(resultFasta).toEqual(expectedFasta)
    })

    it(`can roundtrip ${file}.fa with formatStream`, async () => {
      const expectedFasta = (await readfile(
        require.resolve(`./data/${file}.fa`),
      )).toString('utf8')

      const resultFasta = await getStream(
        fs
          .createReadStream(require.resolve(`./data/${file}.fa`))
          .pipe(fasta.parseStream())
          .pipe(fasta.formatStream()),
      )
      expect(resultFasta).toEqual(expectedFasta)
    })
  })
})
