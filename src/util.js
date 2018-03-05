/**
 * Fast, low-level functions for parsing and formatting GFF3.
 * JavaScript port of Robert Buels's Bio::GFF3::LowLevel Perl module.
 */

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

export function unescape(s) {
  if (s === null) return null

  return s.replace(/%([0-9A-Fa-f]{2})/g, (match, seq) =>
    String.fromCharCode(parseInt(seq, 16)),
  )
}

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
  if (parsed.strand != null)
    parsed.strand = { '+': 1, '-': -1 }[parsed.strand] || 0
  return parsed
}

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

export function formatFeature(f) {
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
        val === null || val === undefined ? '.' : translateStrand[val + 1]
    else
      fields[i] = val === null || val === undefined ? '.' : escape(String(val))
  }
  fields[8] = attrString

  return `${fields.join('\t')}\n`
}
