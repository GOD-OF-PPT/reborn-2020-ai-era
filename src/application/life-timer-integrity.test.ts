import {expect,it} from 'vitest'
import {StoryHarness} from '../testing/story-harness.ts'
import {lifeEvent,agendaEvents} from '../core/life-state.ts'
import {queueEvent} from '../core/timeline.ts'
import {hashValue} from '../core/hash.ts'
import type {LifeEvent} from '../core/life-schema.ts'

function resign(envelope:Record<string,unknown>){const {checksum:_,...body}=envelope;return JSON.stringify({...body,checksum:hashValue(body)})}
it.each(['agenda','finish_job','offer_expiry','promise_due'] as const)('rejects an extra well-shaped %s timer for a real owner at the wrong date',type=>{
 const h=new StoryHarness({seed:'t15-extra-timer-'+type});let entityId:string,date:string
 if(type==='agenda'){const p=agendaEvents()[0]!.payload as LifeEvent;entityId=p.entityId;date='2020-07-02'}
 else if(type==='finish_job'){h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});entityId=h.run.life!.jobs[0]!.id;date='2020-01-09'}
 else{h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-01-04',{work:false});entityId=h.run.life!.promises[0]!.id;date=type==='offer_expiry'?'2020-01-20':'2020-02-19'}
 const envelope=JSON.parse(h.codec.export(h.run));envelope.state.timeline=queueEvent(h.run.timeline,lifeEvent(type,entityId,date))
 // Every referenced job/person/promise exists and the timer has a valid ID and schema.
 // A second timer must still belong to its owner's exact original lifecycle date.
 expect(()=>h.codec.import(resign(envelope))).toThrow()
},60000)
it('preserves exact ordered source parents when comparing work logs and matching causes',()=>{
 const h=new StoryHarness({seed:'t15-log-parent-order'});h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});const envelope=JSON.parse(h.codec.export(h.run)),id=h.run.life!.jobs[0]!.id
 envelope.state.life.logs.find((l:{id:string})=>l.id===id).parentIds.reverse();envelope.state.causes.find((c:{id:string})=>c.id===id).parentIds.reverse()
 expect(()=>h.codec.import(resign(envelope))).toThrow()
})
