import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import signRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeEquitySign.json?raw'
import signedRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-signed.json?raw'
import exitRaw from '../../goal-1/evidence/t16-epilogue/native-exit-prefix/normal-before-exit-accept.json?raw'
import beforeContractRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeContract.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {createEquityDraftMemory,equityDraftKey,useEquityDraft} from './equity-draft.ts'
import {equityFocusFor,equityFocusTargets} from './equity-player-thread.ts'
import {equityRecordSelection} from './equity-record-selection.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {EquityMoment} from './EquityMoment.tsx'
import EquityPanel from './EquityPanel.tsx'
import {CommandButton} from './CommandButton.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'

// Actual component callbacks, original normal saves and Controller/IDB previews.
// This hook driver does not run DOM/effects or establish Chrome/art/human acceptance.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const index=hooks.index++;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useCallback:<T,>(callback:T)=>callback,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children)]:[]
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
function invoke(element:Element,name:string,...args:unknown[]){const fn=element.props[name];if(element.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_HANDLER_REQUIRED:'+name);return fn(...args)}
function render<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
async function setup(id:string,raw:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-interface-'+id}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:(()=>{let n=0;return()=>`u6-interface-${id}-${++n}`})()})
 await controller.initialize();await controller.importNew(raw);expect(controller.snapshot.view!.origin).toBe('normal')
 return {controller,store,p:():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}},close:async()=>{await controller.close();await store.close()}}
}
let sign:Awaited<ReturnType<typeof setup>>,follow:Awaited<ReturnType<typeof setup>>,exit:Awaited<ReturnType<typeof setup>>
beforeAll(async()=>{
 sign=await setup('sign',signRaw);follow=await setup('follow',signedRaw);exit=await setup('exit',exitRaw)
 for(let count=0;count<20&&follow.controller.snapshot.view!.date<'2025-09-01';count++){
  const p=follow.p(),pause=p.features.workbench.pause
  if(pause){
   if(pause.reason!=='CONTENT_DECISION_PENDING')throw Error('ORIGINAL_NORMAL_PAUSE_REQUIRED:'+pause.reason)
   const event=p.features.workbench.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!
   expect((await follow.controller.submit(follow.controller.prepare('ChooseEvent',{instanceId:event.id,choiceId:choice.id}))).status).toBe('saved')
  }else expect((await follow.controller.submit(follow.controller.prepare('AdvanceTime',{date:'2025-09-01'}))).status).toBe('saved')
 }
 expect(follow.p().features.deepseek!.agreements[0]!.followDecision).toBe('pending')
})
afterAll(async()=>{for(const h of [sign,follow,exit])if(h)await h.close()})
beforeEach(()=>hooks.slots.clear())
const target=(p:GamePanelProps,kind:EquitySceneTarget['kind'])=>equityFocusTargets(p).find(r=>r.target.kind===kind)!.target
function near(p:GamePanelProps,t:EquitySceneTarget,intent:EquityChoiceIntent,scope='near'){
 const callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}
 const draw=()=>render(scope,()=>EquitySceneChoice({p,target:t,intent,...callbacks}))
 let tree=draw()
 const field=(label:string)=>{const owner=elements(tree).find(e=>e.type==='label'&&text(e.props.children).startsWith(label)),input=owner&&elements(owner).find(e=>e.type==='input'||e.type==='select');if(!input)throw Error('REAL_FIELD_REQUIRED:'+label);return input}
 const change=(label:string,value:string)=>{invoke(field(label),'onChange',{currentTarget:{value},target:{value}});tree=draw()}
 const button=(kind:string,match:(payload:Record<string,unknown>)=>boolean=()=>true)=>{const node=elements(tree).find(e=>e.type===CommandButton&&e.props.kind===kind&&match(e.props.payload as Record<string,unknown>));if(!node)throw Error('ORIGINAL_COMMAND_REQUIRED:'+kind);return elements(Reflect.apply(CommandButton,undefined,[node.props])).find(e=>e.type==='button')!}
 const step=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e.props.children).startsWith(label));if(!button)throw Error('EXPLICIT_READING_STEP_REQUIRED:'+label);invoke(button,'onClick');tree=draw()}
 return {callbacks,field,change,button,step,draw:()=>{tree=draw();return tree},tree:()=>tree}
}

