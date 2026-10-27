import {beforeAll,expect,it} from 'vitest'
import {prepareEco,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {campaignMarket} from '../application/campaign.ts'
import {ecosystemContractCosts} from './ecosystem-contract-costs.ts'
import {ecosystemContractResponsibility} from './ecosystem-contract-responsibility.ts'
import type {Payable} from '../core/ledger.ts'

type Harness=ReturnType<typeof prepareEco>['h']
function capture(h:Harness){return {contract:projectDeepseek(h.run,h.deepseek)!.contracts[0]!,jobs:h.run.operations!.jobs,finance:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog).finance,date:h.run.timeline.cursor.date}}
type Capture=ReturnType<typeof capture>
const costs=(p:Capture)=>ecosystemContractCosts(p.contract,p.jobs,p.finance,p.date)
let planned:Capture,running:Capture,support:Capture,cancelled:Capture,rejected:Capture,remediation:Capture,remediationRunning:Capture
beforeAll(()=>{
 // Fixed isolated original rule fixtures. No normal-campaign or Native claim.
 const {h,lead}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});planned=capture(h)
 h.send('AdvanceTime',{date:'2024-07-02'});running=capture(h);h.send('AdvanceTime',{date:'2024-07-09'});h.send('SubmitEcoDelivery',{contractId:planned.contract.id});h.send('AdvanceTime',{date:'2024-07-12'});support=capture(h);h.send('CancelEcoContract',{contractId:planned.contract.id});cancelled=capture(h)
 const failed=prepareEco({parameters:{deliveryAcceptBps:0}}),x=failed.h;x.send('AcceptEcoContract',{leadId:failed.lead.id,scope:'pilot',...dsAssignment('2024-07-02')});const c=x.run.deepseek!.contracts[0]!
 x.send('AdvanceTime',{date:'2024-07-05'});x.send('SubmitEcoDelivery',{contractId:c.id});x.send('AdvanceTime',{date:'2024-07-08'});rejected=capture(x)
 x.send('StartEcoRemediation',{contractId:c.id,...dsAssignment('2024-07-09')});remediation=capture(x);x.send('AdvanceTime',{date:'2024-07-09'});remediationRunning=capture(x)
})

it('separates original reserved budgets from actual production and support payments without counting prepayment or compensation',()=>{
 expect(costs(planned)).toMatchObject({paidFen:0,reservedFen:150000,reason:null})
 expect(costs(running)).toMatchObject({paidFen:80000,reservedFen:70000,reason:null})
 expect(costs(support)).toMatchObject({paidFen:150000,reservedFen:0,reason:null})
 expect(costs(cancelled)).toMatchObject({paidFen:150000,reservedFen:0,reason:null})
 expect(support.contract.cancellationCompensationFen).toBe(60000)
 const account=support.contract.balance!.accountId
 expect(support.finance.find(f=>f.accountId===account)!.cashFen-cancelled.finance.find(f=>f.accountId===account)!.cashFen).toBe(60000)
})

it('keeps rejected production paid while the never-started original support is cancelled and separately reserves a real replacement',()=>{
 expect(rejected.contract.status).toBe('rejected');expect(rejected.contract.supportJob!.status).toBe('cancelled')
 expect(costs(rejected)).toMatchObject({paidFen:40000,reservedFen:0,reason:null})
 expect(remediation.contract.supportJobId).not.toBe(remediation.contract.originalSupportJobId)
 expect(costs(remediation)).toMatchObject({paidFen:40000,reservedFen:80000,reason:null})
 expect(costs(remediationRunning)).toMatchObject({paidFen:90000,reservedFen:30000,reason:null})
})

it('keeps missing cash history unknown while retaining an independently known support reservation',()=>{
 const finance=running.finance.map(f=>({...f,transactions:f.transactions.filter(t=>t.sourceId!==running.contract.productionJob!.actionId)}))
 expect(ecosystemContractCosts(running.contract,running.jobs,finance,running.date)).toMatchObject({paidFen:null,reservedFen:70000,reason:expect.any(String)})
 const missingHold=planned.finance.map(f=>({...f,reservations:[]}))
 expect(ecosystemContractCosts(planned.contract,planned.jobs,missingHold,planned.date)).toMatchObject({paidFen:0,reservedFen:null,reason:expect.any(String)})
})

it('rejects duplicate, missing or foreign source identity rather than assigning another contract or silently inventing zero',()=>{
 const job=running.contract.productionJob!,expense=running.finance.flatMap(f=>f.transactions).find(t=>t.sourceId===job.actionId&&t.amountFen<0)!
 const duplicated=running.finance.map(f=>f.accountId===running.contract.balance!.accountId?{...f,transactions:[...f.transactions,expense]}:f)
 expect(ecosystemContractCosts(running.contract,running.jobs,duplicated,running.date).paidFen).toBeNull()
 expect(ecosystemContractCosts(running.contract,running.jobs.filter(j=>j.id!==job.id),running.finance,running.date)).toMatchObject({paidFen:null,reservedFen:null})
 expect(ecosystemContractCosts(running.contract,[...running.jobs,job],running.finance,running.date)).toMatchObject({paidFen:null,reservedFen:null})
 expect(ecosystemContractCosts(running.contract,running.jobs,running.finance.filter(f=>f.accountId!==running.contract.balance!.accountId),running.date)).toMatchObject({paidFen:null,reservedFen:null})
 expect(ecosystemContractCosts(running.contract,running.jobs,running.finance,'2025-02-30')).toMatchObject({paidFen:null,reservedFen:null})
})

it('distinguishes real unfinished support and protected prepayment from a stopped contract with only its own receivable',()=>{
 expect(ecosystemContractResponsibility(planned.contract,planned.finance)).toMatchObject({known:true,hasResponsibility:true})
 expect(ecosystemContractResponsibility(support.contract,support.finance)).toMatchObject({known:true,unfinished:true,hasResponsibility:true})
 expect(cancelled.contract.balance!.receivableFen).toBeGreaterThan(0)
 expect(ecosystemContractResponsibility(cancelled.contract,cancelled.finance)).toMatchObject({known:true,payableFen:0,unfinished:false,hasResponsibility:false})
 expect(ecosystemContractResponsibility(cancelled.contract,undefined)).toMatchObject({known:false,hasResponsibility:true})
 const obligation:Payable={id:'local-unpaid',accountId:cancelled.contract.balance!.accountId,businessId:cancelled.contract.businessId,contractId:cancelled.contract.id,counterpartyId:cancelled.contract.personId,date:cancelled.date,sourceEventId:'isolated-original-expense',originOperationId:'isolated-original-payable',kind:'expense',amountFen:100,remainingFen:100,protectionReservationId:null}
 const finance=cancelled.finance.map(f=>({...f,obligations:[...f.obligations,obligation]}))
 expect(ecosystemContractResponsibility(cancelled.contract,finance)).toMatchObject({known:true,payableFen:100,hasResponsibility:true})
})
