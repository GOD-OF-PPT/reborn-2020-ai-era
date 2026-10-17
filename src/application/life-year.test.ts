import {expect,it} from 'vitest'
import {StoryHarness} from '../testing/story-harness.ts'
import {projectLife,projectPersonalYear} from '../core/life-projection.ts'
import {campaignLife,campaignRuntime} from './campaign.ts'
import {accountFunds,createLedger,applyLedger} from '../core/ledger.ts'
import {hashValue} from '../core/hash.ts'
import {MONEY_LIMIT} from '../core/money.ts'

it('keeps actual annual cash, salary and ownership separate, without using today balance as the previous year',()=>{
 const h=new StoryHarness({seed:'t15-year-cash-fixed'});h.send('WorkQuarter',{});h.at('2020-03-31',{work:false})
 const q=projectLife(h.run,campaignLife,campaignRuntime.pack).years[0]!
 expect(q.money).toMatchObject({openingFen:3000000,receivedFen:2400000,spentFen:1200000,closingFen:4200000,through:'2020-03-31'});expect(q.salaryReceivedFen).toBe(2400000)
 h.at('2020-12-31',{work:false});const old=projectPersonalYear(h.run.economy.ledger,2020,'2020-12-31');expect(old.closingFen).toBe(600000)
 h.at('2021-01-01',{work:false});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(200000);expect(projectPersonalYear(h.run.economy.ledger,2020,'2020-12-31')).toEqual(old)
},60000)
it('does not turn a selected lifestyle goal or an interrupted purchase into a completed environment',()=>{
 const h=new StoryHarness({seed:'t15-year-scene-fixed'});h.send('SetLifePriority',{year:2020,priority:'workspace'});const base=projectLife(h.run,campaignLife,campaignRuntime.pack)
 expect(base.scene.workspaceCompleted).toBe(false);expect(base.years[0]!.paidLifeCostFen).toBe(0)
 h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});expect(projectLife(h.run,campaignLife,campaignRuntime.pack).scene.workspaceCompleted).toBe(false);h.send('InterruptLifeWork',{jobId:h.run.life!.jobs[0]!.id});h.at('2020-01-08',{work:false})
 const failed=projectLife(h.run,campaignLife,campaignRuntime.pack);expect(failed.scene.workspaceCompleted).toBe(false);expect(failed.years[0]!.paidLifeCostFen).toBe(300000);expect(failed.years[0]!.completedJobs).toHaveLength(0)
 h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});h.at('2020-01-15',{work:false});const completed=projectLife(h.run,campaignLife,campaignRuntime.pack)
 expect(completed.scene).toMatchObject({workspaceCompleted:true,workspaceCompletedAt:'2020-01-15',workspaceCostFen:300000});expect(completed.years[0]!.paidLifeCostFen).toBe(600000)
},60000)
it('reading people/years/scenes never changes cash, AP, timeline or random and excludes private notes/hidden facts',()=>{
 const h=new StoryHarness({seed:'t15-year-readonly-fixed'});h.send('SetPrivateNote',{text:'PRIVATE-LIFE-NOTE-ONLY'});const before=h.codec.export(h.run),random=hashValue(h.run.random)
 for(let n=0;n<4;n++){const v=projectLife(h.run,campaignLife,campaignRuntime.pack),text=JSON.stringify(v);expect(text).not.toContain('PRIVATE-LIFE-NOTE-ONLY');expect(text).not.toContain('factId');expect(text).not.toContain('roll');expect(v.years.map(y=>y.year)).toEqual([2020]);expect(v.people.filter(p=>p.known).map(p=>p.id)).toEqual(['tang-ying'])}
 expect(h.codec.export(h.run)).toBe(before);expect(hashValue(h.run.random)).toBe(random)
})
it('shows an explicit overflow for valid repeated gross cash flows, never a false zero or unsafe integer',()=>{
 let ledger=createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2020-01-01')
 const post=(id:string,kind:'opening_cash'|'income'|'expense',date:string)=>{ledger=applyLedger(ledger,{id,kind,date,sourceEventId:id,accountId:'personal',counterpartyId:'world',amountFen:MONEY_LIMIT})}
 post('year-open','opening_cash','2020-01-01');post('year-spend1','expense','2020-01-02');post('year-income','income','2020-01-03');post('year-spend2','expense','2020-01-04')
 expect(projectPersonalYear(ledger,2020,'2020-01-04')).toMatchObject({openingFen:MONEY_LIMIT,receivedFen:MONEY_LIMIT,spentFen:null,closingFen:0,overflow:true})
})
it('cannot present an unobserved future part of a year as already committed annual cash',()=>{
 const h=new StoryHarness({seed:'t15-year-no-future-fixed'});expect(()=>projectPersonalYear(h.run.economy.ledger,2020,'2020-12-31')).toThrow('LIFE_REVIEW_FUTURE_PERIOD')
 expect(projectLife(h.run,campaignLife,campaignRuntime.pack).years[0]!.through).toBe('2020-01-01')
})
