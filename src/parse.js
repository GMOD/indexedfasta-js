import * as GFF3 from './util'

const containerAttributes = {
  Parent: 'child_features',
  Derives_from: 'derived_features',
}

export default class Parser {
  /**
   * @param {Object} args
   * @param {Function} args.featureCallback
   * @param {Function} args.endCallback
   * @param {Function} args.commentCallback
   * @param {Function} args.errorCallback
   * @param {Function} args.directiveCallback
   */
  constructor(args) {
    const nullFunc = () => {}

    Object.assign(this, {
      featureCallback: args.featureCallback || nullFunc,
      endCallback: args.endCallback || nullFunc,
      commentCallback: args.commentCallback || nullFunc,
      errorCallback: args.errorCallback || nullFunc,
      directiveCallback: args.directiveCallback || nullFunc,

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
    })
  }

  addLine(line) {
    if (this.eof) {
      return
    }

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
      // implicit beginning of a FASTA section.  just stop
      // parsing, since we don't currently handle sequences
      this._emitAllUnderConstructionFeatures()
      this.eof = true
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
    this.endCallback()
  }

  /**
   * return all under-construction features, called when we know
   * there will be no additional data to attach to them
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
        existing.push(featureLine)
        feature = existing
      } else {
        // haven't seen it yet
        feature = [featureLine]
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
    if (!references) return

    Object.keys(references).forEach(attrname => {
      const pname = containerAttributes[attrname] || attrname.toLowerCase()
      feature.forEach(loc => {
        loc[pname].push(references[attrname])
        delete references[attrname]
      })
    })
  }

  _resolveReferencesFrom(feature, references, ids) {
    // go through our references
    //    if we have the feature under construction, put this feature in the right place
    //    otherwise, put this feature in the right slot in the orphans
    let pname
    Object.keys(references).forEach(attrname => {
      references[attrname].forEach(toId => {
        const otherFeature = this._underConstructionById[toId]
        if (otherFeature) {
          if (!pname)
            pname = containerAttributes[attrname] || attrname.toLowerCase()

          if (
            !ids.some(
              i => this._completedReferences[`${i},${attrname},${toId}`]++
            )
          ) {
            otherFeature.forEach(loc => {
              loc[pname].push(feature)
            })
          }
        } else {
          const t = this._underConstructionOrphans[toId] || {}
          t[attrname] = (t[attrname] || []).push(feature)
        }
      })
    })
  }
}
