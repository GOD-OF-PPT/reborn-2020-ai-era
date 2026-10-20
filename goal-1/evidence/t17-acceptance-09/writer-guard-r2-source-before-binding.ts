import {appendFileSync, closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, statfsSync, writeFileSync, type Stats} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {basename, dirname, isAbsolute, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {assertFreshVideoEvidencePath} from './video-shape-output.ts'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignCodec, createCampaignRun} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {canonicalJson} from '../src/core/identity.ts'
import type {CommandEnvelope, GameRun} from '../src/core/run-types.ts'

export const ROOT = realpathSync(fileURLToPath(new URL('../', import.meta.url)))
export const TASK = 'goal-1/evidence/t17-acceptance-09'
export const ORIGINAL_REGISTRATION = 'goal-1/evidence/t17-acceptance-04/course-shape-coverage-registration.json'
export const PREFIX_DIRECTORY = 'goal-1/evidence/t17-acceptance-05/prefix-r1'
export const BASE_COMMIT = '02c10484df9d2da04eefa57560a7ffe064bfcad9'
export const CRITICAL_STRATEGIES = [TASK + '/input.md', TASK + '/plan.md', TASK + '/baseline.json',
 TASK + '/policy-prerequisites-r1.md', TASK + '/policy-lifecycle-r1.md', TASK + '/policy-risk-r1.md']
export const IDENTITIES = ['technical_employee', 'content_employee'].map(backgroundId =>
 ({name: backgroundId + '-t16-campaign-0', backgroundId, seed: 't16-campaign-0'}))
