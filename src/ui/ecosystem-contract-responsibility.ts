import type {GamePanelProps} from './game-types.ts'
type Contract=NonNullable<GamePanelProps['features']['deepseek']>['contracts'][number]
type Finance=GamePanelProps['features']['workbench']['finance']
/** Only this original contract. Other-account risks and business payroll remain
 * in the global scene/ledger; a receivable is not an unfulfilled service. */
export function ecosystemContractResponsibility(c:Contract,finance:Finance|undefined){
 const accounts=finance?.filter(f=>f.accountId===c.balance?.accountId)??[],rows=accounts.length===1?accounts[0]!.obligations.filter(o=>o.businessId===c.businessId&&o.contractId===c.id):[]
 const protectedFen=c.balance?.prepaidFen,known=accounts.length===1&&Number.isSafeInteger(protectedFen)&&protectedFen!==undefined&&protectedFen>=0&&new Set(rows.map(o=>o.id)).size===rows.length&&rows.every(o=>Number.isSafeInteger(o.remainingFen)&&o.remainingFen>=0)
 const total=rows.reduce((n,o)=>n+o.remainingFen,0),payableFen=known&&Number.isSafeInteger(total)?total:null,unfinished=!['completed','cancelled'].includes(c.status)
 return {known:known&&payableFen!==null,payableFen,unfinished,hasResponsibility:unfinished||!known||payableFen===null||(protectedFen??0)>0||(payableFen??0)>0}
}
