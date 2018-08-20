# @gmod/fasta

[![Generated with nod](https://img.shields.io/badge/generator-nod-2196F3.svg?style=flat-square)](https://github.com/diegohaz/nod)
[![NPM version](https://img.shields.io/npm/v/@gmod/fasta.svg?style=flat-square)](https://npmjs.org/package/@gmod/fasta)
[![Build Status](https://img.shields.io/travis/GMOD/fasta-js/master.svg?style=flat-square)](https://travis-ci.org/GMOD/fasta-js) [![Coverage Status](https://img.shields.io/codecov/c/github/GMOD/fasta-js/master.svg?style=flat-square)](https://codecov.io/gh/GMOD/fasta-js/branch/master)

Read and write FASTA data performantly.

* streaming parsing and streaming formatting

## Install

Not available yet

    $ npm install --save @gmod/fasta

## Usage

```js
const fasta = require('@gmod/fasta').default
// or in ES6 (recommended)
import fasta from '@gmod/fasta'

// parse a file from a file name
// parses only features and sequences by default,
// set options to parse directives and/or comments
fasta.parseFile('path/to/my/file.fasta')
.on('data', data => {
  else if (data.sequence) {
    console.log('got a sequence from a FASTA section')
  }
})

// parse a stream of GFF3 text
const fs = require('fs')
fs.createReadStream('path/to/my/file.fasta')
.pipe(fasta.parseStream())
.on('data', data => {
  console.log('got item',data)
  return data
})
.on('end', () => {
  console.log('done parsing!')
})

// parse a string of fasta synchronously
let stringOfFASTA = fs
  .readFileSync('file.fasta')
  .toString()
let arrayOfThings = fasta.parseStringSync(stringOfFASTA)

// format an array of items to a string
let stringOfFASTA = fasta.formatSync(arrayOfThings)

// format a stream of things to a stream of text.
// inserts sync marks automatically.
myStreamOfFASTAObjects
.pipe(fasta.formatStream())
.pipe(fs.createWriteStream('my_new.fasta'))
```

## Object format


### sequences

These come from any `FASTA` sequences in the file.

```js
{
  "id": "ctgA",
  "description": "test contig",
  "sequence": "ACTGACTAGCTAGCATCAGCGTCGTAGCTATTATATTACGGTAGCCA"
}
```

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)
