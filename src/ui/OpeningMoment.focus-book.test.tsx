import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {OpeningAttemptAction} from './OpeningAttemptAction.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread} from './player-thread.ts'
import {Dialog} from './Dialog.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import {RelaySceneChoice} from './RelaySceneChoice.tsx'
import {initialSeasonFocusGroup,seasonFocusChoices,seasonFocusGroupFor,seasonFocusGroups} from './season-thread.ts'
import prefix from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'

// Invoke OpeningMoment's real choice handlers. No DOM, pagination measurement or browser is simulated.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useId:()=> 'focus-book-handler',useState:<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [hooks.values[index] as T,(value:T|((previous:T)=>T))=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }}
})
type Element=ReactElement<Record<string,unknown>>
const wrappers=new Set<unknown>([MarketSceneChoice,VideoSceneChoice,CourseSceneChoice,RelaySceneChoice])
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(value.type===OpeningAttemptAction&&typeof value.props.children==='function')return elements(value.props.children(null))
 if(wrappers.has(value.type)&&typeof value.props.children==='function')return elements(value.props.children(()=>{}))
 return [value,...elements(value.props.children),...elements(value.props.footer)]
}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
async function normal(name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-focus-book-'+name})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(prefix)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,p:GamePanelProps={controller,view,features,accountId:'personal',request:vi.fn()}
 expect(view.origin).toBe('normal');expect(view.revision).toBe(91)
 return {p,controller,close:()=>controller.close()}
}

it('partitions every real r91 focus once, starts with existing commitments, and numbers the six original customers without repeated paragraphs',async()=>{
 const h=await normal('complete-candidates')
 try{
  const raw=h.controller.exportSaved(),rows=seasonFocusChoices(h.p),groups=seasonFocusGroups.map(group=>rows.filter(row=>seasonFocusGroupFor(row)===group.id))
  expect(initialSeasonFocusGroup(rows)).toBe('continue')
  expect(initialSeasonFocusGroup(groups[1]!)).toBe('directions');expect(initialSeasonFocusGroup(groups[2]!)).toBe('history')
  expect(groups.flat().map(row=>row.id).sort()).toEqual(rows.map(row=>row.id).sort())
  expect(new Set(groups.flat().map(row=>row.id)).size).toBe(rows.length)
  expect(groups[0]![0]!.focus).toMatchObject({kind:'relay',relayTarget:{kind:'business'}})
  expect(groups[1]!.every(row=>row.scope==='entry')).toBe(true);expect(groups[2]!.every(row=>row.scope==='history')).toBe(true)
  const customers=rows.filter(row=>row.focus.kind==='relay'&&row.focus.relayTarget?.kind==='customer')
  expect(customers).toHaveLength(6)
  expect(customers.map(row=>row.title)).toEqual(Array.from({length:6},(_,i)=>'原中转客户'+(i+1)+' · 余额、应收与约定'))
  expect(customers.map(row=>row.focus.entityId)).toEqual(h.p.features.relay!.customers.map(row=>row.id))
  for(const row of rows){const thread=playerThread(h.p,row.focus);expect(row.line).toContain(thread.line.trim());expect(row.line).toContain(thread.detail.trim())}
  for(const row of customers)expect(row.line.split('查看不会充值、收款或安排另一账期。')).toHaveLength(2)
  expect(h.p.request).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.close()}
})

it('keeps a pending radio across groups, cancels without focus changes and confirms only the explicitly previewed original object',async()=>{
 const h=await normal('group-handlers')
 try{
  hooks.values=[]
  const raw=h.controller.exportSaved(),revision=h.p.view.revision,onFocus=vi.fn(),onNavigate=vi.fn(),onExplore=vi.fn(),rows=seasonFocusChoices(h.p)
  const customer=rows.find(row=>row.title==='原中转客户4 · 余额、应收与约定')!,work=rows.find(row=>row.title==='本季的工作与生活底线')!
  let tree:ReturnType<typeof OpeningMoment>|null=null
  const render=()=>{hooks.index=0;tree=OpeningMoment({p:h.p,headingRef:null,fallback:roomMoment(h.p),focus:null,onFocus,onNavigate,onExplore})}
  const nodes=()=>elements(tree)
  const dialog=()=>nodes().find(node=>node.type===Dialog&&String(node.props.className).includes('season-focus-book'))!
  const click=(label:string)=>{const button=nodes().find(node=>node.type==='button'&&text(node.props.children).startsWith(label));if(!button||typeof button.props.onClick!=='function')throw Error('REAL_FOCUS_HANDLER_REQUIRED:'+label);expect(button.props.disabled).not.toBe(true);button.props.onClick();render()}
  const choose=(id:string)=>{const radio=nodes().find(node=>node.type==='input'&&node.props.value===id);if(!radio||typeof radio.props.onChange!=='function')throw Error('REAL_RADIO_REQUIRED:'+id);radio.props.onChange();render()}
  const confirm=()=>nodes().find(node=>node.type==='button'&&text(node.props.children)==='把这件事放到桌面')!
  render();click('调整本季书签')
  expect(String(dialog().props.title)).toContain('继续眼前的事')
  expect(confirm().props.disabled).toBe(true);expect(onFocus).not.toHaveBeenCalled()
  choose(customer.id)
  expect(text(dialog().props.footer)).toContain('待确认：原中转客户4')
  const continuedTitle=dialog().props.title
  click('换个方向')
  expect(dialog().props.title).not.toBe(continuedTitle);expect(String(dialog().props.title)).toContain('换个方向')
  expect(nodes().some(node=>node.type==='input'&&node.props.value===customer.id)).toBe(false)
  expect(text(dialog().props.footer)).toContain('待确认：原中转客户4');expect(text(dialog().props.footer)).toContain('继续眼前的事')
  click('翻过去的记录');expect(String(dialog().props.title)).toContain('翻过去的记录')
  expect(text(dialog().props.footer)).toContain('待确认：原中转客户4')
  click('继续眼前的事')
  expect(nodes().find(node=>node.type==='input'&&node.props.value===customer.id)!.props.checked).toBe(true)
  expect(onFocus).not.toHaveBeenCalled();click('仍留原来的书签')
  expect(dialog()).toBeUndefined();expect(onFocus).not.toHaveBeenCalled()
  click('调整本季书签');expect(confirm().props.disabled).toBe(true)
  click('换个方向');choose(work.id);click('继续眼前的事')
  expect(text(dialog().props.footer)).toContain('待确认：本季的工作与生活底线')
  click('把这件事放到桌面')
  expect(onFocus).toHaveBeenCalledExactlyOnceWith(work.focus);expect(dialog()).toBeUndefined()
  expect(h.p.request).not.toHaveBeenCalled();expect(onNavigate).not.toHaveBeenCalled();expect(onExplore).not.toHaveBeenCalled()
  expect(h.controller.snapshot.view!.revision).toBe(revision);expect(h.controller.exportSaved()).toBe(raw)
 }finally{hooks.values=[];await h.close()}
})
