import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,campaignRuntime} from '../../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {ecosystemFocusFor,ecosystemJourneyFor} from '../../../../src/ui/ecosystem-player-thread.ts'
import {playerThread} from '../../../../src/ui/player-thread.ts'
import {playableAdvanceDate} from '../../../../src/application/playable-advance.ts'
import type {GamePanelProps,PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root='goal-1/evidence/t17-acceptance-38/guard-and-reading-r21',input='goal-1/evidence/t17-acceptance-38/normal-service-r13/technical_employee-before-contract.json',codec=createCampaignCodec(),hash=(s:string)=>createHash('sha256').update(s).digest('hex'),base=readFileSync(input,'utf8')
let run=codec.import(base),commands=0
const send=(kind:string,payload:unknown)=>{const command={runId:run.runId,actorId:run.actorId,commandId:'u5-normal-end-'+run.revision,expectedRevision:run.revision,kind,payload},result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('ORIGINAL_NORMAL_COMMAND_REJECTED:'+JSON.stringify({kind,payload,result}));run=codec.import(codec.export(result.nextRun));commands++}
const advance=(date:string)=>{for(let i=0;i<250;i++){
 if(run.timeline.pause){if(run.timeline.pause.reason!=='CONTENT_DECISION_PENDING')throw Error('UNHANDLED_ORIGINAL_PAUSE:'+run.timeline.pause.reason);const event=run.world!.instances.find(n=>n.openedBy===run.timeline.pause!.instanceId)!;send('ChooseEvent',{instanceId:event.id,choiceId:campaignRuntime.definition(event.definitionId).defaultChoiceId})}
 else if(run.timeline.cursor.date<date||run.timeline.cursor.phase!=='snapshot'||run.timeline.cursor.priority!==Number.MAX_SAFE_INTEGER||run.timeline.cursor.instanceId!=='')send('AdvanceTime',{date})
 else return
 }throw Error('ORIGINAL_TIME_LOOP_LIMIT')}
const assignment=(startAt:string)=>({resources:['player-production'],startAt}),b=run.operations!.businesses.find(b=>b.definitionId==='ecosystem-service')!
advance('2025-07-01');send('StartEcosystemAdaptation',{businessId:b.id,modelId:'r1',productId:'training',acceptSimulationTerms:true,...assignment('2025-07-01')});advance('2025-07-08');advance('2025-10-01')
send('StartEcoOutreach',{businessId:b.id,modelId:'r1',productId:'training',mode:'paid',sourceCohortIds:[],...assignment('2025-10-01')});advance('2025-10-08')
const lead=run.deepseek!.leads.find(l=>l.businessId===b.id&&l.modelId==='r1'&&l.productId==='training'&&l.status==='open'&&l.maxPriceFen>0)
if(!lead)throw Error('FIXED_NORMAL_OUTREACH_HAS_NO_WILLING_CLIENT_NO_SEED_SUBSTITUTION')
const scope=lead.maxPriceFen>=600000?'standard':'pilot',start=scope==='standard'?'2025-12-13':'2025-12-21'
send('AcceptEcoContract',{leadId:lead.id,scope,...assignment(start)});const contractId=run.deepseek!.contracts.at(-1)!.id
let c=run.deepseek!.contracts.find(c=>c.id===contractId)!;advance(run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt);send('SubmitEcoDelivery',{contractId});c=run.deepseek!.contracts.find(c=>c.id===contractId)!;advance(c.reviewAt!)
c=run.deepseek!.contracts.find(c=>c.id===contractId)!
if(c.status==='rejected'){
 const at=scope==='standard'?'2025-12-24':'2025-12-28';send('StartEcoRemediation',{contractId,...assignment(at)});advance('2025-12-31');c=run.deepseek!.contracts.find(c=>c.id===contractId)!
 if(run.operations!.jobs.find(j=>j.id===c.remediationJobId)!.status==='completed')send('SubmitEcoDelivery',{contractId})
}else{
 advance(run.operations!.jobs.find(j=>j.id===c.supportJobId)!.completeAt)
 for(const d of run.deepseek!.deliveries.filter(d=>d.contractId===contractId&&d.dueAt<=run.timeline.cursor.date&&d.creditFen>0))send('CollectEcoReceivable',{deliveryId:d.id,amountFen:d.creditFen})
 advance('2025-12-31')
}
const raw=codec.export(run),factory=new IDBFactory(),store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'u5-normal-end-wait-reproducer'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
try{
 await controller.initialize();await controller.importNew(raw);const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,p:GamePanelProps={controller,view,features,accountId:b.accountId,request:()=>{}},target={kind:'contract' as const,recordId:contractId,runId:view.runId,businessId:b.id,accountId:b.accountId},focus=ecosystemFocusFor(p,target),journey=ecosystemJourneyFor(p,focus),thread=playerThread(p,focus)
 if(view.origin!=='normal'||view.date!=='2025-12-31'||!features.workbench.atQuarterEnd||journey.action.kind!=='wait'||thread.responsibilityOverrideNeeded||!features.journey?.canEnterEpilogue)throw Error('REAL_NORMAL_END_WAIT_STATE_NOT_REACHED:'+JSON.stringify({date:view.date,atEnd:features.workbench.atQuarterEnd,action:journey.action,responsibility:thread.responsibilityOverrideNeeded,canEnter:features.journey?.canEnterEpilogue}))
 let oldError:string|null=null;try{playableAdvanceDate(features.workbench,view.date,journey.action.date)}catch(error){oldError=error instanceof Error?error.message:String(error)}
 if(oldError!=='PREVIEW_RANGE_ENDED')throw Error('EXPECTED_RENDER_POLICY_REJECTION_NOT_REPRODUCED')
 guard(root);writeFileSync(root+'/normal-end-wait.json',raw,{flag:'wx'});guard(root);writeFileSync(root+'/normal-end-wait-result.json',JSON.stringify({at:new Date().toISOString(),scope:'Normal model branch from original earned70, unchanged fixed seed and actual rules; not Native/human',input,inputSha256:hash(base),seed:run.seed,extraModelCommands:commands,origin:run.origin,runId:run.runId,revision:run.revision,date:view.date,contractId,contractScope:scope,stage:journey.phase,originalWait:journey.action,canEnterOriginalEpilogue:features.journey.canEnterEpilogue,originalConveniencePolicyError:oldError,currentlyEcosystemMomentCallsSamePolicyWithoutRangeGuard:true,bytes:Buffer.byteLength(raw),sha256:hash(raw),newNativeCreate:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({normalEndWaitReproduced:true,scope,stage:journey.phase,wait:journey.action.date,oldError,modelExtraCommands:commands}))
}finally{await controller.close();await store.close()}
