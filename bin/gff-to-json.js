const gff = require('../dist').default

let itemBuffer

process.stdout.write('[')
process.stdin
  .pipe(gff.parseStream({ parseAll: true }))
  .on('data', item => {
    itemBuffer = JSON.stringify(item)
    if (itemBuffer) {
      process.stdout.write(itemBuffer)
      process.stdout.write(',')
    }
  })
  .on('error', err => console.error(err))
  .on('end', () => {
    if (itemBuffer) {
      process.stdout.write(itemBuffer)
    }
    process.stdout.write(']')
  })
