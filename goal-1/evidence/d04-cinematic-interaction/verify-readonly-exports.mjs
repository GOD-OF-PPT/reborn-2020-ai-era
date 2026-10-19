import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {evidenceDirectory} from '../../../scripts/evidence-output.ts';
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts';
import {hashValue} from '../../../src/core/hash.ts';

const root=fileURLToPath(new URL('../../../',import.meta.url)),phase=join(root,'goal-1/evidence/d04-cinematic-interaction');
const out=evidenceDirectory(root,'readonly-export-audit.json'),sha=raw=>createHash('sha256').update(raw).digest('hex');
const freeze=JSON.parse(readFileSync(join(phase,'source-freeze-final.json'),'utf8')),codec=createCampaignCodec();
function frozen(){for(const [f,h] of Object.entries(freeze.sha256))if(sha(readFileSync(join(root,f)))!==h)throw Error('SOURCE_CHANGED:'+f);}
frozen();
const journal=readFileSync(join(phase,'exports.jsonl'),'utf8'),rows=journal.trim().split('\n').map(JSON.parse),cases=[];
if(rows.length!==4)throw Error('EXPECTED_FOUR_READONLY_EXPORTS');
for(const row of rows){
 if(!/^[a-z0-9-]+\.json$/.test(row.file))throw Error('INVALID_EXPORT_PATH');
 const raw=readFileSync(join(phase,row.file),'utf8');if(sha(raw)!==row.sha256||Buffer.byteLength(raw)!==row.bytes)throw Error('RAW_CHANGED');
 const run=codec.import(raw),creation=run.receipts[0];
 if(run.origin!=='normal'||run.revision!==1||run.receipts.length!==1||creation.kind!=='CreateRun'||run.runId!==row.runId)throw Error('EXPECTED_UNMODIFIED_NORMAL_CREATION');
 const replay=createCampaignRun({runId:run.runId,actorId:run.actorId,commandId:creation.commandId,backgroundId:run.backgroundId,seed:run.seed,playerProfile:run.playerProfile});
 if(hashValue(replay.receipts[0])!==hashValue(creation)||codec.export(replay)!==raw||codec.export(run)!==raw)throw Error('FULL_CREATION_NOT_BYTE_EQUAL');
 cases.push({file:row.file,runId:run.runId,seed:run.seed,backgroundId:run.backgroundId,playerProfile:run.playerProfile,versions:run.versions,revision:run.revision,creationCommandId:creation.commandId,postCreationCommands:0,sha256:sha(raw),fullNormalReplayByteEqual:true,source:row.source});
}
const pairs=[['normal-tech-before-ui.json','normal-tech-after-ui.json'],['normal-content-production-before-ui.json','normal-content-production-after-ui.json']].map(([before,after])=>{
 const a=readFileSync(join(phase,before)),b=readFileSync(join(phase,after));if(!a.equals(b))throw Error('READONLY_UI_CHANGED_SAVE');return {before,after,sha256:sha(a),byteEqual:true};
});
frozen();
const result={result:'FULL_NORMAL_CREATION_AND_READONLY_PAIRS_BYTE_EQUAL',sourceFiles:Object.keys(freeze.sha256).length,exports:cases.length,normalIdentities:[...new Set(cases.map(c=>c.runId))],cases,pairs,journalSha256:sha(journal),scope:'DEV technical before/after art implementation and interaction; fixed production content before/after viewing/modes/reload/paid-confirmation cancellation. No accepted paid command or new transaction-abort claim.',D04ScopeOnly:true,nativeCompatibilityAcceptanceComplete:false,T15Complete:false,C15Complete:false,goalComplete:false};
writeFileSync(join(out,'readonly-export-audit.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:result.result,exports:4,normalIdentities:result.normalIdentities.length,byteEqualPairs:2,sourceFiles:result.sourceFiles}));
