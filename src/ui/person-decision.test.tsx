import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {capturePersonDecision,PersonDecisionFacts} from './PersonDecisionFacts.tsx'
import {PersonalCommandReview,isPersonalDecisionFacts} from './PersonalCommandReview.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {Dialog} from './Dialog.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'

// Original in-memory commands and public projections; no persistence fixtures.
const hooks=vi.hoisted(()=>({enabled:false,index:0,values:[] as unknown[]}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{if(!hooks.enabled)return actual.useState(initial);const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(v:T)=>{hooks.values[i]=v}] as const}}})
afterEach(()=>{hooks.enabled=false;hooks.index=0;hooks.values=[]})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'person-decision-ui',actorId:'player',commandId:'create',seed:'person-decision-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function context(run=initial,kind='StartLifeWork',payload:unknown={kind:'friend_visit',personId:'tang-ying',reference:null}){const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null},command:CommandEnvelope={runId:run.runId,actorId:run.actorId,commandId:'person-'+(run.revision+1),expectedRevision:run.revision,kind,payload},confirm=previewCommand(run,command,registry,run.actorId);return {command,confirm,view,features,accountName:()=> '个人账户',clock:null}}
function act(run:GameRun,kind:string,payload:unknown={}){const c=context(run,kind,payload),result=evaluateCommand(run,c.command,registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
const read=(c:ReturnType<typeof context>)=>capturePersonDecision(c.command,c.confirm,c.view,c.features)
const started=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),met=act(started,'AdvanceTime',{date:'2020-01-04'}),promise=context(met).features.life.promises.find(p=>p.status==='offered')!,accepted=act(met,'AcceptLifePromise',{promiseId:promise.id,consent:true})
const facts=(c:ReturnType<typeof context>)=>renderToStaticMarkup(<PersonDecisionFacts value={read(c)!}/> )
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''

it('captures the original meeting cost and dates without creating the activity',()=>{
 const c=context(),value=read(c)!
 expect(value).toMatchObject({kind:'activity',personId:'tang-ying',costFen:20000,points:1,startAt:'2020-01-01',completeAt:'2020-01-04',reference:null,promiseId:null})
 expect(facts(c)).toContain('个人承担 · 唐萤');expect(facts(c)).toContain('¥200');expect(facts(c)).toContain('中断不退');expect(c.features.life.jobs).toHaveLength(0)
 expect(personalConfirmationAction(c.command)).toBe('安排这次相处')
})
it('separates a zero-cost acceptance from its future original cost, time and deadline',()=>{
 const c=context(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),value=read(c)!,html=facts(c)
 expect(value).toMatchObject({kind:'accept',promiseId:promise.id,costFen:30000,points:1,days:3,deadline:'2020-02-18'})
 expect(html).toContain('现在支付</dt><dd>¥0');expect(html).toContain('现在行动</dt><dd>0');expect(html).toContain('¥300 / 1点 / 3日');expect(html).toContain('2020-02-18');expect(html).toContain('不会自动付费或兑现')
 expect(personalConfirmationAction(c.command)).toBe('答应这次邀请')
})
it('keeps insufficient resources visible when acceptance itself is still allowed',()=>{
 const c=context(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),sample={...c,view:{...c.view,budget:{...c.view.budget,available:0}}}
 expect(read(sample)?.resourcesShort).toBe(true);expect(facts(sample)).toContain('当前行动或个人资金不足以兑现');expect(facts(sample)).toContain('到期未完成仍会记下失约')
})
it('uses the accepted promise’s original terms for fulfillment and retains its deadline',()=>{
 const c=context(accepted,'FulfillLifePromise',{promiseId:promise.id}),value=read(c)!,html=facts(c)
 expect(value).toMatchObject({kind:'fulfill',costFen:30000,points:1,startAt:'2020-01-04',completeAt:'2020-01-07',deadline:'2020-02-18'})
 expect(html).toContain('实际支付</dt><dd>¥300');expect(html).toContain('2020-01-07');expect(html).toContain('原期限');expect(html).toContain('2020-02-18')
 expect(personalConfirmationAction(c.command)).toBe('开始兑现约定')
})
it('keeps exact selected references for other known people; these are public UI samples, not new legal relationships',()=>{
 for(const id of ['linzhou','xu-cheng','chen-yu'] as const){
  const c=context(),person=c.features.life.people.find(p=>p.id===id)!,reference={kind:'paid_case' as const,id:'public-ui-case-'+id,date:c.view.date},known={...person,known:true,references:[reference]},features={...c.features,life:{...c.features.life,people:c.features.life.people.map(p=>p.id===id?known:p)}},sample={...c,features,command:{...c.command,payload:{kind:person.work.kind,personId:id,reference}},confirm:{...c.confirm,upfrontCostFen:person.work.costFen,actionPoints:person.work.points}}
  expect(read(sample)?.reference).toEqual(reference);expect(facts(sample)).toContain('本次材料');expect(facts(sample)).toContain('不改变客户或素材权限')
  expect(read({...sample,command:{...sample.command,payload:{kind:person.work.kind,personId:id,reference:{...reference,id:'foreign'}}}})).toBeNull()
  expect(read({...sample,features:{...features,life:{...features.life,people:features.life.people.map(p=>p.id===id?{...known,references:[reference,reference]}:p)}}})).toBeNull()
 }
})
it('falls back to complete review for mismatched public identities, uncertain costs and unsupported actions',()=>{
 const c=context()
 for(const sample of [
  {...c,command:{...c.command,runId:'other'}},
  {...c,command:{...c.command,expectedRevision:0}},
  {...c,confirm:{...c.confirm,allowed:false}},
  {...c,confirm:{...c.confirm,upfrontCostFen:1}},
  {...c,confirm:{...c.confirm,releasedFen:1}},
  {...c,confirm:{...c.confirm,receivedPrepaymentFen:100}},
  {...c,confirm:{...c.confirm,actionDate:'2020-01-02'}},
  {...c,features:{...c.features,life:{...c.features.life,asOf:'2020-01-02'}}},
  {...c,features:{...c.features,life:{...c.features.life,people:c.features.life.people.map(p=>({...p,known:false}))}}},
  {...c,features:{...c.features,life:{...c.features.life,people:[...c.features.life.people,c.features.life.people[0]!]}}},
  {...c,command:{...c.command,kind:'InterruptLifeWork'}},
  {...c,command:{...c.command,payload:{kind:'rest',personId:null,reference:null}}}
 ])expect(read(sample)).toBeNull()
 const a=context(met,'AcceptLifePromise',{promiseId:promise.id,consent:true})
 expect(read({...a,command:{...a.command,payload:{promiseId:promise.id,consent:false}}})).toBeNull()
 expect(read({...a,features:{...a.features,life:{...a.features.life,promises:[promise,promise]}}})).toBeNull()
 expect(read(context(accepted,'AcceptLifePromise',{promiseId:promise.id,consent:true}))).toBeNull()
 expect(read(context(met,'FulfillLifePromise',{promiseId:promise.id}))).toBeNull()
})
it('routes captured person facts into the direct review with original full details, cancel and confirm untouched',()=>{
 const c=context(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),value=read(c)!,confirm=vi.fn(),close=vi.fn(),actions=<div><button onClick={close}>返回调整</button><button onClick={confirm}>答应这次邀请</button></div>,details=<CommandDetails {...c}/>,props:ComponentProps<typeof PersonalCommandReview>={title:'看清约定后答应',facts:<PersonDecisionFacts value={value}/>,details,status:null,actions,onClose:close}
 expect(isPersonalDecisionFacts(props.facts)).toBe(true)
 const draw=()=>{hooks.enabled=true;hooks.index=0;return nodes(PersonalCommandReview(props))}
 let tree=draw(),dialog=tree.find(n=>n.type===Dialog)!
 expect(dialog.props.layout).toBe('direct');expect(dialog.props.footer).toBe(actions);expect(dialog.props.onClose).toBe(close)
 const readButton=tree.find(n=>n.type==='button'&&words(n.props.children)==='翻阅这次决定的完整说明 ↗')!;(readButton.props.onClick as ()=>void)()
 tree=draw();const dialogs=tree.filter(n=>n.type===Dialog);expect(dialogs).toHaveLength(2)
 const command=nodes(dialogs[1]!.props.children).find(n=>n.type===CommandDetails)!
 for(const key of ['command','confirm','features','view','clock','accountName'] as const)expect(command.props[key]).toBe(c[key])
 hooks.enabled=false;expect(renderToStaticMarkup(command)).toBe(renderToStaticMarkup(details))
 const back=nodes(dialogs[1]!.props.footer).find(n=>n.type==='button')!;(back.props.onClick as ()=>void)();expect(draw().filter(n=>n.type===Dialog)).toHaveLength(1);expect(confirm).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled()
})
