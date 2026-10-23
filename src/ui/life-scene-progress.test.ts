import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {LifeProjection} from '../core/life-projection.ts'
import type {PlayFeatures} from './game-types.ts'
import {lifeSceneProgress,pendingLifePromises} from './life-scene-progress.ts'
import {sceneWorks} from './SceneJournal.tsx'
import workingRaw from '../../goal-1/evidence/t16-c16-final-a1/life/t15-promise-fulfilled-on-deadline-working.json?raw'
import npcOfferedRaw from '../../goal-1/evidence/t16-c16-final-a1/life/t15-npc-own-calendar-offered.json?raw'
import closedCourseRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/course/t11-s02-technical_employee-closed.json?raw'
import expiredRaw from '../../goal-1/evidence/t16-c16-final-a1/life/t15-promise-expired-final.json?raw'
import missedRaw from '../../goal-1/evidence/t16-c16-final-a1/life/t15-promise-missed-final.json?raw'
import interruptedRaw from '../../goal-1/evidence/t16-c16-final-a1/life/t15-interrupted-retry-scene-interrupted.json?raw'

async function normal(id:string,raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d09-life-scene-'+id})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d09-life-${id}-${++sequence}`})
 await controller.initialize()
 if(raw)await controller.importNew(raw)
 else await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d09-life-scene-'+id})
 const view=()=>controller.snapshot.view!,life=()=>view().features as unknown as PlayFeatures
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 return {controller,store,view,life:()=>life().life,send,close:async()=>{await controller.close();await store.close()}}
}

