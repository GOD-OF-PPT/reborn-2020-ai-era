import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ComponentProps,type ReactElement,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {SharedActionBinding} from './shared-action.ts'
import {OpeningAttemptChoices} from './OpeningAttemptChoices.tsx'
import {openingAttempt} from './opening-attempt.ts'
import {CommandButton} from './CommandButton.tsx'
import {playerThread} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'

// Public normal in-memory proposals and UI controls only; no store or codec.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'market-entry-ui',actorId:'player',commandId:'create',seed:'market-entry-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'}})
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL')
 return result.nextRun
}
function setup(run=initial){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={controller,view,features,accountId:'personal',request:vi.fn()}
 const attempt=openingAttempt(p,{kind:'market',runId:view.runId,accountId:'personal',entityId:null})!
 const props={p,attempt,panel:'market' as const,onClose:vi.fn(),onInspect:vi.fn(),onMarket:vi.fn(),onExplore:vi.fn(),onFocus:vi.fn(),onNavigate:vi.fn()}
 return {p,props,tree:()=>OpeningAttemptChoices(props),render:()=>renderToStaticMarkup(<OpeningAttemptChoices {...props}/>)}
}
function nodes(node:ReactNode):ReactElement<{children?:ReactNode;onClick?:()=>void}>[]{return Children.toArray(node).flatMap(c=>isValidElement<{children?:ReactNode;onClick?:()=>void}>(c)?[c,...nodes(c.props.children)]:[])}
function text(node:ReactNode):string{return Children.toArray(node).map(c=>typeof c==='string'||typeof c==='number'?String(c):isValidElement<{children?:ReactNode}>(c)?text(c.props.children):'').join('')}
function researchBinding(h:ReturnType<typeof setup>){
 const node=nodes(h.tree()).find(n=>n.type===CommandButton) as ReactElement<ComponentProps<typeof CommandButton>>
 const bindings:SharedActionBinding[]=[]
 renderToStaticMarkup(<CommandButton {...node.props} renderAction={(binding,body)=>{bindings.push(binding);return body}}/>)
 return bindings[0]!
}

it('shows the three actual choices together, with personal cash and the real research finish date',()=>{
 const h=setup(),html=h.render()
 for(const label of ['先读公开资料','填写模拟委托','先留着这笔钱','¥26,000','¥0','1点','2020-01-02'])expect(html).toContain(label)
 expect(html).toContain('生活与投资，共用这笔钱')
 expect(html).toContain('不揭示未来价格')
 expect(html).not.toContain('screen-book')
 expect(h.p.request).not.toHaveBeenCalled()
})

it('routes research to the original confirmation rather than doing work while choosing',()=>{
 const h=setup(),binding=researchBinding(h)
 expect(binding.disabled).toBe(false)
 binding.activate()
 expect(h.props.onClose).toHaveBeenCalledOnce()
 expect(h.p.request).toHaveBeenCalledExactlyOnceWith('ResearchMarket',{definitionId:'market-overview'},'先读公开资料',true)
})

it('keeps the normal zero-action rejection and does not issue a research request',()=>{
 const work=act(initial,'WorkQuarter'),rest=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),stopped=act(rest,'InterruptLifeWork',{jobId:rest.life!.jobs[0]!.id}),again=act(stopped,'StartLifeWork',{kind:'rest',personId:null,reference:null})
 const h=setup(again),binding=researchBinding(h)
 expect(binding.disabled).toBe(true)
 binding.activate()
 expect(h.p.request).not.toHaveBeenCalled()
})

it.each(['completed','interrupted'] as const)('returns to the same %s research without offering it as new work',status=>{
 const started=act(initial,'ResearchMarket',{definitionId:'market-overview'}),research=started.market!.researches[0]!
 const run=status==='completed'?act(started,'AdvanceTime',{date:research.completeAt}):act(started,'StopMarketResearch',{researchId:research.id})
 const h=setup(run),html=h.render()
 expect(html).toContain(status==='completed'?'公开资料已于2020-01-02整理完成':'这份研究已中断')
 expect(html).not.toContain('先读公开资料')
 const button=nodes(h.tree()).find(n=>n.type==='button'&&text(n.props.children).startsWith('查看这份研究'))!
 button.props.onClick!()
 expect(h.props.onFocus).toHaveBeenCalledExactlyOnceWith({kind:'market',runId:run.runId,accountId:'personal',entityId:research.id,entityKind:'research'})
 expect(h.p.request).not.toHaveBeenCalled()
})

it('keeps order drafting and cash retention as separate UI destinations with no command',()=>{
 for(const [label,target] of [['填写模拟委托','onMarket'],['先留着这笔钱','onExplore']] as const){
  const h=setup(),button=nodes(h.tree()).find(n=>n.type==='button'&&text(n.props.children).startsWith(label))!
  button.props.onClick!()
  expect(h.props[target]).toHaveBeenCalledOnce()
  expect(h.props.onClose).toHaveBeenCalledOnce()
  expect(h.p.request).not.toHaveBeenCalled()
 }
})


it('keeps running research on the original research scene instead of constructing an entry dialog',()=>{
 const run=act(initial,'ResearchMarket',{definitionId:'market-overview'}),h=setup(run)
 expect(h.props.attempt).toBeNull()
 expect(h.p.features.market.researches[0]!.status).toBe('running')
 expect(h.p.request).not.toHaveBeenCalled()
})


it('keeps the running research object, concise scene facts and full source description aligned',()=>{
 const run=act(initial,'ResearchMarket',{definitionId:'market-overview'}),h=setup(run),id=run.market!.researches[0]!.id
 const focus={kind:'market' as const,runId:run.runId,accountId:'personal',entityId:id,entityKind:'research' as const},thread=playerThread(h.p,focus)
 expect(thread.object).toBe('桌上的公开研究笔记')
 expect(thread.inspect.target?.recordId).toBe(id)
 expect(thread.wait?.date).toBe('2020-01-02')
 expect(thread.line).toContain('研究不会揭示未来价格')
 expect(thread.detail).toContain('中断不退回已经投入的钱和行动')
 const html=renderToStaticMarkup(<OpeningMoment p={h.p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(h.p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(html).toContain('公开资料整理中；研究不代买卖')
 expect(html).toContain('中断不退已耗费用与行动')
 expect(html).toContain('翻阅这一段的记录与代价')
 expect(html).not.toContain('原来的模拟委托与持仓')
 expect(h.p.request).not.toHaveBeenCalled()
})


it.each(['completed','interrupted'] as const)('keeps %s research results concise without hiding the original source facts',status=>{
 const started=act(initial,'ResearchMarket',{definitionId:'market-overview'}),research=started.market!.researches[0]!,run=status==='completed'?act(started,'AdvanceTime',{date:research.completeAt}):act(started,'StopMarketResearch',{researchId:research.id}),h=setup(run)
 const focus={kind:'market' as const,runId:run.runId,accountId:'personal',entityId:research.id,entityKind:'research' as const},thread=playerThread(h.p,focus)
 expect(thread.inspect.target?.recordId).toBe(research.id)
 expect(thread.detail).toContain('原成本和行动按实际记录保留')
 const html=renderToStaticMarkup(<OpeningMoment p={h.p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(h.p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 expect(html).toContain(status==='completed'?'2020-01-02已完成 · 费用与行动不返还，买卖另行决定':'研究已中断，已投入的费用和行动不返还')
 expect(h.p.request).not.toHaveBeenCalled()
})
