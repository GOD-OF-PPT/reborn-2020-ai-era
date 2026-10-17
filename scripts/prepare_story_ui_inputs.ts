import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {normalStoryPrepared,normalStoryZeroResources} from '../src/testing/normal-story-scenario.ts'
import {normalStoryCombined} from '../src/testing/normal-story-combined.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {liabilitiesFor} from '../src/core/story-risk.ts'
import {addDays} from '../src/core/calendar.ts'
const root=fileURLToPath(new URL('../',import.meta.url)),out=evidenceDirectory(root,'t14-ui-input-evidence.json'),sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex')
if(readdirSync(out).length)throw Error('EXISTING_T14_UI_INPUT_DIRECTORY: choose a new directory')
function sources(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(i=>i.isDirectory()?sources(dir+'/'+i.name):/\.(tsx?|css)$/.test(i.name)?[dir+'/'+i.name]:[])}
const paths=[...sources('src'),'scripts/prepare_story_ui_inputs.ts','scripts/evidence-output.ts','package.json','package-lock.json'],sourceHashes=Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),inputs:unknown[]=[]
function save(id:string,h:StoryHarness,scope:string){const raw=h.codec.export(h.run)+'\n',file='t14-input-'+id+'.json';writeFileSync(join(out,file),raw,{flag:'wx'});inputs.push({file,sha256:sha(raw),runId:h.run.runId,revision:h.run.revision,origin:h.run.origin,seed:h.run.seed,versions:h.run.versions,scope,prehistory:'intact normal2020 engine command prefix, not native prehistory'});console.log(JSON.stringify({input:id,revision:h.run.revision,date:h.run.timeline.cursor.date}))}
{
 const p=normalStoryPrepared('technical_employee','t14-normal-risk-4'),h=p.h,d=h.run.story!.deployments[0]!
 save('technical-before-authority',h,'actual completed original supported service and income, records/drill and four Q3 AP; no cross-flow grant yet')
 h.send('SetHengxingAuthority',{deploymentId:d.id,businessId:d.businessId,level:'cross_flow',scopes:['relay_support','external_service_commitments'],cashLimitFen:100000,expiresAt:'2025-09-30',externalDelegation:true,consent:true});h.at(addDays(h.run.timeline.cursor.date,7),{work:false});save('technical-signal',h,'actual independent signal after explicit original authority; no independent work result')
 const c=h.run.story!.incidents.find(c=>c.kind==='agent')!,b=h.run.operations!.businesses.find(b=>b.id===d.businessId)!
 h.send('StopHengxingAuthority',{deploymentId:d.id});save('technical-owned-stop',h,'original owned stop and self-report, external withdrawal unverified')
 for(const kind of ['isolate','investigate','observe','recover'] as const){h.send('StartRiskTask',{incidentId:c.id,kind,accountId:b.accountId,resourceId:'player-production'});save('technical-'+kind+'-running',h,'actual paid work, no early completion or independent result');h.at(h.run.story!.jobs.at(-1)!.completeAt,{work:false});if(kind==='investigate')h.send('ConfirmRiskAssessment',{incidentId:c.id});save('technical-'+kind+'-completed',h,'actual date and paid work completed, remaining gates and old liabilities still preserved')}
 const current=h.run.story!.incidents.find(v=>v.id===c.id)!;h.send('DeclareRiskLiabilities',{incidentId:c.id,snapshot:liabilitiesFor(h.run,current)});h.send('ResolveRiskCase',{incidentId:c.id});save('technical-resolved',h,'only actual controlled scope satisfies all gates; original prepaid balances and receivables remain')
}
{
 const p=normalStoryPrepared('content_employee','t14-normal-risk-9');save('content-before-authority',p.h,'normal content background with actual income and explicit original support; any actual late-capacity strategy preserved')
}
{
 const p=normalStoryCombined();save('course-real-assisted-support',p.h,'one intact normal course run owns a separately funded/prepared/approved relay; real course stage delivery and assisted support completed')
}
{
 const p=normalStoryZeroResources();save('zero-resources',p.h,'real two-worker wages, original service, partial old-debt payment, zero business available cash and zero Q3 AP; no free recovery')
}
{
 const h=new StoryHarness({seed:'t14-linzhou-normal-0'});h.at('2020-01-29',{prepareManualCase:true});h.at('2021-01-01');h.send('StartLinzhouWork',{kind:'pilot',resourceId:'player-production'});h.at('2021-01-08');h.send('StartLinzhouWork',{kind:'continuity',resourceId:'player-production'});h.at('2021-01-15');h.at('2021-04-01');h.send('StartLinzhouWork',{kind:'participation',resourceId:'player-production'});h.at('2021-04-08');h.at('2023-04-30');save('linzhou-before-publication',h,'actual2200yuan collaboration and independent consent; future branch still pending and player has not chosen publication')
}
for(const p of paths)if(sourceHashes[p]!==sha(readFileSync(join(root,p))))throw Error('SOURCE_CHANGED_DURING_UI_INPUT_CAPTURE:'+p)
writeFileSync(join(out,'t14-ui-input-evidence.json'),JSON.stringify({taskId:'T14',evidenceType:'normal_engine_prefixes_for_native_UI_verification',baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceHashes,inputs,notCovered:['native_UI','human_playtest','original_png','full24quarter_campaign','balance']},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'INPUTS_CAPTURED_NOT_UI_ACCEPTED',inputs:inputs.length}))