it('keeps missing, duplicate and foreign-owner reading targets explicit rather than selecting the investor or first business',()=>{
 const p=sign.p(),selected=target(p,'negotiation'),before=sign.controller.exportSaved()
 expect(equityRecordSelection(p,p.accountId,selected.kind==='business'?selected.businessId:selected.recordId)).toMatchObject({target:selected,reason:null})
 expect(equityRecordSelection(p,p.accountId,'missing-invitation').reason).not.toBeNull()
 expect(equityRecordSelection(p,'foreign-account',selected.kind==='business'?selected.businessId:selected.recordId).reason).not.toBeNull()
 const duplicate={...p,features:{...p.features,deepseek:{...p.features.deepseek!,negotiations:[...p.features.deepseek!.negotiations,p.features.deepseek!.negotiations[0]!]}}}
 expect(equityRecordSelection(duplicate,p.accountId,p.features.deepseek!.negotiations[0]!.id).reason).not.toBeNull()
 const tree=render('missing-book',()=>EquityPanel({...p,assignment:{resources:['player-production'],startAt:p.view.date},initialFocusId:'missing-invitation'}))
 expect(text(tree)).toContain('先找回原来这一份');expect(elements(tree).some(e=>e.type===CommandButton)).toBe(false)
 // A resolvable target does not repair a mismatched outer source. The old
 // near intent must neither claim ownership nor expose a new commitment.
 for(const intent of ['terms','holding','collect','governance'] as const){
  const invalid=render('invalid-near-'+intent,()=>EquitySceneChoice({p,target:selected,intent,sourceInvalid:true,sourceReason:'完整来源身份不一致，原记录保留。',onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}))
  expect(invalid.props.title).toBe('先找回原来那一份。');expect(text(invalid)).toContain('完整来源身份不一致')
  expect(elements(invalid).some(e=>e.type===CommandButton)).toBe(false)
 }
 expect(sign.controller.exportSaved()).toBe(before)
})

it('shares exact original invitation and quote fields with the book and isolates another agreement or quote',()=>{
 const p=sign.p(),i=p.features.deepseek!.invitations[0]!,t=target(p,'invitation'),memory=p.equityDraftMemory!,key=equityDraftKey(p,t,'negotiate')
 memory.set(key,{amount:'24680',acquisition:'secondary',terms:'liquidity',resource:'player-production',date:'2025-07-01'})
 const draw=()=>render('same-book',()=>EquityPanel({...p,assignment:{resources:['player-production'],startAt:p.view.date},initialFocusId:i.id})),tree=draw()
 const owner=elements(tree).find(e=>e.type==='label'&&text(e.props.children).startsWith('拟支付投资款'))!,input=elements(owner).find(e=>e.type==='input')!
 expect(input.props.value).toBe('24680');invoke(input,'onChange',{currentTarget:{value:'35000'}});draw()
 const scene=near(p,t,'negotiate')
 expect(scene.field('拟支付的投资本金').props.value).toBe('35000');expect(scene.field('取得股份').props.value).toBe('secondary');expect(scene.field('本次开工日期').props.value).toBe('2025-07-01')
 const proposal=elements(draw()).find(e=>e.type===CommandButton&&e.props.kind==='StartEquityNegotiation')!
 expect(proposal.props.payload).toMatchObject({invitationId:i.id,resources:['player-production'],startAt:'2025-07-01',amountFen:3500000,acquisitionKind:'secondary',termsId:'liquidity'})
 const bookedDate=elements(draw()).find(e=>e.type==='input'&&e.props.type==='date'&&e.props.value==='2025-07-01')!
 expect(bookedDate).toBeDefined();invoke(bookedDate,'onChange',{currentTarget:{value:'2025-08-01'}});draw();scene.draw()
 expect(scene.field('本次开工日期').props.value).toBe('2025-08-01')
 const business={runId:t.runId,accountId:t.accountId,businessId:t.businessId,kind:'business' as const}
 expect(equityDraftKey(p,t,'prepare')).toBe(equityDraftKey(p,business,'prepare'))
 const other={...t,recordId:'another-invitation'} as EquitySceneTarget
 expect(memory.get(equityDraftKey(p,other,'negotiate'))).toBeUndefined()
 const old=exit.p(),willing=old.features.deepseek!.exits.filter(row=>row.buyerWilling===true);expect(willing).toHaveLength(1)
 const q=equityFocusTargets(old).find(row=>row.target.kind==='exit'&&row.target.recordId===willing[0]!.id)!.target,keyQ=equityDraftKey(old,q,'exit-accept');old.equityDraftMemory!.set(keyQ,{shares:'37'})
 const book=render('quote-book',()=>EquityPanel({...old,assignment:{resources:['player-production'],startAt:old.view.date}}))
 const shares=elements(book).find(e=>e.type==='label'&&text(e.props.children).startsWith('接受此报价的实际股数'))!
 expect(elements(shares).find(e=>e.type==='input')!.props.value).toBe('37')
})

