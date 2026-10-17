import { copyJson } from './json-input.ts'
import { requireRule } from './errors.ts'
import type { GameRun } from './run-types.ts'
import type { WorldRuntime } from './world.ts'

/** Read-only display budget; all mandatory/risk items and archived ordinary IDs survive. */
export function projectWorld(run: GameRun, runtime: WorldRuntime) {
  requireRule(run.world && run.world.packHash === runtime.hash, 'WORLD_CONTENT_MISMATCH')
  const world = run.world
  const pack = runtime.pack
  const events = world.instances.filter((instance) => instance.status === 'pending').map((instance) => {
    const definition = runtime.definition(instance.definitionId)
    return { id: instance.id, kind: 'event', title: definition.title, presentation: definition.presentation, date: instance.createdAt, deadline: instance.expiresAt, priority: definition.priority, classification: definition.classification, sourceIds: definition.sourceIds }
  }).sort((a, b) => b.priority - a.priority || a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const ordinary = events.filter((item) => item.presentation === 'ordinary')
  const forced = events.filter((item) => item.presentation !== 'ordinary')
  const obligations = run.economy.ledger.obligations.filter((item) => item.remainingFen > 0).map((item) => ({ id: item.id, accountId: item.accountId, remainingFen: item.remainingFen, date: item.date, sourceEventId: item.sourceEventId }))
  return copyJson({ main: ordinary[0] ?? null, side: ordinary.slice(1, 3), ordinaryArchive: ordinary.slice(3), mandatoryAndRisk: forced, obligations, totalPendingEvents: events.length,
    news: world.anchors.map((anchor) => { const definition = pack.anchors.find((item) => item.id === anchor.id); requireRule(definition, 'UNKNOWN_ANCHOR'); return { id: anchor.id, title: definition.title, actualDate: definition.actualDate, publishedAt: definition.publishedAt, availableAt: definition.availableAt, access: definition.access, sourceIds: definition.sourceIds, classification: definition.classification, read: world.newsRead.includes(anchor.id) } }),
    memories: pack.memories.map((memory) => ({ id: memory.id, domain: memory.domain, hint: memory.hint, favorite: world.favoriteMemories.includes(memory.id), prepared: world.preparations.some((item) => item.key === memory.preparationKey || memory.preparationKey==='manual_case'&&item.key==='paid_manual_case')||memory.preparationKey==='linzhou_pilot'&&!!run.story?.jobs.some(j=>j.id===run.story?.linzhou.pilotJobId&&j.status==='completed'),status:memory.domain==='local_tools'&&run.story?.linzhou.branch==='open'?'deviated':memory.domain==='local_tools'&&run.story?.linzhou.publicationChoice==='open'?'intervened':'reference',preparationLinkId:run.story?.links.find(l=>l.memoryId===memory.id)?.id??null })),
  })
}