export const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
export function check(value: unknown, code: string): asserts value { if (!value) throw Error(code) }
export function equal(actual: unknown, expected: unknown, code: string) {
 check(canonicalJson(actual) === canonicalJson(expected), code)
}
export function object(value: unknown, code: string): Record<string, unknown> {
 check(value !== null && typeof value === 'object' && !Array.isArray(value), code)
 return {...value}
}
export interface FileRef {readonly file: string; readonly bytes: number; readonly sha256: string}
export interface MemberRef {readonly member: string; readonly bytes: number; readonly sha256: string}
export interface ArchiveMember {readonly name: string; readonly bytes: number; readonly sha256: string}
export interface CriticalArchive {
 readonly encoding: 'xz'; readonly file: string; readonly storedBytes: number; readonly storedSha256: string
 readonly containerBytes: number; readonly containerSha256: string; readonly members: readonly ArchiveMember[]
}
export function projectFile(name: string) {
 check(!isAbsolute(name) && !name.split('/').some(part => part === '..') && !/[\r\n\0]/.test(name), 'PROJECT_RELATIVE_PATH_REQUIRED')
 const lexical = resolve(ROOT, name), physical = realpathSync(lexical)
 check(physical === lexical && relative(ROOT, physical) !== '..' && !relative(ROOT, physical).startsWith('../'), 'PROJECT_INPUT_SYMLINK_OR_ESCAPE:' + name)
 check(lstatSync(physical).isFile(), 'REGULAR_PROJECT_INPUT_REQUIRED:' + name)
 return physical
}
export function readText(name: string) { return readFileSync(projectFile(name), 'utf8') }
export function readJson(name: string): unknown { return JSON.parse(readText(name)) }
export function anchoredText(name: string) {
 const raw = readText(name)
 const committed = execFileSync('rtk', ['proxy', 'git', 'show', BASE_COMMIT + ':' + name], {cwd: ROOT, maxBuffer: 32 * 1024 * 1024})
 check(Buffer.from(raw).equals(committed), 'ORIGINAL_GIT_ANCHOR_CHANGED:' + name)
 return raw
}
export function sourceFiles(directory: string): string[] {
 return readdirSync(join(ROOT, directory), {withFileTypes: true}).flatMap(entry => entry.isDirectory()
  ? sourceFiles(directory + '/' + entry.name)
  : entry.name.endsWith('.ts') && !entry.name.includes('.test.') ? [directory + '/' + entry.name] : [])
}
export function criticalSourceNames(originalRuntimeHashes: Readonly<Record<string, string>>) {
 return [...new Set([...sourceFiles('src/core'), ...sourceFiles('src/application'), ...sourceFiles('src/content'),
  ...sourceFiles('src/persistence'), ...Object.keys(originalRuntimeHashes),
  'src/testing/course-critical-context.ts', 'src/testing/course-critical-prerequisites.ts',
  'src/testing/course-critical-lifecycle.ts', 'src/testing/course-critical-risk.ts', 'src/testing/course-critical-cases.ts',
  'src/testing/course-shape-assertions.ts', 'src/testing/story-harness.ts',
  'scripts/course-critical-evidence.ts', 'scripts/course-critical-prefix.ts', 'scripts/course-critical-run.ts',
  'scripts/collect_course_critical_evidence.ts', 'scripts/verify_course_critical_evidence.ts',
  'scripts/evidence_xz_bundle.py', 'scripts/evidence-output.ts', 'scripts/video-shape-output.ts',
  'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.core.json', 'tsconfig.app.json', 'tsconfig.node.json', ...CRITICAL_STRATEGIES])].sort()
}
export function hashFiles(names: readonly string[]) {
 return Object.fromEntries([...new Set(names)].sort().map(name => [name, sha(readFileSync(projectFile(name)))]))
}
export function guardHashes(hashes: Readonly<Record<string, string>>) {
 for (const [name, expected] of Object.entries(hashes)) check(sha(readFileSync(projectFile(name))) === expected, 'FROZEN_SOURCE_OR_INPUT_DRIFT:' + name)
}
export function commandsOf(run: GameRun): CommandEnvelope[] {
 return run.receipts.slice(1).map(receipt => ({...JSON.parse(receipt.payloadSignature),
  commandId: receipt.commandId, expectedRevision: receipt.revisionBefore}))
}
export function strict(run: GameRun, codec = createCampaignCodec()) {
 const raw = codec.export(run), decoded = codec.import(raw)
 check(codec.export(decoded) === raw, 'CRITICAL_STRICT_RAW_ROUNDTRIP_CHANGED')
 return {run: decoded, raw}
}
export function createFrom(initial: GameRun) {
 const first = initial.receipts[0]
 check(first && initial.origin === 'normal' && initial.revision === 1, 'COMPLETE_NORMAL_CREATE_REQUIRED')
 return createCampaignRun({runId: initial.runId, actorId: initial.actorId, commandId: first.commandId,
  backgroundId: initial.backgroundId, seed: initial.seed, playerProfile: initial.playerProfile})
}
export function replayAccepted(initial: GameRun, commands: readonly CommandEnvelope[], observe: (run: GameRun, raw: string) => void) {
 const codec = createCampaignCodec()
 let state = strict(createFrom(initial), codec)
 observe(state.run, state.raw)
 for (const command of commands) {
  const result = evaluateCommand(state.run, command, codec.registry, state.run.actorId)
  check(result.status === 'proposed', 'COMPLETE_CREATE_COMMAND_NO_LONGER_PROPOSED:' + command.commandId)
  state = strict(result.nextRun, codec)
  observe(state.run, state.raw)
 }
 return state
}

