import {addDays} from '../core/calendar.ts'
import {equityHistoryCommands} from './equity-public-history.ts'
import type {EquityFollowAgreement} from './equity-follow-offer.ts'
import type {GamePanelProps} from './game-types.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export type EquityFollowHistory={readonly state:'pending'|'before'|'participated'|'declined'|'defaulted'|'unknown';readonly date:string|null;readonly amountFen:number|null;readonly reason:string|null}
const unknown=():EquityFollowHistory=>({state:'unknown',date:null,amountFen:null,reason:'这轮原记录暂时无法核实，请翻原条款。'})
const validDate=(value:string|null):value is string=>{try{return value!==null&&addDays(value,0)===value}catch{return false}}

/** Read already committed public records. This never grants command authority. */
export function equityFollowHistory(p:Input,a:EquityFollowAgreement):EquityFollowHistory{
 const v=p.features.deepseek,published=p.features.sceneCommands
 if(!v||!published||published.version!==1||published.runId!==p.view.runId||published.committedRevision!==p.view.revision||v.agreements.filter(row=>row.id===a.id).length!==1||v.businesses.filter(b=>b.id===a.businessId&&b.accountId===a.accountId).length!==1||p.view.accounts.filter(row=>row.accountId===a.accountId).length!==1)return unknown()
 if(a.followDecision==='pending')return {state:'pending',date:null,amountFen:null,reason:null}
 if(a.followDecision===null)return a.followAt===null&&a.followAmountFen===0&&!v.rounds.some(r=>r.agreementId===a.id&&r.date>=v.catalog.followAt)?{state:'before',date:null,amountFen:null,reason:null}:unknown()
 if(!['participated','declined','defaulted'].includes(a.followDecision)||!validDate(a.followAt)||a.followAt>p.view.date||!Number.isSafeInteger(a.followAmountFen)||a.followAmountFen<0||a.followDecision==='participated'&&a.followAmountFen===0||a.followDecision!=='participated'&&a.followAmountFen!==0)return unknown()
 const rounds=v.rounds.filter(r=>r.agreementId===a.id&&r.kind==='new_capital'&&r.date===a.followAt&&r.date>=v.catalog.followAt)
 if(rounds.length!==1||rounds[0]!.playerMoneyFen!==a.followAmountFen)return unknown()
 if(a.followDecision==='defaulted'){
  // Automatic expiry has a published round, not a player Follow command.
  if(a.followAt!==a.followDeadline)return unknown()
 }else{
  const commands=equityHistoryCommands({runId:p.view.runId,date:p.view.date,source:{revision:p.view.revision,receipts:p.view.receipts},sceneCommands:published},'FollowEquityRound','agreementId',a.id,rounds[0]!.id)
  if(commands.length!==1||commands[0]!.date!==a.followAt)return unknown()
 }
 return {state:a.followDecision,date:a.followAt,amountFen:a.followAmountFen,reason:null}
}
