import {beforeAll,expect,it} from 'vitest'
import source from '../../goal-1/evidence/t17-acceptance-17/prefix-r2/technical_employee-t16-campaign-0/prefix-final.json?raw'
import {createCampaignCodec,campaignRelay} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import {applyLedger,type MetricEntry} from '../core/ledger.ts'
import {projectRelay} from '../core/relay-projection.ts'
import type {GameRun} from '../core/run-types.ts'
import {assertRelayShapeMoney,assessRelayShape,relayShapePeriodFeeEntries} from './relay-shape-assertions.ts'
import {RELAY_CORE_CHECKPOINTS,RELAY_SHAPES} from './relay-shape-types.ts'

const shape=RELAY_SHAPES.find(s=>s.supplierId==='cedar-reseller'&&s.offerKind==='low_margin'&&s.customerMode==='prepaid'&&s.supportMode==='guided')!
let original:GameRun,funded:GameRun
beforeAll(()=>{
 const codec=createCampaignCodec();original=codec.import(source)
 let run=original
 const send=(kind:string,payload:unknown)=>{
  const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'shape-boundary-'+run.revision,expectedRevision:run.revision,kind,payload},codec.registry,run.actorId)
  if(result.status!=='proposed')throw Error('SHAPE_BOUNDARY_ORIGINAL_COMMAND_REFUSED:'+kind)
  run=codec.import(codec.export(result.nextRun))
 }
 send('AdvanceTime',{date:'2025-01-11'})
 const relay=projectRelay(run,campaignRelay)!,business=relay.businesses[0]!,audience=relay.audiences[0]!,personId=audience.members.find(id=>!relay.customers.some(c=>c.personId===id))!,offer=relay.offers.find(o=>o.offerId==='low_margin')!
 send('SignRelayCustomers',{businessId:business.id,audienceId:audience.id,offerId:offer.id,personIds:[personId],termEnd:'2025-03-31',mode:'prepaid',creditLimitFen:0})
 const customer=run.relay!.customers.at(-1)!
 send('RechargeRelayCustomer',{customerId:customer.id,amountFen:customer.rechargeLimitFen})
 funded=run
},20000)

it('does not reuse the P1 customer, completed period or fee as this untouched shape result',()=>{
 const before=JSON.stringify(original),result=assessRelayShape(original,original,shape)
 expect(result.target.customerId).toBeNull();expect(result.target.periodId).toBeNull();expect(result.positive).toBe(false)
 expect(result.checkpoints.map(c=>c.name)).toEqual(RELAY_CORE_CHECKPOINTS)
 expect(result.checkpoints.slice(1).every(c=>c.status==='not_reached')).toBe(true)
 expect(result.money.target.periodFeeFen).toBe(0);expect(result.money.target.incomeFen).toBe(0)
 expect(JSON.stringify(original)).toBe(before)
})

it('keeps period fees separate from a meter, old period and another business',()=>{
 const entry:MetricEntry={operationId:'fee',sourceEventId:'this-period',businessId:'this-business',contractId:'new-customer',referenceId:'quoted-terms',accountId:'company',kind:'income',date:'2025-02-16',deltaFen:50000}
 const entries=[entry,{...entry,sourceEventId:'this-meter'},{...entry,sourceEventId:'old-P1-period'},{...entry,businessId:'other-business'},{...entry,date:'2025-03-01'}]
 expect(relayShapePeriodFeeEntries(entries,'this-business','this-period','2025-02-27')).toEqual([entry])
 expect(relayShapePeriodFeeEntries(entries,'this-business',null,'2025-02-27')).toEqual([])
})

