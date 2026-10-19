import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {evidenceDirectory} from '../../../scripts/evidence-output.ts';
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
import {hashValue} from '../../../src/core/hash.ts';
import {projectFirstOrder} from '../../../src/application/first-order.ts';

const root=fileURLToPath(new URL('../../../',import.meta.url)),phase=join(root,'goal-1/evidence/t15n-cinematic-closure');
const out=evidenceDirectory(root,'normal-prefix-audit.json'),codec=createCampaignCodec(),sha=x=>createHash('sha256').update(x).digest('hex');
const freeze=JSON.parse(readFileSync(join(phase,'source-final-css6.json'),'utf8'));
const frozen=()=>{for(const [f,h] of Object.entries(freeze.sha256))if(sha(readFileSync(join(root,f)))!==h)throw Error('SOURCE_CHANGED:'+f);};
frozen();
const journal=readFileSync(join(phase,'exports.jsonl'),'utf8'),rows=journal.trim().split('\n').map(JSON.parse),cache=new Map(),cases=[];let evaluated=0;
for(const row of rows){
 if(!/^[a-z0-9-]+\.json$/.test(row.file))throw Error('INVALID_EXPORT_PATH');
 const raw=readFileSync(join(phase,row.file),'utf8');if(sha(raw)!==row.sha256||Buffer.byteLength(raw)!==row.bytes)throw Error('RAW_EXPORT_CHANGED');
 const final=codec.import(raw),creation=final.receipts[0];if(final.origin!=='normal'||creation.kind!=='CreateRun'||final.runId!==row.runId)throw Error('NORMAL_PREFIX_REQUIRED');
 let key=hashValue([final.runId,final.actorId,final.seed,final.backgroundId,final.playerProfile,creation.commandId,creation.payloadSignature,final.versions]),run=cache.get(key);
 if(!run){run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile});if(hashValue(run.receipts[0])!==hashValue(creation))throw Error('CREATION_MISMATCH');cache.set(key,run);}
 const commands=[];
 for(const receipt of final.receipts.slice(1)){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},next=hashValue([key,command]);
  if(cache.has(next))run=cache.get(next);else{const result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('COMMAND_NOT_PROPOSED:'+row.file);run=result.nextRun;cache.set(next,run);evaluated++;}
  key=next;commands.push(command);
 }
 if(codec.export(run)!==raw||codec.export(final)!==raw)throw Error('FULL_NORMAL_PREFIX_NOT_BYTE_EQUAL:'+row.file);
 cases.push({file:row.file,runId:run.runId,seed:run.seed,backgroundId:run.backgroundId,playerProfile:run.playerProfile,versions:run.versions,date:run.timeline.cursor.date,revision:run.revision,commands,firstOrder:projectFirstOrder(run),rawSha256:sha(raw),fullReplayByteEqual:true,source:row.source});
}
frozen();
writeFileSync(join(out,'normal-prefix-audit.json'),JSON.stringify({result:'COMPLETE_NORMAL_PREFIXES_BYTE_EQUAL',sourceFiles:Object.keys(freeze.sha256).length,exports:cases.length,uniqueEvaluatedCommands:evaluated,normalIdentities:[...new Set(cases.map(c=>c.runId))],cases,journalSha256:sha(journal),scope:'Each export is its real complete creation plus command prefix. Imported normal histories and native actions are separated in UI observation metadata. No direct browser-state injection or fake balance.',T15NOnly:true,nativeCompatibilityAcceptanceComplete:false,goalComplete:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'COMPLETE_NORMAL_PREFIXES_BYTE_EQUAL',exports:cases.length,uniqueEvaluatedCommands:evaluated}));
