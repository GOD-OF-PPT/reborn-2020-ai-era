/** The declared round arithmetic, shared by original execution and read-only UI.
 * Callers retain their original authority, window, funds and integer checks. */
export interface EquityFollowTerms{
 readonly unitPriceFen:number
 readonly issuedShares:number
 readonly totalSharesBefore:number
 readonly totalSharesAfter:number
}
export function equityFollowTerms(preMoneyFen:number,newMoneyFen:number,totalSharesBefore:number):EquityFollowTerms{
 const unitPriceFen=preMoneyFen/totalSharesBefore,issuedShares=newMoneyFen/unitPriceFen
 return {unitPriceFen,issuedShares,totalSharesBefore,totalSharesAfter:totalSharesBefore+issuedShares}
}
export function equityFollowAllocation(terms:EquityFollowTerms,ownedShares:number,amountFen:number){
 const newShares=amountFen/terms.unitPriceFen
 return {newShares,sharesAfter:ownedShares+newShares,totalSharesAfter:terms.totalSharesAfter}
}
