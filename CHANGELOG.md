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

- Revert "chore: converge package.json" — the CHANGELOG prettier step ([69aa09f](https://github.com/GMOD/indexedfasta-js/commit/69aa09f77a742878d97ce65ca1cd3fd4649d016d))

## [5.0.9](https://github.com/GMOD/indexedfasta-js/compare/v5.0.8...v5.0.9) (2026-07-25)

- Allow the `unrs-resolver`/`esbuild` build scripts under pnpm 11's stricter
  build-script gating (`ERR_PNPM_IGNORED_BUILDS` otherwise)

## [5.0.8](https://github.com/GMOD/indexedfasta-js/compare/v5.0.7...v5.0.8) (2026-07-25)

- Declare `sideEffects: false` in package.json for better tree-shaking

## [5.0.7](https://github.com/GMOD/indexedfasta-js/compare/v5.0.6...v5.0.7) (2026-05-18)

- Rename the merged workflow back to `publish.yml`, since npm trusted
  publishing pins to the exact workflow file path via the OIDC
  `job_workflow_ref` claim and the previous merge had deleted it

## [5.0.6](https://github.com/GMOD/indexedfasta-js/compare/v5.0.5...v5.0.6) (2026-05-18)

- `BgzipIndexedFasta` now throws a clear error when constructed without both
  `{fasta, gzi}` or `{path, gziPath}`, instead of silently reading the file as
  an uncompressed FASTA
- Throw a clear error for malformed FAI lines (wrong number of tab-separated
  columns)
- Export `fetchFromIndex`, `SeqReader`, `SeqRecord`, and `BaseOpts` from
  `indexedFasta.ts`

## [5.0.5](https://github.com/GMOD/indexedfasta-js/compare/v5.0.4...v5.0.5) (2026-04-27)

- Enable `noUncheckedIndexedAccess` in tsconfig and add the non-null
  assertions it required
- Replace `eslint-plugin-import` with `eslint-plugin-import-x`
- Remove unused dependencies
- Standardize `package.json`/tsconfig/build scripts to match the other GMOD
  packages (simplified `exports`, added a `main` field for backwards
  compatibility, `es2022` target)
- Clean up the README (descriptive variable names, fixed grammar, added a
  publishing note)

## [5.0.4](https://github.com/GMOD/indexedfasta-js/compare/v5.0.3...v5.0.4) (2026-03-31)

- Fix the publish workflow for npm trusted publishing by removing the token
  override and provenance flag
- Rename branch badges

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

- Bump `@gmod/bgzf-filehandle` to v5
- Import test modules via explicit `../src/index.ts` paths, enforced by a new
  `import/extensions` eslint rule
- Bump vitest to v4 and other devDependencies
- Switch eslint config to use `defineConfig`

## [4.0.6](https://github.com/GMOD/indexedfasta-js/compare/v4.0.5...v4.0.6) (2025-05-28)

- Add a `postbuild:es5` step that writes `dist/package.json` with `{"type":
  "commonjs"}`, so the CJS build isn't misparsed as ESM

## [4.0.5](https://github.com/GMOD/indexedfasta-js/compare/v4.0.4...v4.0.5) (2025-05-28)

- Update the README to reference `generic-filehandle2` instead of the
  deprecated `generic-filehandle`

## [4.0.4](https://github.com/GMOD/indexedfasta-js/compare/v4.0.3...v4.0.4) (2025-05-28)

- Fix a TypeScript build error in `readFAI`'s options parameter

## [4.0.3](https://github.com/GMOD/indexedfasta-js/compare/v4.0.2...v4.0.3) (2025-05-26)

- Update to `@gmod/bgzf-filehandle` v4's `filehandle`/`gziFilehandle`
  constructor options, replacing the old `path`/`gziPath` shape

## [4.0.2](https://github.com/GMOD/indexedfasta-js/compare/v4.0.1...v4.0.2) (2025-04-30)

- Fix generated exports to use explicit `.ts` extensions, matching the rest
  of the codebase

## [4.0.1](https://github.com/GMOD/indexedfasta-js/compare/v3.0.1...v4.0.1) (2025-04-30)

- Add a pure-ESM build: set `"type": "module"` with separate `import`/
  `require` export conditions, replacing the old `main`/`module` fields
- Bump `@gmod/bgzf-filehandle` to v3 and `generic-filehandle2` to v2
- Drop the separate `@typescript-eslint/eslint-plugin`/
  `@typescript-eslint/parser` in favor of the unified `typescript-eslint`
  package
- Bump vitest to v3 and other devDependencies

# [4.0.0](https://github.com/GMOD/indexedfasta-js/compare/v3.0.1...v4.0.0) (2025-04-30)

No corresponding commits exist in git history for this tag — it was likely
superseded immediately by v4.0.1, which covers the same commit range.

## [3.0.1](https://github.com/GMOD/indexedfasta-js/compare/v3.0.0...v3.0.1) (2024-12-12)

# [3.0.0](https://github.com/GMOD/indexedfasta-js/compare/v2.1.1...v3.0.0) (2024-12-12)

- Migrate from `generic-filehandle` to `generic-filehandle2`, bump
  `@gmod/bgzf-filehandle` to v2, and decode FASTA text with `TextDecoder`
  instead of `Buffer#toString`
- Remove `getResiduesById`; the FAI index is now stored as a single
  name-keyed map instead of separate `id`/`name` maps, and `readFAI` throws
  when the file looks like a FASTA rather than a `.fai`
- Fix a regression that made `max`/end required again in
  `_fetchFromIndexEntry`, restoring the ability to fetch to the end of a
  sequence
- Convert the test suite from jest to vitest, and bump the build target from
  es2018/es2015 to es2020

## [2.1.1](https://github.com/GMOD/indexedfasta-js/compare/v2.1.0...v2.1.1) (2024-06-21)

- Import `buffer` explicitly and clean up the ESLint config
- Suppress a TS error against a known `@gmod/bgzf-filehandle` type mismatch
  (tracked upstream as bgzf-filehandle#62)
- Bump deps

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
