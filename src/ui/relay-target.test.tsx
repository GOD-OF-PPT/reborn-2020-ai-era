import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import RelayPanel,{relayPanelTargetLocation} from './RelayPanel.tsx'
import * as CommandControls from './CommandButton.tsx'
import type {RelaySceneIdentity,RelaySceneTarget} from './relay-scene-target.ts'
import {relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import plannedRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-relay-fault-r12/r92-normal-for-service-abort-text-before-import.json?raw'
import dueRaw from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved83-mid-service-first-original-due.json?raw'
import futureRaw from '../../goal-1/evidence/t17-acceptance-34/chrome-final-service-r2/r2-saved85-current-separate-record-entries.json?raw'

const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-book-target'})
let sequence=0
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`relay-book-target-${++sequence}`})
let p:GamePanelProps,target:RelaySceneIdentity&{readonly kind:'period';readonly periodId:string}
beforeAll(async()=>{
 await controller.initialize();await controller.importNew(plannedRaw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,relay=features.relay!,period=relay.periods[0]!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!
 p={controller,view,features,accountId:business.accountId,request:vi.fn()}
 target={kind:'period',runId:view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
},20000)
afterAll(async()=>{await controller.close();await store.close()})

it('gates invalid original run, account, station, period and job before rendering executable forms',()=>{
 const before=controller.exportSaved(),chosen=vi.fn()
 for(const changed of [{runId:'another-life'},{accountId:'personal'},{businessId:'another-station'},{stationId:'missing-station'},{periodId:'missing-period'},{jobId:'missing-job'}]){
  const invalid={...target,...changed} as RelaySceneTarget
  expect(relayPanelTargetLocation(p,invalid)).toMatchObject({anchor:null})
  const html=renderToStaticMarkup(<RelayPanel {...p} initialTarget={invalid} onTargetChange={chosen}/>)
  expect(html).toContain('原对象没有换成另一站');expect(html).toContain('重新选择')
  expect(html).not.toContain('<form');expect(html).not.toContain('停止本周期后续请求');expect(html).not.toContain('以自有资金准备中转站')
 }
 for(const initialTarget of [undefined,null]){
  const html=renderToStaticMarkup(<RelayPanel {...p} accountId="unknown-account" {...(initialTarget===null?{initialTarget:null}:{})} onTargetChange={chosen}/>)
  expect(html).toContain('原中转账户已经不可核');expect(html).not.toContain('以自有资金准备中转站');expect(html).not.toContain('<form')
 }
 expect(chosen).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('locates both original jobs and keeps a job record distinct from a new audit or service draft',()=>{
 const before=controller.exportSaved(),period=p.features.relay!.periods[0]!
 expect(relayPanelTargetLocation(p,target)).toEqual({reason:null,anchor:period.id+'-period'})
 for(const jobId of [period.jobId,period.supportJobId]){
  const original:RelaySceneTarget={...target,jobId}
  const location=relayPanelTargetLocation(p,original)
  expect(location).toEqual({reason:null,anchor:'relay-period-job:'+period.id+':'+jobId})
  expect(relayDraftScopeForTarget(p,original,'audit')).toMatchObject({scope:null})
  expect(relayDraftScopeForTarget(p,original,'service')).toMatchObject({scope:null})
 }
 const html=renderToStaticMarkup(<RelayPanel {...p} initialTarget={{...target,jobId:period.supportJobId}}/>)
 expect(html).toContain('id="relay-period-job:'+period.id+':'+period.supportJobId+'"')
 expect(html).toContain('明确翻回本期，再决定新的复核');expect(html).toContain('明确回到本站，另拟新的服务')
 expect(html).not.toContain('本次现有可核记录');expect(html).not.toContain('拟定新一期')
 const slotInvalid=renderToStaticMarkup(<RelayPanel {...p} initialTarget={{...target,jobId:period.jobId}} initialDraftSlot="audit"/>)
 expect(slotInvalid).toContain('原任务没有被当作另一份委托');expect(slotInvalid).not.toContain('<form')
 expect(controller.exportSaved()).toBe(before);expect(p.request).not.toHaveBeenCalled()
},20000)

it('keeps real application, audience and customer leaf anchors in this same station',()=>{
 const relay=p.features.relay!,before=controller.exportSaved()
 const application=relay.applications[0]!,audience=relay.audiences[0]!,customer=relay.customers[0]!
 const identity={runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId}
 for(const [leaf,id] of [[{kind:'application',applicationId:application.id},application.id],[{kind:'audience',audienceId:audience.id},audience.id],[{kind:'customer',customerId:customer.id},customer.id]] as const){
  const exact:RelaySceneTarget={...identity,...leaf}
  expect(relayPanelTargetLocation(p,exact)).toEqual({reason:null,anchor:id})
 }
 expect(controller.exportSaved()).toBe(before)
})

it('places the single original-book service and audit action before their complete field groups',()=>{
 const before=controller.exportSaved(),relay=p.features.relay!,businessTarget:RelaySceneTarget={kind:'business',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId},memory=createRelaySceneDraftMemory(p.view.runId),book={...p,relayDraftMemory:memory}
 memory.write(p.view.runId,relayDraftScopeForTarget(p,businessTarget,'service').scope!,{...emptyRelaySceneDraft(),customerIds:relay.customers.filter(c=>c.businessId===target.businessId&&c.closedAt===null).map(c=>c.id)})
 const service=renderToStaticMarkup(<RelayPanel {...book} initialTarget={businessTarget} initialDraftSlot="service"/>),fields=service.indexOf('class="relay-service-editor"'),next=service.indexOf('继续核对下一步 →')
 expect(fields).toBeGreaterThan(-1);expect(next).toBeGreaterThan(-1)
 expect(next,'the complete original-book list must not precede the only next-step action').toBeLessThan(fields)
 expect(service.match(/继续核对下一步 →/g)).toHaveLength(1)
 const clientGroup=service.slice(fields,service.indexOf('</fieldset>',fields))
 expect(clientGroup.match(/checked=""/g)).toHaveLength(6)
 for(let number=1;number<=6;number++)expect(clientGroup).toContain('客户'+number+' · ')
 const audit=renderToStaticMarkup(<RelayPanel {...p} initialTarget={target} initialDraftSlot="audit"/>),auditFields=audit.indexOf('class="relay-audit-editor"'),action=audit.indexOf('先明确资源与日期，核对原计量')
 expect(auditFields).toBeGreaterThan(-1);expect(action).toBeGreaterThan(-1);expect(action).toBeLessThan(auditFields)
 expect(audit.match(/先明确资源与日期，核对原计量/g)).toHaveLength(1)
 expect(audit).toContain('实际开工日期');expect(audit).toContain('完成前不揭示实计')
 expect(controller.exportSaved()).toBe(before);expect(p.request).not.toHaveBeenCalled()
},20000)


it('reveals the same original due-customer collection action while future, invalid and readonly records keep their own boundaries',async()=>{
 const opened:{store:IndexedDbRunStore;controller:GameController}[]=[],commands=vi.spyOn(CommandControls,'CommandButton'),oldPlanned=controller.exportSaved()
 const load=async(raw:string,name:string):Promise<GamePanelProps>=>{
  const ownCodec=createCampaignCodec(),ownStore=new IndexedDbRunStore({codec:ownCodec,factory:new IDBFactory(),keyRange:IDBKeyRange,name}),ownController=new GameController({codec:ownCodec,store:ownStore,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
  opened.push({store:ownStore,controller:ownController})
  await ownController.initialize();await ownController.importNew(raw)
  const view=ownController.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!
  return {controller:ownController,view,features,accountId:business.accountId,request:vi.fn()}
 }
 const customerTarget=(source:GamePanelProps,customerId:string):RelaySceneTarget=>{
  const relay=source.features.relay!,customer=relay.customers.find(row=>row.id===customerId)!,business=relay.businesses.find(row=>row.id===customer.businessId)!,station=relay.stations.find(row=>row.businessId===business.id)!
  return {kind:'customer',runId:source.view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,customerId}
 }
 try{
  const due=await load(dueRaw,'relay-target-actual-due'),future=await load(futureRaw,'relay-target-actual-future'),dueSaved=due.controller.exportSaved(),futureSaved=future.controller.exportSaved(),relay=due.features.relay!,customer=relay.customers.find(row=>row.dueReceivableFen>0)!,other=relay.customers.find(row=>row.id!==customer.id&&row.dueReceivableFen===0)!,exact=customerTarget(due,customer.id),anchor='relay-customer-due:'+customer.id,number=relay.customers.filter(row=>row.businessId===customer.businessId).findIndex(row=>row.id===customer.id)+1,label='收取客户'+number+'实际已到期应收'
  expect(customer.dueReceivableFen).toBeGreaterThan(0);expect(other).toBeDefined()
  expect(relayPanelTargetLocation(due,exact)).toEqual({reason:null,anchor})
  const html=renderToStaticMarkup(<RelayPanel {...due} initialTarget={exact}/>),start=html.indexOf('id="'+anchor+'"'),action=html.slice(start,html.indexOf('</div>',start)+6)
  expect(start).toBeGreaterThan(-1);expect(action).toContain(label);expect(action).not.toContain('disabled=""')
  expect(action).not.toContain('收取客户'+(relay.customers.findIndex(row=>row.id===other.id)+1)+'实际已到期应收')
  expect(commands.mock.calls.filter(([props])=>props.kind==='CollectRelayDue'&&props.label===label)).toHaveLength(1)
  expect(commands.mock.calls.find(([props])=>props.kind==='CollectRelayDue'&&props.label===label)?.[0]).toMatchObject({payload:{customerId:customer.id},request:due.request})
  expect(relayPanelTargetLocation(due,customerTarget(due,other.id))).toEqual({reason:null,anchor:other.id})
  const futureCustomer=future.features.relay!.customers.find(row=>row.dueReceivableFen===0&&row.balance.receivableFen>0)!,futureTarget=customerTarget(future,futureCustomer.id)
  expect(future.features.relay!.receivables.some(row=>row.customerId===futureCustomer.id&&row.dueAt>future.view.date&&row.amountFen-row.collectedFen-row.reversedFen>0)).toBe(true)
  expect(relayPanelTargetLocation(future,futureTarget)).toEqual({reason:null,anchor:futureCustomer.id})
  const empty=p.features.relay!.customers.find(row=>row.dueReceivableFen===0)!,emptyTarget=customerTarget(p,empty.id)
  expect(relayPanelTargetLocation(p,emptyTarget)).toEqual({reason:null,anchor:empty.id})
  const missing={...exact,customerId:'missing-original-customer'} as RelaySceneTarget
  expect(relayPanelTargetLocation(due,missing).anchor).toBeNull()
  expect(relayPanelTargetLocation(due,{...exact,runId:'a-different-original-life'}).anchor).toBeNull()
  expect(renderToStaticMarkup(<RelayPanel {...due} initialTarget={missing}/>)).toContain('原对象没有换成另一站')
  // A bounded public display variant checks closed-record reachability, not a new legal close/save.
  const closed={...p,features:{...p.features,relay:{...p.features.relay!,customers:p.features.relay!.customers.map(row=>row.id===empty.id?{...row,closedAt:p.view.date}:row)}}}
  expect(relayPanelTargetLocation(closed,emptyTarget)).toEqual({reason:null,anchor:empty.id})
  expect(renderToStaticMarkup(<RelayPanel {...closed} initialTarget={emptyTarget}/>)).toContain('id="'+empty.id+'"')
  const readonly=renderToStaticMarkup(<RelayPanel {...due} view={{...due.view,readOnly:true}} initialTarget={exact}/>),readonlyStart=readonly.indexOf('id="'+anchor+'"'),readonlyAction=readonly.slice(readonlyStart,readonly.indexOf('</div>',readonlyStart)+6)
  expect(readonlyAction).toContain(label);expect(readonlyAction).toContain('disabled=""')
  expect(due.request).not.toHaveBeenCalled();expect(future.request).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
  expect(due.controller.exportSaved()).toBe(dueSaved);expect(future.controller.exportSaved()).toBe(futureSaved);expect(controller.exportSaved()).toBe(oldPlanned)
 }finally{
  commands.mockRestore()
  for(const own of opened){await own.controller.close();await own.store.close()}
 }
},20000)
