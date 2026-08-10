## [5.0.10](https://github.com/GMOD/indexedfasta-js/compare/v5.0.9...v5.0.10) (2026-08-10)

### Bug Fixes

- A bystander no longer inherits the .fai read owner's abort

### Chores

- Drop prepublishOnly and two unused devDependencies
- Add git-cliff for changelog generation
- Type-check the tests and enforce prettier, as @gmod/bam does
- Let npm publish stop auto-correcting repository.url
- Exempt our own packages from the release quarantine
- Bump pnpm/action-setup to v6.0.10
- Run the test suite as `pnpm test --run`
- Gate preversion on format:check, as CI does
- Gate preversion on typecheck too, as CI does
- Converge package.json on the shape its siblings use

### Documentation

- Backfill CHANGELOG.md for v4.0.9 through v5.0.9
- Mark breaking changes in the generated changelog

### Other Changes

- Revert "chore: converge package.json" — the CHANGELOG prettier step

Removes `prettier --write CHANGELOG.md` from the `version` script, which the
previous commit added on a premise I did not check.

The reasoning was: git-cliff writes CHANGELOG.md after `preversion` has run, so
the format:check gate structurally cannot see it, while CI checks it on the tag
commit -- a hole the gate cannot cover. The first half is true. The second is
not: **every one of the 20 repos already lists CHANGELOG.md in
.prettierignore**, so CI's format:check skips it too and there was never a hole.

The step was also a no-op, verified rather than assumed: prettier skips an
ignored file even when it is named explicitly on the command line, so a
deliberately mangled CHANGELOG.md came back unchanged.

hclust was the only repo that had this step, which is where I copied it from.
It is reverted there too. The .prettierignore comments in bgzf-filehandle,
cram-js and hclust say why nobody should add it back: reformatting a generated
changelog fights the generator on every release.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

## [5.0.9](https://github.com/GMOD/indexedfasta-js/compare/v5.0.8...v5.0.9) (2026-07-25)

## [5.0.8](https://github.com/GMOD/indexedfasta-js/compare/v5.0.7...v5.0.8) (2026-07-25)

- Declare `sideEffects: false` in package.json for better tree-shaking

## [5.0.7](https://github.com/GMOD/indexedfasta-js/compare/v5.0.6...v5.0.7) (2026-05-18)

## [5.0.6](https://github.com/GMOD/indexedfasta-js/compare/v5.0.5...v5.0.6) (2026-05-18)

- `BgzipIndexedFasta` now throws a clear error when constructed without both
  `{fasta, gzi}` or `{path, gziPath}`, instead of silently reading the file as
  an uncompressed FASTA
- Throw a clear error for malformed FAI lines (wrong number of tab-separated
  columns)
- Export `fetchFromIndex`, `SeqReader`, `SeqRecord`, and `BaseOpts` from
  `indexedFasta.ts`

## [5.0.5](https://github.com/GMOD/indexedfasta-js/compare/v5.0.4...v5.0.5) (2026-04-27)

## [5.0.4](https://github.com/GMOD/indexedfasta-js/compare/v5.0.3...v5.0.4) (2026-03-31)

## [5.0.3](https://github.com/GMOD/indexedfasta-js/compare/v5.0.2...v5.0.3) (2026-03-28)

- Fix `FetchableSmallFasta.fetch` returning the wrong slice of sequence (used
  `slice(start, length)` instead of `slice(start, end)`)
- Throw a clear error for FASTA files missing a trailing newline (FAI
  `LINEBASES` of 0)

## [5.0.2](https://github.com/GMOD/indexedfasta-js/compare/v5.0.1...v5.0.2) (2026-01-08)

- Further improve FAI parsing performance by storing index entries as
  parallel arrays instead of per-record objects

## [5.0.1](https://github.com/GMOD/indexedfasta-js/compare/v5.0.0...v5.0.1) (2026-01-08)

- Improve `getSequenceNames`/FAI parsing performance by scanning the index
  text directly instead of splitting into arrays

# [5.0.0](https://github.com/GMOD/indexedfasta-js/compare/v4.0.9...v5.0.0) (2025-12-11)

- Bump `@gmod/bgzf-filehandle` to v6

## [4.0.9](https://github.com/GMOD/indexedfasta-js/compare/v4.0.7...v4.0.9) (2025-12-10)

- Detect gzip-compressed FASTA passed to `IndexedFasta` and throw a clear
  error suggesting `BgzipIndexedFasta`, instead of returning garbled sequence
  data

