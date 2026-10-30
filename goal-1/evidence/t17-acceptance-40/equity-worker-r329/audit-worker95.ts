import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createCampaignCodec,createCampaignRun,campaignDeepseek} from '../../../../.delivery/t17-u6-worker-r342/src/application/campaign.ts'
import {evaluateCommand,projectRun} from '../../../../.delivery/t17-u6-worker-r342/src/core/commands.ts'
import {projectDeepseek} from '../../../../.delivery/t17-u6-worker-r342/src/core/deepseek-projection.ts'
import {accountPosition} from '../../../../.delivery/t17-u6-worker-r342/src/core/ledger.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-worker-r342/src/core/identity.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const base='goal-1/evidence/t17-acceptance-40',out=base+'/equity-worker-r329',native=base+'/worker-ui-native-r336'
const snapshot=JSON.parse(fs.readFileSync(out+'/snapshot342.json','utf8'))
const hash=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex')
const exact=()=>snapshot.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(snapshot.target,r.path)))===r.sha256)
if(!exact())throw Error('EXACT342_REQUIRED')
const start=Date.now(),codec=createCampaignCodec(),paths=[
 ['original82',base+'/shared-native-r235/saved82-company-capital-added.json'],
 ['before92',out+'/prelude-r1/before-winddown.json'],
 ['readonlyBefore92',native+'/readonly92-before342.json'],
 ['readonlyDraft92',native+'/readonly92-after342-draft.json'],
 ['cancel92',native+'/actual92-cancel-apr7-reschedule.json'],
 ['rescheduled93',native+'/actual93-rescheduled.json'],
 ['stopped94',native+'/actual94-winddown.json'],
 ['closed95',native+'/actual95-closed.json'],
 ['cold95',native+'/actual95-cold.json'],
] as const
const inputs=paths.map(([name,file])=>{const raw=fs.readFileSync(file,'utf8'),run=codec.import(raw);if(run.origin!=='normal'||codec.export(run)!==raw)throw Error('ORIGINAL_NORMAL_CANONICAL_REQUIRED:'+name);return{name,file,raw,run}})
const final=inputs.at(-1)!.run,first=final.receipts[0]!
let run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:first.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile})
if(first.payloadSignature!==run.receipts[0]!.payloadSignature||inputs.some(x=>x.run.runId!==run.runId||x.run.receipts.some((r,i)=>canonicalJson(r)!==canonicalJson(final.receipts[i]))))throw Error('SAME_ORIGINAL_PREFIX_REQUIRED')
const checked=new Set<number>()
for(const receipt of final.receipts.slice(1)){
 const result=evaluateCommand(run,{...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},codec.registry,run.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_COMMAND_REFUSED:'+receipt.commandId)
 run=codec.import(codec.export(result.nextRun))
 for(const [index,input]of inputs.entries())if(input.run.revision===run.revision){if(codec.export(run)!==input.raw)throw Error('ACTUAL_RAW_MISMATCH:'+input.name);checked.add(index)}
}
if(checked.size!==inputs.length||!exact())throw Error('FULL_REPLAY_MISSING')
const ready=JSON.parse(fs.readFileSync(out+'/prelude-r1/ready-public.json','utf8'))
const before=inputs.find(x=>x.name==='before92')!.run,stopped=inputs.find(x=>x.name==='stopped94')!.run,closed=inputs.find(x=>x.name==='closed95')!.run
const one=<T,>(items:readonly T[])=>{if(items.length!==1)throw Error('UNIQUE_ORIGINAL_REQUIRED');return items[0]!}
const worker=one(stopped.operations!.workers.filter(w=>w.id===ready.worker.id))
const own=one(stopped.operations!.jobs.filter(j=>j.id===ready.own.id)),cross=one(stopped.operations!.jobs.filter(j=>j.id===ready.cross.id))
const business=one(stopped.operations!.businesses.filter(b=>b.id===ready.companyId)),other=one(stopped.operations!.businesses.filter(b=>b.id===ready.investmentId))
const rescheduled=inputs.find(x=>x.name==='rescheduled93')!.run,rescheduledJob=one(rescheduled.operations!.jobs.filter(j=>j.id===ready.own.id))
if(rescheduledJob.startAt!=='2025-04-07'||rescheduledJob.completeAt!=='2025-04-09'||rescheduledJob.status!=='planned'||rescheduledJob.resources.join(',')!=='player-production'||canonicalJson(projectRun(before).budget)!==canonicalJson(projectRun(rescheduled).budget)||canonicalJson(accountPosition(before.economy.ledger,business.accountId))!==canonicalJson(accountPosition(rescheduled.economy.ledger,business.accountId))||canonicalJson(accountPosition(before.economy.ledger,'personal'))!==canonicalJson(accountPosition(rescheduled.economy.ledger,'personal')))throw Error('ORIGINAL_RESCHEDULE_IDENTITY_MONEY_AP_CHANGED')
const companyBefore=accountPosition(before.economy.ledger,business.accountId),companyStopped=accountPosition(stopped.economy.ledger,business.accountId),companyClosed=accountPosition(closed.economy.ledger,business.accountId)
const personalBefore=accountPosition(before.economy.ledger,'personal'),personalStopped=accountPosition(stopped.economy.ledger,'personal'),personalClosed=accountPosition(closed.economy.ledger,'personal')
const stopView=projectRun(stopped),closeView=projectRun(closed)
if(worker.to!=='2025-04-01'||own.status!=='cancelled'||cross.status!=='interrupted'||own.releasedAt!=='2025-04-01'||cross.releasedAt!=='2025-04-01'||business.lifecycle!=='winding_down'||other.lifecycle!=='operating')throw Error('ACTUAL_WORKER_AND_TWO_JOB_EFFECTS_REQUIRED')
if(companyBefore.cashFen!==498388||companyBefore.heldFen!==10000||companyStopped.cashFen!==488055||companyStopped.heldFen!==0||personalStopped.cashFen!==personalBefore.cashFen||stopView.budget.available!==2||stopView.budget.spent!==2||stopView.budget.reserved!==0)throw Error('ORIGINAL_STOP_MONEY_ACTIONS_CHANGED')
if(companyClosed.cashFen!==0||personalClosed.cashFen!==personalStopped.cashFen+488055||closeView.date!=='2025-04-01'||closeView.budget.available!==2||one(closed.operations!.businesses.filter(b=>b.id===business.id)).lifecycle!=='closed')throw Error('ORIGINAL_CAPITAL_RECOVERY_CHANGED')
const incomeBefore=one(projectDeepseek(before,campaignDeepseek)!.businesses.filter(b=>b.id===business.id)).metrics.incomeFen,incomeAfter=one(projectDeepseek(closed,campaignDeepseek)!.businesses.filter(b=>b.id===business.id)).metrics.incomeFen
if(incomeBefore!==incomeAfter)throw Error('CAPITAL_RECOVERY_MUST_NOT_BE_INCOME')
const report={at:new Date().toISOString(),source:snapshot.target,sourceRows:snapshot.files.length,fullCreate:95,wallMs:Date.now()-start,actualRawInputs:inputs.map(x=>({name:x.name,file:x.file,bytes:Buffer.byteLength(x.raw),sha256:hash(x.raw),fullCreateEqual:true})),actual:{rescheduledJob,worker,own,cross,business,other,companyBefore,companyStopped,companyClosed,personalBefore,personalStopped,personalClosed,stopBudget:stopView.budget,closeBudget:closeView.budget,actualStopPaidFen:companyBefore.cashFen-companyStopped.cashFen,capitalRecoveredFen:488055,businessIncomeUnchanged:true,newNativeCommands:3,newNativeCreate:0,independentImport:1},scope:'One actual normal82→Node92→Native93/94/95, fullCreate95 and nine raw snapshots; not normal board, human, all UI or wholeU6',compatibility:0,wholeU6Complete:false}
guard(out);fs.writeFileSync(out+'/worker95-replay.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({fullCreate:95,rawInputs:inputs.length,allBytesEqual:true,actualStopPaidFen:10333,capitalRecoveredFen:488055,wallMs:Date.now()-start}))
