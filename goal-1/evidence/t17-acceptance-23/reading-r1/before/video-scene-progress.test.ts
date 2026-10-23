import {expect,it} from 'vitest'
import {createVideoFixture,VIDEO_FIXTURE_PARAMETERS} from '../testing/video-fixture.ts'
import {projectVideo} from '../core/video-projection.ts'
import {addDays} from '../core/calendar.ts'
import {videoSceneProgress} from './video-scene-progress.ts'

/** Real fixture commands supply public UI stages; these are not normal-opening proofs. */
function path(revisions=0,accept=true,emptyFirstChannel=false){
 const f=createVideoFixture({parameters:{...VIDEO_FIXTURE_PARAMETERS,revisionCount:revisions,commercial:{...VIDEO_FIXTURE_PARAMETERS.commercial,prepaymentFen:90000}}})
 let run=f.run
 const send=(kind:string,payload:unknown)=>{run=f.apply(run,kind,payload)}
 if(emptyFirstChannel)send('OpenVideoChannel',{name:'没有这份委托的原账号',segment:'local_merchants'})
 send('OpenVideoChannel',{name:'一份普通作品',segment:'local_merchants'})
 const channel=run.video!.channels.at(-1)!
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
it('keeps the second channel and original work/contract as the target through an actual client revision',()=>{
 const h=path(3,true,true),work=h.run.video!.works[0]!,contract=h.run.video!.contracts[0]!,target={channelId:contract.channelId,workId:work.id,contractId:contract.id}
 expect(contract.channelId).not.toBe(h.run.video!.channels[0]!.id)
 expect(h.progress()!.target).toEqual(target)
 h.complete();h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:contract.id});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)})
 const before=h.f.codec.export(h.run)
 expect(h.progress()!.title).toContain('客户回话');expect(h.progress()!.target).toEqual(target)
 expect(h.progress()!.command).toBeUndefined();expect(h.f.codec.export(h.run)).toBe(before)
})
it('points an actual unmeasured publication to its own channel and feedback chapter',()=>{
 const h=path(0,false,true),channel=h.run.video!.channels.at(-1)!
 h.send('StartVideoWork',{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:h.run.timeline.cursor.date})
 h.complete();const work=h.run.video!.works[0]!
 h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});h.send('PublishVideo',{workId:work.id,monetization:'none',label:false})
 const before=h.f.codec.export(h.run)
 expect(h.progress()!.title).toContain('回应还在路上');expect(h.progress()!.target).toEqual({channelId:channel.id,workId:work.id,section:'publications'})
 expect(h.progress()!.command).toBeUndefined();expect(h.f.codec.export(h.run)).toBe(before)
})

it('keeps an explicitly selected paid original contract after another real commission and a new quarter',()=>{
 const h=path(),c=h.run.video!.contracts[0]!,target={channelId:c.channelId,workId:c.workId,contractId:c.id}
 h.complete();h.send('ReviewVideoOutput',{workId:c.workId,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:c.id});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)})
 const paymentAt=h.run.video!.contracts[0]!.paymentAt!
 expect(videoSceneProgress(h.view(),h.run.timeline.cursor.date,target)).toMatchObject({stage:'video-payment-wait',wait:{date:paymentAt},outcome:'pending',target})
 h.send('AdvanceTime',{date:paymentAt});h.send('OpenVideoChannel',{name:'另一个真实账号',segment:'local_merchants'})
 const channel=h.run.video!.channels.at(-1)!
 h.send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:h.run.timeline.cursor.date});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,7)})
 const cohort=h.run.video!.cohorts.at(-1)!
 h.send('AcceptVideoCommission',{channelId:channel.id,cohortId:cohort.id,clientId:cohort.qualifiedMembers[0],modeId:'manual',materialId:'original',resources:['player-production'],startAt:h.run.timeline.cursor.date})
 const raw=h.f.codec.export(h.run),p=videoSceneProgress(h.view(),'2020-04-01',target)!
 expect(p).toMatchObject({stage:'video-settled',outcome:'actual',target,resultRefs:[{kind:'contract',id:c.id,date:paymentAt}]})
 expect(p.command).toBeUndefined();expect(p.wait).toBeUndefined();expect(h.progress()!.target?.channelId).toBe(channel.id);expect(h.f.codec.export(h.run)).toBe(raw)
})

