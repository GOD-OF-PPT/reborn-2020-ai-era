import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {VideoEncounter,type VideoEncounterProps} from './VideoEncounter.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {CommandButton} from './CommandButton.tsx'

type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 return isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children)]:[]
}
function handlers(props:VideoEncounterProps){
 const component=VideoEncounter(props)
 if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(component)||component.type!==VideoThreadAction)throw Error('ORIGINAL_VIDEO_ACTION_REQUIRED')
 let tree=VideoThreadAction(component.props)
 // The original CommandButton is hook-free. Calling it keeps its actual preview
 // and shared activation; no alternate handler or fake permission is supplied.
 if(isValidElement<ComponentProps<typeof CommandButton>>(tree)&&tree.type===CommandButton)tree=CommandButton(tree.props)
 const rows=elements(tree),main=rows.find(row=>row.type==='button'),paper=rows.find(row=>row.type===OpeningObject),section=rows.find(row=>row.type==='section')
 if(!main||!paper||!section)throw Error('SHARED_THOUGHT_AND_OBJECT_REQUIRED')
 return {rows,main,section,paper:paper.props as ComponentProps<typeof OpeningObject>,click:()=>{const click=main.props.onClick;if(typeof click!=='function')throw Error('ORIGINAL_MAIN_HANDLER_REQUIRED');click()}}
}
async function normal(name:string){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),storeName='u3-encounter-'+name,store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:storeName})
 let id=0;const controller=new GameController({codec,store,locks,id:()=>name+'-'+(++id)})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:storeName})
 const send=async(kind:string,payload:unknown)=>{const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,result})).toBe('saved')}
 await send('OpenVideoChannel',{name:'路线页的同一份作品',segment:'local_merchants'})
 const p=(request:GamePanelProps['request']=()=>{throw Error('UI_READING_MUST_NOT_REQUEST')}):GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request}}
 const focus=()=>openingFocusFor(p(),'video',{videoTarget:{channelId:p().features.video!.channels[0]!.id,...(p().features.video!.works[0]?{workId:p().features.video!.works[0]!.id}:{})}})!
 return {codec,factory,locks,storeName,controller,p,send,focus,close:async()=>{await controller.close();await store.close()}}
}
let h:Awaited<ReturnType<typeof normal>>|null=null
beforeEach(async({task})=>{
 h=await normal(task.name.includes('review')?'review':task.name.includes('non-success')?'non-success':'entry')
 if(task.name.includes('review')){
  await h.send('StartVideoWork',{channelId:h.p().features.video!.channels[0]!.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'})
  await h.send('AdvanceTime',{date:'2020-01-08'})
 }
 if(task.name.includes('non-success')){
  await h.send('StartVideoWork',{channelId:h.p().features.video!.channels[0]!.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-05'})
  await h.send('InterruptJob',{jobId:h.p().features.video!.works[0]!.production!.id})
 }
})
afterEach(async()=>{await h?.close();h=null})

it('binds the route thought, existing number-key button and foreground object to the same explicit choice',()=>{
 if(!h)throw Error('NORMAL_ENCOUNTER_REQUIRED')
 const choose=vi.fn(),result=vi.fn(),today=vi.fn(),p=h.p(),raw=h.controller.exportSaved(),thread=playerThread(p,h.focus())
 const ui=handlers({p,thread,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today})
 expect(String(ui.section.props.className)).toContain('scene-action')
 expect(ui.rows.some(row=>String(row.props.className).split(' ').includes('scene-decision-main')&&elements(row.props.children).some(child=>child===ui.main))).toBe(true)
 expect(ui.main.props.onClick).toBe(ui.paper.onActivate);expect(ui.paper.disabled).toBe(false)
 ui.click();ui.paper.onActivate()
 expect(choose).toHaveBeenCalledTimes(2);expect(result).not.toHaveBeenCalled();expect(today).not.toHaveBeenCalled()
 expect(h.controller.exportSaved()).toBe(raw)
})

it('uses the real review command once and rejects the old object handler after the committed source changes',async()=>{
 if(!h)throw Error('NORMAL_ENCOUNTER_REQUIRED')
 const current=h,pending:Promise<unknown>[]=[],request=vi.fn<GamePanelProps['request']>((kind,payload)=>{pending.push(current.controller.submit(current.controller.prepare(kind,payload)))})
 const p=h.p(request),thread=playerThread(p,h.focus()),choose=vi.fn(),ui=handlers({p,thread,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn()})
 expect(thread.command?.kind).toBe('ReviewVideoOutput');expect(ui.main.props.onClick).toBe(ui.paper.onActivate)
 ui.click();await Promise.all(pending)
 expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0]?.[0]).toBe('ReviewVideoOutput')
 const work=current.p().features.video!.works[0]!,raw=current.controller.exportSaved()
 expect(work.reviewedVersion).toBe(work.version)
 ui.paper.onActivate()
 expect(request).toHaveBeenCalledTimes(1);expect(choose).not.toHaveBeenCalled();expect(current.controller.exportSaved()).toBe(raw)
})

it('keeps a non-success letter readable in real readonly mode and never lets a candidate display execute its action',async()=>{
 if(!h)throw Error('NORMAL_ENCOUNTER_REQUIRED')
 const current=h,p=current.p(),thread=playerThread(p,current.focus()),raw=current.controller.exportSaved(),result=vi.fn()
 expect(thread.outcome).toBe('non-success')
 const ui=handlers({p:{...p,textOnly:true},thread,date:null,waitLabel:'',onChoose:vi.fn(),onResult:result,onToday:vi.fn()})
 expect(ui.paper.kind).toBe('letter');expect(ui.paper.videoPaper?.phase).toBe('non-success');expect(ui.paper.textOnly).toBe(true)
 ui.click();expect(result).toHaveBeenCalledTimes(1)
 const readerStore=new IndexedDbRunStore({codec:current.codec,factory:current.factory,keyRange:IDBKeyRange,name:current.storeName}),reader=new GameController({codec:current.codec,store:readerStore,locks:current.locks})
 try{
  await reader.initialize();await reader.continueLife(p.view.runId)
  const view=reader.snapshot.view!;expect(view.readOnly).toBe(true)
  const readonly={...p,controller:reader,view,features:view.features as unknown as PlayFeatures},reading=handlers({p:readonly,thread:playerThread(readonly,current.focus()),date:null,waitLabel:'',onChoose:vi.fn(),onResult:result,onToday:vi.fn()})
  expect(reading.paper.protection).toBe('readonly');expect(reading.paper.disabled).toBe(false)
  reading.paper.onActivate();expect(result).toHaveBeenCalledTimes(2);expect(reader.exportSaved()).toBe(raw)
 }finally{await reader.close();await readerStore.close()}
 // Bounded public protection display; this is not a simulated saved candidate or Native failure proof.
 const candidate={...p,view:{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}},blocked=handlers({p:candidate,thread,date:null,waitLabel:'',onChoose:vi.fn(),onResult:result,onToday:vi.fn()})
 expect(blocked.paper.protection).toBe('unsaved');expect(blocked.paper.disabled).toBe(true)
 blocked.paper.onActivate();expect(result).toHaveBeenCalledTimes(2);expect(current.controller.exportSaved()).toBe(raw)
})
