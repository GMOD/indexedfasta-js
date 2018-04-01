import Parser from './parse'
import { formatItem } from './util'

const fs = require('fs')
const { Transform } = require('stream')
const Decoder = require('string_decoder').StringDecoder

// shared arg processing for the parse routines
function _processParseOptions(options) {
  const out = Object.assign(
    {
      parseFeatures: true,
      parseDirectives: false,
      parseComments: false,
    },
    options,
  )

  if (options.parseAll) {
    out.parseFeatures = true
    out.parseDirectives = true
    out.parseComments = true
  }

  return out
}

class GFFTransform extends Transform {
  constructor(inputOptions = {}) {
    const options = _processParseOptions(inputOptions)

    super({ objectMode: true })

    this.encoding = inputOptions.encoding || 'utf8'

    this.decoder = new Decoder()
    this.textBuffer = ''

    const push = this.push.bind(this)
    this.parser = new Parser({
      featureCallback: options.parseFeatures ? push : null,
      directiveCallback: options.parseDirectives ? push : null,
      commentCallback: options.parseComments ? push : null,
      errorCallback: err => this.emit('error', err),
    })
  }

  _addLine(data) {
    const line = data.toString('utf8')
    if (line) {
      this.parser.addLine(line)
    }
  }

  _nextText(buffer) {
    const pieces = (this.textBuffer + buffer).split(/\r?\n/)
    this.textBuffer = pieces.pop()

    if (this.maxLineLength && this.textBuffer.length > this.maxLineLength) {
      this.emit('error', new Error('maximum line size exceeded'))
      return
    }

    pieces.forEach(piece => this._addLine(piece))
  }

  _transform(chunk, encoding, callback) {
    this._nextText(this.decoder.write(chunk))
    callback()
  }

  _flush(callback) {
    if (this.decoder.end) this._nextText(this.decoder.end())
    if (this.textBuffer != null) this._addLine(this.textBuffer)
    this.parser.finish()
    if (process) process.nextTick(callback)
    else callback()
  }
}

/**
 * Parse a stream of text data into a stream of feature,
 * directive, and comment objects.
 *
 * @param {Object} options optional options object
 * @param {string} options.encoding text encoding of the input GFF3. default 'utf8'
 * @param {boolean} options.parseAll default false.  if true, will parse all items. overrides other flags
 * @param {boolean} options.parseFeatures default true
 * @param {boolean} options.parseDirectives default false
 * @param {boolean} options.parseComments default false
 * @returns {ReadableStream} stream (in objectMode) of parsed items
 */
export function parseStream(options = {}) {
  return new GFFTransform(options)
}

/**
 * Read and parse a GFF3 file from the filesystem.
 *
 * @param {string} filename the filename of the file to parse
 * @param {Object} options optional options object
 * @param {string} options.encoding the file's string encoding, defaults to 'utf8'
 * @param {boolean} options.parseAll default false.  if true, will parse all items. overrides other flags
 * @param {boolean} options.parseFeatures default true
 * @param {boolean} options.parseDirectives default false
 * @param {boolean} options.parseComments default false
 * @returns {ReadableStream} stream (in objectMode) of parsed items
 */
export function parseFile(filename, options) {
  return fs.createReadStream(filename).pipe(parseStream(options))
}

/**
 * Synchronously parse a string containing GFF3 and return
 * an arrayref of the parsed items.
 *
 * @param {string} str
 * @param {Object} inputOptions optional options object
 * @param {boolean} inputOptions.parseAll default false.  if true, will parse all items. overrides other flags
 * @param {boolean} inputOptions.parseFeatures default true
 * @param {boolean} inputOptions.parseDirectives default false
 * @param {boolean} inputOptions.parseComments default false
 * @returns {Array} array of parsed features, directives, and/or comments
 */
export function parseStringSync(str, inputOptions = {}) {
  const options = _processParseOptions(inputOptions)

  const items = []
  const push = items.push.bind(items)

  const parser = new Parser({
    featureCallback: options.parseFeatures ? push : null,
    directiveCallback: options.parseDirectives ? push : null,
    commentCallback: options.parseComments ? push : null,
    errorCallback: err => {
      throw err
    },
  })

  str.split(/\r?\n/).forEach(parser.addLine.bind(parser))
  parser.finish()

  return items
}

/**
 * Format an array of GFF3 items (features,directives,comments) into string of GFF3.
 * Does not insert synchronization (###) marks.
 *
 * @param {Array[Object]} items
 * @returns {String} the formatted GFF3
 */
export function formatSync(items) {
  return items.map(formatItem).join('')
}

class FormattingTransform extends Transform {
  constructor(options = {}) {
    super(Object.assign(options, { objectMode: true }))
    this.linesSinceLastSyncMark = 0
    this.minLinesBetweenSyncMarks = options.maxSyncFrequency || 100
  }

  _transform(chunk, encoding, callback) {
    let str
    if (Array.isArray(chunk)) str = chunk.map(formatItem).join('')
    else str = formatItem(chunk)
    this.push(str)
    if (this.linesSinceLastSyncMark >= this.minLinesBetweenSyncMarks) {
      this.push('###\n')
      this.linesSinceLastSyncMark = 0
    } else {
      // count the number of newlines in this chunk
      let count = 0
      for (let i = 0; i < str.length; i += 1) {
        if (str[i] === '\n') count += 1
      }
      this.linesSinceLastSyncMark += count
    }
    callback()
  }
}

/**
 * Format a stream of items (of the type produced
 * by this script) into a stream of GFF3 text.
 *
 * Inserts synchronization (###) marks automatically.
 *
 * @param {Object} options
 * @param {boolean} options.parseAll default false.  if true, will parse all items. overrides other flags
 * @param {boolean} options.parseFeatures default true
 * @param {boolean} options.parseComments default false
 * @param {boolean} options.parseDirectives default false
 */
export function formatStream(options) {
  return new FormattingTransform(options)
}
