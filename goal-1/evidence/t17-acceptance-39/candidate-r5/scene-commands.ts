import type {GameRun} from '../core/run-types.ts'

/** Only committed object identifiers cross this boundary, never the original payload. */
const fields:Readonly<Record<string,readonly string[]>>={
 OpenEcosystemService:[],StartEcosystemPreparation:['businessId'],StartEcosystemAdaptation:['businessId'],StartEcoOutreach:['businessId'],AcceptEcoContract:['leadId'],SubmitEcoDelivery:['contractId'],StartEcoRemediation:['contractId'],CancelEcoContract:['contractId'],CollectEcoReceivable:['deliveryId'],DeclineEcoLead:['leadId'],StopEcosystemService:['businessId'],
 OpenRelayStation:[],StartRelayPreparation:['businessId'],ApplyRelaySupply:['businessId'],ReadRelaySupplyDecision:['applicationId'],StartRelayAdapter:['businessId'],StartRelayMarketing:['businessId'],SignRelayCustomers:['businessId'],SetRelayOffer:['businessId'],StartRelayRequote:['businessId'],StartRelayServicePeriod:['businessId'],StartRelayAudit:['businessId','periodId','meterId'],CorrectRelayUsage:['auditId'],CorrectRelayPeriod:['periodId','meterId'],StopRelayPeriod:['periodId'],CollectRelayDue:['customerId'],CollectRelayReceivable:['receivableId'],RechargeRelayCustomer:['customerId'],RefundRelayBalance:['customerId'],CloseRelayCustomer:['customerId'],RenewRelayCustomer:['customerId'],PauseRelayTraffic:['businessId'],ResumeRelayTraffic:['businessId'],StopRelayStation:['businessId'],
 OpenCourseStudio:[],StartCourseOutline:['businessId'],LicenseCourseMaterials:['businessId'],DefineCourse:['businessId'],BuildCourseSample:['courseId'],CreateCourseAudience:['courseId'],PlanCourseCohort:['courseId','audienceId'],EnrollCourseAudience:['cohortId'],StartCourseStage:['cohortId'],StartCourseRecovery:['cohortId'],RefundCourseLearners:['cohortId'],StartCourseRefresh:['courseId'],StudyAdvancedCourseDemand:['courseId'],PauseNewEnrollment:['courseId'],ResumeCourseEnrollment:['courseId'],StopCourseSales:['courseId'],RetireCourse:['courseId'],
 OpenVideoChannel:['businessId'],StartVideoWork:['channelId'],StartVideoMarketing:['channelId'],AcceptVideoCommission:['channelId','clientId','cohortId'],ReviewVideoOutput:['workId'],ReworkVideo:['workId'],PublishVideo:['workId'],AbandonVideoWork:['workId'],SubmitVideoCommission:['contractId'],NegotiateVideoCommission:['contractId'],ExitVideoCommission:['contractId'],CollectVideoSettlement:['settlementId'],UnlistVideo:['publicationId'],
 InterruptJob:['jobId'],RescheduleJob:['jobId'],FundBusiness:['businessId'],ActivateBusiness:['businessId'],PauseBusiness:['businessId'],ResumeBusiness:['businessId'],WindDownBusiness:['businessId'],CloseBusiness:['businessId'],
}
export interface SceneCommand {
 readonly commandId:string
 readonly kind:string
 readonly date:string
 readonly revisionAfter:number
 readonly identifiers:Readonly<Record<string,string>>
}
export interface SceneCommands {readonly version:1;readonly runId:string;readonly committedRevision:number;readonly commands:readonly SceneCommand[]}
const identifier=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=512&&v.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(v)

/** Read only the durable record supplied by the caller. No runtime, queue or preview is used. */
export function projectSceneCommands(run:Pick<GameRun,'runId'|'revision'|'receipts'>):SceneCommands{
 const commands:SceneCommand[]=[]
 for(const receipt of run.receipts){
  if(receipt.runId!==run.runId||!Number.isSafeInteger(receipt.revisionAfter)||receipt.revisionAfter<1||receipt.revisionAfter>run.revision||!Object.hasOwn(fields,receipt.kind))continue
  let parsed:unknown
  try{parsed=JSON.parse(receipt.payloadSignature)}catch{continue}
  if(parsed===null||typeof parsed!=='object'||Array.isArray(parsed))continue
  const body=parsed as Record<string,unknown>
  // The signature is the original command envelope. A mismatched source stays unknown.
  if(body.kind!==receipt.kind||body.runId!==run.runId||body.actorId!==receipt.actorId||body.payload===null||typeof body.payload!=='object'||Array.isArray(body.payload))continue
  const payload=body.payload as Record<string,unknown>,identifiers:Record<string,string>={}
  for(const key of fields[receipt.kind]!)if(identifier(payload[key]))identifiers[key]=payload[key]
  commands.push({commandId:receipt.commandId,kind:receipt.kind,date:receipt.date,revisionAfter:receipt.revisionAfter,identifiers})
 }
 return {version:1,runId:run.runId,committedRevision:run.revision,commands}
}