it('accepts the accounting identities of prepaid correction receivables and a prepaid supplier correction payable without claiming a business chain',()=>{
 const business=funded.operations!.businesses.find(b=>b.definitionId==='relay-station')!,customer=funded.relay!.customers.at(-1)!,batch=funded.relay!.recharges.at(-1)!,pool=campaignRelay.poolId(business.id,'cedar-reseller')
 // A bounded accounting window built with original ledger operations. These
 // entries are not encoded or claimed to be a complete relay game history.
 let ledger=funded.economy.ledger
 ledger=applyLedger(ledger,{id:'public-billed-use',kind:'deliver_prepaid',sourceEventId:'public-meter',date:'2025-01-11',accountId:business.accountId,businessId:business.id,contractId:customer.id,referenceId:batch.operationId,amountFen:batch.amountFen})
 ledger=applyLedger(ledger,{id:'public-correction-credit',kind:'deliver_on_credit',sourceEventId:'public-meter',date:'2025-01-11',accountId:business.accountId,businessId:business.id,contractId:customer.id,counterpartyId:'world',amountFen:100})
 ledger=applyLedger(ledger,{id:'supplier-topup',kind:'supplier_prepay',sourceEventId:'cedar-reseller',date:'2025-01-11',accountId:business.accountId,businessId:business.id,counterpartyId:'world',prepaymentId:pool,amountFen:400000})
 ledger=applyLedger(ledger,{id:'supplier-consumed',kind:'consume_supplier',sourceEventId:'public-meter',date:'2025-01-11',accountId:business.accountId,businessId:business.id,prepaymentId:pool,amountFen:1000})
 ledger=applyLedger(ledger,{id:'supplier-correction',kind:'incur_supplier_usage',sourceEventId:'public-meter',referenceId:'supplier-consumed',date:'2025-01-11',accountId:business.accountId,businessId:business.id,counterpartyId:'world',prepaymentId:pool,obligationId:'correction-supplier-due',dueAt:'2025-01-18',amountFen:50})
 const run:GameRun={...funded,economy:{...funded.economy,ledger},relay:{...funded.relay!,recharges:funded.relay!.recharges.map(r=>r.id===batch.id?{...r,usedFen:r.amountFen}:r),receivables:[...funded.relay!.receivables,{id:'correction-customer-due',customerId:customer.id,sourceId:'public-meter',date:'2025-01-11',dueAt:'2025-01-25',operationId:'public-correction-credit',amountFen:100,collectedFen:0,reversedFen:0}]}}
 const result=assertRelayShapeMoney(original,run,shape),company=result.accounts.find(a=>a.accountId===business.accountId)!
 expect(result.target.remainingReceivableFen).toBe(100)
 expect(company.supplierPrepaidFen).toBe(399000);expect(company.payableFen).toBe(50)
 expect(assessRelayShape(original,run,shape).positive).toBe(false)
})

it('rejects changed P1 meter evidence and unexplained cash without mutating the original',()=>{
 const before=JSON.stringify(original),oldMeter=original.relay!.meters[0]!
 const altered:GameRun={...funded,relay:{...funded.relay!,meters:funded.relay!.meters.map(m=>m.id===oldMeter.id?{...m,reportedUnits:m.reportedUnits+1}:m)}}
 expect(()=>assertRelayShapeMoney(original,altered,shape)).toThrow('RELAY_SHAPE_OLD_METERS_CHANGED')
 const cash:GameRun={...funded,economy:{...funded.economy,ledger:{...funded.economy.ledger,accounts:funded.economy.ledger.accounts.map(a=>a.id==='personal'?{...a,balanceFen:a.balanceFen+1}:a)}}}
 expect(()=>assertRelayShapeMoney(original,cash,shape)).toThrow('RELAY_SHAPE_CASH_DELTA_MISMATCH')
 expect(JSON.stringify(original)).toBe(before)
})

it('accepts a supplier credit restored by correcting an already paid postpaid invoice',()=>{
 const business=funded.operations!.businesses.find(b=>b.definitionId==='relay-station')!,pool='boundary-postpaid-credit'
 let ledger=funded.economy.ledger
 ledger=applyLedger(ledger,{id:'postpaid-supplier-use',kind:'incur_supplier_usage',sourceEventId:'public-meter',date:'2025-01-11',accountId:business.accountId,businessId:business.id,counterpartyId:'world',prepaymentId:pool,obligationId:'postpaid-due',dueAt:'2025-01-11',amountFen:100})
 ledger=applyLedger(ledger,{id:'postpaid-paid',kind:'pay_obligation',sourceEventId:'postpaid-due',date:'2025-01-11',accountId:business.accountId,businessId:business.id,obligationId:'postpaid-due',amountFen:100})
 ledger=applyLedger(ledger,{id:'postpaid-corrected',kind:'reverse_supplier_usage',sourceEventId:'public-meter',referenceId:'postpaid-supplier-use',date:'2025-01-11',accountId:business.accountId,businessId:business.id,prepaymentId:pool,amountFen:100})
 const run:GameRun={...funded,economy:{...funded.economy,ledger}}
 expect(ledger.supplierPrepayments.find(p=>p.id===pool)).toMatchObject({paidFen:100,remainingFen:100})
 expect(assertRelayShapeMoney(original,run,shape).accounts.find(a=>a.accountId===business.accountId)!.supplierPrepaidFen).toBe(100)
 expect(assessRelayShape(original,run,shape).positive).toBe(false)
})
