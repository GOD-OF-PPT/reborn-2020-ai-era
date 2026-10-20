import {createCampaignRun,campaignStory} from '../application/campaign.ts'
import {projectStory,type StoryProjection} from '../core/story-projection.ts'

export type PublicRiskIncident=StoryProjection['incidents'][number]
export type PublicRiskInvestigation=NonNullable<PublicRiskIncident['jobs']['investigate']>

// Only the new run's public projection supplies the complete base shape. The variants
// below are display fixtures: never encode/import them as normal earned game history.
const empty=projectStory(createCampaignRun({runId:'public-risk-display-fixture',actorId:'player',commandId:'create-public-risk-display',backgroundId:'technical_employee',seed:'public-risk-display-only'}),campaignStory)

export function createPublicRiskInvestigation(overrides:Partial<PublicRiskInvestigation>={}):PublicRiskInvestigation{
 return {id:'public-investigation',kind:'investigate',accountId:'public-course-account',businessId:'public-course-business',resourceId:'player-production',startAt:'2025-04-08',completeAt:'2025-04-11',status:'running',costFen:10000,actionPoints:1,result:null,...overrides}
}
export function createPublicRiskIncident(overrides:Partial<PublicRiskIncident>={},investigation:PublicRiskInvestigation|null=null):PublicRiskIncident{
 return {
  id:'public-risk-incident',kind:'agent',sourceEventId:'public-risk-source',openedAt:'2025-04-08',deadline:'2025-04-22',businessIds:['public-course-business'],deploymentIds:[],contractIds:[],stage:'signal',verdict:'unknown',signals:[{id:'public-risk-signal',date:'2025-04-08',deploymentId:null,sourceEventId:'public-risk-source',source:'independent_statement',text:'一份已公开的原记录仍需独立核对；这不是风险真相。'}],investigationJobId:investigation?.id??null,isolationJobId:null,observationJobId:null,replacementJobId:null,takeoverJobId:null,externalVerifiedAt:null,liabilities:null,resolvedAt:null,claimFeeOperationId:null,declinedAt:null,selfReports:[],evidence:[],knownCosts:[],knownCostFen:0,unpaidKnownCostFen:0,paidWorkCostFen:investigation?.costFen??0,unverifiedFeePaidFen:0,currentLiabilities:{contractIds:[],obligationIds:[],jobIds:[],prepaidFen:0,receivableFen:0,payableFen:0},jobs:{investigate:investigation,isolate:null,observe:null,recover:null,takeover:null},taskTerms:{investigate:{points:1,costFen:10000,days:3},isolate:{points:1,costFen:70000,days:5},observe:{points:1,costFen:20000,days:3},recover:{points:1,costFen:50000,days:7},takeover:{points:1,costFen:150000,days:7}},controlVerified:false,externalManager:false,...overrides,
 }
}
export function createPublicRiskSceneFixture(incidents:readonly PublicRiskIncident[]=[]):StoryProjection{
 return {...empty,businesses:[{id:'public-course-business',accountId:'public-course-account',route:'ai_course',lifecycle:'operating',availableFen:500000,setupCostFen:80000}],incidents:[...incidents],unresolvedCount:incidents.filter(incident=>incident.resolvedAt===null&&incident.stage!=='normal').length,resources:[{id:'player-production',label:'本人实际日期产能'}]}
}
