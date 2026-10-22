import {appendFileSync,lstatSync,mkdirSync,readFileSync,readdirSync,statfsSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath} from './video-shape-output.ts'
import {buildRelayMatrixPrefix,RelayPrefixPolicyRefusal} from '../src/testing/relay-matrix-prefix.ts'
import {createCampaignCodec,campaignRelay,campaignStory,campaignRuntime,campaignOperations,campaignMarket} from '../src/application/campaign.ts'
import {projectRelay} from '../src/core/relay-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {projectWorkbench} from '../src/application/workbench-projection.ts'
import {actionBudget} from '../src/core/economy.ts'
import {accountFunds,accountPosition} from '../src/core/ledger.ts'
import type {CommandEnvelope,GameRun} from '../src/core/run-types.ts'

const root=fileURLToPath(new URL('../',import.meta.url))
assertFreshVideoEvidencePath(root,process.argv.slice(2))
const output=evidenceDirectory(root,'relay-prefix-results.json')
if(readdirSync(output).length)throw Error('EMPTY_FRESH_RELAY_PREFIX_OUTPUT_REQUIRED')
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const save=(name:string,value:unknown)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const saveRaw=(file:string,raw:string)=>{writeFileSync(join(output,file),raw,{flag:'wx'});return {file,bytes:Buffer.byteLength(raw),sha256:sha(raw)}}
const space=()=>{const s=statfsSync(output);const available=s.bavail*s.bsize;if(available<2*1024**3)throw Error('RELAY_PREFIX_TWO_GIB_FREE_REQUIRED:'+available);return available}
function sourceFiles(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>{
 const file=dir+'/'+d.name
 if(d.isSymbolicLink())throw Error('SOURCE_SYMLINK_REFUSED:'+file)
 return d.isDirectory()?sourceFiles(file):d.name.endsWith('.ts')&&!d.name.includes('.test.')?[file]:[]
})}
const policyFile='goal-1/evidence/t17-acceptance-17/policy-r3.md'
const paths=[...sourceFiles('src/core'),...sourceFiles('src/application'),...sourceFiles('src/content'),...sourceFiles('src/persistence'),
 'src/testing/story-harness.ts','src/testing/relay-matrix-prefix.ts','src/testing/relay-prefix-readiness.ts','scripts/collect_relay_prefix_evidence.ts','scripts/verify_relay_prefix_readiness.ts',
 'scripts/evidence-output.ts','scripts/video-shape-output.ts','package.json','package-lock.json','tsconfig.app.json','tsconfig.core.json',policyFile,
 'goal-1/evidence/t17-acceptance-17/source-bridge.json']
const sourceHashes=Object.fromEntries(paths.map(file=>{if(!lstatSync(join(root,file)).isFile())throw Error('SOURCE_REGULAR_REQUIRED:'+file);return [file,sha(readFileSync(join(root,file)))]}))
const backgrounds=['technical_employee','content_employee'] as const,seeds=['t16-campaign-0','t16-campaign-1','t16-campaign-2'] as const
const identities=backgrounds.flatMap(backgroundId=>seeds.map(seed=>({name:backgroundId+'-'+seed,backgroundId,seed})))
const codec=createCampaignCodec(),results:{name:string;backgroundId:string;seed:string;status:string;evidence?:ReturnType<typeof saveRaw>;error?:string}[]=[]
save('registration.json',{scope:'Original relay 5c-P1 only; six independently earned normal prerequisites. Core288/critical62/routines22 remain pending.',
 identities,sourceHashes,policyFile,policyText:readFileSync(join(root,policyFile),'utf8'),freeBytesAtStart:space(),
 baseCommit:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 fatalPolicy:'Preserve original partial state and every attempted request; later identities unexecuted_due_to_fatal. A repaired fresh batch reruns all six.',
 collectorIsIndependentReplay:false,compatibilityDevelopmentAndTests:0})
