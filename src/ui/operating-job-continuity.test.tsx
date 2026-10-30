import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactNode} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-worker-r329/prelude-r1/before-winddown.json?raw'
import signRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import {addDays} from '../core/calendar.ts'
import {sceneWorks} from './SceneJournal.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {equityBusinessContinuity} from './equity-business-continuity.ts'
import {EquityBusinessContinuity} from './EquityBusinessContinuity.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {operatingJobMoney} from './operating-job-money.ts'
import {operatingJobTargetFor,resolveOperatingJob} from './operating-job-target.ts'

// An actually saved normal82→92 public-command prefix, with an employed worker,
// a running cross-business job and a planned own job. No projection is invented.
async function attached(name:string,text:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(text)
 expect(controller.snapshot.view!.origin).toBe('normal')
 return {codec,store,controller,close:async()=>{await controller.close();await store.close()}}
}
let source:Awaited<ReturnType<typeof attached>>
beforeAll(async()=>{source=await attached('u6-real-worker-record',raw)})
afterAll(async()=>{await source?.close()})
function props():GamePanelProps{
 const view=source.controller.snapshot.view!,features=view.features as unknown as PlayFeatures
 const company=features.deepseek!.businesses.filter(b=>b.definitionId==='ecosystem-service')
 expect(company).toHaveLength(1)
 return {controller:source.controller,view,features,accountId:company[0]!.accountId,request:vi.fn()}
}
function frontText(node:ReactNode):string{
 if(typeof node==='string'||typeof node==='number')return String(node)
 if(Array.isArray(node))return node.map(frontText).join(' ')
 if(!isValidElement<{children?:ReactNode}>(node)||node.type==='details')return ''
 return frontText(node.props.children)
}

it('keeps the actual planned maintenance identity in the calendar rather than opening a new ecosystem cooperation',()=>{
 const p=props(),job=p.view.operations!.jobs.find(j=>j.definitionId==='service-maintenance'&&j.status==='planned')!
 const work=sceneWorks(p).find(w=>w.id===job.id)!
 expect(work).toMatchObject({accountId:p.accountId,operatingJobTarget:{runId:p.view.runId,accountId:p.accountId,businessId:job.businessId,jobId:job.id}})
 expect(work.title).not.toBe('DeepSeek生态与架空股权')
 expect(work.cost).toContain('企业账户')
 expect(source.controller.exportSaved()).toBe(raw)
})

it('passes the same original task from the main thought and object to its decision, not an uncommitted service entry',()=>{
 const p=props(),job=p.view.operations!.jobs.find(j=>j.definitionId==='service-maintenance'&&j.status==='planned')!
 const work=sceneWorks(p).find(w=>w.id===job.id)!,moment=roomMoment(p)
 expect(moment.inspect).toHaveProperty('operatingJobTarget')
 expect(Reflect.get(moment.inspect!,'operatingJobTarget')).toEqual(Reflect.get(work,'operatingJobTarget'))
 expect(source.controller.exportSaved()).toBe(raw)
})

it('makes actual affected100 paid and100 reserved visible while keeping the narrow equity fees separate from103.33 accrued costs',()=>{
 const p=props(),business=p.features.deepseek!.businesses.find(b=>b.definitionId==='ecosystem-service')!
 const value=equityBusinessContinuity(p,business.id)!,text=frontText(EquityBusinessContinuity({value}))
 expect(value.costs.paidFen).toBe(0);expect(value.costs.reservedFen).toBe(0)
 expect(value.own).toHaveLength(1);expect(value.elsewhere).toHaveLength(1);expect(value.workers).toHaveLength(1)
 expect(text).toContain('¥100');expect(text).toContain('¥103.33')
 expect(text).toContain('¥4,983.88');expect(text).toContain('¥4,883.88')
 expect(source.controller.exportSaved()).toBe(raw)
})

