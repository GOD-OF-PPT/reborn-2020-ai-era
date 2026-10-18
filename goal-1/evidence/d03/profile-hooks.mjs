import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'
import {createCampaignCodec} from '../../../src/application/campaign.ts'
import {replayNormalRelay} from '../../../src/testing/normal-relay-scenario.ts'
import {normalStoryPayrollReady,normalStoryPrepared} from '../../../src/testing/normal-story-scenario.ts'

const root=fileURLToPath(new URL('../../../',import.meta.url)),out=evidenceDirectory(root,'hook-profile.json')
if(readdirSync(out).length)throw Error('FRESH_HOOK_PROFILE_DIRECTORY_REQUIRED')
const sha=v=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec(),freeze=JSON.parse(readFileSync(join(root,'goal-1/evidence/d03/candidate1-source-freeze.json'),'utf8')).sha256
for(const [file,hash] of Object.entries(freeze))if(sha(readFileSync(join(root,file)))!==hash)throw Error('SOURCE_CHANGED:'+file)
const started=performance.now(),stages=[]
function stage(name,run,from){const raw=codec.export(run),file=name+'.json';if(run.origin!=='normal'||codec.export(codec.import(raw))!==raw)throw Error('STRICT_NORMAL_ROUNDTRIP_REQUIRED');writeFileSync(join(out,file),raw,{flag:'wx'});const row={name,file,sha256:sha(raw),runId:run.runId,seed:run.seed,revision:run.revision,date:run.timeline.cursor.date,milliseconds:performance.now()-from,cumulativeMilliseconds:performance.now()-started};stages.push(row);console.log(JSON.stringify(row))}
let from=performance.now();const base=replayNormalRelay('technical_employee').run;stage('agency-normal-relay-base',base,from)
from=performance.now();const payroll=normalStoryPayrollReady(base).h.run;stage('agency-payroll-ready',payroll,from)
from=performance.now();const prepared=normalStoryPrepared('technical_employee','t14-normal-risk-4').h.run;stage('routine-prepared',prepared,from)
for(const [file,hash] of Object.entries(freeze))if(sha(readFileSync(join(root,file)))!==hash)throw Error('SOURCE_CHANGED:'+file)
writeFileSync(join(out,'hook-profile.json'),JSON.stringify({scope:'Node profiling of exact existing failed-suite setup chains, no Vitest hook deadlines or gameplay acceptance claimed; extra strict exports included in stage timings',sourceFreeze:'../candidate1-source-freeze.json',frozenFiles:Object.keys(freeze).length,sourceUnchanged:true,stages,elapsedMs:performance.now()-started},null,2)+'\n',{flag:'wx'})
