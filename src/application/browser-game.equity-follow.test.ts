import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import {createBrowserGame} from './browser-game.ts'
import {createCampaignCodec} from './campaign.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'

// Consume the real browser assembly. Native Web Locks and Chrome's physical
// transactions remain separate checks; no duplicate predicate or custom store.
let fault:Awaited<ReturnType<typeof createBrowserGame>>,normal:Awaited<ReturnType<typeof createBrowserGame>>,physical:IndexedDbRunStore
let saved:string,candidate:string
beforeAll(async()=>{
 const factory=new IDBFactory()
 vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange)
 vi.stubGlobal('navigator',{locks:{request:async(_name:string,_options:unknown,callback:(lock:unknown)=>Promise<void>)=>callback({mode:'exclusive'})}})
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()})
 vi.stubGlobal('location',{search:'?storageTest=abort-equity-follow'});vi.stubEnv('DEV',true)
 fault=await createBrowserGame();await fault.controller.initialize();await fault.controller.importNew(raw);saved=fault.controller.exportSaved()
 physical=new IndexedDbRunStore({codec:createCampaignCodec(),factory,keyRange:IDBKeyRange,name:'reborn-2020-t17-equity-follow-abort-validation'})
 vi.stubEnv('DEV',false);normal=await createBrowserGame();await normal.controller.initialize()
})
afterAll(async()=>{await fault?.controller.close(true);await normal?.controller.close(true);await physical?.close();vi.unstubAllEnvs();vi.unstubAllGlobals()})

it('loads the original pending round without firing and keeps this switch out of production assembly',()=>{
 expect(fault.diagnostics).toMatchObject({name:'reborn-2020-t17-equity-follow-abort-validation',trace:{writeSucceeded:false,abortIssued:false}})
 expect(fault.controller.snapshot.view).toMatchObject({revision:121,saveStatus:'saved'})
 expect(saved).toBe(raw);expect(normal.diagnostics).toBeNull();expect(normal.controller.snapshot.runs).toEqual([])
})

it('aborts the actual new positive follow after head.put succeeds and keeps physical state at the original pending round',async()=>{
 const a=JSON.parse(saved).state.deepseek.agreements[0]
 const result=await fault.controller.submit(fault.controller.prepare('FollowEquityRound',{agreementId:a.id,amountFen:249600}))
 expect(result.status).toBe('unsaved');expect(fault.diagnostics!.trace).toEqual({writeSucceeded:true,abortIssued:true})
 expect(fault.controller.exportSaved()).toBe(saved);expect(fault.controller.snapshot.view).toMatchObject({revision:121,saveStatus:'unsaved',hasCandidate:true,pendingRevision:122})
 expect((await physical.load(fault.controller.snapshot.view!.runId))!.run).toEqual(JSON.parse(saved).state)
 candidate=fault.controller.exportCandidate();expect(JSON.parse(candidate).state.deepseek.agreements[0]).toMatchObject({shares:2812,followAmountFen:249600,followDecision:'participated'})
})

it('saves the exact original candidate on retry, without executing another follow or charging another principal',async()=>{
 expect((await fault.controller.retry()).status).toBe('saved');expect(fault.controller.exportSaved()).toBe(candidate)
 expect(fault.controller.snapshot.view).toMatchObject({revision:122,saveStatus:'saved',hasCandidate:false})
 expect((await physical.load(fault.controller.snapshot.view!.runId))!.run).toEqual(JSON.parse(candidate).state)
 const run=JSON.parse(candidate).state
 expect(run.receipts.filter((r:{kind:string})=>r.kind==='FollowEquityRound')).toHaveLength(1)
 expect(fault.diagnostics!.trace).toEqual({writeSucceeded:true,abortIssued:true})
})
