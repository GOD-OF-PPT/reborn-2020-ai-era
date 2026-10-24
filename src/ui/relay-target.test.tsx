import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import RelayPanel,{relayPanelTargetLocation} from './RelayPanel.tsx'
import type {RelaySceneIdentity,RelaySceneTarget} from './relay-scene-target.ts'
import {relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import plannedRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-relay-fault-r12/r92-normal-for-service-abort-text-before-import.json?raw'

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
