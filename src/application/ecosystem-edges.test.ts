import {expect,it} from 'vitest'
import {prepareEco,dsAssignment} from '../testing/deepseek-scenarios.ts'
import {createDeepseekFixture} from '../testing/deepseek-fixture.ts'
import {accountFunds,metricsFor} from '../core/ledger.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {hashValue} from '../core/hash.ts'
it('requires actual technical learning for the content background, without granting early model access',()=>{const h=createDeepseekFixture({backgroundId:'content_employee'});expect(h.preview('OpenEcosystemService',{capitalFen:1000000}).allowed).toBe(false);h.send('AdvanceTime',{date:'2024-05-06'});h.send('OpenEcosystemService',{capitalFen:2000000});const b=h.run.operations!.businesses.at(-1)!;expect(h.preview('StartEcosystemAdaptation',{businessId:b.id,modelId:'v2',productId:'training',acceptSimulationTerms:true,...dsAssignment('2024-05-06')}).allowed).toBe(false);h.send('StartEcosystemPreparation',{businessId:b.id,preparation:'basics',...dsAssignment('2024-05-06')});expect(h.deepseek.hasEntitlement(h.run,'player','basic_programming','2024-05-06')).toBe(false);h.send('AdvanceTime',{date:'2024-05-13'});expect(h.deepseek.hasEntitlement(h.run,'player','basic_programming','2024-05-13')).toBe(true)},60000)
it('keeps the original customer prepayment on rejected production until explicit refund and retains paid costs',()=>{const {h,lead,b}=prepareEco({parameters:{deliveryAcceptBps:0}});h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});const c=h.run.deepseek!.contracts[0]!;h.send('AdvanceTime',{date:'2024-07-09'});h.send('SubmitEcoDelivery',{contractId:c.id});h.send('AdvanceTime',{date:'2024-07-12'});expect(h.run.deepseek!.contracts[0]!.status).toBe('rejected');expect(h.run.economy.ledger.contracts[0]!.prepaidFen).toBe(300000);expect(h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.status).toBe('cancelled');const before=accountFunds(h.run.economy.ledger,b.accountId).cashFen;h.send('CancelEcoContract',{contractId:c.id});expect(accountFunds(h.run.economy.ledger,b.accountId).cashFen).toBe(before-300000);expect(h.run.economy.ledger.contracts[0]!.prepaidFen).toBe(0);expect(h.run.deepseek!.deliveries).toHaveLength(0)},60000)
it('defaults unsubmitted work to a real limited refund and cannot call it accepted delivery',()=>{const {h,lead}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});h.send('AdvanceTime',{date:'2024-07-19'});expect(h.run.deepseek!.contracts[0]!.status).toBe('cancelled');expect(h.run.deepseek!.refunds).toHaveLength(1);expect(h.run.deepseek!.deliveries).toHaveLength(0);expect(h.run.operations!.jobs.find(j=>j.id===h.run.deepseek!.contracts[0]!.productionJobId)!.status).toBe('completed')},60000)
it('keeps delivery support obligations when new service is paused and refuses to close the company early',()=>{const {h,lead,b}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});h.send('StopEcosystemService',{businessId:b.id});expect(h.run.operations!.businesses.find(v=>v.id===b.id)!.lifecycle).toBe('paused');expect(h.preview('CloseBusiness',{businessId:b.id}).allowed).toBe(false);expect(h.run.deepseek!.contracts[0]!.status).toBe('production');h.send('AdvanceTime',{date:'2024-07-09'});h.send('SubmitEcoDelivery',{contractId:h.run.deepseek!.contracts[0]!.id});h.send('AdvanceTime',{date:'2024-07-19'});expect(h.run.deepseek!.contracts[0]!.status).toBe('completed')},60000)
it('does not charge the same person twice for the same model service when a second lead is forged by another studio',()=>{const {h,lead}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});expect(h.preview('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')}).reasonCodes).toContain('ECO_LEAD_NOT_OPEN');expect(h.run.deepseek!.contracts.filter(c=>c.personId===lead.personId)).toHaveLength(1)},60000)
it('has an explicit cheaper pilot with fewer production days and preserves all money on preview',()=>{const {h,lead,b}=prepareEco({},'deployment'),before=hashValue(h.run);const standard=h.preview('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')}),pilot=h.preview('AcceptEcoContract',{leadId:lead.id,scope:'pilot',...dsAssignment('2024-07-02')});expect(standard.upfrontCostFen).toBe(300000);expect(pilot.upfrontCostFen).toBe(150000);expect(standard.actionPoints).toBe(3);expect(pilot.actionPoints).toBe(2);expect(hashValue(h.run)).toBe(before);h.send('AcceptEcoContract',{leadId:lead.id,scope:'pilot',...dsAssignment('2024-07-02')});expect(h.run.deepseek!.contracts[0]!.priceFen).toBe(600000);expect(h.run.operations!.jobs.find(j=>j.id===h.run.deepseek!.contracts[0]!.productionJobId)!.completeAt).toBe('2024-07-09');expect(accountFunds(h.run.economy.ledger,b.accountId).availableFen).toBeGreaterThan(0)},60000)

