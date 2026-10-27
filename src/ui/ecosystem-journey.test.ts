import {beforeAll,expect,it} from 'vitest'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {prepareEco} from '../testing/deepseek-scenarios.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {ecosystemJourney} from './ecosystem-journey.ts'
import {isEcosystemSceneTarget,resolveEcosystemSceneTarget,type EcosystemSceneTarget} from './ecosystem-scene-target.ts'

type Harness=ReturnType<typeof prepareEco>['h']
function snapshot(h:Harness){
 const v=projectDeepseek(h.run,h.deepseek)!,business=v.businesses.find(b=>b.definitionId==='ecosystem-service')!
 const transactions=h.run.economy.ledger.transactions.filter(tx=>tx.lines.some(line=>line.accountId===business.accountId)).map(tx=>({id:tx.id,date:tx.date,sourceId:tx.sourceEventId,businessId:tx.businessId,contractId:tx.contractId,amountFen:tx.lines.find(line=>line.accountId===business.accountId)!.deltaFen}))
 const context={runId:h.run.runId,accountId:business.accountId,accounts:h.run.economy.ledger.accounts.map(a=>({accountId:a.id})),operations:h.run.operations!,date:h.run.timeline.cursor.date,materialsReady:true,transactions,finance:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance}
 const target:EcosystemSceneTarget={runId:context.runId,accountId:context.accountId,businessId:business.id,kind:'business'}
 return {v,context,target}
}
type Snapshot=ReturnType<typeof snapshot>
const record=(p:Snapshot,kind:Exclude<EcosystemSceneTarget['kind'],'business'>,recordId:string):EcosystemSceneTarget=>({...p.target,kind,recordId})
let prepared:Snapshot,planned:Snapshot,running:Snapshot,ready:Snapshot,submitted:Snapshot,support:Snapshot,completed:Snapshot,partial:Snapshot,paid:Snapshot
let contractId:string,deliveryId:string,original:string,finalRaw:string,h:Harness
beforeAll(()=>{
 // Isolated rule fixture with fixed funds/outcomes. This is not normal-play or Chrome acceptance.
 const start=prepareEco();h=start.h;prepared=snapshot(h)
 h.send('AcceptEcoContract',{leadId:start.lead.id,scope:'standard',resources:['player-production'],startAt:'2024-07-02'})
 contractId=h.run.deepseek!.contracts[0]!.id;planned=snapshot(h)
 h.send('AdvanceTime',{date:'2024-07-02'});running=snapshot(h)
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===h.run.deepseek!.contracts[0]!.productionJobId)!.completeAt});ready=snapshot(h)
 h.send('SubmitEcoDelivery',{contractId});submitted=snapshot(h)
 h.send('AdvanceTime',{date:h.run.deepseek!.contracts[0]!.reviewAt!});support=snapshot(h)
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===h.run.deepseek!.contracts[0]!.supportJobId)!.completeAt});completed=snapshot(h)
 const due=completed.v.deliveries.find(d=>d.remainingFen>0)!;deliveryId=due.id
 h.send('AdvanceTime',{date:due.dueAt>h.run.timeline.cursor.date?due.dueAt:h.run.timeline.cursor.date})
 h.send('CollectEcoReceivable',{deliveryId,amountFen:Math.floor(due.remainingFen/2)});partial=snapshot(h)
 h.send('CollectEcoReceivable',{deliveryId,amountFen:partial.v.deliveries.find(d=>d.id===deliveryId)!.remainingFen});paid=snapshot(h)
 original=JSON.stringify(prepared);finalRaw=h.codec.export(h.run)
})

it('keeps an ecology direction separate from an unselected account and from equity',()=>{
 const p=prepared,entry=ecosystemJourney(p.v,null,{...p.context,accountId:'personal'})
 expect(entry.resolution.status).toBe('entry');expect(entry.action).toEqual({kind:'choice',intent:'objects',label:'把一份原合作放到眼前'})
 expect(resolveEcosystemSceneTarget(p.v,null,p.context).status).toBe('invalid')
 const mixed={...p.v,businesses:p.v.businesses.map(b=>({...b,definitionId:'deepseek-investor'}))}
 expect(resolveEcosystemSceneTarget(mixed,p.target,p.context).status).toBe('invalid')
})

