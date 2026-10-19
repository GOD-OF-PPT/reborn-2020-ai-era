import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
if(existsSync(new URL('./sealed-evidence.json',import.meta.url)))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT')
const root=new URL('./chrome-r2/',import.meta.url),raw=readFileSync(new URL('chrome-finished-s100.json',root),'utf8'),codec=createCampaignCodec(),run=codec.import(raw),create=run.receipts[0]!,before=codec.import(readFileSync(new URL('asset-before-input-verified.json',root),'utf8'))
let replay=createCampaignRun({runId:run.runId,actorId:run.actorId,commandId:create.commandId,backgroundId:run.backgroundId,seed:run.seed,playerProfile:run.playerProfile})
for(const r of run.receipts.slice(1)){const signature=JSON.parse(r.payloadSignature),command={...signature,commandId:r.commandId,expectedRevision:r.revisionBefore},result=evaluateCommand(replay,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('FULL_NORMAL_REPLAY_REJECTED:'+JSON.stringify(result));replay=result.nextRun}
if(codec.export(replay)!==raw)throw Error('FULL_NORMAL_REPLAY_BYTE_MISMATCH')
if(JSON.stringify(before.economy.ledger)!==JSON.stringify(run.economy.ledger))throw Error('ENTER_OR_FINISH_CHANGED_LEDGER')
if(JSON.stringify(before.random)!==JSON.stringify(run.random))throw Error('ENTER_OR_FINISH_CHANGED_RANDOM')
const result={scope:'Chrome ending r2, actual imported normal98 -> entered99 -> finished100; independently replayed all creation commands; no browser atomic failure or final r3/r4 visual claim',origin:run.origin,runId:run.runId,revision:run.revision,commands:run.receipts.length-1,closedQuarters:run.journey!.quarters.filter(q=>q.closedAt!==null).length,endingEstimates:run.journey!.endings[0]!.estimates,ledgerAndRandomUnchanged:true,byteEqual:true,sha256:createHash('sha256').update(raw).digest('hex')}
writeFileSync(new URL('full-normal-replay-audit.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result))
