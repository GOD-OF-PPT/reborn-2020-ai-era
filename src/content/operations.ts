import {RELAY_JOBS} from './relay.ts'
import { COURSE_JOBS } from './course.ts'
import { VIDEO_JOBS } from './video.ts'
import { FIRST_ORDER_JOB,FIRST_ORDER_OFFER } from './first-order.ts'
import { BOOTSTRAP_CONTENT } from './bootstrap.ts'
/** Fictional working parameters; route-specific offers are added by their own slices. */
export const OPERATIONS_CONTENT={version:'operations-work-v5',profiles:BOOTSTRAP_CONTENT.profiles.map(p=>({id:p.id,monthlySalaryFen:p.monthlySalaryFen})),
 businesses:[
 {id:'investment-plan',route:'a_share',company:false,capabilities:['spreadsheet'],preparationKey:null,minCashFen:0,capacityUnits:0,monthlyMaintenanceFen:0,requiresPreparationJob:false},
 {id:'manual-content',route:'ai_video',company:false,capabilities:['manual_editing'],preparationKey:null,minCashFen:50000,capacityUnits:1,monthlyMaintenanceFen:0,requiresPreparationJob:false},
 {id:'course-studio',route:'ai_course',company:true,capabilities:['chatgpt_announcement'],preparationKey:'teaching_outline',minCashFen:200000,capacityUnits:1,monthlyMaintenanceFen:10000,requiresPreparationJob:true},
 {id:'relay-station',route:'api_relay',company:true,capabilities:['gpt3_api'],preparationKey:'api_application_materials',minCashFen:500000,capacityUnits:1,monthlyMaintenanceFen:30000,requiresPreparationJob:true},
 {id:'ecosystem-service',route:'deepseek_opportunity',company:true,capabilities:['deepseek_v3_announcement'],preparationKey:'ecosystem_materials',minCashFen:100000,capacityUnits:1,monthlyMaintenanceFen:10000,requiresPreparationJob:true}],
 jobs:[FIRST_ORDER_JOB,...VIDEO_JOBS,...COURSE_JOBS,...RELAY_JOBS,{id:'business-preparation',purpose:'prepare',routes:['a_share','ai_video','ai_course','api_relay','deepseek_opportunity'],skill:'general',durationDays:7,actionPoints:1,costFen:10000,output:'business-readiness'},{id:'service-maintenance',purpose:'maintenance',routes:['ai_video','ai_course','api_relay','deepseek_opportunity'],skill:'general',durationDays:2,actionPoints:1,costFen:10000,output:'maintenance-record'}],
 offers:[FIRST_ORDER_OFFER],workers:[{id:'editor-lin',skills:['general','manual_editing'],units:1,monthlyWageFen:300000,recruitmentCostFen:50000},{id:'assistant-zhou',skills:['general','audience_research'],units:1,monthlyWageFen:250000,recruitmentCostFen:50000}],loans:[{id:'limited-emergency-help',principalFen:100000,feeFen:10000,termDays:30}]}
