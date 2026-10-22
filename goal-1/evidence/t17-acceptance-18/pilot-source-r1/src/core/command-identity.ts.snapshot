import { canonicalJson, identifier } from './identity.ts'
import { hashText } from './hash.ts'
import { requireRule } from './errors.ts'

export function commandIdentifier(value: unknown): string {
  const id = identifier(value)
  requireRule(id.length <= 128, 'COMMAND_ID_TOO_LONG')
  return id
}

export function commandIdentity(runId: string, actorId: string, kind: string, payload: unknown) {
  const signature = canonicalJson({ runId, actorId, kind, payload })
  return { signature, hash: hashText(signature) }
}
