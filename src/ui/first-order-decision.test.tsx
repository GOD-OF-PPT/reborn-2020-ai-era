import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures,GamePanelProps} from './game-types.ts'
import {captureFirstOrderDecision,FirstOrderDecisionFacts,FirstOrderDecisionDetails} from './FirstOrderDecisionFacts.tsx'
import {OpeningAttemptChoices} from './OpeningAttemptChoices.tsx'
import {openingAttempt} from './opening-attempt.ts'
import {CommandButton} from './CommandButton.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {isPersonalDecisionFacts,expandedPersonalDetails} from './PersonalCommandReview.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'
import {Dialog} from './Dialog.tsx'

// Normal kernel proposals and UI only; no persistence or imported runs.
const registry=createCampaignRegistry()
const initial=(backgroundId:'technical_employee'|'content_employee'='technical_employee')=>createCampaignRun({runId:'first-decision-'+backgroundId,actorId:'player',commandId:'create',seed:'first-decision-ui',backgroundId,playerProfile:{wishId:'autonomy',approach:'first_order'}})
const command=(run:GameRun,kind:string,payload:unknown):CommandEnvelope=>({runId:run.runId,actorId:run.actorId,commandId:'first-'+(run.revision+1),expectedRevision:run.revision,kind,payload})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,command(run,kind,payload),registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
function context(run=initial(),kind='StartFirstOrder',payload:unknown={}){
 const cmd=command(run,kind,payload),preview=previewCommand(run,cmd,registry,run.actorId),projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {run,cmd,preview,view,features}
}
const capture=(c:ReturnType<typeof context>)=>captureFirstOrderDecision(c.cmd,c.preview,c.view,c.features)
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(nodes);return isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children)]:[]}

it.each(['technical_employee','content_employee'] as const)('shows the original %s first-order reservation separately from a quoted future payment',background=>{
 const c=context(initial(background)),value=capture(c)!,before=JSON.stringify(c.view)
 expect(value).toMatchObject({kind:'accept',reserve:true,costFen:50000,points:1,quotedFen:130000,date:'2020-01-01',startAt:'2020-01-05',submitBy:'2020-01-19',reviewAt:'2020-01-20'})
 const html=renderToStaticMarkup(<FirstOrderDecisionFacts value={value}/>);for(const text of ['先留出的制作费','¥500','为开工预留行动','现在先预留','客户报价¥1,300仍未到账'])expect(html).toContain(text)
 expect(JSON.stringify(c.view)).toBe(before)
 const next=context(act(c.run,'StartFirstOrder'));expect(next.features.firstOrder.status).toBe('planned');expect(next.view.budget.reserved).toBe(1);expect(next.features.firstOrder.result.directCostFen).toBe(0)
})

it('shows actual immediate use when the original offer is accepted on its opening date',()=>{
 const c=context(act(initial(),'AdvanceTime',{date:'2020-01-05'})),value=capture(c)!
 expect(value.reserve).toBe(false);const html=renderToStaticMarkup(<FirstOrderDecisionFacts value={value}/>);expect(html).toContain('今天支付制作费');expect(html).toContain('今天使用行动');expect(html).not.toContain('先留出的制作费')
 const details=renderToStaticMarkup(<CommandDetails command={c.cmd} confirm={c.preview} view={c.view} features={c.features} accountName={()=>'个人账户'} clock={null}/>);expect(details).toContain('今天接下，今天开工');expect(details).not.toContain('先预留，再按真实日期制作')
 const next=context(act(c.run,'StartFirstOrder'));expect(next.features.firstOrder.status).toBe('running');expect(next.features.firstOrder.result.directCostFen).toBe(50000);expect(next.view.budget).toMatchObject({reserved:0,spent:1,available:3})
})

it.each(['DeclineOffer','SkipOffer'])('keeps %s as its own zero-cost original answer',kind=>{
 const c=context(),offerId=c.features.firstOrder.offerId,answer=context(c.run,kind,{offerId}),value=capture(answer)!
 expect(value.kind).toBe(kind==='DeclineOffer'?'decline':'skip');expect(value.costFen).toBe(0);expect(value.points).toBe(0)
 const html=renderToStaticMarkup(<FirstOrderDecisionFacts value={value}/>);expect(html).toContain('本次不接单');expect(html).toContain('原报价¥1,300不成为收入')
 const after=context(act(c.run,kind,{offerId}));expect(after.features.firstOrder.status).toBe(kind==='DeclineOffer'?'declined':'skipped');expect(after.features.firstOrder.result.paymentFen).toBe(0);expect(after.view.budget.available).toBe(4)
})

