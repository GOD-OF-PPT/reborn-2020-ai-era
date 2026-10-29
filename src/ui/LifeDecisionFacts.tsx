import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export interface LifeDecision{readonly kind:'rest'|'workspace';readonly title:string;readonly startAt:string;readonly completeAt:string;readonly costFen:number;readonly points:number}
/** Only the original captured, ordinary personal arrangement is summarized.
 * People, references, promises and uncertain sources keep their full details. */
export function captureLifeDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures):LifeDecision|null{
 if(command.kind!=='StartLifeWork'||!preview.allowed||command.runId!==view.runId||command.expectedRevision!==view.revision||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved')return null
 const p=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null
 if(!p||p.kind!=='rest'&&p.kind!=='workspace'||p.personId!==null||p.reference!==null)return null
 const life=features.life,term=life?.work[p.kind],accounts=view.accounts.filter(a=>a.accountId==='personal')
 if(!term||accounts.length!==1||!Number.isSafeInteger(life.personalAvailableFen)||life.personalAvailableFen<0||accounts[0]!.availableFen!==life.personalAvailableFen||!Number.isSafeInteger(term.costFen)||term.costFen<0||!Number.isSafeInteger(term.points)||term.points<0||!Number.isSafeInteger(term.days)||term.days<=0||preview.upfrontCostFen!==term.costFen||preview.actionPoints!==term.points||preview.actionDate!==undefined&&preview.actionDate!==view.date)return null
 try{return {kind:p.kind,title:term.title,startAt:view.date,completeAt:addDays(view.date,term.days),costFen:preview.upfrontCostFen,points:preview.actionPoints}}catch{return null}
}
export function LifeDecisionFacts({value}:{value:LifeDecision}){
 return <section className="life-decision-facts"><p className="command-introduction">自己承担 · {value.title}</p><dl className="command-facts"><div><dt>现在支付</dt><dd>{moneyText(value.costFen)}</dd></div><div><dt>这季行动</dt><dd>{value.points}点</dd></div><div><dt>开始</dt><dd>{value.startAt}</dd></div><div><dt>最早完成</dt><dd>{value.completeAt}</dd></div></dl><p>{value.kind==='rest'?'休整完成后才记结果，行动不返还。':'实际完成后才改善住处，行动不返还。'}</p></section>
}
