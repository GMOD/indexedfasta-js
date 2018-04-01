/**
 * provides a nice modern streaming API over the old-style parse.js
 */
import Parser from './parse'

const { Transform, PassThrough } = require('stream')
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

  _nextText (buffer) {
    var pieces = ((this.textBuffer != null ? this.textBuffer : '') + buffer).split(/\r?\n/)
    this.textBuffer = pieces.pop()

    if (this.maxLineLength && textBuffer.length > this.maxLineLength)
      return this.emit('error', new Error('maximum line size exceeded'))

    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i]
      this._addLine(piece)
    }
  }

  _transform(chunk, encoding, callback) {
    this._nextText(this.decoder.write(chunk))
    callback()
  }

  _flush(callback) {
    if(this.decoder.end)
      this._nextText(this.decoder.end())
    if(this.textBuffer != null)
      this._addLine(this.textBuffer)
    this.parser.finish()
    if (process) process.nextTick(callback)
    else callback()
  }
}

/**
 * Parse a stream of text data into a stream of feature,
 * directive, and comment objects.
 * @param {ReadableStream} input
 */
export function parseStream(options = {}) {
  return new GFFTransform(options)
}

export function fog() {}
