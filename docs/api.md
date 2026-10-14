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

`path` and `faiPath` name local files, which the constructor wraps in
`LocalFile`. A `fasta` or `fai` handle takes precedence over the matching path.
The constructor throws when it has neither a handle nor a path for one of the
two files.

| Method                        | Returns                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `getSequence(name, min, max)` | bases as a string, or `undefined` if `name` is not in the index |
| `getResiduesByName(...)`      | the same; `getSequence` is an alias of it                       |
| `getSequenceNames()`          | `string[]` in index order                                       |
| `getSequenceSizes()`          | `Record<string, number>`                                        |
| `getSequenceSize(name)`       | `number`, or `undefined`                                        |
| `hasReferenceSequence(name)`  | `boolean`                                                       |

`max` clamps to the sequence length, so requesting past the end returns the rest
of the sequence rather than throwing. An empty range returns `''`, and a
negative `min` throws.

### The shared index parse

Each object reads and parses its `.fai` once, and every method goes through that
one parse, so callers share the same read. The parse runs under a separate
`AbortSignal` and aborts only after every waiting caller has aborted, so one
caller's abort leaves the other callers' reads running. The object caches no
failed parse, so a transient error does not make every later read on the object
fail.

### Errors

`IndexedFasta` throws while parsing the index or decoding sequence when it
finds:

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

`BgzipIndexedFasta` extends `IndexedFasta` with the same methods and reads the
FASTA through a `BgzfFilehandle`. It needs the `.gzi`, so pass `{fasta, gzi}` or
`{path, gziPath}`. The constructor throws when it has neither pair, as with
`{fasta, gziPath}`.

`path` and `gziPath` name local files. The `.fai` path defaults to
`${path}.fai`, as in `IndexedFasta`.

## `FetchableSmallFasta`

`FetchableSmallFasta` reads a small unindexed FASTA file and parses it whole
into memory.

```typescript
import { FetchableSmallFasta } from '@gmod/indexedfasta'

const fasta = new FetchableSmallFasta({ path: 'small.fa' }) // or { fasta }
await fasta.getSequenceNames()
await fasta.fetch('NC_001422.1', 0, 10)
```

`fetch` throws if the id is absent, unlike `getSequence` above. The package also
exports `parseSmallFasta(text)`, which returns
`{ id, description, sequence }[]`.

The constructor takes a local `path` or a `fasta` filehandle with `readFile`,
and starts reading the file at once. `data` holds the parsed entries as a
`Promise`, in file order.

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| `id`          | the definition line after `>`, up to the first space |
| `description` | the rest of the definition line                      |
| `sequence`    | the sequence lines joined, whitespace removed        |
