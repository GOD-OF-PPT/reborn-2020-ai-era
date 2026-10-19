import {z} from 'zod'
import {idSchema,dateSchema,moneySchema} from './record-schemas.ts'
import {requireRule} from './errors.ts'
const id=idSchema,date=dateSchema,money=moneySchema,ids=z.array(id).max(5000),rows=<T extends z.ZodType>(schema:T)=>z.array(schema).max(10000)
export const STORY_JOB_KINDS=['pilot','continuity','participation','deployment','records','drill','investigate','isolate','observe','recover','takeover'] as const
export const storyJobKind=z.enum(STORY_JOB_KINDS)
export const storyAuthority=z.enum(['approval','limited','cross_flow'])
export const storySupportScope=z.enum(['course_support','relay_support','external_service_commitments'])
export const storyStage=z.enum(['normal','signal','investigating','confirmed','containing','recovering','resolved','residual','takeover','unresolved'])
const log=z.strictObject({id,date,sourceEventId:id,text:z.string().max(1000),visibility:z.enum(['visible','hidden']),parentIds:ids})
const job=z.strictObject({id,kind:storyJobKind,entityId:id,businessId:id.nullable(),accountId:id,resourceId:id,originCommandId:id,actionId:id,startAt:date,completeAt:date,costFen:money,actionPoints:z.number().int().min(1).max(4),status:z.enum(['running','completed','interrupted']),releasedAt:date.nullable(),result:z.enum(['agreed','declined','normal','ordinary','violation','fraud','legitimate','verified','replacement_ready']).nullable()})
const grant=z.strictObject({id,deploymentId:id,businessId:id,createdAt:date,expiresAt:date,level:storyAuthority,scopes:z.array(storySupportScope).min(1).max(3),cashLimitFen:money,externalDelegation:z.boolean(),sourceCommandId:id,revokedAt:date.nullable()})
const deployment=z.strictObject({id,businessId:id,accountId:id,createdAt:date,expiresAt:date,setupJobId:id,setupCostFen:money,initialCashLimitFen:money,factId:id,activeFrom:date.nullable(),stoppedAt:date.nullable(),lifecycle:z.enum(['preparing','active','stopped','taken_over']),monthlyFeeFen:money,recordsJobId:id.nullable(),drillJobId:id.nullable(),backupResourceId:id.nullable()})
const signal=z.strictObject({id,date,deploymentId:id.nullable(),sourceEventId:id,source:z.enum(['system_report','independent_statement','external_notice']),text:z.string().max(1000)})
const evidence=z.strictObject({id,incidentId:id,jobId:id.nullable(),sourceEventId:id,date,deploymentId:id.nullable(),kind:z.enum(['no_breach','ordinary_failure','boundary_trace','revocation_test','observation','replacement','identity']),text:z.string().max(1500)})
const liabilities=z.strictObject({date,sourceCommandId:id,contractIds:ids,obligationIds:ids,jobIds:ids})
const incident=z.strictObject({id,kind:z.enum(['agent','external_claim']),sourceEventId:id,openedAt:date,deadline:date,businessIds:ids,deploymentIds:ids,contractIds:ids,factId:id.nullable(),stage:storyStage,verdict:z.enum(['unknown','normal','ordinary','violation','fraud','legitimate']),signals:rows(signal),investigationJobId:id.nullable(),isolationJobId:id.nullable(),observationJobId:id.nullable(),replacementJobId:id.nullable(),takeoverJobId:id.nullable(),externalVerifiedAt:date.nullable(),liabilities:liabilities.nullable(),resolvedAt:date.nullable(),claimFeeOperationId:id.nullable(),declinedAt:date.nullable()})
export const storyStateSchema=z.strictObject({
 catalogVersion:id,catalogHash:z.string().regex(/^[0-9a-f]{64}$/),riskMode:z.literal('local_standard'),
 linzhou:z.strictObject({opportunityAt:date.nullable(),factId:id.nullable(),pilotJobId:id.nullable(),continuityJobId:id.nullable(),participationJobId:id.nullable(),willingness:z.enum(['unknown','agreed','declined']),publicationChoice:z.enum(['open','closed']).nullable(),choiceAt:date.nullable(),branch:z.enum(['pending','open','closed']),publishedAt:date.nullable(),publicationSourceId:id.nullable()}),
 links:rows(z.strictObject({id,memoryId:id,preparationKey:id,createdAt:date,sourceCommandId:id})),
 readiness:rows(z.strictObject({id,anchorId:id,worldCauseId:id,memoryId:id,preparationKey:id,sourceId:id,linkId:id,date})),
 impacts:rows(z.strictObject({id,anchorId:id,worldCauseId:id,date,routes:z.array(z.enum(['a_share','ai_course','api_relay'])).length(3),courseIds:ids,relayBusinessIds:ids})),
 deployments:rows(deployment),grants:rows(grant),externalDelegations:rows(z.strictObject({id,deploymentId:id,grantId:id,createdAt:date,expiresAt:date,stopRequestedAt:date.nullable(),effectiveStoppedAt:date.nullable(),revocationVerifiedAt:date.nullable()})),
 supportUses:rows(z.strictObject({id,jobId:id,sourceCommandId:id,deploymentId:id,grantId:id,businessId:id,date,mode:z.enum(['assisted_group','delegated_group','assisted','delegated']),manualCostFen:money,manualDays:z.number().int().min(1).max(30)})),
 jobs:rows(job),incidents:rows(incident),evidence:rows(evidence),
 reports:rows(z.strictObject({id,deploymentId:id,date,sourceEventId:id,request:z.enum(['stop_owned','pause_expansion']),reportedState:z.literal('stopped'),independent:z.literal(false)})),
 attempts:rows(z.strictObject({id,incidentId:id,deploymentId:id,grantId:id,date,operationId:id,amountFen:money,afterOwnedStop:z.boolean()})),
 fees:rows(z.strictObject({id,deploymentId:id,date,month:z.string().regex(/^\d{4}-\d{2}$/),through:date,amountFen:money,operationId:id.nullable()})),
 network:rows(z.strictObject({id,date,sourceEventId:id,domain:z.literal('hengxing-shared-ops'),phase:z.enum(['external_adoption','disturbance','local_reconstruction','residual']),updatedAt:date,deploymentIds:ids,businessIds:ids,coordinatedFindingIds:ids,organisations:rows(z.strictObject({id,route:z.enum(['ai_course','api_relay']),dependency:z.enum(['low','high']),adoptedAt:date,recordsReady:z.boolean(),fallbackReady:z.boolean(),resourcesCommitted:z.boolean(),exitCostFen:money,state:z.enum(['adopted','signal','recovering','controlled','takeover','residual']),changedAt:date}))})),
 sharedFindings:rows(z.strictObject({id,incidentId:id,evidenceIds:ids,date,sourceCommandId:id,scope:z.literal('in_game_only')})),logs:rows(log)
})
export const storyEventSchema=z.strictObject({kind:z.literal('story_event'),type:z.enum(['linzhou_offer','linzhou_publish','network','external_claim','finish_job','incident_deadline','agent_attempt','agent_fee','grant_expiry','deployment_expiry','authority_check','network_adoption','network_review','claim_response']),entityId:id,date,occurrence:z.number().int().min(0).max(100)})
export type StoryState=z.infer<typeof storyStateSchema>
export type StoryJob=StoryState['jobs'][number]
export type StoryJobKind=z.infer<typeof storyJobKind>
export type StoryGrant=StoryState['grants'][number]
export type StoryDeployment=StoryState['deployments'][number]
export type StoryIncident=StoryState['incidents'][number]
export type StoryEvent=z.infer<typeof storyEventSchema>
export type StoryEvidence=StoryState['evidence'][number]
const terms=z.strictObject({points:z.number().int().min(1).max(4),costFen:money,days:z.number().int().min(1).max(90)})
const bps=z.number().int().min(0).max(10000)
export const storyCatalogSchema=z.strictObject({version:id,classification:z.literal('fictional'),linzhou:z.strictObject({offerAt:date,publishAt:date,choiceUntil:date,consentBps:bps,competitionFrom:date,competitionTo:date,competitionBps:bps}),sharedAnchor:id,deploymentAvailableAt:date,networkAdoptionAt:date,networkAt:date,networkReviewAt:date,networkCloseAt:date,authorityCheckDays:z.number().int().min(1).max(30),networkOrganisations:rows(z.strictObject({id,route:z.enum(['ai_course','api_relay']),dependency:z.enum(['low','high']),recordsReady:z.boolean(),fallbackReady:z.boolean(),resourcesCommitted:z.boolean(),exitCostFen:money})).min(1).max(3),claimAt:date,responseDays:z.number().int().min(1).max(90),agent:z.strictObject({monthlyFeeFen:money,preparedSetupCostFen:money,openSetupCostFen:money,normalBps:bps,ordinaryBps:bps,attemptCostFen:money,maxAttempts:z.number().int().min(1).max(3),maxGrantFen:money,claimFeeFen:money,claimFraudBps:bps}),jobs:z.strictObject({pilot:terms,continuity:terms,participation:terms,deployment:terms,records:terms,drill:terms,investigate:terms,isolate:terms,observe:terms,recover:terms,takeover:terms})})
export function loadStoryCatalog(value:unknown){const p=storyCatalogSchema.safeParse(value);requireRule(p.success,'INVALID_STORY_CATALOG');const c=p.data;requireRule(c.linzhou.offerAt<c.linzhou.choiceUntil&&c.linzhou.choiceUntil<c.linzhou.publishAt&&c.linzhou.competitionFrom<=c.linzhou.competitionTo&&c.deploymentAvailableAt<c.networkAdoptionAt&&c.networkAdoptionAt<c.networkAt&&c.networkAt<c.claimAt&&c.claimAt<c.networkReviewAt&&c.networkReviewAt<=c.networkCloseAt&&c.agent.normalBps+c.agent.ordinaryBps<=10000,'INVALID_STORY_CALENDAR_OR_PROBABILITY');return c}
