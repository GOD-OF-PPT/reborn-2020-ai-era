import { execFileSync } from 'node:child_process'
import { lstatSync, mkdirSync } from 'node:fs'
import { resolve, relative, join, dirname, sep } from 'node:path'

/** A committed task artifact is immutable; explicit reruns need a fresh destination. */
export function evidenceDirectory(root: string, marker: string, snapshots: readonly string[] = []): string {
  const args = process.argv.slice(2)
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--output-dir' || !args[1])) throw new Error('Usage: --output-dir <new directory>')
  const directory = resolve(root, args[1] ?? 'goal-1/evidence')
  const artifacts = [marker, ...snapshots].map((name) => relative(root, join(directory, name)).split('\\').join('/'))
  if (artifacts.some((artifact) => /[\r\n]/.test(artifact))) throw new Error('INVALID_EVIDENCE_DIRECTORY')
  for (let current = directory; ; current = dirname(current)) {
    let entry
    try { entry = lstatSync(current, { throwIfNoEntry: false }) }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOTDIR') throw error }
    if (entry && (entry.isSymbolicLink() || !entry.isDirectory())) throw new Error('EVIDENCE_OUTPUT_DIRECTORY_SYMLINK_OR_NON_DIRECTORY')
    if (entry && lstatSync(join(current, 'sealed-evidence.json'), { throwIfNoEntry: false })) throw new Error('IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING')
    if (current === resolve(root) || dirname(current) === current) break
  }
  const parts = relative(root, directory).split(sep)
  if (parts[0] === 'goal-1' && parts[1] === 'evidence' && parts[2]) {
    const registered = execFileSync('rtk', ['proxy', 'git', 'ls-files', '-z', '--', parts.slice(0, 3).join('/')], { cwd: root })
    if (registered.length) throw new Error('IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING')
  }
  const results = execFileSync('rtk', ['proxy', 'git', 'cat-file', '--batch-check=%(objectname) %(objecttype)'], { cwd: root, input: artifacts.map((artifact) => `HEAD:${artifact}\n`).join(''), encoding: 'utf8' }).trim().split('\n')
  const committed = results.some((result) => /^[0-9a-f]{40,64} blob$/.test(result))
  if (results.length !== artifacts.length || results.some((result) => !/^[0-9a-f]{40,64} blob$/.test(result) && !result.endsWith(' missing'))) throw new Error('CANNOT_VERIFY_EVIDENCE_DESTINATION')
  if (committed) throw new Error('IMMUTABLE_TASK_EVIDENCE: rerun with --output-dir <new directory>; preserve the committed artifact')
  mkdirSync(directory, { recursive: true })
  return directory
}