it('keeps a real invitation, acceptance, paid fulfillment and actual completion separate, then completes personal work without rewards',async()=>{
 const h=await normal('full-loop')
 try{
  const initial=h.view(),initialCash=initial.accounts.find(a=>a.accountId==='personal')!.cashFen
  const ready=lifeSceneProgress(h.life(),initial.date,'tang-ying'),before=h.controller.exportSaved()
  expect(lifeSceneProgress(h.life(),initial.date,'linzhou')).toMatchObject({stage:'unknown',command:null,referenceRequired:false})
  expect(ready).toMatchObject({stage:'ready',command:{kind:'StartLifeWork',payload:{kind:'friend_visit',personId:'tang-ying',reference:null}}})
  expect(ready.choice.line).toContain('个人¥200');expect(ready.choice.line).toContain('2020-01-04')
  expect(h.controller.exportSaved()).toBe(before)
  await h.send(ready.command!.kind,ready.command!.payload)
  expect(sceneWorks({view:h.view(),features:h.view().features as unknown as PlayFeatures}).find(work=>work.id===h.life().jobs.at(-1)!.id)).toMatchObject({screen:'life',accountId:'personal',personId:'tang-ying',lifeSelection:'person',recordId:h.life().jobs.at(-1)!.id})
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying')).toMatchObject({stage:'running',waitDate:'2020-01-04',command:null,secondaryCommand:{kind:'InterruptLifeWork'}})
  await h.send('AdvanceTime',{date:'2020-01-04'})
  const offered=lifeSceneProgress(h.life(),h.view().date,'tang-ying')
  expect(offered).toMatchObject({stage:'offered',command:{kind:'AcceptLifePromise'},secondaryCommand:{kind:'DeclineLifePromise',confirm:false}})
  expect(offered.choice.line).toContain('现在接受0点、无即时费用');expect(offered.choice.line).toContain('个人¥300')
  expect(pendingLifePromises(h.life(),h.view().date)).toEqual([])
  const cashBeforeAcceptance=h.view().accounts.find(a=>a.accountId==='personal')!.cashFen,pointsBeforeAcceptance=h.view().budget.available
  await h.send(offered.command!.kind,offered.command!.payload)
  expect(h.view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(cashBeforeAcceptance);expect(h.view().budget.available).toBe(pointsBeforeAcceptance)
  const accepted=lifeSceneProgress(h.life(),h.view().date,'tang-ying')
  expect(accepted).toMatchObject({stage:'accepted',waitDate:null,command:{kind:'FulfillLifePromise'}})
  expect(pendingLifePromises(h.life(),h.view().date)[0]).toMatchObject({promise:{id:accepted.promise!.id},person:{id:'tang-ying'},terms:{costFen:30000,days:3},job:null})
  await h.send(accepted.command!.kind,accepted.command!.payload)
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying')).toMatchObject({stage:'running',waitDate:'2020-01-07'})
  expect(pendingLifePromises(h.life(),h.view().date)).toEqual([])
  await h.send('AdvanceTime',{date:'2020-01-07'})
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying')).toMatchObject({stage:'completed',promise:{status:'fulfilled'},job:{kind:'promise_keep',status:'completed'},command:null})
  expect(h.view().budget.available).toBe(initial.budget.available-2)
  expect(h.view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(initialCash-50000)
  const workspace=lifeSceneProgress(h.life(),h.view().date,'workspace')
  expect(workspace).toMatchObject({stage:'ready',command:{kind:'StartLifeWork',payload:{kind:'workspace',personId:null,reference:null}}})
  await h.send(workspace.command!.kind,workspace.command!.payload)
  const workspaceRecord=sceneWorks({view:h.view(),features:h.view().features as unknown as PlayFeatures}).find(work=>work.id===h.life().jobs.at(-1)!.id)
  expect(workspaceRecord).toMatchObject({screen:'life',accountId:'personal',lifeSelection:'workspace',recordId:h.life().jobs.at(-1)!.id})
  expect(workspaceRecord).not.toHaveProperty('personId')
  expect(h.life().scene.workspaceCompleted).toBe(false)
  expect(lifeSceneProgress(h.life(),h.view().date,'workspace')).toMatchObject({stage:'running',waitDate:'2020-01-14'})
  await h.send('AdvanceTime',{date:'2020-01-14'})
  expect(lifeSceneProgress(h.life(),h.view().date,'workspace')).toMatchObject({stage:'completed',job:{result:'workspace_ready'}})
  const rest=lifeSceneProgress(h.life(),h.view().date,'rest');expect(rest.choice.line).toContain('个人¥0')
  await h.send(rest.command!.kind,rest.command!.payload)
  const restRecord=sceneWorks({view:h.view(),features:h.view().features as unknown as PlayFeatures}).find(work=>work.id===h.life().jobs.at(-1)!.id)
  expect(restRecord).toMatchObject({screen:'life',accountId:'personal',lifeSelection:'rest',recordId:h.life().jobs.at(-1)!.id})
  expect(restRecord).not.toHaveProperty('personId')
  await h.send('AdvanceTime',{date:'2020-01-21'})
  expect(lifeSceneProgress(h.life(),h.view().date,'rest')).toMatchObject({stage:'completed',job:{result:'rested'}})
  expect(h.view().budget.available).toBe(initial.budget.available-4)
  expect(h.view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(initialCash-350000)
 }finally{await h.close()}
},20000)

it('can really decline an unaccepted invitation at zero AP without a payment or forced fulfillment',async()=>{
 const h=await normal('zero-decline')
 try{
  await h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});await h.send('AdvanceTime',{date:'2020-01-04'})
  await h.send('WorkQuarter',{});await h.send('StartLifeWork',{kind:'rest',personId:null,reference:null})
  expect(h.view().budget.available).toBe(0)
  const scene=lifeSceneProgress(h.life(),h.view().date,'tang-ying'),cash=h.view().accounts.find(a=>a.accountId==='personal')!.cashFen
  await h.send(scene.secondaryCommand!.kind,scene.secondaryCommand!.payload)
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying')).toMatchObject({stage:'declined',promise:{status:'declined',acceptedAt:null},command:null})
  expect(h.view().budget.available).toBe(0);expect(h.view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(cash)
  expect(h.life().jobs.some(j=>j.kind==='promise_keep')).toBe(false)
 }finally{await h.close()}
},20000)

it('reads a retained current-schema normal deadline job and waits for its actual completion before calling the promise fulfilled',async()=>{
 const h=await normal('deadline-original',workingRaw)
 try{
  const before=h.controller.exportSaved(),scene=lifeSceneProgress(h.life(),h.view().date,'tang-ying')
  expect(scene).toMatchObject({stage:'running',waitDate:'2020-02-18',promise:{status:'accepted'},job:{status:'running'}})
  expect(h.controller.exportSaved()).toBe(before)
  await h.send('AdvanceTime',{date:'2020-02-18'})
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying')).toMatchObject({stage:'completed',promise:{status:'fulfilled',resolvedAt:'2020-02-18'}})
 }finally{await h.close()}
},20000)

it('keeps an actual NPC withdrawal distinct from a missed player promise and respects the original public calendar',async()=>{
 const h=await normal('npc-original',npcOfferedRaw)
 try{
  expect(lifeSceneProgress(h.life(),h.view().date,'tang-ying').stage).toBe('offered')
  const jobs=h.life().jobs.length
  await h.send('AdvanceTime',{date:'2020-07-01'})
  const scene=lifeSceneProgress(h.life(),h.view().date,'tang-ying')
  expect(scene).toMatchObject({stage:'npc-declined',promise:{status:'npc_declined',acceptedAt:null},command:null,waitDate:null})
  expect(scene.line).toContain('不记作你的失约');expect(h.life().jobs).toHaveLength(jobs)
  expect(h.life().people.find(p=>p.id==='tang-ying')!.relationship.missedPromiseIds).toEqual([])
 }finally{await h.close()}
},20000)

it('sorts actual unstarted commitments without mutating their records and preserves an overdue responsibility in a bounded display projection',async()=>{
 const h=await normal('multiple-promises')
 try{
  await h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});await h.send('AdvanceTime',{date:'2020-01-04'})
  const tang=lifeSceneProgress(h.life(),h.view().date,'tang-ying');await h.send(tang.command!.kind,tang.command!.payload)
  await h.send('StartFirstOrder',{})
  const originalJob=h.view().operations!.jobs.find(job=>job.status==='planned')!,originalBusiness=h.view().operations!.businesses.find(business=>business.id===originalJob.businessId)!
  expect(sceneWorks({view:h.view(),features:h.view().features as unknown as PlayFeatures}).find(work=>work.id===originalJob.id)).toMatchObject({accountId:originalBusiness.accountId})
  await h.send('AdvanceTime',{date:'2020-01-19'})
  const first=(h.view().features as unknown as PlayFeatures).firstOrder;await h.send('SubmitDelivery',{contractId:first.contractId});await h.send('AdvanceTime',{date:'2020-01-20'});await h.send('AdvanceTime',{date:'2020-01-21'})
  const partner=lifeSceneProgress(h.life(),h.view().date,'chen-yu'),reference=partner.references[0]!
  expect(partner.choice.line).toContain(reference.date);expect(partner.choice.line).not.toContain(reference.id);expect(partner.references).toContainEqual(reference);expect(partner.choice.line).toContain('已付履约案例')
  await h.send(partner.command!.kind,partner.command!.payload)
  expect(sceneWorks({view:h.view(),features:h.view().features as unknown as PlayFeatures}).find(work=>work.id===h.life().jobs.at(-1)!.id)).toMatchObject({screen:'life',accountId:'personal',personId:'chen-yu',lifeSelection:'person'})
  await h.send('AdvanceTime',{date:'2020-01-28'})
  expect(h.view().date).toBe('2020-01-22')
  const paused=(h.view().features as unknown as PlayFeatures).workbench
  expect(paused.pause?.reason).toBe('CONTENT_DECISION_PENDING')
  const originalEvent=paused.events.find(event=>event.isBlocking)!,originalDefault=originalEvent.choices.find(choice=>choice.isDefault)!
  expect(originalDefault).toMatchObject({actionPoints:0,costFen:0})
  await h.send('ChooseEvent',{instanceId:originalEvent.id,choiceId:originalDefault.id})
  await h.send('AdvanceTime',{date:'2020-01-28'})
  expect(h.view().date).toBe('2020-01-28')
  const partnerOffer=lifeSceneProgress(h.life(),h.view().date,'chen-yu');await h.send(partnerOffer.command!.kind,partnerOffer.command!.payload)
  const life=h.life(),before=h.controller.exportSaved(),reversed={...life,promises:[...life.promises].reverse()}
  expect(pendingLifePromises(reversed,h.view().date).map(row=>row.person.id)).toEqual(['tang-ying','chen-yu'])
  expect(reversed.promises.map(row=>row.id)).toEqual([...life.promises].reverse().map(row=>row.id))
  // Only the display of a retained overdue responsibility is isolated here; this is never saved or called normal history.
  const latePromises=life.promises.map(p=>p.personId==='tang-ying'?{...p,deadline:'2020-01-27'}:p)
  const late:LifeProjection={...life,promises:latePromises,people:life.people.map(p=>({...p,promises:latePromises.filter(o=>o.personId===p.id)}))}
  expect(pendingLifePromises(late,h.view().date)[0]!.person.id).toBe('tang-ying')
  const lateScene=lifeSceneProgress(late,h.view().date,'tang-ying');expect(lateScene.stage).toBe('accepted');expect(lateScene.line).toContain('已经不能在原期限')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('requires a material choice when a current normal life has multiple real eligible sources',async()=>{
 const h=await normal('multiple-real-references',closedCourseRaw)
 try{
  await h.send('AdvanceTime',{date:'2023-04-17'})
  const before=h.controller.exportSaved(),scene=lifeSceneProgress(h.life(),h.view().date,'chen-yu')
  expect(scene.references.length).toBeGreaterThan(1)
  expect(new Set(scene.references.map(r=>r.kind))).toEqual(new Set(['paid_case','course_delivery']))
  expect(scene).toMatchObject({stage:'ready',command:null,referenceRequired:true})
  expect(scene.choice.line).toContain('请选择这次要一起看的那一份')
  const unrelatedCooperation=lifeSceneProgress(h.life(),h.view().date,'linzhou')
  expect(unrelatedCooperation).toMatchObject({stage:'unavailable',command:null,referenceRequired:false,references:[]})
  expect(unrelatedCooperation.choice.line).toContain('钱或关系不能代替真实履约及对方同意')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it.each([
 {id:'expired-original',raw:expiredRaw,stage:'expired',status:'expired',words:'没有自动接受'},
 {id:'missed-original',raw:missedRaw,stage:'missed',status:'missed',words:'失约与已发生成本保留'},
])('retains the actual $id outcome without inventing another payment or a completion',async({id,raw,stage,status,words})=>{
 const h=await normal(id,raw)
 try{
  const before=h.controller.exportSaved(),scene=lifeSceneProgress(h.life(),h.view().date,'tang-ying')
  expect(scene).toMatchObject({stage,promise:{status,completionJobId:null},command:null,waitDate:null})
  expect(scene.line).toContain(words)
  expect(pendingLifePromises(h.life(),h.view().date)).toEqual([])
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('offers an explicit paid retry for an actually interrupted personal job, preserving the original cost and spent AP',async()=>{
 const h=await normal('interrupted-original',interruptedRaw)
 try{
  const scene=lifeSceneProgress(h.life(),h.view().date,'workspace'),original=scene.job!,points=h.view().budget.available,cash=h.view().accounts.find(a=>a.accountId==='personal')!.cashFen
  expect(scene).toMatchObject({stage:'interrupted',job:{status:'interrupted'},waitDate:null,command:{kind:'StartLifeWork',payload:{kind:'workspace',personId:null,reference:null},confirm:true}})
  expect(scene.choice.line).toContain('个人已付¥3,000');expect(scene.choice.line).toContain('重新安排仍需个人¥3,000')
  await h.send(scene.command!.kind,scene.command!.payload)
  const restarted=lifeSceneProgress(h.life(),h.view().date,'workspace')
  expect(restarted).toMatchObject({stage:'running',waitDate:'2020-01-08'})
  expect(restarted.job!.id).not.toBe(original.id)
  expect(h.life().jobs.find(job=>job.id===original.id)).toMatchObject({status:'interrupted',result:null,costFen:300000,actionPoints:1})
  expect(h.view().budget.available).toBe(points-1);expect(h.view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(cash-300000)
  expect(h.life().scene.workspaceCompleted).toBe(false)
 }finally{await h.close()}
},20000)
