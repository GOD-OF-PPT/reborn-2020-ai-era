import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import type {GameControllerPort} from '../application/game-controller-port.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {useUiIntent} from './use-ui-intent.ts'
import {useCommandPreview} from './use-controller-read.ts'
import type {PreparationWorkspaceContext} from './App.tsx'

// Deterministic hook/effect driver, not a DOM renderer or a Native Worker test.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0,effects:[] as (()=>void)[]}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useEffect:(effect:()=>void|(()=>void),deps?:readonly unknown[])=>{
  const i=hooks.index++,old=hooks.values[i] as {kind:string;deps?:readonly unknown[];cleanup?:()=>void}|undefined
  if(!old||!deps||!old.deps||deps.some((v,n)=>!Object.is(v,old.deps![n]))||deps.length!==old.deps.length){
   const next={kind:'effect',...(deps?{deps:[...deps]}:{}),cleanup:undefined as (()=>void)|undefined};hooks.values[i]=next
   hooks.effects.push(()=>{old?.cleanup?.();const cleanup=effect();if(cleanup)next.cleanup=cleanup})
  }
 }}
})
function draw<T>(read:()=>T):T{hooks.index=0;const value=read();for(const effect of hooks.effects.splice(0))effect();return value}
function unmount(){for(const value of hooks.values){const e=value as {kind?:string;cleanup?:()=>void}|null;if(e?.kind==='effect')e.cleanup?.()}hooks.effects=[]}
const cleanups:(()=>Promise<void>)[]=[]
beforeEach(()=>{hooks.values=[];hooks.index=0;hooks.effects=[]})
afterEach(async()=>{unmount();for(const close of cleanups.splice(0))await close();vi.unstubAllGlobals()})
async function owner(){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'ui-read-'+crypto.randomUUID()}),c=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await c.initialize();await c.newLife({backgroundId:'technical_employee',seed:'ui-read',playerProfile:{wishId:'autonomy',approach:'free'}})
 cleanups.push(()=>c.close(true));return c
}
function documentEvents(){
 const events=new EventTarget();let dialog:{open:boolean;isConnected:boolean;querySelector:()=>{textContent:string}}|null=null
 vi.stubGlobal('document',{addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),querySelectorAll:()=>dialog?[dialog]:[]})
 return {events,setDialog:(value:typeof dialog)=>{dialog=value}}
}
it('accepts the synchronous reading handoff, then retires A-B-A changes without changing the save',async()=>{
 const c=await owner();documentEvents();const before=c.exportSaved();let workspace:PreparationWorkspaceContext={runId:c.snapshot.view!.runId,screen:'room',accountId:'personal',open:false,epoch:1}
 const render=()=>draw(()=>useUiIntent(c,()=>workspace,()=>0))
 let ui=render();const frame=ui.begin('核对这一步')
 workspace={...workspace,screen:'life',epoch:2};ui=render()
 expect((await frame.ready)?.screen).toBe('life');expect(frame.owns()).toBe(true)
 workspace={...workspace,screen:'finance',epoch:3};render();workspace={...workspace,screen:'life',epoch:4};render()
 expect(frame.owns()).toBe(false);expect(c.exportSaved()).toBe(before)
})
it('cancels a not-yet-committed reading before its first effect and resolves its waiter',async()=>{
 const c=await owner(),doc=documentEvents(),workspace:PreparationWorkspaceContext={runId:c.snapshot.view!.runId,screen:'room',accountId:'personal',open:false,epoch:1}
 const render=()=>draw(()=>useUiIntent(c,()=>workspace,()=>0)),ui=render(),frame=ui.begin('核对这一步')
 doc.events.dispatchEvent(new Event('input'));render()
 expect(await frame.ready).toBeNull();expect(frame.owns()).toBe(false);expect(c.snapshot.view!.revision).toBe(1)
})
it('retires a closed local paper and an actual changed revision before late UI completion',async()=>{
 const c=await owner(),doc=documentEvents(),workspace:PreparationWorkspaceContext={runId:c.snapshot.view!.runId,screen:'room',accountId:'personal',open:false,epoch:1}
 const paper={open:true,isConnected:true,querySelector:()=>({textContent:'原纸页'})};doc.setDialog(paper)
 const render=()=>draw(()=>useUiIntent(c,()=>workspace,()=>0));let ui=render();const first=ui.begin('核对原纸页');render();await first.ready
 paper.open=false;doc.setDialog(null);render();expect(first.owns()).toBe(false)
 ui=render();const second=ui.begin('核对当前记录');render();await second.ready
 expect((await c.submit(c.prepare('WorkQuarter',{}))).status).toBe('saved');render();expect(second.owns()).toBe(false)
})

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {promise,resolve}}
const allowed:CommandPreview={allowed:true,reasonCodes:[],actionPoints:2,upfrontCostFen:0,releasedFen:0}
async function previewOwner(){
 const c=await owner(),reads:ReturnType<typeof deferred<CommandPreview>>[]=[]
 const proxy=new Proxy(c,{get(target,key){if(key==='asynchronous')return true;if(key==='runtimeSession')return 'reading-session';if(key==='runtimeSequence')return 1;if(key==='preview')return()=>({...allowed,allowed:false,reasonCodes:['RUNTIME_READ_PENDING']});if(key==='previewAsync')return()=>{const pending=deferred<CommandPreview>();reads.push(pending);return pending.promise};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}) as GameControllerPort
 cleanups.push(async()=>{for(const pending of reads)pending.resolve({...allowed,allowed:false,reasonCodes:['STALE_REVISION']})})
 return {c,proxy,reads}
}
it('does not revive a pending A response after B and a fresh A reading',async()=>{
 const h=await previewOwner(),a=h.c.prepare('WorkQuarter',{}),b=h.c.prepare('ResearchMarket',{definitionId:'market-overview'});let command:CommandEnvelope=a
 const render=()=>draw(()=>useCommandPreview(h.proxy,h.c.snapshot.view!,command))
 expect(render().pending).toBe(true);command=b;render();command=a;render();expect(h.reads).toHaveLength(3)
 h.reads[0]!.resolve(allowed);await h.reads[0]!.promise;expect(render().pending).toBe(true)
 h.reads[2]!.resolve(allowed);await h.reads[2]!.promise;expect(render().preview.allowed).toBe(true)
})
it('retires an old enabled callback across A-B-A and after unmount',async()=>{
 const h=await previewOwner(),a=h.c.prepare('WorkQuarter',{}),b=h.c.prepare('ResearchMarket',{definitionId:'market-overview'});let command:CommandEnvelope=a
 const render=()=>draw(()=>useCommandPreview(h.proxy,h.c.snapshot.view!,command));render();h.reads[0]!.resolve(allowed);await h.reads[0]!.promise
 const old=render().isCurrentAllowed;expect(old()).toBe(true);command=b;render();command=a;const current=render().isCurrentAllowed
 expect(old()).toBe(false);expect(current()).toBe(true);unmount();expect(current()).toBe(false)
})
