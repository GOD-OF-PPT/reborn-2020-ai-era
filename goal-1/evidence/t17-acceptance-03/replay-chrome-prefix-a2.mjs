import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
if(existsSync(new URL('sealed-evidence.json',import.meta.url))||existsSync(new URL('chrome-normal-prefix-a2.json',import.meta.url)))throw Error('EVIDENCE_EXISTS_USE_NEW_ROOT');
const folder=new URL('./',import.meta.url),codec=createCampaignCodec();
const sourceFile='video-matrix-r1/technical_employee-t16-campaign-0/prefix.json';
const sourceRaw=readFileSync(new URL(sourceFile,folder),'utf8'),source=codec.import(sourceRaw);
if(source.origin!=='normal')throw Error('NORMAL_PREFIX_REQUIRED');
const input={runId:'t17-video-chrome-tech-campaign-0-a2',actorId:source.actorId,commandId:source.receipts[0].commandId,backgroundId:source.backgroundId,seed:source.seed,playerProfile:source.playerProfile};
const commands=source.receipts.slice(1).map(r=>({...JSON.parse(r.payloadSignature),runId:input.runId,commandId:r.commandId,expectedRevision:r.revisionBefore}));
const sha=v=>createHash('sha256').update(v).digest('hex');
const json=(name,v)=>writeFileSync(new URL(name,folder),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let run=createCampaignRun(input);
try{
 for(const c of commands){const r=evaluateCommand(run,c,codec.registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify({command:c,result:r}));run=codec.import(codec.export(r.nextRun));}
 const raw=codec.export(run);writeFileSync(new URL('chrome-normal-prefix-a2.json',folder),raw,{flag:'wx'});
 let again=createCampaignRun(input);for(const c of commands){const r=evaluateCommand(again,c,codec.registry,again.actorId);if(r.status!=='proposed')throw Error('SECOND_REPLAY_REFUSED');again=codec.import(codec.export(r.nextRun));}
 if(codec.export(again)!==raw)throw Error('COMPLETE_CREATE_BYTE_MISMATCH');
 json('chrome-normal-prefix-a2-evidence.json',{input,commands,sourceFile,sourceSha256:sha(sourceRaw),normal:true,revision:run.revision,date:run.timeline.cursor.date,bytes:Buffer.byteLength(raw),sha256:sha(raw),fullCreateReplayByteEqual:true,sourceHistoryWasNative:false,extraTestIdentity:true,notPartOf252Matrix:true});
 console.log(JSON.stringify({revision:run.revision,date:run.timeline.cursor.date,sha256:sha(raw),fullCreateReplayByteEqual:true}));
}catch(error){writeFileSync(new URL('chrome-normal-prefix-a2-failed.json',folder),codec.export(run),{flag:'wx'});json('chrome-normal-prefix-a2-error.json',{input,sourceFile,error:String(error),revision:run.revision});throw error;}
