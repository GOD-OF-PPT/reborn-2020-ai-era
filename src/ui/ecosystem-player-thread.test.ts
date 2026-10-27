import {beforeAll,expect,it} from 'vitest'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {prepareEco} from '../testing/deepseek-scenarios.ts'
import {ecosystemFocusFor,ecosystemFocusFromSaved,resolveEcosystemFocus,ecosystemJourneyFor,ecosystemFocusTargets,type EcosystemThreadInput} from './ecosystem-player-thread.ts'
import {loadSeasonFocusPreference,saveSeasonFocusPreference} from './season-focus-preference.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'

type Harness=ReturnType<typeof prepareEco>['h']
function input(h:Harness):EcosystemThreadInput{return {view:{...projectRun(h.run),saveStatus:'saved',hasCandidate:false,readOnly:false},features:{deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)}}}
let before:EcosystemThreadInput,accepted:EcosystemThreadInput,review:EcosystemThreadInput,collected:EcosystemThreadInput,beforeCollection:EcosystemThreadInput
let leadId:string,contractId:string,businessId:string,deliveryId:string,collectionAmount:number
beforeAll(()=>{
 // Fixed independent-financial fixture. Only public projections are passed to the UI seam.
 const prepared=prepareEco(),h=prepared.h;leadId=prepared.lead.id;businessId=prepared.b.id;before=input(h)
 h.send('AcceptEcoContract',{leadId,scope:'standard',resources:['player-production'],startAt:'2024-07-02'});contractId=h.run.deepseek!.contracts[0]!.id;accepted=input(h)
 const c=h.run.deepseek!.contracts[0]!;h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt});h.send('SubmitEcoDelivery',{contractId});review=input(h)
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.completeAt});const d=h.run.deepseek!.deliveries.find(d=>d.creditFen>0)!;deliveryId=d.id;collectionAmount=d.creditFen;h.send('AdvanceTime',{date:d.dueAt>h.run.timeline.cursor.date?d.dueAt:h.run.timeline.cursor.date});beforeCollection=input(h);h.send('CollectEcoReceivable',{deliveryId,amountFen:collectionAmount});collected=input(h)
})
const target=(p:EcosystemThreadInput,kind:Exclude<EcosystemSceneTarget['kind'],'business'>,recordId:string):EcosystemSceneTarget=>({kind,recordId,runId:p.view.runId,businessId,accountId:p.features.deepseek!.businesses.find(b=>b.id===businessId)!.accountId})

it('keeps full public identity and rejects an outer account or record that disagrees with its target',()=>{
 const focus=ecosystemFocusFor(before,target(before,'lead',leadId))
 expect(resolveEcosystemFocus(before,focus).reason).toBeNull()
 expect(resolveEcosystemFocus(before,{...focus,accountId:'personal'}).reason).toEqual(expect.any(String))
 expect(resolveEcosystemFocus(before,{...focus,entityId:'another-lead'}).reason).toEqual(expect.any(String))
 expect(resolveEcosystemFocus(before,{...focus,runId:'another-life'}).reason).toEqual(expect.any(String))
})

it('follows the actual accepted contract only after the original one-step saved revision',()=>{
 const focus=ecosystemFocusFor(before,target(before,'lead',leadId)),body={leadId,scope:'standard',resources:['player-production'],startAt:'2024-07-02'}
 const next=ecosystemFocusFromSaved(before,accepted,'AcceptEcoContract',body,focus)
 expect(next?.ecosystemTarget).toMatchObject({kind:'contract',recordId:contractId,businessId})
 expect(ecosystemFocusFromSaved(before,{...accepted,view:{...accepted.view,saveStatus:'unsaved',hasCandidate:true}},'AcceptEcoContract',body,focus)).toBeNull()
 expect(ecosystemFocusFromSaved(before,{...accepted,view:{...accepted.view,readOnly:true}},'AcceptEcoContract',body,focus)).toBeNull()
 expect(ecosystemFocusFromSaved(before,{...accepted,view:{...accepted.view,revision:accepted.view.revision+1}},'AcceptEcoContract',body,focus)).toBeNull()
 expect(ecosystemFocusFromSaved(before,accepted,'AcceptEcoContract',{...body,leadId:'another-original-lead'},focus)).toBeNull()
 expect(ecosystemFocusFromSaved(before,accepted,'AcceptEcoContract',{...body,resources:['not-the-committed-resource']},focus)).toBeNull()
})

it('does not use ordinary time or an unrelated event to select a new ecology object',()=>{
 const f=ecosystemFocusFor(accepted,target(accepted,'contract',contractId))
 expect(ecosystemFocusFromSaved(accepted,review,'AdvanceTime',{date:review.view.date},f)).toBeNull()
 expect(ecosystemFocusFromSaved(accepted,review,'ChooseEvent',{instanceId:'ordinary'},f)).toBeNull()
 expect(ecosystemJourneyFor(review,ecosystemFocusFor(review,target(review,'contract',contractId))).phase).toBe('customer-review')
})

