import type { BaseOpts, Entry } from './types'
import type { GenericFilehandle } from 'generic-filehandle2'

export async function readFAI(fai: GenericFilehandle, opts: BaseOpts = {}) {
  const sequenceInfo = {} as Record<string, Entry>
  const sequenceNames = [] as string[]
  const decoder = new TextDecoder('utf8')
  const content = decoder.decode(
    (await fai.readFile(opts)) as unknown as Uint8Array,
  )
  const lines = content.split(/\r?\n/)
  if (lines[0]?.startsWith('>')) {
    throw new Error(
      'found > in sequence name, might have supplied FASTA file for the FASTA index',
    )
  }
  for (let i = 0, l = lines.length; i < l; i++) {
    if (lines[i]) {
      const row = lines[i]!.split('\t')
      sequenceInfo[row[0]!] = {
        name: row[0]!,
        length: +row[1]!,
        start: 0,
        end: +row[1]!,
        offset: +row[2]!,
        lineLength: +row[3]!,
        lineBytes: +row[4]!,
      }
      sequenceNames.push(row[0]!)
    }
  }

  return {
    sequenceNames,
    sequenceInfo,
  }
}
