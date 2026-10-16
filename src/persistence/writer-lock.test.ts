import { expect, it } from 'vitest'
import { WebWriterAccess } from './writer-lock.ts'

it.each(['rejected', 'thrown'])('keeps the session read-only when requesting a writer lock is %s', async (failure) => {
  const manager = { request: () => {
    if (failure === 'thrown') throw new Error('lock access denied')
    return Promise.reject(new Error('lock access denied'))
  } } as unknown as LockManager
  const lease = await new WebWriterAccess(manager).acquire('isolated-test:run')
  expect(lease.mode).toBe('reader')
  expect(lease.reason).toBe('LOCK_REQUEST_FAILED')
  await lease.release()
})
