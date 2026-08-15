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

`max` is clamped to the sequence length, so requesting past the end returns the
rest of the sequence rather than throwing. An empty range returns `''`. A
negative `min` throws.

### The shared index parse

The `.fai` is read and parsed once per object and every method goes through it,
so it is the one read shared between callers. It runs under a signal of its own
and is cancelled only once every waiting caller has given up — one caller's
abort never surfaces as another's failure. A failed parse is not cached, so a
transient error doesn't poison the file for the life of the object.

### Errors

Thrown while parsing the index or decoding sequence:

- a sequence name starting with `>` — the FASTA was likely passed where the
  `.fai` was expected
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
`BgzfFilehandle`. The `.gzi` is required — `{fasta, gzi}` or `{path, gziPath}`,
mixing the two forms throws.

## `FetchableSmallFasta`

For small unindexed FASTA files, read and parsed whole into memory.

```typescript
import { FetchableSmallFasta } from '@gmod/indexedfasta'

const fasta = new FetchableSmallFasta({ path: 'small.fa' }) // or { fasta }
await fasta.getSequenceNames()
await fasta.fetch('NC_001422.1', 0, 10)
```

`fetch` throws if the id is absent, unlike `getSequence` above. Also exported is
`parseSmallFasta(text)`, returning `{ id, description, sequence }[]`.
