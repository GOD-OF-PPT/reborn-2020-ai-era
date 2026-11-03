import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {playerThread} from './player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {SharedActionBinding} from './shared-action.ts'

// Pure UI harness. An in-memory normal run supplies public projection and
// preview. No storage, codec import/export, or command submission is exercised.
function setup(approach:'free'|'first_order'|'investment'='free') {
  const run=createCampaignRun({runId:'free-ui-'+approach,actorId:'player',commandId:'create',seed:'free-ui-choice',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach}})
  const registry=createCampaignRegistry()
  const projected=registry.runtime!.project!(run)
  const features=projected as unknown as PlayFeatures
  const view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
  const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
  const request=vi.fn()
  const p:GamePanelProps={controller,view,features,request,accountId:'personal'}
  const render=()=>renderToStaticMarkup(<OpeningMoment p={p} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
  return {p,render,request}
}

it('shows rest and work directly on the first free screen with original resources and a feedback date',()=>{
  const {render,request}=setup(),html=render()
  expect(html).toContain('今天，想怎样过？')
  expect(html).toContain('休整几天，还是先去上班？')
  expect(html).toContain('歇几天')
  expect(html).toContain('去上班')
  expect(html).toContain('预计2020-01-08结束')
  expect(html).toContain('月末按在岗日领工资')
  expect(html).toContain('今天的日历 歇几天')
  expect(html).toContain('环顾房间')
  expect(html).not.toContain('今天，先把时间留给什么')
  expect(html).not.toContain('阅读与探索不消耗行动')
  expect(html).not.toContain('<dialog')
  expect(request).not.toHaveBeenCalled()
})

it.each([['first_order','回应这封委托'],['investment','看看这笔钱，准备怎样安排']] as const)('keeps the %s opening in its own original decision', (approach,label)=>{
  const {render,request}=setup(approach),html=render()
  expect(html).toContain(label)
  expect(html).not.toContain('休整几天，还是先去上班？')
  expect(request).not.toHaveBeenCalled()
})

it('requests the original rest confirmation through its shared object/main action',()=>{
  const {p,request}=setup()
  const captured:SharedActionBinding[]=[]
  renderToStaticMarkup(<DayThreadAction p={p} thread={playerThread(p)} active result={false} date={null} waitLabel="" onToday={vi.fn()}>{primary=>{
    if(primary)captured.push(primary.binding)
    return primary?.main
  }}</DayThreadAction>)
  expect(captured).toHaveLength(1)
  expect(captured[0]!.disabled).toBe(false)
  captured[0]!.activate()
  expect(request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind:'rest',personId:null,reference:null},'歇几天',true)
})

it('uses the current public rest duration and cost',()=>{
  const {p}=setup(),rest=p.features.life.work.rest
  const changed={...p,features:{...p.features,life:{...p.features.life,work:{...p.features.life.work,rest:{...rest,costFen:12000,days:3}}}}}
  const html=renderToStaticMarkup(<DayThreadAction p={changed} thread={playerThread(p)} active result={false} date={null} waitLabel="" onToday={vi.fn()}>{primary=>primary?.main}</DayThreadAction>)
  expect(html).toContain('¥120')
  expect(html).toContain('1点')
  expect(html).toContain('3天')
  expect(html).toContain('预计2020-01-04结束')
})
