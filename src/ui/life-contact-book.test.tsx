import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {LifeContactBook,lifeContactReading} from './LifeContactBook.tsx'
import {Dialog} from './Dialog.tsx'

// Original in-memory gameplay and public UI only; no persistence or codec fixtures.
const hooks=vi.hoisted(()=>({enabled:false,index:0,values:[] as unknown[]}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{if(!hooks.enabled)return actual.useState(initial);const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T)=>{hooks.values[i]=next}] as const},useEffect:()=>{}}})
afterEach(()=>{hooks.enabled=false;hooks.index=0;hooks.values=[]})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'life-contact-ui',actorId:'player',commandId:'create',seed:'life-contact-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'contact-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run=initial):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false} as unknown as GamePanelProps['controller']}}
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function draw(p:GamePanelProps,onSelect=vi.fn()){hooks.enabled=true;hooks.index=0;return LifeContactBook({p,selectedId:'tang-ying',onSelect})}
function open(p:GamePanelProps,onSelect=vi.fn()){const initial=draw(p,onSelect),entry=nodes(initial).find(n=>n.type==='button')!;(entry.props.onClick as ()=>void)();return draw(p,onSelect)}
function html(tree:ReactElement){hooks.enabled=false;return renderToStaticMarkup(tree)}
const person=(p:GamePanelProps)=>p.features.life.people.find(row=>row.id==='tang-ying')!
const started=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),completed=act(started,'AdvanceTime',{date:'2020-01-04'})

it('keeps the ordinary scene collapsed and opens all four original contacts with only known portraits',()=>{
 const p=context(),closed=html(draw(p));expect(closed).toContain('翻开联系簿');expect(closed).not.toContain('life-contact-cards')
 const tree=open(p),rendered=html(tree),cards=nodes(tree).filter(n=>n.props.className==='life-contact-card')
 expect(cards).toHaveLength(4);expect(cards.map(n=>n.props['aria-label'])).toEqual(p.features.life.people.map(row=>'看看'+row.name))
 expect(rendered.match(/<img /g)??[]).toHaveLength(p.features.life.people.filter(row=>row.known).length)
 expect(rendered).toContain('还未形成联系');expect(rendered).toContain('先看看原相识前提');expect(rendered).toContain('先看看互动条件')
 expect(cards.filter(n=>n.props['aria-pressed'])).toHaveLength(1);expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('selects the exact original unknown person once and closes without starting an interaction',()=>{
 const p=context(),select=vi.fn(),tree=open(p,select),card=nodes(tree).find(n=>n.props['aria-label']==='看看林舟')!
 expect(card.props['data-known']).toBe('false');(card.props.onClick as ()=>void)()
 expect(select).toHaveBeenCalledExactlyOnceWith('linzhou');expect(nodes(draw(p,select)).some(n=>n.type===Dialog)).toBe(false)
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled();expect(p.features.life.people.find(row=>row.id==='linzhou')!.known).toBe(false)
})

it('closing or cancelling preserves the selected person and issues no command',()=>{
 const p=context(),select=vi.fn(),tree=open(p,select),close=nodes(tree).find(n=>n.type==='button'&&words(n.props.children)==='回到眼前的生活')!
 ;(close.props.onClick as ()=>void)();expect(nodes(draw(p,select)).some(n=>n.type===Dialog)).toBe(false)
 const second=open(p,select),dialog=nodes(second).find(n=>n.type===Dialog)!;(dialog.props.onClose as ()=>void)()
 expect(select).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('reads actual running dates and the new invitation after the original three-day meeting',()=>{
 const running=context(started),done=context(completed)
 expect(lifeContactReading(running,person(running))).toMatchObject({title:'这段相处正在继续',detail:'预计2020-01-04结束'})
 const invitation=person(done).promises.find(row=>row.status==='offered')!;expect(invitation).toBeDefined()
 expect(lifeContactReading(done,person(done))).toMatchObject({title:'有一份原邀请',detail:'回应期限 '+invitation.expiresAt})
 const accepted=context(act(completed,'AcceptLifePromise',{promiseId:invitation.id,consent:true}))
 expect(lifeContactReading(accepted,person(accepted)).title).toBe('已经答应的事');expect(lifeContactReading(accepted,person(accepted)).detail).toContain(invitation.deadline)
 const rendered=html(draw(accepted));expect(rendered).toContain('已答应1份')
})

it('shows actual interruption and declining outcomes without calling them completed',()=>{
 const stopped=context(act(started,'InterruptLifeWork',{jobId:context(started).features.life.jobs[0]!.id}))
 expect(lifeContactReading(stopped,person(stopped))).toMatchObject({title:'这次安排停在途中',detail:'停止于 2020-01-01'})
 const p=context(completed),promise=person(p).promises.find(row=>row.status==='offered')!,declined=context(act(completed,'DeclineLifePromise',{promiseId:promise.id}))
 expect(lifeContactReading(declined,person(declined))).toMatchObject({title:'原邀请已婉拒',detail:'2020-01-04'})
})

it('does not reuse a visible contact across a changed public view or another life',()=>{
 const p=context(),select=vi.fn(),tree=open(p,select),card=nodes(tree).find(n=>n.props['aria-label']==='看看林舟')!
 Object.assign(p.controller.snapshot,{view:{...p.view,revision:p.view.revision+1}});(card.props.onClick as ()=>void)();expect(select).not.toHaveBeenCalled()
 const other=context(createCampaignRun({runId:'other-life',actorId:'player',commandId:'create',seed:'other-life',backgroundId:'technical_employee'}))
 expect(nodes(draw(other,select)).some(n=>n.type===Dialog)).toBe(false);expect(p.request).not.toHaveBeenCalled()
})

it('keeps ambiguous duplicate identities unselectable rather than silently choosing the first',()=>{
 const p=context(),select=vi.fn(),first=person(p),ambiguous={...p,features:{...p.features,life:{...p.features.life,people:[first,first]}}},tree=open(ambiguous,select),cards=nodes(tree).filter(n=>n.props.className==='life-contact-card')
 expect(cards).toHaveLength(2);for(const card of cards){expect(card.props.disabled).toBe(true);(card.props.onClick as ()=>void)()}expect(select).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})
