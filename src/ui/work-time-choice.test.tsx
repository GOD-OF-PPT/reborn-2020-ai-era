import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {workTimeChoiceFor,workTimeResearchBrief} from './work-time-choice.ts'
import {committedEcho,SceneTimeNotice} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import {WorkTimeChoices} from './WorkTimeChoices.tsx'
import {CommandButton} from './CommandButton.tsx'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'

// Normal in-memory proposals, public facts and original reading actions only.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-history-ui',actorId:'player',commandId:'create',seed:'work-history-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'history-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run:GameRun){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};const p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};const focus:OpeningFocus={runId:run.runId,kind:'work',accountId:'personal',entityId:view.operations?.employment[0]?.id??null};return {p,focus,thread:playerThread(p,focus)}}
function until(run:GameRun,date:string){for(let n=0;n<30;n++){const w=context(run).p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const work=act(act(initial,'SkipOffer',{offerId:context(initial).p.features.firstOrder.offerId}),'WorkQuarter'),april=until(work,'2020-04-01')

const captured=vi.hoisted(()=>({room:null as Record<string,unknown>|null}))
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{captured.room=p as unknown as Record<string,unknown>;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{captured.room=null})
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
const callbacks=()=>({onClose:vi.fn(),onLife:vi.fn(),onExplore:vi.fn(),onResearch:vi.fn(),onRest:vi.fn()})

it('offers active choices for actual current work with spare points and keeps full or uncertain budgets on the original path',()=>{
 const {p,thread}=context(work),choice=workTimeChoiceFor(p,thread)!
 expect(choice.available).toBe(2);expect(choice.label).toBe('安排工作之外的时间')
 const used=act(until(act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'2020-01-08'),'StartLifeWork',{kind:'workspace',personId:null,reference:null}),full=context(used)
 expect(full.p.view.budget.available).toBe(0);expect(workTimeChoiceFor(full.p,full.thread)).toBeNull()
 for(const budget of [{...p.view.budget,available:0,spent:2,reserved:2},{...p.view.budget,available:2,spent:3},{...p.view.budget,available:Number.NaN}])expect(workTimeChoiceFor({...p,view:{...p.view,budget}},thread)).toBeNull()
 expect(workTimeChoiceFor(p,{...thread,responsibilityOverrideNeeded:true})).toBeNull()
 const history=context(april);expect(workTimeChoiceFor(history.p,history.thread)).toBeNull()
 const stopped=context(act(work,'QuitWork'));expect(workTimeChoiceFor(stopped.p,stopped.thread)).toBeNull()
})

it('shares the new reading action between the work object and main thought and renders the original clock once',()=>{
 const {p,focus}=context(work),html=renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>),room=captured.room!
 const primary=nodes(room.decisions).find(n=>n.type==='button'&&words(n.props.children).includes('安排工作之外的时间'))!,object=room.object as Element
 expect(primary).toBeDefined();expect(object.props.onActivate).toBe(primary.props.onClick);expect(object.props.actionLabel).toBe('安排工作之外的时间')
 expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1);expect(html).toContain('核对后推进 · 2020-01-31');expect(html).toContain('等工作回响 · 2020-01-31');expect(html).toContain('环顾房间')
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('compares exact public rest and research terms and forwards only the chosen original confirmation after closing the sheet',()=>{
 const {p}=context(work),cb=callbacks(),tree=WorkTimeChoices({p,...cb}),commands=nodes(tree).filter(n=>n.type===CommandButton)
 expect(commands.map(n=>[n.props.kind,n.props.payload,n.props.confirm])).toEqual([['StartLifeWork',{kind:'rest',personId:null,reference:null},true],['ResearchMarket',{definitionId:'market-overview'},true]])
 const html=renderToStaticMarkup(tree);expect(html).toContain('2020-01-08');expect(html).toContain('2020-01-02');expect(html).toContain('本季还可用2点');expect(html).toContain('不自动买卖')
 const first=commands[0]!;(first.props.request as GamePanelProps['request'])('StartLifeWork',first.props.payload,'核对并留出七天休整')
 expect(cb.onClose).toHaveBeenCalledTimes(1);expect(p.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind:'rest',personId:null,reference:null},'核对并留出七天休整');expect(cb.onClose.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(p.request).mock.invocationCallOrder[0]!)
})

it('retains an existing completed research by its actual identity instead of starting it again',()=>{
 const done=until(act(work,'ResearchMarket',{definitionId:'market-overview'}),'2020-01-02'),{p}=context(done),cb=callbacks(),tree=WorkTimeChoices({p,...cb}),commands=nodes(tree).filter(n=>n.type===CommandButton),research=p.features.workbench.researches.find(r=>r.id==='market-overview')!.state!
 expect(research.status).toBe('completed');expect(commands.map(n=>n.props.kind)).toEqual(['StartLifeWork']);expect(words(tree.props.children)).toContain('2020-01-02已完成')
 const read=nodes(tree).find(n=>n.type==='button'&&words(n.props.children)==='翻阅这份原研究')!;(read.props.onClick as ()=>void)();expect(cb.onResearch).toHaveBeenCalledExactlyOnceWith(research.id);expect(p.request).not.toHaveBeenCalled()
})

it('keeps life, other attempts and cancellation as separate reading choices with no command',()=>{
 const {p}=context(work),cb=callbacks(),tree=WorkTimeChoices({p,...cb})
 for(const label of ['看看相识的人与其它生活','看看自己的其它尝试','先不新增安排']){const button=nodes(tree).find(n=>n.type==='button'&&words(n.props.children)===label)!;(button.props.onClick as ()=>void)()}
 expect(cb.onLife).toHaveBeenCalledTimes(1);expect(cb.onExplore).toHaveBeenCalledTimes(1);expect(cb.onClose).toHaveBeenCalledTimes(1);expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('shows the same rest job as running or completed and never offers that quarter’s rest again',()=>{
 const started=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null})
 for(const run of [started,until(started,'2020-01-08')]){
  const {p}=context(run),cb=callbacks(),tree=WorkTimeChoices({p,...cb}),job=p.features.life.jobs.find(j=>j.kind==='rest')!,commands=nodes(tree).filter(n=>n.type===CommandButton)
  expect(commands.map(n=>n.props.kind)).toEqual(['ResearchMarket']);expect(words(tree.props.children)).toContain(job.status==='running'?'休整正在继续':'这段休整已经完成');expect(words(tree.props.children)).toContain('已付¥0');expect(words(tree.props.children)).toContain('已用1点')
  const read=nodes(tree).find(n=>n.type==='button'&&words(n.props.children)==='翻阅这段休整')!;(read.props.onClick as ()=>void)();expect(cb.onRest).toHaveBeenCalledExactlyOnceWith(job.id);expect(p.request).not.toHaveBeenCalled()
 }
})

it('keeps the exact public-research start compact in the work scene while retaining its original receipt and mixed-fact fallback',()=>{
 const beforeRun=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),before=context(beforeRun).p.view,{p,thread,focus}=context(act(beforeRun,'ResearchMarket',{definitionId:'market-overview'})),notice={date:p.view.date,text:savedSceneResult('ResearchMarket','原研究',before,p.view),frame:committedEcho(before,p.view)},original=JSON.stringify(notice)
 if(!notice.frame)throw Error('ACTUAL_FRAME_REQUIRED')
 expect(p.view.budget.available).toBe(0);expect(workTimeResearchBrief(p,thread,notice)).toBe('公开研究笔记已开始 · 已付¥0 / 已用1点。预计2020-01-02完成。');expect(JSON.stringify(notice)).toBe(original)
 expect(workTimeResearchBrief(p,thread,{...notice,text:notice.text+' 另有一笔费用。'})).toBeNull()
 expect(workTimeResearchBrief(p,thread,{...notice,frame:{...notice.frame,pointsBefore:notice.frame.pointsBefore+1}})).toBeNull()
 const html=renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()} feedback={<SceneTimeNotice {...notice} compact onClose={vi.fn()} accountName={()=>'个人'}/>}/> )
 expect(html).toContain('公开研究笔记已开始 · 已付¥0 / 已用1点。预计2020-01-02完成。');expect(html).toContain('细看回响');expect(html).toContain('环顾房间');expect(html).not.toContain('1项市场研究已开始')
})
