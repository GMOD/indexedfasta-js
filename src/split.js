/**
 * provides a nice modern streaming API over the old-style parse.js
 */
import Parser from './parse'

const through = require('through')
const Decoder = require('string_decoder').StringDecoder

/**
 * Parse a stream of text data into a stream of feature,
 * directive, and comment objects.
 * @param {ReadableStream} input
 */
export function split() {
  let options = {}
  let matcher = /\r?\n/
  const decoder = new Decoder()
  let textBuffer = ''
  let maxLength = options && options.maxLength;

  function addLine(stream, piece) {
    const line = piece.toString('utf8')
    stream.queue(line)
  }

  function next (stream, buffer) {
    var pieces = ((textBuffer != null ? textBuffer : '') + buffer).split(matcher)
    textBuffer = pieces.pop()

    if (maxLength && textBuffer.length > maxLength)
      return stream.emit('error', new Error('maximum line size exceeded'))

    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i]
      addLine(stream, piece)
    }
  }

  return through(
    function (chunk,encoding) {
      next(this, decoder.write(chunk))
    },
    function () {
      if(decoder.end)
        next(this, decoder.end())
      if(textBuffer != null)
        addLine(this, textBuffer)
      this.queue(null)
    }
  )
}
