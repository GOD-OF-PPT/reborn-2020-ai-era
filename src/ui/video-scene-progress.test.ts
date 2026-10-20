import {expect,it} from 'vitest'
import {createVideoFixture,VIDEO_FIXTURE_PARAMETERS} from '../testing/video-fixture.ts'
import {projectVideo} from '../core/video-projection.ts'
import {addDays} from '../core/calendar.ts'
import {videoSceneProgress} from './video-scene-progress.ts'

/** Real fixture commands supply public UI stages; these are not normal-opening proofs. */
function path(revisions=0,accept=true){
 const f=createVideoFixture({parameters:{...VIDEO_FIXTURE_PARAMETERS,revisionCount:revisions,commercial:{...VIDEO_FIXTURE_PARAMETERS.commercial,prepaymentFen:90000}}})
 let run=f.run
 const send=(kind:string,payload:unknown)=>{run=f.apply(run,kind,payload)}
 send('OpenVideoChannel',{name:'一份普通作品',segment:'local_merchants'})
 const channel=run.video!.channels[0]!
 send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:'2020-01-01'});send('AdvanceTime',{date:'2020-01-08'})
 if(accept){const cohort=run.video!.cohorts[0]!;send('AcceptVideoCommission',{channelId:channel.id,cohortId:cohort.id,clientId:cohort.qualifiedMembers[0],modeId:'manual',materialId:'original',resources:['player-production'],startAt:run.timeline.cursor.date})}
 return {f,send,get run(){return run},view:()=>projectVideo(run,f.video)!,progress:()=>videoSceneProgress(projectVideo(run,f.video),run.timeline.cursor.date),complete:()=>{const work=run.video!.works.at(-1)!;send('AdvanceTime',{date:run.operations!.jobs.find(j=>j.id===work.jobId)!.completeAt})}}
}
it('keeps an actual running work in the scene without claiming completion or mutating public/stored facts',()=>{
 const h=path(),v=h.view(),publicBefore=JSON.stringify(v),saved=h.f.codec.export(h.run),p=videoSceneProgress(v,h.run.timeline.cursor.date)!
 expect(p.title).toContain('正在成形');expect(p.choice.line).toContain(h.view().works[0]!.production!.completeAt);expect(p.command).toBeUndefined();expect(JSON.stringify(v)).toBe(publicBefore);expect(h.f.codec.export(h.run)).toBe(saved)
})
it('offers the original free review only after completion and explicit submission only after review',()=>{
 const h=path();h.complete();const work=h.run.video!.works[0]!,contract=h.run.video!.contracts[0]!
 const review=h.progress()!;expect(review.command).toEqual({kind:'ReviewVideoOutput',payload:{workId:work.id,disclosure:'manual'},confirm:false})
 h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
 expect(h.progress()!.command).toEqual({kind:'SubmitVideoCommission',payload:{contractId:contract.id},confirm:true})
})
it('does not call submission acceptance or receipt, and does not reannounce a paid contract in another quarter',()=>{
 const h=path();h.complete();const work=h.run.video!.works[0]!,contract=h.run.video!.contracts[0]!
 h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:contract.id})
 expect(h.progress()!.title).toContain('等一个');expect(h.progress()!.command).toBeUndefined()
 h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)});const paidAt=h.run.video!.contracts[0]!.paymentAt!
 expect(h.progress()!.choice.line).toContain(paidAt);expect(h.progress()!.title).toContain('还在路上')
 h.send('AdvanceTime',{date:paidAt});expect(h.progress()!.title).toContain('真正结算')
 expect(videoSceneProgress(h.view(),'2020-04-01')?.title).not.toContain('真正结算')
})
it('keeps interrupted production and its old responsibility out of automatic review/submission',()=>{
 const h=path();h.send('InterruptJob',{jobId:h.run.video!.works[0]!.jobId});const p=h.progress()!
 expect(p.title).toContain('停下了');expect(p.choice.line).toContain('退款责任');expect(p.command).toBeUndefined()
})
it('leaves a real client revision to the existing paid rework, negotiation and exit choices',()=>{
 const h=path(3);h.complete();const work=h.run.video!.works[0]!,contract=h.run.video!.contracts[0]!
 h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:contract.id});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)})
 expect(h.progress()!.choice.line).toContain('有成本');expect(h.progress()!.choice.line).toContain('谈判');expect(h.progress()!.choice.line).toContain('退出');expect(h.progress()!.command).toBeUndefined()
})
it('shows a known quality issue as a choice rather than auto-fixing or reviewing it',()=>{
 const h=path();h.complete();const v=h.view()
 // Bounded public display projection, never encoded as a valid game history.
 const visibleIssue={...v,works:v.works.map(w=>({...w,modeId:'image_assisted' as const,defectKnown:true}))}
 const p=videoSceneProgress(visibleIssue,h.run.timeline.cursor.date)!
 expect(p.title).toContain('认真修好');expect(p.command).toBeUndefined();expect(p.choice.line).toContain('真实资金')
})
it('counts inquiry people once across channels and does not invent commission income',()=>{
 const h=path(0,false),v=h.view(),people=new Set(v.channels[0]!.leads.map(l=>l.personId)).size
 // Display-only duplication verifies shared identity, not a second customer purchase.
 const samePeople={...v,channels:[v.channels[0]!,{...v.channels[0]!,id:'display-channel-two'}]}
 const p=videoSceneProgress(samePeople,h.run.timeline.cursor.date)!
 expect(p.choice.line).toContain(people+'名去重');expect(p.choice.line).toContain('询价还不是成交');expect(p.command).toBeUndefined()
})
it('identifies the owning channel when several accounts have a work with the same ordinal',()=>{
 const h=path();h.send('OpenVideoChannel',{name:'第二内容账号',segment:'local_merchants'})
 expect(h.progress()!.choice.line).toContain('一份普通作品 / 作品1')
 h.complete();expect(h.progress()!.choice.label).toContain('一份普通作品 / 作品1')
 expect(h.progress()!.command?.payload).toEqual({workId:h.run.video!.works[0]!.id,disclosure:'manual'})
})
