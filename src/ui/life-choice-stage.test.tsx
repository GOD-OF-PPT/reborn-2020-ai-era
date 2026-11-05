import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {LifePerson} from '../core/life-schema.ts'
import type {GamePanelProps,PlayFeatures,LifeSceneMode} from './game-types.ts'
import {NarrativeScene} from './NarrativeScene.tsx'
import {committedEcho} from './SceneEcho.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'

// Public projection and original preview only; no persistence/codec APIs.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'life-stage-ui',actorId:'player',commandId:'create',seed:'life-stage-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL: '+JSON.stringify(result))
 return result.nextRun
}
function props(run=initial,lifeMode:LifeSceneMode='rest',personId:LifePerson='tang-ying'):ComponentProps<typeof NarrativeScene>{
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_CONFIRMATION_REQUIRED')}} as unknown as GamePanelProps['controller']
 return {view,features,controller,request:vi.fn(),requestWait:vi.fn(),accountId:'personal',screen:'life',lifeMode,personId,headingRef:null,onPerson:vi.fn(),onLifeMode:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null}
}
const render=(p:ComponentProps<typeof NarrativeScene>)=>renderToStaticMarkup(<NarrativeScene {...p}/> )

it('puts the original rest decision and its real cost/date on the scene without a reading-page detour',()=>{
 const p=props(),html=render(p)
 expect(html).toContain('现在可以作出的生活选择')
 expect(html).toContain('留出七天休整')
 expect(html).toContain('个人¥0 · 1点 · 7日；现在开始，预计2020-01-08完成')
 expect(html).not.toContain('screen-book')
 expect(html).not.toContain('你的长期联系')
 expect(html).toContain('与人在一起')
 expect(html).toContain('翻看全部生活工作与年度原记录')
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps the workspace cost and original confirmation button directly reachable',()=>{
 const p=props(initial,'workspace'),html=render(p)
 expect(html).toContain('个人¥3,000 · 1点 · 7日')
 expect(html).toContain('改善桌椅与照明')
 expect(html).toContain('预计2020-01-08完成')
 expect(html).not.toContain('screen-book')
 expect(p.request).not.toHaveBeenCalled()
})

it('offers the contact book while retaining the known person’s real meeting terms',()=>{
 const p=props(initial,'person'),html=render(p)
 expect(html).toContain('翻开联系簿')
 expect(html).not.toContain('你的长期联系')
 expect(html).not.toContain('life-contact-cards')
 expect(html).toContain('安排与唐萤见面')
 expect(html).toContain('个人¥200 · 1点 · 3日')
 expect(html).toContain('预计2020-01-04完成')
 expect(html).not.toContain('screen-book')
})

it('keeps an unknown contact in a reading choice without inventing a new meeting action',()=>{
 const p=props(initial,'person','linzhou'),html=render(p)
 expect(html).toContain('这段联系，还没有实际前提')
 expect(html).toContain('查看相识前提与原记录')
 expect(html).not.toContain('安排与林舟共同核对')
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps the dated wait, original money review, interrupt decision and paid resources together',()=>{
 const run=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),p=props(run),html=render(p)
 expect(html).toContain('等这次生活安排完成 · 2020-01-08')
 expect(html).toContain('核对后推进 · 2020-01-08')
 expect(html).toContain('中断这次生活工作，保留原成本与承诺')
 expect(html).toContain('个人已付¥0 · 已耗1点')
 expect(html).not.toContain('screen-book')
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps a meaningful short time receipt and access to its full echo',()=>{
 const resting=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),current=act(resting,'AdvanceTime',{date:'2020-01-06'}),p=props(current)
 const html=render({...p,receiptKind:'AdvanceTime',receipt:'2020-01-06。已经确认的安排按真实日期发生。那份原委托，有了新的实际反馈。',receiptBrief:'委托答复期限已过。',echoFrame:committedEcho(props(resting).view,p.view)})
 expect(html).toContain('委托答复期限已过。')
 expect(html).toContain('细看回响')
 expect(html).toContain('等这次生活安排完成 · 2020-01-08')
})

it('offers the original clock and a complete-condition reader when no actions remain',()=>{
 const working=act(initial,'WorkQuarter'),first=act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}),interrupted=act(first,'InterruptLifeWork',{jobId:first.life!.jobs[0]!.id}),again=act(interrupted,'StartLifeWork',{kind:'rest',personId:null,reference:null}),p=props(again,'workspace')
 expect(p.view.budget.available).toBe(0)
 const html=render(p)
 expect(html).toContain('这季的四点，已经用完')
 expect(html).toContain('改善桌椅与照明 · 条件与费用')
 expect(html).not.toContain('aria-label="改善桌椅与照明"')
 expect((html.match(/class="clock-advance"/g)??[]).length).toBe(1)
 expect(p.request).not.toHaveBeenCalled()
})

it('leaves the original long-form decision book on other routes',()=>{
 const html=render({...props(),screen:'quarter'})
 expect(html).toContain('screen-book')
 expect(html).not.toContain('life-choice-stage')
})

it('changes only the visible wait wording while keeping its original date, label and confirmation request',()=>{
 const p=props(),original='等和唐萤约好的这段时间结束 · 2020-01-04'
 let action:ClockActionBinding|undefined
 const html=renderToStaticMarkup(<ClockAdvance p={p} date="2020-01-04" label={original} displayLabel="等这次相处结束 · 2020-01-04" renderAction={binding=>{action=binding;return binding.mainNode}}/>)
 expect(html).toContain('等这次相处结束 · 2020-01-04')
 expect(html).toContain('aria-label="'+original)
 expect(action).toBeDefined()
 action!.activate()
 expect(p.requestWait).toHaveBeenCalledExactlyOnceWith('2020-01-04',expect.stringContaining(original),true)
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps the real invitation and reply deadline visible alongside a completed-activity echo',()=>{
 const person=props().features.life.people.find(row=>row.id==='tang-ying')!,started=act(initial,'StartLifeWork',{kind:person.work.kind,personId:person.id,reference:null}),completed=act(started,'AdvanceTime',{date:'2020-01-04'}),p=props(completed,'person')
 const html=render({...p,receiptKind:'AdvanceTime',receipt:'这次相处已经完成。',receiptBrief:'这次相处已经完成。',echoFrame:committedEcho(props(started).view,p.view)})
 expect(html).toContain('邀请：留出一次陪伴')
 expect(p.features.life.people.find(row=>row.id==='tang-ying')!.promiseTerms.title).toBe('留出一次已经答应的陪伴')
 expect(html).toContain('2020-01-18前回应')
 expect(html).toContain('2020-02-18完成')
 expect(html).toContain('这次相处已经完成。')
 expect(html).toContain('life-time-echo')
 expect(html).toContain('人物目标与边界')
 expect(html).toContain('看清约定后答应')
 expect(html).toContain('婉拒唐萤的邀请')
})
