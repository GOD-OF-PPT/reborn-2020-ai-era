import {z} from 'zod'
import {defineCommand} from '../core/commands.ts'
import {dateSchema,commandIdSchema} from '../core/record-schemas.ts'
import {requireRule} from '../core/errors.ts'
import {queueEvent} from '../core/timeline.ts'
import {canEnterEpilogue,nextTailDate,reviewFingerprint,fullSnapshot} from '../core/epilogue.ts'
import {tailBillingEvents} from '../core/tail-billing.ts'
import {assertRecoveryEstimates} from '../core/ending-ledger.ts'
import {recoveryEstimateSchema} from '../core/journey-schema.ts'
import type {WorldRuntime} from '../core/world.ts'

const allowed=()=>({allowed:true,reasonCodes:[] as readonly string[],actionPoints:0,upfrontCostFen:0,releasedFen:0})
export function createJourneyHandlers(runtime:WorldRuntime){return [
 defineCommand('EnterEpilogue',z.strictObject({consent:z.literal(true),reviewHash:z.string().regex(/^[0-9a-f]{64}$/)}),(v,p)=>{requireRule(v.origin==='normal'&&canEnterEpilogue(v),'EPILOGUE_REQUIRES_COMPLETED_CAMPAIGN');requireRule(reviewFingerprint(v)===p.reviewHash,'JOURNEY_REVIEW_CHANGED');return allowed()},(m,p,c)=>{requireRule(m.journey,'JOURNEY_REQUIRED');return {model:{...m,phase:'epilogue',economy:{...m.economy,tailQuarterLock:'2025-Q4'},journey:{...m.journey,epilogue:{commandId:c.commandId,date:c.date,sourceRevision:c.revision,reviewHash:p.reviewHash}}},summary:'正常篇已结束。原预算、资产与旧义务进入有限尾声，没有清债或发放行动。',domain:'journey'}}),
 defineCommand('AdvanceEpilogueTime',z.strictObject({date:dateSchema}),(v,p)=>{requireRule(v.phase==='epilogue'&&v.pause===null,'EPILOGUE_NOT_READY');requireRule(nextTailDate(v)===p.date,'EPILOGUE_CLOCK_OLD_ITEMS_ONLY');return allowed()},(m,p)=>{let timeline=m.timeline;for(const e of tailBillingEvents(m,p.date))timeline=queueEvent(timeline,e);const next=runtime.advance({...m,timeline},{date:p.date});requireRule(next.timeline.cursor.date===p.date,'EPILOGUE_CLOCK_SOURCE_MISMATCH');return {model:next,summary:'按原事项和实际费用推进收尾。没有新季度工资、行动或时代机会。',domain:'journey'}}),
 defineCommand('FinishJourney',z.strictObject({consent:z.literal(true),reviewHash:z.string().regex(/^[0-9a-f]{64}$/),estimates:z.array(recoveryEstimateSchema).max(100000)}),(v,p)=>{requireRule(v.origin==='normal'&&v.journey?.epilogue!==null&&v.journey!==null&&v.phase==='epilogue'&&v.pause===null&&fullSnapshot(v.cursor),'JOURNEY_FINISH_NOT_READY');requireRule(reviewFingerprint(v)===p.reviewHash,'JOURNEY_REVIEW_CHANGED');assertRecoveryEstimates(v.economy.ledger,p.estimates);return allowed()},(m,p,c)=>{requireRule(m.journey,'JOURNEY_REQUIRED');return {model:{...m,phase:'finished',journey:{...m.journey,endings:[...m.journey.endings,{commandId:c.commandId,date:c.date,sourceRevision:c.revision,ledgerReceiptCount:m.economy.ledger.receipts.length,reviewHash:p.reviewHash,estimates:p.estimates}]}},summary:'这段人生已按当前事实归档。原资产、未结责任与估值假设保留，没有增加现金或清除债务。',domain:'journey'}}),
 defineCommand('ResumeEpilogue',z.strictObject({consent:z.literal(true),endingCommandId:commandIdSchema}),(v,p)=>{requireRule(v.phase==='finished'&&v.journey?.endings.at(-1)?.commandId===p.endingCommandId,'JOURNEY_RESUME_NOT_READY');return allowed()},(m,p,c)=>{requireRule(m.journey,'JOURNEY_REQUIRED');return {model:{...m,phase:'epilogue',journey:{...m.journey,resumes:[...m.journey.resumes,{commandId:c.commandId,date:c.date,sourceRevision:c.revision,endingCommandId:p.endingCommandId}]}},summary:'继续处理原事项，前次归档保留。没有新季度预算、收入或时代机会。',domain:'journey'}}),
 ]}
