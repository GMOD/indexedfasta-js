import {parseAttributes,parseFeature,formatFeature,escape,unescape} from '../src/util'

describe('GFF3 utils', () => {
  ;[
    ['foo=bar', { foo: ['bar'] }],
    ['ID=Beep%2Cbonk%3B+Foo\n', { ID: ['Beep,bonk;+Foo'] }],
  ].forEach(([input, output]) => {
    it(`parses attr string ${input} correctly`, () => {
      expect(parseAttributes(input)).toEqual(output)
    })
  })

  ;[
    [
      "FooSeq\tbarsource\tmatch\t234\t234\t0\t+\t.\tID=Beep%2Cbonk%3B+Foo\n",
      {
          'attributes' : {
              'ID' : [
                  'Beep,bonk;+Foo'
              ]
          },
          'end' : 234,
          'phase' : null,
          'score' : 0,
          'seq_id' : 'FooSeq',
          'source' : 'barsource',
          'start' : 234,
          'strand' : 1,
          'type' : 'match'
      }
  ],
  [
      escape("Noggin,+-\%Foo\tbar")+"\tbarsource\tmatch\t234\t234\t0\t+\t.\t.\n",
      {
          'attributes' : {},
          'end' : 234,
          'phase' : null,
          'score' : 0,
          'seq_id' : "Noggin,+-\%Foo\tbar",
          'source' : 'barsource',
          'start' : 234,
          'strand' : 1,
          'type' : 'match'
      }
  ]
          ].forEach(
          function( [input,output] ) {
              it( `roundtrips feature line ${input} correctly`, () => {
                      expect( parseFeature( input ) ).toEqual( output )
                      expect( formatFeature( output ) ).toEqual( input )
                      expect( formatFeature( parseFeature( input ) ) ).toEqual( input )
                      expect( parseFeature( formatFeature( output ) ) ).toEqual( output )
              })
          })
})
