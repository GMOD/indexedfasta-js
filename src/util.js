/**
 * Format a sequence object as FASTA
 *
 * @param {Object} seq
 * @returns {String} formatted single FASTA sequence
 */
export function formatSequence(seq) {
  return `>${seq.id}${seq.description ? ` ${seq.description}` : ''}\n${
    seq.sequence
  }\n`
}
