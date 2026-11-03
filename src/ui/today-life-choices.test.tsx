import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ComponentProps,type ReactElement,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {TodayLifeChoices} from './TodayLifeChoices.tsx'
import {CommandButton} from './CommandButton.tsx'
import type {SharedActionBinding} from './shared-action.ts'

// Pure UI and normal in-memory proposals. No storage, codec or import/export.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'today-life-ui',actorId:'player',commandId:'create',seed:'today-life-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'life-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
const busy=act(act(act(initial,'WorkQuarter'),'ResearchMarket',{definitionId:'market-overview'}),'StartLifeWork',{kind:'rest',personId:null,reference:null})
function props(run=initial):GamePanelProps{
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 return {controller,view,features,request:vi.fn(),accountId:'personal'}
}
function nodes(node:ReactNode):ReactElement<{children?:ReactNode}>[]{return Children.toArray(node).flatMap(child=>isValidElement<{children?:ReactNode}>(child)?[child,...nodes(child.props.children)]:[])}
function actions(p:GamePanelProps){return nodes(TodayLifeChoices({p})).filter((node):node is ReactElement<ComponentProps<typeof CommandButton>>=>node.type===CommandButton)}

it('shows both current personal choices and their real completion dates together',()=>{
 const p=props(),html=renderToStaticMarkup(<TodayLifeChoices p={p}/>)
 for(const text of ['留出七天休整','改善桌椅与照明','¥0','¥3,000','2020-01-08','今天2020-01-01','个人可花¥26,000','本季可用4点','完成后记下这段休整，不返还行动','实际完成后才改善桌椅与照明'])expect(html).toContain(text)
 expect(html).not.toContain('screen-book');expect(actions(p)).toHaveLength(2)
 expect(p.request).not.toHaveBeenCalled()
})

it.each(['rest','workspace'] as const)('opens the original %s decision with its original confirmation and personal payload',kind=>{
 const p=props(),node=actions(p).find(node=>(node.props.payload as {kind:string}).kind===kind)!
 let binding:SharedActionBinding|undefined
 renderToStaticMarkup(<CommandButton {...node.props} renderAction={(value,main)=>{binding=value;return main}}/>)
 expect(binding?.disabled).toBe(false);binding!.activate()
 expect(p.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind,personId:null,reference:null},kind==='rest'?'核对并留出七天休整':'核对并改善桌椅与照明',true)
})

it('uses current public amounts, action points and duration instead of decorative fixed values',()=>{
 const p=props(),terms=p.features.life.work.workspace,changed={...p,features:{...p.features,life:{...p.features.life,work:{...p.features.life.work,workspace:{...terms,costFen:125000,points:terms.points,days:3}}}}}
 const html=renderToStaticMarkup(<TodayLifeChoices p={changed}/>)
 expect(html).toContain('¥1,250');expect(html).toContain('2020-01-04');expect(html).toContain('1点 · 3天')
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps both original unavailable actions and their reasons at zero remaining action points',()=>{
 const p=props(busy);expect(p.view.budget.available).toBe(0)
 const bindings:SharedActionBinding[]=[]
 for(const node of actions(p))renderToStaticMarkup(<CommandButton {...node.props} renderAction={(value,main)=>{bindings.push(value);return main}}/>)
 expect(bindings).toHaveLength(2);expect(bindings.every(binding=>binding.disabled&&binding.reason)).toBe(true)
 for(const binding of bindings)binding.activate()
 expect(p.request).not.toHaveBeenCalled()
 const html=renderToStaticMarkup(<TodayLifeChoices p={p}/>)
 expect((html.match(/disabled=""/g)??[]).length).toBe(2)
 expect(html).toContain('class="reason"')
})
