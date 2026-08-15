# API

All coordinates are UCSC standard 0-based half-open.

Every method takes an optional trailing `opts: { signal?: AbortSignal }`.

## `IndexedFasta`

```typescript
new IndexedFasta({ path, faiPath })
new IndexedFasta({ fasta, fai })
```

Pass either local paths or
[generic-filehandle2](https://github.com/GMOD/generic-filehandle2) filehandles.
`faiPath` defaults to `${path}.fai`. The `fasta` handle only needs a positional
`read(length, position, opts)`; `fai` needs `readFile`.

| Method                        | Returns                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `getSequence(name, min, max)` | bases as a string, or `undefined` if `name` is not in the index |
| `getResiduesByName(...)`      | same thing — `getSequence` is an alias                          |
| `getSequenceNames()`          | `string[]` in index order                                       |
| `getSequenceSizes()`          | `Record<string, number>`                                        |
| `getSequenceSize(name)`       | `number`, or `undefined`                                        |
| `hasReferenceSequence(name)`  | `boolean`                                                       |

`max` clamps to the sequence length, so requesting past the end returns the rest
of the sequence rather than throwing. An empty range returns `''`. A negative
`min` throws.

### The shared index parse

Each object reads and parses its `.fai` once, and every method goes through that
one parse, so it is the read callers share. It runs under a signal of its own
and aborts only once every waiting caller has given up — one caller's abort
never surfaces as another's failure. A failed parse leaves no cache entry, so a
transient error doesn't poison the file for the life of the object.

### Errors

These come out of parsing the index or decoding sequence:

- a sequence name starting with `>` — you probably passed the FASTA where the
  `.fai` belongs
- a line with fewer than 5 tab-separated columns
- `LINEBASES` of 0 on a non-empty sequence — usually a FASTA missing its
  trailing newline; regenerate the index
- non-ASCII bytes in the sequence — the file is probably gzipped, so use
  `BgzipIndexedFasta` or decompress it

## `BgzipIndexedFasta`

```typescript
new BgzipIndexedFasta({ path, faiPath, gziPath })
new BgzipIndexedFasta({ fasta, fai, gzi })
```

Extends `IndexedFasta` with the same methods, reading through a
`BgzfFilehandle`. It needs the `.gzi` — pass `{fasta, gzi}` or
`{path, gziPath}`; mixing the two forms throws.

## `FetchableSmallFasta`

For small unindexed FASTA files, which it reads and parses whole into memory.

```typescript
import { FetchableSmallFasta } from '@gmod/indexedfasta'

const fasta = new FetchableSmallFasta({ path: 'small.fa' }) // or { fasta }
await fasta.getSequenceNames()
await fasta.fetch('NC_001422.1', 0, 10)
```

`fetch` throws if the id is absent, unlike `getSequence` above. The package also
exports `parseSmallFasta(text)`, which returns
`{ id, description, sequence }[]`.
