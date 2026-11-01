import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {createEcosystemDraftMemory} from './ecosystem-draft.ts'
import {ecosystemFocusFor,ecosystemFocusFromSaved,ecosystemJourneyFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'
import deployment from '../../goal-1/evidence/t17-acceptance-38/normal-service-r13/technical_employee-before-contract.json?raw'
import training from '../../goal-1/evidence/t17-acceptance-38/normal-service-r13/content_employee-before-contract.json?raw'

// Earned normal model prefixes, not browser or human acceptance. Original React
// handlers, controller, codec and store execute; only hooks and IndexedDB are local.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 // These cases use the synchronous controller; Worker effect lifetimes are
 // covered separately by runtime-reading.test.tsx and Native verification.
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useCallback:<T,>(callback:T)=>callback,useEffect:()=>{},useId:()=> 'u5-normal-original-save'}
})
type Element=ReactElement<Record<string,unknown>>
const nodes=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(nodes):isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children),...nodes(value.props.footer)]:[]

describe.each([{productId:'deployment',raw:deployment},{productId:'training',raw:training}])('normal $productId original save chain',({productId,raw})=>{
 let controller:GameController,reader:GameController,store:IndexedDbRunStore,physical:IndexedDbRunStore,locks:MemoryWriterAccess,fault:ReturnType<typeof abortAfterHeadWrite>,p:GamePanelProps,target:EcosystemSceneTarget
 beforeAll(async()=>{
  const codec=createCampaignCodec(),factory=new IDBFactory(),name='u5-normal-'+productId+'-original-abort';locks=new MemoryWriterAccess()
  fault=abortAfterHeadWrite(factory,name,row=>((row as {envelope?:{state?:{deepseek?:{contracts?:readonly unknown[]}}}}).envelope?.state?.deepseek?.contracts?.length??0)>0)
  store=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name});physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
  controller=new GameController({codec,store,locks});await controller.initialize();await controller.importNew(raw)
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,v=features.deepseek!,b=v.businesses.find(b=>b.definitionId==='ecosystem-service')!,price=v.catalog.products.find(row=>row.id===productId)!.priceFen,lead=v.leads.find(l=>l.productId===productId&&l.status==='open'&&l.maxPriceFen>=price)!
  expect(view.origin).toBe('normal');expect(view.date).toBe('2024-07-01');expect(v.contracts).toHaveLength(0);expect(lead).toBeDefined()
  p={controller,view,features,accountId:b.accountId,request:vi.fn(),ecosystemDraftMemory:createEcosystemDraftMemory()};target={kind:'lead',recordId:lead.id,runId:view.runId,businessId:b.id,accountId:b.accountId}
 })
 afterAll(async()=>{await reader?.close();await controller?.close(true);await physical?.close();await store?.close()})

 it('keeps the old object after actual head.put abort, then publishes only the exact original candidate on retry',async()=>{
  hooks.values=[];let tree:unknown
  const render=()=>{hooks.index=0;tree=EcosystemSceneChoice({p,target,intent:'lead',onClose:vi.fn(),onChoose:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()})};render()
  const scope=nodes(tree).find(n=>n.type==='input'&&n.props.type==='radio'&&n.props.value==='standard')!;expect(scope).toBeDefined();(scope.props.onChange as ()=>void)();render()
  ;(nodes(tree).find(n=>n.type===ResourceSelect)!.props.onChange as (value:string)=>void)('player-production');render()
  ;(nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!.props.onChange as (event:unknown)=>void)({target:{value:'2024-07-02'}});render()
  const button=nodes(tree).find(n=>n.type===CommandButton&&n.props.kind==='AcceptEcoContract')!,consumer=CommandButton(button.props as unknown as Parameters<typeof CommandButton>[0]),actualButton=nodes(consumer).find(n=>n.type==='button')!
  expect(actualButton.props.disabled).toBe(false);(actualButton.props.onClick as ()=>void)()
  const [kind,body,,confirm]=(p.request as ReturnType<typeof vi.fn>).mock.calls[0]!,expected={leadId:target.kind==='lead'?target.recordId:'',scope:'standard',resources:['player-production'],startAt:'2024-07-02'}
  expect(kind).toBe('AcceptEcoContract');expect(body).toEqual(expected);expect(confirm).toBe(true)
  const command=controller.prepare(kind,body),oldFocus=ecosystemFocusFor(p,target),before=controller.snapshot.view!
  const originalSceneCommands=(before.features as unknown as PlayFeatures).sceneCommands
  expect(originalSceneCommands).toMatchObject({version:1,runId:before.runId,committedRevision:before.revision})
  expect(controller.preview(command).allowed).toBe(true);expect((await controller.submit(command)).status).toBe('unsaved');expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  const candidate=controller.exportCandidate(),candidateView=controller.snapshot.view!,candidateInput={...p,view:candidateView,features:candidateView.features as unknown as PlayFeatures}
  expect(controller.exportSaved()).toBe(raw);expect(await physical.exportStored(before.runId)).toBe(raw)
  expect(candidateView.revision).toBe(before.revision);expect(candidateView.accounts).toEqual(before.accounts);expect(candidateView.budget).toEqual(before.budget)
  expect(candidateInput.features.sceneCommands).toEqual(originalSceneCommands)
  expect(candidateInput.features.sceneCommands!.commands.some(c=>c.commandId===command.commandId)).toBe(false)
  expect(ecosystemJourneyFor(candidateInput,oldFocus)).toMatchObject({phase:'lead-open',paper:'letter'})
  expect(ecosystemFocusFromSaved(p,candidateInput,kind,body,oldFocus)).toBeNull()
  reader=new GameController({codec:createCampaignCodec(),store:physical,locks});await reader.initialize();await reader.continueLife(before.runId)
  expect(reader.snapshot.view!.readOnly).toBe(true);expect(reader.exportSaved()).toBe(raw)
  expect((reader.snapshot.view!.features as unknown as PlayFeatures).sceneCommands).toEqual(originalSceneCommands)
  expect(await reader.submit(reader.prepare('DeclineEcoLead',{leadId:expected.leadId}))).toMatchObject({status:'rejected',reasonCodes:['READ_ONLY_SESSION']})
  expect((await controller.retry()).status).toBe('saved');expect(controller.exportSaved()).toBe(candidate);expect(await physical.exportStored(before.runId)).toBe(candidate)
  const saved=controller.snapshot.view!,savedInput={...p,view:saved,features:saved.features as unknown as PlayFeatures},focus=ecosystemFocusFromSaved(p,savedInput,kind,body,oldFocus)!
  expect(saved.revision).toBe(before.revision+1);expect(focus.ecosystemTarget?.kind).toBe('contract');expect(ecosystemJourneyFor(savedInput,focus)).toMatchObject({phase:'production-planned',paper:'commitment'})
  const c=savedInput.features.deepseek!.contracts[0]!;expect(c.productId).toBe(productId);expect(c.balance!.prepaidFen).toBe(c.priceFen/2);expect(c.balance!.recognizedIncomeFen).toBe(0)
  expect(savedInput.features.sceneCommands).toMatchObject({committedRevision:saved.revision})
  expect(savedInput.features.sceneCommands!.commands.filter(c=>c.commandId===command.commandId)).toEqual([{commandId:command.commandId,kind:'AcceptEcoContract',date:saved.date,revisionAfter:saved.revision,identifiers:{leadId:expected.leadId}}])
  await reader.reload();expect(reader.exportSaved()).toBe(candidate);expect(reader.snapshot.view!.revision).toBe(saved.revision);expect(reader.snapshot.view!.readOnly).toBe(true)
 })
})
