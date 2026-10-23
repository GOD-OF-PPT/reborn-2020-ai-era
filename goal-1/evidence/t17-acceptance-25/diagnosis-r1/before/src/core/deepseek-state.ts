import {requireRule} from './errors.ts'
import {hashValue} from './hash.ts'
import {freezeFact,revealFact} from './facts.ts'
import {applyEconomy,type EconomyOperation} from './economy.ts'
import {queueEvent,type ScheduledEvent} from './timeline.ts'
import type {DeepseekState,DeepseekEvent,DeepseekContext} from './deepseek-schema.ts'
import type {OperatingModel} from './operations-types.ts'
import type {RuleModel} from './run-types.ts'
import type {RunOperation} from './content-types.ts'
export const deepseekId=(...parts:string[])=>`dsk:${hashValue(parts).slice(0,32)}`
export const dsState=(m:{readonly deepseek?:DeepseekState|null})=>{requireRule(m.deepseek,'DEEPSEEK_NOT_CONFIGURED');return m.deepseek}
export function dsPatch<T extends OperatingModel>(m:T,fields:Partial<DeepseekState>):T{return {...m,deepseek:{...dsState(m),...fields}}}
export function dsLog<T extends OperatingModel>(m:T,id:string,date:string,sourceEventId:string,text:string):T{requireRule(m.operations,'OPERATIONS_REQUIRED');return {...m,operations:{...m.operations,logs:[...m.operations.logs,{id,date,sourceEventId,text,parentIds:[],visibility:'visible'}]}}}
export function dsPost<T extends OperatingModel>(m:T,op:EconomyOperation):T{return dsLog({...m,economy:applyEconomy(m.economy,op)},op.id,op.date,op.sourceEventId,`生态/架空投资账目：${op.kind}`)}
export function dsFact<T extends OperatingModel>(m:T,id:string,date:string,sourceEventId:string):T{return {...m,...freezeFact(m,{id,domain:'opportunity',date,sourceEventId})}}
export function dsReveal<T extends OperatingModel>(m:T,id:string,evidence:string):T{return {...m,...revealFact(m,id,evidence)}}
export const dsPass=(m:Pick<RuleModel,'facts'>,id:string,bps:number)=>{const f=m.facts.find(f=>f.id===id);requireRule(f,'DEEPSEEK_FACT_MISSING');return BigInt(f.roll)*10000n<BigInt(bps)*4294967296n}
export const dsNumber=(x:unknown)=>{requireRule(typeof x==='number'&&Number.isSafeInteger(x),'INVALID_DEEPSEEK_PAYLOAD');return x}
export const dsString=(x:unknown)=>{requireRule(typeof x==='string','INVALID_DEEPSEEK_PAYLOAD');return x}
export const dsIds=(x:unknown)=>{requireRule(Array.isArray(x)&&x.every(x=>typeof x==='string'),'INVALID_DEEPSEEK_PAYLOAD');return x as string[]}
export const dsAllowed=()=>({allowed:true,reasonCodes:[] as readonly string[],actionPoints:0,upfrontCostFen:0,releasedFen:0})
export const dsDone=(m:DeepseekContext,id:string)=>m.operations?.jobs.some(j=>j.id===id&&j.status==='completed')??false
export function dsEvent(type:DeepseekEvent['type'],entityId:string,date:string):ScheduledEvent<RunOperation>{return {instanceId:deepseekId(type,entityId,date),date,phase:'player_actions',priority:type==='eco_review'?50:450,payload:{kind:'deepseek_event',type,entityId,date}}}
export const dsQueue=(m:RuleModel,event:ScheduledEvent<RunOperation>):RuleModel=>({...m,timeline:queueEvent(m.timeline,event)})
export function hasPaidEcoCase(m:DeepseekContext){const s=dsState(m);return s.contracts.some(c=>c.status==='completed'&&s.deliveries.filter(d=>d.contractId===c.id).every(d=>s.collections.filter(p=>p.deliveryId===d.id).reduce((n,p)=>n+p.amountFen,0)===d.creditFen))}
export function dsRatio(amount:number,numerator:number,denominator:number){requireRule(Number.isSafeInteger(amount)&&amount>=0&&Number.isSafeInteger(numerator)&&numerator>=0&&Number.isSafeInteger(denominator)&&denominator>0,'INVALID_EQUITY_RATIO');const value=(BigInt(amount)*BigInt(numerator)+BigInt(denominator)/2n)/BigInt(denominator);requireRule(value<=9000000000000n,'MONEY_OUT_OF_RANGE');return Number(value)}
