/**
 * provides a nice modern streaming API over the old-style parse.js
 */
import Parser from './parse'

const fs = require('fs')
const { Transform } = require('stream')
const Decoder = require('string_decoder').StringDecoder

export class GFFTransform extends Transform {
  constructor(inputOptions = {}) {
    const options = Object.assign(
      {
        parseFeatures: true,
        parseDirectives: false,
        parseComments: false,
      },
      inputOptions,
    )

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
 * @param {object} options options
 * @param {string} options.encoding text encoding of the input GFF3. default 'utf8'
 * @param {bool} options.parseFeatures default true
 * @param {bool} options.parseDirectives default false
 * @param {bool} options.parseComments default false
 */
export function parseStream(options = {}) {
  return new GFFTransform(options)
}

export function parseFile(filename, options) {
  return fs.createReadStream(filename).pipe(parseStream(options))
}

/**
 * Synchronously parse a string containing GFF3 and return
 * an arrayref of the parsed items.
 *
 * @param {string} str
 * @param {boolean} inputOptions.parseFeatures default true
 * @param {boolean} inputOptions.parseDirectives default false
 * @param {boolean} inputOptions.parseComments default false
 */
export function parseStringSync(str, inputOptions = {}) {
  const options = Object.assign(
    {
      parseFeatures: true,
      parseDirectives: false,
      parseComments: false,
    },
    inputOptions,
  )

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
