import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec} from './campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {RunSession} from './session.ts'
import type {PlayFeatures} from '../ui/game-types.ts'
import {publicFeedbackSince,inspectPublicWaitTransition} from './public-feedback.ts'
import beforeRaw from '../../goal-1/evidence/t17-acceptance-36/chrome-normal-r1/n07-saved17-cross-quarter-old-job.json?raw'
import afterRaw from '../../goal-1/evidence/t17-acceptance-36/chrome-normal-r1/n09-saved18-life-complete.json?raw'

type View=RunSession['view']
let previous:View,current:View
beforeAll(()=>{
 const codec=createCampaignCodec()
 const view=(raw:string):View=>{const run=codec.import(raw);return {...projectRun(run),features:codec.registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
 previous=view(beforeRaw);current=view(afterRaw)
})

it('describes the actual same-run workspace completion from the original adjacent17/18 snapshots without changing either',()=>{
 const a=JSON.stringify(previous),b=JSON.stringify(current),feedback=publicFeedbackSince(previous,current)
 expect(previous.date).toBe('2020-04-01');expect(current.date).toBe('2020-04-04')
 expect(feedback).toContainEqual(expect.objectContaining({kind:'job',sourceId:'life:719699f293d85e4fd27a700d7d9d1d3e',attention:'pause',label:'一份原工作已经有了实际结果。'}))
 expect(JSON.stringify(previous)).toBe(a);expect(JSON.stringify(current)).toBe(b)
 expect(publicFeedbackSince(previous,current)).toEqual(feedback)
})

it('does not publish candidates, unsaved frames, foreign runs, skipped revisions or a different original command',()=>{
 for(const saveStatus of ['saving','unsaved','conflict','read_only','closed'] as const)expect(publicFeedbackSince(previous,{...current,saveStatus})).toEqual([])
 expect(publicFeedbackSince(previous,{...current,hasCandidate:true})).toEqual([])
 expect(publicFeedbackSince({...previous,hasCandidate:true},current)).toEqual([])
 expect(publicFeedbackSince(previous,{...current,runId:'other'})).toEqual([])
 expect(publicFeedbackSince(previous,{...current,revision:current.revision+1})).toEqual([])
 const receipts=current.receipts.map((r,i)=>i===current.receipts.length-1?{...r,kind:'StartLifeWork'}:r)
 expect(publicFeedbackSince(previous,{...current,receipts})).toEqual([])
 expect(publicFeedbackSince(previous,{...current,receipts:current.receipts.map((r,i)=>i===0?{...r,commandId:'other-creation'}:r)})).toEqual([])
})

it('ignores date-only ordinary accumulation and never reads meter rows, private facts or future quotes',()=>{
 // Isolated public-projection counterexample, not a fabricated normal save or Native result.
 const f=previous.features as unknown as PlayFeatures,relay=f.relay?{...f.relay}:null,market=f.market?{...f.market}:null
 if(relay)Object.defineProperty(relay,'meters',{get(){throw Error('NO_METER_READ')}})
 if(market)Object.defineProperty(market,'stocks',{get(){throw Error('NO_QUOTE_READ')}})
 const features={...f,relay,market,workbench:{...f.workbench,finance:f.workbench.finance.map(a=>({...a,cashFen:a.cashFen-100,costFen:a.costFen+100,profitFen:a.profitFen-100}))}}
 const next:View={...previous,date:'2020-04-02',revision:current.revision,receipts:current.receipts,features}
 Object.defineProperties(next,{timeline:{get(){throw Error('NO_QUEUE')}},random:{get(){throw Error('NO_RANDOM')}},privateNotes:{get(){throw Error('NO_NOTES')}}})
 expect(publicFeedbackSince(previous,next)).toEqual([])
})

it('retains newly due own invoices without forcing a collection interruption',()=>{
 const f=previous.features as unknown as PlayFeatures,relay=f.relay!
 // Isolated source-ID counterexample, not an actual customer or cash receipt.
 const receivable={id:'isolated-own-invoice',customerId:'isolated-customer',sourceId:'isolated-source',date:'2020-04-01',dueAt:'2020-04-02',operationId:'isolated-operation',amountFen:100,collectedFen:0,reversedFen:0}
 const next:View={...previous,date:'2020-04-02',revision:current.revision,receipts:current.receipts,features:{...f,relay:{...relay,receivables:[...relay.receivables,receivable]}}}
 const feedback=publicFeedbackSince(previous,next)
 expect(feedback).toContainEqual(expect.objectContaining({kind:'receivable',sourceId:receivable.id,attention:'retain'}))
 expect(feedback.some(row=>row.attention==='pause')).toBe(false)
})

it('separates a public pending market settlement from its actual paidAt result',()=>{
 // Isolated projection states exercise the public schema, not invented normal trading outcomes.
 const f=previous.features as unknown as PlayFeatures,settlement={id:'isolated-sale',accountId:'personal',symbol:'ISOLATED',sourceId:'isolated-fill',amountFen:1000,dueAt:'2020-04-02',paidAt:null,kind:'sale' as const}
 const pending:View={...previous,revision:current.revision,receipts:current.receipts,features:{...f,market:{...f.market,settlements:[...f.market.settlements,settlement]}}}
 expect(publicFeedbackSince(previous,pending)).toContainEqual(expect.objectContaining({sourceId:settlement.id,label:'原投资留下了待交收的原款，还没有到账。'}))
 const paid:View={...pending,features:{...f,market:{...f.market,settlements:[...f.market.settlements,{...settlement,paidAt:'2020-04-02'}]}}}
 expect(publicFeedbackSince(previous,paid)).toContainEqual(expect.objectContaining({sourceId:settlement.id,label:'原投资的这笔交收已经实际付款。'}))
})

it('classifies a working public projection without pretending its candidate has been saved',()=>{
 const candidate={...current,saveStatus:'unsaved' as const,hasCandidate:true}
 expect(publicFeedbackSince(previous,candidate)).toEqual([])
 expect(inspectPublicWaitTransition(previous,candidate)).toContainEqual(expect.objectContaining({kind:'job',sourceId:'life:719699f293d85e4fd27a700d7d9d1d3e'}))
})

it('includes public world-preparation completion rather than passing its response window',()=>{
 // Isolated public states, not invented normal preparations or saved money.
 const f=previous.features as unknown as PlayFeatures,job={id:'isolated-world-prep',title:'原学习',accountId:'personal',startAt:'2020-04-01',completeAt:'2020-04-02',status:'running'}
 const before:View={...previous,features:{...f,workbench:{...f.workbench,preparationJobs:[job]}}}
 const after:View={...before,date:'2020-04-02',revision:current.revision,receipts:current.receipts,features:{...f,workbench:{...f.workbench,preparationJobs:[{...job,status:'completed'}]}}}
 expect(publicFeedbackSince(before,after)).toContainEqual(expect.objectContaining({sourceId:job.id,kind:'job',attention:'pause'}))
})

it('pauses on the first publicly reported service problem, not every later accumulated day',()=>{
 // Only the public failed-day summary is supplied; meter rows stay unread.
 const f=previous.features as unknown as PlayFeatures,period={id:'isolated-period',status:'active',feePostedAt:null,compensatedAt:null,failedDays:0}
 const relay={...f.relay,periods:[period]};Object.defineProperty(relay,'meters',{get(){throw Error('NO_METER_READ')}})
 const before:View={...previous,features:{...f,relay}}
 const after:View={...before,date:'2020-04-02',revision:current.revision,receipts:current.receipts,features:{...f,relay:{...f.relay,periods:[{...period,failedDays:1}]}}}
 expect(publicFeedbackSince(before,after)).toContainEqual(expect.objectContaining({sourceId:period.id,attention:'pause',label:'这份原服务出现了需要核对的情况。'}))
 const known:View={...before,features:after.features},more:View={...after,features:{...f,relay:{...f.relay,periods:[{...period,failedDays:2}]}}}
 expect(publicFeedbackSince(known,more)).toEqual([])
})

it('distinguishes an already known governance date from its actual effective day without reading the vote outcome',()=>{
 const f=previous.features as unknown as PlayFeatures,governance={id:'isolated-governance',resolvedAt:'2020-03-31'}
 Object.defineProperty(governance,'approved',{get(){throw Error('NO_FUTURE_VOTE_READ')}})
 const features={...f,deepseek:{...f.deepseek,governance:[governance],policies:[{governanceId:governance.id,policy:'independent_audit',date:'2020-04-02'}]}}
 const before:View={...previous,features},after:View={...before,date:'2020-04-02',revision:current.revision,receipts:current.receipts}
 expect(publicFeedbackSince(before,after)).toContainEqual(expect.objectContaining({sourceId:governance.id,attention:'pause',label:'原先谈妥的治理安排已经实际生效。'}))
})
