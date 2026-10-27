import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {prepareEco,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket,createCampaignRun,createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {createEcosystemDraftMemory} from './ecosystem-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((v:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (v:T)=>T)(hooks.values[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'original-ecology-client'}})
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{return Array.isArray(value)?value.flatMap(nodes):isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children),...nodes(value.props.footer)]:[]}
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
let p:GamePanelProps,target:EcosystemSceneTarget,controller:GameController,store:IndexedDbRunStore,raw:string,originalLeads:string[]
beforeAll(async()=>{
 // Two legal, real outreach histories within an isolated fixed-fund fixture.
 // This proves consumer scope only and is not a normal campaign/browser claim.
 const {h,b}=prepareEco(),first=h.run.deepseek!.outreaches[0]!
 h.send('StartEcoOutreach',{businessId:b.id,modelId:'v2',productId:'training',mode:'paid',sourceCohortIds:[],...dsAssignment('2024-07-01')});h.send('AdvanceTime',{date:'2024-07-08'})
 store=new IndexedDbRunStore({codec:h.codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u5-actual-two-outreach-consumer'});controller=new GameController({codec:h.codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(h.codec.export(h.run));const view=controller.snapshot.view!
 const normalCodec=createCampaignCodec(),base=createCampaignRun({runId:'unused-ui-sections',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'unused-ui-sections'}),unused=normalCodec.registry.runtime!.project!(base) as unknown as PlayFeatures
 // Unused normal sections supply their real public shape; this component
 // reads only fixture DeepSeek/finance and its actual controller snapshot.
 const deepseek=projectDeepseek(h.run,h.deepseek)!,features={...unused,deepseek,workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)}
 p={controller,view,features,accountId:b.accountId,request:vi.fn(),ecosystemDraftMemory:createEcosystemDraftMemory()};target={kind:'outreach',recordId:first.id,runId:view.runId,businessId:b.id,accountId:b.accountId};originalLeads=deepseek.leads.filter(l=>l.outreachId===first.id).map(l=>l.id);raw=controller.exportSaved()
})
afterAll(async()=>{await controller?.close();await store?.close()})
it('opens just the first actual research clients, keeping all preparation and the later research in the separate full-record choice',()=>{
 hooks.values=[];hooks.index=0;const render=(intent:'leads'|'objects')=>{hooks.index=0;return EcosystemSceneChoice({p,target,intent,onClose:vi.fn(),onChoose:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()})}
 const specific=nodes(render('leads')).filter(n=>n.type==='label'&&nodes(n).some(i=>i.type==='input'&&i.props.type==='radio'))
 expect(originalLeads).toHaveLength(3);expect(p.features.deepseek!.leads).toHaveLength(6);expect(specific).toHaveLength(3)
 const ids=specific.map(label=>JSON.parse(String(label.key)).recordId as string);expect(ids).toEqual(originalLeads)
 expect(specific.map(text).join('')).not.toContain('服务材料');expect(nodes(render('objects')).filter(n=>n.type==='input'&&n.props.type==='radio').length).toBeGreaterThan(6)
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})
it('keeps the original stable client ID after radio preview and changes the UI target only at explicit confirmation',()=>{
 hooks.values=[];const chosen=vi.fn();let tree:unknown
 const render=()=>{hooks.index=0;tree=EcosystemSceneChoice({p,target,intent:'leads',onClose:vi.fn(),onChoose:chosen,onInspect:vi.fn(),onToday:vi.fn()})};render()
 const radios=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='radio');expect(radios).toHaveLength(3);(radios[1]!.props.onChange as ()=>void)();render();expect(chosen).not.toHaveBeenCalled()
 const button=nodes(tree).find(n=>n.type==='button'&&text(n).includes('把这份原对象放到眼前'))!;(button.props.onClick as ()=>void)()
 expect(chosen).toHaveBeenCalledWith({...target,kind:'lead',recordId:originalLeads[1]});expect(controller.exportSaved()).toBe(raw)
})
it('does not replace a specified missing research with clients from the other original research',()=>{
 hooks.values=[];hooks.index=0;const chosen=vi.fn(),tree=EcosystemSceneChoice({p,target:{...target,kind:'outreach',recordId:'missing-original-research'},intent:'leads',onClose:vi.fn(),onChoose:chosen,onInspect:vi.fn(),onToday:vi.fn()})
 expect(nodes(tree).filter(n=>n.type==='input'&&n.props.type==='radio')).toHaveLength(0);expect(text(tree)).toContain('原需求研究或实际受众来源已经失效');expect(chosen).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})
