export interface WriterLease {
  readonly mode: 'writer' | 'reader'
  readonly reason: 'ANOTHER_WRITER' | 'LOCK_API_UNAVAILABLE' | 'LOCK_REQUEST_FAILED' | null
  release(): Promise<void>
}
export interface WriterAccess { acquire(key: string): Promise<WriterLease> }

function reader(reason: Exclude<WriterLease['reason'], null>): WriterLease {
  return { mode: 'reader', reason, release: () => Promise.resolve() }
}

export class WebWriterAccess implements WriterAccess {
  readonly #manager: LockManager | undefined
  constructor(manager: LockManager | undefined = globalThis.navigator?.locks) { this.#manager = manager }
  acquire(key: string): Promise<WriterLease> {
    const manager = this.#manager
    if (!manager) return Promise.resolve(reader('LOCK_API_UNAVAILABLE'))
    return new Promise<WriterLease>((resolve) => {
      let releaseHold: () => void = () => { throw new Error('lock hold not initialized') }
      const hold = new Promise<void>((release) => { releaseHold = release })
      const completion: Promise<void> = Promise.resolve().then(() => manager.request(`reborn-write:${key}`, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
        if (lock === null) { resolve(reader('ANOTHER_WRITER')); return }
        let released = false
        resolve({ mode: 'writer', reason: null, release: async () => {
          if (!released) { released = true; releaseHold() }
          await completion
        } })
        await hold
      }))
      void completion.catch(() => resolve(reader('LOCK_REQUEST_FAILED')))
    })
  }
}
