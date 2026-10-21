import {test,after} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,symlinkSync,realpathSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,relative} from 'node:path'
import {execFileSync} from 'node:child_process'
import {evidenceDirectory} from './evidence-output.ts'

const scratch=mkdtempSync(join(realpathSync(tmpdir()),'reborn-p4-evidence-guard-'))
const gitEnv={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'}
for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE'])delete gitEnv[key]
const git=(root,...args)=>execFileSync('rtk',['proxy','git',...args],{cwd:root,env:gitEnv,stdio:'pipe'})
function fixture(name){const root=join(scratch,name);mkdirSync(root);git(root,'init');git(root,'-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','--allow-empty','-m','owned fixture');return root}
function check(root,path,marker='audit.json',snapshots=[]){
 const before=process.argv
 try{process.argv=['node','owned-fixture','--output-dir',relative(root,path)];return evidenceDirectory(root,marker,snapshots)}finally{process.argv=before}
}
after(()=>{if(process.env.KEEP_EVIDENCE_OUTPUT_FIXTURES)console.log('Retained owned fixtures: '+scratch);else rmSync(scratch,{recursive:true,force:true})})
test('allows a new sibling and missing nested parents in an unregistered task',()=>{const root=fixture('fresh'),p=join(root,'goal-1/evidence/owned/nested/new');assert.equal(check(root,p),p);assert.deepEqual(readdirSync(p),[])})
test('preserves unrelated files in an existing unregistered output directory',()=>{const root=fixture('existing'),p=join(root,'goal-1/evidence/owned');mkdirSync(p,{recursive:true});writeFileSync(join(p,'original.txt'),'keep');assert.equal(check(root,p),p);assert.equal(readFileSync(join(p,'original.txt'),'utf8'),'keep')})
test('rejects an untracked sealed ancestor before mkdir or caller work',()=>{
 const root=fixture('sealed'),parent=join(root,'goal-1/evidence/owned');mkdirSync(parent,{recursive:true});writeFileSync(join(parent,'sealed-evidence.json'),'original seal');const p=join(parent,'nested/new');let delegated=0
 assert.throws(()=>{check(root,p);delegated++},/IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING/);assert.equal(delegated,0);assert.equal(existsSync(join(parent,'nested')),false);assert.deepEqual(readdirSync(parent),['sealed-evidence.json']);assert.equal(readFileSync(join(parent,'sealed-evidence.json'),'utf8'),'original seal')
})
test('rejects a dangling seal marker without following it',()=>{const root=fixture('dangling'),parent=join(root,'goal-1/evidence/owned');mkdirSync(parent,{recursive:true});symlinkSync('missing-seal-target',join(parent,'sealed-evidence.json'));assert.throws(()=>check(root,join(parent,'new')),/IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING/);assert.deepEqual(readdirSync(parent),['sealed-evidence.json'])})
test('rejects a directory symlink before creating an external child',()=>{const root=fixture('linked'),parent=join(root,'goal-1/evidence/owned'),external=join(root,'external');mkdirSync(parent,{recursive:true});mkdirSync(external);symlinkSync(external,join(parent,'link'));assert.throws(()=>check(root,join(parent,'link/new')),/EVIDENCE_OUTPUT_DIRECTORY_SYMLINK_OR_NON_DIRECTORY/);assert.deepEqual(readdirSync(external),[])})
test('rejects a file masquerading as an output parent',()=>{const root=fixture('file-parent'),parent=join(root,'goal-1/evidence/owned');mkdirSync(parent,{recursive:true});writeFileSync(join(parent,'file'),'keep');assert.throws(()=>check(root,join(parent,'file/new')),/EVIDENCE_OUTPUT_DIRECTORY_SYMLINK_OR_NON_DIRECTORY/);assert.equal(readFileSync(join(parent,'file'),'utf8'),'keep')})
test('rejects a new child of registered evidence even without a seal file',()=>{const root=fixture('registered'),parent=join(root,'goal-1/evidence/owned');mkdirSync(parent,{recursive:true});writeFileSync(join(parent,'original.txt'),'keep');git(root,'add','goal-1/evidence/owned/original.txt');assert.throws(()=>check(root,join(parent,'new')),/IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING/);assert.deepEqual(readdirSync(parent),['original.txt'])})
test('keeps the original committed-marker rejection at the evidence container',()=>{const root=fixture('marker'),p=join(root,'goal-1/evidence');mkdirSync(p,{recursive:true});writeFileSync(join(p,'audit.json'),'keep');git(root,'add','.');git(root,'-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-m','original marker');assert.throws(()=>check(root,p),/IMMUTABLE_TASK_EVIDENCE/);assert.equal(readFileSync(join(p,'audit.json'),'utf8'),'keep')})
test('keeps malformed argument rejection before any output is created',()=>{const root=fixture('arguments'),before=process.argv;try{process.argv=['node','fixture','--output-dir'];assert.throws(()=>evidenceDirectory(root,'audit.json'),/Usage:/);assert.deepEqual(readdirSync(root),['.git'])}finally{process.argv=before}})
test('rejects an untracked existing marker including an empty failed report',()=>{const root=fixture('empty-marker'),p=join(root,'goal-1/evidence/owned');mkdirSync(p,{recursive:true});writeFileSync(join(p,'audit.json'),'');assert.throws(()=>check(root,p),/EVIDENCE_ARTIFACT_ALREADY_EXISTS/);assert.equal(readFileSync(join(p,'audit.json'),'utf8'),'');assert.deepEqual(readdirSync(p),['audit.json'])})
test('rejects a partial snapshot before an absent summary can be rewritten',()=>{const root=fixture('partial'),p=join(root,'goal-1/evidence/owned');mkdirSync(p,{recursive:true});writeFileSync(join(p,'partial.json'),'original partial');assert.throws(()=>check(root,p,'audit.json',['partial.json']),/EVIDENCE_ARTIFACT_ALREADY_EXISTS/);assert.equal(readFileSync(join(p,'partial.json'),'utf8'),'original partial');assert.equal(existsSync(join(p,'audit.json')),false)})
