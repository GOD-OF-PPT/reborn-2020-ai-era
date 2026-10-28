import fs from 'node:fs'
import path from 'node:path'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {evaluateCommand} from '../../../../src/core/commands.ts'
import {actionBudget} from '../../../../src/core/economy.ts'
import type {PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
import {ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-39',out=root+'/same-run-course-relay-r75',input=root+'/same-run-course-relay-r73/stage-b-normal.json',codec=createCampaignCodec(),factory=new IDBFactory()
const store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'cux09-same-run-mixed-wait-r75'}),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'cux09-same-run-mixed-wait-r75'})
let serial=0,reference=codec.import(fs.readFileSync(input,'utf8'))
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-mixed-d-'+(++serial)})
const current=()=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures}}
const put=(name:string,value:unknown)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
const reports:unknown[]=[],acks:unknown[]=[]
function replayNew(){
 const actual=codec.import(controller.exportSaved())
 for(const r of actual.receipts.slice(reference.receipts.length)){
  const command={...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore},result=evaluateCommand(reference,command,codec.registry,'player')
  if(result.status!=='proposed')throw Error('INDEPENDENT_ORIGINAL_REPLAY_REJECTED')
  reference=codec.import(codec.export(result.nextRun))
 }
 if(codec.export(reference)!==controller.exportSaved())throw Error('INDEPENDENT_ALL_DOMAIN_RAW_MISMATCH')
 return actual
}
function responsibilities(){
 const p=current(),c=p.features.course!.cohorts.find(x=>x.id==='crs:179bc59c6ed7ab5eb7ab116ab5979a0e')!,r=p.features.relay!.periods.find(x=>x.id==='rly:0d20511895585e6886ca7eb313b59d41')!
 if(!c||!r||c.closedAt!==null||c.stages[1]!.deliveredAt!==null||!c.students.some(x=>x.paidRemainingFen>0))throw Error('ORIGINAL_COURSE_RESPONSIBILITY_LOST')
 return {date:p.view.date,revision:p.view.revision,course:{id:c.id,closedAt:c.closedAt,stages:c.stages,supportJobs:c.supportJobs,paidStudents:c.students.length},relay:{id:r.id,status:r.status,job:r.job,supportJob:r.supportJob,observedDays:r.observedDays,reportedUnits:r.reportedUnits},accounts:p.view.accounts,budget:p.view.budget,q2Budget:actionBudget(reference.economy,'2025-04-02'),changes:p.features.relay!.changes}
}
let error:string|null=null
try{
 await controller.initialize();await controller.importNew(fs.readFileSync(input,'utf8'))
 if(current().view.revision!==168||current().view.runId!=='normal-course-content_employee-453bb7c2')throw Error('EXACT_NORMAL168_REQUIRED')
 const changes=current().features.relay!.changes.filter(c=>c.businessId==='ops:3dc059a3c7736a118fb448ed2018a9c9'&&c.acknowledgedAt===null)
 if(changes.length){
  const command=controller.prepare('AcknowledgeRelayMarket',{businessId:'ops:3dc059a3c7736a118fb448ed2018a9c9'}),preview=controller.preview(command)
  if(!preview.allowed)throw Error('ORIGINAL_MARKET_RESPONSE_REJECTED')
  const result=await controller.submit(command);acks.push({command,preview,result,changeIds:changes.map(c=>c.id)})
  if(result.status!=='saved')throw Error('ORIGINAL_MARKET_RESPONSE_NOT_SAVED')
  replayNew()
 }
 put('mixed-before.json',controller.exportSaved());put('before-public-responsibilities.json',responsibilities())
 for(let turn=0;turn<3;turn++){
  const before=current().view,beforeRaw=controller.exportSaved(),command=controller.prepare('AdvanceTime',{date:'2025-04-02'}),preview=controller.preview(command)
  if(!preview.allowed)throw Error('ORIGINAL_WAIT_PREVIEW_REJECTED:'+preview.reasonCodes.join(','))
  const result=await controller.waitForFeedback(command),actual=replayNew()
  if(!result.steps.length||result.steps.some(s=>actual.receipts.find(r=>r.commandId===s.commandId)?.kind!=='AdvanceTime')||await physical.exportStored(actual.runId)!==controller.exportSaved())throw Error('ORIGINAL_WAIT_DURABILITY_REQUIRED')
  const report={turn:turn+1,command,preview,status:result.status,reasonCodes:result.reasonCodes,from:before.date,to:current().view.date,beforeRevision:before.revision,afterRevision:current().view.revision,steps:result.steps,feedback:result.feedback,independentRawByteEqual:true,physicalRawByteEqual:true,sourceBeforeBytes:Buffer.byteLength(beforeRaw),public:responsibilities()}
  reports.push(report);put('wait-'+(turn+1)+'-normal.json',controller.exportSaved());put('wait-'+(turn+1)+'-result.json',report)
  const date=current().view.date
  if(turn===0&&date==='2025-03-31'||turn===1&&date==='2025-04-01')continue
  break
 }
 put('mixed-final.json',controller.exportSaved())
 put('result.json',{at:new Date().toISOString(),scope:'Normal same-run mixed course/service original public waiting; independent original-command full raw equality and physical saved head, not Native/human.',input:ident(input),acknowledgements:acks,waits:reports,final:responsibilities(),newNative:0,compatibility:0})
}catch(e){error=String(e);put('failure.json',{at:new Date().toISOString(),error,date:current().view.date,revision:current().view.revision,newNative:0,compatibility:0});put('last-saved.json',controller.exportSaved());process.exitCode=1}
finally{put('acks.json',acks);console.log(JSON.stringify({error,date:current().view.date,revision:current().view.revision,waits:reports.length,newNative:0,compatibility:0}));await controller.close(true);await physical.close();await store.close()}