function lstatOrNull(path: string): Stats | null {
 try { return lstatSync(path) }
 catch (error) {
  if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return null
  throw error
 }
}
function sameCreatedFile(info: Stats, original: {readonly dev: number; readonly ino: number}) {
 return info.isFile() && info.nlink === 1 && info.dev === original.dev && info.ino === original.ino
}
function guardOutputAncestors(path: string) {
 let current = path
 for (;;) {
  const st = lstatOrNull(current)
  if (st !== null) {
   check(st.isDirectory() && !st.isSymbolicLink(), 'EVIDENCE_PARENT_LINK_OR_NON_DIRECTORY')
   check(lstatOrNull(join(current, 'sealed-evidence.json')) === null, 'EVIDENCE_PARENT_SEALED_USE_NEW_SIBLING')
  }
  if (current === ROOT) return
  const parent = dirname(current)
  check(parent !== current, 'EVIDENCE_PROJECT_ANCESTOR_REQUIRED')
  current = parent
 }
}
export class CriticalEvidenceWriter {
 readonly output: string
 readonly name: string
 readonly #created = new Map<string, {readonly dev: number; readonly ino: number}>()
 constructor(mode: 'matrix' | 'audit', marker: string) {
  const proposed = assertFreshVideoEvidencePath(ROOT, process.argv.slice(2))
  this.name = relative(ROOT, proposed).split('\\').join('/')
  check(new RegExp('^' + TASK + '/' + mode + '-r[1-9][0-9]*$').test(this.name), 'FRESH_FIXED_ROOT09_OUTPUT_REQUIRED')
  guardOutputAncestors(dirname(proposed))
  check(lstatOrNull(proposed) === null, 'FRESH_CRITICAL_OUTPUT_REQUIRED')
  this.output = evidenceDirectory(ROOT, marker)
  check(readdirSync(this.output).length === 0, 'EMPTY_FRESH_CRITICAL_OUTPUT_REQUIRED')
 }
 path(name: string) {
  const target = resolve(this.output, name), inside = relative(this.output, target)
  check(inside !== '' && inside !== '..' && !inside.startsWith('../') && !isAbsolute(inside), 'CRITICAL_OUTPUT_ESCAPE')
  guardOutputAncestors(dirname(target))
  const info = lstatOrNull(target)
  if (info !== null) check(info.isFile() && !info.isSymbolicLink(), 'OUTPUT_LINK_OR_NONREGULAR')
  return target
 }
 mkdir(name: string) { const path = this.path(name); check(lstatOrNull(path) === null, 'FRESH_CRITICAL_SUBDIRECTORY_REQUIRED'); mkdirSync(path) }
 text(name: string, raw: string): FileRef {
  const path = this.path(name)
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o666)
  let original: {readonly dev: number; readonly ino: number}
  try {
   const info = fstatSync(fd)
   check(info.isFile() && info.nlink === 1, 'CREATED_CRITICAL_REGULAR_FILE_REQUIRED')
   original = {dev: info.dev, ino: info.ino}
   writeFileSync(fd, raw)
   check(sameCreatedFile(fstatSync(fd), original), 'CREATED_CRITICAL_FILE_CHANGED')
  } finally { closeSync(fd) }
  const reading = openSync(this.path(name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
   check(sameCreatedFile(fstatSync(reading), original), 'CREATED_CRITICAL_FILE_CHANGED')
   check(readFileSync(reading, 'utf8') === raw, 'CRITICAL_WRITTEN_RAW_CHANGED:' + name)
  } finally { closeSync(reading) }
  const leaf = lstatOrNull(path)
  check(leaf !== null && sameCreatedFile(leaf, original), 'CREATED_CRITICAL_FILE_CHANGED')
  this.#created.set(path, original)
  return {file: name, bytes: Buffer.byteLength(raw), sha256: sha(raw)}
 }
 json(name: string, value: unknown) { return this.text(name, JSON.stringify(value, null, 2) + '\n') }
 append(name: string, value: unknown) {
  const path = this.path(name), original = this.#created.get(path)
  check(original, 'APPEND_WRITER_OWNED_FILE_REQUIRED')
  const fd = openSync(path, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
   check(sameCreatedFile(fstatSync(fd), original), 'APPEND_CREATED_FILE_CHANGED')
   const leaf = lstatOrNull(this.path(name))
   check(leaf !== null && sameCreatedFile(leaf, original), 'APPEND_CREATED_FILE_CHANGED')
   appendFileSync(fd, JSON.stringify(value) + '\n')
   const after = lstatOrNull(path)
   check(sameCreatedFile(fstatSync(fd), original) && after !== null && sameCreatedFile(after, original), 'APPEND_CREATED_FILE_CHANGED')
  } finally { closeSync(fd) }
 }
 requireSpace(minimum = 640 * 1024 * 1024) {
  const disk = statfsSync(this.output), free = disk.bavail * disk.bsize
  check(free >= minimum, 'INSUFFICIENT_COMPLETE_CRITICAL_EVIDENCE_SPACE:' + free)
  return free
 }
}
export function putMember(members: Map<string, string>, name: string, raw: string): MemberRef {
 check(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name) && !members.has(name), 'UNIQUE_FLAT_CRITICAL_MEMBER_REQUIRED:' + name)
 members.set(name, raw)
 return {member: name, bytes: Buffer.byteLength(raw), sha256: sha(raw)}
}
export function archiveMembers(writer: CriticalEvidenceWriter, name: string, members: ReadonlyMap<string, string>): CriticalArchive {
 const target = writer.path(name)
 const container = JSON.stringify({format: 'course-evidence-bundle-v1', members: [...members].map(([member, raw]) => ({name: member, raw}))})
 const response = execFileSync('rtk', ['proxy', 'python3', '-B', 'scripts/evidence_xz_bundle.py', 'pack',
  '--output', target, '--container-bytes', String(Buffer.byteLength(container)), '--container-sha256', sha(container)],
  {cwd: ROOT, input: container, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120000})
 const descriptor = JSON.parse(response) as CriticalArchive
 check(descriptor.encoding === 'xz' && descriptor.file === basename(target), 'CRITICAL_XZ_DESCRIPTOR_REQUIRED')
 check(descriptor.containerBytes === Buffer.byteLength(container) && descriptor.containerSha256 === sha(container), 'CRITICAL_FULL_CONTAINER_CHANGED')
 equal(descriptor.members, [...members].map(([member, raw]) => ({name: member, bytes: Buffer.byteLength(raw), sha256: sha(raw)})), 'CRITICAL_MEMBER_SET_OR_BYTES_CHANGED')
 const stored = readFileSync(target)
 check(stored.length === descriptor.storedBytes && sha(stored) === descriptor.storedSha256, 'CRITICAL_STORED_XZ_CHANGED')
 const decoded = execFileSync('rtk', ['proxy', 'python3', '-B', 'scripts/evidence_xz_bundle.py', 'unpack', '--input', target],
  {cwd: ROOT, maxBuffer: 256 * 1024 * 1024, timeout: 120000})
 check(decoded.equals(Buffer.from(container)), 'CRITICAL_IMMEDIATE_FULL_XZ_READBACK_CHANGED')
 return descriptor
}
export function unpackArchive(projectName: string, descriptor: CriticalArchive) {
 const target = projectFile(projectName)
 check(descriptor.encoding === 'xz' && descriptor.file === basename(target), 'AUDIT_CRITICAL_XZ_DESCRIPTOR_REQUIRED')
 const stored = readFileSync(target)
 check(stored.length === descriptor.storedBytes && sha(stored) === descriptor.storedSha256, 'AUDIT_CRITICAL_ARCHIVE_BYTES_CHANGED')
 const decoded = execFileSync('rtk', ['proxy', 'python3', '-B', 'scripts/evidence_xz_bundle.py', 'unpack', '--input', target],
  {cwd: ROOT, maxBuffer: 256 * 1024 * 1024, timeout: 120000})
 check(decoded.length === descriptor.containerBytes && sha(decoded) === descriptor.containerSha256, 'AUDIT_CRITICAL_CONTAINER_BYTES_CHANGED')
 const parsed: unknown = JSON.parse(decoded.toString('utf8')), container = object(parsed, 'CRITICAL_FULL_CONTAINER_REQUIRED')
 check(container.format === 'course-evidence-bundle-v1' && Array.isArray(container.members), 'CRITICAL_CONTAINER_FORMAT_REQUIRED')
 const members = new Map<string, string>()
 for (const item of container.members) {
  const row = object(item, 'CRITICAL_MEMBER_REQUIRED')
  check(typeof row.name === 'string' && typeof row.raw === 'string', 'CRITICAL_TEXT_MEMBER_REQUIRED')
  putMember(members, row.name, row.raw)
 }
 equal(descriptor.members, [...members].map(([name, raw]) => ({name, bytes: Buffer.byteLength(raw), sha256: sha(raw)})), 'AUDIT_CRITICAL_ALL_MEMBERS_CHANGED')
 return members
}
export function memberRaw(members: ReadonlyMap<string, string>, reference: MemberRef) {
 const raw = members.get(reference.member)
 check(raw !== undefined && Buffer.byteLength(raw) === reference.bytes && sha(raw) === reference.sha256, 'FULL_CRITICAL_MEMBER_REFERENCE_CHANGED:' + reference.member)
 return raw
}
