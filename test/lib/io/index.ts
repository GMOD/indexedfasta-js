//@ts-nocheck
import url from 'url'
import { RemoteFile, LocalFile } from 'generic-filehandle'

function fromUrl(source) {
  const { protocol, pathname } = url.parse(source)
  if (protocol === 'file:') {
    return new LocalFile(unescape(pathname))
  }
  return new RemoteFile(source)
}
function open(maybeUrl, maybePath, maybeFilehandle) {
  if (maybeFilehandle) {
    return maybeFilehandle
  }
  if (maybeUrl) {
    return fromUrl(maybeUrl)
  }
  if (maybePath) {
    return new LocalFile(maybePath)
  }
  throw new Error('no url, path, or filehandle provided, cannot open')
}

export { fromUrl, open }

export { LocalFile, RemoteFile } from 'generic-filehandle'
