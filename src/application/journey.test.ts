import {expect,it} from 'vitest'
import {createCampaignRun,createCampaignCodec,campaignJourney} from './campaign.ts'
import {projectJourney} from '../core/journey.ts'
import {hashValue} from '../core/hash.ts'
import {StoryHarness} from '../testing/story-harness.ts'
import {accountFunds} from '../core/ledger.ts'
import legacyText from '../../goal-1/evidence/d07-film-play/prod-reloaded-verified-s26.json?raw'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from './game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {JourneyPanel} from '../ui/JourneyPanel.tsx'
import type {PlayFeatures} from '../ui/game-types.ts'

const fresh=()=>createCampaignRun({runId:'t16-quarter-work',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'t16-campaign-0',playerProfile:{wishId:'autonomy',approach:'free'}})

it('rejects the actual prior schema12 export without rewriting its original text',()=>{
 const original=legacyText
 expect(JSON.parse(original).schemaVersion).toBe(12)
 expect(()=>createCampaignCodec().import(original)).toThrow('UNSUPPORTED_SCHEMA_VERSION')
 expect(legacyText).toBe(original)
})

it('the chapter film reveals only opened quarters and never mutates the saved life',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t16-journey-film'});let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`t16-film-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t16-campaign-0'})
 try{const view=controller.snapshot.view!,before=controller.exportSaved(),noop=()=>{throw Error('RENDER_MUST_NOT_ACT')},html=renderToStaticMarkup(createElement(JourneyPanel,{p:{controller,view,features:view.features as unknown as PlayFeatures,request:noop,accountId:'personal'},onYear:noop,onChoose:noop}))
  expect(html).toContain('2020-Q1');expect(html).not.toContain('翻看2021年篇章');expect(html).not.toContain('2020-Q2');expect(html).toContain('还没有本季结束记录');expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)

it('reading a chapter cannot finish it, and re-signed edits cannot create or remove its timers',()=>{
 const run=fresh(),codec=createCampaignCodec(),before=codec.export(run)
 const projection=projectJourney(run,campaignJourney)!
 expect(projection.closedQuarters).toBe(0);expect(projection.chapters.map(q=>q.id)).toEqual(['2020-Q1']);expect(codec.export(run)).toBe(before)
 const closed=structuredClone(run);closed.journey!.quarters[0]!.closedAt='2020-03-31';closed.journey!.quarters[0]!.closeSourceId='journey:close:2020-Q1'
 expect(()=>codec.export(closed)).toThrow('JOURNEY_QUARTER_SOURCE_MISMATCH')
 const removed={...run,timeline:{...run.timeline,pending:run.timeline.pending.filter(e=>e.instanceId!=='journey:open:2020-Q2')}}
 expect(()=>codec.export(removed)).toThrow('JOURNEY_TIMER_COUNT')
 const moved={...run,timeline:{...run.timeline,pending:run.timeline.pending.map(e=>e.instanceId==='journey:close:2020-Q1'?{...e,priority:0}:e)}}
 expect(()=>codec.export(moved)).toThrow('JOURNEY_TIMER_MISMATCH')
})

it('a normal no-agent working life records all 24 real quarters, salaries and costs without viewing rewards',()=>{
 const h=new StoryHarness({priorRun:fresh()})
 h.at('2020-03-30');h.send('AdvanceTime',{date:'2020-03-31',phase:'player_actions'})
 expect(h.run.journey!.quarters[0]!.closedAt).toBeNull()
 h.send('AdvanceTime',{date:'2020-03-31'})
 expect(h.run.journey!.quarters[0]!.closedAt).toBe('2020-03-31')
 const first=h.codec.export(h.run),random=hashValue(h.run.random);projectJourney(h.run,campaignJourney);expect(h.codec.export(h.run)).toBe(first);expect(hashValue(h.run.random)).toBe(random)
 h.at('2025-12-31')
 const j=h.run.journey!,projection=projectJourney(h.run,campaignJourney)!
 expect(j.quarters).toHaveLength(24);expect(new Set(j.quarters.map(q=>q.quarter)).size).toBe(24)
 expect(projection.closedQuarters).toBe(24);expect(projection.yearThemes).toHaveLength(6)
 expect(h.run.operations!.employment).toHaveLength(24)
 expect(h.run.operations!.payroll.filter(p=>p.kind==='salary'&&p.amountFen>0)).toHaveLength(72)
 expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(31800000)
 expect(h.run.story!.deployments).toHaveLength(0)
 const receipt=h.run.timeline.receipts.find(r=>r.instanceId==='journey:close:2025-Q4')!
 expect(receipt.phase).toBe('snapshot')
 const lost={...h.run,causes:h.run.causes.filter(c=>c.sourceEventId!=='journey:close:2025-Q4')}
 expect(()=>h.codec.export(lost)).toThrow()
 expect(h.codec.export(h.codec.import(h.codec.export(h.run)))).toBe(h.codec.export(h.run))
},120000)
