import type {GamePanelProps} from './game-types.ts'

export interface DayPerspective{readonly runId:string;readonly revision:number}
const newArrangements=new Set(['WorkQuarter','StartLifeWork','ResearchMarket','PlanStockOrder','PlaceStockOrder','OpenVideoChannel','StartVideoMarketing','StartVideoWork','AcceptVideoCommission','ReworkVideo','NegotiateVideoCommission','PublishVideo','OpenCourseStudio','StartCourseOutline','ActivateBusiness','DefineCourse','LicenseCourseMaterials','BuildCourseSample','CreateCourseAudience','PlanCourseCohort','EnrollCourseAudience','StartCourseStage','StartCourseRecovery','RefundCourseLearners','StartCourseRefresh','OpenRelayStation','StartRelayPreparation','ApplyRelaySupply','ReadRelaySupplyDecision','StartRelayAdapter','StartRelayMarketing','SetRelayOffer','SignRelayCustomers','RechargeRelayCustomer','TopUpRelaySupplier','StartRelayServicePeriod','StartRelayAudit','CorrectRelayUsage','CorrectRelayPeriod','CollectRelayDue','CollectRelayReceivable','StopRelayPeriod','StopRelayStation'])

/** Waiting and resolving a calendar barrier keep Today; a newly saved choice returns to its real object. */
export function dayPerspectiveCurrent(view:GamePanelProps['view'],perspective:DayPerspective|null):boolean{
 return perspective!==null&&perspective.runId===view.runId&&perspective.revision<=view.revision&&view.phase==='playing'
  &&!view.receipts.some(receipt=>receipt.revisionAfter>perspective.revision&&newArrangements.has(receipt.kind))
}

/** Today may outlive a saved reply; opening a comparison belongs only to the
 * exact committed view in which the player requested it. */
export function dayChoiceCurrent(view:GamePanelProps['view'],perspective:DayPerspective|null):boolean{
 return perspective!==null&&perspective.revision===view.revision&&dayPerspectiveCurrent(view,perspective)
}
