import {isoDate} from '../core/calendar.ts'
import {equityHistoryCommands,type EquityHistorySource} from './equity-public-history.ts'
import type {GamePanelProps} from './game-types.ts'

type Exit=NonNullable<GamePanelProps['features']['deepseek']>['exits'][number]
type Context=EquityHistorySource&{readonly finance:GamePanelProps['features']['workbench']['finance']}
export interface EquityExitCash{
 readonly complete:boolean
 readonly verifiedFen:number|null
 readonly lastVerifiedDate:string|null
 readonly rows:readonly {readonly operationId:string;readonly date:string;readonly amountFen:number}[]
 readonly reason:string|null
}
const validDate=(value:string)=>{try{isoDate(value);return true}catch{return false}}

/** Verify only this exit's original public cash references. Missing one side
 * does not erase another verified payment or invent a historical balance. */
export function equityExitCash(exit:Exit,accountId:string,context:Context):EquityExitCash{
 const unknown=(reason:string):EquityExitCash=>({complete:false,verifiedFen:null,lastVerifiedDate:null,rows:[],reason})
 if(!Number.isSafeInteger(exit.collectedFen)||exit.collectedFen<0)return unknown('原款收取金额仍待核对。')
 if(exit.collectedFen===0&&exit.collectionOperationIds.length===0)return{complete:true,verifiedFen:0,lastVerifiedDate:null,rows:[],reason:null}
 if(!exit.receivable||!validDate(exit.receivable.dueAt))return unknown('本笔原款到期来源仍待核对。')
 const accounts=context.finance.filter(f=>f.accountId===accountId)
 if(accounts.length!==1)return unknown('本笔原账户的现金来源仍待核对。')
 const ids=[...new Set(exit.collectionOperationIds)],rows:EquityExitCash['rows'][number][]=[]
 for(const id of ids){
  const tx=accounts[0]!.transactions.filter(t=>t.id===id),commands=equityHistoryCommands(context,'CollectEquityExit','exitId',exit.id,id)
  if(tx.length!==1||commands.length!==1)continue
  const t=tx[0]!,c=commands[0]!
  if(t.sourceId!==exit.id||!Number.isSafeInteger(t.amountFen)||t.amountFen<=0||!validDate(t.date)||t.date!==c.date||t.date<exit.receivable.dueAt||t.date>context.date)continue
  rows.push({operationId:id,date:t.date,amountFen:t.amountFen})
 }
 const total=rows.reduce((sum,t)=>sum+t.amountFen,0)
 if(!Number.isSafeInteger(total)||total>exit.collectedFen)return unknown('原款记录与现金来源金额不一致，不能按另一笔或零金额代替。')
 const complete=ids.length===exit.collectionOperationIds.length&&rows.length===ids.length&&ids.length>0&&total===exit.collectedFen
 return{complete,verifiedFen:rows.length?total:null,lastVerifiedDate:rows.length?rows.map(r=>r.date).sort().at(-1)!:null,rows,reason:complete?null:'本笔部分收取记录的现金或原命令来源仍待核对。'}
}
