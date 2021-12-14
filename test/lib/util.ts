//@ts-nocheck
import path from 'path'
import fs from 'fs'
import { fromUrl } from './io'

const dataDir = path && path.dirname(require.resolve('../data/phi-X174.fa'))

function testDataUrl(filename) {
  return typeof window === 'undefined'
    ? `file://${dataDir}/${filename}`.replace('#', '%23')
    : `http://localhost:9876/base/test/data/${filename.replace('#', '%23')}`
}

function testDataFile(filename) {
  const source = testDataUrl(filename)
  return fromUrl(source)
}

async function loadTestJSON(filename) {
  const data = await testDataFile(`${filename}`).readFile()
  const text = data.toString()
  return JSON.parse(text)
}

function JsonClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const REWRITE_EXPECTED_DATA =
  typeof process !== 'undefined' &&
  process.env.FASTAJS_REWRITE_EXPECTED_DATA &&
  process.env.FASTAJS_REWRITE_EXPECTED_DATA !== '0' &&
  process.env.FASTAJS_REWRITE_EXPECTED_DATA !== 'false'

module.exports = {
  testDataUrl,
  testDataFile,
  loadTestJSON,
  JsonClone,
  REWRITE_EXPECTED_DATA,
  fs,
}
