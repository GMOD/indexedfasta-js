import gff from '../src'

const { parseAttributes, parseFeature, formatFeature, escapeColumn } = gff.util

describe('GFF3 utils', () => {
  ;[
    ['foo=bar', { foo: ['bar'] }],
    ['ID=Beep%2Cbonk%3B+Foo\n', { ID: ['Beep,bonk;+Foo'] }],
  ].forEach(([input, output]) => {
    it(`parses attr string ${input} correctly`, () => {
      expect(parseAttributes(input)).toEqual(output)
    })
  })

  const tests = [
    [
      `FooSeq\tbarsource\tmatch\t234\t234\t0\t+\t.\tID=Beep%2Cbonk%3B+Foo\n`,
      {
        attributes: {
          ID: ['Beep,bonk;+Foo'],
        },
        end: 234,
        phase: null,
        score: 0,
        seq_id: 'FooSeq',
        source: 'barsource',
        start: 234,
        strand: '+',
        type: 'match',
      },
    ],
    [
      `${escapeColumn(
        'Noggin,+-%Foo\tbar',
      )}\tbarsource\tmatch\t234\t234\t0\t+\t.\t.\n`,
      {
        attributes: {},
        end: 234,
        phase: null,
        score: 0,
        seq_id: 'Noggin,+-%Foo\tbar',
        source: 'barsource',
        start: 234,
        strand: '+',
        type: 'match',
      },
    ],
  ]
  tests.forEach(([input, output]) => {
    it(`roundtrips feature line ${input} correctly`, () => {
      expect(parseFeature(input)).toEqual(output)
      expect(formatFeature(output)).toEqual(input)
      expect(formatFeature(parseFeature(input))).toEqual(input)
      expect(parseFeature(formatFeature(output))).toEqual(output)
    })
  })
})

// is( gff3_format_attributes( undef ), '.', 'format undef attributes' );
// is( gff3_format_attributes( {}    ), '.', 'format empty attributes' );
// is( gff3_format_attributes( { zee => 'zoz' } ), 'zee=zoz', 'format malformed attributes' );
// is( gff3_format_attributes( { Alias => [], ID => ['Jim'] } ), 'ID=Jim', 'skip empty attributes' );
// is( gff3_format_attributes( { Alias => [], ID => ['Jim'], Alias => ['Bob'], fogbat => ['noggin'], '01base' => ['free'], } ), 'ID=Jim;Alias=Bob;01base=free;fogbat=noggin', 'ID is forced to be first-printed attr' );
// is( gff3_format_attributes( { ID => 'Bob', zee => undef } ), 'ID=Bob', 'also skip undef attributes 1' );
// is( gff3_format_attributes( { ID => 'Bob', zee => [ undef ] } ), 'ID=Bob', 'also skip undef attributes 2' );

// is_deeply(
//     gff3_parse_directive(" ## sequence-region contig12321_2.3  23,232  24,435,432"),
//     { directive => 'sequence-region',
//       seq_id => 'contig12321_2.3',
//       start => 23_232,
//       end   => 24_435_432,
//       value => 'contig12321_2.3  23,232  24,435,432',
//     },
//     'gff3_parse_directive seems to work',
// );
