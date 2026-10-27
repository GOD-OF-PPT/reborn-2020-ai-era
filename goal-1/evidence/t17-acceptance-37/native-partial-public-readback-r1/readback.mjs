import fs from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';

const out='goal-1/evidence/t17-acceptance-37/native-partial-public-readback-r1';
const root='goal-1/evidence/t17-acceptance-37';
const inputs=[
 {role:'before86',path:root+'/chrome-main-r1/n07-original86-after-ui-restore.json',bytes:1429116,sha256:'0c920c297ef5e1477d587e87c8fb78fa72dbc5234eeaa1b5be4590460bcf353f',mode:420},
 {role:'partial87',path:root+'/chrome-main-r2/n06-r2-saved87-first-real-partial-collection.json',bytes:1432821,sha256:'5d675264ef67ba9b599e5ba3041072c8d814c02cc5e1655404c8fd860415a57d',mode:420},
 {role:'reentered87',path:root+'/chrome-main-r2/n07-r2-reentered87-original-continue.json',bytes:1432821,sha256:'5d675264ef67ba9b599e5ba3041072c8d814c02cc5e1655404c8fd860415a57d',mode:420},
 {role:'oldFullCollect87',path:root+'/chrome-main-r1/n04-original87-before-restore.json',bytes:1432764,sha256:'a19914f5a148d3dd3572a526f27effccbc74a8722dc28d8721e8a1ed7506720f',mode:420},
];
const expected={runId:'normal-relay-technical_employee-ee9cb440',date:'2024-11-07',commandId:'command-ca1b977b-8d70-4c60-8f7c-a72c993a98d3',oldCommandId:'command-8cd71c87-4342-492a-b02f-35d947a72da0',invoiceId:'rly:a258aded1a35adb514cc71781b991437',customerId:'rly:1fa39660348987364a58485031f01d8e',businessId:'ops:bb7f1c37abbfc1d51a6ca6ca76da18b5',accountId:'ops:ef38539ec47df2b4efab6763c0c5bdf8',sourceId:'rly:701848bd02b6c63b6d4fffaf950e1d94',operationId:'rly:a7e69decc8890eda7442b4951b257d1d',collectionId:'rly:16a554e0c991487f6dfb1d17190a7160',amountFen:608};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value);
const summary=value=>{const text=canonical(value);return {rows:Array.isArray(value)?value.length:null,bytes:Buffer.byteLength(text),sha256:hash(text)};};
const checks=[];
function check(name,wanted,actual){checks.push({name,expected:wanted,actual,passed:canonical(wanted)===canonical(actual)});}
function one(rows,name){if(rows.length!==1)throw Error('UNIQUE_ROW_REQUIRED:'+name);return rows[0];}
function identity(path){const stat=fs.lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw Error('REGULAR_INPUT_REQUIRED:'+path);const bytes=fs.readFileSync(path);return {path,bytes:bytes.length,sha256:hash(bytes),mode:stat.mode&511};}
function put(name,value){guard(resolve(out));fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
const first=inputs.map(row=>({role:row.role,...identity(row.path)}));
const values=new Map();
for(const input of inputs){
 const actual=first.find(row=>row.role===input.role);
 check('input '+input.role+' fixed bytes/SHA/mode',{path:input.path,bytes:input.bytes,sha256:input.sha256,mode:input.mode},{path:actual.path,bytes:actual.bytes,sha256:actual.sha256,mode:actual.mode});
 if(actual.bytes!==input.bytes||actual.sha256!==input.sha256||actual.mode!==input.mode)throw Error('FROZEN_NATIVE_INPUT_MISMATCH:'+input.role);
 values.set(input.role,JSON.parse(fs.readFileSync(input.path,'utf8')));
}
put('inputs-before.json',first);
let error=null;
try{
 const before=values.get('before86'),partial=values.get('partial87'),oldFull=values.get('oldFullCollect87');
 const a=before.state,b=partial.state,old=oldFull.state,al=a.economy.ledger,bl=b.economy.ledger,ol=old.economy.ledger;
 const receipt=one(b.receipts.slice(a.receipts.length),'one newly saved command');
 const commandBody=JSON.parse(receipt.payloadSignature);
 check('one new command, original 86 receipts remain the exact prefix',
  {newCommands:1,originalPrefix:summary(a.receipts)},
  {newCommands:b.receipts.length-a.receipts.length,originalPrefix:summary(b.receipts.slice(0,a.receipts.length))});
 check('same run and one revision, original date remains',
  {runBefore:expected.runId,runAfter:expected.runId,envelopeBefore:86,stateBefore:86,envelopeAfter:87,stateAfter:87,dateBefore:expected.date,dateAfter:expected.date},
  {runBefore:a.runId,runAfter:b.runId,envelopeBefore:before.revision,stateBefore:a.revision,envelopeAfter:partial.revision,stateAfter:b.revision,dateBefore:a.timeline.cursor.date,dateAfter:b.timeline.cursor.date});
 check('complete new receipt identity',
  {runId:expected.runId,actorId:'player',commandId:expected.commandId,kind:'CollectRelayReceivable',revisionBefore:86,revisionAfter:87,date:expected.date},
  Object.fromEntries(['runId','actorId','commandId','kind','revisionBefore','revisionAfter','date'].map(key=>[key,receipt[key]])));
 check('complete signed command payload is only this invoice and 608 fen',
  {actorId:'player',kind:'CollectRelayReceivable',payload:{amountFen:608,receivableId:expected.invoiceId},runId:expected.runId},commandBody);
 check('original payload signature hash independently matches receipt',hash(receipt.payloadSignature),receipt.payloadHash);
 const invoiceBefore=one(a.relay.receivables.filter(row=>row.id===expected.invoiceId),'before original invoice');
 const invoiceAfter=one(b.relay.receivables.filter(row=>row.id===expected.invoiceId),'after original invoice');
 const customerBefore=one(a.relay.customers.filter(row=>row.id===invoiceBefore.customerId),'before original customer');
 const customerAfter=one(b.relay.customers.filter(row=>row.id===invoiceAfter.customerId),'after original customer');
 const businessBefore=one(a.operations.businesses.filter(row=>row.id===customerBefore.businessId),'before original business');
 const businessAfter=one(b.operations.businesses.filter(row=>row.id===customerAfter.businessId),'after original business');
 check('same original invoice/customer/business/account/date chain',
  {invoiceId:expected.invoiceId,customerBefore:expected.customerId,customerAfter:expected.customerId,businessBefore:expected.businessId,businessAfter:expected.businessId,accountBefore:expected.accountId,accountAfter:expected.accountId,route:'api_relay',definition:'relay-station',invoiceSource:expected.sourceId,invoiceDate:'2024-10-24',dueAt:expected.date},
  {invoiceId:invoiceAfter.id,customerBefore:customerBefore.id,customerAfter:customerAfter.id,businessBefore:businessBefore.id,businessAfter:businessAfter.id,accountBefore:businessBefore.accountId,accountAfter:businessAfter.accountId,route:businessAfter.route,definition:businessAfter.definitionId,invoiceSource:invoiceAfter.sourceId,invoiceDate:invoiceAfter.date,dueAt:invoiceAfter.dueAt});
 check('original invoice fields unchanged except collected amount',
  {...invoiceBefore,collectedFen:invoiceBefore.collectedFen+608},invoiceAfter);
 check('one invoice actually received 608, original 1216 leaves 608',
  {originalFen:1216,collectedBefore:0,collectedAfter:608,reversedBefore:0,reversedAfter:0,remainingBefore:1216,remainingAfter:608},
  {originalFen:invoiceAfter.amountFen,collectedBefore:invoiceBefore.collectedFen,collectedAfter:invoiceAfter.collectedFen,reversedBefore:invoiceBefore.reversedFen,reversedAfter:invoiceAfter.reversedFen,remainingBefore:invoiceBefore.amountFen-invoiceBefore.collectedFen-invoiceBefore.reversedFen,remainingAfter:invoiceAfter.amountFen-invoiceAfter.collectedFen-invoiceAfter.reversedFen});
 check('all other original invoices remain exactly unchanged',
  summary(a.relay.receivables.filter(row=>row.id!==expected.invoiceId)),summary(b.relay.receivables.filter(row=>row.id!==expected.invoiceId)));
 const newTransactions=bl.transactions.slice(al.transactions.length),transaction=one(newTransactions,'one new cash transaction');
 check('all prior cash transactions retain exact ordered prefix',summary(al.transactions),summary(bl.transactions.slice(0,al.transactions.length)));
 check('receipt and new transaction refer to this same single operation',[expected.operationId],receipt.transactionIds);
 check('new cash transaction complete source/reference/two legs',
  {businessId:expected.businessId,contractId:expected.customerId,date:expected.date,id:expected.operationId,lines:[{accountId:'world',deltaFen:-608},{accountId:expected.accountId,deltaFen:608}],referenceId:expected.customerId,sourceEventId:expected.invoiceId},transaction);
 check('new cash legs balance to zero',0,transaction.lines.reduce((sum,line)=>sum+line.deltaFen,0));
 const newLedgerReceipts=bl.receipts.slice(al.receipts.length),ledgerReceipt=one(newLedgerReceipts,'one new ledger operation');
 check('all prior ledger receipts retain exact ordered prefix',summary(al.receipts),summary(bl.receipts.slice(0,al.receipts.length)));
 const ledgerOperation=JSON.parse(ledgerReceipt.signature);
 check('one original collect_receivable applied, same account/customer and 608 fen',
  {accountId:expected.accountId,contractId:expected.customerId,id:expected.operationId,kind:'collect_receivable',status:'applied'},
  Object.fromEntries(['accountId','contractId','id','kind','status'].map(key=>[key,ledgerReceipt[key]])));
 check('complete applied financial operation matches original invoice',
  {accountId:expected.accountId,amountFen:608,businessId:expected.businessId,contractId:expected.customerId,date:expected.date,id:expected.operationId,kind:'collect_receivable',sourceEventId:expected.invoiceId},ledgerOperation);
 check('command receipt ledger count points to actual ledger tail',bl.receipts.length,receipt.ledgerReceiptCountAfter);
 check('economy receipt tail is exactly the same new financial operation',
  {prefix:summary(a.economy.receipts),tail:[{id:expected.operationId,signature:ledgerReceipt.signature}]},
  {prefix:summary(b.economy.receipts.slice(0,a.economy.receipts.length)),tail:b.economy.receipts.slice(a.economy.receipts.length)});
 const collection=one(b.relay.collections.slice(a.relay.collections.length),'one new single invoice collection');
 check('all old relay collections retain original sequence',summary(a.relay.collections),summary(b.relay.collections.slice(0,a.relay.collections.length)));
 check('new relay collection complete original row',
  {amountFen:608,date:expected.date,id:expected.collectionId,operationId:expected.operationId,receivableId:expected.invoiceId},collection);
 const balanceBefore=one(al.contracts.filter(row=>row.id===expected.customerId),'before customer AR balance');
 const balanceAfter=one(bl.contracts.filter(row=>row.id===expected.customerId),'after customer AR balance');
 check('customer total AR falls by 608; recognized income and prepaid protection unchanged',
  {...balanceBefore,receivableFen:balanceBefore.receivableFen-608},balanceAfter);
 check('customer total AR original 1936 becomes 1328; recognized income remains 20000',
  {arBefore:1936,arAfter:1328,incomeBefore:20000,incomeAfter:20000,prepaidBefore:0,prepaidAfter:0},
  {arBefore:balanceBefore.receivableFen,arAfter:balanceAfter.receivableFen,incomeBefore:balanceBefore.recognizedIncomeFen,incomeAfter:balanceAfter.recognizedIncomeFen,prepaidBefore:balanceBefore.prepaidFen,prepaidAfter:balanceAfter.prepaidFen});
 check('all other customer contract balances unchanged',summary(al.contracts.filter(row=>row.id!==expected.customerId)),summary(bl.contracts.filter(row=>row.id!==expected.customerId)));
 const future=rows=>rows.filter(row=>row.customerId===expected.customerId&&row.dueAt>expected.date).map(row=>({id:row.id,dueAt:row.dueAt,amountFen:row.amountFen,collectedFen:row.collectedFen,reversedFen:row.reversedFen,remainingFen:row.amountFen-row.collectedFen-row.reversedFen}));
 check('future customer invoice remains 720 fen, not collected early',
  {records:future(a.relay.receivables),remainingFen:720},
  {records:future(b.relay.receivables),remainingFen:future(b.relay.receivables).reduce((sum,row)=>sum+row.remainingFen,0)});
 const accountBefore=one(al.accounts.filter(row=>row.id===expected.accountId),'before business cash');
 const accountAfter=one(bl.accounts.filter(row=>row.id===expected.accountId),'after business cash');
 check('business cash 2152581 becomes 2153189, exactly 608 more',
  {beforeFen:2152581,afterFen:2153189,deltaFen:608},
  {beforeFen:accountBefore.balanceFen,afterFen:accountAfter.balanceFen,deltaFen:accountAfter.balanceFen-accountBefore.balanceFen});
 check('all cash accounts change only the two declared legs',
  al.accounts.map(row=>({...row,balanceFen:row.balanceFen+(row.id===expected.accountId?608:row.id==='world'?-608:0)})),bl.accounts);
 check('personal cash remains exactly 22000000 fen',
  {beforeFen:22000000,afterFen:22000000},
  {beforeFen:one(al.accounts.filter(row=>row.id==='personal'),'before personal').balanceFen,afterFen:one(bl.accounts.filter(row=>row.id==='personal'),'after personal').balanceFen});
 check('all income metric entries unchanged, no income recognized twice',summary(al.metrics.filter(row=>row.kind==='income')),summary(bl.metrics.filter(row=>row.kind==='income')));
 check('all cost metric entries unchanged, no new expense',summary(al.metrics.filter(row=>row.kind==='cost')),summary(bl.metrics.filter(row=>row.kind==='cost')));
 check('complete ordered metric sequence unchanged',summary(al.metrics),summary(bl.metrics));
 check('all AP action records and definitions exactly unchanged',summary(a.economy.actions),summary(b.economy.actions));
 check('all cash reservations including customer protection unchanged',summary(al.reservations),summary(bl.reservations));
 check('all actual service/support jobs unchanged',summary(a.operations.jobs),summary(b.operations.jobs));
 const quarterFacts=actions=>{const rows=actions.filter(row=>row.definition.startAt>='2024-10-01'&&row.definition.startAt<'2025-01-01');return {quarter:'2024-Q4',records:rows.length,executedActionPoints:rows.filter(row=>row.executedAt!==null).reduce((sum,row)=>sum+row.definition.actionPoints,0),reservedActionPoints:rows.filter(row=>row.status==='reserved').reduce((sum,row)=>sum+row.definition.actionPoints,0)};};
 check('recorded Q4 action-point facts remain 3 executed, 0 reserved',
  {before:{quarter:'2024-Q4',records:3,executedActionPoints:3,reservedActionPoints:0},after:{quarter:'2024-Q4',records:3,executedActionPoints:3,reservedActionPoints:0}},
  {before:quarterFacts(a.economy.actions),after:quarterFacts(b.economy.actions)});
 check('all obligations unchanged, no debt silently removed',summary(al.obligations),summary(bl.obligations));
 check('all supplier prepaid assets unchanged',summary(al.supplierPrepayments),summary(bl.supplierPrepayments));
 check('customer original terms and business identity unchanged',
  {customer:summary(customerBefore),business:summary(businessBefore)},
  {customer:summary(customerAfter),business:summary(businessAfter)});
 const partialBytes=fs.readFileSync(inputs[1].path),reenteredBytes=fs.readFileSync(inputs[2].path);
 check('reentered87 is byte-for-byte the saved partial87',
  {bytes:1432821,sha256:inputs[1].sha256,rawEqual:true},
  {bytes:reenteredBytes.length,sha256:hash(reenteredBytes),rawEqual:partialBytes.equals(reenteredBytes)});
 const oldReceipt=one(old.receipts.slice(a.receipts.length),'old full collection branch tail');
 check('old fullCollect87 shares only the original86 receipt prefix',
  {prefix:summary(a.receipts),referenceTailCommands:1},
  {prefix:summary(old.receipts.slice(0,a.receipts.length)),referenceTailCommands:old.receipts.length-a.receipts.length});
 check('two revision87 branches are distinct commands, not consecutive commands',
  {partial:{revision:87,commandId:expected.commandId,kind:'CollectRelayReceivable',payload:{amountFen:608,receivableId:expected.invoiceId}},oldReference:{revision:87,commandId:expected.oldCommandId,kind:'CollectRelayDue',payload:{customerId:expected.customerId}}},
  {partial:{revision:b.revision,commandId:receipt.commandId,kind:receipt.kind,payload:commandBody.payload},oldReference:{revision:old.revision,commandId:oldReceipt.commandId,kind:oldReceipt.kind,payload:JSON.parse(oldReceipt.payloadSignature).payload}});
 const oldInvoice=one(old.relay.receivables.filter(row=>row.id===expected.invoiceId),'old full-branch invoice');
 check('old full branch collected1216 versus current partial608 on the same original invoice',
  {originalFen:1216,oldFullCollectedFen:1216,oldFullRemainingFen:0,currentPartialCollectedFen:608,currentPartialRemainingFen:608},
  {originalFen:oldInvoice.amountFen,oldFullCollectedFen:oldInvoice.collectedFen,oldFullRemainingFen:oldInvoice.amountFen-oldInvoice.collectedFen-oldInvoice.reversedFen,currentPartialCollectedFen:invoiceAfter.collectedFen,currentPartialRemainingFen:invoiceAfter.amountFen-invoiceAfter.collectedFen-invoiceAfter.reversedFen});
 check('old full branch cash is a reference result, not the current partial branch cash',
  {oldFullBusinessCashFen:2153797,currentPartialBusinessCashFen:2153189,differenceFen:608},
  {oldFullBusinessCashFen:one(ol.accounts.filter(row=>row.id===expected.accountId),'old full business cash').balanceFen,currentPartialBusinessCashFen:accountAfter.balanceFen,differenceFen:one(ol.accounts.filter(row=>row.id===expected.accountId),'old full cash delta').balanceFen-accountAfter.balanceFen});
 check('distinct full87 and partial87 raw hashes remain bound to their own branches',
  {partial87:inputs[1].sha256,oldFull87:inputs[3].sha256,different:true},
  {partial87:hash(fs.readFileSync(inputs[1].path)),oldFull87:hash(fs.readFileSync(inputs[3].path)),different:!fs.readFileSync(inputs[1].path).equals(fs.readFileSync(inputs[3].path))});
}catch(caught){error={name:caught.name,message:caught.message};}
const final=inputs.map(row=>({role:row.role,...identity(row.path)}));
for(const original of first)check('input '+original.role+' final identity equals initial',original,final.find(row=>row.role===original.role));
put('inputs-after.json',final);
const passed=checks.filter(row=>row.passed).length,result={at:new Date().toISOString(),status:error===null&&passed===checks.length?'passed':'failed',checks:checks.length,passed,failed:checks.length-passed,error,results:checks,inputs:{before:first,after:final},counts:{newGameplayCommandsInThisComparedInterval:1,newCreateCommandsInThisInterval:0,oldFull87ReferenceBranches:1,reenteredRawAliases:1},bounds:{jsonOnly:true,productionProjectionOrRuntimeInvoked:false,coreSourceRead:false,originalNativeOrJournalModified:false,productModified:false,formalCompleteCreateAudit:false,human:false,fullyAuthorIsolated:false,priorAuthorParticipation:'This reader previously implemented the UI response module and consumer test code; calculation is independent of production projection, not fully author-isolated.'},scope:'Only the actual 86 -> partial87 single-invoice 608fen interval and its reentry alias; old full87 stays a separate reference branch. Does not prove complete service, atomic save, all U4-B, or entire goal.'};
put('result.json',result);
console.log(JSON.stringify({status:result.status,checks:result.checks,passed:result.passed,failed:result.failed,error:result.error,newGameplayCommands:1,newCreateCommands:0,inputFirstLastEqual:checks.filter(row=>row.name.includes('final identity')).every(row=>row.passed),scope:result.scope}));
process.exitCode=result.status==='passed'?0:1;
