import {expect,it} from 'vitest'
import {Children,isValidElement,type ReactElement,type ReactNode} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {captureResearchDecision,ResearchDecisionFacts,ResearchDecisionDetails} from './ResearchDecisionFacts.tsx'
import {expandedPersonalDetails,isPersonalDecisionFacts} from './PersonalCommandReview.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'

// Only normal public previews and pure UI. No controller/store/codec tests.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'research-review-ui',actorId:'player',commandId:'create',seed:'research-review-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function context(id='market-overview',run=initial){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const command:CommandEnvelope={runId:run.runId,actorId:run.actorId,commandId:'review-'+run.revision,expectedRevision:run.revision,kind:'ResearchMarket',payload:{definitionId:id}},confirm=previewCommand(run,command,registry,run.actorId)
 return {view,features,command,confirm,accountName:()=> '个人账户',clock:null}
}
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'act-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED');return result.nextRun}
const capture=(c:ReturnType<typeof context>)=>captureResearchDecision(c.command,c.confirm,c.view,c.features)
function nodes(value:ReactNode):ReactElement<Record<string,unknown>>[]{return Children.toArray(value).flatMap(child=>isValidElement<Record<string,unknown>>(child)?[child,...nodes(child.props.children as ReactNode)]:[])}

it.each([
 ['market-overview','公开研究整理',0,'¥0','2020-01-02'],
 ['market-foundation-course','模拟交易规则学习',300000,'¥3,000','2020-01-08'],
 ['simulation-special-study','本局试验段资格研习',10000,'¥100','2020-01-08'],
] as const)('captures the original %s terms and renders its specific purpose', (id,title,cost,money,date)=>{
 const c=context(id),value=capture(c)!
 expect(c.confirm.allowed).toBe(true);expect(value).toMatchObject({definitionId:id,title,costFen:cost,points:1,startAt:'2020-01-01',completeAt:date})
 const facts=<ResearchDecisionFacts value={value}/>,html=renderToStaticMarkup(facts),detail=renderToStaticMarkup(<ResearchDecisionDetails value={value}/>)
 for(const text of [title,'个人承担',money,'1点',date,'不揭示未来价格','中断不返还'])expect(html).toContain(text)
 expect(detail).toContain(value.explanation);expect(detail).toContain('开始不等于已经完成')
 if(id!=='market-overview'){expect(html).toContain('实际完成后');expect(detail).toContain('不是现实券商或融资权限')}
 expect(isPersonalDecisionFacts(facts)).toBe(true);expect(personalConfirmationAction(c.command)).toBe('开始这项研究')
})

it('uses public current terms and date, not fixed free research values',()=>{
 const c=context(),changed={...c,view:{...c.view,date:'2020-02-01'},confirm:{...c.confirm,upfrontCostFen:25000,actionPoints:2},features:{...c.features,workbench:{...c.features.workbench,researches:c.features.workbench.researches.map(row=>row.id==='market-overview'?{...row,costFen:25000,actionPoints:2,days:3}:row)}}}
 // Isolated display-contract variation; not a new gameplay rule or financial run.
 expect(capture(changed)).toMatchObject({costFen:25000,points:2,startAt:'2020-02-01',completeAt:'2020-02-04'})
})

it('keeps the generic confirmation for unknown identity, definitions, dates or unexpected money terms',()=>{
 const c=context(),bad=[{...c,command:{...c.command,runId:'other'}},{...c,command:{...c.command,expectedRevision:0}},{...c,command:{...c.command,payload:{definitionId:'unknown'}}},{...c,view:{...c.view,date:'2020-02-30'}},{...c,confirm:{...c.confirm,upfrontCostFen:100}},{...c,confirm:{...c.confirm,releasedFen:1}},{...c,confirm:{...c.confirm,receivedPrepaymentFen:0}},{...c,confirm:{...c.confirm,actionDate:'2020-01-02'}},{...c,view:{...c.view,accounts:[...c.view.accounts,c.view.accounts.find(row=>row.accountId==='personal')!]}}]
 for(const changed of bad)expect(capture(changed)).toBeNull()
 const terms=c.features.workbench.researches
 expect(capture({...c,features:{...c.features,workbench:{...c.features.workbench,researches:[...terms,terms[0]!]}}})).toBeNull()
 expect(capture({...c,features:{...c.features,workbench:{...c.features.workbench,researches:terms.map(row=>row.id==='market-overview'?{...row,entitlementId:'changed-meaning'}:row)}}})).toBeNull()
})

it('does not summarize an already started research or a normal zero-action rejection as an available commitment',()=>{
 const running=act(initial,'ResearchMarket',{definitionId:'market-overview'}),old=context('market-overview',running)
 expect(old.confirm.allowed).toBe(false);expect(capture(old)).toBeNull()
 const work=act(initial,'WorkQuarter'),rest=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),stopped=act(rest,'InterruptLifeWork',{jobId:rest.life!.jobs[0]!.id}),again=act(stopped,'StartLifeWork',{kind:'rest',personId:null,reference:null}),none=context('market-overview',again)
 expect(none.view.budget.available).toBe(0);expect(none.confirm.allowed).toBe(false);expect(capture(none)).toBeNull()
})

it('preserves captured research details and every original CommandDetails input through full reading',()=>{
 const c=context('market-foundation-course'),value=capture(c)!,research=<ResearchDecisionDetails value={value}/>,original=<CommandDetails {...c}/>,details=<>{research}{original}<p>附加原文</p></>,expanded=expandedPersonalDetails(details),rows=nodes(expanded)
 expect(rows.find(row=>row.type===ResearchDecisionDetails)?.props.value).toBe(value)
 const command=rows.find(row=>row.type===CommandDetails)!
 for(const key of ['command','confirm','features','view','accountName','clock'] as const)expect(command.props[key]).toBe(c[key])
 expect(renderToStaticMarkup(expanded)).toContain(value.explanation)
 expect(renderToStaticMarkup(expanded)).toContain('附加原文')
 expect(isPersonalDecisionFacts(<section>公开研究整理</section>)).toBe(false)
})
