[![NPM version](https://img.shields.io/npm/v/@gmod/indexedfasta.svg?style=flat-square)](https://npmjs.org/package/@gmod/indexedfasta)
[![Coverage Status](https://img.shields.io/codecov/c/github/GMOD/indexedfasta-js/master.svg?style=flat-square)](https://codecov.io/gh/GMOD/indexedfasta-js/branch/master)
[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/indexedfasta-js/push.yml?branch=master)](https://github.com/GMOD/indexedfasta-js/actions)

## Install

    $ npm install --save @gmod/indexedfasta

## Usage

```typescript
const { IndexedFasta, BgzipIndexedFasta } = require('@gmod/indexedfasta')

const t = new IndexedFasta({
  path: 'test.fa',
  faiPath: 'test.fa.fai',
})
// or
const t = new BgzipIndexedFasta({
  path: 'test.fa.gz',
  faiPath: 'test.fa.gz.fai',
  gziPath: 'test.fa.gz.gzi',
})

// get the first 10 bases of a sequence from the file.
// coordinates are UCSC standard 0-based half-open
//
const chr1Region = await t.getSequence('chr1', 0, 10)
// chr1Region is now a string of bases, 'ACTG...'

// get a whole sequence from the file
const chr1Bases = await t.getSequence('chr1')

// get object with all seq lengths as { seqName => length, ... }
const allSequenceSizes = await t.getSequenceSizes()

// get the size of a single sequence
const chr1Size = await t.getSequenceSize('chr1')

// get an array of all sequence names in the file
const seqNames = await t.getSequenceNames()
```

If you are using in the browser, you may use the generic-filehandle package and
initialize like this

```typescript
import { IndexedFasta, BgzipIndexedFasta } from '@gmod/indexedfasta'
import { RemoteFile } from 'generic-filehandle'

const t = new IndexedFasta({
  fasta: new RemoteFile('http://yoursite.com/test.fa'),
  fai: new RemoteFile('http://yoursite.com/test.fa.fai'),
})
const t = new BgzipIndexedFasta({
  fasta: new RemoteFile('http://yoursite.com/test.fa.gz'),
  fai: new RemoteFile('http://yoursite.com/test.fa.gz.fai'),
  gzi: new RemoteFile('http://yoursite.com/test.fa.gz.gzi'),
})
```

In node.js you can also access remote files with generic-filehandle, but you
would supply a fetch function e.g.

```typescript
import { IndexedFasta, BgzipIndexedFasta } from '@gmod/indexedfasta'
import { RemoteFile } from 'generic-filehandle'
import fetch from 'cross-fetch'

const t = new IndexedFasta({
  fasta: new RemoteFile('http://yoursite.com/test.fa', { fetch }),
  fai: new RemoteFile('http://yoursite.com/test.fa.fai', { fetch }),
})
```

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)
