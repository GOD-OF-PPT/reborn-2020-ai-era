import {beforeAll,expect,it} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {prepareEco,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {EcosystemCommandDetails} from './EcosystemCommandDetails.tsx'
import type {CommandEnvelope} from '../core/run-types.ts'

type Harness=ReturnType<typeof prepareEco>['h']
const capture=(h:Harness)=>({view:projectRun(h.run),features:{deepseek:projectDeepseek(h.run,h.deepseek),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)}})
type Snapshot=ReturnType<typeof capture>
const text=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):isValidElement<Record<string,unknown>>(node)?text(node.props.children):''
function nodes(node:unknown):ReactElement<Record<string,unknown>>[]{return Array.isArray(node)?node.flatMap(nodes):isValidElement<Record<string,unknown>>(node)?[node,...nodes(node.props.children)]:[]}
function command(p:Snapshot,kind:string,payload:unknown):CommandEnvelope{return {runId:p.view.runId,actorId:'player',commandId:'u5-review-snapshot',expectedRevision:p.view.revision,kind,payload}}
const render=(p:Snapshot,kind:string,payload:unknown)=>EcosystemCommandDetails({...p,command:command(p,kind,payload)})
let p:Snapshot,planned:Snapshot,support:Snapshot,uncollected:Snapshot,leadId:string,businessId:string,contractId:string,h:Harness,raw:string
beforeAll(()=>{
 // Fixed isolated rule fixture, not normal UI or browser acceptance.
 const eco=prepareEco();h=eco.h;leadId=eco.lead.id;businessId=eco.b.id;p=capture(h)
 h.send('AcceptEcoContract',{leadId,scope:'standard',...dsAssignment('2024-07-02')});contractId=h.run.deepseek!.contracts[0]!.id;planned=capture(h)
 const c=h.run.deepseek!.contracts[0]!;h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt});h.send('SubmitEcoDelivery',{contractId});h.send('AdvanceTime',{date:c.reviewAt!});support=capture(h);h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.completeAt});uncollected=capture(h);raw=h.codec.export(h.run)
})

it('confirms the captured model, service purpose, explicit consent, resource and original adaptation window',()=>{
 const body={businessId,modelId:'v2',productId:'training',acceptSimulationTerms:true,...dsAssignment('2024-07-02')},value=render(p,'StartEcosystemAdaptation',body),copy=text(value)
 expect(copy).toContain('DeepSeek-V2 · 小组工具培训');expect(copy).toContain('已明确同意本次游戏内虚构的模型用途范围');expect(copy).toContain('本人实际日期产能');expect(copy).toContain('2024-07-02—2024-07-09');expect(copy).toContain('不授予现实供应权限')
 const noConsent=text(render(p,'StartEcosystemAdaptation',{...body,acceptSimulationTerms:false}));expect(noConsent).toContain('尚未明确同意');expect(noConsent).not.toContain('已明确同意本次')
 expect(h.codec.export(h.run)).toBe(raw)
})

it('keeps pilot and standard quote, production, review and separately reserved support distinct',()=>{
 const a={leadId,resources:['player-production'],startAt:'2024-07-02'},standard=text(render(p,'AcceptEcoContract',{...a,scope:'standard'})),pilot=text(render(p,'AcceptEcoContract',{...a,scope:'pilot'}))
 expect(standard).toContain('标准范围，拟合同额¥6,000');expect(standard).toContain('2024-07-02—2024-07-09');expect(standard).toContain('2024-07-12—2024-07-19');expect(standard).toContain('拟收客户预款¥3,000并全额保护');expect(standard).toContain('10%即¥600')
 expect(standard).toContain('客户1 · DeepSeek-V2')
 expect(pilot).toContain('有限试点，拟合同额¥3,000');expect(pilot).toContain('2024-07-02—2024-07-05');expect(pilot).toContain('2024-07-08—2024-07-11');expect(pilot).toContain('拟收客户预款¥1,500')
 expect(standard).toContain('不是已保存结果');expect(pilot).not.toContain('已经实际收到')
})

