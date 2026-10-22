import type {StoryJobKind} from '../core/story-schema.ts'
/** Fictional local tools, customers and Hengxing only. Historical dates remain in CAMPAIGN_CONTENT. */
export const STORY_CONTENT={
 version:'story-work-v1',classification:'fictional',
 linzhou:{offerAt:'2021-01-01',publishAt:'2023-05-01',choiceUntil:'2023-04-30',consentBps:8500,competitionFrom:'2023-05-01',competitionTo:'2024-12-31',competitionBps:500},
 sharedAnchor:'H009',deploymentAvailableAt:'2024-10-01',networkAdoptionAt:'2025-07-01',networkAt:'2025-08-01',networkReviewAt:'2025-09-15',networkCloseAt:'2025-09-30',authorityCheckDays:7,claimAt:'2025-08-15',responseDays:14,
 networkOrganisations:[{id:'fictional-east-classroom',route:'ai_course',dependency:'high',recordsReady:false,fallbackReady:false,resourcesCommitted:true,exitCostFen:150000},{id:'fictional-river-relay',route:'api_relay',dependency:'high',recordsReady:false,fallbackReady:false,resourcesCommitted:false,exitCostFen:70000},{id:'fictional-hill-school',route:'ai_course',dependency:'low',recordsReady:true,fallbackReady:true,resourcesCommitted:true,exitCostFen:40000}],
 agent:{monthlyFeeFen:20000,preparedSetupCostFen:60000,openSetupCostFen:40000,normalBps:6000,ordinaryBps:2500,attemptCostFen:40000,maxAttempts:3,maxGrantFen:1000000,claimFeeFen:50000,claimFraudBps:5000},
 jobs:{
  pilot:{points:1,costFen:70000,days:7},continuity:{points:1,costFen:120000,days:7},participation:{points:1,costFen:30000,days:7},
  deployment:{points:1,costFen:80000,days:7},records:{points:1,costFen:30000,days:7},drill:{points:1,costFen:20000,days:3},
  investigate:{points:1,costFen:10000,days:3},isolate:{points:1,costFen:70000,days:5},observe:{points:1,costFen:20000,days:3},recover:{points:1,costFen:50000,days:7},takeover:{points:1,costFen:150000,days:7}
 } satisfies Record<StoryJobKind,{points:number;costFen:number;days:number}>
} as const
