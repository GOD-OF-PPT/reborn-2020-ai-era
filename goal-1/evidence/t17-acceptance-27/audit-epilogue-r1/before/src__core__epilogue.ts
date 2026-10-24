import {hashValue} from './hash.ts'
import {requireRule} from './errors.ts'
import {addDays,monthEnd} from './calendar.ts'
import {quarterLimit} from './operations-calendar.ts'
import {actionBudget} from './economy.ts'
import type {CommandView} from './commands.ts'
import type {RuleModel,GameRun} from './run-types.ts'
import {assertRecoveryEstimates,endingLedgerPrefixes} from './ending-ledger.ts'
import {CAMPAIGN_CONTENT} from '../content/campaign.ts'

type ReviewModel=Pick<RuleModel,'economy'|'world'|'operations'|'market'|'video'|'course'|'relay'|'routines'|'deepseek'|'story'|'life'>&{pending?:CommandView['pending'];timeline?:RuleModel['timeline']}
export function reviewFingerprint(m:ReviewModel){return hashValue({date:m.economy.asOf,economy:m.economy,world:m.world,operations:m.operations,market:m.market,video:m.video,course:m.course,relay:m.relay,routines:m.routines,deepseek:m.deepseek,story:m.story,life:m.life,pending:m.pending??m.timeline?.pending??[]})}
export const fullSnapshot=(cursor:CommandView['cursor'])=>cursor.phase==='snapshot'&&cursor.priority===Number.MAX_SAFE_INTEGER&&cursor.instanceId===''

export function canEnterEpilogue(v:Pick<CommandView,'date'|'phase'|'pause'|'cursor'|'journey'|'origin'>){return v.origin==='normal'&&v.phase==='playing'&&v.date==='2025-12-31'&&v.pause===null&&fullSnapshot(v.cursor)&&v.journey?.quarters.length===24&&v.journey.quarters.every(q=>q.closedAt!==null)}

export const EPILOGUE_KINDS=new Set([
 'AdvanceEpilogueTime','FinishJourney','SetPrivateNote','ReadNews','FavoriteMemory','AcknowledgeCashGap','AcknowledgeStoryPause','CancelAction',
 'PayObligation','FundBusiness','DistributeProfit','SubmitDelivery','CancelContract','WindDownBusiness','CloseBusiness','DismissWorker','InterruptJob','RescheduleJob','QuitWork','DeclineOffer','SkipOffer',
 'InterruptPreparation','DeferEventDecision','ChooseEvent','DeclineLifePromise','FulfillLifePromise','InterruptLifeWork','CancelRoutinePlan','CancelRoutineStep',
 'CancelStockOrder','CancelStockPlan','PlaceStockOrder','ModifyStockOrder',
 'ReviewVideoOutput','ReworkVideo','PublishVideo','SubmitVideoCommission','NegotiateVideoCommission','ExitVideoCommission','CollectVideoSettlement','UnlistVideo','AbandonVideoWork',
 'StartCourseStage','StartCourseRecovery','StartCourseRefresh','RefundCourseLearners','PauseNewEnrollment','StopCourseSales','RetireCourse',
 'StartRelayServicePeriod','TopUpRelaySupplier','ReportRelayUsage','StartRelayAudit','CorrectRelayPeriod','CorrectRelayUsage','CollectRelayReceivable','CollectRelayDue','RefundRelayBalance','RefundRelaySupplier','PauseRelayTraffic','ResumeRelayTraffic','StopRelayStation','StopRelayPeriod','CloseRelayCustomer','AcknowledgeRelayMarket',
 'DeclineEcoLead','SubmitEcoDelivery','StartEcoRemediation','CancelEcoContract','CollectEcoReceivable','StopEcosystemService','RejectEquityInvitation','DeclineEquityTerms','RequestEquityExit','AcceptEquityExit','CollectEquityExit','FollowEquityRound',
 'StopHengxingAuthority','InterruptStoryWork','StartRiskTask','ConfirmRiskAssessment','DeclareRiskLiabilities','ResolveRiskCase','DeclineRiskClaim','PayUnverifiedProcessingFee','ShareRiskFindings',
])

