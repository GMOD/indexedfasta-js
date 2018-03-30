import fs from 'fs'
import readline from 'readline'

import Parser from '../dist/parse'

function tee(t) {
  console.log(t)
  return t
}

describe('GFF3 parser', () => {
  it('can parse gff3_with_syncs.gff3', () => {
    return new Promise((resolve, reject) => {
      const stuff = { features: [], directives: [], fasta: [] }
      const p = new Parser({
        featureCallback(f) {
          stuff.features.push(f)
        },
        directiveCallback(d) {
          stuff.directives.push(d)
        },
        endCallback() {
          resolve(stuff)
        },
        errorCallback: reject
      })

      const lineReader = readline.createInterface({
        input: fs.createReadStream(
          require.resolve('./data/gff3_with_syncs.gff3'),
        ),
      })
      lineReader.on('line', l => p.addLine(l))
      lineReader.on('close', () => p.finish())
      lineReader.on('error', reject)
    }).then(stuff => {
      const referenceResult = JSON.parse(
        fs.readFileSync(require.resolve('./data/gff3_with_syncs.result.json')),
      )
      expect(stuff).toEqual(referenceResult)
    })
  })
})