it('rejects foreign run/account, duplicate business and expired explicit IDs without substituting another record',()=>{
 const p=prepared,lead=p.v.leads[0]!,target=record(p,'lead',lead.id)
 expect(resolveEcosystemSceneTarget(p.v,{...target,runId:'another-run'},p.context).status).toBe('invalid')
 expect(resolveEcosystemSceneTarget(p.v,{...target,accountId:'personal'},p.context).status).toBe('invalid')
 expect(resolveEcosystemSceneTarget({...p.v,businesses:[...p.v.businesses,p.v.businesses[0]!]},target,p.context).status).toBe('invalid')
 const stale=ecosystemJourney(p.v,record(p,'lead','missing-original-lead'),p.context)
 expect(stale).toMatchObject({phase:'invalid',resolution:{target:{recordId:'missing-original-lead'}},action:{kind:'choice',intent:'objects'}})
 expect(stale.resolution.lead).toBeNull()
})

it('rejects unsafe shapes without invoking a getter or coercing a kind object',()=>{
 let reads=0;const accessor=Object.defineProperty({},'kind',{enumerable:true,get(){reads++;return 'contract'}})
 expect(isEcosystemSceneTarget(accessor)).toBe(false)
 const malicious={kind:{toString(){reads++;return 'contract'}},runId:'r',accountId:'a',businessId:'b',recordId:'c'}
 expect(isEcosystemSceneTarget(malicious)).toBe(false);expect(reads).toBe(0)
 expect(isEcosystemSceneTarget({...prepared.target,recordId:'extra-field'})).toBe(false)
})

it('matches model, product and actual outreach membership for the same original client',()=>{
 const p=prepared,lead=p.v.leads[0]!,target=record(p,'lead',lead.id)
 expect(resolveEcosystemSceneTarget(p.v,target,p.context).lead?.id).toBe(lead.id)
 const changed={...p.v,outreaches:p.v.outreaches.map(o=>o.id===lead.outreachId?{...o,personIds:[]}:o)}
 expect(resolveEcosystemSceneTarget(changed,target,p.context).status).toBe('invalid')
 expect(resolveEcosystemSceneTarget({...p.v,leads:[...p.v.leads,lead]},target,p.context).status).toBe('invalid')
})

it('labels completed preparation as its own prepared record and keeps real client replies separate',()=>{
 const p=prepared,row=p.v.preparations.find(r=>r.kind==='materials')!,scene=ecosystemJourney(p.v,record(p,'preparation',row.id),p.context)
 expect(scene).toMatchObject({phase:'preparation-completed',paper:'prepared',outcome:'actual'})
 expect(scene.object).toContain('服务材料');expect(scene.line).not.toContain('客户已经')
})

it('does not invent an arranged research or a customer letter for an enabled business before demand exists',()=>{
 const h=createDeepseekFixture(),a=(startAt:string)=>({resources:['player-production'],startAt});h.send('AdvanceTime',{date:'2024-05-06'});h.send('OpenEcosystemService',{capitalFen:2000000});const b=h.run.operations!.businesses.at(-1)!
 h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'materials',...a('2024-05-06')});h.send('AdvanceTime',{date:'2024-05-13'});h.send('StartEcosystemAdaptation',{businessId:b.id,modelId:'v2',productId:'training',acceptSimulationTerms:true,...a('2024-05-13')});h.send('AdvanceTime',{date:'2024-05-20'});h.send('ActivateBusiness',{businessId:b.id});const p=snapshot(h),scene=ecosystemJourney(p.v,p.target,p.context)
 expect(scene).toMatchObject({phase:'outreach-needed',active:false,outcome:'none',paper:'intention',action:{kind:'choice',intent:'outreach'}})
 expect(scene.purpose).toContain('听清具体');expect(scene.purpose).not.toContain('已经安排');expect(scene.line).toContain('尚未安排这份研究')
})

it('carries the exact public model and service purpose into the original preparation result and client choice',()=>{
 const p=prepared,a=p.v.adapters[0]!,o=p.v.outreaches[0]!,adapter=ecosystemJourney(p.v,record(p,'adapter',a.id),p.context),outreach=ecosystemJourney(p.v,record(p,'outreach',o.id),p.context)
 expect(adapter.line).toContain('DeepSeek-V2 / 小组工具培训');expect(outreach.line).toContain('DeepSeek-V2 / 小组工具培训 / 付费需求研究')
 expect(outreach.action).toMatchObject({kind:'choice',intent:'leads'})
})

