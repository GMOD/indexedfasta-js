export default function parseSmallFasta(text: string) {
  return text
    .split('>')
    .filter(t => /\S/.test(t))
    .map(entryText => {
      const [defLine, ...seqLines] = entryText.split('\n')
      const [id, ...description] = defLine!.split(' ')
      const sequence = seqLines.join('').replace(/\s/g, '')
      return {
        id: id!,
        description: description.join(' '),
        sequence,
      }
    })
}
