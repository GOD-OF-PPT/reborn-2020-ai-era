import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {projectFirstOrder} from '../../../src/application/first-order.ts'
import {accountFunds} from '../../../src/core/ledger.ts'
import {actionBudget} from '../../../src/core/economy.ts'

const here=new URL('./',import.meta.url),output=new URL('./baseline-earned-prefixes-a1/',here)
if(existsSync(new URL('sealed-evidence.json',here))||existsSync(output))throw Error('USE_FRESH_UNSEALED_PREFIX_OUTPUT')
const source=readFileSync(new URL('chrome-r4/baseline-content-q1-s24.json',here),'utf8'),codec=createCampaignCodec(),end=codec.import(source),first=end.receipts[0]!,sha=(text:string)=>createHash('sha256').update(text).digest('hex')
let run=createCampaignRun({runId:end.runId,actorId:end.actorId,commandId:first.commandId,backgroundId:end.backgroundId,seed:end.seed,playerProfile:end.playerProfile})
const revisions=new Set([6,7,12,13,23]),prefixes=new Map<number,string>()
for(const receipt of end.receipts.slice(1)){
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},result=evaluateCommand(run,command,codec.registry,end.actorId)
 if(result.status!=='proposed')throw Error('ACTUAL_BASELINE_COMMAND_REJECTED:'+JSON.stringify(result))
 run=codec.import(codec.export(result.nextRun));if(revisions.has(run.revision))prefixes.set(run.revision,codec.export(run))
}
if(codec.export(run)!==source||prefixes.size!==revisions.size)throw Error('FULL_BASELINE_REPLAY_NOT_IDENTICAL')
let cash=0,minimum=Number.MAX_SAFE_INTEGER
for(const transaction of run.economy.ledger.transactions){cash+=transaction.lines.filter(l=>l.accountId==='personal').reduce((n,l)=>n+l.deltaFen,0);minimum=Math.min(minimum,cash)}
const order=projectFirstOrder(run);if(cash!==3680000||minimum!==2550000||order.result.paymentFen!==130000||order.result.directCostFen!==50000||order.result.netOrderFen!==80000)throw Error('ACTUAL_NORMAL_FIRST_QUARTER_MONEY_MISMATCH')
mkdirSync(output)
const records=[]
for(const [revision,raw]of prefixes){const prefix=codec.import(raw),file='earned-normal-s'+revision+'.json';writeFileSync(new URL(file,output),raw,{flag:'wx'});records.push({file,revision,date:prefix.timeline.cursor.date,origin:prefix.origin,sha256:sha(raw),bytes:Buffer.byteLength(raw),budget:actionBudget(prefix.economy,prefix.timeline.cursor.date),personal:accountFunds(prefix.economy.ledger,'personal'),role:'derived earned normal full creation prefix, not an independently exported browser head'})}
writeFileSync(new URL('provenance.json',output),JSON.stringify({scope:'Regression and controlled UI inputs from complete actual Chrome normal24 commands. No resources, dates, qualifications or state are hand-edited; derived prefixes are not new native saves.',source:'chrome-r4/baseline-content-q1-s24.json',sourceSha256:sha(source),all23CommandsFullReplayByteEqual:true,personalCashFen:cash,actualMinimumCashFen:minimum,firstOrderResult:order.result,records},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({full23ReplayByteEqual:true,prefixes:records.length,finalCashFen:cash,actualMinimumCashFen:minimum,firstOrderNetFen:order.result.netOrderFen}))