it('distinguishes actual scheduling, work, personal submission and customer review',()=>{
 const at=(p:Snapshot)=>ecosystemJourney(p.v,record(p,'contract',contractId),p.context)
 expect(at(planned)).toMatchObject({phase:'production-planned',outcome:'pending',paper:'commitment',action:{kind:'wait',date:'2024-07-02'}})
 expect(at(running)).toMatchObject({phase:'production-running',action:{kind:'wait'},outcome:'pending',paper:'work'})
 expect(at(ready)).toMatchObject({phase:'ready-to-submit',action:{kind:'command',command:'SubmitEcoDelivery',payload:{contractId}},paper:'ready'})
 expect(at(submitted)).toMatchObject({phase:'customer-review',outcome:'pending',action:{kind:'wait'},paper:'sent'})
 expect(at(submitted).line).toContain('不提前宣布客户认可')
 expect(submitted.v.contracts[0]!.balance!.recognizedIncomeFen).toBe(0)
 for(const p of [planned,running,ready,submitted,support,completed,partial]){
  const object=at(p).object
  expect(object).toContain('客户1');expect(object).toContain('DeepSeek-V2 / 小组工具培训');expect(object).toContain('标准范围')
 }
})

it('retains the actual support after 80 percent acceptance and keeps final income apart from cash',()=>{
 const current=ecosystemJourney(support.v,record(support,'contract',contractId),support.context),c=support.v.contracts[0]!
 expect(current).toMatchObject({phase:'support',outcome:'pending',paper:'support',action:{kind:'wait'}})
 expect(c.balance!.recognizedIncomeFen).toBe(c.priceFen*0.8)
 expect(current.line).toContain('完成支持才确认最后20%')
 expect(completed.v.contracts[0]!.balance!.recognizedIncomeFen).toBe(c.priceFen)
 expect(ecosystemJourney(completed.v,record(completed,'contract',contractId),completed.context).paper).toBe('receivable')
 expect(completed.v.deliveries.some(d=>d.remainingFen>0)).toBe(true)
})

it('keeps a partially collected original invoice active and never confirms income twice',()=>{
 const target=record(partial,'delivery',deliveryId),scene=ecosystemJourney(partial.v,target,partial.context),d=partial.v.deliveries.find(d=>d.id===deliveryId)!
 expect(scene).toMatchObject({phase:'collection',paper:'receivable',active:true,action:{kind:'choice',intent:'collection'}})
 expect(scene.line).toContain('尚未实收');expect(d.remainingFen).toBeGreaterThan(0)
 expect(partial.v.contracts[0]!.balance!.recognizedIncomeFen).toBe(completed.v.contracts[0]!.balance!.recognizedIncomeFen)
 const receipt=ecosystemJourney(paid.v,record(paid,'delivery',deliveryId),paid.context)
 expect(receipt).toMatchObject({phase:'paid',paper:'receipt',active:false,action:{kind:'today'}})
 expect(receipt.resolution.delivery!.id).toBe(deliveryId)
 expect(paid.v.deliveries.some(d=>d.id!==deliveryId&&d.remainingFen>0)).toBe(true)
})

it('separates an actually completed service with its own unpaid cash from missing responsibility sources without changing its action',()=>{
 const target=record(completed,'contract',contractId),known=ecosystemJourney(completed.v,target,completed.context)
 expect(known.line).toContain('这份合作的履约已经结束');expect(known.line).toContain('待收款仍按原期限保留');expect(known.line).not.toContain('来源尚需核对')
 const {finance,...missing}=completed.context;expect(finance.length).toBeGreaterThan(0)
 const unknown=ecosystemJourney(completed.v,target,missing)
 expect(unknown.line).toContain('本合作的原义务来源尚需核对');expect(unknown.line).toContain('未知部分不按结清处理');expect(unknown.action).toEqual(known.action)
 expect(h.codec.export(h.run)).toBe(finalRaw)
})

it('dates an actual collection only from its own published cash transaction and never from delivery or viewing day',()=>{
 const t=record(paid,'delivery',deliveryId),scene=ecosystemJourney(paid.v,t,paid.context),delivery=paid.v.deliveries.find(d=>d.id===deliveryId)!
 expect(scene.resultDate).toBe(paid.context.date);expect(scene.resultDate).not.toBe(delivery.date)
 expect(ecosystemJourney(paid.v,t,{...paid.context,date:'2024-12-31'}).resultDate).toBe(paid.context.date)
 const {transactions:omitted,...withoutDates}=paid.context;expect(omitted.length).toBeGreaterThan(0)
 expect(ecosystemJourney(paid.v,t,withoutDates).resultDate).toBeNull()
 const unrelated=paid.context.transactions.map(tx=>({...tx,contractId:'another-contract'}))
 expect(ecosystemJourney(paid.v,t,{...paid.context,transactions:unrelated}).resultDate).toBeNull()
})

