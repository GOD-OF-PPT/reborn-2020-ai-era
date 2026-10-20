import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {linkSync, lstatSync, mkdirSync, readFileSync, readlinkSync, renameSync, symlinkSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {CriticalEvidenceWriter, ROOT, TASK, archiveMembers, putMember, unpackArchive} from '../../../scripts/course-critical-evidence.ts'

const args = process.argv.slice(2)
assert.equal(args.length, 4)
assert.equal(args[0], '--label')
assert.equal(args[2], '--start')
const label = args[1], start = Number(args[3])
assert.match(label, /^r[1-9][0-9]*$/)
assert.ok(Number.isSafeInteger(start) && start >= 9001)
const reportDirectory = join(ROOT, TASK, 'writer-guard-' + label)
mkdirSync(reportDirectory)
const source = join(ROOT, 'scripts/course-critical-evidence.ts')
const digest = data => createHash('sha256').update(data).digest('hex')
const sourceSha256 = digest(readFileSync(source))
const results = []
let sequence = 0
function snapshot(path) {
 try {
  const info = lstatSync(path)
  if (info.isSymbolicLink()) return {type: 'symlink', literal: readlinkSync(path), dev: info.dev, ino: info.ino}
  if (!info.isFile()) return {type: info.isDirectory() ? 'directory' : 'nonregular', dev: info.dev, ino: info.ino}
  const raw = readFileSync(path)
  return {type: 'regular', bytes: raw.length, sha256: digest(raw), dev: info.dev, ino: info.ino, nlink: info.nlink}
 } catch (error) { if (error.code === 'ENOENT') return {type: 'missing'}; throw error }
}
function contents(path) {
 const value = snapshot(path)
 return value.type === 'regular' ? {type: value.type, bytes: value.bytes, sha256: value.sha256} : value
}
function unchanged(path, before) { assert.deepEqual(contents(path), before) }
function reject(operation, pattern, observations) {
 let error = null
 try { operation() } catch (caught) { error = String(caught) }
 observations.rejection = error
 assert.ok(error !== null, 'EXPECTED_GUARD_REJECTION')
 assert.match(error, pattern)
}
function test(name, execute) {
 const number = start + sequence++, outputName = TASK + '/matrix-r' + number
 process.argv = [process.argv[0], process.argv[1], '--output-dir', outputName]
 const observations = {}, row = {name, outputName, status: 'failed', observations, error: null}
 try {
  const writer = new CriticalEvidenceWriter('matrix', 'writer-fixture.json')
  execute(writer, observations)
  row.status = 'passed'
 } catch (caught) { row.error = String(caught) }
 results.push(row)
 writeFileSync(join(reportDirectory, 'case-' + String(sequence).padStart(2, '0') + '.json'), JSON.stringify(row, null, 2) + '\n', {flag: 'wx'})
}
test('normal-wx-text-and-owned-append', (writer, o) => {
 const first = writer.text('journal.jsonl', '第一行\n')
 writer.append('journal.jsonl', {value: '第二行', count: 1})
 assert.equal(readFileSync(join(writer.output, 'journal.jsonl'), 'utf8'), '第一行\n' + JSON.stringify({value: '第二行', count: 1}) + '\n')
 o.initial = first; o.final = snapshot(join(writer.output, 'journal.jsonl'))
})
test('missing-append-never-creates-leaf', (writer, o) => {
 const target = join(writer.output, 'missing.jsonl')
 o.before = contents(target)
 try { reject(() => writer.append('missing.jsonl', {forbidden: true}), /APPEND_/, o) }
 finally { o.after = contents(target) }
 unchanged(target, o.before)
})
test('unowned-regular-append-rejected', (writer, o) => {
 const target = join(writer.output, 'unowned.jsonl')
 writeFileSync(target, 'unowned original\n', {flag: 'wx'})
 o.before = contents(target)
 try { reject(() => writer.append('unowned.jsonl', {forbidden: true}), /APPEND_/, o) }
 finally { o.after = contents(target) }
 unchanged(target, o.before)
})
for (const dangling of [false, true]) test((dangling ? 'dangling' : 'regular') + '-leaf-link-append-rejected', (writer, o) => {
 const target = join(writer.output, 'journal.jsonl'), external = join(writer.output, 'owned-external.txt')
 writer.text('journal.jsonl', 'owned initial\n')
 renameSync(target, join(writer.output, 'retained-original.txt'))
 if (!dangling) writeFileSync(external, 'external original\n', {flag: 'wx'})
 symlinkSync(external, target)
 o.link = snapshot(target); o.before = contents(external)
 try { reject(() => writer.append('journal.jsonl', {forbidden: true}), /OUTPUT_LINK_OR_NONREGULAR|APPEND_/, o) }
 finally { o.after = contents(external); o.linkAfter = snapshot(target) }
 unchanged(external, o.before)
})
for (const dangling of [false, true]) test((dangling ? 'dangling' : 'regular') + '-directory-parent-link-rejected', (writer, o) => {
 const external = join(writer.output, 'owned-external-directory'), link = join(writer.output, 'linked-parent')
 if (!dangling) mkdirSync(external)
 symlinkSync(external, link)
 o.before = snapshot(link)
 reject(() => writer.path('linked-parent/leaf.txt'), /EVIDENCE_PARENT_LINK_OR_NON_DIRECTORY/, o)
 o.after = snapshot(link)
 assert.deepEqual(o.after, o.before)
})
for (const dangling of [false, true]) test((dangling ? 'dangling' : 'regular') + '-ancestor-seal-marker-rejected', (writer, o) => {
 const directory = join(writer.output, 'owned-sealed'), marker = join(directory, 'sealed-evidence.json')
 writer.mkdir('owned-sealed')
 if (dangling) symlinkSync(join(directory, 'owned-missing-marker-target'), marker)
 else writeFileSync(marker, '{"sealed":true}\n', {flag: 'wx'})
 o.marker = snapshot(marker)
 reject(() => writer.path('owned-sealed/forbidden.txt'), /EVIDENCE_PARENT_SEALED_USE_NEW_SIBLING/, o)
 assert.deepEqual(snapshot(marker), o.marker)
})
test('nonregular-leaf-directory-rejected', (writer, o) => {
 mkdirSync(join(writer.output, 'journal.jsonl'))
 reject(() => writer.append('journal.jsonl', {forbidden: true}), /OUTPUT_LINK_OR_NONREGULAR/, o)
 o.after = snapshot(join(writer.output, 'journal.jsonl'))
 assert.equal(o.after.type, 'directory')
})
test('created-leaf-regular-inode-replacement-rejected', (writer, o) => {
 const target = join(writer.output, 'journal.jsonl'), backup = join(writer.output, 'retained-original.txt')
 writer.text('journal.jsonl', 'writer-owned original\n')
 renameSync(target, backup)
 writeFileSync(target, 'replacement must survive\n', {flag: 'wx'})
 o.original = contents(backup); o.before = contents(target)
 try { reject(() => writer.append('journal.jsonl', {forbidden: true}), /APPEND_/, o) }
 finally { o.after = contents(target); o.originalAfter = contents(backup) }
 unchanged(target, o.before); unchanged(backup, o.original)
})
test('created-leaf-additional-hardlink-rejected', (writer, o) => {
 const target = join(writer.output, 'journal.jsonl'), alias = join(writer.output, 'owned-alias.txt')
 writer.text('journal.jsonl', 'writer-owned original\n')
 linkSync(target, alias)
 o.before = contents(target); o.aliasBefore = contents(alias); o.statBefore = snapshot(target)
 try { reject(() => writer.append('journal.jsonl', {forbidden: true}), /APPEND_|OUTPUT_LINK_OR_NONREGULAR/, o) }
 finally { o.after = contents(target); o.aliasAfter = contents(alias) }
 unchanged(target, o.before); unchanged(alias, o.aliasBefore)
})
test('created-leaf-removed-append-rejected-no-recreate', (writer, o) => {
 const target = join(writer.output, 'journal.jsonl')
 writer.text('journal.jsonl', 'retained\n')
 renameSync(target, join(writer.output, 'retained-original.txt'))
 try { reject(() => writer.append('journal.jsonl', {forbidden: true}), /APPEND_|ENOENT/, o) }
 finally { o.after = snapshot(target) }
 assert.equal(o.after.type, 'missing')
})
test('exclusive-text-never-overwrites', (writer, o) => {
 const target = join(writer.output, 'original.txt')
 writer.text('original.txt', 'original bytes\n')
 o.before = contents(target)
 reject(() => writer.text('original.txt', 'forbidden overwrite\n'), /EEXIST|OUTPUT_/, o)
 unchanged(target, o.before); o.after = contents(target)
})
test('dangling-text-leaf-recognized-before-wx', (writer, o) => {
 const external = join(writer.output, 'owned-missing-external'), target = join(writer.output, 'new.txt')
 symlinkSync(external, target)
 reject(() => writer.text('new.txt', 'forbidden\n'), /OUTPUT_LINK_OR_NONREGULAR/, o)
 o.link = snapshot(target); o.external = snapshot(external)
 assert.equal(o.external.type, 'missing')
})
test('output-parent-traversal-rejected', (writer, o) => {
 reject(() => writer.text('../owned-escape.txt', 'forbidden\n'), /CRITICAL_OUTPUT_ESCAPE/, o)
})
function smallArchive(writer) {
 const members = new Map()
 putMember(members, 'initial.json', '{"文本":"小型完整原文\\n🙂"}\n')
 putMember(members, 'journal.jsonl', '{"actual":"FS-only"}\n')
 const descriptor = archiveMembers(writer, 'small-evidence.xz', members)
 return {members, descriptor, path: writer.name + '/small-evidence.xz'}
}
test('small-real-xz-full-member-roundtrip', (writer, o) => {
 const value = smallArchive(writer), restored = unpackArchive(value.path, value.descriptor)
 assert.deepEqual([...restored], [...value.members])
 o.descriptor = value.descriptor; o.stored = snapshot(join(writer.output, value.descriptor.file))
 o.members = [...restored].map(([name, raw]) => ({name, bytes: Buffer.byteLength(raw), sha256: digest(raw)}))
})
test('small-real-xz-wrong-encoding-rejected', (writer, o) => {
 const value = smallArchive(writer)
 o.descriptor = value.descriptor
 reject(() => unpackArchive(value.path, {...value.descriptor, encoding: 'gzip'}), /AUDIT_CRITICAL_XZ_DESCRIPTOR_REQUIRED/, o)
})
test('small-real-xz-wrong-file-rejected', (writer, o) => {
 const value = smallArchive(writer)
 o.descriptor = value.descriptor
 reject(() => unpackArchive(value.path, {...value.descriptor, file: 'wrong-evidence.xz'}), /AUDIT_CRITICAL_XZ_DESCRIPTOR_REQUIRED/, o)
})
assert.equal(digest(readFileSync(source)), sourceSha256, 'SOURCE_CHANGED_DURING_WRITER_TESTS')
const failed = results.filter(row => row.status !== 'passed').length
const report = {label, source: relative(ROOT, source), sourceSha256, total: results.length,
 passed: results.length - failed, failed, exitCode: failed ? 1 : 0, results,
 scope: 'Owned small filesystem fixtures and small XZ only; no game commands, normal scenarios, full90, browser or compatibility. Does not prove concurrent ancestor replacement/hardlink races, ENOSPC or maximum-size containers.'}
const raw = JSON.stringify(report, null, 2) + '\n'
writeFileSync(join(reportDirectory, 'report.json'), raw, {flag: 'wx'})
console.log(JSON.stringify({label, total: report.total, passed: report.passed, failed, exitCode: report.exitCode,
 report: relative(ROOT, join(reportDirectory, 'report.json')), reportBytes: Buffer.byteLength(raw), reportSha256: digest(raw), sourceSha256}))
process.exitCode = report.exitCode