export function guardJourney(v:CommandView,kind:string,raw:unknown){
 if(v.journey===null)return
 if(v.phase==='finished'){requireRule(kind==='ResumeEpilogue'||kind==='SetPrivateNote','RUN_FINISHED');return}
 if(v.phase!=='epilogue')return
 requireRule(EPILOGUE_KINDS.has(kind),'EPILOGUE_OLD_ITEMS_ONLY')
 const p=typeof raw==='object'&&raw!==null?raw as Record<string,unknown>:{}
 if(kind==='ChooseEvent'){const i=v.world?.instances.find(i=>i.id===p.instanceId),d=CAMPAIGN_CONTENT.events.find(d=>d.id===i?.definitionId),c=d?.choices.find(c=>c.id===p.choiceId);requireRule(c&&d?.defaultChoiceId===c.id&&c.actionPoints===0&&c.costFen===0&&c.effects.every(e=>['recordCause','recordEvidence','recordObligation','pauseNewContracts'].includes(e.op)),'EPILOGUE_OLD_ITEMS_ONLY')}
 if(kind==='PlaceStockOrder')requireRule(p.side==='sell','EPILOGUE_NO_NEW_INVESTMENT')
 if(kind==='ModifyStockOrder')requireRule(v.market?.orders.some(o=>o.id===p.orderId&&o.side==='sell'),'EPILOGUE_NO_NEW_INVESTMENT')
 if(kind==='FollowEquityRound')requireRule(p.amountFen===0,'EPILOGUE_NO_NEW_INVESTMENT')
 if(kind==='PublishVideo')requireRule(p.monetization==='none','EPILOGUE_NO_NEW_MONETIZATION')
 if(typeof p.startAt==='string')requireRule(p.startAt===v.date,'EPILOGUE_WORK_STARTS_TODAY')
}

/** Only old deadlines, assets and actual intervening costs can move the closing clock. */
export function nextTailDate(v:Pick<CommandView,'date'|'cursor'|'pending'|'economy'|'operations'|'deepseek'|'video'|'relay'|'phase'>){
 if(v.phase!=='epilogue')return null
 if(!fullSnapshot(v.cursor))return v.date
 const dates=v.pending.filter(e=>!e.instanceId.startsWith('tail:living:')&&!(e.payload.kind==='operating_event'&&['salary','wage','maintenance'].includes(e.payload.type))).map(e=>e.date)
 dates.push(...v.economy.ledger.obligations.filter(o=>o.remainingFen>0&&o.date>v.date).map(o=>o.date),...v.economy.ledger.privateReceivables.filter(r=>r.remainingFen>0&&r.dueAt>v.date).map(r=>r.dueAt),...v.economy.ledger.marketReceivables.filter(r=>r.remainingFen>0&&r.dueAt>v.date).map(r=>r.dueAt),...v.deepseek?.agreements.filter(a=>a.shares>0&&a.transferConsent&&a.lockUntil>v.date).map(a=>a.lockUntil)??[])
 dates.push(...v.video?.settlements.filter(s=>s.collectedAt===null&&s.dueAt>v.date).map(s=>s.dueAt)??[],...v.relay?.receivables.filter(r=>r.amountFen>r.collectedFen+r.reversedFen&&r.dueAt>v.date).map(r=>r.dueAt)??[])
 for(const exit of v.deepseek?.exits??[]){const a=v.deepseek!.agreements.find(a=>a.id===exit.agreementId);if(!a||a.shares<=0||!a.transferConsent||exit.responseAt===null)continue;if(exit.operationId===null&&exit.expiresAt>v.date)dates.push(exit.expiresAt);const retry=quarterLimit(exit.createdAt);if(retry>v.date&&actionBudget(v.economy,v.date).available>=1)dates.push(retry)}
 const old=dates.filter(d=>d>=v.date).sort()[0];if(!old)return null
 const nextLiving=addDays(monthEnd(v.date),1),monthEndCost=monthEnd(v.date)
 const payroll=v.operations?.workers.some(w=>w.to===null&&w.monthlyWageFen>0)||v.operations?.businesses.some(b=>b.activeFrom!==null&&b.stoppedAt===null&&b.monthlyMaintenanceFen>0)
 return [old,nextLiving,...(payroll&&monthEndCost>v.date?[monthEndCost]:[])].sort()[0]!
}

