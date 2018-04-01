import fs from 'fs'
import { promisify } from 'util'
import getStream from 'get-stream'

import gff from '../src'

const readfile = promisify(fs.readFile)

describe('GFF3 formatting', () => {
  ;['spec_eden', 'au9_scaffold_subset'].forEach(file => {
    it(`can roundtrip ${file}.gff3 with formatStream`, async () => {
      const expectedGFF3 = (await readfile(
        require.resolve(`./data/${file}.reformatted.gff3`),
      )).toString('utf8')

      const resultGFF3 = await getStream(
        fs
          .createReadStream(require.resolve(`./data/${file}.gff3`))
          .pipe(
            gff.parseStream({
              parseFeatures: true,
              parseComments: true,
              parseDirectives: true,
            }),
          )
          .pipe(gff.formatStream()),
      )
      expect(resultGFF3).toEqual(expectedGFF3)
    })
  })
})
