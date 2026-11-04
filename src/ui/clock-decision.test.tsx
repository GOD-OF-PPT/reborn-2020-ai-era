import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayingView} from './game-types.ts'
import {captureClockDecision,ClockDecisionFacts} from './ClockDecisionFacts.tsx'
import {ClockConfirmationFacts} from './ClockConfirmationFacts.tsx'
import {ClockCommandDetails} from './ClockCommandDetails.tsx'
import {PersonalCommandReview,isPersonalDecisionFacts} from './PersonalCommandReview.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'
import {Dialog} from './Dialog.tsx'

// Original normal in-memory proposals and public clock projections only.
const hooks=vi.hoisted(()=>({enabled:false,index:0,values:[] as unknown[]}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{if(!hooks.enabled)return actual.useState(initial);const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(value:T)=>{hooks.values[index]=value}] as const}}})
afterEach(()=>{hooks.enabled=false;hooks.index=0;hooks.values=[]})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'clock-reading-ui',actorId:'player',commandId:'create',seed:'clock-reading-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function command(run:GameRun,kind:string,payload:unknown):CommandEnvelope{return {runId:run.runId,actorId:run.actorId,commandId:'clock-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload}}
function act(run:GameRun,kind:string,payload:unknown){const result=evaluateCommand(run,command(run,kind,payload),registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED');return result.nextRun}
function context(run=initial,date='2020-02-01'){
 const cmd=command(run,'AdvanceTime',{date}),preview=previewCommand(run,cmd,registry,run.actorId),clock=registry.runtime!.clockCommitments!(run,{date,phase:'snapshot'}),features=registry.runtime!.project!(run)
 const view:PlayingView={...projectRun(run),features,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {cmd,preview,clock,view,accountName:(id:string):string=>id==='personal'?'个人账户':'原经营账户'}
}
const capture=(c:ReturnType<typeof context>)=>captureClockDecision(c.cmd,c.preview,c.view,c.clock,c.accountName)
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(nodes);return isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children)]:[]}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''

it('shows the normal known living cost separately from the original zero clock cost',()=>{
 const c=context(),before=JSON.stringify(c),value=capture(c)!
 expect(c.preview.allowed).toBe(true);expect(value).toMatchObject({from:'2020-01-01',target:'2020-02-01',newCostFen:0,newActionPoints:0,accounts:[{id:'personal',dueFen:400000,accruedFen:0,held:false}]})
 const html=renderToStaticMarkup(<ClockDecisionFacts value={value}/>);for(const text of ['计划走到','2020-02-01','¥4,000','推进本身：¥0 / 0点','原预留使用行动','资金缺口会先停'])expect(html).toContain(text)
 expect(html).not.toContain('免费');expect(JSON.stringify(c)).toBe(before)
})

it('does not confuse no scheduled payment with an already completed rest',()=>{
 const run=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),c=context(run,'2020-01-08'),value=capture(c)!
 expect(value.accounts).toHaveLength(0);const html=renderToStaticMarkup(<ClockDecisionFacts value={value}/>)
 expect(html).toContain('原排程未列本段已知待付');expect(html).toContain('未成交和未出账另按原条款处理');expect(html).not.toContain('休整已完成')
 expect(value.target).toBe('2020-01-08');expect(c.view.budget.available).toBe(3)
})

it('keeps a normal first order held cost in the due total instead of charging it twice',()=>{
 const run=act(initial,'StartFirstOrder',{}),c=context(run,'2020-01-20'),value=capture(c)!
 expect(value.accounts).toEqual([{id:'personal',name:'个人账户',dueFen:50000,accruedFen:0,held:true}])
 const html=renderToStaticMarkup(<ClockDecisionFacts value={value}/>)
 expect(html).toContain('¥500');expect(html).toContain('不另占一份');expect(html).not.toContain('¥1,000')
})

it('keeps two public accounts and already accrued costs separate without pooling or double adding',()=>{
 const c=context(),personal=c.clock.accounts.find(a=>a.accountId==='personal')!
 // Isolated public display example, not a fabricated executed business.
 const clock={...c.clock,accounts:[personal,{accountId:'example-business',accruedAtFromFen:1000,outflows:[{id:'example-bill',date:'2020-02-01',label:'原账单',amountFen:-151456,releasedFen:150000}]}]},view={...c.view,accounts:[...c.view.accounts,{...c.view.accounts[0]!,accountId:'example-business'}]}
 const value=captureClockDecision(c.cmd,c.preview,view,clock,c.accountName)!,html=renderToStaticMarkup(<ClockDecisionFacts value={value}/>)
 expect(value.accounts.map(a=>a.dueFen)).toEqual([400000,151456]);for(const text of ['个人账户','原经营账户','¥4,000','¥1,514.56','已用未出账¥10','不与同笔到期账单重复相加'])expect(html).toContain(text)
 expect(html).not.toContain('¥1,524.56');expect(html).not.toContain('¥5,514.56')
})