it('shows only the same completed contract for submission and keeps customer receipt separate',()=>{
 const started=act(initial(),'StartFirstOrder'),running=act(started,'AdvanceTime',{date:'2020-01-05'}),done=act(running,'AdvanceTime',{date:'2020-01-19'}),first=context(done).features.firstOrder,c=context(done,'SubmitDelivery',{contractId:first.contractId}),value=capture(c)!
 expect(value).toMatchObject({kind:'submit',costFen:0,points:0,paidCostFen:50000,paidByCustomerFen:0,reviewAt:'2020-01-20'})
 const html=renderToStaticMarkup(<FirstOrderDecisionFacts value={value}/>);expect(html).toContain('原制作已付');expect(html).toContain('¥500');expect(html).toContain('客户目前实付');expect(html).toContain('提交不等于验收')
 const submitted=act(done,'SubmitDelivery',{contractId:first.contractId}),paid=act(submitted,'AdvanceTime',{date:'2020-01-20'}),end=context(paid)
 expect(context(submitted).features.firstOrder.status).toBe('review');expect(end.features.firstOrder.status).toBe('settled');expect(end.features.firstOrder.result).toMatchObject({paymentFen:130000,directCostFen:50000,netOrderFen:80000});expect(end.view.accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(2680000)
})

it('does not substitute the first order for a different offer, command identity or uncertain terms',()=>{
 const c=context()
 for(const cmd of [{...c.cmd,runId:'other'},{...c.cmd,expectedRevision:c.view.revision+1},{...c.cmd,kind:'DeclineOffer',payload:{offerId:'other'}},{...c.cmd,kind:'SubmitDelivery',payload:{contractId:'other'}}])expect(capture({...c,cmd})).toBeNull()
 expect(capture({...c,features:{...c.features,firstOrder:{...c.features.firstOrder,terms:{...c.features.firstOrder.terms,costFen:90000}}}})).toBeNull()
 expect(capture({...c,preview:{...c.preview,receivedPrepaymentFen:1}})).toBeNull()
 expect(capture({...c,preview:{...c.preview,allowed:false}})).toBeNull()
 expect(capture({...c,features:{...c.features,firstOrder:{...c.features.firstOrder,dates:{...c.features.firstOrder.dates,startAt:'2020-02-30'}}}})).toBeNull()
})

it('keeps all three original reply commands directly visible and closes the choice before requesting confirmation',()=>{
 const c=context(),request=vi.fn(),onClose=vi.fn(),p:GamePanelProps={view:c.view,features:c.features,controller:{snapshot:{view:c.view,busy:false},asynchronous:false,runtimeFailed:false,preview:(cmd:CommandEnvelope)=>previewCommand(c.run,cmd,registry,c.run.actorId)} as unknown as GamePanelProps['controller'],request,accountId:'personal'},attempt=openingAttempt(p)!
 const tree=OpeningAttemptChoices({p,attempt,panel:'offer',onClose,onInspect:vi.fn(),onMarket:vi.fn(),onExplore:vi.fn(),onFocus:vi.fn(),onNavigate:vi.fn()})
 expect(tree.type).toBe(Dialog);expect(tree.props.layout).toBe('direct')
 const commands=nodes(tree).filter(node=>node.type===CommandButton)
 expect(commands.map(node=>[node.props.kind,node.props.payload,node.props.confirm])).toEqual([['StartFirstOrder',{},true],['DeclineOffer',{offerId:c.features.firstOrder.offerId},true],['SkipOffer',{offerId:c.features.firstOrder.offerId},true]])
 for(const node of commands){(node.props.request as GamePanelProps['request'])(node.props.kind as string,node.props.payload,node.props.label as string,true)}
 expect(onClose).toHaveBeenCalledTimes(3);expect(request.mock.calls.map(c=>c[0])).toEqual(['StartFirstOrder','DeclineOffer','SkipOffer'])
 const html=renderToStaticMarkup(tree);for(const word of ['接下这笔手工单','婉拒这笔报价','略过这次委托','¥1,300','¥500'])expect(html).toContain(word);expect(html).not.toContain('screen-book')
})

it('registers only the captured first-order facts and retains full original command inputs',()=>{
 const c=context(),value=capture(c)!,facts=<FirstOrderDecisionFacts value={value}/>,original={command:c.cmd,confirm:c.preview,view:c.view,features:c.features,accountName:()=> '个人账户',clock:null}
 expect(isPersonalDecisionFacts(facts)).toBe(true);expect(isPersonalDecisionFacts(<section>首单</section>)).toBe(false)
 const details=<><FirstOrderDecisionDetails value={value}/><CommandDetails {...original}/></>,expanded=expandedPersonalDetails(details),all=nodes(expanded)
 expect(all.find(n=>n.type===FirstOrderDecisionDetails)?.props.value).toBe(value)
 const commandNode=all.find(n=>n.type===CommandDetails)!
 for(const key of ['command','confirm','view','features','accountName','clock'] as const)expect(commandNode.props[key]).toBe(original[key])
 const html=renderToStaticMarkup(expanded);for(const text of ['2020-01-05','2020-01-19','2020-01-20','¥1,300','原其它工作、生活和约定'])expect(html).toContain(text)
})

it('names each original first-order action and leaves existing life and clock verbs intact',()=>{
 const run=initial();for(const [kind,label] of [['StartFirstOrder','接下这笔手工单'],['DeclineOffer','婉拒这笔报价'],['SkipOffer','略过这次委托'],['SubmitDelivery','交出这份作品'],['AdvanceTime','让日子继续'],['WorkQuarter','安排本季工作']])expect(personalConfirmationAction(command(run,kind!,{}))).toBe(label)
})
