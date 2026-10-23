import {OPERATIONS_CONTENT} from '../content/operations.ts'
import {tailBillingEvents} from './tail-billing.ts'
import {operatingAccruals} from './operations-accrual.ts'
import type {RuleModel} from './run-types.ts'

/** Known original terms only. No clock simulation, random draw or unknown customer income. */
export function tailCostPreview(m:RuleModel,target:string|null){
 if(target===null)return null
 const posted=new Set(m.economy.ledger.receipts.map(r=>r.id))
 const living=tailBillingEvents(m,target).flatMap(e=>e.payload.kind==='due_expense'&&!posted.has(e.payload.id)?[{accountId:e.payload.accountId,date:e.date,amountFen:e.payload.amountFen}]:[])
 const scheduled=m.economy.actions.filter(a=>a.status==='reserved'&&a.definition.startAt>=m.economy.asOf&&a.definition.startAt<=target).map(a=>({actionId:a.definition.id,accountId:a.definition.accountId,date:a.definition.startAt,costFen:a.definition.costFen,actionPoints:a.definition.actionPoints}))
 const loans=m.timeline.pending.filter(e=>e.date<=target&&e.payload.kind==='operating_event'&&e.payload.type==='loan_due').flatMap(e=>{const p=e.payload;if(p.kind!=='operating_event')return [];const loan=m.operations?.loans.find(l=>l.id===p.entityId);if(!loan)return [];const terms=OPERATIONS_CONTENT.loans.find(l=>l.id===loan.offerId);return [{accountId:loan.accountId,date:e.date,principalFen:m.economy.ledger.obligations.find(o=>o.id===loan.principalObligationId)?.remainingFen??0,feeFen:terms?.feeFen??null}]})
 return {target,living,scheduled,loans,accruedAtTarget:operatingAccruals(m,target).filter(a=>a.amountFen>0)}
}