it('does not repair a wrong, empty, repeated or expired explicit video target using the global recommendation',()=>{
 const h=path(0,true,true),v=h.view(),c=v.contracts[0]!,target={channelId:c.channelId,workId:c.workId,contractId:c.id},raw=h.f.codec.export(h.run)
 expect(videoSceneProgress(v,h.run.timeline.cursor.date,null)).toMatchObject({stage:'video-entry',outcome:'none',resultRefs:[]});expect(videoSceneProgress(v,h.run.timeline.cursor.date,null)?.target).toBeUndefined()
 for(const bad of [{...target,channelId:v.channels[0]!.id},{...target,workId:''},{...target,contractId:'missing-contract'},{channelId:c.channelId,marketingId:'missing-marketing'},{...target,workId:c.id}]){
  const p=videoSceneProgress(v,h.run.timeline.cursor.date,bad)!
  expect(p.stage).toBe('video-invalid');expect(p.invalidReason).toBeTruthy();expect(p.command).toBeUndefined();expect(p.wait).toBeUndefined()
 }
 const duplicated={...v,contracts:[...v.contracts,c]}
 expect(videoSceneProgress(duplicated,h.run.timeline.cursor.date,target)?.invalidReason).toBeTruthy();expect(h.f.codec.export(h.run)).toBe(raw)
})

it('names the original marketing task and distinguishes its planned start, completion and real inquiry outcome',()=>{
 const h=path(0,false),v=h.view(),channel=v.channels[0]!
 h.send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:'2020-01-10'})
 const m=h.view().marketing.at(-1)!,target={channelId:channel.id,marketingId:m.id}
 expect(videoSceneProgress(h.view(),h.run.timeline.cursor.date,target)).toMatchObject({stage:'video-marketing-planned',outcome:'pending',wait:{date:'2020-01-10'}})
 h.send('AdvanceTime',{date:'2020-01-10'})
 expect(videoSceneProgress(h.view(),h.run.timeline.cursor.date,target)).toMatchObject({stage:'video-marketing-running',wait:{date:'2020-01-17'}})
 h.send('AdvanceTime',{date:'2020-01-17'})
 expect(videoSceneProgress(h.view(),h.run.timeline.cursor.date,target)).toMatchObject({stage:'video-marketing-completed',outcome:'actual',resultRefs:[{kind:'marketing',id:m.id,date:'2020-01-17'}]})
})

it('offers the original same-version submission after an actual accepted scope negotiation',()=>{
 const h=path(3),c=h.run.video!.contracts[0]!,target={channelId:c.channelId,workId:c.workId,contractId:c.id}
 const submit=()=>{h.send('ReviewVideoOutput',{workId:c.workId,disclosure:'manual'});h.send('SubmitVideoCommission',{contractId:c.id});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)})}
 h.complete();submit();h.send('ReworkVideo',{workId:c.workId,resources:['player-production'],startAt:h.run.timeline.cursor.date});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,7)});submit()
 const version=h.view().works[0]!.version
 h.send('NegotiateVideoCommission',{contractId:c.id,proposal:'scope',resources:['player-production'],startAt:h.run.timeline.cursor.date});h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,3)})
 expect(h.view().contracts[0]!.negotiationOutcome).toBe('accepted')
 const p=videoSceneProgress(h.view(),h.run.timeline.cursor.date,target)!
 expect(p).toMatchObject({stage:'video-submit',command:{kind:'SubmitVideoCommission',payload:{contractId:c.id},confirm:true},target,outcome:'pending'})
 h.send(p.command!.kind,p.command!.payload);h.send('AdvanceTime',{date:addDays(h.run.timeline.cursor.date,2)})
 expect(h.view().contracts[0]!.status).toBe('delivered');expect(h.view().works[0]!.version).toBe(version)
})
