import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {renderToStaticMarkup} from 'react-dom/server'
import qualifiedRaw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import raw from '../../goal-1/evidence/t17-acceptance-40/follow-rights-r451/liquidity-fixture.json?raw'
import {createCampaignCodec,campaignMarket} from '../application/campaign.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {signedEquity,dsAssignment} from '../testing/deepseek-scenarios.ts'
import EquityPanel from './EquityPanel.tsx'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {equityJourneyFor,equityFocusFor} from './equity-player-thread.ts'
import {equityStageCopy} from './equity-stage-copy.ts'
import {equityPaidFollowPrerequisites} from './equity-follow-offer.ts'
import {EquityPaper} from './EquityPaper.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {createEquityDraftMemory,equityDraftKey} from './equity-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Explicit funded fixture, original fixture rules and Controller/IDB transitions.
// Component callbacks do not establish normal economics, DOM/effects or Native.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useCallback:<T,>(fn:T)=>fn,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown,details=true):Element[]=>Array.isArray(v)?v.flatMap(x=>elements(x,details)):isValidElement<Record<string,unknown>>(v)?[v,...(!details&&v.type==='details'?[]:elements(v.props.children,details))]:[]
const text=(v:unknown,details=true):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(x=>text(x,details)).join(''):isValidElement<Record<string,unknown>>(v)?!details&&v.type==='details'?'':text(v.props.children,details):''
function draw<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ORIGINAL_ENABLED_CALLBACK_REQUIRED');return fn(...args)}
async function setup(id:string,input=raw,faulty=false,normal=false){
 const fixture=createDeepseekFixture()
 Object.assign(fixture.runtime,{project:(run:typeof fixture.run)=>({sceneCommands:projectSceneCommands(run),deepseek:projectDeepseek(run,fixture.deepseek),workbench:projectWorkbench(run,fixture.runtime,fixture.operations.catalog,campaignMarket.catalog)})})
 const codec=normal?createCampaignCodec():fixture.codec,factory=new IDBFactory(),name='u6-follow-rights-'+id,locks=new MemoryWriterAccess();let armed=false,sequence=0
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks,id:()=>`u6-rights-${id}-${++sequence}`})
 await controller.initialize();await controller.importNew(input)
 return{codec,controller,store,locks,fault,arm:()=>{armed=true}}
}
type Harness=Awaited<ReturnType<typeof setup>>
let holding:Harness,sold:Harness,failed:Harness,qualified:Harness,reader:GameController
const props=(controller:GameController):GamePanelProps=>{const view=controller.snapshot.view!;return{controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}}
const agreement=(p:GamePanelProps)=>p.features.deepseek!.agreements[0]!
const target=(p:GamePanelProps):EquitySceneTarget=>{const a=agreement(p);return{runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement',recordId:a.id}}
function near(p:GamePanelProps,intent:EquityChoiceIntent='follow',scope='near'){
 const callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()},render=()=>draw(scope,()=>EquitySceneChoice({p,target:target(p),intent,...callbacks}));let tree=render()
 const button=(label:string)=>elements(tree).find(e=>e.type==='button'&&text(e).startsWith(label))!
 const commands=()=>elements(tree,false).filter(e=>e.type===CommandButton)
 const zero=()=>{const c=commands().find(e=>e.props.kind==='FollowEquityRound')!;return elements(CommandButton(c.props as unknown as Parameters<typeof CommandButton>[0])).find(e=>e.type==='button')!}
 return{tree:()=>tree,render:()=>{tree=render();return tree},button,commands,zero,callbacks}
}
beforeAll(async()=>{
 holding=await setup('holding');failed=await setup('failure',raw,true);qualified=await setup('qualified-normal',qualifiedRaw,false,true)
 const sample=signedEquity({},'liquidity',800000),h=sample.h,a=sample.agreement
 h.send('AdvanceTime',{date:'2025-08-01'});h.send('RequestEquityExit',{agreementId:a.id,shares:a.shares,...dsAssignment('2025-08-01')});h.send('AdvanceTime',{date:'2025-08-08'});h.send('AcceptEquityExit',{exitId:h.run.deepseek!.exits[0]!.id,shares:a.shares});h.send('AdvanceTime',{date:'2025-09-01'});sold=await setup('sold',h.codec.export(h.run))
 reader=new GameController({codec:holding.codec,store:holding.store,locks:holding.locks});await reader.initialize();await reader.continueLife(holding.controller.snapshot.view!.runId)
})
beforeEach(()=>hooks.slots.clear())
afterAll(async()=>{await reader?.close();for(const h of [holding,sold,failed,qualified]){await h?.controller.close(true);await h?.store.close()}})

it('offers the actual zero decision and a life destination without asking a holder with no follow right to enter a forbidden payment',()=>{
 const p=props(holding.controller),a=agreement(p),before=holding.controller.exportSaved(),ui=near(p),face=text(ui.tree(),false)
 expect(p.view.origin).toBe('fixture');expect(a.shares).toBe(1000);expect(a.preemptive).toBe(false);expect(a.followDecision).toBe('pending')
 expect(p.controller.preview(p.controller.prepare('FollowEquityRound',{agreementId:a.id,amountFen:800})).allowed).toBe(false)
 expect(p.controller.preview(p.controller.prepare('FollowEquityRound',{agreementId:a.id,amountFen:0})).allowed).toBe(true)
 expect(ui.tree().props.title).toBe('这轮不能追加，原持股仍在。');expect(face).toContain('2025-09-15');expect(face).toContain('原协议没有跟投权');expect(face).toContain('付款 ¥0 · 新增 0股');expect(face).toContain('稀释后 1000 / 1562500股');expect(face).not.toContain('追加投入');expect(face).not.toContain('试算一笔投入');expect(elements(ui.tree(),false).some(e=>e.type==='input')).toBe(false)
 expect(ui.commands()).toHaveLength(1);expect(ui.commands()[0]!.props.payload).toEqual({agreementId:a.id,amountFen:0});expect(ui.commands()[0]!.props.confirm).toBe(true)
 invoke(ui.zero(),'onClick');expect(p.request).toHaveBeenCalledWith('FollowEquityRound',{agreementId:a.id,amountFen:0},expect.any(String),true);expect(holding.controller.exportSaved()).toBe(before)
})

it('keeps a same-object principal draft in the original book without reopening an impossible first-layer form',()=>{
 const p=props(holding.controller),a=agreement(p),key=equityDraftKey(p,target(p),'follow'),before=holding.controller.exportSaved();p.equityDraftMemory!.set(key,{followStep:'principal',amount:'8'})
 const ui=near(p);expect(elements(ui.tree(),false).some(e=>e.type==='input')).toBe(false);expect(ui.commands()[0]!.props.payload).toEqual({agreementId:a.id,amountFen:0});expect(p.equityDraftMemory!.get(key)).toEqual({followStep:'principal',amount:'8'})
 const book=draw('same-original-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialTarget:target(p)})),owner=elements(book).find(e=>e.type==='label'&&text(e).startsWith('本次愿意另行投入'))!
 expect(elements(owner).find(e=>e.type==='input')!.props.value).toBe('8')
 const positive=elements(book).find(e=>e.type===CommandButton&&e.props.kind==='FollowEquityRound'&&(e.props.payload as {amountFen:number}).amountFen===800)!
 expect(positive).toBeDefined();const button=elements(CommandButton(positive.props as unknown as Parameters<typeof CommandButton>[0])).find(e=>e.type==='button')!;expect(button.props.disabled).toBe(true)
 invoke(ui.button('先留着，回到今天'),'onClick');expect(ui.callbacks.onToday).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled();expect(p.equityDraftMemory!.get(key)?.amount).toBe('8');expect(holding.controller.exportSaved()).toBe(before)
})

it('uses the actual fully transferred holding without restoring shares or confusing old receivables with a new contribution',()=>{
 const p=props(sold.controller),a=agreement(p),before=sold.controller.exportSaved(),ui=near(p)
 expect(a.shares).toBe(0);expect(a.followDecision).toBe('pending');expect(ui.tree().props.title).toBe('已无现持股，核对本轮原安排。');expect(text(ui.tree(),false)).toContain('股份已经转出，本轮不能追加本金。');expect(text(ui.tree(),false)).not.toContain('试算一笔投入');expect(ui.zero().props.disabled).toBe(false)
 invoke(ui.button('翻开完整持股手记'),'onClick');expect(ui.callbacks.onInspect).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled();expect(sold.controller.exportSaved()).toBe(before)
})

it('keeps a missing quote explicit and allows a readonly life choice while the original zero commitment remains readonly',()=>{
 const p=props(reader),a=agreement(p),before=reader.exportSaved(),ui=near(p)
 expect(p.view.readOnly).toBe(true);expect(ui.zero().props.disabled).toBe(true);invoke(ui.button('先留着，回到今天'),'onClick');expect(ui.callbacks.onToday).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled();expect(reader.exportSaved()).toBe(before)
 const original=props(holding.controller),q={...original,features:{...original.features,deepseek:{...original.features.deepseek!,agreements:[{...a,followOffer:null}]}}},missing=near(q,'follow','missing-quote');expect(text(missing.tree(),false)).toContain('本轮报价来源待核，不能试算稀释。');expect(text(missing.tree(),false)).not.toContain('稀释后');expect(missing.commands()[0]!.props.payload).toEqual({agreementId:a.id,amountFen:0})
})

it('preserves the old pending scene after a real head-write abort and publishes the zero result only after original candidate retry',async()=>{
 const p=props(failed.controller),a=agreement(p),before=failed.controller.exportSaved(),ui=near(p),oldToday=ui.button('先留着，回到今天');failed.arm()
 expect((await failed.controller.submit(failed.controller.prepare('FollowEquityRound',{agreementId:a.id,amountFen:0}))).status).toBe('unsaved');expect(failed.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(failed.controller.exportSaved()).toBe(before)
 const candidate=failed.controller.exportCandidate();invoke(oldToday,'onClick');expect(ui.callbacks.onToday).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(agreement(props(failed.controller)).followDecision).toBe('pending')
 expect((await failed.controller.retry()).status).toBe('saved');expect(failed.controller.exportSaved()).toBe(candidate);const after=props(failed.controller),saved=near(after,'follow','saved-zero');expect(agreement(after).followDecision).toBe('declined');expect(text(saved.tree(),false)).toContain('本轮选择不追加');expect(saved.commands()).toHaveLength(0);expect(agreement(after).shares).toBe(1000)
})


it('keeps the original public purpose, main wording, paper and near decision aligned when this actual agreement has no paid follow right',()=>{
 for(const [h,withoutHolding] of [[holding,false],[sold,true]] as const){
  const p=props(h.controller),a=agreement(p),before=h.controller.exportSaved(),j=equityJourneyFor(p,equityFocusFor(p,target(p))),copy=equityStageCopy(p,j),binding={label:copy.action,disabled:false,reason:null,activate:vi.fn()}
  expect(equityPaidFollowPrerequisites(a)).toBe(false);expect(j.decisionOpen).toBe(true);expect(j.action).toMatchObject({kind:'choice',intent:'follow'});expect(j.action.label).not.toContain('比较本轮投入')
  const paper=draw('paper-'+withoutHolding,()=>EquityPaper({p,journey:j,binding}));expect(paper.props.onClick).toBe(binding.activate);expect(paper.props['data-equity-follow']).toBe(withoutHolding?'without-holding':'no-right');expect(paper.props['aria-label']).toContain(copy.action)
  expect(copy.heading).not.toContain('怎样选');expect(copy.line).not.toContain('可以追加');expect(copy.action).not.toContain('追加，还是');expect(text(paper)).toContain(a.followDeadline)
  if(withoutHolding){expect(j.phase).toBe('follow-without-holding');expect(text(paper)).toContain('股份已转出');expect(text(paper)).toContain('原款分别核对')}
  else{expect(j.purpose).toContain('本轮不能追加本金');expect(j.finishWhen).toContain('先回今天不替你作决定');expect(j.title).not.toContain('愿不愿再留一笔钱');expect(text(paper)).toContain('本轮来信 · 无追加权利');expect(copy.action).toBe('看看本轮安排')}
  const nearView=near(p,'follow','same-stage-'+withoutHolding);expect(nearView.commands()[0]!.props.payload).toEqual({agreementId:a.id,amountFen:0});expect(text(nearView.tree(),false)).not.toContain('试算一笔投入');expect(h.controller.exportSaved()).toBe(before);expect(binding.activate).not.toHaveBeenCalled()
 }
})

it('retains the real normal qualified comparison, and changes the material back to retained history only after a zero decision is actually saved',async()=>{
 const p=props(qualified.controller),a=agreement(p),before=qualified.controller.exportSaved(),j=equityJourneyFor(p,equityFocusFor(p,target(p))),copy=equityStageCopy(p,j)
 expect(p.view.origin).toBe('normal');expect(equityPaidFollowPrerequisites(a)).toBe(true);expect(j.action.label).toBe('比较本轮投入和明确不跟投');expect(copy.action).toBe('追加，还是留住现金？')
 const paper=draw('qualified-paper',()=>EquityPaper({p,journey:j,binding:{label:copy.action,disabled:false,reason:null,activate:vi.fn()}}));expect(paper.props['data-equity-follow']).toBe('eligible');expect(text(paper)).toContain('原持股册与本轮来信');expect(text(paper)).not.toContain('无追加权利');expect(text(near(p,'follow','qualified-near').tree(),false)).toContain('试算一笔投入');expect(qualified.controller.exportSaved()).toBe(before)
 const completed=await setup('completed-zero');try{const original=props(completed.controller);expect((await completed.controller.submit(completed.controller.prepare('FollowEquityRound',{agreementId:agreement(original).id,amountFen:0}))).status).toBe('saved');const saved=props(completed.controller),done=agreement(saved),history=equityJourneyFor(saved,equityFocusFor(saved,target(saved))),html=renderToStaticMarkup(<EquityPaper p={saved} journey={history} binding={{label:'看看持股与去向',disabled:false,reason:null,activate:vi.fn()}}/>);expect(done.followDecision).toBe('declined');expect(history.phase).toBe('holding');expect(html).not.toContain('data-equity-follow=');expect(html).not.toContain('无追加权利');expect(html).not.toContain('本轮选择至');expect(html).toContain('已经签署的持股册')}finally{await completed.controller.close(true);await completed.store.close()}
})
