import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {hashText} from '../core/hash.ts'
import {loadMarketCatalog} from '../core/market-schema.ts'
import {replayCourseF05} from '../testing/course-scenarios.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {projectCourse} from '../core/course-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {MARKET_CONTENT} from '../content/market.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {courseTeachingSceneResult} from './course-teaching-result.ts'
import {courseCohortFinancials} from './CourseTeachingDetails.tsx'
import {courseTeachingPaper} from './course-teaching-paper.ts'
import {courseSceneProgress} from './course-scene-progress.ts'

it('keeps an actual F05 earned-refund debt protected, then closes only after original wages and PayObligation really settle it',async()=>{
 // F05 is the existing isolated personal-account finance fixture, with no living/maintenance.
 // Its custom WorldRuntime has no feature projector: use the original public course/workbench
 // projectors over the actual saved run; no production-campaign or normal-Create claim is made.
 const scenario=replayCourseF05(),h=scenario.h,factory=new IDBFactory(),store=new IndexedDbRunStore({codec:h.codec,factory,keyRange:IDBKeyRange,name:'c2-f05-refund'})
 const raw=h.codec.export(h.run),market=loadMarketCatalog(MARKET_CONTENT)
 expect(h.run.origin).toBe('fixture');expect(scenario.result).toMatchObject({cashFen:800000,heldFen:500000,availableFen:300000})
 await store.importSave(raw,{mode:'create',actorId:'player',importId:'f05-initial'})
 const session=await RunSession.open({codec:h.codec,registry:h.registry,store,locks:new MemoryWriterAccess(),runId:h.run.runId,actorId:'player'})
 let sequence=0
 const actualCommands:unknown[]=[],states:unknown[]=[]
 const snapshot=():PlayingView=>{const run=h.codec.import(session.exportSaved());return {...session.view,features:{course:projectCourse(run,h.course),workbench:projectWorkbench(run,h.runtime,h.operations.catalog,market)}}}
 const command=(kind:string,payload:unknown)=>({runId:session.view.runId,actorId:'player',commandId:'f05-refund-'+(++sequence),expectedRevision:session.view.revision,kind,payload})
 const send=async(kind:string,payload:unknown)=>{const previous=snapshot(),request=command(kind,payload),result=await session.submit(request);expect(result.status,JSON.stringify({kind,result})).toBe('saved');actualCommands.push({command:request,status:result.status,revision:session.view.revision});return {previous,current:snapshot()}}
 const features=(view:PlayingView)=>view.features as unknown as PlayFeatures
 const facts=(view:PlayingView)=>courseCohortFinancials(features(view).course,view,scenario.cohort.id)!
 const target={kind:'cohort' as const,businessId:scenario.business.id,courseId:scenario.course.id,cohortId:scenario.cohort.id}
 const record=(label:string,view:PlayingView)=>{const f=features(view),finance=f.workbench.finance.find(a=>a.accountId===scenario.business.accountId)!;states.push({label,date:view.date,revision:view.revision,rawSha256:hashText(session.exportSaved()),finances:facts(view),paper:courseTeachingPaper({view,features:f},target),cohort:f.course!.cohorts.find(c=>c.id===target.cohortId),refunds:f.course!.refunds.filter(r=>r.cohortId===target.cohortId),transactions:finance.transactions.filter(t=>t.contractId===target.cohortId),obligations:finance.obligations.filter(o=>o.contractId===target.cohortId),cashFen:finance.cashFen})}
 try{
  const before=snapshot(),co=features(before).course!.cohorts.find(co=>co.id===scenario.cohort.id)!
  expect(facts(before)).toMatchObject({receivedFen:1000000,protectedFen:500000,unearnedFen:500000,recognizedFen:500000,refundDueFen:0})
  record('F05-original-half-delivery',before)
  const refunded=await send('RefundCourseLearners',{cohortId:co.id,personIds:co.students.map(s=>s.personId),reason:'F05独立财务：按原阶段全退20名原学员'})
  const after=features(refunded.current),refund=after.course!.refunds.at(-1)!,finance=after.workbench.finance.find(f=>f.accountId===scenario.business.accountId)!
  const operationIds=new Set(refund.operationIds),paid=finance.transactions.filter(t=>operationIds.has(t.id)&&t.amountFen<0).reduce((n,t)=>n-t.amountFen,0)
  const obligations=finance.obligations.filter(o=>o.contractId===co.id&&operationIds.has(o.originOperationId)),owed=obligations.reduce((n,o)=>n+o.remainingFen,0)
  expect(refund).toMatchObject({undeliveredFen:500000,deliveredFen:500000})
  expect(paid).toBe(500000);expect(owed).toBe(500000);expect(paid+owed).toBe(1000000)
  const result=courseTeachingSceneResult('RefundCourseLearners',refunded.previous,refunded.current)
  expect(result).toContain('应退¥10,000');expect(result).toContain('未交付部分¥5,000');expect(result).toContain('已交付收入冲减¥5,000')
  expect(result).toContain('本次实际付出¥5,000');expect(result).toContain('仍欠¥5,000');expect(result).not.toContain('实际结清')
  expect(facts(refunded.current)).toMatchObject({recognizedFen:0,unearnedFen:0,refundRegisteredFen:1000000,refundPaidFen:500000,refundDueFen:500000,protectedFen:500000,totalDueFen:500000})
  expect(courseTeachingPaper({view:refunded.current,features:after},target)).toMatchObject({protectedFen:500000,refundDueFen:500000,closedAt:null})
  record('refund-original-paid-500000-owed-500000',refunded.current)
  const debt=obligations[0]!
  expect(session.preview(command('PayObligation',{accountId:finance.accountId,obligationId:debt.id,amountFen:debt.remainingFen}))).toMatchObject({allowed:false,reasonCodes:['INSUFFICIENT_AVAILABLE_FUNDS']})
  const partial=await send('PayObligation',{accountId:finance.accountId,obligationId:debt.id,amountFen:300000})
  expect(facts(partial.current)).toMatchObject({refundPaidFen:800000,refundDueFen:200000,protectedFen:200000,totalDueFen:200000})
  expect(courseTeachingPaper({view:partial.current,features:features(partial.current)},target)).toMatchObject({protectedFen:200000,refundDueFen:200000,closedAt:null})
  expect(courseTeachingSceneResult('PayObligation',partial.previous,partial.current)).toBeNull()
  const partialFinance=features(partial.current).workbench.finance.find(f=>f.accountId===finance.accountId)!
  expect(partialFinance.transactions.filter(t=>t.contractId===co.id&&!finance.transactions.some(old=>old.id===t.id)).reduce((n,t)=>n-t.amountFen,0)).toBe(300000)
  record('explicit-partial-payment-300000-remaining-200000',partial.current)
  const remaining=features(partial.current).workbench.finance.find(f=>f.accountId===finance.accountId)!.obligations.find(o=>o.id===debt.id)!.remainingFen
  expect(remaining).toBe(200000)
  expect(session.exportSaved()).not.toBe(raw)
  const pause=features(snapshot()).workbench.pause
  if(pause){expect(pause.reason).toBe('CASH_SHORTFALL');await send('AcknowledgeCashGap',{instanceId:pause.instanceId})}
  const window=await send('AdvanceTime',{date:'2023-04-23'}),atWindow=features(window.current).course!.cohorts.find(c=>c.id===co.id)!
  expect(atWindow.feePostedAt).toBe('2023-04-23');expect(atWindow.feeFen).toBe(0);expect(atWindow.closedAt).toBeNull()
  expect(courseTeachingSceneResult('AdvanceTime',window.previous,window.current)).toContain('尚未结清')
  expect(courseSceneProgress(features(window.current).course,window.current.date,target,{operations:window.current.operations})).toMatchObject({phase:'course-cohort-settling',outcome:'pending'})
  record('fee-window-with-original-unpaid-debt',window.current)
  await send('WorkQuarter',{})
  const wages=await send('AdvanceTime',{date:'2023-05-31'})
  expect(wages.current.operations!.payroll.some(p=>p.kind==='salary'&&p.amountFen>0&&p.through>='2023-04-23')).toBe(true)
  expect(features(wages.current).course!.cohorts.find(c=>c.id===co.id)!.closedAt).toBeNull()
  const settlement=await send('PayObligation',{accountId:finance.accountId,obligationId:debt.id,amountFen:remaining})
  expect(features(settlement.current).course!.cohorts.find(c=>c.id===co.id)!.closedAt).toBe('2023-05-31')
  expect(courseTeachingSceneResult('PayObligation',settlement.previous,settlement.current)).toContain('已于2023-05-31实际结清')
  expect(facts(settlement.current)).toMatchObject({recognizedFen:0,refundRegisteredFen:1000000,refundPaidFen:1000000,refundDueFen:0,protectedFen:0,totalDueFen:0})
  expect(courseTeachingPaper({view:settlement.current,features:features(settlement.current)},target)).toMatchObject({protectedFen:0,refundDueFen:0,closedAt:'2023-05-31'})
  record('original-wages-then-final-debt-payment-and-close',settlement.current)
  expect((await store.load(h.run.runId))!.run).toEqual(h.codec.import(session.exportSaved()))
  const node=globalThis as typeof globalThis&{process?:{env:Record<string,string|undefined>;stdout:{write:(value:string)=>unknown}}}
  if(node.process?.env.C2_REFUND_REPORT==='1')node.process.stdout.write('C2_REFUND_EVIDENCE '+JSON.stringify({origin:'fixture',fixture:'replayCourseF05',projection:'RunSession.view + official projectCourse + projectWorkbench; partial fixture features only',prefixCommands:h.commands,actualCommands,states})+'\n')
 }finally{await session.close();await store.close()}
},60000)
