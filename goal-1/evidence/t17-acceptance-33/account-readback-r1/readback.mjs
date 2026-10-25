import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const output=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(output,'../../../..'),root=path.resolve(output,'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const put=(name,value)=>{guard(output);fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})};
function read(name){const absolute=path.resolve(repo,name),stat=fs.lstatSync(absolute);if(!stat.isFile()||stat.isSymbolicLink())throw Error('REGULAR_INPUT_REQUIRED:'+name);const bytes=fs.readFileSync(absolute);return {bytes,identity:{path:name,bytes:bytes.length,sha256:sha(bytes),mode:stat.mode&0o777}}}
function sources(){const names=[];const walk=dir=>{for(const entry of fs.readdirSync(path.join(repo,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const name=dir+'/'+entry.name;if(entry.isSymbolicLink())throw Error('SOURCE_SYMLINK_NOT_FOLLOWED:'+name);if(entry.isDirectory())walk(name);else if(entry.isFile()&&entry.name.endsWith('.ts')&&!entry.name.includes('.test.'))names.push(name)}};for(const dir of ['src/core','src/application','src/content','src/persistence'])walk(dir);names.push('scripts/verify_normal_browser_exports.ts','scripts/evidence-output.ts');return names.sort().map(name=>read(name).identity)}
function inputs(){
 const names=['chrome-main-r1','chrome-atomic-r1'],identities=[],records=[];
 for(const folder of names){
  const manifest='goal-1/evidence/t17-acceptance-33/'+folder+'/exports.jsonl',data=read(manifest);identities.push(data.identity);
  const rows=data.bytes.toString('utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));
  for(let index=0;index<rows.length;index++){
   const row=rows[index];if(folder==='chrome-main-r1'&&row.file!=='r5-saved91-full-service-closed.json')continue;
   if(typeof row.file!=='string'||path.basename(row.file)!==row.file||!/^[a-zA-Z0-9_.-]+\.json$/.test(row.file))throw Error('REGISTERED_FILENAME_REQUIRED');
   const role=row.source?.match(/^(SAVED_UI|PHYSICAL_READONLY|IMPORT_BUFFER|UNSAVED_CANDIDATE):/)?.[1]?.toLowerCase();
   if(!role||row.origin!==role)throw Error('EXPLICIT_MATCHING_ROLE_REQUIRED:'+row.file);
   const name='goal-1/evidence/t17-acceptance-33/'+folder+'/'+row.file,raw=read(name),header=JSON.parse(raw.bytes.toString('utf8'));
   if(raw.identity.bytes!==row.bytes||raw.identity.sha256!==row.sha256||row.runId!==header.runId||row.revision!==header.revision)throw Error('REGISTERED_RAW_MISMATCH:'+row.file);
   identities.push(raw.identity);records.push({manifest,line:index+1,role,source:row.source,identity:raw.identity,publicHeader:{runId:header.runId,revision:header.revision,schemaVersion:header.schemaVersion,rulesVersion:header.rulesVersion,contentHash:header.contentHash}});
  }
 }
 if(records.filter(row=>row.manifest.includes('chrome-main-r1')).length!==1)throw Error('EXACT_REQUESTED_MAIN91_REQUIRED');
 const seen=new Set();for(const row of records){if(seen.has(row.identity.path))throw Error('DUPLICATE_REGISTERED_INPUT');seen.add(row.identity.path)}
 return {records,identities:identities.sort((a,b)=>a.path.localeCompare(b.path)),scope:'Only requested main91 plus every currently registered atomic export; other live Chrome folders are outside this readback, not silently frozen.'};
}
const checks=[],errors=[],groups=new Map(),rows=[];
let beforeSources=null,beforeInput=null,p3Before=null,extraBefore=null,report=null;
const check=(name,passed,actual,expected)=>checks.push({name,passed:passed===true,actual,expected});
const lastPublicReceipt=receipt=>receipt?{kind:receipt.kind,commandId:receipt.commandId,revisionBefore:receipt.revisionBefore,revisionAfter:receipt.revisionAfter,date:receipt.date,payload:JSON.parse(receipt.payloadSignature).payload}:null;
try{
 guard(output);if(fs.existsSync(path.join(output,'result.json')))throw Error('READBACK_ALREADY_EXECUTED');
 beforeSources=sources();if(beforeSources.length!==126)throw Error('ORIGINAL_126_OFFICIAL_SOURCES_REQUIRED');
 const baseline=JSON.parse(read('goal-1/evidence/t17-acceptance-33/baseline.json').bytes),contract=JSON.parse(read('goal-1/evidence/t17-acceptance-33/audit-preparation-r1/official-source-contract-r1.json').bytes);
 if(!same(beforeSources,contract.officialSources))throw Error('OFFICIAL_SOURCE_CONTRACT_CHANGED');
 p3Before=baseline.p3.map(expected=>{const actual=read(expected.path).identity;if(!same(actual,expected))throw Error('P3_BASELINE_CHANGED:'+expected.path);return actual});if(p3Before.length!==26||!same(p3Before,contract.p3))throw Error('ORIGINAL_26_P3_REQUIRED');
 extraBefore=['goal-1/evidence/t17-acceptance-33/baseline.json','goal-1/evidence/t17-acceptance-33/audit-preparation-r1/official-source-contract-r1.json','goal-1/evidence/t17-acceptance-33/account-readback-r1/readback.mjs','goal-1/evidence/t17-acceptance-33/account-readback-r1/run-once.mjs','scripts/browser_evidence_guard.mjs','goal-1/evidence/t17-acceptance-33/native-inputs-atomic-r1.json'].map(name=>read(name).identity);
 beforeInput=inputs();put('source-before.json',{at:new Date().toISOString(),officialSourceCount:beforeSources.length,officialSources:beforeSources,p3:p3Before,extraReferences:extraBefore});put('input-before.json',beforeInput);
 const {createCampaignCodec}=await import('../../../../src/application/campaign.ts');
 const {projectRun}=await import('../../../../src/core/commands.ts');
 const codec=createCampaignCodec(),project=codec.registry.runtime?.project;if(typeof project!=='function')throw Error('OFFICIAL_PUBLIC_PROJECT_REQUIRED');
 for(const record of beforeInput.records){
  let group=groups.get(record.identity.sha256);
  if(!group){
   const bytes=read(record.identity.path).bytes,raw=bytes.toString('utf8'),run=codec.import(raw);
   if(codec.export(run)!==raw)throw Error('ORIGINAL_CODEC_ROUNDTRIP_MISMATCH:'+record.identity.path);
   const view=projectRun(run),features=project.call(codec.registry.runtime,run);
   if(codec.export(run)!==raw)throw Error('PUBLIC_PROJECTION_CHANGED_IMPORTED_RUN:'+record.identity.path);
   const relay=features.relay;if(!relay)throw Error('PUBLIC_RELAY_REQUIRED');
   const business=relay.businesses.find(row=>row.definitionId==='relay-station');if(!business)throw Error('ORIGINAL_RELAY_BUSINESS_REQUIRED');
   const period=relay.periods.find(row=>row.businessId===business.id)??null,finance=features.workbench.finance.find(row=>row.accountId===business.accountId);
   if(!finance)throw Error('ORIGINAL_PUBLIC_ACCOUNT_REQUIRED');
   const creation=run.receipts[0],creationIdentity=sha(JSON.stringify({runId:view.runId,signature:creation.payloadSignature,commandId:creation.commandId,versions:run.versions}));
   group={raw,run,view,features,relay,business,period,finance,creationIdentity};groups.set(record.identity.sha256,group);
  }
  const publicSummary={runId:group.view.runId,origin:group.view.origin,phase:group.view.phase,revision:group.view.revision,date:group.view.date,budget:group.view.budget,business:{id:group.business.id,accountId:group.business.accountId,lifecycle:group.business.lifecycle,funds:group.business.funds,metrics:group.business.metrics},period:group.period,customers:group.relay.customers,publicSupplies:group.relay.supplyOptions,lastReceipt:lastPublicReceipt(group.run.receipts.at(-1)),creationIdentity:group.creationIdentity};
  rows.push({...record,publicSummary});
 }
 const get=file=>{const found=rows.filter(row=>path.basename(row.identity.path)===file);if(found.length!==1)throw Error('EXACT_REGISTERED_INPUT_REQUIRED:'+file);const row=found[0];return {row,...groups.get(row.identity.sha256)}};
 const main=get('r5-saved91-full-service-closed.json'),buffer=get('atomic-import-buffer80.json'),old=get('atomic-saved81-after-abort.json'),oldPhysical=get('atomic-physical-old81-independent.json'),candidate=get('atomic-unsaved-candidate82.json'),newPhysical=get('atomic-physical-new82-independent.json'),stopped=get('atomic-saved83-period-stopped-support-kept.json');
 check('allInputsNormalPlaying',rows.every(row=>row.publicSummary.origin==='normal'&&row.publicSummary.phase==='playing'),rows.map(row=>({file:path.basename(row.identity.path),origin:row.publicSummary.origin,phase:row.publicSummary.phase})),'normal/playing');
 check('sameOriginalNormalCreation',rows.every(row=>row.publicSummary.creationIdentity===main.creationIdentity),[...new Set(rows.map(row=>row.publicSummary.creationIdentity))],'one same original Create identity');
 check('old81EqualsIndependentPhysical81',old.raw===oldPhysical.raw,{old:old.row.identity.sha256,physical:oldPhysical.row.identity.sha256},'entire bytes equal');
 check('candidate82EqualsIndependentPhysical82',candidate.raw===newPhysical.raw,{candidate:candidate.row.identity.sha256,physical:newPhysical.row.identity.sha256},'entire bytes equal');
 check('physicalOldAndNewRemainDifferent',old.raw!==newPhysical.raw,true,'different full raw bytes');
 check('atomic81AddsOnePlanToOriginal80',old.run.receipts.length===buffer.run.receipts.length+1&&same(old.run.receipts.slice(0,-1),buffer.run.receipts)&&old.run.receipts.at(-1).kind==='StartRelayServicePeriod',lastPublicReceipt(old.run.receipts.at(-1)),'original80 prefix + one StartRelayServicePeriod');
 check('advance81to82Only',candidate.run.receipts.length===old.run.receipts.length+1&&same(candidate.run.receipts.slice(0,-1),old.run.receipts)&&candidate.run.receipts.at(-1).kind==='AdvanceTime'&&old.view.revision===81&&candidate.view.revision===82,lastPublicReceipt(candidate.run.receipts.at(-1)),'one original AdvanceTime 81→82');
 check('stop82to83Only',stopped.run.receipts.length===candidate.run.receipts.length+1&&same(stopped.run.receipts.slice(0,-1),candidate.run.receipts)&&stopped.run.receipts.at(-1).kind==='StopRelayPeriod'&&stopped.view.revision===83,lastPublicReceipt(stopped.run.receipts.at(-1)),'one StopRelayPeriod 82→83');
 check('sameAtomicOriginalPeriod',[candidate,stopped].every(item=>item.period?.id===old.period?.id),[old.period?.id,candidate.period?.id,stopped.period?.id],'same original period ID');
 check('serviceActuallyStarts',old.period?.job?.status==='planned'&&candidate.period?.job?.status==='running'&&candidate.period.job.startAt===candidate.view.date,{old:old.period?.job,new:candidate.period?.job},'planned→running at original date');
 const expenseRows=candidate.finance.transactions.filter(tx=>tx.sourceId===candidate.period.jobId&&tx.amountFen<0&&!old.finance.transactions.some(previous=>previous.id===tx.id));
 check('service300000ActuallyPaidOnce',expenseRows.length===1&&expenseRows[0].amountFen===-300000&&candidate.business.funds.cashFen===old.business.funds.cashFen-300000,{newExpenseRows:expenseRows,cashBefore:old.business.funds.cashFen,cashAfter:candidate.business.funds.cashFen},'-300000fen once');
 check('serviceAPTransfersReservedToSpent',old.view.budget.available===1&&old.view.budget.reserved===2&&candidate.view.budget.spent===old.view.budget.spent+1&&candidate.view.budget.reserved===old.view.budget.reserved-1&&candidate.view.budget.available===old.view.budget.available,{before:old.view.budget,after:candidate.view.budget},'one reserved point becomes spent, no free AP');
 check('serviceStopsWithoutCompleting',stopped.period?.status==='stopped'&&stopped.period.stoppedAt===stopped.view.date&&stopped.period.job?.status==='interrupted',stopped.period,'stopped/interrupted, same current date');
 check('stopDoesNotReturnSpentCashOrAP',same(candidate.view.budget,stopped.view.budget)&&same(candidate.business.funds,stopped.business.funds)&&same(candidate.business.metrics,stopped.business.metrics),{before:{budget:candidate.view.budget,funds:candidate.business.funds,metrics:candidate.business.metrics},after:{budget:stopped.view.budget,funds:stopped.business.funds,metrics:stopped.business.metrics}},'unchanged actual money/AP/cost');
 const supportReservations=item=>item.finance.reservations.filter(row=>row.originId===item.period.supportJob.actionId&&row.amountFen>0);
 check('support150000And1APStillPlanned',same(candidate.period.supportJob,stopped.period.supportJob)&&stopped.period.supportJob?.status==='planned'&&stopped.period.supportMode==='guided'&&supportReservations(stopped).reduce((sum,row)=>sum+row.amountFen,0)===150000&&stopped.view.budget.reserved===1,{job:stopped.period.supportJob,reservations:supportReservations(stopped),budget:stopped.view.budget},'same planned guided support,150000fen/1AP reserved');
 check('sameProtected18792AndARAP1208',[candidate,stopped].every(item=>item.business.funds.prepaidLiabilityFen===18792&&item.business.funds.receivableFen===1208&&item.business.funds.payableFen===1208),[candidate,stopped].map(item=>({revision:item.view.revision,funds:item.business.funds})),{protectedFen:18792,receivableFen:1208,payableFen:1208});
 check('sameAtomicCustomerAndOriginalBalances',same(candidate.relay.customers,stopped.relay.customers),{beforeSha:sha(JSON.stringify(candidate.relay.customers)),afterSha:sha(JSON.stringify(stopped.relay.customers))},'same original customers/terms/balances');
 check('sameAtomicSupplierAndPermissionFacts',['supplyOptions','applications','adapters','stations','offers','audiences','receivables','meters','audits','corrections','refunds','changes'].every(key=>same(candidate.relay[key],stopped.relay[key])),['supplyOptions','applications','adapters','stations','offers','audiences','receivables','meters','audits','corrections','refunds','changes'].map(key=>({key,equal:same(candidate.relay[key],stopped.relay[key])})),'all these original public tables unchanged');
 check('sameOriginalLedgerRowsAfterStop',['transactions','reservations','obligations','contracts','metrics'].every(key=>same(candidate.finance[key],stopped.finance[key])),['transactions','reservations','obligations','contracts','metrics'].map(key=>({key,equal:same(candidate.finance[key],stopped.finance[key])})),'old public ledger rows preserved');
 const planFields=['businessId','customerIds','supplierIds','createdAt','from','to','jobId','supportJobId','supportMode','maxUnits','maxSupplierCostFen','feeQuotes'];
 check('sameOriginalServiceContractAndBudget',planFields.every(key=>same(old.period[key],candidate.period[key])&&same(candidate.period[key],stopped.period[key])),planFields.map(key=>({key,unchanged:same(old.period[key],candidate.period[key])&&same(candidate.period[key],stopped.period[key])})),'unchanged selected original plan fields');
 const period=main.period,meters=main.relay.meters.filter(row=>row.periodId===period.id),eligible=meters.filter(row=>row.supplierId!==null),sourceIds=new Set([period.id,...meters.map(row=>row.id)]),invoices=main.relay.receivables.filter(row=>sourceIds.has(row.sourceId)),invoiceIds=new Set(invoices.map(row=>row.id)),corrections=main.relay.corrections.filter(row=>meters.some(meter=>meter.id===row.meterId)),nonzero=corrections.filter(row=>row.customerDeltaFen!==0||row.supplierDeltaFen!==0),pending=meters.filter(row=>row.auditedUnits!==null&&row.auditedUnits!==row.reportedUnits&&row.correctionId===null);
 const collectionReceipts=main.run.receipts.filter(receipt=>['CollectRelayDue','CollectRelayReceivable'].includes(receipt.kind));
 const collections=collectionReceipts.map(receipt=>{const txIds=new Set(receipt.transactionIds),transactions=main.finance.transactions.filter(tx=>txIds.has(tx.id)&&invoiceIds.has(tx.sourceId)&&tx.amountFen>0);return {receipt:lastPublicReceipt(receipt),transactions,amountFen:transactions.reduce((sum,tx)=>sum+tx.amountFen,0)}});
 const rechargeReceipts=main.run.receipts.filter(receipt=>receipt.kind==='RechargeRelayCustomer'),recharges=rechargeReceipts.map(receipt=>{const txIds=new Set(receipt.transactionIds),transactions=main.finance.transactions.filter(tx=>txIds.has(tx.id)&&tx.amountFen>0);return {receipt:lastPublicReceipt(receipt),amountFen:transactions.reduce((sum,tx)=>sum+tx.amountFen,0),transactions}});
 check('main91SameOriginal80Prefix',same(main.run.receipts.slice(0,buffer.run.receipts.length),buffer.run.receipts),{mainRevision:main.view.revision,bufferRevision:buffer.view.revision},'same original80 prefix; later main/atomic plan IDs need not be equal');
 check('main91OneClosedPeriodAndOperatingBusiness',main.view.revision===91&&main.relay.periods.length===1&&period.status==='closed'&&period.job?.status==='completed'&&period.supportJob?.status==='completed'&&main.business.lifecycle==='operating',{revision:main.view.revision,businessLifecycle:main.business.lifecycle,period},'one closed original period, service/support completed, business still operating');
 check('mainAllApplicableMetersAudited',eligible.length===34&&eligible.every(meter=>meter.auditedUnits!==null&&main.relay.audits.some(audit=>audit.meterId===meter.id&&audit.completedAt!==null)),{meterRows:meters.length,eligibleRows:eligible.length,auditedEligible:eligible.filter(meter=>meter.auditedUnits!==null).length},'34 applicable original meters audited; unserved/non-supplier rows not falsely audited');
 check('mainCorrectionRowsAndNonzeroSeparated',corrections.length===34&&nonzero.length===1&&pending.length===0,{correctionRows:corrections.length,zeroRows:corrections.length-nonzero.length,nonzeroRows:nonzero.length,pendingKnownDifferences:pending.length,nonzero},'34 correction records,1 nonzero,0 pending known differences');
 check('mainReceivablePayableActuallyZero',main.business.funds.receivableFen===0&&main.business.funds.payableFen===0&&invoices.every(invoice=>invoice.amountFen===invoice.collectedFen+invoice.reversedFen),{funds:main.business.funds,remainingInvoiceFen:invoices.reduce((sum,invoice)=>sum+invoice.amountFen-invoice.collectedFen-invoice.reversedFen,0)},'AR/AP0 and no unpaid original invoice');
 check('mainTwoActualCollections20000And120',same(collections.map(row=>row.amountFen),[20000,120]),collections,'two actual ledger-linked collections [20000,120]fen');
 const moneySeparation={authorizedSupplierBudgetFen:period.maxSupplierCostFen,capacityUnits:period.maxUnits,customerPrepayments:recharges,prepaymentReceivedFen:recharges.reduce((sum,row)=>sum+row.amountFen,0),originalInvoiceCollections:collections,collectedFen:collections.reduce((sum,row)=>sum+row.amountFen,0),recognizedBusinessIncomeFen:main.business.metrics.incomeFen,actualBusinessCostsIncludingAccrualFen:main.business.metrics.costFen,accountFunds:main.business.funds,reportedSupplierUsageCostFen:meters.reduce((sum,meter)=>sum+meter.reportedUnits*meter.unitCostFen,0),correctionSupplierDeltaFen:corrections.reduce((sum,row)=>sum+row.supplierDeltaFen,0),limit:'Authorization is not expenditure, customer prepayment is protected liability, collections settle prior receivables, income is not account cash or profit.'};
 check('mainIndependentPrepayment20000',moneySeparation.prepaymentReceivedFen===20000,moneySeparation.prepaymentReceivedFen,'20000fen original client recharge, separate from [20000,120] collections and income');
 report={at:new Date().toISOString(),method:'One codec import/export plus official projectRun and registry.runtime.project per distinct raw SHA; only public relay/account/operations/ledger rows and stored original command receipts inspected. No Controller/Session/Store/commands/preview/replay/browser.',rows,uniqueRawProjectionPairs:groups.size,checks,errors,moneySeparation,limits:{candidateNotSavedOutcome:true,physicalCaptureProvenanceOwnedByNative:true,noNewGameHistory:true,fullCreateNotExecuted:true,noHiddenFutureForGuidance:true,noCompatibilityOrGeometry:true,oldPrefixNotEarnedAgain:true,mainAndAtomicDifferentCommandBranches:'Same Create80 prefix, different real later command identities; no assertion that all whole-feature or raw hashes match across branches.'}};
 put('public-facts.json',report);
}catch(error){errors.push({name:error?.name??'Error',message:error?.message??String(error),stack:error?.stack??null});put('failure.json',{at:new Date().toISOString(),errors,checks,rows});}
let sourceEqual=false,inputEqual=false,p3Equal=false,extraEqual=false;
try{
 const afterSources=sources(),afterInput=inputs(),baseline=JSON.parse(read('goal-1/evidence/t17-acceptance-33/baseline.json').bytes),p3After=baseline.p3.map(row=>read(row.path).identity),extraAfter=extraBefore?.map(row=>read(row.path).identity)??[];
 sourceEqual=same(beforeSources,afterSources);inputEqual=same(beforeInput,afterInput);p3Equal=same(p3Before,p3After);extraEqual=same(extraBefore,extraAfter);
 put('source-after.json',{officialSources:afterSources,p3:p3After,extraReferences:extraAfter,sourceEqual,p3Equal,extraEqual});put('input-after.json',afterInput);
}catch(error){errors.push({name:error?.name??'Error',message:error?.message??String(error),stage:'after-binding'});}
const passed=errors.length===0&&checks.length>0&&checks.every(row=>row.passed)&&sourceEqual&&inputEqual&&p3Equal&&extraEqual;
const result={at:new Date().toISOString(),passed,readOnlyProjection:true,officialSourceCount:beforeSources?.length??null,p3Count:p3Before?.length??null,inputRows:beforeInput?.records.length??null,uniqueRawProjectionPairs:groups.size,checkCount:checks.length,passedChecks:checks.filter(row=>row.passed).length,failedChecks:checks.filter(row=>!row.passed),sourceEqual,inputEqual,p3Equal,extraEqual,errors,roleCounts:Object.fromEntries(['saved_ui','physical_readonly','import_buffer','unsaved_candidate'].map(role=>[role,rows.filter(row=>row.role===role).length])),limit:'Read-only facts and byte relations only. No full Create replay, new native actions, persistence causality, UI, human playtest, formal P3 matrix or whole task acceptance.'};
put('result.json',result);console.log(JSON.stringify(result));process.exitCode=passed?0:1;
