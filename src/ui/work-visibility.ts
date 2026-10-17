type Period={readonly id:string;readonly status:string}
type RevealedMeter={readonly periodId:string;readonly reportedUnits:number;readonly auditedUnits:number|null;readonly correctionId:string|null}
/** Financial closure cannot archive a discrepancy revealed by a later independent audit. */
export function relayPeriodGroups<P extends Period>(periods:readonly P[],meters:readonly RevealedMeter[]){
 const pendingByPeriod=new Map<string,number>()
 const periodIds=new Set(periods.map(p=>p.id))
 for(const meter of meters)if(periodIds.has(meter.periodId)&&meter.auditedUnits!==null&&meter.auditedUnits!==meter.reportedUnits&&meter.correctionId===null)pendingByPeriod.set(meter.periodId,(pendingByPeriod.get(meter.periodId)??0)+1)
 return {current:periods.filter(p=>p.status!=='closed'||pendingByPeriod.has(p.id)),archive:periods.filter(p=>p.status==='closed'&&!pendingByPeriod.has(p.id)),pendingByPeriod}
}
type ServiceContract={readonly id:string;readonly status:string;readonly balance?:{readonly prepaidFen:number;readonly receivableFen:number}|null}
type ContractObligation={readonly contractId:string|null;readonly remainingFen:number}
export function ecoContractGroups<C extends ServiceContract>(contracts:readonly C[],obligations:readonly ContractObligation[]|null){
 const due=new Set(obligations?.filter(o=>o.remainingFen>0&&o.contractId!==null).map(o=>o.contractId)??[])
 const current=(c:C)=>!['completed','cancelled'].includes(c.status)||!c.balance||obligations===null||c.balance.prepaidFen>0||c.balance.receivableFen>0||due.has(c.id)
 return {current:contracts.filter(current),archive:contracts.filter(c=>!current(c))}
}
