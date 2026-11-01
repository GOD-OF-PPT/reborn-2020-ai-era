import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {json,hash,verifySeal} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-40/capital-current-audit-r437'
const started=Date.now(),capture=json(root+'/capture.json'),source=json(root+'/source416.json')
const write=(name,data)=>fs.writeFileSync(root+'/'+name,JSON.stringify(data,null,2)+'\n',{flag:'wx'})
let phase='preflight'
try{
 const raw=fs.readFileSync(root+'/audit-input.json','utf8'),oldRaw=fs.readFileSync(capture.original372Path,'utf8'),journal=json(root+'/audit-journal.json')
 const sourceExact=()=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
 if(hash(raw)!==capture.sha256||hash(oldRaw)!==capture.original372Sha256||!sourceExact())throw Error('EXACT_CAPTURE_AND_SOURCE_REQUIRED')
 const oldProtection=json('goal-1/evidence/t17-acceptance-40/normal-capital-recovery-r432/preservation-after-reading436.json')
 for(const row of oldProtection.fullSeals)verifySeal(row.root)
 verifySeal('goal-1/evidence/t17-acceptance-40/scene-reading-r433')
 const at=name=>import(pathToFileURL(path.join(source.target,'src',name)).href)
 const [{createCampaignCodec,campaignRelay,campaignMarket,campaignDeepseek},{projectRun,fingerprintCommand},{projectRelay},{projectMarket},{projectDeepseek}]=await Promise.all([
  at('application/campaign.ts'),at('core/commands.ts'),at('core/relay-projection.ts'),at('core/market-projection.ts'),at('core/deepseek-projection.ts'),
 ])
 const codec=createCampaignCodec()
 phase='import-original372';console.log(JSON.stringify({phase,revision:372}))
 const old=codec.import(oldRaw)
 phase='import-actual-head';console.log(JSON.stringify({phase,revision:capture.inputRevision}))
 const run=codec.import(raw)
 if(run.origin!=='normal'||run.runId!==old.runId||run.seed!==old.seed||run.revision!==capture.inputRevision||!isDeepStrictEqual(run.versions,old.versions))throw Error('ORIGINAL_NORMAL_IDENTITY_REQUIRED')
 if(!isDeepStrictEqual(run.receipts.slice(0,old.receipts.length),old.receipts))throw Error('ORIGINAL372_RECEIPT_PREFIX_CHANGED')
 if(journal.length!==run.revision-old.revision||journal.length!==capture.journalRows)throw Error('JOURNAL_CONTINUOUS_RANGE_REQUIRED')
 const receipts=new Map(run.receipts.map(receipt=>[receipt.commandId,receipt])),seen=new Set(),checked=[]
 for(const [index,row] of journal.entries()){
  const expected=373+index,command=row.command,receipt=receipts.get(command.commandId),fingerprint=fingerprintCommand(run,command,codec.registry,run.actorId)
  if(seen.has(command.commandId)||row.revision!==expected||command.commandId!=='normal-capital-v2:'+expected||command.expectedRevision!==expected-1||command.runId!==run.runId||command.actorId!==run.actorId||!row.preview.allowed||receipt?.revisionBefore!==expected-1||receipt.revisionAfter!==expected||receipt.kind!==command.kind||receipt.date!==row.date||receipt.payloadSignature!==fingerprint.signature||receipt.payloadHash!==fingerprint.hash)throw Error('JOURNAL_RECEIPT_IDENTITY_MISMATCH:'+expected)
  seen.add(command.commandId);checked.push({revision:expected,date:row.date,commandId:command.commandId,kind:command.kind,payloadHash:fingerprint.hash})
 }
 if(journal.at(-1)?.sha256!==capture.sha256||journal.at(-1)?.bytes!==Buffer.byteLength(raw))throw Error('CAPTURE_LAST_JOURNAL_MISMATCH')
 phase='full-original-export';console.log(JSON.stringify({phase,revision:run.revision,journalChecked:checked.length}))
 if(codec.export(run)!==raw)throw Error('FULL_ORIGINAL_WIRE_ROUNDTRIP_CHANGED')
 const view=projectRun(run),relay=projectRelay(run,campaignRelay),market=projectMarket(run,campaignMarket.catalog),equity=projectDeepseek(run,campaignDeepseek)
 if(!relay||!market||!equity)throw Error('ORIGINAL_PUBLIC_PROJECTIONS_REQUIRED')
 const budget=view.budget
 if(budget.total!==4||![budget.available,budget.reserved,budget.spent].every(n=>Number.isSafeInteger(n)&&n>=0)||budget.available+budget.reserved+budget.spent!==budget.total)throw Error('PUBLIC_QUARTER_ACTION_BUDGET_INVALID')
 const businesses=relay.businesses.map(b=>{
  const customers=relay.customers.filter(c=>c.businessId===b.id),prepaidFen=customers.reduce((sum,c)=>sum+c.balance.prepaidFen,0)
  if(prepaidFen!==b.funds.prepaidLiabilityFen)throw Error('CUSTOMER_PROTECTION_AGGREGATE_MISMATCH:'+b.id)
  const sourceGaps=customers.filter(c=>!run.economy.ledger.contracts.some(row=>row.id===c.id&&row.accountId===b.accountId)).map(c=>c.id)
  return {id:b.id,accountId:b.accountId,lifecycle:b.lifecycle,funds:b.funds,metrics:b.metrics,distributedFen:b.distributedFen,customerCount:customers.length,customerPrepaidFen:prepaidFen,prepaidMatchesOriginalLedgerAggregate:true,customerBalanceSourceGaps:sourceGaps,periods:relay.periods.filter(p=>p.businessId===b.id).map(p=>({id:p.id,status:p.status,from:p.from,to:p.to,job:p.job,supportJob:p.supportJob}))}
 })
 const kinds=Object.fromEntries([...new Set(checked.map(row=>row.kind))].map(kind=>[kind,checked.filter(row=>row.kind===kind).length]))
 const personal=view.accounts.find(a=>a.accountId==='personal')
 if(!personal)throw Error('PERSONAL_PUBLIC_ACCOUNT_REQUIRED')
 const result={at:new Date().toISOString(),source:416,sourceRows:source.files.length,sourceExact:sourceExact(),inputRevision:372,savedRevision:run.revision,date:view.date,runId:run.runId,origin:run.origin,seed:run.seed,bytes:Buffer.byteLength(raw),sha256:hash(raw),stableCaptureAndJournalHeadExact:true,fullOriginalWireRoundTripExact:true,original372CompleteReceiptPrefixExact:true,newJournalRows:checked.length,allNormalizedCommandFingerprintsAndReceiptDatesExact:true,commandKinds:kinds,checkedCommands:checked,budget,personal,stockPositions:market.positions.filter(p=>p.accountId==='personal'),stockOrders:market.orders.filter(o=>o.accountId==='personal'&&['planned','pending','partially_filled'].includes(o.status)),businesses,counterfactualEnabledAt:equity.counterfactualEnabledAt,actualEquityAgreements:equity.agreements.map(a=>({id:a.id,accountId:a.accountId,businessId:a.businessId,board:a.board,shares:a.shares})),original53FullSealsExact:true,wallMs:Date.now()-started,readOnlyAudit:true,authorCanonicalFileSaveOnly:true,newGameCommands:0,newNative:0,newIndexedDbWrites:0,normalBoardComplete:false,wholeU6Complete:false,compatibility:0}
 if(!result.sourceExact)throw Error('SOURCE_CHANGED_DURING_AUDIT')
 write('result.json',result)
 console.log(JSON.stringify({phase:'audited',savedRevision:run.revision,date:view.date,rows:checked.length,wireExact:true,prefix372Exact:true,budget,personalAvailableFen:personal.availableFen,personalMarkedInvestmentValueFen:personal.investmentValueFen,businesses:businesses.map(b=>({id:b.id,cashFen:b.funds.cashFen,availableFen:b.funds.availableFen,customerPrepaidFen:b.customerPrepaidFen,protectionShortfallFen:b.funds.protectionShortfallFen})),wallMs:result.wallMs}))
}catch(error){
 write('failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error instanceof Error?error.stack:null,wallMs:Date.now()-started,scope:'Independent audit failure; no game commands, no running driver changes',compatibility:0})
 throw error
}
