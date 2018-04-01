/**
 * Fast, low-level functions for parsing and formatting GFF3.
 * JavaScript port of Robert Buels's Bio::GFF3::LowLevel Perl module.
 */

import typical from 'typical'

const fieldNames = [
  'seq_id',
  'source',
  'type',
  'start',
  'end',
  'score',
  'strand',
  'phase',
  'attributes',
]

/**
 * Unescape a string value used in a GFF3 attribute.
 *
 * @param {String} s
 * @returns {String}
 */
export function unescape(s) {
  if (s === null) return null

  return s.replace(/%([0-9A-Fa-f]{2})/g, (match, seq) =>
    String.fromCharCode(parseInt(seq, 16)),
  )
}

/**
 * Escape a value for use in a GFF3 attribute value.
 *
 * @param {String} s
 * @returns {String}
 */
export function escape(s) {
  return s.replace(/[\n;\r\t=%&,\x00-\x1f\x7f-\xff]/g, ch => {
    let hex = ch
      .charCodeAt(0)
      .toString(16)
      .toUpperCase()

    // lol, apparently there's no native function for fixed-width hex output
    if (hex.length < 2) hex = `0${hex}`
    return `%${hex}`
  })
}

/**
 * Parse the 9th column (attributes) of a GFF3 feature line.
 *
 * @param {String} attrString
 * @returns {Object}
 */
export function parseAttributes(attrString) {
  if (!(attrString && attrString.length) || attrString === '.') return {}

  const attrs = {}

  attrString
    .replace(/\r?\n$/, '')
    .split(';')
    .forEach(a => {
      const nv = a.split('=', 2)
      if (!(nv[1] && nv[1].length)) return

      let arec = attrs[nv[0]]
      if (!arec) {
        arec = []
        attrs[nv[0]] = arec
      }

      arec.push(...nv[1].split(',').map(unescape))
    })
  return attrs
}

/**
 * Parse a GFF3 feature line
 *
 * @param {String} line
 */
export function parseFeature(line) {
  // split the line into columns and replace '.' with null in each column
  const f = line.split('\t').map(a => (a === '.' ? null : a))

  // unescape only the ref and source columns
  f[0] = unescape(f[0])
  f[1] = unescape(f[1])

  f[8] = parseAttributes(f[8])
  const parsed = {}
  for (let i = 0; i < fieldNames.length; i += 1) {
    parsed[fieldNames[i]] = f[i] === '.' ? null : f[i]
  }
  if (parsed.start !== null) parsed.start = parseInt(parsed.start, 10)
  if (parsed.end !== null) parsed.end = parseInt(parsed.end, 10)
  if (parsed.score !== null) parsed.score = parseFloat(parsed.score, 10)
  if (parsed.strand != null) parsed.strand = parsed.strand
  return parsed
}

/**
 * Parse a GFF3 directive line.
 *
 * @param {String} line
 * @returns {Object} the information in the directive
 */
export function parseDirective(line) {
  const match = /^\s*##\s*(\S+)\s*(.*)/.exec(line)
  if (!match) return null

  let [, name, contents] = match

  const parsed = { directive: name }
  if (contents.length) {
    contents = contents.replace(/\r?\n$/, '')
    parsed.value = contents
  }

  // do a little additional parsing for sequence-region and genome-build directives
  if (name === 'sequence-region') {
    const c = contents.split(/\s+/, 3)
    parsed.seq_id = c[0]
    parsed.start = c[1].replace(/\D/g, '')
    parsed.end = c[2].replace(/\D/g, '')
  } else if (name === 'genome-build') {
    ;[parsed.source, parsed.buildname] = contents.split(/\s+/, 2)
  }

  return parsed
}

/**
 * Format an attributes object into a string suitable for the 9th column of GFF3.
 *
 * @param {Object} attrs
 */
export function formatAttributes(attrs) {
  const attrOrder = []
  Object.keys(attrs).forEach(tag => {
    const val = attrs[tag]
    let valstring
    if (val.hasOwnProperty('toString')) {
      valstring = escape(val.toString())
    } else if (Array.isArray(val.values)) {
      valstring = val.values.map(escape).join(',')
    } else if (Array.isArray(val)) {
      valstring = val.map(escape).join(',')
    } else {
      valstring = escape(val)
    }
    attrOrder.push(`${escape(tag)}=${valstring}`)
  })
  return attrOrder.length ? attrOrder.join(';') : '.'
}

const translateStrand = ['-', '.', '+']

function _formatSingleFeature(f, seenFeature) {
  const attrString =
    f.attributes === null || f.attributes === undefined
      ? '.'
      : formatAttributes(f.attributes)

  const fields = []
  for (let i = 0; i < 8; i += 1) {
    const val = f[fieldNames[i]]
    // deserialize strand
    if (i === 6)
      fields[i] =
        val === null || val === undefined
          ? '.'
          : translateStrand[val + 1] || val
    else
      fields[i] = val === null || val === undefined ? '.' : escape(String(val))
  }
  fields[8] = attrString

  const formattedString = `${fields.join('\t')}\n`

  // if we have already output this exact feature, skip it
  if (seenFeature[formattedString]) {
    return ''
  }

  seenFeature[formattedString] = true
  return formattedString
}

function _formatFeature(feature, seenFeature) {
  if (Array.isArray(feature)) {
    return feature.map(f => _formatFeature(f, seenFeature)).join('')
  }

  const strings = [_formatSingleFeature(feature, seenFeature)]
  ;['child_features', 'derived_features'].forEach(multiSlot => {
    if (feature[multiSlot]) {
      strings.push(
        ...feature[multiSlot].map(f => _formatFeature(f, seenFeature)),
      )
    }
  })
  return strings.join('')
}

/**
 * Format a feature object or array of
 * feature objects into one or more lines of GFF3.
 *
 * @param {Object|Array[Object]} featureOrFeatures
 */
export function formatFeature(featureOrFeatures) {
  const seen = {}
  return _formatFeature(featureOrFeatures, seen)
}

/**
 * Format a directive into a line of GFF3.
 *
 * @param {Object} directive
 * @returns {String}
 */
export function formatDirective(directive) {
  let str = `##${directive.directive}`
  if (directive.value) str += ` ${directive.value}`
  str += '\n'
  return str
}

/**
 * Format a comment into a GFF3 comment.
 * Yes I know this is just adding a # and a newline.
 *
 * @param {Object} comment
 * @returns {String}
 */
export function formatComment(comment) {
  return `# ${comment.comment}\n`
}

/**
 * Format a directive, comment, or feature,
 * or array of such items, into one or more lines of GFF3.
 *
 * @param {Object|Array} itemOrItems
 */
export function formatItem(itemOrItems) {
  function formatSingleItem(item) {
    if (item.directive) return formatDirective(item)
    else if (item.comment) return formatComment(item)
    return formatFeature(item)
  }

  if (typical.isArrayLike(itemOrItems)) {
    return Array.map(itemOrItems, formatSingleItem)
  }
  return formatSingleItem(itemOrItems)
}
