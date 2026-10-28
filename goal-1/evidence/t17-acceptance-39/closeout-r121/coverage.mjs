import fs from 'node:fs';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39',out=root+'/closeout-r121';
const read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const id=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b),mode:fs.lstatSync(p).mode&0o777}};
const same=(a,b)=>['bytes','sha256','mode'].every(k=>a[k]===b[k]);
const current=read(root+'/build-r24.source-after.json').files;
if(current.length!==673||current.some(x=>!same(x,id(x.path))))throw Error('EXACT_CURRENT673_REQUIRED');
const source=new Map(current.map(x=>[x.path,x]));
const bindings=read(root+'/final-cux09-admission-r114/current-original-consumer-bindings.json');
if(bindings.consumerCount!==23||bindings.exactProductionConsumers.some(x=>!same(x,id(x.path))))throw Error('ORIGINAL_CONSUMER_BINDINGS_CHANGED');
const u0=read('goal-1/evidence/t17-acceptance-36/owned-ui-r10.json').rows;
const u5=read('goal-1/evidence/t17-acceptance-38/closeout-r28/final-owned-manifest.json').ordinary.filter(x=>x.path.startsWith('src/')||x.path.startsWith('assets/'));
const bridge=rows=>rows.map(x=>({path:x.path,oldSha256:x.sha256,current:source.get(x.path),unchangedSinceOriginal:same(x,source.get(x.path)??{})}));
const vitest=read(root+'/cumulative-r104.vitest.json'),rerun=read(root+'/original-refund-file-r116.vitest.json');
if(vitest.numTotalTests!==1522||vitest.numPassedTests!==1521||vitest.numFailedTests!==1||vitest.numPendingTests!==0||rerun.numTotalTests!==21||rerun.numPassedTests!==21||rerun.numFailedTests!==0)throw Error('EXACT_LAYERED_TEST_RESULTS_REQUIRED');
const categories={};
for(const x of vitest.testResults){const name=x.name.split('/').at(-1);const group=/ecosystem|deepseek|Ecosystem|Deepseek/.test(name)?'U5_ecosystem':/relay|Relay/.test(name)?'U4B_relay':/opening|Opening|u0r|player-thread|RoomMoment|course|Course|life|Life|season|App\.|Clock|scene|Scene|wait|Wait/.test(name)?'U0R_and_shared':'other_noncompat';const row=categories[group]??={files:0,passed:0,failed:0,pending:0};row.files++;for(const t of x.assertionResults)row[t.status==='passed'?'passed':t.status==='failed'?'failed':'pending']++}
const isolated=read(out+'/isolated-source.json');
for(const p of ['isolated-type','isolated-build']){const x=read(out+'/'+p+'.result.json');if(x.exitCode!==0||!x.sourceUnchanged||x.p3WipIncluded!==0)throw Error('ISOLATED_CHECK_REQUIRED:'+p)}
const remaining=read('goal-1/evidence/t17-acceptance-37/final-u4b-admission-r1/remaining.json');
const report={at:new Date().toISOString(),scope:'C-UX09 U0-R/U4-B/U5 cumulative autonomous implementation review; author review, not human or independent external acceptance',source:current,sourceCount:673,originalRelay:{consumerCount:23,exactConsumers:bindings.exactProductionConsumers,abilities:bindings.historicalAbilityTrace,requirements:bindings.historicalRequirementGroups,originalDetailedChainRetained:true,historyNotNewNative33:true,changedSharedSeams:bindings.changedSeams,currentProof:['cumulative-r104.vitest.json','original-refund-file-r116.vitest.json','cumulative-debug-r53/validation.md','cumulative-debug-r90/validation.md','normal-native-audit-r103/normal-browser-export-audit.json','readback-cash-r110.json'],nativeBounds:remaining.remaining.find(x=>x.id==='special-native-bounds'),unconnectedNotCounted:['src/ui/relay-records.ts']},u0Bridge:bridge(u0),u5Bridge:bridge(u5),currentWholeBatch:{files:vitest.testResults.length,total:1522,passed:1521,failed:1,pending:0,exitCode:1,categories,wholeOriginalFailedFileR116:{files:1,total:21,passed:21,exitCode:0},notSingleBatchGreen:true},isolated:{source:isolated.source,relativeImports:isolated.relativeImports,resolved:isolated.allRelativeImportsResolved,plannedRecordRawInputs:isolated.plannedRecords,type:0,build:0,p3WipIncluded:0,notIndependentRuntimeOrWholeTests:true},coreOrRulesOrSchemaOwnedChanges:0,p3Frozen:26,compatibility:0,wholeGoalComplete:false};
guard(out);fs.writeFileSync(out+'/coverage.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:673,relayConsumers:23,relayAbilities:report.originalRelay.abilities.length,relayRequirements:report.originalRelay.requirements.length,u0:{count:u0.length,same:report.u0Bridge.filter(x=>x.unchangedSinceOriginal).length},u5:{count:u5.length,same:report.u5Bridge.filter(x=>x.unchangedSinceOriginal).length},isolatedTypeBuild:true,categories}));
