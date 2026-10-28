import fs from 'node:fs';
import {ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39',out=root+'/final-cux09-admission-r114';
guard(out);
const baseline=JSON.parse(fs.readFileSync(root+'/baseline.json')),base=new Map(baseline.sourceAndAssets.map(x=>[x.path,x]));
const current=JSON.parse(fs.readFileSync(root+'/build-r24.source-after.json')).files;
const same=(a,b)=>['bytes','sha256','mode'].every(k=>a[k]===b[k]);
const owned=current.filter(x=>!base.has(x.path)||!same(x,base.get(x.path)));
if(owned.length!==54||current.some(x=>!same(ident(x.path),x)))throw Error('EXACT_CURRENT54_REQUIRED');
const names=['RelayPanel.tsx','RelaySceneChoice.tsx','RelayPreparationEditor.tsx','RelayServiceChoice.tsx','RelayResponseEditor.tsx','relay-preparation-draft.ts','relay-scene-draft.ts','relay-response-draft.ts','RelayCommandDetails.tsx','RelayResponseCommandDetails.tsx','RelayRecordBook.tsx','relay-record-memory.ts','relay-record-meaning.ts','relay-ticket-command.ts','relay-work-target.ts','relay-next-service-contract.ts','relay-correction-effects.ts','relay-support-settlement.ts','relay-scene-target.ts','CommandButton.tsx','CommandDetails.tsx','shared-action.ts','journey-intent.ts'];
const consumers=names.map(name=>{const path='src/ui/'+name,b=base.get(path);if(!b)throw Error('CONSUMER_NOT_IN_BASELINE:'+path);const x=ident(path);if(!same(x,b))throw Error('CONSUMER_CHANGED:'+path);return x});
const old=JSON.parse(fs.readFileSync('goal-1/evidence/t17-acceptance-37/final-u4b-admission-r1/coverage.json'));
if(old.originalAbilities.items.length!==33||old.requirements.length!==12)throw Error('ORIGINAL33_AND12_REQUIRED');
const put=(name,value)=>{guard(out);fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})};
put('source-prepare-error-r2.json',{attempt:2,error:'Two guessed result production names were actually test names; no product modules with those names.',notInBaseline:['relay-correction-result.ts','relay-station-stop-result.ts'],sourceChanges:0,indexChanges:0,admissionPublished:false});
put('plan.md',`# 当前C-UX09准入准备，尚未准入

仅整理54产品/测试/素材及AGENTS/docs36共56个feature白名单，不改源码/index，不结束task。R104真实全批终态和最终全责任/保全后才准入/提交。三master与root39另record，原P326和master2304B14LF插入不stage；测试基于含P3的工作树，不冒裸HEAD独立通过。

原33逐字段链及12责任表保历史身份。当前23条已逐项核定的实际构造/编辑/完整原账/确认/公共动作源字节同，支撑原能力完整静态保全；relay显示/关注/等待和共享App/Clock/Dialog/controller/scene-result/scene-meaning/player-thread为本片修改，按当前消费者/Native/原文另核，不把旧表或文件数冒新Native33。两次准备错误均是误认生产模块文件名，未写产品/index或准入；当前从实际baseline逐项匹配，不再猜名。

未接线relay-records.ts不计功能；原多期单batch/退款短款后付Native界限、PNG/真人及后续完整组合保。先MD再最终JSON，当前admitted=false，全量仍须真实终态。兼容开发测试0，无发布或外部资源。
`);
put('proposed-feature-paths.json',{at:new Date().toISOString(),base:baseline.head,productCount:54,product:owned,docs:[ident('AGENTS.md'),ident('docs/36-mainline-and-art-reconstruction-plan.md')],featureCount:56,notStaged:true,currentFullBatchTerminalRequired:true,p3Excluded:26,masterInsertionExcluded:true,wholeGoalComplete:false});
put('current-original-consumer-bindings.json',{at:new Date().toISOString(),scope:'Current production source bindings and historical detailed payload chains; static conditional preservation, not fresh Native33',exactProductionConsumers:consumers,consumerCount:23,historicalCoverageSource:'goal-1/evidence/t17-acceptance-37/final-u4b-admission-r1/coverage.json',historicalAbilityTrace:old.originalAbilities.items,historicalRequirementGroups:old.requirements,historicalStatusesNotCurrentReexecution:true,changedSeams:['src/ui/relay-continuity.ts','src/ui/relay-player-thread.ts','src/ui/relay-scene-clock.ts','src/ui/App.tsx','src/ui/ClockAdvance.tsx','src/ui/Dialog.tsx','src/application/game-controller.ts','src/ui/scene-result.ts','src/ui/scene-meaning.ts','src/ui/player-thread.ts'],currentEvidence:['cumulative-debug-r53/validation.md','cumulative-debug-r90/validation.md','readback-cash-r110.json','normal-native-audit-r103/normal-browser-export-audit.json','normal-native-audit-r105/normal-browser-export-audit.json'],unconnectedNotCounted:['src/ui/relay-records.ts'],admitted:false,currentFullBatch:'R104 true terminal required',compatibility:0});
console.log(JSON.stringify({preparedFeature:56,product:54,exactProduction:23,originalAbilities:33,requirementGroups:12,admitted:false,sourceOrIndexChanged:false}));