it('leaves unknown amounts, overdue sources and longer responsibility sets in the original full review',()=>{
 const c=context(),account=c.clock.accounts.find(a=>a.outflows.length)!,flow=account.outflows[0]!
 for(const f of [{...flow,amountFen:Number.NaN},{...flow,releasedFen:-1},{...flow,originalDueAt:'2019-12-01'},{...flow,date:'2020-02-30'}])expect(capture({...c,clock:{...c.clock,accounts:[{...account,outflows:[f]}]}})).toBeNull()
 expect(capture({...c,clock:{...c.clock,accounts:[{...account,outflows:Array.from({length:7},(_,i)=>({...flow,id:'item-'+i}))}]}})).toBeNull()
 expect(capture({...c,accountName:()=> '完整原账户名'.repeat(8)})).toBeNull()
 expect(captureClockDecision(c.cmd,c.preview,c.view,null,c.accountName)).toBeNull()
})

it('requires the same captured identity, date and original ordinary preview',()=>{
 const c=context()
 for(const patch of [{runId:'other'},{sourceRevision:c.view.revision+1},{from:'2020-01-02'},{target:'2020-02-02'},{targetPhase:'certain_receipts' as const}])expect(capture({...c,clock:{...c.clock,...patch}})).toBeNull()
 for(const patch of [{readOnly:true},{hasCandidate:true},{busy:true}])expect(capture({...c,view:{...c.view,...patch}})).toBeNull()
 for(const patch of [{allowed:false},{receivedPrepaymentFen:100},{releasedFen:1}])expect(capture({...c,preview:{...c.preview,...patch}})).toBeNull()
 expect(capture({...c,cmd:{...c.cmd,kind:'AdvanceEpilogueTime'}})).toBeNull()
 expect(capture({...c,cmd:{...c.cmd,expectedRevision:c.view.revision+1}})).toBeNull()
})

it('uses the original confirmation footer and retains both complete clock explanations in a separate reader',()=>{
 hooks.enabled=true;const c=context(),value=capture(c)!,facts=<ClockDecisionFacts value={value}/>,close=vi.fn(),confirm=vi.fn(),actions=<button onClick={confirm}>让日子继续 →</button>,status=<p role="alert">原当前原因</p>
 const originalFacts=<ClockConfirmationFacts clock={c.clock} newCostFen={c.preview.upfrontCostFen} newActionPoints={c.preview.actionPoints} accountName={c.accountName}/>,originalDetails=<ClockCommandDetails projection={c.clock} accountName={c.accountName}/>,details=<>{originalFacts}{originalDetails}<p>原独立等待说明</p></>
 const props={title:'核对后推进',facts,details,status,actions,onClose:close},render=()=>{hooks.index=0;return nodes(PersonalCommandReview(props))}
 expect(isPersonalDecisionFacts(facts)).toBe(true);let tree=render(),dialog=tree.find(n=>n.type===Dialog)!
 expect(dialog.props.layout).toBe('direct');expect(dialog.props.footer).toBe(actions);expect(dialog.props.onClose).toBe(close)
 const read=tree.find(n=>n.type==='button'&&words(n.props.children)==='翻阅这次决定的完整说明 ↗')!;(read.props.onClick as ()=>void)()
 tree=render();const dialogs=tree.filter(n=>n.type===Dialog),reader=dialogs[1]!
 expect(dialogs).toHaveLength(2);const full=nodes(reader.props.children)
 expect(full.find(n=>n.type===ClockConfirmationFacts)?.props.clock).toBe(c.clock);expect(full.find(n=>n.type===ClockCommandDetails)?.props.projection).toBe(c.clock)
 expect(words(reader.props.children)).toContain('原独立等待说明');expect(words(reader.props.children)).toContain('原当前原因')
 ;(reader.props.onClose as ()=>void)();expect(render().filter(n=>n.type===Dialog)).toHaveLength(1);expect(confirm).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled()
})

it('names the clock action without changing other original command labels',()=>{
 expect(personalConfirmationAction(context().cmd)).toBe('让日子继续')
 expect(personalConfirmationAction(command(initial,'WorkQuarter',{}))).toBe('安排本季工作')
 expect(personalConfirmationAction(command(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}))).toBe('开始休整')
 expect(personalConfirmationAction(command(initial,'AdvanceEpilogueTime',{}))).toBe('就这样决定')
})
