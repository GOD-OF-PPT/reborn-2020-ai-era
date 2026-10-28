import fs from 'node:fs'
import path from 'node:path'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {playableAdvanceDate} from '../../../../src/application/playable-advance.ts'
import {playerThread} from '../../../../src/ui/player-thread.ts'
import {courseFocusFor} from '../../../../src/ui/course-player-thread.ts'
import type {PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
import {ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-39',out=root+'/normal-course-boundary-r43',input=root+'/chrome-reentry-r7/r7-08-new108-current-source-completed.json'
const original=fs.readFileSync(input,'utf8'),source=ident(input),script=ident(out+'/derive.ts'),codec=createCampaignCodec()
let serial=0
const store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-normal-course-boundary-r43'})
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-boundary-'+(++serial)})
const put=(name:string,value:unknown)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
const current=()=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures}}
const observations:unknown[]=[],commands:unknown[]=[]
let stoppedReason:string|null=null
try{
 await controller.initialize();await controller.importNew(original)
 const start=current(),cohorts=start.features.course!.cohorts
 if(cohorts.length!==1)throw Error('EXACT_ORIGINAL_CLASS_REQUIRED')
 const id=cohorts[0]!.id,lesson=start.features.course!.courses.find(c=>c.id===cohorts[0]!.courseId)!
 const target={kind:'cohort' as const,businessId:lesson.businessId,courseId:lesson.id,cohortId:id}
 const observe=()=>{
  const p=current(),co=p.features.course!.cohorts.find(c=>c.id===id)!,recovered=playerThread(p),selected=playerThread(p,courseFocusFor(p,target))
  observations.push({date:p.view.date,revision:p.view.revision,cohortId:id,status:co.status,closedAt:co.closedAt,delivered:co.stages.map(s=>s.deliveredAt),supportSatisfied:co.supportSatisfied,retained:co.students.filter(s=>s.paidRemainingFen>0).length,defaultFocus:recovered.focus,defaultStage:recovered.stage,explicitStage:selected.stage,explicitScope:selected.focusScope,explicitResult:selected.outcome})
 }
 observe()
 for(let step=0;step<64&&current().view.date<'2023-05-01';step++){
  const p=current(),w=p.features.workbench
  let kind='AdvanceTime',payload:unknown
  if(w.pause){
   const events=w.events.filter(e=>e.isBlocking),event=events.length===1?events[0]:undefined,choice=event?.choices.find(c=>c.isDefault&&c.costFen===0&&c.actionPoints===0)
   if(!event||!choice){stoppedReason='PUBLIC_CHOICE_REQUIRES_SEPARATE_TEST_INPUT';break}
   kind='ChooseEvent';payload={instanceId:event.id,choiceId:choice.id}
  }else if(w.progression.requiresDelivery){stoppedReason='ORIGINAL_MANUAL_DELIVERY_REQUIRED';break}
  else{
   const wanted=w.atQuarterEnd?w.progression.nextQuarterDate: w.progression.nextDate<'2023-05-01'?w.progression.nextDate:'2023-05-01'
   if(!wanted){stoppedReason='PUBLIC_CLOCK_TARGET_UNAVAILABLE';break}
   payload={date:playableAdvanceDate(w,p.view.date,wanted)}
  }
  const command=controller.prepare(kind,payload),preview=controller.preview(command)
  if(!preview.allowed){stoppedReason=preview.reasonCodes.join(',');break}
  const result=await controller.submit(command)
  commands.push({command,status:result.status,reasons:result.reasonCodes,actualDate:current().view.date,actualRevision:current().view.revision})
  if(result.status!=='saved'){stoppedReason='ORIGINAL_COMMAND_NOT_SAVED';break}
  observe()
 }
 const p=current(),co=p.features.course!.cohorts.find(c=>c.id===id)!,recovered=playerThread(p),selected=playerThread(p,courseFocusFor(p,target))
 const reached=p.view.date==='2023-05-01',closedCurrent=co.closedAt!==null&&co.closedAt>=p.features.workbench.quarterStart&&co.closedAt<=p.view.date,focusMismatch=closedCurrent&&(recovered.focus.kind!=='course'||recovered.focus.courseTarget?.kind!=='cohort'||recovered.focus.courseTarget.cohortId!==id)
 put('normal-final.json',controller.exportSaved());put('public-observations.json',observations);put('original-commands.json',commands)
 const report={at:new Date().toISOString(),scope:'Original normal108 model continued through public original clock/explicit free default test choices only; no Native, future queue or synthetic class.',input:source,script,reached,date:p.view.date,revision:p.view.revision,stoppedReason,cohortId:id,closedAt:co.closedAt,closedInCurrentQuarter:closedCurrent,defaultFocus:recovered.focus,defaultStage:recovered.stage,explicitStage:selected.stage,explicitScope:selected.focusScope,foundRecoveryDefect:focusMismatch,commands:commands.length,newNative:0,compatibility:0}
 put('result.json',report);console.log(JSON.stringify(report))
 process.exitCode=focusMismatch?1:reached?0:2
}finally{await controller.close(true);await store.close()}
