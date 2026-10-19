import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {evidenceDirectory} from '../../../scripts/evidence-output.ts';
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
import {hashValue} from '../../../src/core/hash.ts';
const root=fileURLToPath(new URL('../../../',import.meta.url)),phase=join(root,'goal-1/evidence/t15-chrome-native-a-01'),out=evidenceDirectory(root,'chrome-prefix-audit.json'),sha=v=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec();
const freeze=JSON.parse(readFileSync(join(root,'goal-1/evidence/t15-cinematic-followup-01/source-freeze-c2.json'),'utf8'));
function frozen(){for(const [name,h] of Object.entries(freeze.sha256))if(sha(readFileSync(join(root,name)))!==h)throw Error('SOURCE_CHANGED:'+name)}
frozen();const journal=readFileSync(join(phase,'chrome-exports.jsonl'),'utf8'),rows=journal.trim().split('\n').map(JSON.parse),cache=new Map(),cases=[];let evaluated=0;
for(const item of rows){
 if(!/^[a-z0-9-]+\.json$/.test(item.file))throw Error('INVALID_EXPORT_PATH');
 const raw=readFileSync(join(phase,item.file),'utf8');if(sha(raw)!==item.sha256||Buffer.byteLength(raw)!==item.bytes)throw Error('RAW_EXPORT_CHANGED');
 const final=codec.import(raw),creation=final.receipts[0];if(final.origin!=='normal'||creation.kind!=='CreateRun'||final.runId!==item.runId)throw Error('NORMAL_PREFIX_REQUIRED');
 let prefix=hashValue([final.runId,final.actorId,final.seed,final.backgroundId,final.playerProfile,creation.commandId,creation.payloadSignature,final.versions]),run=cache.get(prefix);
 if(!run){run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile});if(hashValue(run.receipts[0])!==hashValue(creation))throw Error('CREATION_MISMATCH');cache.set(prefix,run)}
 const commands=[];
 for(const receipt of final.receipts.slice(1)){const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},next=hashValue([prefix,command]);if(cache.has(next))run=cache.get(next);else{const result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error('COMMAND_NOT_PROPOSED:'+item.file);run=result.nextRun;cache.set(next,run);evaluated++}prefix=next;commands.push(command)}
 const replay=codec.export(run);if(replay!==raw||replay!==codec.export(final))throw Error('NORMAL_PREFIX_NOT_BYTE_EQUAL:'+item.file);
 cases.push({file:item.file,runId:final.runId,revision:final.revision,seed:final.seed,backgroundId:final.backgroundId,versions:final.versions,commands,rawSha256:sha(raw),replaySha256:sha(replay),byteEqual:true,runtime:item.runtime});
}
const oldNames=cases.filter(c=>c.runId==='life-fea9b8fe-7986-402f-a08e-b5695dd2f0af'&&c.revision===1).map(c=>c.file),old=readFileSync(join(phase,oldNames[0]));for(const name of oldNames)if(!old.equals(readFileSync(join(phase,name))))throw Error('OLD_PHYSICAL_HEAD_CHANGED');
frozen();writeFileSync(join(out,'chrome-prefix-audit.json'),JSON.stringify({result:'FULL_NORMAL_PREFIX_EXPORTS_BYTE_EQUAL',frozenSourceFiles:Object.keys(freeze.sha256).length,exports:cases.length,evaluatedUniqueCommands:evaluated,cases,oldPhysicalFiles:oldNames,oldPhysicalSha256:sha(old),journalSha256:sha(journal),normalIdentities:[...new Set(cases.map(c=>c.runId))],policy:'Each candidate is its real full normal creation and command prefix. Five unsaved alternatives from the same physical head1 are separate branches, not one committed history.',pending:['actual native200percent','actual native stay with unchanged candidate','current T15/C15 final scope/records'],'nativeAcceptanceComplete':false,'T15Complete':false,'C15Complete':false,'goalComplete':false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'FULL_NORMAL_PREFIX_EXPORTS_BYTE_EQUAL',exports:cases.length,evaluatedUniqueCommands:evaluated,oldPhysicalFiles:oldNames.length,nativeAcceptanceComplete:false}));