it('actually releases only the planned100 and1AP while preserving the cross-job paid100, spent2AP and real103.33 stopping settlement',()=>{
 const p=props(),run=source.codec.import(raw),business=p.features.deepseek!.businesses.find(b=>b.definitionId==='ecosystem-service')!
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'worker-ui-original-stop',expectedRevision:run.revision,kind:'WindDownBusiness',payload:{businessId:business.id}},source.codec.registry,run.actorId)
 expect(result.status).toBe('proposed');if(result.status!=='proposed')throw Error('ORIGINAL_STOP_REQUIRED')
 const after=source.codec.import(source.codec.export(result.nextRun)),view=projectRun(after)
 expect(view.accounts.find(a=>a.accountId===business.accountId)).toMatchObject({cashFen:488055,heldFen:0,availableFen:488055})
 expect(view.accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(27140000)
 expect(view.budget).toMatchObject({available:2,spent:2,reserved:0})
 expect(after.operations!.workers[0]!.to).toBe('2025-04-01')
 expect(after.operations!.jobs.find(j=>j.definitionId==='service-maintenance')!.status).toBe('cancelled')
 expect(after.operations!.jobs.find(j=>j.definitionId==='business-preparation')!.status).toBe('interrupted')
 expect(after.operations!.businesses.find(b=>b.definitionId==='investment-plan')!.lifecycle).toBe('operating')
 expect(source.controller.exportSaved()).toBe(raw)
})

it('keeps a missing original reservation unknown while retaining independently verified cross-business payment',()=>{
 const p=props(),job=p.view.operations!.jobs.find(j=>j.definitionId==='service-maintenance')!
 const missing={...p,features:{...p.features,workbench:{...p.features.workbench,finance:p.features.workbench.finance.map(f=>f.accountId===p.accountId?{...f,reservations:f.reservations.filter(r=>r.originId!==job.actionId)}:f)}}}
 expect(operatingJobMoney(missing,job)).toMatchObject({paidFen:0,reservedFen:null})
 const value=equityBusinessContinuity(missing,job.businessId)!,text=frontText(EquityBusinessContinuity({value}))
 expect(text).toContain('¥100');expect(text).toContain('金额待核对');expect(text).not.toContain('未开工原预留¥0')
 expect(source.controller.exportSaved()).toBe(raw)
})

it('refuses a wrong owner, duplicate job and accessor-backed original target without reading a getter or replacing the task',()=>{
 const p=props(),job=p.view.operations!.jobs.find(j=>j.definitionId==='service-maintenance')!,target=operatingJobTargetFor(p,job)!
 expect(resolveOperatingJob(p,target).status).toBe('valid')
 for(const value of[{...target,accountId:'personal'},{...target,runId:'another-life'},{...target,jobId:'missing-original'},{...target,extra:'another-owner'}])expect(resolveOperatingJob(p,value).status).toBe('invalid')
 const duplicate={...p,view:{...p.view,operations:{...p.view.operations!,jobs:[...p.view.operations!.jobs,job]}}}
 expect(resolveOperatingJob(duplicate,target).status).toBe('invalid')
 let read=false
 const getter={...target,get jobId(){read=true;return job.id}}
 expect(resolveOperatingJob(p,getter).status).toBe('invalid');expect(read).toBe(false)
 expect(source.controller.exportSaved()).toBe(raw)
})

it('routes an actually scheduled normal negotiation to its own equity pane and original record from the calendar',async()=>{
 const normal=await attached('u6-real-equity-calendar',signRaw)
 try{
  const before=normal.controller.snapshot.view!,features=before.features as unknown as PlayFeatures,invitation=features.deepseek!.invitations.find(i=>i.authority&&i.financingConsent&&i.status==='open')!
  const command=normal.controller.prepare('StartEquityNegotiation',{invitationId:invitation.id,acquisitionKind:'secondary',termsId:'liquidity',amountFen:800000,resources:['player-production'],startAt:addDays(before.date,1)})
  expect(normal.controller.preview(command).allowed).toBe(true);expect((await normal.controller.submit(command)).status).toBe('saved')
  const view=normal.controller.snapshot.view!,next=view.features as unknown as PlayFeatures,n=next.deepseek!.negotiations.at(-1)!,p={view,features:next},business=next.deepseek!.businesses.find(b=>b.id===n.businessId)!
  expect(n.job?.status).toBe('planned')
  expect(sceneWorks(p).find(w=>w.id===n.job!.id)).toMatchObject({screen:'deepseek',accountId:business.accountId,deepseekPane:'equity',equityTarget:{runId:view.runId,accountId:business.accountId,businessId:n.businessId,kind:'negotiation',recordId:n.id}})
 }finally{await normal.close()}
})
