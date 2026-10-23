import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {loadSeasonFocusPreference,saveSeasonFocusPreference,seasonFocusPreferenceKey,SEASON_FOCUS_PREFERENCE_MAX_TEXT_LENGTH,type SeasonFocusPreference,type SeasonFocusPreferenceStorage,type SeasonFocusPreferenceGate} from './season-focus-preference.ts'

class MemoryPreferences implements SeasonFocusPreferenceStorage{
 readonly values=new Map<string,string>();reads=0;writes=0
 getItem(key:string){this.reads++;return this.values.get(key)??null}
 setItem(key:string,value:string){this.writes++;this.values.set(key,value)}
}
const scope={runId:'preference-life',quarter:'2020-Q2'}
const focus:OpeningFocus={runId:scope.runId,accountId:'personal',entityId:'original-rest-job',kind:'life',selection:'rest'}
const preference=(changes:Partial<SeasonFocusPreference>={}):SeasonFocusPreference=>({version:1,...scope,focus,...changes})
const gate=(changes:Partial<SeasonFocusPreferenceGate>={}):SeasonFocusPreferenceGate=>({...scope,saveStatus:'saved',hasCandidate:false,busy:false,...changes})
const input=(view:PlayingView)=>({view,features:view.features as unknown as PlayFeatures})

it('keeps run-separated UI identity records without storing game amounts, previews or results',()=>{
 const storage=new MemoryPreferences(),record=preference()
 expect(loadSeasonFocusPreference(storage,scope).status).toBe('missing');expect(storage.writes).toBe(0)
 expect(saveSeasonFocusPreference(storage,record,gate())).toMatchObject({status:'saved',record})
 const raw=storage.values.get(seasonFocusPreferenceKey(scope.runId))!
 expect(JSON.parse(raw)).toEqual(record)
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',quarterStatus:'current',record,raw})
 const otherScope={runId:'another-life',quarter:scope.quarter},other=preference({runId:otherScope.runId,focus:{...focus,runId:otherScope.runId}})
 expect(loadSeasonFocusPreference(storage,otherScope).status).toBe('missing')
 expect(saveSeasonFocusPreference(storage,other,gate(otherScope)).status).toBe('saved')
 expect(storage.values.get(seasonFocusPreferenceKey(scope.runId))).toBe(raw)
 expect(seasonFocusPreferenceKey('run:a')).not.toBe(seasonFocusPreferenceKey('run%3Aa'))
 expect(raw).not.toMatch(/amount|cost|preview|receipt|result|stage/)
})

it('loads original v1 text unchanged and stores only a strict complete video identity in the same UI version',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId),oldRaw=JSON.stringify(preference(),null,2)
 storage.values.set(key,oldRaw);expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',raw:oldRaw});expect(storage.writes).toBe(0);expect(storage.values.get(key)).toBe(oldRaw)
 const video:OpeningFocus={kind:'video',runId:scope.runId,accountId:'personal',businessId:'original-business',entityId:'original-contract',videoTarget:{channelId:'original-channel',workId:'original-work',contractId:'original-contract'}}
 expect(saveSeasonFocusPreference(storage,preference({focus:video}),gate())).toMatchObject({status:'saved',record:{focus:video}})
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',record:{focus:video}})
 expect(saveSeasonFocusPreference(storage,preference({focus:{kind:'video',runId:scope.runId,accountId:'personal',entityId:null,videoTarget:null}}),gate()).status).toBe('saved')
})

it('preserves malformed video chains instead of completing them into another work or overwriting their text',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId)
 const video={kind:'video',runId:scope.runId,accountId:'personal',businessId:'business',entityId:'contract',videoTarget:{channelId:'channel',workId:'work',contractId:'contract'}}
 for(const bad of [{...video,entityId:'work'},{...video,businessId:undefined},{...video,videoTarget:{channelId:'channel',contractId:'contract'}},{...video,videoTarget:{...video.videoTarget,amountFen:1}},{...video,videoTarget:{channelId:'',workId:'work',contractId:'contract'}},{...video,videoTarget:{...video.videoTarget,marketingId:'marketing'}},{...video,videoTarget:{channelId:'channel',workId:'contract',contractId:'contract'}}]){
  const raw=JSON.stringify(preference({focus:bad as OpeningFocus}));storage.values.set(key,raw)
  expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'invalid',reason:'invalid-record',raw});expect(saveSeasonFocusPreference(storage,preference(),gate())).toMatchObject({status:'preserved',raw});expect(storage.values.get(key)).toBe(raw)
 }
 expect(storage.writes).toBe(0)
})

