import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

const knownResearch={
 'market-overview':{title:'公开研究整理',entitlementId:null,effect:'整理已公开的行情与行业线索。'},
 'market-foundation-course':{title:'模拟交易规则学习',entitlementId:'sim-researched',effect:'实际完成后，取得本局模拟规则研习资格。'},
 'simulation-special-study':{title:'本局试验段资格研习',entitlementId:'sim-experimental-access',effect:'实际完成后，取得本局模拟试验段资格。'},
} as const
export interface ResearchDecision{readonly definitionId:string;readonly title:string;readonly startAt:string;readonly completeAt:string;readonly costFen:number;readonly points:number;readonly explanation:string;readonly effect:string}

/** A presentation snapshot of an ordinary original preview. Any uncertain
 * identity or additional money terms retains the complete generic review. */
export function captureResearchDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures):ResearchDecision|null{
 if(command.kind!=='ResearchMarket'||!preview.allowed||command.runId!==view.runId||command.expectedRevision!==view.revision||view.phase!=='playing'||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved')return null
 const payload=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null
 if(typeof payload?.definitionId!=='string'||!Object.hasOwn(knownResearch,payload.definitionId))return null
 const id=payload.definitionId as keyof typeof knownResearch,copy=knownResearch[id],terms=features.workbench.researches.filter(row=>row.id===id),accounts=view.accounts.filter(row=>row.accountId==='personal')
 if(terms.length!==1||accounts.length!==1)return null
 const term=terms[0]!
 if(term.state!==null||features.market.researches.some(row=>row.definitionId===id)||term.entitlementId!==copy.entitlementId||!term.explanation.trim()||!Number.isSafeInteger(term.costFen)||term.costFen<0||!Number.isSafeInteger(term.actionPoints)||term.actionPoints<0||!Number.isSafeInteger(term.days)||term.days<=0||preview.upfrontCostFen!==term.costFen||preview.actionPoints!==term.actionPoints||preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen||preview.privateSale||preview.knownAdjustments)return null
 try{if(addDays(view.date,0)!==view.date)return null;return {definitionId:id,title:copy.title,startAt:view.date,completeAt:addDays(view.date,term.days),costFen:preview.upfrontCostFen,points:preview.actionPoints,explanation:term.explanation,effect:copy.effect}}catch{return null}
}

export function ResearchDecisionFacts({value}:{value:ResearchDecision}){
 return <section className="research-decision-facts">
  <p className="command-introduction">个人承担 · {value.title}</p>
  <dl className="command-facts"><div><dt>现在支付</dt><dd>{moneyText(value.costFen)}</dd></div><div><dt>本季行动</dt><dd>{value.points}点</dd></div><div><dt>开始</dt><dd>{value.startAt}</dd></div><div><dt>预计完成</dt><dd>{value.completeAt}</dd></div></dl>
  <p>{value.effect}</p><p className="research-decision-boundary">不揭示未来价格，不代你交易；中断不返还已用的钱和行动。</p>
 </section>
}
export function ResearchDecisionDetails({value}:{value:ResearchDecision}){
 return <section className="research-original-description"><h3>{value.title}</h3><p>{value.explanation}</p><p>由个人承担{moneyText(value.costFen)}与{value.points}点行动，{value.startAt}开始，预计{value.completeAt}完成。</p><p>{value.effect}开始不等于已经完成。</p><p>中断不返还已经使用的钱和行动。研究不会替你提交委托，买卖与费用仍须另行决定。</p>{value.definitionId!=='market-overview'?<p>以上仅为本游戏的模拟资格，不是现实券商或融资权限，也不保证标的可交易或委托成交。</p>:null}</section>
}