it('keeps the same original contract focus when an actual collection changes its cash instead of income',()=>{
 const f=ecosystemFocusFor(beforeCollection,target(beforeCollection,'contract',contractId)),body={deliveryId,amountFen:collectionAmount}
 expect(ecosystemFocusFromSaved(beforeCollection,collected,'CollectEcoReceivable',body,f)).toBe(f)
 expect(ecosystemFocusFromSaved(beforeCollection,collected,'CollectEcoReceivable',{...body,amountFen:collectionAmount+1},f)).toBeNull()
 expect(ecosystemJourneyFor(collected,ecosystemFocusFor(collected,target(collected,'delivery',deliveryId))).resultDate).toBe(collected.view.date)
 expect(collected.features.deepseek!.contracts[0]!.balance!.recognizedIncomeFen).toBe(beforeCollection.features.deepseek!.contracts[0]!.balance!.recognizedIncomeFen)
})

it('roundtrips an ecology bookmark as UI-only data with exact run/account/business and target shape',()=>{
 const values=new Map<string,string>(),storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}},focus=ecosystemFocusFor(accepted,target(accepted,'contract',contractId)),quarter=accepted.features.workbench.quarter,scope={runId:accepted.view.runId,quarter}
 const saved=saveSeasonFocusPreference(storage,{version:1,...scope,focus},{...scope,saveStatus:'saved',hasCandidate:false,busy:false})
 expect(saved.status).toBe('saved');expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',record:{focus}})
 const changed={...focus,ecosystemTarget:{...focus.ecosystemTarget!,accountId:'personal'}}
 expect(saveSeasonFocusPreference(storage,{version:1,...scope,focus:changed},{...scope,saveStatus:'saved',hasCandidate:false,busy:false}).status).toBe('invalid')
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',record:{focus}})
})

it('lists original ecology records without manufacturing an equity choice or replacing a stale selection',()=>{
 const rows=ecosystemFocusTargets(accepted)
 expect(rows.some(r=>r.target.kind==='contract'&&r.target.recordId===contractId)).toBe(true)
 expect(rows.every(r=>r.target.businessId===businessId)).toBe(true)
 const stale=ecosystemFocusFor(accepted,target(accepted,'contract','missing-original-contract'))
 expect(resolveEcosystemFocus(accepted,stale).reason).toEqual(expect.any(String))
 expect(stale.ecosystemTarget).toMatchObject({recordId:'missing-original-contract'})
})

it('keeps one actual remediation through its full pair budget, work, resubmission and finite original result',()=>{
 // Original fixed rule fixture; no seed search, normal-play or Native claim.
 const r=prepareEco({parameters:{deliveryAcceptBps:0}}),h=r.h,a=(ds:string)=>({resources:['player-production'],startAt:ds})
 h.send('AcceptEcoContract',{leadId:r.lead.id,scope:'pilot',...a('2024-07-02')});const c=h.run.deepseek!.contracts[0]!
 h.send('AdvanceTime',{date:'2024-07-05'});h.send('SubmitEcoDelivery',{contractId:c.id});h.send('AdvanceTime',{date:'2024-07-08'})
 expect(h.run.deepseek!.contracts[0]!.status).toBe('rejected')
 const scene=()=>{const p=input(h),b=p.features.deepseek!.businesses.find(b=>b.id===r.b.id)!;return ecosystemJourneyFor(p,ecosystemFocusFor(p,{runId:p.view.runId,accountId:b.accountId,businessId:b.id,kind:'contract',recordId:c.id}))}
 h.send('StartEcoRemediation',{contractId:c.id,...a('2024-07-09')});let current=scene()
 expect(current.title).toContain('补救');expect(current.object).toContain('补救');expect(current.line).toContain('后续支持另在2024-07-19—2024-07-22');expect(current.line).toContain('已付¥400');expect(current.line).toContain('预留¥800')
 h.send('AdvanceTime',{date:'2024-07-09'});current=scene();expect(current.title).toContain('补救');expect(current.line).toContain('已付¥900');expect(current.line).toContain('预留¥300')
 h.send('AdvanceTime',{date:'2024-07-16'});current=scene();expect(current).toMatchObject({phase:'ready-to-submit',paper:'ready',action:{kind:'command',command:'SubmitEcoDelivery',payload:{contractId:c.id}}});expect(current.action.label).toContain('补救稿')
 h.send('SubmitEcoDelivery',{contractId:c.id});current=scene();expect(current.title).toContain('补救稿已经交出');expect(current.outcome).toBe('pending')
 h.send('AdvanceTime',{date:'2024-07-19'});current=scene();const status=h.run.deepseek!.contracts[0]!.status
 expect(['rejected','support']).toContain(status);expect(current.title).toContain('补救');expect(h.preview('StartEcoRemediation',{contractId:c.id,...a('2024-07-20')}).allowed).toBe(false)
 if(status==='rejected'){expect(current.line).toContain('一次补救已用完');expect(current.action.label).toContain('退款');expect(current.action.label).not.toContain('再试')}
 else expect(current).toMatchObject({phase:'support',paper:'support'})
 const raw=h.codec.export(h.run);scene();expect(h.codec.export(h.run)).toBe(raw)
})
