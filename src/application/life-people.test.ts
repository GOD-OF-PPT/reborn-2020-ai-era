import {describe,expect,it} from 'vitest'
import {normalLifePeople} from '../testing/normal-life-scenario.ts'
import {StoryHarness} from '../testing/story-harness.ts'
import {personalReferences,relationshipAt} from '../core/life-state.ts'
import {actionBudget} from '../core/economy.ts'
import {accountFunds} from '../core/ledger.ts'
import {hashValue} from '../core/hash.ts'

describe('T15 four people are reached with real work, their own goals and intact normal history',()=>{
 it.each(['technical_employee','content_employee'])('normally keeps distinct promises with all four people as %s',background=>{
  const {h,snapshots,reference}=normalLifePeople(background)
  expect(h.run.origin).toBe('normal');expect(h.run.life!.promises).toHaveLength(4);expect(new Set(h.run.life!.promises.map(p=>p.personId)).size).toBe(4)
  expect(h.run.life!.promises.every(p=>p.status==='fulfilled'&&p.completionJobId!==null)).toBe(true)
  for(const p of h.run.life!.promises){expect(relationshipAt(h.run,p.personId,h.run.timeline.cursor.date).keptPromiseIds).toContain(p.id);expect(h.run.life!.jobs.find(j=>j.id===p.completionJobId)).toMatchObject({kind:'promise_keep',status:'completed',costFen:p.costFen,personId:p.personId})}
  const paid=new StoryHarness({priorRun:h.codec.import(snapshots.firstPaid!)});expect(personalReferences(paid.run,'2020-01-20').some(r=>r.id===reference.id)).toBe(false)
  expect(paid.reject('StartLifeWork',{kind:'partner_review',personId:'chen-yu',reference})).toContain('LIFE_PERSON_NOT_KNOWN')
  const ready=h.codec.import(snapshots.materialReady!);expect(personalReferences(ready,'2020-01-21')).toContainEqual(reference)
  const oldPublication=new StoryHarness({priorRun:h.codec.import(snapshots.peerPublication!)});expect(oldPublication.reject('StartLifeWork',{kind:'peer_notes',personId:'xu-cheng',reference})).toContain('LIFE_PERSON_NOT_KNOWN')
  const starting=h.codec.import(snapshots.workspaceRunning!),completed=h.codec.import(snapshots.workspaceCompleted!);expect(starting.life!.jobs.at(-1)).toMatchObject({kind:'workspace',status:'running',result:null});expect(completed.life!.jobs.at(-1)).toMatchObject({kind:'workspace',status:'completed',result:'workspace_ready'})
  expect(accountFunds(starting.economy.ledger,'personal').cashFen).toBe(accountFunds(completed.economy.ledger,'personal').cashFen);expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).spent).toBe(4)
  expect(h.run.operations!.employment.some(e=>e.quarter==='2021-Q2')).toBe(false);expect(h.run.operations!.employment.some(e=>e.quarter==='2022-Q4')).toBe(false)
  expect(h.run.story!.grants).toHaveLength(0);expect(h.run.life!.jobs.filter(j=>j.status==='completed')).toHaveLength(10)
 },120000)
 it('does not turn original Linzhou refusal into agreement through money or a relationship activity',()=>{
  const h=new StoryHarness({seed:'t14-linzhou-normal-7'});h.send('StartFirstOrder',{});h.at('2020-01-19');const c=h.run.operations!.contracts.find(c=>c.caseKey!==null)!;h.send('SubmitDelivery',{contractId:c.id});h.at('2020-01-20');h.at('2021-01-01')
  h.send('StartLinzhouWork',{kind:'pilot',resourceId:'player-production'});h.at('2021-01-08');h.send('StartLinzhouWork',{kind:'continuity',resourceId:'player-production'});h.at('2021-01-15');h.at('2021-04-01',{work:false});h.send('StartLinzhouWork',{kind:'participation',resourceId:'player-production'});h.at('2021-04-09',{work:false})
  expect(h.run.story!.linzhou.willingness).toBe('declined');const money=hashValue(h.run.economy.ledger),rng=hashValue(h.run.random)
  expect(h.reject('StartLifeWork',{kind:'linzhou_review',personId:'linzhou',reference:null})).toContain('LIFE_ACTUAL_REFERENCE_REQUIRED');expect(hashValue(h.run.economy.ledger)).toBe(money);expect(hashValue(h.run.random)).toBe(rng)
  h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2021-04-12',{work:false});expect(h.run.life!.jobs[0]!.status).toBe('completed');expect(h.run.story!.linzhou.willingness).toBe('declined')
 },60000)
})
