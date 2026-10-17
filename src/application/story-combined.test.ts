import {beforeAll,expect,it} from 'vitest'
import {normalStoryCombined} from '../testing/normal-story-combined.ts'
import {StoryHarness} from '../testing/story-harness.ts'
import {hashValue} from '../core/hash.ts'
import {projectStory} from '../core/story-projection.ts'
import {campaignStory} from './campaign.ts'
let source:ReturnType<typeof normalStoryCombined>
beforeAll(()=>{source=normalStoryCombined()},120000)
it('consumes one actual R1 source in market, an existing course and a real second business in the same normal run',()=>{
 const {h,relay,courseId,beforeShared,afterShared}=source,before=h.codec.import(beforeShared),after=h.codec.import(afterShared),anchor=after.world!.anchors.find(a=>a.id==='H009')!,impact=after.story!.impacts.find(i=>i.anchorId==='H009')!
 expect(after.origin).toBe('normal');expect(before.world!.anchors.some(a=>a.id==='H009')).toBe(false);expect(anchor.happenedAt).toBe('2025-01-20');expect(impact.courseIds).toContain(courseId);expect(impact.relayBusinessIds).toContain(relay.id)
 expect(after.course!.updates.filter(u=>u.anchorId==='H009'&&u.courseId===courseId)).toHaveLength(1);expect(after.relay!.changes.filter(c=>c.anchorId==='H009'&&c.businessId===relay.id)).toHaveLength(1);expect(after.story!.impacts.filter(i=>i.anchorId==='H009')).toHaveLength(1)
 const replay=new StoryHarness({priorRun:after}),market=hashValue(replay.run.market);replay.send('AdvanceTime',{date:'2025-01-20'});expect(hashValue(replay.run.market)).toBe(market);expect(replay.run.story!.impacts.filter(i=>i.anchorId==='H009')).toHaveLength(1)
})
it('completes real course support at the declared lower cost and dates without changing paid student identities',()=>{
 const {h,cohortId,deploymentId,members}=source,co=h.run.course!.cohorts.find(c=>c.id===cohortId)!,use=h.run.story!.supportUses.find(u=>u.deploymentId===deploymentId)!,job=h.run.operations!.jobs.find(j=>j.id===use.jobId)!,a=h.run.economy.actions.find(a=>a.definition.id===job.actionId)!
 expect(job.status).toBe('completed');expect(job.startAt).toBe('2025-07-01');expect(job.completeAt).toBe('2025-07-05');expect(a.definition.costFen).toBe(150000);expect(use.manualCostFen).toBe(300000);expect(use.manualDays).toBe(7);expect(h.run.course!.enrollments.filter(e=>e.cohortId===co.id).map(e=>e.personId)).toEqual(members);expect(co.stages.every(s=>s.deliveredAt!==null&&s.amountFen>0)).toBe(true)
 const visible=projectStory(h.run,campaignStory);expect(visible.deployments.find(d=>d.id===deploymentId)!.observedBusinessResult).toBe(true);expect(JSON.stringify(visible)).not.toContain('effectiveStoppedAt');expect(JSON.stringify(visible)).not.toContain('factId');expect(JSON.stringify(visible)).not.toContain('ordinaryBps')
})
it('rejects deleting the shared impact or either real consumer from a correctly rechecksummed same-run save',()=>{
 for(const field of ['impact','courseIds','relayBusinessIds']){const raw=JSON.parse(source.afterShared);if(field==='impact')raw.state.story.impacts=[];else raw.state.story.impacts[0][field]=[];const {checksum:_,...body}=raw;expect(()=>source.h.codec.import(JSON.stringify({...body,checksum:hashValue(body)}))).toThrow(field==='impact'?'SHARED_HISTORY_IMPACT_MISSING':'SHARED_HISTORY_CONSUMER_MISSING')}
},60000)
