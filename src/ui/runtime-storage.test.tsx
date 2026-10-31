import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import type {GameControllerPort} from '../application/game-controller-port.ts'
import {createCampaignCodec} from '../application/campaign.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {StoragePanel} from './StoragePanel.tsx'
import {SaveTextPages} from './SaveTextPages.tsx'

// Actual storage callbacks with deterministic effect flushing; native file
// chooser, browser rendering and Worker execution are separate checks.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0,effects:[] as (()=>void)[]}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useEffect:(read:()=>void|(()=>void),deps?:readonly unknown[])=>{
  const i=hooks.index++,old=hooks.values[i] as {kind:string;deps?:readonly unknown[];cleanup?:()=>void}|undefined
  if(!old||!deps||!old.deps||deps.length!==old.deps.length||deps.some((v,n)=>!Object.is(v,old.deps![n]))){const next={kind:'effect',...(deps?{deps:[...deps]}:{}),cleanup:undefined as (()=>void)|undefined};hooks.values[i]=next;hooks.effects.push(()=>{old?.cleanup?.();const cleanup=read();if(cleanup)next.cleanup=cleanup})}
 }}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children)]:[]
const text=(value:unknown):string=>typeof value==='string'?value:Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {resolve,promise}}
const tick=()=>new Promise<void>(done=>setImmediate(done)) // Drain this resolved file/query's promise continuations.
function unmount(){for(const value of hooks.values){const v=value as {kind?:string;cleanup?:()=>void}|null;if(v?.kind==='effect')v.cleanup?.()}hooks.effects=[]}
const cleanups:(()=>Promise<void>)[]=[]
beforeEach(()=>{hooks.values=[];hooks.index=0;hooks.effects=[]})
afterEach(async()=>{unmount();for(const close of cleanups.splice(0))await close()})
async function setup(){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'runtime-storage-'+crypto.randomUUID()}),c=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await c.initialize();await c.newLife({backgroundId:'technical_employee',seed:'runtime-storage',playerProfile:{wishId:'autonomy',approach:'free'}})
 const raw=c.exportSaved(),checks:{text:string;result:ReturnType<typeof deferred<ReturnType<GameController['inspectImport']>>>}[]=[],done=vi.fn()
 let restoreGate:ReturnType<typeof deferred<void>>|null=null,restoreStarted:ReturnType<typeof deferred<void>>|null=null
 const proxy=new Proxy(c,{get(target,key){if(key==='asynchronous')return true;if(key==='inspectImportAsync')return(text:string)=>{const result=deferred<ReturnType<GameController['inspectImport']>>();checks.push({text,result});return result.promise};if(key==='restore')return async(text:string)=>{await target.restore(text);restoreStarted?.resolve();await restoreGate?.promise};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}}) as GameControllerPort
 cleanups.push(()=>c.close(true))
 let owner=proxy
 const draw=()=>{hooks.index=0;const tree=elements(StoragePanel({controller:owner,initialText:raw,onDone:done}));for(const effect of hooks.effects.splice(0))effect();return tree}
 const click=(tree:Element[],label:string)=>{const e=tree.find(e=>e.type==='button'&&text(e.props.children)===label);if(!e||e.props.disabled||typeof e.props.onClick!=='function')throw Error('ENABLED_STORAGE_CALLBACK_REQUIRED:'+label);e.props.onClick()}
 const pages=(tree:Element[])=>tree.find(e=>e.type===SaveTextPages)!.props as ComponentProps<typeof SaveTextPages>
 return {c,raw,checks,done,draw,click,pages,setOwner:(next:GameControllerPort)=>{owner=next},proxy,holdRestore:()=>{restoreGate=deferred<void>();restoreStarted=deferred<void>();return {started:restoreStarted.promise,release:restoreGate.resolve}}}
}
it('does not put an old inspection over newly edited source text',async()=>{
 const h=await setup();h.click(h.draw(),'检查存档');h.pages(h.draw()).onChange(h.raw+' ')
 h.checks[0]!.result.resolve(h.c.inspectImport(h.raw));await h.checks[0]!.result.promise;await tick()
 const current=h.draw();expect(h.pages(current).text).toBe(h.raw+' ');expect(current.some(e=>e.type==='h3'&&text(e.props.children)==='导入前核对')).toBe(false)
 h.click(current,'检查存档');expect(h.checks[1]!.text).toBe(h.raw+' ');h.checks[1]!.result.resolve(h.c.inspectImport(h.raw+' '));await h.checks[1]!.result.promise;await tick()
 expect(h.draw().some(e=>e.type==='h3'&&text(e.props.children)==='导入前核对')).toBe(true);expect(h.c.exportSaved()).toBe(h.raw)
})
it('does not let an old file callback overwrite or clear the later selected file',async()=>{
 const h=await setup(),a=deferred<string>(),b=deferred<string>(),input={files:[{size:10,text:()=>a.promise}],value:'A'}
 const file=(tree:Element[])=>tree.find(e=>e.type==='input'&&e.props.type==='file')!
 const choose=(tree:Element[])=>{const e=file(tree);if(e.props.disabled||typeof e.props.onChange!=='function')throw Error('ENABLED_FILE_CALLBACK_REQUIRED');e.props.onChange({currentTarget:input})}
 choose(h.draw());h.pages(h.draw()).onChange('manual');input.files=[{size:10,text:()=>b.promise}];input.value='B';choose(h.draw())
 a.resolve('old-A');await a.promise;await tick();expect(input.value).toBe('B');expect(h.pages(h.draw()).text).toBe('manual')
 b.resolve('new-B');await b.promise;await tick();expect(input.value).toBe('');expect(h.pages(h.draw()).text).toBe('new-B');expect(h.c.exportSaved()).toBe(h.raw)
})
it('retires inspection callbacks when the controller owner changes',async()=>{
 const h=await setup();h.click(h.draw(),'检查存档')
 const second=new Proxy(h.proxy,{get(target,key){return Reflect.get(target,key)}});h.setOwner(second);h.draw()
 h.checks[0]!.result.resolve(h.c.inspectImport(h.raw));await h.checks[0]!.result.promise;await tick()
 expect(h.draw().some(e=>e.type==='h3'&&text(e.props.children)==='导入前核对')).toBe(false);expect(h.c.exportSaved()).toBe(h.raw)
})
it('does not close a new reading when an old explicitly confirmed restore returns after unmount',async()=>{
 const h=await setup();h.click(h.draw(),'检查存档');h.checks[0]!.result.resolve(h.c.inspectImport(h.raw));await h.checks[0]!.result.promise;await tick()
 const gate=h.holdRestore();h.click(h.draw(),'确认恢复这份同一人生存档');expect(h.pages(h.draw()).readOnly).toBe(true)
 await gate.started;unmount();gate.release();await tick();expect(h.done).not.toHaveBeenCalled();expect(h.c.exportSaved()).toBe(h.raw)
})
