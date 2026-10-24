import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRun,campaignRelay} from '../application/campaign.ts'
import {projectRelay,type RelayProjection} from '../core/relay-projection.ts'
import {accountPosition,metricsFor} from '../core/ledger.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import {RelayCommandDetails} from './RelayCommandDetails.tsx'

type Relay=NonNullable<RelayProjection>
// Public rendering examples only; these objects are never imported as a game history.
function display(){
 const run=createCampaignRun({runId:'relay-confirmation-display',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'relay-confirmation-display'})
 const r=projectRelay(run,campaignRelay)!,funds=accountPosition(run.economy.ledger,'personal')
 r.businesses=[{id:'relay-business',definitionId:'relay-station',route:'api_relay',accountId:'relay-account',company:true,lifecycle:'operating',prepared:true,activeFrom:'2025-01-01',stoppedAt:null,distributedFen:0,monthlyMaintenanceFen:30000,history:[],funds,metrics:{...metricsFor(run.economy.ledger,'personal','relay-business'),accruedCostFen:0}}]
 const customer=(id:string,mode:'prepaid'|'postpaid'):Relay['customers'][number]=>{
  const terms={id:'terms-'+id,effectiveAt:'2025-01-01',offerId:'managed_support' as const,unitPriceFen:6,serviceFeeFen:50000,sourceId:'offer-'+id}
  return {id,businessId:'relay-business',personId:'person-'+id,originAudienceId:'audience',originCohortIds:[],conversionId:'conversion-'+id,segment:'ai_learners',signedAt:'2025-01-01',initialTermEnd:'2025-03-31',termEnd:'2025-03-31',initialMode:mode,initialCreditLimitFen:100000,mode,creditLimitFen:100000,monthlyUnits:10000,rechargeLimitFen:400000,terms:[terms],closedAt:null,activeTerms:terms,balance:{prepaidFen:0,receivableFen:50000,recognizedIncomeFen:50000},dueReceivableFen:20000}
 }
 r.customers=[customer('first','prepaid'),customer('second','postpaid')]
 return r
}
const command:CommandEnvelope={runId:'display',actorId:'player',commandId:'service',expectedRevision:1,kind:'StartRelayServicePeriod',payload:{businessId:'relay-business',customerIds:['second','first'],supplierIds:['harbor-independent','cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:2800,maxSupplierCostFen:120000,supportMode:'guided',deploymentId:null}}
const render=(relay:Relay,cmd:CommandEnvelope=command)=>renderToStaticMarkup(<RelayCommandDetails command={cmd} relay={relay} workers={[]} accountName={id=>id==='relay-account'?'这家原中转企业':'另一账户'}/>)

it('captures the chosen customer and supplier order, and separates original service and future support commitments',()=>{
 const relay=display(),before=JSON.stringify(relay),html=render(relay)
 expect(html).toContain('这家原中转企业');expect(html.indexOf('客户2')).toBeLessThan(html.indexOf('客户1'))
 expect(html.indexOf('港湾独立供应')).toBeLessThan(html.indexOf('杉木直供'))
 expect(html).toContain('2025-01-28—2025-02-25');expect(html).toContain('¥3,000/1点/28日')
 expect(html).toContain('2025-02-25—2025-03-04');expect(html).toContain('¥1,500/1点/7日')
 expect(html).toContain('本次确认将同时预留');expect(html).not.toContain('已经同时预留')
 expect(html).toContain('不必再安排一次');expect(html).toContain('客户未消费充值仍受保护')
 expect(html).toContain('上限不是已发生用量、实际成本或收入');expect(JSON.stringify(relay)).toBe(before)
})

it('keeps unavailable resources and invalid dates visible without silently replacing the selected commitment',()=>{
 const html=render(display(),{...command,payload:{...command.payload as object,resources:['retired-worker'],startAt:'9999-12-31',supportMode:'self'}})
 expect(html).toContain('原资源现不可用（retired-worker）');expect(html).not.toContain('本人实际服务与支持时间')
 expect(html).toContain('9999-12-31');expect(html).toContain('完成日期待核对');expect(html).toContain('支持开始日期待核对')
 expect(html).toContain('¥0/2点/14日');expect(html).not.toContain('¥1,500/1点/7日')
})

it('states customer-wide due collection separately from outstanding future invoices and new income',()=>{
 const relay=display(),before=JSON.stringify(relay),html=render(relay,{...command,kind:'CollectRelayDue',payload:{customerId:'second'}})
 expect(html).toContain('¥200');expect(html).toContain('¥300原应收尚未到期')
 expect(html).toContain('客户2全部已到期原单');expect(html).toContain('可能跨多个账期')
 expect(html).toContain('更正新增单据按自己的原到期日');expect(html).toContain('回款不重复确认收入')
 expect(JSON.stringify(relay)).toBe(before)
})
