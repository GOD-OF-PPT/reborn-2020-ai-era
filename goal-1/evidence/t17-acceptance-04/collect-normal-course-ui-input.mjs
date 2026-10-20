import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {replayNormalCourse} from '../../../src/testing/normal-course-scenario.ts';
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
const folder=new URL('./',import.meta.url),root=fileURLToPath(new URL('../../../',import.meta.url));
if(existsSync(new URL('sealed-evidence.json',folder))||existsSync(new URL('normal-course-ui-prepaid-a1.json',folder)))throw Error('FRESH_UI_INPUT_REQUIRED');
const sha=v=>createHash('sha256').update(v).digest('hex');
function files(dir){return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):d.name.endsWith('.ts')?[dir+'/'+d.name]:[])}
const sourceHashes=Object.fromEntries([...files('src/core'),...files('src/application'),...files('src/content'),...files('src/persistence'),'src/testing/normal-course-scenario.ts','package.json','package-lock.json'].map(p=>[p,sha(readFileSync(join(root,p)))]));
const stop=Symbol('public prepaid stage captured');let captured=null;
try{replayNormalCourse('technical_employee',{onCommitted(run){if(run.receipts.at(-1)?.kind==='EnrollCourseAudience'){captured=run;throw stop}}})}catch(error){if(error!==stop)throw error}
if(!captured||captured.origin!=='normal')throw Error('ACTUAL_NORMAL_PREPAID_STAGE_REQUIRED');
const codec=createCampaignCodec(),raw=codec.export(captured),first=captured.receipts[0],input={runId:captured.runId,actorId:captured.actorId,commandId:first.commandId,backgroundId:captured.backgroundId,seed:captured.seed,playerProfile:captured.playerProfile};
const commands=captured.receipts.slice(1).map(r=>({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore}));
let run=createCampaignRun(input);
for(const command of commands){const r=evaluateCommand(run,command,codec.registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_UI_INPUT_REPLAY_REJECTED:'+JSON.stringify(r));run=codec.import(codec.export(r.nextRun))}
if(codec.export(run)!==raw)throw Error('NORMAL_UI_INPUT_FULL_CREATE_BYTES_MISMATCH');
for(const [name,hash]of Object.entries(sourceHashes))if(sha(readFileSync(join(root,name)))!==hash)throw Error('UI_INPUT_RUNTIME_DRIFT:'+name);
writeFileSync(new URL('normal-course-ui-prepaid-a1.json',folder),raw,{flag:'wx'});
writeFileSync(new URL('normal-course-ui-prepaid-a1-evidence.json',folder),JSON.stringify({scope:'Extra original named normal S02 seed for current Chrome UI. Not the six fixed campaign matrix identities or a human playtest. Captured after actual protected enrollment; no teaching command yet.',input,commands,sourceHashes,revision:run.revision,date:run.timeline.cursor.date,bytes:Buffer.byteLength(raw),sha256:sha(raw),fullCreateReplayByteEqual:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({revision:run.revision,date:run.timeline.cursor.date,commands:commands.length,sha256:sha(raw),fullCreateReplayByteEqual:true}));
