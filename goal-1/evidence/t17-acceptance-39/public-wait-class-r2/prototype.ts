import fs from 'node:fs'
import path from 'node:path'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {playableAdvanceDate} from '../../../../src/application/playable-advance.ts'
import {publicFeedbackSince} from '../../../../src/application/public-feedback.ts'
import {courseWaitDate} from '../../../../src/ui/course-wait-date.ts'
import {canonicalJson} from '../../../../src/core/identity.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
import type {WorkbenchProjection} from '../../../../src/application/workbench-projection.ts'
const root='goal-1/evidence/t17-acceptance-39',out=root+'/public-wait-class-r2',source='goal-1/evidence/t17-acceptance-36/chrome-final-r10/f04-final97-question-action-reading-unchanged.json',raw=fs.readFileSync(source,'utf8'),codec=createCampaignCodec(),goal='2023-03-31',put=(name:string,data:string)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,data,{flag:'wx'})}
async function open(name:string){let n=0;const store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-class-proto-'+name+'-'+(++n)});await controller.initialize();await controller.importNew(raw);return {controller,close:async()=>{await controller.close();await store.close()}}}
const stepped=await open('stepped'),direct=await open('direct'),start=stepped.controller.snapshot.view!,oldFirstStop=courseWaitDate(start.features.workbench as WorkbenchProjection,start.date,goal),rows:unknown[]=[]
let firstMeaningful:string|null=null
try{
 for(let i=0;i<48;i++){
  const before=stepped.controller.snapshot.view!,w=before.features.workbench as WorkbenchProjection
  if(before.date>=goal)break
  if(w.pause||w.progression.requiresDelivery){firstMeaningful=before.date;break}
  const requested=w.progression.nextDate<=goal?w.progression.nextDate:goal,date=playableAdvanceDate(w,before.date,requested),command=stepped.controller.prepare('AdvanceTime',{date})
  const preview=stepped.controller.preview(command);if(!preview.allowed)throw Error('ORIGINAL_PREVIEW:'+preview.reasonCodes.join(','))
  const result=await stepped.controller.submit(command);if(result.status!=='saved')throw Error('ORIGINAL_SAVE')
  const after=stepped.controller.snapshot.view!,feedback=publicFeedbackSince(before,after)
  rows.push({date:after.date,revision:after.revision,commandId:command.commandId,feedback})
  if(feedback.some(f=>f.attention==='pause')){firstMeaningful=after.date;break}
 }
 const end=stepped.controller.snapshot.view!;if(!rows.length)throw Error('NO_REAL_TIME_COMMAND')
 const result=await direct.controller.submit(direct.controller.prepare('AdvanceTime',{date:end.date}));if(result.status!=='saved')throw Error('DIRECT_ORIGINAL_TIME_NOT_SAVED')
 const a=codec.import(stepped.controller.exportSaved()),b=codec.import(direct.controller.exportSaved()),fields=['phase','economy','operations','market','video','course','relay','deepseek','life','story','journey','routines','random','world','timeline'] as const,equality=fields.map(field=>({field,equal:canonicalJson(a[field])===canonicalJson(b[field])}))
 put('stepped-normal-model.json',stepped.controller.exportSaved());put('direct-normal-model.json',direct.controller.exportSaved())
 const report={at:new Date().toISOString(),scope:'Normal original97 class prototype; public after-save observation plus original AdvanceTime only, no private queue/future decisions, no production loop or new Native.',source,requestedGoal:goal,oldFirstStop,actualFirstMeaningful:firstMeaningful,actualEnd:end.date,steps:rows,comparison:'Same actual end date through one original command versus observed original steps; command receipts/causes intentionally differ',equality,allComparedSimulationFieldsEqual:equality.every(r=>r.equal),newNative:0,productionLoopImplemented:false,compatibility:0}
 put('result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({oldFirstStop,actualFirstMeaningful:firstMeaningful,actualEnd:end.date,steps:rows.length,equality,productionLoopImplemented:false}))
}finally{await stepped.close();await direct.close()}