## [4.0.7](https://github.com/GMOD/indexedfasta-js/compare/v4.0.6...v4.0.7) (2025-11-24)

## [4.0.6](https://github.com/GMOD/indexedfasta-js/compare/v4.0.5...v4.0.6) (2025-05-28)

## [4.0.5](https://github.com/GMOD/indexedfasta-js/compare/v4.0.4...v4.0.5) (2025-05-28)

## [4.0.4](https://github.com/GMOD/indexedfasta-js/compare/v4.0.3...v4.0.4) (2025-05-28)

## [4.0.3](https://github.com/GMOD/indexedfasta-js/compare/v4.0.2...v4.0.3) (2025-05-26)

## [4.0.2](https://github.com/GMOD/indexedfasta-js/compare/v4.0.1...v4.0.2) (2025-04-30)

## [4.0.1](https://github.com/GMOD/indexedfasta-js/compare/v3.0.1...v4.0.1) (2025-04-30)

# [4.0.0](https://github.com/GMOD/indexedfasta-js/compare/v3.0.1...v4.0.0) (2025-04-30)

## [3.0.1](https://github.com/GMOD/indexedfasta-js/compare/v3.0.0...v3.0.1) (2024-12-12)

# [3.0.0](https://github.com/GMOD/indexedfasta-js/compare/v2.1.1...v3.0.0) (2024-12-12)

## [2.1.1](https://github.com/GMOD/indexedfasta-js/compare/v2.1.0...v2.1.1) (2024-06-21)

# [2.1.0](https://github.com/GMOD/indexedfasta-js/compare/v2.0.4...v2.1.0) (2023-10-04)

- Fix docs, re-publish to NPM
- Remove chunkSizeLimit

## [2.0.4](https://github.com/GMOD/indexedfasta-js/compare/v2.0.3...v2.0.4) (2022-07-18)

- Update to generic-filehandle 3.0.0

<a name="2.0.3"></a>

## [2.0.3](https://github.com/GMOD/indexedfasta-js/compare/v2.0.2...v2.0.3) (2022-04-25)

- Fix the esm build to be ESM format instead of CJS

<a name="2.0.2"></a>

## [2.0.2](https://github.com/GMOD/indexedfasta-js/compare/v2.0.1...v2.0.2) (2021-12-14)

- Add esm module build with less babelification
- Remove localFile from browser bundle via "browser" field in package.json

<a name="2.0.1"></a>

## [2.0.1](https://github.com/GMOD/indexedfasta-js/compare/v2.0.0...v2.0.1) (2021-08-10)

- Add ability to pass abort signal and other headers via the opts parameter

<a name="2.0.0"></a>

# [2.0.0](https://github.com/GMOD/indexedfasta-js/compare/v1.1.0...v2.0.0) (2021-03-31)

- Rename getSequenceList to getSequenceNames to get a list of refNames in the
  fasta file

<a name="1.1.0"></a>

# [1.1.0](https://github.com/GMOD/indexedfasta-js/compare/v1.0.12...v1.1.0) (2021-01-25)

- Restore default corejs behavior in babel
- Don't depend on webpack to determine if running in browser or node

## [1.0.13](https://github.com/GMOD/indexedfasta-js/compare/v1.0.12...v1.0.13) (2019-07-02)

- Fix usage of getSequenceSize on a refSeqName that does not exist (returns
  undefined)

## [1.0.12](https://github.com/GMOD/indexedfasta-js/compare/v1.0.11...v1.0.12) (2019-04-04)

- Upgrade to babel 7

## [1.0.11](https://github.com/GMOD/indexedfasta-js/compare/v1.0.10...v1.0.11) (2018-12-06)

- More verbose error messages

## [1.0.10](https://github.com/GMOD/indexedfasta-js/compare/v1.0.9...v1.0.10) (2018-11-23)

- Fix ie11 by using different libraries that don't use
  Object.defineProperty('length',...)

## [1.0.9](https://github.com/GMOD/indexedfasta-js/compare/v1.0.8...v1.0.9) (2018-11-23)

- Update bgzf filehandle

## [1.0.8](https://github.com/GMOD/indexedfasta-js/compare/v1.0.7...v1.0.8) (2018-11-20)

- Change from lru-cache to quick-lru

## [1.0.7](https://github.com/GMOD/indexedfasta-js/compare/v1.0.6...v1.0.7) (2018-09-04)

- Update bgzf filehandle

## [1.0.6](https://github.com/GMOD/indexedfasta-js/compare/v1.0.5...v1.0.6) (2018-09-04)

- Update pako library supporting bgzipped FASTA
