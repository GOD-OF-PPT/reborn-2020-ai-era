import {replayNormalCourse} from './normal-course-scenario.ts'
import {StoryHarness} from './story-harness.ts'
import {addDays} from '../core/calendar.ts'
/** One intact normal course run acquires a second real business; no merged states or donated rights. */
export function normalStoryCombined(backgroundId='technical_employee'){
 const normal=replayNormalCourse(backgroundId),h=new StoryHarness({priorRun:normal.run})
 h.at('2024-07-02');h.send('OpenRelayStation',{capitalFen:3000000});const relay=h.run.operations!.businesses.find(b=>b.route==='api_relay')!,course=h.run.course!.courses[0]!,studio=h.run.operations!.businesses.find(b=>b.id===course.businessId)!
 h.send('StartRelayPreparation',{businessId:relay.id,preparation:'materials',resources:['player-production'],startAt:'2024-07-02'});h.at('2024-07-09')
 const channelId=h.run.video!.channels[0]!.id
 if(backgroundId==='technical_employee'){h.send('ApplyVideoProgram',{channelId,program:'image_rights',resources:['player-production'],startAt:'2024-07-09'});h.at('2024-07-16');h.send('DecideVideoProgram',{applicationId:h.run.video!.applications.at(-1)!.id})}
 if(backgroundId==='content_employee'){h.send('StartRelayPreparation',{businessId:relay.id,preparation:'basics',resources:['player-production'],startAt:'2024-07-09'});h.at('2024-07-16')}
 h.at('2024-10-02',{work:false});if(h.run.video!.applications.at(-1)!.expiresAt===null||h.run.video!.applications.at(-1)!.expiresAt!<'2025-04-23'){const last=h.run.video!.applications.at(-1)!;if(last.approved===false&&last.decidedAt!==null&&addDays(last.decidedAt,90)>h.run.timeline.cursor.date)h.at(addDays(last.decidedAt,90),{work:false});const at=h.run.timeline.cursor.date;h.send('ApplyVideoProgram',{channelId,program:'image_rights',resources:['player-production'],startAt:at});h.at(addDays(at,7),{work:false});h.send('DecideVideoProgram',{applicationId:h.run.video!.applications.at(-1)!.id})}
 if(!h.run.video!.applications.at(-1)!.approved)throw Error('COMBINED_FIXED_IMAGE_RENEWAL_FAILED_NO_SEED_SUBSTITUTION')
 for(let n=0;n<3;n++){const start=h.run.timeline.cursor.date;h.send('ApplyRelaySupply',{businessId:relay.id,supplierId:'cedar-direct',resources:['player-production'],startAt:start});h.at(addDays(start,7),{work:false});const a=h.run.relay!.applications.at(-1)!;h.send('ReadRelaySupplyDecision',{applicationId:a.id});if(a.approved)break;if(n<2)h.at(addDays(a.decisionAt,31),{work:false})}
 if(!h.run.relay!.applications.some(a=>a.approved))throw Error('COMBINED_FIXED_SUPPLY_STRATEGY_FAILED_NO_SEED_SUBSTITUTION')
 h.send('ActivateBusiness',{businessId:relay.id});if(h.run.timeline.cursor.date<'2025-01-01')h.at('2025-01-01',{work:false})
 h.send('StartHengxingDeployment',{businessId:studio.id,resourceId:'player-production',expiresAt:'2025-09-30',initialCashLimitFen:500000,consent:true});h.at(addDays(h.run.timeline.cursor.date,7),{work:false});const deployment=h.run.story!.deployments[0]!
 if(h.run.timeline.cursor.date>='2025-01-20')throw Error('COMBINED_FIXED_STRATEGY_MISSED_SHARED_DATE');const beforeShared=h.codec.export(h.run);h.at('2025-01-20',{work:false});const afterShared=h.codec.export(h.run)
 h.send('StartCourseRefresh',{courseId:course.id,resources:['player-production'],startAt:'2025-01-20'});h.at('2025-01-27',{work:false});h.send('ResumeCourseEnrollment',{courseId:course.id})
 h.send('CreateCourseAudience',{courseId:course.id,mode:'paid',priceFen:99900,videoCohortIds:[],resources:['player-production'],startAt:'2025-01-27'});h.at('2025-02-03',{work:false});const audience=h.run.course!.audiences.at(-1)!
 h.at('2025-04-01',{work:false});h.send('PlanCourseCohort',{courseId:course.id,audienceId:audience.id,startAt:'2025-04-03',endAt:'2025-05-08',supportStartAt:'2025-07-01',seatLimit:20,supportMode:'assisted_group',deploymentId:deployment.id,resources:['player-production'],promise:'clear_scope'});const cohort=h.run.course!.cohorts.at(-1)!,members=audience.eligibleMembers.filter(id=>!h.run.course!.enrollments.some(e=>e.personId===id&&e.productKey===course.productKey)).slice(0,20)
 if(!members.length)throw Error('COMBINED_FIXED_COURSE_HAS_NO_NEW_ACTUAL_LEARNERS')
 h.send('EnrollCourseAudience',{cohortId:cohort.id,personIds:members});h.send('StartCourseStage',{cohortId:cohort.id,index:0,resources:['player-production'],startAt:'2025-04-03'});h.at('2025-04-13',{work:false});h.send('StartCourseStage',{cohortId:cohort.id,index:1,resources:['player-production'],startAt:'2025-04-13'});h.at('2025-04-23',{work:false});h.at('2025-07-05',{work:false})
 return {h,relay,studio,courseId:course.id,cohortId:cohort.id,deploymentId:deployment.id,beforeShared,afterShared,members}
}