it('does not use a training adaptation for deployment or cover service beyond its permission period',()=>{const {h,b}=prepareEco({},'deployment');h.send('AdvanceTime',{date:'2025-04-01'});expect(h.preview('StartEcoOutreach',{businessId:b.id,modelId:'v2',productId:'training',mode:'paid',sourceCohortIds:[],...dsAssignment('2025-04-01')}).reasonCodes).toContain('ECO_PURPOSE_ADAPTATION_REQUIRED');h.send('StartEcoOutreach',{businessId:b.id,modelId:'v2',productId:'deployment',mode:'paid',sourceCohortIds:[],...dsAssignment('2025-04-01')});h.send('AdvanceTime',{date:'2025-04-08'});const l=h.run.deepseek!.leads.at(-1)!;expect(h.preview('AcceptEcoContract',{leadId:l.id,scope:'standard',...dsAssignment('2025-05-15')}).reasonCodes).toContain('ECO_PURPOSE_ADAPTATION_REQUIRED')},60000)
it('cannot start a specialist qualification or financing job through the generic internal-job command',()=>{const {h,b}=prepareEco();expect(h.preview('StartInternalJob',{businessId:b.id,definitionId:'deepseek-diligence',...dsAssignment('2024-07-01')}).reasonCodes).toContain('ROUTE_COMMAND_REQUIRED')},60000)

it('reuses the frozen review fact after paid remediation, reserves fresh support and collects only real completed work',()=>{
 const {h,lead,b}=prepareEco({parameters:{deliveryAcceptBps:2500}}),beforeCost=metricsFor(h.run.economy.ledger,b.accountId,b.id).costFen
 h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});const original=h.run.deepseek!.contracts[0]!,reviewRoll=h.run.facts.find(f=>f.id===original.reviewFactId)!.roll
 // Fixed fixture seed and predeclared parameters exercise failure then remediation; no normal-run seed substitution.
 expect(reviewRoll).toBe(2060377760)
 h.send('AdvanceTime',{date:'2024-07-09'});h.send('SubmitEcoDelivery',{contractId:original.id});h.send('AdvanceTime',{date:'2024-07-12'})
 expect(h.run.deepseek!.contracts[0]!.status).toBe('rejected');expect(h.run.deepseek!.deliveries).toHaveLength(0)
 expect(h.run.operations!.jobs.find(j=>j.id===original.originalSupportJobId)!.status).toBe('cancelled')
 h.send('StartEcoRemediation',{contractId:original.id,...dsAssignment('2024-07-13')});const remediated=h.run.deepseek!.contracts[0]!
 expect(remediated.supportJobId).not.toBe(original.originalSupportJobId)
 h.send('AdvanceTime',{date:'2024-07-20'});expect(h.run.deepseek!.deliveries).toHaveLength(0)
 h.send('SubmitEcoDelivery',{contractId:original.id});h.send('AdvanceTime',{date:'2024-07-23'})
 expect(h.run.deepseek!.contracts[0]!.status).toBe('support');expect(h.run.economy.ledger.contracts[0]!.recognizedIncomeFen).toBe(480000)
 expect(h.run.facts.find(f=>f.id===original.reviewFactId)!.roll).toBe(reviewRoll)
 h.send('AdvanceTime',{date:'2024-07-30'});expect(h.run.deepseek!.contracts[0]!.status).toBe('completed')
 expect(h.run.operations!.jobs.find(j=>j.id===original.originalSupportJobId)!.status).toBe('cancelled')
 expect(h.run.deepseek!.deliveries.map(d=>[d.stage,d.date])).toEqual([['production','2024-07-23'],['support','2024-07-30']])
 expect(metricsFor(h.run.economy.ledger,b.accountId,b.id).costFen-beforeCost).toBe(200000)
 for(const d of h.run.deepseek!.deliveries){if(d.dueAt>h.run.timeline.cursor.date)h.send('AdvanceTime',{date:d.dueAt});h.send('CollectEcoReceivable',{deliveryId:d.id,amountFen:d.creditFen})}
 expect(h.run.economy.ledger.contracts[0]!.recognizedIncomeFen).toBe(600000);expect(h.run.economy.ledger.contracts[0]!.receivableFen).toBe(0)
 expect(h.run.deepseek!.collections.reduce((n,c)=>n+c.amountFen,0)).toBe(300000)
},60000)
it('previews the support cancellation compensation and keeps earned production income without inventing another prepayment refund',()=>{
 const {h,lead,b}=prepareEco();h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...dsAssignment('2024-07-02')});const c=h.run.deepseek!.contracts[0]!
 h.send('AdvanceTime',{date:'2024-07-09'});h.send('SubmitEcoDelivery',{contractId:c.id});h.send('AdvanceTime',{date:'2024-07-12'})
 const before=hashValue(h.run),cash=accountFunds(h.run.economy.ledger,b.accountId).cashFen,cost=metricsFor(h.run.economy.ledger,b.accountId,b.id).costFen
 expect(h.preview('CancelEcoContract',{contractId:c.id}).upfrontCostFen).toBe(60000)
 expect(projectDeepseek(h.run,h.deepseek)!.contracts[0]!.cancellationCompensationFen).toBe(60000);expect(hashValue(h.run)).toBe(before)
 h.send('CancelEcoContract',{contractId:c.id});expect(accountFunds(h.run.economy.ledger,b.accountId).cashFen).toBe(cash-60000)
 expect(metricsFor(h.run.economy.ledger,b.accountId,b.id).costFen-cost).toBe(60000);expect(h.run.deepseek!.refunds).toHaveLength(0)
 expect(h.run.economy.ledger.contracts[0]!.recognizedIncomeFen).toBe(480000);expect(h.run.economy.ledger.contracts[0]!.prepaidFen).toBe(0)
 expect(h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.status).toBe('interrupted');expect(h.run.deepseek!.contracts[0]!.status).toBe('cancelled')
 expect(h.preview('CancelEcoContract',{contractId:c.id}).allowed).toBe(false)
},60000)
