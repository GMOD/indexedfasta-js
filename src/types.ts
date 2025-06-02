export interface Entry {
  name: string
  length: number
  start: number
  end: number
  offset: number
  lineLength: number
  lineBytes: number
}

export interface BaseOpts {
  signal?: AbortSignal
}
