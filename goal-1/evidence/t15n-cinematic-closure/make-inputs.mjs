import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {evidenceDirectory} from '../../../scripts/evidence-output.ts';
import {createCampaignRun,createCampaignCodec} from '../../../src/application/campaign.ts';
import {evaluateCommand} from '../../../src/core/commands.ts';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=evidenceDirectory(root,'inputs.json');
const codec=createCampaignCodec(),sha=x=>createHash('sha256').update(x).digest('hex');
const historical=JSON.parse(readFileSync(join(root,'goal-1/evidence/t15n-cinematic-closure/source-before.json'),'utf8'));
for(const [file,expected] of Object.entries(historical.sha256))if(/^src\/(core|application|content|persistence)\//.test(file)&&sha(readFileSync(join(root,file)))!==expected)throw Error('HISTORICAL_ENGINE_SOURCE_CHANGED:'+file);
let run=createCampaignRun({runId:'t15n-accepted-technical',actorId:'player',commandId:'t15n-create',backgroundId:'technical_employee',seed:'t15n-life-contract-normal',playerProfile:{wishId:'autonomy',approach:'free'}});
const commands=[],snapshots=[];
function save(name){const raw=codec.export(run);writeFileSync(join(out,name),raw,{flag:'wx'});snapshots.push({file:name,sha256:sha(raw),bytes:Buffer.byteLength(raw),revision:run.revision,date:run.timeline.cursor.date,runId:run.runId,origin:run.origin});}
function send(kind,payload){const command={runId:run.runId,actorId:'player',commandId:'t15n-engine-'+run.revision,expectedRevision:run.revision,kind,payload};const r=evaluateCommand(run,command,codec.registry,'player');if(r.status!=='proposed')throw Error(JSON.stringify(r));run=r.nextRun;commands.push(command);}
save('normal-initial.json');send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});send('AdvanceTime',{date:'2020-01-04'});save('normal-offered.json');const invitation=run.life.promises.find(p=>p.status==='offered');if(!invitation)throw Error('ACTUAL_INVITATION_REQUIRED');send('AcceptLifePromise',{promiseId:invitation.id,consent:true});save('normal-accepted.json');
writeFileSync(join(out,'inputs.json'),JSON.stringify({kind:'normal engine-generated complete prefixes, not native prehistory',seed:run.seed,versions:run.versions,commands,snapshots,source:'source-before.json',noInjectedCashOrFixture:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(snapshots));
