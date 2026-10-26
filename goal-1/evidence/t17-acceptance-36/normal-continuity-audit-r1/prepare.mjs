import fs from 'node:fs'
import path from 'node:path'
import {repo,root,directory,original,output,read,put,mkdir,sources,dependencies,originalInput,same,guard} from './io.mjs'
guard(output)
const baseline=JSON.parse(read(root+'/baseline.json').bytes),oldContract='goal-1/evidence/t17-acceptance-34/audit-preparation-r1/official-source-contract-r1.json',authority=JSON.parse(read(oldContract).bytes),official=sources()
if(official.length!==126||!same(official,authority.officialSources))throw Error('ORIGINAL_OFFICIAL_126_CHANGED')
const shape=row=>({path:row.path,bytes:row.bytes,sha256:row.sha256,mode:row.mode}),p3=baseline.p3.map(row=>{const actual=read(row.path).identity;if(!same(actual,shape(row)))throw Error('P3_BASELINE_CHANGED:'+row.path);return actual})
if(p3.length!==26||!same(p3,authority.p3.map(shape)))throw Error('ORIGINAL_P3_26_REQUIRED')
const input=originalInput(),references=[root+'/baseline.json',oldContract,'goal-1/evidence/t17-acceptance-34/audit-preparation-r1/run-audit.mjs','goal-1/evidence/t17-acceptance-34/account-readback-r1/readback.mjs','goal-1/evidence/t17-acceptance-34/account-readback-r1/run-once.mjs','scripts/browser_evidence_guard.mjs','package.json','package-lock.json',...['input.md','plan.md','io.mjs','prepare.mjs','readback.mjs','run-once.mjs'].map(name=>directory+'/'+name)].map(name=>read(name).identity)
const baseMap=new Map(baseline.sourceAndAssets.map(row=>[row.path,row]));for(const row of official){const expected=baseMap.get(row.path);if(expected&&!same(shape(expected),row))throw Error('OFFICIAL_SOURCE_DIFFERS_FROM_ROOT36_BASELINE:'+row.path)}
mkdir('input');mkdir('input/chrome-normal-r1')
const snapshots=[]
for(const name of ['exports.jsonl',...input.records.map(row=>path.basename(row.identity.path))]){const bytes=read(original+'/'+name).bytes;put('input/chrome-normal-r1/'+name,bytes);snapshots.push(read(directory+'/input/chrome-normal-r1/'+name).identity)}
const journal=read(original+'/native-progress.jsonl');put('normal-native-progress.snapshot.jsonl',journal.bytes);snapshots.push(read(directory+'/normal-native-progress.snapshot.jsonl').identity)
const dependencyRows=dependencies()
put('frozen-contract.json',{at:new Date().toISOString(),officialSourceCount:official.length,officialSources:official,p3,references,dependencies:dependencyRows,input,snapshots,nativeJournalPrefix:{original:journal.identity,snapshot:directory+'/normal-native-progress.snapshot.jsonl',prefixOnly:true},scope:'Exact original four saved UI exports only. Native copies are identity-bound input snapshots, not new exports or outcomes. No UI files/imports frozen; official sources and both transitive external packages plus Node executable frozen.'})
console.log(JSON.stringify({prepared:true,officialSourceCount:official.length,p3:p3.length,dependencyFiles:dependencyRows.length,inputs:input.records.map(row=>({path:row.identity.path,revision:row.publicHeader.revision,bytes:row.identity.bytes,sha256:row.identity.sha256})),command:['rtk','proxy','node',directory+'/run-once.mjs']}))