it('rejects unsupported or nonidentity fields and preserves each original string without cleanup or overwrite',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId)
 const records=[
  {value:{...preference(),version:2},reason:'unsupported-version'},
  {value:{...preference(),focus:{...focus,kind:'future-route'}},reason:'unsupported-focus-kind'},
  {value:{...preference(),amountFen:1},reason:'invalid-record'},
  {value:{...preference(),focus:{...focus,resultRefs:[]}},reason:'invalid-record'},
  {value:{...preference(),focus:{kind:'life',runId:scope.runId,accountId:'personal',selection:'rest'}},reason:'invalid-record'},
  {value:{...preference(),focus:{...focus,selection:'future-person'}},reason:'invalid-record'},
  {value:{...preference(),focus:{runId:scope.runId,kind:'market',accountId:'personal',entityId:'original-order',entityKind:'future-record'}},reason:'invalid-record'},
  {value:{...preference(),focus:{...focus,runId:'another-life'}},reason:'run-mismatch'},
  {value:{...preference(),quarter:'2020-Q0'},reason:'invalid-record'},
  {value:{...preference(),quarter:'1900-Q1'},reason:'invalid-record'},
  {value:{...preference(),quarter:'2026-Q1'},reason:'invalid-record'},
 ]
 for(const {value,reason} of records){
  const raw=JSON.stringify(value);storage.values.set(key,raw)
  expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'invalid',reason,raw})
  expect(saveSeasonFocusPreference(storage,preference(),gate())).toMatchObject({status:'preserved',reason,raw})
  expect(storage.values.get(key)).toBe(raw);expect(storage.writes).toBe(0)
 }
})

it('bounds text before parsing and keeps malformed JSON exactly as found',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId)
 for(const [raw,reason] of [['{not-json','invalid-json'],['x'.repeat(SEASON_FOCUS_PREFERENCE_MAX_TEXT_LENGTH+1),'too-large']] as const){
  storage.values.set(key,raw)
  expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'invalid',reason,raw})
  expect(saveSeasonFocusPreference(storage,preference(),gate())).toMatchObject({status:'preserved',raw})
  expect(storage.values.get(key)).toBe(raw);expect(storage.writes).toBe(0)
 }
})

it('marks an old quarter without relabeling it and rejects future or other-run records',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId),old=preference({quarter:'2020-Q1'}),oldRaw=JSON.stringify(old)
 storage.values.set(key,oldRaw)
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',record:old,quarterStatus:'previous',raw:oldRaw})
 expect(saveSeasonFocusPreference(storage,old,gate())).toMatchObject({status:'blocked',reason:'scope-mismatch'})
 expect(storage.values.get(key)).toBe(oldRaw);expect(storage.writes).toBe(0)
 for(const [record,reason] of [[preference({quarter:'2020-Q3'}),'future-quarter'],[preference({runId:'another-life',focus:{...focus,runId:'another-life'}}),'run-mismatch']] as const){
  const raw=JSON.stringify(record);storage.values.set(key,raw)
  expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'invalid',reason,raw})
  expect(saveSeasonFocusPreference(storage,preference(),gate())).toMatchObject({status:'preserved',reason,raw})
  expect(storage.values.get(key)).toBe(raw)
 }
})

it('contains actual read/access and quota exceptions within the preference result',()=>{
 const readDenied:SeasonFocusPreferenceStorage={getItem(){throw new DOMException('storage is denied','SecurityError')},setItem(){throw Error('WRITE_MUST_NOT_BE_CALLED')}}
 expect(loadSeasonFocusPreference(readDenied,scope)).toMatchObject({status:'unavailable',reason:'read-failed'})
 expect(saveSeasonFocusPreference(readDenied,preference(),gate())).toMatchObject({status:'unavailable',reason:'read-failed'})
 const accessorDenied:SeasonFocusPreferenceStorage={get getItem():SeasonFocusPreferenceStorage['getItem']{throw new DOMException('getter denied','SecurityError')},setItem(){throw Error('WRITE_MUST_NOT_BE_CALLED')}}
 expect(loadSeasonFocusPreference(accessorDenied,scope).status).toBe('unavailable')
 let attempts=0
 const full:SeasonFocusPreferenceStorage={getItem(){return null},setItem(){attempts++;throw new DOMException('quota exceeded','QuotaExceededError')}}
 const result=saveSeasonFocusPreference(full,preference(),gate())
 expect(result).toMatchObject({status:'unavailable',reason:'write-failed'});expect(result.message).toContain('只在本窗口');expect(attempts).toBe(1)
})

