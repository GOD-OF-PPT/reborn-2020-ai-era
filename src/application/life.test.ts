import {describe,expect,it} from 'vitest'
import {StoryHarness} from '../testing/story-harness.ts'
import {evaluateCommand,previewCommand} from '../core/commands.ts'
import {accountFunds} from '../core/ledger.ts'
import {actionBudget} from '../core/economy.ts'
import {hashValue} from '../core/hash.ts'
import {addDays} from '../core/calendar.ts'
import {relationshipAt} from '../core/life-state.ts'
import type {LifeJob} from '../core/life-schema.ts'

const normal=(backgroundId='technical_employee')=>new StoryHarness({backgroundId,seed:'t15-life-first-fixed'})
const work=(h:StoryHarness,kind:Exclude<LifeJob['kind'],'promise_keep'>,personId:string|null=null,reference:unknown=null)=>h.send('StartLifeWork',{kind,personId,reference})
function friend(){const h=normal();work(h,'friend_visit','tang-ying');h.at('2020-01-04',{work:false});return h}
function signed(raw:unknown){const value=raw as {checksum:string;[key:string]:unknown};const {checksum:_,...body}=value;return JSON.stringify({...body,checksum:hashValue(body)})}

describe('T15 normal personal work uses the original money, AP and calendar',()=>{
 it.each(['technical_employee','content_employee'])('rests for actual days with %s, not an immediate completion or bonus',background=>{
  const h=normal(background),before=h.codec.export(h.run),rng=hashValue(h.run.random),command=h.command('StartLifeWork',{kind:'rest',personId:null,reference:null})
  for(let n=0;n<3;n++)expect(previewCommand(h.run,command,h.codec.registry,'player')).toMatchObject({allowed:true,actionPoints:1,upfrontCostFen:0})
  expect(h.codec.export(h.run)).toBe(before);h.send('StartLifeWork',command.payload)
  expect(h.run.life!.jobs[0]).toMatchObject({status:'running',result:null,startAt:'2020-01-01',completeAt:'2020-01-08'});expect(actionBudget(h.run.economy,'2020-01-01').spent).toBe(1)
  expect(evaluateCommand(h.run,command,h.codec.registry,'player').status).toBe('duplicate')
  expect(evaluateCommand(h.run,{...command,payload:{kind:'workspace',personId:null,reference:null}},h.codec.registry,'player')).toMatchObject({status:'rejected',reasonCodes:['COMMAND_ID_REUSED']})
  h.at('2020-01-08',{work:false});expect(h.run.life!.jobs[0]).toMatchObject({status:'completed',result:'rested'});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(2600000);expect(hashValue(h.run.random)).toBe(rng)
  expect(h.reject('StartLifeWork',{kind:'rest',personId:null,reference:null})).toContain('LIFE_WORK_ALREADY_THIS_QUARTER')
 },60000)
 it('pays workspace cost at start, preserves the failed attempt, and changes completion only after a real retry',()=>{
  const h=normal();work(h,'workspace');const first=h.run.life!.jobs[0]!;expect(accountFunds(h.run.economy.ledger,'personal').availableFen).toBe(2300000);expect(first.result).toBeNull()
  expect(h.reject('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null})).toContain('INSUFFICIENT_CAPACITY')
  h.send('InterruptLifeWork',{jobId:first.id});expect(h.run.life!.jobs[0]).toMatchObject({status:'interrupted',result:null});expect(actionBudget(h.run.economy,'2020-01-01').spent).toBe(1)
  work(h,'workspace');expect(actionBudget(h.run.economy,'2020-01-01').spent).toBe(2);expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(2000000)
  h.at('2020-01-08',{work:false});expect(h.run.life!.jobs.filter(j=>j.kind==='workspace'&&j.status==='completed')).toHaveLength(1);expect(h.run.life!.jobs[0]!.status).toBe('interrupted')
  expect(h.reject('StartLifeWork',{kind:'workspace',personId:null,reference:null})).toContain('LIFE_WORKSPACE_ALREADY_ARRANGED')
 },60000)
 it('cannot spend company capital on private life, but a zero-cost rest still consumes actual AP and days',()=>{
  const h=normal();h.at('2023-04-01');h.send('OpenCourseStudio',{capitalFen:500000});const b=h.run.operations!.businesses.find(b=>b.route==='ai_course')!
  const available=accountFunds(h.run.economy.ledger,'personal').availableFen;h.send('FundBusiness',{businessId:b.id,amountFen:available});const company=accountFunds(h.run.economy.ledger,b.accountId)
  expect(accountFunds(h.run.economy.ledger,'personal').availableFen).toBe(0);expect(company.availableFen).toBeGreaterThan(500000)
  expect(h.reject('StartLifeWork',{kind:'workspace',personId:null,reference:null})).toContain('INSUFFICIENT_AVAILABLE_FUNDS');expect(accountFunds(h.run.economy.ledger,b.accountId)).toEqual(company)
  const ap=actionBudget(h.run.economy,h.run.timeline.cursor.date).spent;work(h,'rest');expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).spent).toBe(ap+1);h.at('2023-04-08',{work:false});expect(h.run.life!.jobs.at(-1)!.status).toBe('completed');expect(accountFunds(h.run.economy.ledger,'personal').availableFen).toBe(0)
 },60000)
})

