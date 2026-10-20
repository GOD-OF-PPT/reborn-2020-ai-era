import {campaignCourse, campaignStory, campaignVideo} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import {projectCourse} from '../core/course-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {projectVideo} from '../core/video-projection.ts'
import type {CommandEnvelope, GameRun} from '../core/run-types.ts'
import {StoryHarness} from './story-harness.ts'

export function requireCritical(value: unknown, code: string): asserts value {
 if (!value) throw Error(code)
}

export interface CriticalAttemptStart {
 readonly sequence: number
 readonly command: CommandEnvelope
 readonly sourceRevision: number
 readonly sourceDate: string
 readonly expectedRejection: boolean
}
export interface CriticalAttemptResult extends CriticalAttemptStart {
 readonly status: 'accepted' | 'rejected' | 'unexpected_proposal' | 'unexpected_existing_receipt'
 readonly reasonCodes: readonly string[]
 readonly before: GameRun
 readonly after: GameRun
 readonly proposedCandidate: GameRun | null
}
export interface CriticalHarnessCallbacks {
 readonly beforeAttempt?: (attempt: CriticalAttemptStart) => void
 readonly afterAttempt?: (attempt: CriticalAttemptResult) => void
}

/** Records expected rejections as actual attempts, without committing a proposal. */
export class CourseCriticalHarness extends StoryHarness {
 readonly callbacks: CriticalHarnessCallbacks
 #sequence = 0
 constructor(prior: GameRun, callbacks: CriticalHarnessCallbacks = {}) {
  super({priorRun: prior})
  this.callbacks = callbacks
 }
 #begin(command: CommandEnvelope, expectedRejection: boolean): CriticalAttemptStart {
  const attempt = {sequence: ++this.#sequence, command, sourceRevision: this.run.revision,
   sourceDate: this.run.timeline.cursor.date, expectedRejection}
  this.callbacks.beforeAttempt?.(attempt)
  return attempt
 }
 override sendAs(kind: string, payload: unknown, commandId: string): GameRun {
  const command = {...this.command(kind, payload), commandId}, before = this.run
  const originalRaw = this.codec.export(before)
  const attempt = this.#begin(command, false)
  const result = evaluateCommand(before, command, this.codec.registry, before.actorId)
  requireCritical(this.codec.export(before) === originalRaw && this.codec.export(this.run) === originalRaw,
   'EVALUATED_COMMAND_MUTATED_ORIGINAL_RAW')
  if (result.status === 'rejected') {
   this.callbacks.afterAttempt?.({...attempt, status: 'rejected', reasonCodes: result.reasonCodes,
    before, after: this.run, proposedCandidate: null})
   throw Error('CRITICAL_UNEXPECTED_COMMAND_REJECTION:' + JSON.stringify({kind, payload,
    date: before.timeline.cursor.date, reasonCodes: result.reasonCodes}))
  }
  if (result.status !== 'proposed') {
   this.callbacks.afterAttempt?.({...attempt, status: 'unexpected_existing_receipt', reasonCodes: [],
    before, after: this.run, proposedCandidate: null})
   throw Error('CRITICAL_NEW_ATTEMPT_RETURNED_EXISTING_RECEIPT:' + kind)
  }
  this.run = this.codec.import(this.codec.export(result.nextRun))
  this.commands.push(command)
  this.callbacks.afterAttempt?.({...attempt, status: 'accepted', reasonCodes: [],
   before, after: this.run, proposedCandidate: null})
  return this.run
 }
 override reject(kind: string, payload: unknown) {
  const command = this.command(kind, payload), before = this.run, raw = this.codec.export(before)
  const attempt = this.#begin(command, true)
  const result = evaluateCommand(before, command, this.codec.registry, before.actorId)
  requireCritical(this.codec.export(before) === raw && this.codec.export(this.run) === raw,
   'EXPECTED_REJECTION_MUTATED_COMPLETE_RAW')
  if (result.status !== 'rejected') {
   this.callbacks.afterAttempt?.({...attempt,
    status: result.status === 'proposed' ? 'unexpected_proposal' : 'unexpected_existing_receipt', reasonCodes: [],
    before, after: this.run, proposedCandidate: result.status === 'proposed' ? result.nextRun : null})
   throw Error('CRITICAL_EXPECTED_REJECTION_WAS_PROPOSED:' + kind)
  }
  this.callbacks.afterAttempt?.({...attempt, status: 'rejected', reasonCodes: result.reasonCodes,
   before, after: this.run, proposedCandidate: null})
  return result.reasonCodes
 }
}

export interface CriticalObservation {
 readonly code: string
 readonly revision: number
 readonly date: string
 readonly detail: unknown
}
export interface CriticalContextCallbacks {
 readonly milestone?: (name: string, run: GameRun) => void
}

/** Public projections guide choices; complete private raw is retained only by the evidence layer. */
export class CourseCriticalContext {
 readonly h: CourseCriticalHarness
 readonly original: GameRun
 readonly observations: CriticalObservation[] = []
 readonly callbacks: CriticalContextCallbacks
 #milestoneNames = new Set<string>()
 constructor(h: CourseCriticalHarness, callbacks: CriticalContextCallbacks = {}) {
  this.h = h
  this.original = h.run
  this.callbacks = callbacks
 }
 course() {
  const projection = projectCourse(this.h.run, campaignCourse)
  requireCritical(projection, 'CRITICAL_PUBLIC_COURSE_REQUIRED')
  return projection
 }
 video() {
  const projection = projectVideo(this.h.run, campaignVideo)
  requireCritical(projection, 'CRITICAL_PUBLIC_VIDEO_REQUIRED')
  return projection
 }
 story() { return projectStory(this.h.run, campaignStory) }
 now() { return this.h.run.timeline.cursor.date }
 at(date: string) { return this.h.at(date, {work: false}) }
 mark(name: string) {
  requireCritical(!this.#milestoneNames.has(name), 'DUPLICATE_CRITICAL_MILESTONE:' + name)
  this.#milestoneNames.add(name)
  this.callbacks.milestone?.(name, this.h.run)
 }
 check(value: unknown, code: string, detail: unknown = null): asserts value {
  requireCritical(value, 'CRITICAL_TARGET_FAILED:' + code + ':' + JSON.stringify(detail))
  this.observations.push({code, revision: this.h.run.revision, date: this.now(), detail})
  this.mark('check-' + this.observations.length + '-' + code)
 }
 reject(kind: string, payload: unknown, reason: string, label = reason) {
  const before = this.h.codec.export(this.h.run), reasons = this.h.reject(kind, payload)
  this.check(reasons.includes(reason), label, {kind, expectedReason: reason, actualReasons: reasons})
  this.check(this.h.codec.export(this.h.run) === before, label + '-complete-raw-unchanged')
  return reasons
 }
 originalPayload(kind: string): Record<string, unknown> {
  const payload = this.h.commands.filter(command => command.kind === kind).at(-1)?.payload
  requireCritical(payload !== null && typeof payload === 'object' && !Array.isArray(payload),
   'CRITICAL_ORIGINAL_COMMAND_PAYLOAD_REQUIRED:' + kind)
  return {...payload}
 }
}

export interface CourseCriticalDefinition {
 readonly id: string
 readonly sourceRevision: number
 readonly purpose: string
 readonly requiredChecks: readonly string[]
 readonly run: (context: CourseCriticalContext) => void
}
