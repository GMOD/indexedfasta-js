[![NPM version](https://img.shields.io/npm/v/@gmod/indexedfasta.svg?style=flat-square)](https://npmjs.org/package/@gmod/indexedfasta)
[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/indexedfasta-js/push.yml?branch=main)](https://github.com/GMOD/indexedfasta-js/actions)

## Install

```bash
npm install @gmod/indexedfasta
```

## Usage

```typescript
import { IndexedFasta, BgzipIndexedFasta } from '@gmod/indexedfasta'

const fasta = new IndexedFasta({
  path: 'test.fa',
  faiPath: 'test.fa.fai',
})
// or
const bgzipFasta = new BgzipIndexedFasta({
  path: 'test.fa.gz',
  faiPath: 'test.fa.gz.fai',
  gziPath: 'test.fa.gz.gzi',
})

// get the first 10 bases of a sequence from the file
// coordinates are UCSC standard 0-based half-open
const chr1Region = await fasta.getSequence('chr1', 0, 10)
// chr1Region is a string of bases e.g. 'ACTG...' or undefined if not found

// get a whole sequence from the file
const chr1Bases = await fasta.getSequence('chr1')

// get object with all seq lengths as { seqName => length, ... }
const allSequenceSizes = await fasta.getSequenceSizes()

// get the size of a single sequence
const chr1Size = await fasta.getSequenceSize('chr1')

// get an array of all sequence names in the file
const seqNames = await fasta.getSequenceNames()
```

If you are using this in the browser, you may use the generic-filehandle2 package and
initialize like this

```typescript
import { IndexedFasta, BgzipIndexedFasta } from '@gmod/indexedfasta'
import { RemoteFile } from 'generic-filehandle2'

const fasta = new IndexedFasta({
  fasta: new RemoteFile('https://example.com/test.fa'),
  fai: new RemoteFile('https://example.com/test.fa.fai'),
})
const bgzipFasta = new BgzipIndexedFasta({
  fasta: new RemoteFile('https://example.com/test.fa.gz'),
  fai: new RemoteFile('https://example.com/test.fa.gz.fai'),
  gzi: new RemoteFile('https://example.com/test.fa.gz.gzi'),
})
```

In Node.js you can also access remote files with generic-filehandle2. Node 18+
has native `fetch`; for older versions supply one via e.g. `cross-fetch`:

```typescript
import { IndexedFasta } from '@gmod/indexedfasta'
import { RemoteFile } from 'generic-filehandle2'
import fetch from 'cross-fetch' // only needed for Node < 18

const fasta = new IndexedFasta({
  fasta: new RemoteFile('https://example.com/test.fa', { fetch }),
  fai: new RemoteFile('https://example.com/test.fa.fai', { fetch }),
})
```

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## Publishing

Releases are published to npm using [npm trusted publishing](https://docs.npmjs.com/generating-provenance-statements) via GitHub Actions, so no npm token is stored in the repository secrets.

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)
