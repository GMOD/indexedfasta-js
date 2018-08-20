class FASTAParser {
  constructor(seqCallback) {
    this.seqCallback = seqCallback
    this.currentSequence = undefined
  }

  addLine(line) {
    const defMatch = /^>\s*(\S+)\s*(.*)/.exec(line)
    if (defMatch) {
      this._flush()
      this.currentSequence = { id: defMatch[1], sequence: '' }
      if (defMatch[2]) this.currentSequence.description = defMatch[2].trim()
    } else if (this.currentSequence && /\S/.test(line)) {
      this.currentSequence.sequence += line.replace(/\s/g, '')
    }
  }

  _flush() {
    if (this.currentSequence) this.seqCallback(this.currentSequence)
  }

  finish() {
    this._flush()
  }
}

export default class Parser {
  constructor(args) {
    const nullFunc = () => {}

    Object.assign(this, {
      featureCallback: args.featureCallback || nullFunc,
      endCallback: args.endCallback || nullFunc,
      commentCallback: args.commentCallback || nullFunc,
      errorCallback: args.errorCallback || nullFunc,
      directiveCallback: args.directiveCallback || nullFunc,
      sequenceCallback: args.sequenceCallback || nullFunc,

      // number of lines to buffer
      bufferSize: args.bufferSize === undefined ? 1000 : args.bufferSize,

      // if this is true, the parser ignores the
      // rest of the lines in the file.  currently
      // set when the file switches over to FASTA
      eof: false,

      lineNumber: 0,
    })
  }

  addLine(line) {
    // if we have transitioned to a fasta section, just delegate to that parser
    if (this.fastaParser) {
      this.fastaParser.addLine(line)
      return
    } else if (this.eof) {
      // otherwise, if we are done, ignore this line
      return
    }

    this.lineNumber += 1

    if (/^\s*$/.test(line)) {
      // blank line, do nothing
    } else if (/^\s*>/.test(line)) {
      // implicit beginning of a FASTA section
      this.fastaParser = new FASTAParser(this.sequenceCallback)
      this.fastaParser.addLine(line)
    } else {
      // it's a parse error
      const errLine = line.replace(/\r?\n?$/g, '')
      throw new Error(`FASTA parse error.  Cannot parse '${errLine}'.`)
    }
  }

  finish() {
    this.fastaParser.finish()
    this.endCallback()
  }

  _parseError(message) {
    this.eof = true
    this.errorCallback(`${this.lineNumber}: ${message}`)
  }
}
