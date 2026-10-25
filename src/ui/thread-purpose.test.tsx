import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {addDays} from '../core/calendar.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {relayBusinessTarget,relayFocusFor} from './relay-player-thread.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import readyRaw from '../../goal-1/evidence/t17-acceptance-31/chrome-main-r5/normal86-sample-actually-ready.json?raw'
import waitingRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r9/r9-saved119-recovery-complete-window-open.json?raw'
import closedRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r9/r9-saved120-class-actually-closed.json?raw'
import relayCapitalRaw from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r3-saved66-explicit-capital.json?raw'

type Element=ReactElement<Record<string,unknown>>
const elements=(node:unknown):Element[]=>Array.isArray(node)?node.flatMap(elements):isValidElement<Record<string,unknown>>(node)?[node,...elements(node.props.children)]:[]
async function original(name:string,raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'purpose-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize()
 if(raw)await controller.importNew(raw)
 else await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'purpose-'+name})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const advance=async(date:string)=>{for(let n=0;n<20;n++){
  const current=p(),w=current.features.workbench
  if(w.pause){const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(current.view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('PURPOSE_ORIGINAL_CLOCK_LIMIT')}
 return {controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}

describe('the original class purpose follows the saved preparation, promise and closure',()=>{
 let ready:Awaited<ReturnType<typeof original>>,waiting:Awaited<ReturnType<typeof original>>,closed:Awaited<ReturnType<typeof original>>
 beforeAll(async()=>{ready=await original('ready',readyRaw)})
 beforeAll(async()=>{waiting=await original('window',waitingRaw)})
 beforeAll(async()=>{closed=await original('closed',closedRaw)})
 afterAll(async()=>{await ready?.close();await waiting?.close();await closed?.close()})
 const courseThread=(f:Awaited<ReturnType<typeof original>>,cohort=false,jobId?:string)=>{
  const p=f.p(),c=p.features.course!.courses[0]!,co=p.features.course!.cohorts[0]!
  return playerThread(p,courseFocusFor(p,cohort?{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id,...(jobId?{jobId}:{})}:{kind:'course',businessId:c.businessId,courseId:c.id}))
 }
 const action=(f:Awaited<ReturnType<typeof original>>,thread=courseThread(f,true))=>{
  const p=f.p(),today=vi.fn(),result=vi.fn(),choose=vi.fn()
  const tree=CourseThreadAction({p,thread,active:true,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today,children:primary=>primary?.main})
  const button=elements(tree).find(e=>e.type==='button')!
  return {p,thread,today,result,choose,button}
 }
 it('leaves the actual ready sample as a preparation endpoint without inventing enrollment',()=>{
  const raw=ready.controller.exportSaved(),thread=courseThread(ready)
  expect(thread.stage).toBe('course-ready');expect(thread.attempt).toContain('样课')
  expect(thread.finishWhen).toContain('准备');expect(thread.finishWhen).toContain('招生')
  expect(ready.p().features.course!.cohorts).toHaveLength(0)
  expect(ready.controller.exportSaved()).toBe(raw)
 })
 it('keeps the actual refund window open after teaching and recovery have completed',()=>{
  const raw=waiting.controller.exportSaved(),thread=courseThread(waiting,true),ui=action(waiting,thread)
  expect(thread.stage).toBe('course-refund-window');expect(thread.attempt).toContain('退款窗口')
  expect(thread.finishWhen).toContain('结算');expect(thread.finishWhen).not.toContain('已经结清')
  expect(ui.button.props.children).toBeDefined();expect(ui.today).not.toHaveBeenCalled()
  expect(waiting.controller.exportSaved()).toBe(raw)
 })
 it('takes the actual closed class straight to today, with the same guarded binding and unchanged original account',()=>{
  const p=closed.p(),raw=closed.controller.exportSaved(),ui=action(closed),thread=ui.thread
  expect(thread.stage).toBe('course-cohort-closed');expect(thread.attempt).toContain('本班')
  expect(thread.object).toMatch(/^始于2023-Q1 · /)
  expect(thread.attempt).not.toContain('样课完成后');expect(thread.finishWhen).toContain('结清')
  expect(elements(ui.button).map(e=>e.props.children).flat().join(' ')).toContain('回到今天，看看接下来的日子')
  ;(ui.button.props.onClick as ()=>void)()
  expect(ui.today).toHaveBeenCalledOnce();expect(ui.result).not.toHaveBeenCalled();expect(ui.choose).not.toHaveBeenCalled()
  expect(ui.p.request).not.toHaveBeenCalled();expect(closed.controller.exportSaved()).toBe(raw)
  expect(closed.p().view.accounts).toEqual(p.view.accounts)
 })
 it('keeps a completed original teaching job attached to the same class rather than treating it as the later closure',()=>{
  const p=closed.p(),co=p.features.course!.cohorts[0]!,job=co.stageJobs.flat().find(j=>j?.status==='completed')!,thread=courseThread(closed,true,job.id),ui=action(closed,thread),raw=closed.controller.exportSaved()
  expect(thread.focusScope).toBe('history');expect(thread.attempt).toContain('回看')
  expect(thread.object).toMatch(/^回看2023-Q1 · /)
  expect(thread.finishWhen).toContain('原记录')
  ;(ui.button.props.onClick as ()=>void)()
  expect(ui.result).toHaveBeenCalledOnce();expect(ui.today).not.toHaveBeenCalled()
  expect(thread.inspect.target?.courseTarget).toMatchObject({cohortId:co.id,jobId:job.id})
  expect(closed.controller.exportSaved()).toBe(raw)
 })
 it('does not use the closed-class shortcut to override a real responsibility gate',()=>{
  // Bounded UI policy input, not another accepted game history or a fabricated debt.
  const thread={...courseThread(closed,true),responsibilityOverrideNeeded:true},ui=action(closed,thread)
  ;(ui.button.props.onClick as ()=>void)()
  expect(ui.today).not.toHaveBeenCalled();expect(ui.result).toHaveBeenCalledOnce()
 })
 it('keeps an invalid original identity explicit without describing a new attempt as already arranged',()=>{
  const p=closed.p(),c=p.features.course!.courses[0]!,focus=courseFocusFor(p,{kind:'course',businessId:c.businessId,courseId:c.id}),raw=closed.controller.exportSaved()
  const thread=playerThread(p,{...focus,runId:'another-life'})
  expect(thread.focusScope).toBe('invalid');expect(thread.attempt).toContain('原对象');expect(thread.finishWhen).toContain('重新选择')
  expect(thread.command).toBeUndefined();expect(closed.controller.exportSaved()).toBe(raw)
 })
})

describe('feedback is a stopping point without silently ending the job or investment',()=>{
 let f:Awaited<ReturnType<typeof original>>
 beforeAll(async()=>{f=await original('work-market')})
 beforeAll(async()=>{await f.send('WorkQuarter',{});await f.advance('2020-01-31')})
 afterAll(async()=>{await f?.close()})
 it('keeps the normally earned first salary as feedback in an active job',()=>{
  const p=f.p(),raw=f.controller.exportSaved(),work=playerThread(p,openingFocusFor(p,'quarter',{recordId:p.features.workbench.employment[0]!.id})!)
  expect(work.stage).toBe('work-paid');expect(work.finishWhen).toContain('仍在岗')
  expect(work.attempt).not.toContain('结束工作');expect(work.resultRefs.some(r=>r.kind==='payroll'&&r.date==='2020-01-31')).toBe(true)
  expect(f.controller.exportSaved()).toBe(raw)
 })
 it('keeps a real position after matching without treating the investment as closed',async()=>{
  const p=f.p()
  const m=p.features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!,point=m.matchingCalendar.find(point=>point.date>p.view.date)!
  await f.send('PlaceStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:point.id})
  await f.advance(point.date)
  const now=f.p(),position=now.features.market.positions.find(pos=>pos.quantity===100)!,before=f.controller.exportSaved(),thread=playerThread(now,openingFocusFor(now,'market',{accountId:'personal',recordId:position.id})!)
  expect(thread.stage).toBe('market-position');expect(thread.attempt).toContain('持仓');expect(thread.finishWhen).toContain('不会自动卖出')
  expect(thread.command).toBeUndefined();expect(f.controller.exportSaved()).toBe(before)
 })
})

describe('one public relay task supplies its own purpose and endpoint',()=>{
 let f:Awaited<ReturnType<typeof original>>
 beforeAll(async()=>{f=await original('relay-task-purpose',relayCapitalRaw)})
 afterAll(async()=>{await f?.close()})
 type Kind='materials'|'basics'|'adapter'|'marketing'|'application'
 // Complete public display variants of the normal saved66 view. These are never
 // previewed, submitted, codec-sealed or called newly earned game histories.
 const display=(kind:Kind,status:ProductionJob['status'],read=false,approved:boolean|null=null)=>{
  const base=f.p(),v=base.features.relay!,b=v.businesses[0]!,identity=relayBusinessTarget(base,b.id)!,startAt=status==='planned'?addDays(base.view.date,1):base.view.date,completeAt=addDays(startAt,7)
  const definitionId={materials:'relay-preparation',basics:'relay-basics',adapter:'relay-adapter',marketing:'relay-marketing',application:'relay-application'}[kind]
  const job:ProductionJob={id:'display-only:'+kind+':job',businessId:b.id,definitionId,contractId:null,actionId:'display-only:'+kind+':action',resources:['player-production'],startAt,completeAt,releasedAt:['cancelled','interrupted'].includes(status)?startAt:null,status,outputId:status==='completed'?'display-only:'+kind+':output':null}
  const date=status==='completed'?completeAt:base.view.date,supplierId=v.catalog.suppliers[0]!.id,lifecycle=kind==='marketing'?'operating' as const:'preparing' as const
  const projected:NonNullable<PlayFeatures['relay']>={...v,businesses:v.businesses.map(row=>row.id===b.id?{...row,lifecycle}:row),preparations:[],applications:[],adapters:[],audiences:[],offers:[],customers:[],periods:[],changes:[],technicallyReady:kind!=='basics'||status==='completed'}
  let target:RelaySceneTarget=identity
  if(kind==='materials'||kind==='basics')projected.preparations=[{id:'display-only:'+kind,businessId:b.id,kind,jobId:job.id,job}]
  if(kind==='adapter')projected.adapters=[{id:'display-only:adapter',businessId:b.id,supplierId,jobId:job.id,kind:'migration',job}]
  if(kind==='marketing'){
   const id='display-only:audience'
   projected.audiences=[{id,businessId:b.id,segment:'local_merchants',mode:'paid',createdAt:startAt,jobId:job.id,sourceCohortIds:[],completedAt:status==='completed'?completeAt:null,members:status==='completed'?['display-only:person-1','display-only:person-2']:[],job}]
   target={...identity,kind:'audience',audienceId:id}
  }
  if(kind==='application'){
   const id='display-only:application'
   projected.applications=[{id,businessId:b.id,supplierId,jobId:job.id,appliedAt:startAt,decisionAt:completeAt,approved:read?approved:null,expiresAt:read&&approved?addDays(completeAt,90):null,read,allowedSegments:['local_merchants'],purpose:'licensed_service_aggregation',job}]
   target={...identity,kind:'application',applicationId:id}
  }
  const features={...base.features,relay:projected},view={...base.view,date,features:features as unknown as GamePanelProps['view']['features'],operations:{...base.view.operations!,businesses:base.view.operations!.businesses.map(row=>row.id===b.id?{...row,lifecycle}:row),jobs:[...base.view.operations!.jobs,job]}}
  const p:GamePanelProps={...base,view,features,accountId:b.accountId},focus=relayFocusFor(p,target)
  return {p,focus,target,job,projected,thread:()=>playerThread(p,focus)}
 }
 it.each([
  ['materials','申请材料','供应申请仍须另定'],['basics','技术基础','不等于材料、申请或许可'],['adapter','供应适配','获客与服务仍须另定'],['marketing','获客任务','报价、签约与充值分别决定'],
 ] as const)('keeps %s planned and running dates attached to the same original public job',(_kind,label,boundary)=>{
  const raw=f.controller.exportSaved()
  for(const status of ['planned','running'] as const){
   const d=display(_kind,status),thread=d.thread()
   expect(thread.focusStatus).toBe('valid');expect(thread.attempt).toContain(label)
   expect(thread.finishWhen).toContain(d.job.startAt);expect(thread.finishWhen).toContain(d.job.completeAt);expect(thread.finishWhen).toContain(boundary)
   expect(thread.finishWhen).not.toContain('准备、许可和客户承诺核清后')
  }
  expect(f.controller.exportSaved()).toBe(raw)
 })
 it('keeps the completed unread application neutral until its original reply is actually read',()=>{
  const d=display('application','completed'),thread=d.thread(),raw=f.controller.exportSaved()
  expect(thread.stage).toBe('relay-supplier-letter');expect(thread.command?.kind).toBe('ReadRelaySupplyDecision')
  expect(thread.attempt).toContain('亲手读');expect(thread.finishWhen).toContain(d.job.completeAt);expect(thread.finishWhen).toContain('读信才知')
  expect(thread.attempt).not.toContain('已经亲读');expect(thread.finishWhen).not.toContain('许可记录至')
  expect(f.controller.exportSaved()).toBe(raw)
 })
 it.each([true,false])('uses the already read %s application result even though its exact phase is records',approved=>{
  const d=display('application','completed',true,approved),thread=d.thread(),raw=f.controller.exportSaved()
  expect(thread.stage).toBe('relay-records');expect(thread.outcome).toBe(approved?'actual':'non-success')
  expect(thread.attempt).toContain(approved?'原许可回信':'未获许可');expect(thread.finishWhen).toContain(approved?'原回信已知':'原拒绝已知')
  expect(thread.finishWhen).not.toContain('准备、许可和客户承诺核清后')
  if(approved)expect(thread.finishWhen).toContain(d.projected.applications[0]!.expiresAt!)
  const historicalFeatures:PlayFeatures={...d.p.features,workbench:{...d.p.features.workbench,quarter:'2024-Q4',quarterStart:'2024-10-01',quarterEnd:'2024-12-31'}}
  const historical={...d.p,view:{...d.p.view,date:'2024-10-01',features:historicalFeatures as unknown as GamePanelProps['view']['features']},features:historicalFeatures}
  const old=playerThread(historical,d.focus)
  expect(old.focusScope).toBe('history');expect(old.attempt).toContain('回看');expect(old.finishWhen).toContain(approved?'原回信已知':'原拒绝已知')
  expect(f.controller.exportSaved()).toBe(raw)
 })
 it('moves a completed audience to the same offer or selected-customer decision without requiring every prospect',()=>{
  const d=display('marketing','completed'),raw=f.controller.exportSaved(),offer=()=>({id:'display-only:offer',businessId:d.target!.businessId,createdAt:d.p.view.date,offerId:'managed_support' as const,unitPriceFen:6,serviceFeeFen:50000})
  expect(d.thread().attempt).toContain('报价');expect(d.thread().finishWhen).toContain('报价明确保存')
  d.projected.offers=[offer()]
  expect(d.thread().attempt).toContain('哪些客户');expect(d.thread().finishWhen).toContain('显选客户')
  const audience=d.projected.audiences[0]!,personId=audience.members[0]!,id='display-only:customer',terms={id:offer().id,effectiveAt:d.p.view.date,offerId:'managed_support' as const,unitPriceFen:6,serviceFeeFen:50000,sourceId:offer().id}
  d.projected.customers=[{id,businessId:d.target!.businessId,personId,originAudienceId:audience.id,originCohortIds:[],conversionId:'display-only:conversion',segment:'local_merchants',signedAt:d.p.view.date,initialTermEnd:addDays(d.p.view.date,60),termEnd:addDays(d.p.view.date,60),initialMode:'prepaid',mode:'prepaid',initialCreditLimitFen:0,creditLimitFen:0,monthlyUnits:1000,rechargeLimitFen:500000,terms:[terms],closedAt:null,activeTerms:terms,balance:{prepaidFen:0,receivableFen:0,recognizedIncomeFen:0},dueReceivableFen:0}]
  expect(d.thread().attempt).toContain('显选客户的原约定已留下');expect(d.thread().finishWhen).toContain('不必签完整份名单')
  const selected:RelaySceneTarget={kind:'customer',runId:d.target.runId,accountId:d.target.accountId,businessId:d.target.businessId,stationId:d.target.stationId,customerId:id}
  const customer=playerThread(d.p,relayFocusFor(d.p,selected))
  expect(customer.stage).toBe('relay-records');expect(customer.attempt).toContain('充值另作决定');expect(customer.finishWhen).toContain('等额保护')
  d.projected.customers=[];d.projected.audiences=[{...audience,members:[]}]
  expect(d.thread().attempt).toContain('实际需求回信');expect(d.thread().finishWhen).toContain('没有自动签约')
  expect(f.controller.exportSaved()).toBe(raw)
 })
 it('refuses an ambiguous or mismatched public task rather than borrowing another owner or latest job',()=>{
  const d=display('materials','running'),row=d.projected.preparations[0]!,other={...d.job,id:'display-only:other-job'}
  d.projected.preparations=[row,{...row,id:'display-only:other-preparation',jobId:other.id,job:other}]
  const expanded={...d.p,view:{...d.p.view,operations:{...d.p.view.operations!,jobs:[...d.p.view.operations!.jobs,other]}}}
  expect(playerThread(expanded,d.focus).attempt).toContain('先明确');expect(playerThread(expanded,d.focus).finishWhen).toContain('没有挑最新')
  d.projected.preparations=[{...row,job:{...d.job,businessId:'display-only:another-business'}}]
  expect(playerThread(expanded,d.focus).finishWhen).toContain('不能唯一核对')
  const wrong=playerThread(d.p,{...d.focus,accountId:'personal'})
  expect(wrong.focusStatus).toBe('invalid');expect(wrong.finishWhen).toContain('重新选择')
 })
})
