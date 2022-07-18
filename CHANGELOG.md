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

- Rename getSequenceList to getSequenceNames to get a list of refNames in the fasta file

<a name="1.1.0"></a>

# [1.1.0](https://github.com/GMOD/indexedfasta-js/compare/v1.0.12...v1.1.0) (2021-01-25)

- Restore default corejs behavior in babel
- Don't depend on webpack to determine if running in browser or node

## [1.0.13](https://github.com/GMOD/indexedfasta-js/compare/v1.0.12...v1.0.13) (2019-07-02)

- Fix usage of getSequenceSize on a refSeqName that does not exist (returns undefined)

## [1.0.12](https://github.com/GMOD/indexedfasta-js/compare/v1.0.11...v1.0.12) (2019-04-04)

- Upgrade to babel 7

## [1.0.11](https://github.com/GMOD/indexedfasta-js/compare/v1.0.10...v1.0.11) (2018-12-06)

- More verbose error messages

## [1.0.10](https://github.com/GMOD/indexedfasta-js/compare/v1.0.9...v1.0.10) (2018-11-23)

- Fix ie11 by using different libraries that don't use Object.defineProperty('length',...)

## [1.0.9](https://github.com/GMOD/indexedfasta-js/compare/v1.0.8...v1.0.9) (2018-11-23)

- Update bgzf filehandle

## [1.0.8](https://github.com/GMOD/indexedfasta-js/compare/v1.0.7...v1.0.8) (2018-11-20)

- Change from lru-cache to quick-lru

## [1.0.7](https://github.com/GMOD/indexedfasta-js/compare/v1.0.6...v1.0.7) (2018-09-04)

- Update bgzf filehandle

## [1.0.6](https://github.com/GMOD/indexedfasta-js/compare/v1.0.5...v1.0.6) (2018-09-04)

- Update pako library supporting bgzipped FASTA
