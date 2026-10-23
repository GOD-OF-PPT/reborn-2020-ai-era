/** Throwaway diagnostic only: original assertions, controller, IDB, locks, seed and raw.
 * Its measurement timeout is not the original 5s acceptance limit. No production edits. */
import {it,expect} from 'vitest'
import {Session as InspectorSession} from 'node:inspector'
import {performance} from 'node:perf_hooks'
import {readFileSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {loadavg,availableParallelism,cpus,freemem,totalmem} from 'node:os'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec as actualCreateCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {RunSession} from '../../../../src/application/session.ts'
import {RunCodec} from '../../../../src/persistence/codec.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {playerThread as actualPlayerThread,openingFocusFor as actualOpeningFocusFor} from '../../../../src/ui/player-thread.ts'
import {seasonRecollection as actualSeasonRecollection} from '../../../../src/ui/season-thread.ts'
import {sceneThreads as actualSceneThreads} from '../../../../src/ui/scene-thread-notes.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
import retainedRelayRaw from '../../t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json?raw'
type PlayingView=any;type PlayFeatures=any;type OpeningFocus=any;type Input=any;type SeasonInput=any
const input=(view:PlayingView):Input=>({view,features:view.features as unknown as PlayFeatures})
const root=resolve('goal-1/evidence/t17-acceptance-25/diagnosis-r1')
const tag=process.env.DIAG_TAG??'profile-r1',profiling=process.env.DIAG_PROFILE==='1'
const write=(name:string,value:unknown)=>{guard(root);writeFileSync(resolve(root,name),JSON.stringify(value,null,2)+'\n')}
let stats:Record<string,{calls:number;wallMs:number;cpuMs:number;maxWallMs:number}>={},restores:(()=>void)[]=[],lastRaw=''
function record(label:string,wall:number,cpu:NodeJS.CpuUsage){const row=stats[label]??={calls:0,wallMs:0,cpuMs:0,maxWallMs:0};row.calls++;row.wallMs+=wall;row.cpuMs+=(cpu.user+cpu.system)/1000;row.maxWallMs=Math.max(row.maxWallMs,wall)}
function observe<T>(label:string,work:()=>T):T{
 const wall=performance.now(),cpu=process.cpuUsage();let value:T
 try{value=work()}catch(error){record(label,performance.now()-wall,process.cpuUsage(cpu));throw error}
 if(value&&typeof (value as any).then==='function')return (value as any).finally(()=>record(label,performance.now()-wall,process.cpuUsage(cpu)))
 record(label,performance.now()-wall,process.cpuUsage(cpu));return value
}
function wrap(target:any,key:string,label:string){const descriptor=Object.getOwnPropertyDescriptor(target,key),original=target[key];if(typeof original!=='function')return;target[key]=function(...args:any[]){return observe(label,()=>original.apply(this,args))};restores.push(()=>{if(descriptor)Object.defineProperty(target,key,descriptor);else delete target[key]})}
function install(){
 for(const key of ['import','export','seal','readEnvelope','validateRun'])wrap(RunCodec.prototype,key,'codec.'+key)
 for(const key of ['load','create','commit','importSave','listRuns','exportStored','close'])wrap(IndexedDbRunStore.prototype,key,'store.'+key)
 for(const key of ['initialize','newLife','importNew','prepare','submit','exportSaved','home','continueLife','close'])wrap(GameController.prototype,key,'controller.'+key)
 const descriptor=Object.getOwnPropertyDescriptor(RunSession.prototype,'view')!
 Object.defineProperty(RunSession.prototype,'view',{...descriptor,get(){return observe('session.view',()=>descriptor.get!.call(this))}})
 restores.push(()=>Object.defineProperty(RunSession.prototype,'view',descriptor))
}
function createCampaignCodec(){const codec=actualCreateCampaignCodec();if(codec.registry.runtime){wrap(codec.registry.runtime,'project','runtime.project');wrap(codec.registry.runtime,'validate','runtime.validate')}return codec}
function playerThread(...args:any[]){return observe('ui.playerThread',()=>actualPlayerThread(...args as Parameters<typeof actualPlayerThread>))}
function openingFocusFor(...args:any[]){return observe('ui.openingFocusFor',()=>actualOpeningFocusFor(...args as Parameters<typeof actualOpeningFocusFor>))}
function seasonRecollection(...args:any[]){return observe('ui.seasonRecollection',()=>actualSeasonRecollection(...args as Parameters<typeof actualSeasonRecollection>))}
function sceneThreads(...args:any[]){return observe('ui.sceneThreads',()=>actualSceneThreads(...args as Parameters<typeof actualSceneThreads>))}
const host=()=>({at:new Date().toISOString(),pid:process.pid,node:process.version,loadavg:loadavg(),availableParallelism:availableParallelism(),cpuCount:cpus().length,cpuModel:cpus()[0]?.model,freeMemory:freemem(),totalMemory:totalmem()})
const post=(session:InspectorSession,method:string,params:unknown={})=>new Promise<any>((resolve,reject)=>session.post(method,params,(error,result)=>error?reject(error):resolve(result)))
async function measure(name:string,work:()=>Promise<void>){
 stats={};restores=[];lastRaw='';install();const startHost=host(),inspector=profiling?new InspectorSession():null
 if(inspector){inspector.connect();await post(inspector,'Profiler.enable');await post(inspector,'Profiler.setSamplingInterval',{interval:1000});await post(inspector,'Profiler.start')}
 const wall=performance.now(),cpu=process.cpuUsage(),usage=process.resourceUsage();let failure:string|null=null
 try{await work()}catch(error){failure=String((error as Error).stack??error)}
 const wallMs=performance.now()-wall,cpuDelta=process.cpuUsage(cpu),cpuMs=(cpuDelta.user+cpuDelta.system)/1000
 if(inspector){const {profile}=await post(inspector,'Profiler.stop');write(tag+'-'+name+'.cpuprofile',profile);inspector.disconnect()}
 const result={tag,name,diagnosticOnly:true,originalTimeoutMs:5000,originalTestsUnmodified:true,profileEnabled:profiling,wallMs,cpuMs,cpuToWall:cpuMs/wallMs,overOriginalBudget:wallMs>5000,failure,rawSha256:createHash('sha256').update(lastRaw).digest('hex'),rawBytes:Buffer.byteLength(lastRaw),hostBefore:startHost,hostAfter:host(),resourceUsageBefore:usage,resourceUsageAfter:process.resourceUsage(),boundaries:stats,note:'Boundary timings are inclusive and overlap; do not sum them. Long diagnostic time does not pass an original 5s test.'}
 for(const restore of restores.reverse())restore()
 write(tag+'-'+name+'.json',result)
 process.stdout.write('[DEBUG-c2diag] '+JSON.stringify({name,tag,wallMs,cpuMs,cpuToWall:cpuMs/wallMs,overOriginalBudget:wallMs>5000,failure,rawSha256:result.rawSha256,boundaries:stats})+'\n')
 expect(failure).toBeNull()
 return result
}

// Exact normal helpers and original assertion bodies are appended below from the frozen tests.

async function normalFirst(name:string,approach:PlayingView['playerProfile']['approach']='free',backgroundId:'technical_employee'|'content_employee'='technical_employee'){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s1-thread-'+name})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s1-thread-${name}-${++count}`})
 await controller.initialize();await controller.newLife({backgroundId,playerProfile:{wishId:'autonomy',approach},seed:'s1-thread-'+name})
 const p=()=>input(controller.snapshot.view!)
 const send=async(kind:string,payload:unknown)=>{const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved')}
 const advance=async(date:string)=>{for(let i=0;i<20;i++){
  const w=p().features.workbench
  if(w.pause){
   expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING')
   const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!
   expect(choice).toMatchObject({costFen:0,actionPoints:0})
   await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue
  }
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('S1_THREAD_CLOCK_LIMIT')}
 const reopen=async()=>{const runId=p().view.runId,saved=controller.exportSaved();await controller.home();await controller.continueLife(runId);lastRaw=controller.exportSaved();expect(lastRaw).toBe(saved);return p()}
 return {controller,p,send,advance,reopen,get lastReopenRaw(){return lastRaw},close:async()=>{await controller.close();await store.close()}}
}
async function originalFirst(background='technical_employee'){
 const h=await normalFirst('first-'+background,'first_order',background)
 try{
  let focus=playerThread(h.p()).focus
  await h.send('WorkQuarter',{});await h.send('StartFirstOrder',{})
  let thread=playerThread(h.p(),focus);focus=thread.focus
  expect(thread).toMatchObject({stage:'planned',outcome:'pending',wait:{date:'2020-01-05'},resultRefs:[]})
  expect(focus.entityId).toBe(h.p().features.firstOrder.contractId)
  expect(openingFocusFor(h.p(),thread.inspect.screen,thread.inspect.target)).toEqual(focus)
  expect(h.p().view.budget).toMatchObject({available:1,reserved:1})
  await h.send('AdvanceTime',{date:'2020-01-05'})
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'running',wait:{date:'2020-01-19'},resultRefs:[]})
  await h.send('AdvanceTime',{date:'2020-01-19'})
  thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'delivery',outcome:'pending',command:{kind:'SubmitDelivery',payload:{contractId:focus.entityId}}})
  expect(thread.resultRefs).toEqual([{kind:'job',id:h.p().features.firstOrder.jobId,date:'2020-01-19'}])
  await h.send(thread.command!.kind,thread.command!.payload)
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'waiting',outcome:'pending'})
  expect(h.p().features.firstOrder.result.paymentFen).toBe(0)
  await h.send('AdvanceTime',{date:'2020-01-20'})
  thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'paid',outcome:'actual',focus:{entityId:focus.entityId}})
  expect(thread.command).toBeUndefined();expect(thread.wait).toBeUndefined()
  expect(thread.line).toContain('¥1,300');expect(thread.line).toContain('¥800')
  const payments=thread.resultRefs.filter(ref=>ref.kind==='payment')
  expect(payments).toHaveLength(1);expect(payments[0]!.date).toBe('2020-01-20')
  expect(h.p().features.workbench.finance[0]!.transactions.some(tx=>tx.id===payments[0]!.id&&tx.amountFen===130000)).toBe(true)
  expect(h.p().features.firstOrder.result).toMatchObject({directCostFen:50000,paymentFen:130000,netOrderFen:80000})
  await h.reopen();lastRaw=h.lastReopenRaw
  expect(playerThread(h.p())).toMatchObject({stage:'paid',outcome:'actual',focus:{entityId:focus.entityId}})
 }finally{await h.close()}
}

