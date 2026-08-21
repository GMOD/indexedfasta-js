[![NPM version](https://img.shields.io/npm/v/@gmod/indexedfasta.svg?style=flat-square)](https://npmjs.org/package/@gmod/indexedfasta)
![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/indexedfasta-js/publish.yml?branch=main)

Read FASTA files indexed with `samtools faidx`, plain or bgzipped.

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

// coordinates are UCSC standard 0-based half-open
// returns a string of bases, or undefined if the sequence is not in the index
const bases = await fasta.getSequence('chr1', 0, 10)

const seqNames = await fasta.getSequenceNames() // ['chr1', ...]
const sizes = await fasta.getSequenceSizes() // { chr1: 100100, ... }
const chr1Size = await fasta.getSequenceSize('chr1')
```

To read remote files in the browser or in Node, pass filehandles instead of
paths:

```typescript
import { RemoteFile } from 'generic-filehandle2'

const fasta = new IndexedFasta({
  fasta: new RemoteFile('https://example.com/test.fa'),
  fai: new RemoteFile('https://example.com/test.fa.fai'),
})
```

When the files are remote,
[`@gmod/range-cache-filehandle`](https://github.com/GMOD/range-cache-filehandle)
can be used in place of `RemoteFile`. It caches the byte ranges it reads in 256
KiB chunks, so returning to a region you have already fetched costs no request
at all, and neighboring regions are fetched together.

See [docs/api.md](docs/api.md) for the full API, including abort signals and
`FetchableSmallFasta` for small unindexed files.

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and release steps.

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)