describe('T15 promises are explicit future work, with default and another actor choice',()=>{
 it('accepts no free fulfillment and processes actual deadline-day work before judging a missed promise',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!,cash=accountFunds(h.run.economy.ledger,'personal').cashFen,spent=actionBudget(h.run.economy,h.run.timeline.cursor.date).spent
  expect(promise.status).toBe('offered');h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(cash);expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).spent).toBe(spent);expect(h.run.life!.promises[0]!.status).toBe('accepted')
  expect(promise.deadline).toBe('2020-02-18');h.at('2020-02-15',{work:false});h.send('FulfillLifePromise',{promiseId:promise.id});expect(h.run.life!.promises[0]!.status).toBe('accepted');h.at(promise.deadline,{work:false})
  expect(h.run.life!.promises[0]).toMatchObject({status:'fulfilled',resolvedAt:promise.deadline});expect(relationshipAt(h.run,'tang-ying',promise.deadline).keptPromiseIds).toEqual([promise.id]);expect(actionBudget(h.run.economy,promise.deadline).spent).toBe(2)
 },60000)
 it('records an accepted but unperformed promise as missed without spending or completing it by default',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!;h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});h.at(promise.deadline,{work:false})
  expect(h.run.life!.promises[0]).toMatchObject({status:'missed',completionJobId:null});expect(h.run.life!.jobs).toHaveLength(1);expect(actionBudget(h.run.economy,promise.deadline).spent).toBe(1);expect(relationshipAt(h.run,'tang-ying',promise.deadline).stage).toBe('strained')
  expect(h.reject('DeclineLifePromise',{promiseId:promise.id})).toContain('LIFE_OFFER_NOT_AVAILABLE')
 },60000)
 it('expires an unaccepted invitation with no extra work or fee',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!,cash=accountFunds(h.run.economy.ledger,'personal').cashFen;h.at(addDays(promise.expiresAt,1),{work:false})
  expect(h.run.life!.promises[0]).toMatchObject({status:'expired',acceptedAt:null,completionJobId:null});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(cash);expect(h.run.life!.jobs).toHaveLength(1)
 },60000)
 it('cannot start two fulfillment jobs, and a real interrupted retry retains both costs and AP',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!;h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});h.send('FulfillLifePromise',{promiseId:promise.id});const first=h.run.life!.jobs.at(-1)!
  expect(h.reject('FulfillLifePromise',{promiseId:promise.id})).toContain('LIFE_PROMISE_WORK_ALREADY_ARRANGED');h.send('InterruptLifeWork',{jobId:first.id});h.send('FulfillLifePromise',{promiseId:promise.id})
  expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).spent).toBe(3);expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(2520000);h.at('2020-01-07',{work:false})
  expect(h.run.life!.jobs.find(j=>j.id===first.id)!.status).toBe('interrupted');expect(h.run.life!.promises[0]).toMatchObject({status:'fulfilled',completionJobId:h.run.life!.jobs.at(-1)!.id})
 },60000)
 it('can explicitly decline an unaccepted invitation and keep the original life at zero AP',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!;h.send('WorkQuarter',{});work(h,'rest');expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).available).toBe(0)
  const money=hashValue(h.run.economy.ledger),random=hashValue(h.run.random);h.send('DeclineLifePromise',{promiseId:promise.id});h.send('SetLifePriority',{year:2020,priority:'unchanged'})
  expect(h.run.life!.promises[0]!.status).toBe('declined');expect(hashValue(h.run.economy.ledger)).toBe(money);expect(hashValue(h.run.random)).toBe(random);expect(actionBudget(h.run.economy,h.run.timeline.cursor.date).available).toBe(0)
 },60000)
 it('honors another actor public busy period and withdraws only an invitation not yet accepted',()=>{
  const h=normal();h.at('2020-06-20',{work:false});work(h,'friend_visit','tang-ying');h.at('2020-06-23',{work:false});const promise=h.run.life!.promises[0]!
  expect(promise.expiresAt>'2020-07-01').toBe(true);h.at('2020-07-01',{work:false});expect(h.run.life!.promises[0]!.status).toBe('npc_declined');expect(relationshipAt(h.run,'tang-ying','2020-07-01').missedPromiseIds).toHaveLength(0)
  expect(h.reject('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null})).toContain('LIFE_PERSON_UNAVAILABLE')
 },60000)
})

