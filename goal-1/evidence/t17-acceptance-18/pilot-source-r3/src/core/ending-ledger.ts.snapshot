import {applyLedger,createLedger,type LedgerState} from './ledger.ts'
import {parseLedgerOperation} from './record-schemas.ts'
import {requireRule} from './errors.ts'
import type {GameRun} from './run-types.ts'
import type {RecoveryEstimate} from './journey-schema.ts'

export function recoveryAssets(ledger:LedgerState){
 return [
  ...ledger.contracts.map(a=>({assetId:a.id,kind:'contract_receivable' as const,accountId:a.accountId,basisFen:a.receivableFen})),
  ...ledger.marketReceivables.map(a=>({assetId:a.id,kind:'market_receivable' as const,accountId:a.accountId,basisFen:a.remainingFen})),
  ...ledger.privateReceivables.map(a=>({assetId:a.id,kind:'private_receivable' as const,accountId:a.accountId,basisFen:a.remainingFen})),
  ...ledger.supplierPrepayments.map(a=>({assetId:a.id,kind:'supplier_prepayment' as const,accountId:a.accountId,basisFen:a.remainingFen})),
  ...ledger.investments.filter(a=>a.classification==='counterfactual'&&a.subjectAccountId===null).map(a=>({assetId:a.id,kind:'private_asset' as const,accountId:a.accountId,basisFen:a.bookCostFen})),
 ].filter(a=>a.basisFen>0).sort((a,b)=>(a.kind+':'+a.assetId).localeCompare(b.kind+':'+b.assetId))
}

export function assertRecoveryEstimates(ledger:LedgerState,estimates:readonly RecoveryEstimate[]){
 const assets=recoveryAssets(ledger),byKey=new Map(estimates.map(a=>[a.kind+':'+a.assetId,a]))
 requireRule(estimates.length===assets.length&&byKey.size===assets.length,'JOURNEY_ESTIMATES_INCOMPLETE')
 for(const a of assets){const e=byKey.get(a.kind+':'+a.assetId);requireRule(e&&e.basisFen===a.basisFen&&e.estimatedFen>=0&&e.estimatedFen<=a.basisFen,'JOURNEY_ESTIMATE_EXCEEDS_ASSET')}
}

/** Only historical ending cutoffs are replayed; current cutoffs reuse the validated ledger. */
export function endingLedgerPrefixes(run:GameRun,counts:readonly number[]){
 const ledger=run.economy.ledger,result=new Map<number,LedgerState>(),historical=[...new Set(counts)].sort((a,b)=>a-b)
 for(const n of historical){requireRule(Number.isSafeInteger(n)&&n>=0&&n<=ledger.receipts.length,'INVALID_ENDING_LEDGER_BOUNDARY');if(n===ledger.receipts.length)result.set(n,ledger)}
 const needed=historical.filter(n=>n<ledger.receipts.length)
 if(!needed.length)return result
 requireRule(run.origin==='normal','NORMAL_ENDING_REQUIRED')
 let current=createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2020-01-01'),at=0
 for(const target of needed){while(at<target){current=applyLedger(current,parseLedgerOperation(JSON.parse(ledger.receipts[at]!.signature)));at++}result.set(target,current)}
 return result
}