writeFileSync(join(output,'progress.jsonl'),'',{flag:'wx'})
const progress=(row:unknown)=>{appendFileSync(join(output,'progress.jsonl'),JSON.stringify(row)+'\n');console.log(JSON.stringify(row))}
let stopped=false
for(const identity of identities){
 if(stopped){results.push({...identity,status:'unexecuted_due_to_fatal'});continue}
 const folder=identity.name,journalFile=join(output,folder,'requests.jsonl')
 try{space();mkdirSync(join(output,folder));writeFileSync(journalFile,'',{flag:'wx'});progress({type:'prefix-start',...identity})}
 catch(caught){stopped=true;results.push({...identity,status:'fatal',error:String(caught)});console.error('RELAY_PREFIX_INITIALIZATION_FAILED:'+identity.name+':'+String(caught));continue}
 const journal=(row:unknown)=>appendFileSync(journalFile,JSON.stringify(row)+'\n')
 let latest:GameRun|null=null,status='completed',error:string|null=null,policyDetail:unknown=null
 const milestones:unknown[]=[],trace:unknown[]=[],previews:unknown[]=[]
 type Attempt={command:CommandEnvelope;before:{revision:number;sha256:string};outcome:'accepted'|'rejected'|'unresolved';after:{revision:number;sha256:string};reasonCodes?:readonly string[]}
 const attempts:Attempt[]=[]
 let initial:ReturnType<typeof saveRaw>|null=null
 const state=()=>{if(!latest)throw Error('ORIGINAL_CREATE_REQUIRED_BEFORE_COMMAND');return {revision:latest.revision,sha256:sha(codec.export(latest))}}
 const pending=(command?:CommandEnvelope)=>{const a=attempts.at(-1);if(!a||a.outcome!=='unresolved'||command&&JSON.stringify(a.command)!==JSON.stringify(command))throw Error('ORIGINAL_PENDING_RELAY_ATTEMPT_REQUIRED');return a}
 try{
  const result=buildRelayMatrixPrefix(identity.backgroundId,identity.seed,{
   attempted(command){const before=state();if(attempts.at(-1)?.outcome==='unresolved')throw Error('UNRESOLVED_RELAY_ATTEMPT');journal({type:'attempted',command,before});attempts.push({command,before,outcome:'unresolved',after:before})},
   previewed(command,preview,run){pending(command);const beforeSha256=state().sha256,afterSha256=sha(codec.export(run));if(afterSha256!==beforeSha256)throw Error('RELAY_PREVIEW_CHANGED_ORIGINAL');const row={command,preview,revision:run.revision,beforeSha256,afterSha256};journal({type:'previewed',...row});previews.push(row)},
   rejected(command,reasonCodes,run){const a=pending(command),after={revision:run.revision,sha256:sha(codec.export(run))};if(JSON.stringify(after)!==JSON.stringify(a.before))throw Error('RELAY_REJECTION_CHANGED_ORIGINAL');a.outcome='rejected';a.reasonCodes=[...reasonCodes];a.after=after;journal({type:'rejected',command,reasonCodes,after})},
   committed(run,kind){const a=pending();latest=run;a.outcome='accepted';a.after=state();
    journal({type:'accepted',command:a.command,after:a.after})
    const business=run.operations!.businesses.find(b=>b.route==='api_relay')
    trace.push({kind,revision:run.revision,date:run.timeline.cursor.date,personal:accountFunds(run.economy.ledger,'personal'),company:business?accountPosition(run.economy.ledger,business.accountId):null,actionPoints:actionBudget(run.economy,run.timeline.cursor.date)})
    if(run.revision%10===0)progress({type:'actual-command',name:identity.name,revision:run.revision,date:run.timeline.cursor.date,kind})
   },
   milestone(name,run){latest=run;const raw=codec.export(run);if(name==='creation')initial=saveRaw(folder+'/initial.json',raw)
    milestones.push({name,revision:run.revision,date:run.timeline.cursor.date,...saveRaw(folder+'/'+name+'.json',raw)})
    progress({type:'actual-milestone',name:identity.name,milestone:name,revision:run.revision,date:run.timeline.cursor.date})
   }
  });latest=result.run
 }catch(caught){error=String(caught);if(caught instanceof RelayPrefixPolicyRefusal){status='policy_refused';policyDetail={code:caught.code,detail:caught.detail}}else{status='fatal';stopped=true}
  try{journal({type:'prefix-execution-stopped',status,error,policyDetail,lastCommitted:latest?state():null})}catch(journalError){status='fatal';stopped=true;error+='; JOURNAL_WRITE_FAILED:'+String(journalError)}
 }
 const actual=latest as GameRun|null
 if(!actual||!initial){status='fatal';stopped=true;error=error??'NO_ORIGINAL_NORMAL_CREATE'}
 if(actual&&(actual.origin!=='normal'||actual.seed!==identity.seed||actual.backgroundId!==identity.backgroundId)){status='fatal';stopped=true;error='NORMAL_FIXED_IDENTITY_REQUIRED'}
 try{
 const final=actual?saveRaw(folder+'/prefix-final.json',codec.export(actual)):null
 const record={identity,...identity,status,error,policyDetail,initial,final,milestones,attempts,previews,trace,
  publicRelay:actual?projectRelay(actual,campaignRelay):null,publicStory:actual?projectStory(actual,campaignStory):null,
  publicWorkbench:actual?projectWorkbench(actual,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog):null,
  actualReadyAt:status==='completed'?actual!.timeline.cursor.date:null,nominalReadyAt:'2025-01-01',deadline:'2025-03-31',
  requestJournal:folder+'/requests.jsonl',collectorIsIndependentReplay:false,scope:'Original normal prefix only. Finite refusals retain costs and old duties; full relay matrix, Chrome and human playtests are not executed here.'}
 const file=folder+'/prefix-evidence.json';save(file,record);const evidenceBytes=readFileSync(join(output,file))
 results.push({...identity,status,evidence:{file,bytes:evidenceBytes.length,sha256:sha(evidenceBytes)}})
 progress({type:'prefix-result',name:identity.name,status,error,revision:actual?.revision??null,date:actual?.timeline.cursor.date??null,attempts:attempts.length,accepted:attempts.filter(a=>a.outcome==='accepted').length,rejected:attempts.filter(a=>a.outcome==='rejected').length})
 }catch(caught){stopped=true;const failure=String(caught);const existing=results.find(row=>row.name===identity.name)
  if(existing){existing.status='fatal';existing.error=failure}else results.push({...identity,status:'fatal',error:failure})
  console.error('RELAY_PREFIX_EVIDENCE_WRITE_FAILED:'+identity.name+':'+failure)
  try{journal({type:'fatal-evidence-write',error:failure,lastCommitted:actual?{revision:actual.revision,sha256:sha(codec.export(actual))}:null})}catch(journalError){console.error('RELAY_PREFIX_FINAL_JOURNAL_WRITE_FAILED:'+String(journalError))}
 }
}
for(const [file,hash]of Object.entries(sourceHashes))if(sha(readFileSync(join(root,file)))!==hash)throw Error('RELAY_PREFIX_SOURCE_DRIFT:'+file)
const summary={registered:identities.length,recorded:results.length,completed:results.filter(r=>r.status==='completed').length,policyRefused:results.filter(r=>r.status==='policy_refused').length,
 fatal:results.filter(r=>r.status==='fatal').length,unexecutedDueToFatal:results.filter(r=>r.status==='unexecuted_due_to_fatal').length,sourceHashes,results,collectorIsIndependentReplay:false,
 compatibilityDevelopmentAndTests:0,fullCoreBranchesExecuted:0,fullCriticalBranchesExecuted:0,fullRoutineBranchesExecuted:0}
save('relay-prefix-results.json',summary);progress({type:'complete',...summary,sourceHashes:undefined,results:undefined})
if(summary.fatal||summary.unexecutedDueToFatal)process.exitCode=1
