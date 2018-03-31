/**
 * provides a nice modern streaming API over the old-style parse.js
 */
import Parser from './parse'

const split = require('split')
const { Transform, PassThrough } = require('stream')

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

    const push = this.push.bind(this)
    this.parser = new Parser({
      featureCallback: options.parseFeatures ? push : null,
      directiveCallback: options.parseDirectives ? push : null,
      commentCallback: options.parseComments ? push : null,
      errorCallback: err => this.emit('error', err),
    })
  }

  _flush(callback) {
    this.parser.finish()
    if (process) process.nextTick(callback)
    else callback()
  }

  _transform(chunk, encoding, callback) {
    const line = chunk.toString(this.encoding)
    this.parser.addLine(line)
    callback()
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