describe('T15 stored results require original work and keep unrelated random domains',()=>{
 it('rejects a rechecksummed premature scene completion and an orphan spent life action',()=>{
  const h=normal();work(h,'workspace');const envelope=JSON.parse(h.codec.export(h.run));envelope.state.life.jobs[0].status='completed';envelope.state.life.jobs[0].result='workspace_ready';envelope.state.life.jobs[0].releasedAt=envelope.state.life.jobs[0].completeAt
  expect(()=>h.codec.import(signed(envelope))).toThrow('INVALID_COMPLETED_LIFE_WORK')
  const deleted=JSON.parse(h.codec.export(h.run));deleted.state.life.jobs=[];expect(()=>h.codec.import(signed(deleted))).toThrow('ORPHAN_LIFE_ACTION')
 },60000)
 it('cannot erase an offered/accepted/missed commitment or zero its originally proposed price',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!;h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});h.at(promise.deadline,{work:false});const before=h.codec.export(h.run)
  const deleted=JSON.parse(before);deleted.state.life.promises=[];expect(()=>h.codec.import(signed(deleted))).toThrow('LIFE_PROMISE_RECORD_MISSING')
  const price=JSON.parse(before);price.state.life.promises[0].costFen=0;expect(()=>h.codec.import(signed(price))).toThrow('LIFE_PROMISE_TERMS_REWRITTEN')
  const free=JSON.parse(before);free.state.life.promises[0].status='fulfilled';free.state.life.promises[0].completionJobId=free.state.life.jobs[0].id
  const due=free.state.timeline.receipts.find((r:{signature:string})=>{const e=JSON.parse(r.signature);return e.payload.kind==='life_event'&&e.payload.type==='promise_due'&&e.payload.entityId===promise.id});due.skippedReason='LIFE_PROMISE_NOT_OUTSTANDING'
  expect(()=>h.codec.import(signed(free))).toThrow('LIFE_PROMISE_FREE_FULFILLMENT')
 },60000)
 it('rejects changing the actual missed-deadline receipt to a skipped receipt even with a valid checksum',()=>{
  const h=friend(),promise=h.run.life!.promises[0]!;h.send('AcceptLifePromise',{promiseId:promise.id,consent:true});h.at(promise.deadline,{work:false});const raw=JSON.parse(h.codec.export(h.run))
  const due=raw.state.timeline.receipts.find((r:{signature:string})=>{const e=JSON.parse(r.signature);return e.payload.kind==='life_event'&&e.payload.type==='promise_due'&&e.payload.entityId===promise.id});due.skippedReason='LIFE_PROMISE_NOT_OUTSTANDING'
  expect(()=>h.codec.import(signed(raw))).toThrow('LIFE_DUE_RECEIPT_REWRITTEN')
 },60000)
 it('does not change market randomness or the original Linzhou decision merely by setting a life priority',()=>{
  const left=normal(),right=normal();left.send('SetLifePriority',{year:2020,priority:'reserve'});left.at('2021-01-01',{work:false});right.at('2021-01-01',{work:false})
  expect(left.run.random).toEqual(right.run.random);expect(left.run.market!.history).toEqual(right.run.market!.history);expect(left.run.facts.find(f=>f.id===left.run.story!.linzhou.factId)!.roll).toBe(right.run.facts.find(f=>f.id===right.run.story!.linzhou.factId)!.roll)
 },60000)
})
