import {beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayingView,PlayFeatures} from './game-types.ts'
import {currentDueReading,cashGapReading,cashGapResult} from './cash-gap-reading.ts'
import {CashGapDecision} from './CashGapDecision.tsx'
import {CommandButton} from './CommandButton.tsx'
import {savedSceneResult} from './scene-result.ts'
import {sceneStatusNotice} from './scene-feedback-copy.ts'

// Normal in-memory public commands and UI projections only. No codec, store,
// persisted records, import/export, replay or failure injection.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'cash-gap-ui-normal',actorId:'player',commandId:'create',seed:'cash-gap-ui-normal',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'gap-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind+':'+JSON.stringify(result));return result.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function props(run:GameRun):GamePanelProps{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view:v,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
let paused:GameRun,partial:GameRun,partialAcknowledged:GameRun,released:GameRun,paid:GameRun,paidAcknowledged:GameRun
beforeAll(()=>{
 let run=act(initial,'DeclineOffer',{offerId:'manual-first-2020'})
 run=act(run,'PlanStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:200,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-03-31'})
 for(let n=0;n<12;n++){
  const p=props(run),w=p.features.workbench
  if(w.pause?.reason==='CASH_SHORTFALL'){paused=run;break}
  if(w.pause){const e=w.events.find(e=>e.isBlocking),c=e?.choices.find(c=>c.isDefault);if(!e||!c||c.costFen||c.actionPoints)throw Error('PUBLIC_FREE_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id})}
  else run=act(run,'AdvanceTime',{date:'2020-02-01'})
 }
 if(!paused)throw Error('ACTUAL_PUBLIC_CASH_GAP_REQUIRED')
 const p=props(paused),debt=p.features.workbench.finance[0]!.obligations.find(d=>d.date<=p.view.date)!,order=p.features.market.orders.find(o=>o.status==='planned')!
 if(!debt||!order)throw Error('ORIGINAL_DEBT_AND_UNEXECUTED_PLAN_REQUIRED')
 partial=act(paused,'PayObligation',{accountId:debt.accountId,obligationId:debt.id,amountFen:100000})
 partialAcknowledged=act(partial,'AcknowledgeCashGap',{instanceId:p.features.workbench.pause!.instanceId})
 released=act(paused,'CancelStockOrder',{orderId:order.id})
 paid=act(released,'PayObligation',{accountId:debt.accountId,obligationId:debt.id,amountFen:debt.remainingFen})
 paidAcknowledged=act(paid,'AcknowledgeCashGap',{instanceId:p.features.workbench.pause!.instanceId})
},120000)
type Element=ReactElement<Record<string,unknown>>
function nodes(v:unknown):Element[]{if(Array.isArray(v))return v.flatMap(nodes);return isValidElement<Record<string,unknown>>(v)?[v,...nodes(v.props.children)]:[]}
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''

it('distinguishes the actual overdue original payment from a cleared payment that still needs the original pause acknowledgment',()=>{
 expect(cashGapReading(props(paused))).toMatchObject({state:'due',dueFen:400000})
 expect(cashGapReading(props(partial))).toMatchObject({state:'due',dueFen:300000})
 expect(cashGapReading(props(paid))).toMatchObject({state:'clear',dueFen:0,label:'确认这次暂停，继续今天'})
 expect(cashGapReading(props(paidAcknowledged))).toBeNull()
 expect(view(paid).date).toBe(view(paused).date)
})
it('explains actual partial payment, its remaining amount and the absence of a second expense',()=>{
 const result=cashGapResult('PayObligation',view(paused),view(partial))!
 expect(result).toContain('实际支付¥1,000');expect(result).toContain('还剩¥3,000');expect(result).toContain('没有再记一遍费用')
 expect(savedSceneResult('PayObligation','支付已有义务',view(paused),view(partial))).toBe(result)
 const before=props(paused).features.workbench.finance[0]!,after=props(partial).features.workbench.finance[0]!
 expect(after.metrics).toEqual(before.metrics);expect(before.cashFen-after.cashFen).toBe(100000)
})
it('proves a removed positive-debt row against the original transaction, cash and payable balances before calling it paid',()=>{
 const before=view(released),after=view(paid),result=cashGapResult('PayObligation',before,after)!
 expect(result).toContain('实际支付¥4,000');expect(result).toContain('这笔原款已付清');expect(currentDueReading(props(paid))!.dueFen).toBe(0)
 const f=(after.features as unknown as PlayFeatures).workbench.finance[0]!
 expect(f.obligations).toHaveLength(0);expect(f.transactions.at(-1)!.amountFen).toBe(-400000)
})
it('does not turn acknowledgment into payment, time advancement or a paid claim while a real balance remains',()=>{
 const before=view(partial),after=view(partialAcknowledged),result=cashGapResult('AcknowledgeCashGap',before,after)!
 expect(result).toContain('仍有¥3,000到期未付');expect(result).toContain('没有付款');expect(after.date).toBe(before.date);expect(after.accounts).toEqual(before.accounts);expect(after.budget).toEqual(before.budget)
 expect(savedSceneResult('AcknowledgeCashGap','原暂停',before,after)).toBe(result)
})
it('acknowledges a fully handled stop without reviving the inaccurate original summary',()=>{
 const before=view(paid),after=view(paidAcknowledged),result=cashGapResult('AcknowledgeCashGap',before,after)!
 expect(after.receipts.at(-1)!.summary).toBe('延期处置，欠款仍保留')
 expect(result).toContain('当前已无未付到期款');expect(result).toContain('日历仍停在今天');expect(result).not.toContain('欠款仍保留')
 expect(sceneStatusNotice(after.receipts.at(-1)!.summary)).toBeNull();expect(sceneStatusNotice('延期处置，欠款仍保留；还有¥100未付。')).toBe('延期处置，欠款仍保留；还有¥100未付。')
})
it('keeps future principal separate from today’s unpaid bills',()=>{
 const loan=act(initial,'RequestLoan',{accountId:'personal',offerId:'limited-emergency-help'}),p=props(loan),reading=currentDueReading(p)!
 expect(reading.dueFen).toBe(0);expect(reading.debts).toHaveLength(1);expect(reading.debts[0]!.remainingFen).toBe(100000);expect(reading.debts[0]!.date>p.view.date).toBe(true)
})
it('keeps missing, duplicated, mismatched or inconsistent financial sources unknown',()=>{
 const p=props(paid),f=p.features.workbench.finance[0]!
 for(const finance of [[],[f,f],[{...f,payableFen:1}],[{...f,accountId:'other-account'}]]){
  const altered={...p,features:{...p.features,workbench:{...p.features.workbench,finance}}};expect(currentDueReading(altered)).toBeNull();expect(cashGapReading(altered)?.state).toBe('unknown')
 }
 const q=props(paused),debt=q.features.workbench.finance[0]!.obligations[0]!
 const invalid={...q,features:{...q.features,workbench:{...q.features.workbench,finance:[{...q.features.workbench.finance[0]!,obligations:[debt,{...debt}]}]}}};expect(currentDueReading(invalid)).toBeNull()
})
it('rejects wrong receipt identity, source transaction, unchanged debt and an unreconciled cash amount',()=>{
 const before=view(released),after=view(paid),features=after.features as unknown as PlayFeatures,f=features.workbench.finance[0]!,last=f.transactions.at(-1)!
 const financeView=(changes:Partial<typeof f>):PlayingView=>({...after,features:{...features,workbench:{...features.workbench,finance:[{...f,...changes}]}}})
 for(const value of [financeView({transactions:f.transactions.slice(0,-1)}),financeView({transactions:[...f.transactions.slice(0,-1),{...last,sourceId:'another-command'}]}),financeView({transactions:[...f.transactions,last]}),{...after,receipts:[...after.receipts.slice(0,-1),{...after.receipts.at(-1)!,commandId:'another-command'}]},{...after,runId:'other-run'},financeView({obligations:(before.features as unknown as PlayFeatures).workbench.finance[0]!.obligations})])expect(cashGapResult('PayObligation',before,value)).toBeNull()
 expect(cashGapResult('PayObligation',before,{...after,accounts:after.accounts.map(a=>({...a,cashFen:a.cashFen+1}))})).toBeNull()
})
it('renders each original pause choice with one original command and a reading link, without executing either',()=>{
 for(const run of [paused,partial,paid]){
  const p=props(run),tree=CashGapDecision({p,hasDebts:run!==paid})!,rows=nodes(tree),command=rows.find(n=>n.type===CommandButton)!
  expect(command.props).toMatchObject({kind:'AcknowledgeCashGap',payload:{instanceId:p.features.workbench.pause!.instanceId}});expect(rows.filter(n=>n.type===CommandButton)).toHaveLength(1)
  expect(rows.some(n=>n.type==='a')).toBe(run!==paid);expect(p.request).not.toHaveBeenCalled()
  const html=renderToStaticMarkup(tree);expect(html).toContain(cashGapReading(p)!.label);expect(html).not.toContain('本笔应付尚未结清')
 }
})
it('keeps the actual pending amount visible in unknown contexts and does not invent a successful echo for unrelated changes',()=>{
 const before=view(paused),after=view(partial)
 expect(cashGapResult('FundBusiness',before,after)).toBeNull();expect(cashGapResult('PayObligation',before,{...after,revision:after.revision+1})).toBeNull()
 const p=props(paused),tree=CashGapDecision({p:{...p,features:{...p.features,workbench:{...p.features.workbench,finance:[]}}},hasDebts:true})!
 expect(text(tree)).toContain('款项来源尚待核对');expect(text(tree)).not.toContain('已无未付');expect(nodes(tree).some(n=>n.type==='a')).toBe(true)
})