export function assertJourneyTransitions(run:GameRun){
 const s=run.journey;requireRule(s,'JOURNEY_REQUIRED')
 const entries=run.receipts.filter(r=>r.kind==='EnterEpilogue')
 if(s.epilogue===null){requireRule(entries.length===0&&s.endings.length===0&&s.resumes.length===0&&run.phase==='playing'&&run.economy.tailQuarterLock===undefined,'JOURNEY_PHASE_SOURCE_MISMATCH');return}
 const entry=entries[0],e=s.epilogue,closed=run.causes.find(c=>c.sourceEventId==='journey:close:2025-Q4'),clock=run.receipts.find(r=>r.commandId===closed?.commandId)
 requireRule(run.origin==='normal'&&entries.length===1&&entry?.commandId===e.commandId&&entry.date==='2025-12-31'&&e.date===entry.date&&e.sourceRevision===entry.revisionBefore&&s.quarters.every(q=>q.closedAt!==null)&&s.quarters.length===24&&clock&&clock.revisionAfter<=e.sourceRevision&&run.economy.tailQuarterLock==='2025-Q4','EPILOGUE_ENTRY_SOURCE_MISMATCH')
 const payload=JSON.parse(entry.payloadSignature).payload;requireRule(payload.consent===true&&payload.reviewHash===e.reviewHash,'EPILOGUE_ENTRY_NOT_CONFIRMED')
 const endings=new Map(s.endings.map(r=>[r.commandId,r])),resumes=new Map(s.resumes.map(r=>[r.commandId,r]));requireRule(endings.size===s.endings.length&&resumes.size===s.resumes.length,'DUPLICATE_JOURNEY_ARCHIVE')
 const prefixes=endingLedgerPrefixes(run,s.endings.map(r=>r.ledgerReceiptCount));let phase:'epilogue'|'finished'='epilogue',lastEnding='',endingCount=0,resumeCount=0
 for(const r of run.receipts.filter(r=>r.revisionBefore>e.sourceRevision)){
  const p=JSON.parse(r.payloadSignature).payload
  if(r.kind==='ResumeEpilogue'){
   const resume=resumes.get(r.commandId);requireRule(phase==='finished'&&p.consent===true&&p.endingCommandId===lastEnding&&resume&&resume.date===r.date&&resume.sourceRevision===r.revisionBefore&&resume.endingCommandId===lastEnding,'JOURNEY_RESUME_SOURCE_MISMATCH');phase='epilogue';resumeCount++;continue
  }
  if(phase==='finished'){requireRule(r.kind==='SetPrivateNote','COMMAND_AFTER_ENDING_WITHOUT_RESUME');continue}
  guardJourney({...run,date:r.date,cursor:run.timeline.cursor,pending:run.timeline.pending,pause:run.timeline.pause,phase:'epilogue',evidence:[]} ,r.kind,p)
  if(r.kind==='AdvanceEpilogueTime')requireRule(p.date===r.date,'EPILOGUE_CLOCK_SOURCE_MISMATCH')
  if(r.kind==='FinishJourney'){
   const end=endings.get(r.commandId),previous=run.receipts[r.revisionBefore-1]
   requireRule(end&&p.consent===true&&end.date===r.date&&end.sourceRevision===r.revisionBefore&&end.reviewHash===p.reviewHash&&hashValue(end.estimates)===hashValue(p.estimates)&&end.ledgerReceiptCount===previous?.ledgerReceiptCountAfter,'JOURNEY_ENDING_SOURCE_MISMATCH')
   const ledger=prefixes.get(end.ledgerReceiptCount);requireRule(ledger,'ENDING_LEDGER_PREFIX_MISSING');assertRecoveryEstimates(ledger,end.estimates)
   lastEnding=end.commandId;endingCount++;phase='finished'
  }
 }
 requireRule(endingCount===s.endings.length&&resumeCount===s.resumes.length&&run.phase===phase,'JOURNEY_PHASE_SOURCE_MISMATCH')
 if(phase==='finished')requireRule(s.endings.at(-1)?.reviewHash===reviewFingerprint(run),'FINISHED_JOURNEY_STATE_REWRITTEN')
}
