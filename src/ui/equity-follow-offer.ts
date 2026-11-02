import type {GamePanelProps} from './game-types.ts'
import {equityFollowTerms,equityFollowAllocation} from '../core/equity-follow-quote.ts'
import {dsRatio} from '../core/deepseek-state.ts'

type Projection=NonNullable<GamePanelProps['features']['deepseek']>
export type EquityFollowAgreement=Projection['agreements'][number]
export type EquityFollowOffer=NonNullable<EquityFollowAgreement['followOffer']>
type Input={view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'accounts'>;features:Pick<GamePanelProps['features'],'deepseek'>}
const whole=(n:number)=>Number.isSafeInteger(n)&&n>=0

/** A necessary public right for organizing the scene, never command authority. */
export const equityPaidFollowPrerequisites=(a:Pick<EquityFollowAgreement,'preemptive'|'shares'>)=>a.preemptive&&a.shares>0

/** Published quotation only. It grants no command eligibility or spending. */
export function equityFollowOffer(p:Input,a:EquityFollowAgreement):EquityFollowOffer|null{
 const v=p.features.deepseek,q=a.followOffer
 if(!v||!q||a.followDecision!=='pending'||p.view.date<v.catalog.followAt||p.view.date>a.followDeadline||q.version!==1||q.runId!==p.view.runId||q.sourceRevision!==p.view.revision||q.agreementId!==a.id||q.businessId!==a.businessId||q.accountId!==a.accountId)return null
 if(v.agreements.filter(r=>r.id===a.id).length!==1||v.businesses.filter(b=>b.id===a.businessId&&b.accountId===a.accountId).length!==1||p.view.accounts.filter(r=>r.accountId===a.accountId).length!==1)return null
 const rounds=v.rounds.filter(r=>r.id===q.baseRoundId)
 if(rounds.length!==1||rounds[0]!.totalShares!==q.totalSharesBefore||q.totalSharesBefore!==a.totalShares||q.newMoneyFen!==v.catalog.followNewMoneyFen||![q.preMoneyFen,q.newMoneyFen,q.unitPriceFen,q.issuedShares,q.totalSharesBefore,q.totalSharesAfter,q.maxAmountFen,a.shares].every(whole)||q.unitPriceFen===0||q.totalSharesBefore===0||q.issuedShares===0)return null
 const terms=equityFollowTerms(q.preMoneyFen,q.newMoneyFen,q.totalSharesBefore)
 if(terms.unitPriceFen!==q.unitPriceFen||terms.issuedShares!==q.issuedShares||terms.totalSharesAfter!==q.totalSharesAfter)return null
 const max=Math.floor(dsRatio(q.newMoneyFen,a.shares,q.totalSharesBefore)/q.unitPriceFen)*q.unitPriceFen
 return max===q.maxAmountFen&&max===a.followMaxFen?q:null
}
export function equityFollowPosition(q:EquityFollowOffer,a:EquityFollowAgreement,amountFen:number){
 if(!whole(amountFen)||amountFen>q.maxAmountFen||amountFen%q.unitPriceFen!==0)return null
 const allocation=equityFollowAllocation(q,a.shares,amountFen)
 if(![allocation.newShares,allocation.sharesAfter,allocation.totalSharesAfter].every(whole)||allocation.totalSharesAfter===0)return null
 return {...allocation,holdingBps:dsRatio(10000,allocation.sharesAfter,allocation.totalSharesAfter)}
}
export function equityFollowHalfAmount(q:EquityFollowOffer):number{
 return Math.floor(q.maxAmountFen/q.unitPriceFen/2)*q.unitPriceFen
}
