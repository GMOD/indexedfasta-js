import * as GFF3 from './util'

const containerAttributes = {
  Parent: 'child_features',
  Derives_from: 'derived_features',
}

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
      this.currentSequence.sequence += line.trim()
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

      // features that we have to keep on hand for now because they
      // might be referenced by something else
      _underConstructionTopLevel: [],
      // index of the above by ID
      _underConstructionById: {},

      _completedReferences: {},

      // features that reference something we have not seen yet
      // structured as:
      // {  'some_id' : {
      //     'Parent' : [ orphans that have a Parent attr referencing it ],
      //     'Derives_from' : [ orphans that have a Derives_from attr referencing it ],
      //    }
      // }
      _underConstructionOrphans: {},

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
    }

    // otherwise, if we are done, ignore this line
    if (this.eof) {
      return
    }

    this.lineNumber += 1

    if (/^\s*[^#\s>]/.test(line)) {
      // feature line, most common case
      this._bufferLine(line)
      return
    }

    const match = /^\s*(#+)(.*)/.exec(line)
    if (match) {
      // directive or comment
      let [, hashsigns, contents] = match

      if (hashsigns.length === 3) {
        // sync directive, all forward-references are resolved.
        this._emitAllUnderConstructionFeatures()
      } else if (hashsigns.length === 2) {
        const directive = GFF3.parseDirective(line)
        if (directive.directive === 'FASTA') {
          this._emitAllUnderConstructionFeatures()
          this.eof = true
          this.fastaParser = new FASTAParser(this.sequenceCallback)
        } else {
          this._emitItem(directive)
        }
      } else {
        contents = contents.replace(/\s*/, '')
        this._emitItem({ comment: contents })
      }
    } else if (/^\s*$/.test(line)) {
      // blank line, do nothing
    } else if (/^\s*>/.test(line)) {
      // implicit beginning of a FASTA section
      this._emitAllUnderConstructionFeatures()
      this.eof = true
      this.fastaParser = new FASTAParser(this.sequenceCallback)
      this.fastaParser.addLine(line)
    } else {
      // it's a parse error
      const errLine = line.replace(/\r?\n?$/g, '')
      throw new Error(`GFF3 parse error.  Cannot parse '${errLine}'.`)
    }
  }

  _emitItem(i) {
    if (i[0]) this.featureCallback(i)
    else if (i.directive) this.directiveCallback(i)
    else if (i.comment) this.commentCallback(i)
  }

  finish() {
    this._emitAllUnderConstructionFeatures()
    if (this.fastaParser) this.fastaParser.finish()
    this.endCallback()
  }

  _enforceBufferSizeLimit(additionalItemCount = 0) {
    const _unbufferItem = item => {
      if (
        item &&
        item[0] &&
        item[0].attributes &&
        item[0].attributes.ID &&
        item[0].attributes.ID[0]
      ) {
        const ids = item[0].attributes.ID
        ids.forEach(id => {
          delete this._underConstructionById[id]
          delete this._completedReferences[id]
        })
        item.forEach(i => {
          if (i.child_features) i.child_features.forEach(c => _unbufferItem(c))
          if (i.derived_features)
            i.derived_features.forEach(d => _unbufferItem(d))
        })
      }
    }

    while (
      this._underConstructionTopLevel.length + additionalItemCount >
      this.bufferSize
    ) {
      const item = this._underConstructionTopLevel.shift()
      this._emitItem(item)
      _unbufferItem(item)
    }
  }

  /**
   * return all under-construction features, called when we know
   * there will be no additional data to attach to them
   * @private
   */
  _emitAllUnderConstructionFeatures() {
    this._underConstructionTopLevel.forEach(this._emitItem.bind(this))

    this._underConstructionTopLevel = []
    this._underConstructionById = {}
    this._completedReferences = {}

    // if we have any orphans hanging around still, this is a
    // problem. die with a parse error
    if (
      Object.values(this._underConstructionOrphans).filter(
        entry => Object.keys(entry).length,
      ).length
    ) {
      throw new Error(
        `some features reference other features that do not exist in the file (or in the same '###' scope). ${JSON.stringify(
          this._underConstructionOrphans,
        )}`,
      )
    }
  }

  // do the right thing with a newly-parsed feature line
  _bufferLine(line) {
    const featureLine = GFF3.parseFeature(line)
    featureLine.child_features = []
    featureLine.derived_features = []
    // featureLine._lineNumber = this.lineNumber //< debugging aid

    // NOTE: a feature is an arrayref of one or more feature lines.
    const ids = featureLine.attributes.ID || []
    const parents = featureLine.attributes.Parent || []
    const derives = featureLine.attributes.Derives_from || []

    if (!ids.length && !parents.length && !derives.length) {
      // if it has no IDs and does not refer to anything, we can just
      // output it
      this._emitItem([featureLine])
      return
    }

    let feature
    ids.forEach(id => {
      const existing = this._underConstructionById[id]
      if (existing) {
        // another location of the same feature
        if (existing[existing.length - 1].type !== featureLine.type) {
          this._parseError(
            `multi-line feature "${id}" has inconsistent types: "${
              featureLine.type
            }", "${existing[existing.length - 1].type}"`,
          )
        }
        existing.push(featureLine)
        feature = existing
      } else {
        // haven't seen it yet, so buffer it so we can attach
        // child features to it
        feature = [featureLine]

        this._enforceBufferSizeLimit(1)
        if (!parents.length && !derives.length) {
          this._underConstructionTopLevel.push(feature)
        }
        this._underConstructionById[id] = feature

        // see if we have anything buffered that refers to it
        this._resolveReferencesTo(feature, id)
      }
    })

    // try to resolve all its references
    this._resolveReferencesFrom(
      feature || [featureLine],
      { Parent: parents, Derives_from: derives },
      ids,
    )
  }

  _resolveReferencesTo(feature, id) {
    const references = this._underConstructionOrphans[id]
    //   references is of the form
    //   {
    //     'Parent' : [ orphans that have a Parent attr referencing this feature ],
    //     'Derives_from' : [ orphans that have a Derives_from attr referencing this feature ],
    //    }
    if (!references) return

    Object.keys(references).forEach(attrname => {
      const pname = containerAttributes[attrname] || attrname.toLowerCase()
      feature.forEach(loc => {
        loc[pname].push(...references[attrname])
        delete references[attrname]
      })
    })
  }

  _parseError(message) {
    this.eof = true
    this.errorCallback(`${this.lineNumber}: ${message}`)
  }

  _resolveReferencesFrom(feature, references, ids) {
    // this is all a bit more awkward in javascript than it was in perl
    function postSet(obj, slot1, slot2) {
      let subObj = obj[slot1]
      if (!subObj) {
        subObj = {}
        obj[slot1] = subObj
      }
      const returnVal = subObj[slot2] || false
      subObj[slot2] = true
      return returnVal
    }

    Object.entries(references).forEach(([attrname, toIds]) => {
      let pname
      toIds.forEach(toId => {
        const otherFeature = this._underConstructionById[toId]
        if (otherFeature) {
          if (!pname)
            pname = containerAttributes[attrname] || attrname.toLowerCase()

          if (
            !ids.filter(id =>
              postSet(this._completedReferences, id, `${attrname},${toId}`),
            ).length
          ) {
            otherFeature.forEach(location => {
              location[pname].push(feature)
            })
          }
        } else {
          if (!this._underConstructionOrphans[toId])
            this._underConstructionOrphans[toId] = {}
          if (!this._underConstructionOrphans[toId][attrname])
            this._underConstructionOrphans[toId][attrname] = []
          this._underConstructionOrphans[toId][attrname].push(feature)
        }
      })
    })
  }
}