it('does not narrate a frozen customer outcome while actual review is still pending',()=>{
 const v={...submitted.v,contracts:submitted.v.contracts.map(c=>({...c,accepted:true,deliveredAt:'2025-01-01',supportPostedAt:'2025-01-08'}))}
 const scene=ecosystemJourney(v,record(submitted,'contract',contractId),submitted.context)
 expect(scene).toMatchObject({phase:'customer-review',outcome:'pending',action:{kind:'wait'}})
 expect(scene.title).not.toContain('认可');expect(scene.line).toContain('不提前宣布客户认可')
 expect(scene.resultDate).toBeNull()
})

it('refuses missing invoice truth, duplicate stage and mismatched original work rather than describing completion',()=>{
 const p=completed,target=record(p,'contract',contractId),c=p.v.contracts[0]!
 expect(resolveEcosystemSceneTarget({...p.v,deliveries:[]},target,p.context).status).toBe('invalid')
 expect(resolveEcosystemSceneTarget({...p.v,deliveries:[...p.v.deliveries,p.v.deliveries[0]!]},target,p.context).status).toBe('invalid')
 const altered={...p.v,contracts:p.v.contracts.map(row=>row.id===c.id?{...row,supportJob:row.supportJob?{...row.supportJob,actionId:'another-original-action'}:null}:row)}
 expect(resolveEcosystemSceneTarget(altered,target,p.context).status).toBe('invalid')
 const invalidDate={...p.v,deliveries:p.v.deliveries.map(d=>({...d,dueAt:'2024-02-30'}))}
 expect(resolveEcosystemSceneTarget(invalidDate,target,p.context).status).toBe('invalid')
})

it('never waits for an interrupted preparation to complete for free and never mutates a public snapshot',()=>{
 const p=prepared,row=p.v.preparations.find(o=>o.kind==='materials')!,target=record(p,'preparation',row.id),job={...row.job!,status:'interrupted' as const,releasedAt:row.job!.startAt}
 const v={...p.v,preparations:p.v.preparations.map(o=>o.id===row.id?{...o,job}:o)},context={...p.context,operations:{...p.context.operations,jobs:p.context.operations.jobs.map(j=>j.id===row.jobId?job:j)}}
 expect(ecosystemJourney(v,target,context)).toMatchObject({phase:'preparation-stopped',outcome:'non-success',paper:'stopped',action:{kind:'today'}})
 expect(JSON.stringify(prepared)).toBe(original);expect(h.codec.export(h.run)).toBe(finalRaw)
})

it('keeps the same original human client identity and gives a real decline a direct Today exit',()=>{
 const {h,lead}=prepareEco(),before=snapshot(h),target=record(before,'lead',lead.id),index=before.v.leads.findIndex(l=>l.personId===lead.personId)+1
 expect(ecosystemJourney(before.v,target,before.context).object).toBe('客户'+index+'的原需求来信')
 h.send('DeclineEcoLead',{leadId:lead.id});const after=snapshot(h),scene=ecosystemJourney(after.v,record(after,'lead',lead.id),after.context)
 expect(scene).toMatchObject({phase:'lead-declined',active:false,outcome:'non-success',action:{kind:'today'}})
 expect(scene.object).toBe('客户'+index+'的原需求来信');expect(after.v.contracts).toHaveLength(0)
})

it('offers the original exit decision after actually interrupting support rather than promising free completion by waiting',()=>{
 const {h,lead}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',resources:['player-production'],startAt:'2024-07-02'});const c=h.run.deepseek!.contracts[0]!
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt});h.send('SubmitEcoDelivery',{contractId:c.id});h.send('AdvanceTime',{date:c.reviewAt!});h.send('InterruptJob',{jobId:c.supportJobId});const p=snapshot(h),scene=ecosystemJourney(p.v,record(p,'contract',c.id),p.context)
 expect(scene).toMatchObject({phase:'support-interrupted',outcome:'non-success',action:{kind:'choice',intent:'remediation'},paper:'stopped'})
 expect(scene.line).toContain('等待不会补做');expect(p.v.contracts[0]!.balance!.recognizedIncomeFen).toBe(c.priceFen*0.8)
 expect(p.v.contracts[0]!.cancellationCompensationFen).toBe(c.priceFen*0.1)
})
