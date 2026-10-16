import type { WriterAccess, WriterLease } from '../persistence/writer-lock.ts'

/** Lock-system adapter for Node tests; native checks use WebWriterAccess. */
export class MemoryWriterAccess implements WriterAccess {
  readonly #held = new Set<string>()
  async acquire(key: string): Promise<WriterLease> {
    if (this.#held.has(key)) return { mode: 'reader', reason: 'ANOTHER_WRITER', release: () => Promise.resolve() }
    this.#held.add(key)
    return { mode: 'writer', reason: null, release: async () => { this.#held.delete(key) } }
  }
}
