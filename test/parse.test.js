import fs from 'fs'
import gff from '../src'

function readAll(filename) {
  return new Promise((resolve, reject) => {
    const stuff = {
      features: [],
      comments: [],
      directives: [],
      all: [],
    }

    // $p->max_lookback(1)
    gff
      .parseFile(require.resolve(filename), {
        parseFeatures: true,
        parseDirectives: true,
        parseComments: true,
      })
      .on('data', d => {
        stuff.all.push(d)
        if (d.directive) stuff.directives.push(d)
        else if (d.comment) stuff.comments.push(d)
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
    delete stuff.all
    expect(stuff).toEqual(referenceResult)
  })
  ;[
    [1010, 'messy_protein_domains.gff3'],
    [4, 'gff3_with_syncs.gff3'],
    [51, 'au9_scaffold_subset.gff3'],
    [14, 'tomato_chr4_head.gff3'],
    [5, 'directives.gff3'],
    [2, 'hybrid1.gff3'],
    [2, 'hybrid2.gff3'],
    [5, 'knownGene.gff3'],
    [5, 'knownGene2.gff3'],
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
    // is( scalar( @stuff ), 6, 'got 6 top-level things' );
    // is_deeply( [@stuff[0..4]], $right_output, 'got the right parse results' ) or diag explain \@stuff;
    // is( $stuff[5]{directive}, 'FASTA', 'and last thing is a FASTA directive' );
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


})

// TODO

// # check the fasta at the end of the hybrid files
// for my $f ( 'hybrid1.gff3', 'hybrid2.gff3' ) {
//     my $p = Bio::GFF3::LowLevel::Parser->open( catfile(qw( t data ), $f ));
//     $p->max_lookback(3);
//     my @items;
//     while( my $item = $p->next_item ) {
//         push @items, $item;
//     }
//     is( scalar @items, 3, 'got 3 items' );
//     is( $items[-1]->{directive}, 'FASTA', 'last one is a FASTA directive' )
//         or diag explain \@items;
//     is( slurp_fh($items[-1]->{filehandle}), <<EOF, 'got the right stuff in the filehandle' ) or diag explain $items[-1];
// >A00469
// GATTACA
// GATTACA
// EOF
// }

// { # try parsing from a string ref
//     my $gff3 = <<EOG;
// SL2.40ch01	ITAG_eugene	gene	80999140	81004317	.	+	.	Alias=Solyc01g098840;ID=gene:Solyc01g098840.2;Name=Solyc01g098840.2;from_BOGAS=1;length=5178
// EOG
//     my $i = Bio::GFF3::LowLevel::Parser->open( \$gff3 )->next_item;
//     is( $i->[0]{source}, 'ITAG_eugene', 'parsed from a string ref OK' ) or diag explain $i;
//     my $tempfile = File::Temp->new;
//     $tempfile->print( $gff3 );
//     $tempfile->close;
//     open my $fh, '<', "$tempfile" or die "$! reading $tempfile";
//     $i = Bio::GFF3::LowLevel::Parser->open( $fh  )->next_item;
//     is( $i->[0]{source}, 'ITAG_eugene', 'parsed from a filehandle OK' ) or diag explain $i;

// }
