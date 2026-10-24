import type {GamePanelProps} from './game-types.ts'

export interface DayPerspective{readonly runId:string;readonly revision:number}
const newArrangements=new Set(['WorkQuarter','StartLifeWork','ResearchMarket','PlanStockOrder','PlaceStockOrder','OpenVideoChannel','StartVideoMarketing','StartVideoWork','AcceptVideoCommission','ReworkVideo','NegotiateVideoCommission'])

/** Waiting and resolving a calendar barrier keep Today; a newly saved choice returns to its real object. */
export function dayPerspectiveCurrent(view:GamePanelProps['view'],perspective:DayPerspective|null):boolean{
 return perspective!==null&&perspective.runId===view.runId&&perspective.revision<=view.revision&&view.phase==='playing'
  &&!view.receipts.some(receipt=>receipt.revisionAfter>perspective.revision&&newArrangements.has(receipt.kind))
}