async function normalLegacy(name:string,raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s2-season-'+name})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s2-${name}-${++count}`})
 await controller.initialize()
 if(raw)await controller.importNew(raw)
 else await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s2-'+name})
 const p=()=>input(controller.snapshot.view!)
 const send=async(kind:string,payload:unknown)=>{const previous=p();const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved');return {previous,current:p()}}
 const advance=async(date:string)=>{for(let n=0;n<35;n++){
  const w=p().features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('S2_SEASON_CLOCK_LIMIT')}
 return {codec,controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}
async function originalLegacy(){
 const h=await normalLegacy('legacy',retainedRelayRaw)
 try{
  const before=h.controller.exportSaved(),ordinary=playerThread(h.p())
  expect(ordinary.legacyFallbackRequired).toBe(true)
  const explicit:OpeningFocus={runId:h.p().view.runId,kind:'work',accountId:'personal',entityId:null}
  expect(playerThread(h.p(),explicit).legacyFallbackRequired).toBe(false)
  const echo=seasonRecollection(h.p())!
  expect(echo.remaining.some(r=>r.inspect.screen==='relay')).toBe(true)
  expect(echo.remaining.some(r=>r.sourceRefs.some(ref=>ref.kind==='obligation'))).toBe(true)
  expect(echo.nodes.length).toBeLessThanOrEqual(3)
  for(const original of sceneThreads(h.p().features,h.p().view.date).filter(t=>t.screen!=='life'))expect(echo.remaining.some(r=>r.id===original.id)).toBe(true)
  for(const finance of h.p().features.workbench.finance)for(const debt of finance.obligations)expect(echo.remaining.some(r=>r.sourceRefs.some(ref=>ref.id===debt.id))).toBe(true)
  lastRaw=h.controller.exportSaved();expect(lastRaw).toBe(before)
 }finally{await h.close()}
}

it('measures the original two scenarios without changing their acceptance deadline',async()=>{
 const before=host();let processes='';try{processes=execFileSync('rtk',['proxy','ps','-axo','pid,ppid,%cpu,%mem,comm'],{encoding:'utf8'})}catch{}
 guard(root);writeFileSync(resolve(root,tag+'-host-processes.txt'),processes)
 const results=[];results.push(await measure('technical-first',()=>originalFirst()));results.push(await measure('legacy-raw',()=>originalLegacy()));write(tag+'-summary.json',{before,after:host(),results});
},120000)