it('rejects scope quarters outside the normal 2020 to 2025 campaign before touching storage',()=>{
 const storage=new MemoryPreferences()
 for(const value of ['1900-Q1','2026-Q1']){
  expect(loadSeasonFocusPreference(storage,{...scope,quarter:value})).toMatchObject({status:'invalid',reason:'invalid-scope'})
  expect(saveSeasonFocusPreference(storage,preference(),gate({quarter:value}))).toMatchObject({status:'invalid',reason:'invalid-scope'})
 }
 expect(storage.reads).toBe(0);expect(storage.writes).toBe(0)
})

it('blocks unstable sessions before any preference I/O and allows stable read-only UI preferences',()=>{
 const storage=new MemoryPreferences()
 for(const current of [gate({hasCandidate:true}),gate({busy:true}),gate({saveStatus:'saving'}),gate({saveStatus:'unsaved'}),gate({saveStatus:'conflict'}),gate({saveStatus:'closed'})])expect(saveSeasonFocusPreference(storage,preference(),current).status).toBe('blocked')
 expect(storage.reads).toBe(0);expect(storage.writes).toBe(0)
 const readonly=saveSeasonFocusPreference(storage,preference(),gate({saveStatus:'read_only'}))
 expect(readonly.status).toBe('saved');expect(readonly.message).toContain('仍只读');expect(storage.writes).toBe(1)
})

it('lets an explicit current selection replace schema-valid stale identity without claiming public-object validation',()=>{
 const storage=new MemoryPreferences(),key=seasonFocusPreferenceKey(scope.runId)
 storage.values.set(key,JSON.stringify(preference({quarter:'2020-Q1',focus:{...focus,entityId:'no-longer-public'}})))
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',quarterStatus:'previous'})
 const next=preference({focus:{runId:scope.runId,accountId:'personal',entityId:'chosen-original-order',kind:'market',entityKind:'order'}})
 expect(saveSeasonFocusPreference(storage,next,gate())).toMatchObject({status:'saved',record:next})
 expect(loadSeasonFocusPreference(storage,scope)).toMatchObject({status:'loaded',quarterStatus:'current',record:next})
})

it('keeps a real atomic candidate out of preferences and never changes game bytes or receipts on retry/read-only preference writes',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='s2-preference-candidate',store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:'s2-preference-normal',actorId:'player',commandId:'s2-create',backgroundId:'technical_employee',seed:'s2-preference-normal',playerProfile:{wishId:'autonomy',approach:'first_order'}})
 await store.create(run)
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name}),locks=new MemoryWriterAccess()
 const session=await RunSession.open({store:failing,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'})
 const storage=new MemoryPreferences(),currentGate=(view:PlayingView):SeasonFocusPreferenceGate=>({runId:view.runId,quarter:(view.features as unknown as PlayFeatures).workbench.quarter,saveStatus:view.saveStatus,hasCandidate:view.hasCandidate,busy:view.busy})
 let readonly:RunSession|null=null
 try{
  const before=session.exportSaved(),initialView=session.view,initial:SeasonFocusPreference={version:1,runId:run.runId,quarter:'2020-Q1',focus:playerThread(input(initialView)).focus}
  expect(saveSeasonFocusPreference(storage,initial,currentGate(initialView)).status).toBe('saved');expect(session.exportSaved()).toBe(before)
  const command={runId:run.runId,actorId:'player',commandId:'s2-first-order',expectedRevision:initialView.revision,kind:'StartFirstOrder',payload:{}}
  expect((await session.submit(command)).status).toBe('unsaved')
  const reads=storage.reads,writes=storage.writes,oldPreference=storage.values.get(seasonFocusPreferenceKey(run.runId))
  expect(saveSeasonFocusPreference(storage,initial,currentGate(session.view))).toMatchObject({status:'blocked',reason:'candidate'})
  expect(storage.reads).toBe(reads);expect(storage.writes).toBe(writes);expect(storage.values.get(seasonFocusPreferenceKey(run.runId))).toBe(oldPreference);expect(session.exportSaved()).toBe(before)
  expect((await session.retry()).status).toBe('saved')
  const saved=session.exportSaved(),view=session.view,next={...initial,focus:playerThread(input(view),initial.focus).focus}
  expect(next.focus.entityId).toBe((view.features as unknown as PlayFeatures).firstOrder.contractId)
  expect(saveSeasonFocusPreference(storage,next,currentGate(view)).status).toBe('saved');expect(session.exportSaved()).toBe(saved)
  readonly=await RunSession.open({store,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'})
  expect(readonly.view.saveStatus).toBe('read_only')
  const receipts=readonly.view.receipts
  expect(saveSeasonFocusPreference(storage,next,currentGate(readonly.view)).status).toBe('saved')
  expect(readonly.exportSaved()).toBe(saved);expect(readonly.view.receipts).toEqual(receipts)
 }finally{await readonly?.close();await session.close();await failing.close();await store.close()}
},20000)
