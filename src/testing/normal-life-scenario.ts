import {createCampaignRun} from '../application/campaign.ts'
import {StoryHarness} from './story-harness.ts'
import {personalReferences} from '../core/life-state.ts'
import type {LifePerson} from '../core/life-schema.ts'

/** An intact normal opening: employment, actual first delivery, cooperation and private expenses. */
export function normalLifePeople(backgroundId:string){
 const h=new StoryHarness({priorRun:createCampaignRun({runId:'t15-normal-people-'+backgroundId,actorId:'player',commandId:'create',backgroundId,seed:'t14-linzhou-normal-0'})}),snapshots:Record<string,string>={initial:h.codec.export(h.run)}
 h.send('StartFirstOrder',{});h.at('2020-01-19');const first=h.run.operations!.contracts.find(c=>c.caseKey!==null)!
 h.send('SubmitDelivery',{contractId:first.id});h.at('2020-01-20');snapshots.firstPaid=h.codec.export(h.run)
 const reference={kind:'paid_case' as const,id:first.id,date:first.settledAt??h.run.operations!.contracts.find(c=>c.id===first.id)!.settledAt!}
 h.at('2020-01-21');snapshots.materialReady=h.codec.export(h.run)
 h.at('2020-04-01');startShared('chen-yu');finishLatest();keep('chen-yu');snapshots.partnerKept=h.codec.export(h.run)
 h.at('2021-01-01');h.send('StartLinzhouWork',{kind:'pilot',resourceId:'player-production'});h.at('2021-01-08');h.send('StartLinzhouWork',{kind:'continuity',resourceId:'player-production'});h.at('2021-01-15')
 // Three real personal actions in Q2 replace employment for this quarter, never free extra AP.
 h.at('2021-04-01',{work:false});h.send('StartLinzhouWork',{kind:'participation',resourceId:'player-production'});h.at('2021-04-08',{work:false});snapshots.participation=h.codec.export(h.run)
 if(h.run.story!.linzhou.willingness!=='agreed')throw Error('FIXED_LIFE_COOPERATION_PROFILE_CHANGED')
 h.at('2021-04-09',{work:false});startShared('linzhou');finishLatest();keep('linzhou');snapshots.linzhouKept=h.codec.export(h.run)
 h.at('2022-08-22');snapshots.peerPublication=h.codec.export(h.run);h.at('2022-08-23');startShared('xu-cheng');finishLatest();keep('xu-cheng');snapshots.peerKept=h.codec.export(h.run)
 h.at('2022-10-01',{work:false});startShared('tang-ying');finishLatest();keep('tang-ying');snapshots.friendKept=h.codec.export(h.run)
 h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});snapshots.workspaceRunning=h.codec.export(h.run);finishLatest();snapshots.workspaceCompleted=h.codec.export(h.run)
 h.send('StartLifeWork',{kind:'rest',personId:null,reference:null});finishLatest();snapshots.final=h.codec.export(h.run)
 function startShared(personId:LifePerson){
  const kind=personId==='chen-yu'?'partner_review':personId==='linzhou'?'linzhou_review':personId==='xu-cheng'?'peer_notes':'friend_visit'
  const ref=personId==='tang-ying'?null:personId==='linzhou'?personalReferences(h.run,h.run.timeline.cursor.date).find(r=>r.kind==='linzhou_participation')??null:reference
  h.send('StartLifeWork',{kind,personId,reference:ref})
 }
 function finishLatest(){h.at(h.run.life!.jobs.at(-1)!.completeAt,{work:false})}
 function keep(personId:LifePerson){const p=h.run.life!.promises.find(o=>o.personId===personId&&o.status==='offered');if(!p)throw Error('EXPECTED_NPC_INVITATION_MISSING:'+personId);h.send('AcceptLifePromise',{promiseId:p.id,consent:true});h.send('FulfillLifePromise',{promiseId:p.id});finishLatest()}
 return {h,snapshots,reference}
}
