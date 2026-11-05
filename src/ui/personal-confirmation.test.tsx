import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {captureWorkDecision,WorkDecisionFacts} from './WorkDecisionFacts.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {captureLifeDecision,LifeDecisionFacts} from './LifeDecisionFacts.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'

// Normal public projections and in-memory proposals only. No persistence APIs.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'personal-confirmation-ui',actorId:'player',commandId:'create',seed:'personal-confirmation-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function context(run=initial,kind='WorkQuarter',payload:unknown={}){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
 const view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const command:CommandEnvelope={runId:run.runId,actorId:run.actorId,commandId:'ui-step-'+(run.revision+1),expectedRevision:run.revision,kind,payload}
 const confirm=previewCommand(run,command,registry,run.actorId)
 return {view,features,command,confirm,accountName:()=> '个人账户',clock:null}
}
function act(run:GameRun,kind:string,payload:unknown={}){
 const c=context(run,kind,payload),result=evaluateCommand(run,c.command,registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL: '+JSON.stringify(result))
 return result.nextRun
}

it('separates the actual work commitment from the monthly salary reference and next quarter',()=>{
 const c=context(),value=captureWorkDecision(c.command,c.confirm,c.view,c.features)!
 expect(value).not.toBeNull()
 const html=renderToStaticMarkup(<WorkDecisionFacts value={value}/>)
 expect(html).toContain('现在支付</dt><dd>¥0')
 expect(html).toContain('本季行动</dt><dd>2点')
 expect(html).toContain('完整在岗月的基准为¥8,000')
 expect(html).toContain('现在不会提前到账')
 expect(html).toContain('2020-03-31')
 expect(html).toContain('下一季是否继续，由你再决定')
 expect(personalConfirmationAction(c.command)).toBe('安排本季工作')
})

it('uses the original zero additional action cost when returning to work in the same quarter',()=>{
 const working=act(initial,'WorkQuarter'),quit=act(working,'QuitWork'),next=act(quit,'AdvanceTime',{date:'2020-01-02'}),c=context(next)
 expect(c.confirm.allowed).toBe(true)
 const value=captureWorkDecision(c.command,c.confirm,c.view,c.features)!
 expect(value.points).toBe(0)
 const html=renderToStaticMarkup(<WorkDecisionFacts value={value}/>)
 expect(html).toContain('恢复本季工作')
 expect(html).toContain('本次新增行动</dt><dd>0点')
 const detail=renderToStaticMarkup(<CommandDetails {...c}/>)
 expect(detail).toContain('此前已经使用的行动不返还')
})

it('keeps complete employment terms available without a duplicate salary paragraph or engineering footer',()=>{
 const c=context(),html=renderToStaticMarkup(<CommandDetails {...c}/>)
 expect(html).toContain('<summary>工作与工资说明</summary>')
 expect(html).toContain('月末当天安排工作时，可能从次日开始计薪')
 expect(html).toContain('其他业务仍由你另行选择')
 expect(html).not.toContain('本季度全月在岗基准')
 expect(html).not.toContain('确认后提交，保存成功才生效')
})

it('retains the generic detailed confirmation for unknown identity, dates or unusual financial terms',()=>{
 const c=context()
 expect(captureWorkDecision({...c.command,runId:'other'},c.confirm,c.view,c.features)).toBeNull()
 expect(captureWorkDecision({...c.command,expectedRevision:0},c.confirm,c.view,c.features)).toBeNull()
 expect(captureWorkDecision(c.command,{...c.confirm,releasedFen:100},c.view,c.features)).toBeNull()
 expect(captureWorkDecision(c.command,c.confirm,c.view,{...c.features,workbench:{...c.features.workbench,quarterEnd:'2020-02-30'}})).toBeNull()
 const changed={...c,features:{...c.features,workbench:{...c.features.workbench,employmentMonthlySalaryFen:null}}}
 expect(captureWorkDecision(changed.command,changed.confirm,changed.view,changed.features)).toBeNull()
 expect(renderToStaticMarkup(<CommandDetails {...changed}/>)).toContain('现在不会提前收到工资')
})

it('describes rest with its actual cost and end date while keeping personal responsibility details',()=>{
 const c=context(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),value=captureLifeDecision(c.command,c.confirm,c.view,c.features)!
 expect(personalConfirmationAction(c.command)).toBe('开始休整')
 const facts=renderToStaticMarkup(<LifeDecisionFacts value={value}/>),details=renderToStaticMarkup(<CommandDetails {...c}/>)
 expect(facts).toContain('2020-01-08')
 expect(facts).toContain('1点')
 expect(facts).toContain('行动不返还')
 expect(details).toContain('展开这份安排的完整说明')
 expect(details).toContain('企业或客户保护款')
 expect(details).not.toContain('确认后提交，保存成功才生效')
})

it('keeps person-linked commitments and unrelated commands on their original confirmation wording',()=>{
 const {command}=context()
 expect(personalConfirmationAction({...command,kind:'StartLifeWork',payload:{kind:'rest',personId:'tang-ying',reference:null}})).toBe('就这样决定')
 expect(personalConfirmationAction({...command,kind:'StartLifeWork',payload:{kind:'workspace',personId:null,reference:null}})).toBe('开始改善住处')
 expect(personalConfirmationAction({...command,kind:'StartFirstOrder'})).toBe('接下这笔手工单')
})