it('captures original cancellation prepayment, actual consumed production and remaining support reservation without clearing income',()=>{
 const before=text(render(planned,'CancelEcoContract',{contractId})),after=text(render(support,'CancelEcoContract',{contractId}))
 expect(before).toContain('原未履约预款退款¥3,000');expect(before).toContain('已实际支付¥0');expect(before).toContain('尚未开工资金预留¥1,500')
 expect(after).toContain('原支持退出补偿¥600');expect(after).toContain('已确认生产收入¥4,800保留');expect(after).toContain('当前原应收¥1,800不消失');expect(after).toContain('现金不足的退款或补偿继续关联原合同列应付')
 expect(nodes(render(support,'CancelEcoContract',{contractId})).filter(n=>n.type==='code').map(text)).toContain(support.features.deepseek!.contracts[0]!.originalSupportJobId)
})

it('shows only the selected delivery and captured collection amount, keeping old prepayment and due date separate',()=>{
 const d=uncollected.features.deepseek!.deliveries.find(d=>d.creditFen>0)!,value=text(render(uncollected,'CollectEcoReceivable',{deliveryId:d.id,amountFen:50000}))
 expect(value).toContain(d.id);expect(value).toContain('本次拟收取¥500');expect(value).toContain('尚未实收'+(d.remainingFen===180000?'¥1,800':'¥1,200'));expect(value).toContain(d.dueAt);expect(value).toContain('不重复确认收入、不替你收另一笔原款')
})

it('keeps the captured interrupted support, already-paid budget, old income and conditional exit compensation together',()=>{
 const c=support.features.deepseek!.contracts[0]!,copy=text(render(support,'InterruptJob',{jobId:c.supportJobId}))
 expect(copy).toContain('中断这一份独立支持');expect(copy).toContain('客户1 · DeepSeek-V2');expect(copy).toContain('这份任务已实际支付¥700');expect(copy).toContain('累计已付¥1,500');expect(copy).toContain('原已确认收入¥4,800');expect(copy).toContain('待收款¥1,800');expect(copy).toContain('原支持补偿¥600');expect(copy).toContain('中断不等于取消合同');expect(copy).toContain(c.supportJobId)
 const missing={...support,features:{...support.features,workbench:{...support.features.workbench,finance:[]}}}
 expect(text(render(missing,'InterruptJob',{jobId:c.supportJobId}))).toContain('部分制作或支持的任务、流水来源尚未完整取得')
 expect(render(support,'InterruptJob',{jobId:'unrelated-job'})).toBeNull()
})

it('refuses a stale snapshot, missing source, ambiguous client and unknown purpose without defaulting another object',()=>{
 const body={leadId,scope:'standard',...dsAssignment('2024-07-02')},stale={...command(p,'AcceptEcoContract',body),expectedRevision:p.view.revision-1}
 expect(text(EcosystemCommandDetails({...p,command:stale}))).toContain('确认与当前捕获的存档身份不一致')
 expect(text(render(p,'AcceptEcoContract',{...body,leadId:'missing-original-lead'}))).toContain('尚未唯一核定')
 const duplicates={...p,features:{...p.features,deepseek:{...p.features.deepseek!,leads:[...p.features.deepseek!.leads,p.features.deepseek!.leads.find(l=>l.id===leadId)!]}}}
 expect(text(render(duplicates,'AcceptEcoContract',body))).toContain('尚未唯一核定')
 expect(text(render(p,'StartEcosystemAdaptation',{businessId,modelId:'missing-model',productId:'training',acceptSimulationTerms:true,...dsAssignment('2024-07-02')}))).toContain('原模型或服务用途尚未完整选择')
 expect(render(p,'ActivateBusiness',{businessId:'another-business'})).toBeNull()
})

it('renders an old captured decision from its own facts even after an unrelated later run state exists',()=>{
 const c=command(p,'StartEcosystemAdaptation',{businessId,modelId:'v2',productId:'training',acceptSimulationTerms:true,...dsAssignment('2024-07-02')}),before=text(EcosystemCommandDetails({...p,command:c}))
 expect(p.view.revision).toBeLessThan(uncollected.view.revision);expect(text(EcosystemCommandDetails({...p,command:c}))).toBe(before)
 expect(before).toContain('本次捕获日期 '+p.view.date);expect(h.codec.export(h.run)).toBe(raw)
})