it('keeps an empty follow payment disabled while an independent explicit zero decision remains legal',()=>{
 const p=follow.p(),a=p.features.deepseek!.agreements[0]!,t=target(p,'agreement'),before=follow.controller.exportSaved(),scene=near(p,t,'follow')
 const payment=()=>scene.button('FollowEquityRound',body=>body.amountFen!==0)
 const zero=scene.button('FollowEquityRound',body=>body.amountFen===0);expect(zero.props.disabled).toBe(false)
 expect(elements(scene.tree()).filter(e=>e.type===CommandButton&&e.props.kind==='FollowEquityRound')).toHaveLength(1)
 const choose=elements(scene.tree()).find(e=>e.type==='button'&&text(e.props.children).startsWith('试算一笔投入'))!
 invoke(choose,'onClick');invoke(zero,'onClick');expect(p.request).not.toHaveBeenCalled()
 scene.draw();expect(payment().props.disabled).toBe(true)
 scene.change('本次愿意另行投入','');expect(payment().props.disabled).toBe(true)
 scene.change('本次愿意另行投入','8');expect(payment().props.disabled).toBe(false);invoke(payment(),'onClick')
 expect(p.request).toHaveBeenCalledWith('FollowEquityRound',{agreementId:a.id,amountFen:800},expect.any(String),true)
 expect(follow.controller.exportSaved()).toBe(before)
})

