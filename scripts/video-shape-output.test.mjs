import {test,after} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,symlinkSync,rmSync} from 'node:fs'
import {join,relative,resolve} from 'node:path'
import {assertFreshVideoEvidencePath} from './video-shape-output.ts'

const root=process.cwd(),scratch=mkdtempSync(join(root,'goal-1/evidence/t17-output-guard-'))
const rel=p=>relative(root,p),check=p=>assertFreshVideoEvidencePath(root,['--output-dir',rel(p)])
after(()=>rmSync(scratch,{recursive:true,force:true}))
test('accepts a fresh sibling destination without creating any directory',()=>{const p=join(scratch,'fresh');assert.equal(check(p),resolve(p));assert.equal(existsSync(p),false)})
test('accepts missing nested parents without creating them',()=>{const p=join(scratch,'nested','fresh');assert.equal(check(p),resolve(p));assert.equal(existsSync(join(scratch,'nested')),false)})
test('requires one explicit output argument',()=>{for(const args of [[],['--output-dir'],['--output-dir','x','extra'],['--output-dir','goal-1/evidence/x\n']])assert.throws(()=>assertFreshVideoEvidencePath(root,args),/EXPLICIT_FRESH_VIDEO_OUTPUT_REQUIRED/)})
test('rejects project paths outside evidence and the evidence container itself',()=>{for(const name of ['src/new-output','goal-1/evidence','../outside-evidence'])assert.throws(()=>assertFreshVideoEvidencePath(root,['--output-dir',name]),/VIDEO_OUTPUT_MUST_BE_PROJECT_EVIDENCE/)})
test('rejects an existing empty directory',()=>{const p=join(scratch,'empty');mkdirSync(p);assert.throws(()=>check(p),/FRESH_VIDEO_OUTPUT_DIRECTORY_REQUIRED/);assert.deepEqual(readdirSync(p),[])})
test('does not overwrite an existing marker or unrelated file',()=>{const p=join(scratch,'existing');mkdirSync(p);writeFileSync(join(p,'video-shape-results.json'),'original bytes');assert.throws(()=>check(p),/FRESH_VIDEO_OUTPUT_DIRECTORY_REQUIRED/);assert.deepEqual(readdirSync(p),['video-shape-results.json']);assert.equal(readFileSync(join(p,'video-shape-results.json'),'utf8'),'original bytes')})
test('rejects a child of committed evidence without changing its file set',()=>{const old=join(root,'goal-1/evidence/t17-acceptance-01'),before=readdirSync(old).sort(),p=join(old,'must-never-be-created-by-video-output-test');assert.equal(existsSync(p),false);assert.throws(()=>check(p),/IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING/);assert.deepEqual(readdirSync(old).sort(),before);assert.equal(existsSync(p),false)})
test('rejects a symlink into another committed evidence root before creating a child',()=>{const link=join(scratch,'linked');symlinkSync(join(root,'goal-1/evidence/t17-acceptance-01'),link,'dir');const p=join(link,'must-never-be-created-by-video-output-symlink-test');assert.equal(existsSync(p),false);assert.throws(()=>check(p),/VIDEO_OUTPUT_SYMLINK_OR_SCOPE_ESCAPE/);assert.equal(existsSync(p),false)})
