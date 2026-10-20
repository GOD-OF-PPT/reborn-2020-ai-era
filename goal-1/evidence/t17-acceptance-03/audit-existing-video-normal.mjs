import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCampaignRun,createCampaignCodec,campaignVideo} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
import {projectVideo} from '../../../src/core/video-projection.ts';
if(existsSync(new URL('sealed-evidence.json',import.meta.url))||existsSync(new URL('original-video-normal-full-create-audit.json',import.meta.url)))throw Error('EVIDENCE_EXISTS_USE_NEW_ROOT');
const folder=new URL('./',import.meta.url),base=new URL('original-video-replays-r1/',folder),report=JSON.parse(readFileSync(new URL('t10-video-evidence.json',base),'utf8')),codec=createCampaignCodec(),rows=[];
const sha=v=>createHash('sha256').update(v).digest('hex');
for(const item of report.cases.filter(c=>c.origin==='normal')){
 const finalText=readFileSync(new URL(item.snapshots.final.file,base),'utf8'),initialText=readFileSync(new URL(item.snapshots.initial.file,base),'utf8'),expected=codec.import(finalText);
 let run=createCampaignRun({runId:expected.runId,actorId:expected.actorId,commandId:expected.receipts[0].commandId,backgroundId:expected.backgroundId,seed:expected.seed,playerProfile:expected.playerProfile});
 if(codec.export(run)+'\n'!==initialText)throw Error('NORMAL_INITIAL_BYTES_MISMATCH');
 const publicCorrections=[];
 for(const command of item.commands){
  if(command.kind==='ReworkVideo'){const w=projectVideo(run,campaignVideo).works.find(w=>w.id===command.payload.workId);if(w?.contractId===null){if(w.defectKnown!==true)throw Error('QUALITY_DECISION_NOT_PUBLIC');publicCorrections.push({workId:w.id,date:run.timeline.cursor.date,publicDefectKnown:w.defectKnown});}}
  const r=evaluateCommand(run,command,codec.registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_COMMAND_REJECTED:'+JSON.stringify(r));run=codec.import(codec.export(r.nextRun));
 }
 if(codec.export(run)+'\n'!==finalText)throw Error('NORMAL_FINAL_EXACT_FILE_BYTES_MISMATCH');
 rows.push({id:item.id,seed:run.seed,origin:run.origin,commands:item.commands.length,publicCorrections,qualityCorrectionJobs:run.video.works.reduce((n,w)=>n+w.qualityCorrectionJobs.length,0),initialFile:item.snapshots.initial.file,initialSha256:sha(initialText),finalFile:item.snapshots.final.file,finalSha256:sha(finalText),fullCreateReplayByteEqual:true,transport:'Original collector writes one LF. Audit compares canonical export plus exactly that LF to the full file; no fields or IDs removed.'});
}
if(rows.length!==2||!rows.every(r=>r.qualityCorrectionJobs===1&&r.publicCorrections.length===1))throw Error('EXPECTED_EXISTING_NORMAL_QUALITY_PATH_NOT_OBSERVED');
writeFileSync(new URL('original-video-normal-full-create-audit.json',folder),JSON.stringify({rows,normalCreations:rows.length,scope:'Additional pre-existing named normal seed, independent of the original six-prefix 252 matrix. No fixture funds, changed seeds or browser claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({normalCreations:rows.length,publicNormalQualityCorrections:rows.reduce((n,r)=>n+r.publicCorrections.length,0),fullCreateReplayByteEqual:true}));