it('fills an actual whole-share half amount without paying and shares the same partial-principal draft with the original book',()=>{
 const p=follow.p(),t=target(p,'agreement'),a=p.features.deepseek!.agreements[0]!,before=follow.controller.exportSaved(),scene=near(p,t,'follow','whole-share-draft')
 scene.step('试算一笔投入')
 const half=elements(scene.tree()).find(e=>e.type==='button'&&text(e.props.children).startsWith('试填约一半份额'))!
 expect(half).toBeDefined();invoke(half,'onClick');scene.draw();expect(scene.field('本次愿意另行投入').props.value).toBe('2496');expect(p.request).not.toHaveBeenCalled()
 const book=()=>render('follow-original-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialTarget:t})),owner=elements(book()).find(e=>e.type==='label'&&text(e.props.children).startsWith('本次愿意另行投入'))!,input=elements(owner).find(e=>e.type==='input')!
 expect(input.props.value).toBe('2496');invoke(input,'onChange',{currentTarget:{value:'2504'}});book();scene.draw();expect(scene.field('本次愿意另行投入').props.value).toBe('2504')
 const payment=scene.button('FollowEquityRound',body=>body.amountFen===250400);expect(payment.props.disabled).toBe(false);invoke(payment,'onClick')
 expect(p.request).toHaveBeenCalledWith('FollowEquityRound',{agreementId:a.id,amountFen:250400},expect.any(String),true);expect(follow.controller.exportSaved()).toBe(before)
})

it('preserves the same principal through comparison and rejects callbacks from an earlier principal step at the same revision',()=>{
 const p=follow.p(),t=target(p,'agreement'),before=follow.controller.exportSaved(),scene=near(p,t,'follow','follow-step-roundtrip')
 scene.step('试算一笔投入');scene.change('本次愿意另行投入','8')
 const oldEdit=scene.field('本次愿意另行投入'),oldPayment=scene.button('FollowEquityRound',body=>body.amountFen===800)
 scene.step('回到两种选择');expect(scene.button('FollowEquityRound',body=>body.amountFen===0).props.disabled).toBe(false)
 scene.step('试算一笔投入');expect(scene.field('本次愿意另行投入').props.value).toBe('8')
 invoke(oldEdit,'onChange',{currentTarget:{value:'5000'}});invoke(oldPayment,'onClick');scene.draw()
 expect(scene.field('本次愿意另行投入').props.value).toBe('8');expect(p.request).not.toHaveBeenCalled();expect(follow.controller.exportSaved()).toBe(before)
})

it('explains an original lock and missing board right before asking the player to arrange an impossible action',()=>{
 const p=follow.p(),t=target(p,'agreement'),a=p.features.deepseek!.agreements[0]!,before=follow.controller.exportSaved()
 expect(a.board).toBe(false);expect(a.locked).toBe(true)
 const governance=near(p,t,'governance','no-board-title')
 expect(governance.tree().props.title).toBe('先核对本协议当前的会议权利。')
 expect(text(governance.tree())).toContain('当前没有可提出会议的董事权')
 expect(p.controller.preview(p.controller.prepare('ProposeEquityGovernance',{agreementId:a.id,policy:'independent_audit',resources:['player-production'],startAt:p.view.date})).allowed).toBe(false)
 expect(elements(governance.tree()).some(e=>e.type==='input'||e.type===ResourceSelect)).toBe(false)
 expect(elements(governance.tree()).some(e=>e.type===CommandButton&&e.props.kind==='ProposeEquityGovernance')).toBe(false)
 expect(elements(governance.tree()).some(e=>e.type==='button'&&['查清资本去向','限定接手范围'].some(label=>text(e.props.children).startsWith(label)))).toBe(false)
 expect(text(governance.tree())).toContain('回到这份持股')
 expect(text(governance.tree())).toContain('翻开完整持股手记')
 const locked=near(p,t,'exit-request','locked-title')
 expect(locked.tree().props.title).toBe('还在原锁定期，先看看这份安排。')
 expect(p.controller.preview(p.controller.prepare('RequestEquityExit',{agreementId:a.id,shares:1,resources:['player-production'],startAt:p.view.date})).allowed).toBe(false)
 expect(elements(locked.tree()).some(e=>e.type==='input'||e.type===ResourceSelect)).toBe(false)
 expect(elements(locked.tree()).some(e=>e.type===CommandButton&&e.props.kind==='RequestEquityExit')).toBe(false)
 expect(text(locked.tree())).toContain(a.lockUntil)
 expect(text(locked.tree())).toContain('回到这份持股')
 expect(p.request).not.toHaveBeenCalled();expect(follow.controller.exportSaved()).toBe(before)
 const oldTerms=near(p,target(p,'negotiation'),'terms','already-signed-terms')
 expect(oldTerms.tree().props.title).toBe('本条款已经实际签署，持股另有原册。')
 expect(text(oldTerms.tree())).toContain('当时报价');expect(text(oldTerms.tree())).not.toContain('报价本金')
 expect(oldTerms.button('SignEquityAgreement').props.disabled).toBe(true)
 expect(oldTerms.button('DeclineEquityTerms').props.disabled).toBe(true)
 const book=render('already-signed-book',()=>EquityPanel({...p,assignment:{resources:['player-production'],startAt:p.view.date}}))
 const n=p.features.deepseek!.negotiations[0]!,history=elements(book).find(e=>e.type==='section'&&e.props.id===n.id)!
 expect(history).toBeDefined();expect(text(history)).toContain('原条款本金');expect(text(history)).not.toContain('拟支付')
})

it('retains same-object drafts through a changed date and blocks stale A→B→A callbacks and a changed memory',()=>{
 const p=sign.p(),a=target(p,'invitation'),b={...a,recordId:'another-invitation'} as EquitySceneTarget,read=(t:EquitySceneTarget,props=p)=>render('draft-lifetime',()=>useEquityDraft(props,t,'negotiate'))
 const first=read(a);first.set('amount','20000');expect(read(a).value('amount')).toBe('20000')
 read(b).set('amount','50000');const back=read(a);expect(back.value('amount')).toBe('20000')
 first.set('amount','stale-A');expect(read(a).value('amount')).toBe('20000')
 const withOtherMemory={...p,equityDraftMemory:createEquityDraftMemory()};read(a,withOtherMemory)
 back.set('amount','late-memory');expect(p.equityDraftMemory!.get(first.key)?.amount).toBe('20000')
 const changed={...p,view:{...p.view,date:'2025-07-01',revision:p.view.revision+1}}
 expect(equityDraftKey(changed,a,'negotiate')).toBe(first.key)
 expect(equityDraftKey({...p,accountId:'other-account'},a,'negotiate')).not.toBe(first.key)
 expect(equityDraftKey({...p,view:{...p.view,runId:'other-life'}},a,'negotiate')).not.toBe(first.key)
})

it('does not let an edit from a closed near instance overwrite the same original draft after reopening it',()=>{
 const p=sign.p(),t=target(p,'invitation'),scene=near(p,t,'negotiate','closing-draft')
 scene.change('拟支付的投资本金','20000');const old=scene.field('拟支付的投资本金');invoke(scene.tree(),'onClose')
 const reopened=near(p,t,'negotiate','reopened-draft');expect(reopened.field('拟支付的投资本金').props.value).toBe('20000')
 invoke(old,'onChange',{currentTarget:{value:'77777'}});reopened.draw();expect(reopened.field('拟支付的投资本金').props.value).toBe('20000')
 expect(p.request).not.toHaveBeenCalled()
})

it('does not let an old edit or payment callback bypass a source, readonly or unsaved-candidate protection',()=>{
 const p=follow.p(),t=target(p,'agreement'),scene=near(p,t,'follow'),memory=p.equityDraftMemory!
 scene.step('试算一笔投入')
 scene.change('本次愿意另行投入','8');const payment=scene.button('FollowEquityRound',body=>body.amountFen===800),edit=scene.field('本次愿意另行投入'),key=equityDraftKey(p,t,'follow')
 const old=p.controller.snapshot.view
 // Projection-only counterexamples exercise the real source gate; they do not
 // claim an actual IDB failure or a newly acquired readonly writer.
 const snapshot=vi.spyOn(p.controller,'snapshot','get')
 try{
  for(const status of [{...p.view,hasCandidate:true,saveStatus:'unsaved' as const},{...p.view,readOnly:true,saveStatus:'read_only' as const},{...p.view,revision:p.view.revision+1}]){
   snapshot.mockReturnValue({...p.controller.snapshot,view:status})
   invoke(edit,'onChange',{currentTarget:{value:'not-published'}});invoke(payment,'onClick')
   expect(memory.get(key)?.amount).toBe('8');expect(p.request).not.toHaveBeenCalled()
  }
 }finally{snapshot.mockRestore()}
 expect(p.controller.snapshot.view).toBe(old)
})

it('uses the exact same main thought and paper action and keeps the selected original record when opening its book',()=>{
 const p=sign.p(),t=target(p,'negotiation'),focus=equityFocusFor(p,t),onNavigate=vi.fn(),onFocus=vi.fn()
 const draw=()=>render('moment',()=>EquityMoment({p,focus,headingRef:null,onFocus,onNavigate,onExplore:vi.fn()}))
 const scene=draw(),tableau=elements(scene).find(e=>e.type===RoomTableau)!,paper=tableau.props.object as Element,decisions=elements(tableau.props.decisions),main=decisions.find(e=>e.type==='button'&&String(e.props.className).includes('moment-primary'))!
 const binding=paper.props.binding as {activate:()=>void;label:string}
 expect(main.props.onClick).toBe(binding.activate)
 binding.activate();let choice=elements(draw()).find(e=>e.type===EquitySceneChoice)!;expect(choice.props.intent).toBe('terms');expect(choice.props.target).toEqual(t)
 invoke(choice,'onClose');invoke(main,'onClick');choice=elements(draw()).find(e=>e.type===EquitySceneChoice)!;expect(choice.props.intent).toBe('terms')
 invoke(choice,'onInspect');expect(onNavigate).toHaveBeenCalledWith('deepseek',{accountId:focus.accountId,deepseekPane:'equity',equityTarget:t,recordId:focus.entityId,openRecord:true})
 expect(p.request).not.toHaveBeenCalled();expect(onFocus).not.toHaveBeenCalled()
})

it('opens an unprepared actual normal enterprise relationship directly, preserves explicit fields in the original book and still requests the original confirmation without writing money or rights',async()=>{
 const h=await setup('direct-preparation',beforeContractRaw)
 try{
  // This original July2024 enterprise is already operating. A personal desk
  // cannot be opened before Jan2025; preserve that rejection rather than grant
  // an account or move its date just to satisfy the component precondition.
  expect((await h.controller.submit(h.controller.prepare('EnableCounterfactualEquity',{acknowledge:true}))).status).toBe('saved')
  const actor=h.p().features.deepseek!.businesses[0]!,p={...h.p(),accountId:actor.accountId},t=equityFocusTargets(p).find(row=>row.target.kind==='business'&&row.target.businessId===actor.id)!.target,focus=equityFocusFor(p,t),before=h.controller.exportSaved()
  const draw=()=>render('first-preparation-moment',()=>EquityMoment({p,focus,headingRef:null,onFocus:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn()}))
  const tableau=elements(draw()).find(e=>e.type===RoomTableau)!,paper=tableau.props.object as Element,main=elements(tableau.props.decisions).find(e=>e.type==='button'&&String(e.props.className).includes('moment-primary'))!
  expect(main.props.onClick).toBe((paper.props.binding as {activate:()=>void}).activate);invoke(main,'onClick')
  expect(elements(draw()).find(e=>e.type===EquitySceneChoice)!.props.intent).toBe('relationship')
  const form=near(p,t,'relationship','direct-normal-relationship')
  expect(text(form.tree())).not.toContain('这次具体准备哪一项');expect(text(form.tree())).toContain('企业预算¥500 · 1点 · 7天');expect(text(form.tree())).toContain('工资维护另计');expect(form.field('本次开工日期').props.value).toBe('')
  expect(form.button('StartEquityRelationship').props.disabled).toBe(true)
  form.change('本次开工日期',p.view.date)
  const resource=elements(form.tree()).find(e=>e.type===ResourceSelect)!
  expect(resource.props.appearance).toBe('people');expect(resource.props.value).toBe('');expect(resource.props.options).toContainEqual({id:'player-production',label:'由我自己来做'})
  invoke(resource,'onChange','player-production');form.draw()
  expect(form.button('StartEquityRelationship').props.disabled).toBe(false);invoke(form.button('StartEquityRelationship'),'onClick')
  expect(p.request).toHaveBeenCalledWith('StartEquityRelationship',{businessId:t.businessId,resources:['player-production'],startAt:p.view.date},expect.any(String),true)
  expect(equityDraftKey(p,t,'relationship')).toBe(equityDraftKey(p,t,'prepare'))
  const same=near(p,t,'relationship','direct-normal-relationship-reopened')
  expect(same.field('本次开工日期').props.value).toBe(p.view.date)
  const generic=near(p,t,'prepare','generic-original-preparation')
  expect(generic.field('这次具体准备').props.value).toBe('relationship');expect(generic.field('本次开工日期').props.value).toBe(p.view.date)
  const book=render('direct-preparation-original-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialFocusId:t.businessId}))
  expect(elements(book).some(e=>e.type==='input'&&e.props.type==='date'&&e.props.value===p.view.date)).toBe(true)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('fences callbacks between explicitly selected preparation kinds even though they share the same original business draft',()=>{
 const p=sign.p(),t=target(p,'invitation'),read=(intent:EquityChoiceIntent)=>render('preparation-kind-fence',()=>useEquityDraft(p,t,intent))
 const relation=read('relationship');relation.set('date','2025-07-01');expect(read('relationship').value('preparation')).toBe('relationship')
 const eligibility=read('eligibility');expect(eligibility.key).toBe(relation.key);expect(eligibility.value('date')).toBe('2025-07-01');expect(eligibility.value('preparation')).toBe('eligibility')
 relation.set('date','stale-relation');expect(read('eligibility').value('date')).toBe('2025-07-01')
 const back=read('relationship');eligibility.set('date','stale-eligibility');expect(back.current()).toBe(true);expect(read('relationship').value('date')).toBe('2025-07-01')
})
