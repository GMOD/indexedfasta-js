import fs from 'fs'
import gff from '../src'
import { formatFeature } from '../src/util'

function readAll(filename) {
  return new Promise((resolve, reject) => {
    const stuff = {
      features: [],
      comments: [],
      directives: [],
      sequences: [],
      all: [],
    }

    // $p->max_lookback(1)
    gff
      .parseFile(require.resolve(filename), {
        parseFeatures: true,
        parseDirectives: true,
        parseComments: true,
        parseSequences: true,
        bufferSize: 10,
      })
      .on('data', d => {
        stuff.all.push(d)
        if (d.directive) stuff.directives.push(d)
        else if (d.comment) stuff.comments.push(d)
        else if (d.sequence) stuff.sequences.push(d)
        else stuff.features.push(d)
      })
      .on('end', () => {
        resolve(stuff)
      })
      .on('error', reject)
  })
}

describe('GFF3 parser', () => {
  it('can parse gff3_with_syncs.gff3', async () => {
    const stuff = await readAll('./data/gff3_with_syncs.gff3')
    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/gff3_with_syncs.result.json')),
    )
    expect(stuff.all).toEqual(referenceResult)
  })
  ;[
    [1010, 'messy_protein_domains.gff3'],
    [4, 'gff3_with_syncs.gff3'],
    [51, 'au9_scaffold_subset.gff3'],
    [14, 'tomato_chr4_head.gff3'],
    [5, 'directives.gff3'],
    [5, 'hybrid1.gff3'],
    [3, 'hybrid2.gff3'],
    [6, 'knownGene.gff3'],
    [6, 'knownGene2.gff3'],
    [16, 'tomato_test.gff3'],
    [3, 'spec_eden.gff3'],
    [1, 'spec_match.gff3'],
    [8, 'quantitative.gff3'],
  ].forEach(([count, filename]) => {
    it(`can cursorily parse ${filename}`, async () => {
      const stuff = await readAll(`./data/${filename}`)
      //     $p->max_lookback(10);
      expect(stuff.all.length).toEqual(count)
    })
  })

  it('supports children before parents, and Derives_from', async () => {
    const stuff = await readAll('./data/knownGene_out_of_order.gff3')
    // $p->max_lookback(2);
    const expectedOutput = JSON.parse(
      fs.readFileSync(
        require.resolve('./data/knownGene_out_of_order.result.json'),
      ),
    )
    expect(stuff.all).toEqual(expectedOutput)
  })

  it('can parse the EDEN gene from the gff3 spec', async () => {
    const stuff = await readAll('./data/spec_eden.gff3')
    expect(stuff.all[2]).toHaveLength(1)
    const [eden] = stuff.all[2]

    expect(eden.child_features).toHaveLength(4)

    expect(eden.child_features[0][0].type).toEqual('TF_binding_site')

    // all the rest are mRNAs
    let mrnas = eden.child_features.slice(1, 4)
    expect(mrnas.filter(m => m.length === 1)).toHaveLength(3)

    mrnas = mrnas.map(m => {
      expect(m).toHaveLength(1)
      return m[0]
    })

    mrnas.forEach(m => {
      expect(m.type).toEqual('mRNA')
    })

    // check that all the mRNAs share the last exon
    const lastExon = mrnas[2].child_features[3]
    expect(mrnas[0].child_features).toContain(lastExon)
    expect(mrnas[1].child_features).toContain(lastExon)
    expect(mrnas[2].child_features).toContain(lastExon)

    expect(mrnas[0].child_features).toHaveLength(5)
    expect(mrnas[1].child_features).toHaveLength(4)
    expect(mrnas[2].child_features).toHaveLength(6)

    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/spec_eden.result.json')),
    )
    expect(stuff.all).toEqual(referenceResult)
  })

  it('can parse an excerpt of the refGene gff3', async () => {
    const stuff = await readAll('./data/refGene_excerpt.gff3')
    expect(true).toBeTruthy()
    expect(stuff.all).toHaveLength(2)
  })

  it('can parse an excerpt of the TAIR10 gff3', async () => {
    const stuff = await readAll('./data/tair10.gff3')
    expect(true).toBeTruthy()
    expect(stuff.all).toHaveLength(3)
  })

  // check that some files throw a parse error
  ;['mm9_sample_ensembl.gff3', 'Saccharomyces_cerevisiae_EF3_e64.gff3'].forEach(
    errorFile => {
      it(`throws an error when parsing ${errorFile}`, async () => {
        await expect(readAll(`./data/${errorFile}`)).rejects.toMatch(
          /inconsistent types/,
        )
      })
    },
  )

  it('can parse a string synchronously', () => {
    const gff3 = fs
      .readFileSync(require.resolve('./data/spec_eden.gff3'))
      .toString('utf8')
    const result = gff.parseStringSync(gff3, {
      parseFeatures: true,
      parseDirectives: true,
      parseComments: true,
    })
    expect(result).toHaveLength(3)
    const referenceResult = JSON.parse(
      fs.readFileSync(require.resolve('./data/spec_eden.result.json')),
    )
    expect(result).toEqual(referenceResult)
  })

  it('can parse another string synchronously', () => {
    const gff3 = `
SL2.40%25ch01	IT%25AG eugene	g%25e;ne	80999140	81004317	.	+	.	Alias=Solyc01g098840;ID=gene:Solyc01g098840.2;Name=Solyc01g098840.2;from_BOGAS=1;length=5178
`

    const result = gff.parseStringSync(gff3, {
      parseFeatures: true,
      parseDirectives: true,
      parseComments: true,
    })
    expect(result).toHaveLength(1)
    const referenceResult = [
      [
        {
          seq_id: 'SL2.40%ch01',
          source: 'IT%AG eugene',
          type: 'g%e;ne',
          start: 80999140,
          end: 81004317,
          score: null,
          strand: '+',
          phase: null,
          attributes: {
            Alias: ['Solyc01g098840'],
            ID: ['gene:Solyc01g098840.2'],
            Name: ['Solyc01g098840.2'],
            from_BOGAS: ['1'],
            length: ['5178'],
          },
          child_features: [],
          derived_features: [],
        },
      ],
    ]

    expect(result).toEqual(referenceResult)
    expect(`\n${formatFeature(referenceResult[0])}`).toEqual(gff3)
  })
  ;[
    [
      'hybrid1.gff3',
      [
        {
          id: 'A00469',
          sequence: 'GATTACAGATTACA',
        },
        {
          id: 'zonker',
          sequence:
            'AAAAAACTAGCATGATCGATCGATCGATCGATATTAGCATGCATGCATGATGATGATAGCTATGATCGATCCCCCCCAAAAAACTAGCATGATCGATCGATCGATCGATATTAGCATGCATGCATGATGATGATAGCTATGATCGATCCCCCCC',
        },
        {
          id: 'zeebo',
          description: 'this is a test description',
          sequence:
            'AAAAACTAGTAGCTAGCTAGCTGATCATAGATCGATGCATGGCATACTGACTGATCGACCCCCC',
        },
      ],
    ],
    [
      'hybrid2.gff3',
      [
        {
          id: 'A00469',
          sequence: 'GATTACAWATTACABATTACAGATTACA',
        },
      ],
    ],
  ].forEach(([filename, expectedOutput]) => {
    it(`can parse FASTA sections in hybrid ${filename} file`, async () => {
      const stuff = await readAll(`./data/${filename}`)
      expect(stuff.sequences).toEqual(expectedOutput)
    })
  })

  it('can be written to directly', async () => {
    const items = await new Promise((resolve, reject) => {
      const i = []
      const stream = gff
        .parseStream()
        .on('data', d => i.push(d))
        .on('end', () => resolve(i))
        .on('error', reject)

      stream.write(
        `SL2.40ch00	ITAG_eugene	gene	16437	18189	.	+	.	Alias=Solyc00g005000;ID=gene:Solyc00g005000.2;Name=Solyc00g005000.2;from_BOGAS=1;length=1753\n`,
      )
      stream.end()
    })

    expect(items).toHaveLength(1)
    expect(items[0][0].seq_id).toEqual('SL2.40ch00')
  })
})
