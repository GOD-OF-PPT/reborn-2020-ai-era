import {readFileSync,writeFileSync,readdirSync,mkdirSync,appendFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {join,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath as assertFreshCourseEvidencePath} from './video-shape-output.ts'
import {buildCourseMatrixPrefix,CoursePrefixPolicyRefusal} from '../src/testing/course-matrix-prefix.ts'
import {createCampaignRun,createCampaignCodec,campaignCourse,campaignVideo,campaignStory} from '../src/application/campaign.ts'
import {projectCourse} from '../src/core/course-projection.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {projectStory} from '../src/core/story-projection.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {actionBudget} from '../src/core/economy.ts'
import {accountFunds,accountPosition} from '../src/core/ledger.ts'
import type {GameRun,CommandEnvelope} from '../src/core/run-types.ts'

const root=fileURLToPath(new URL('../',import.meta.url));assertFreshCourseEvidencePath(root,process.argv.slice(2))
const output=evidenceDirectory(root,'course-prefix-results.json');if(readdirSync(output).length)throw Error('EMPTY_FRESH_COURSE_OUTPUT_REQUIRED')
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const save=(name:string,value:unknown)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const saveRaw=(name:string,raw:string)=>{writeFileSync(join(output,name),raw,{flag:'wx'});return {file:name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}}
const backgrounds=['technical_employee','content_employee'] as const,seeds=['t16-campaign-0','t16-campaign-1','t16-campaign-2'] as const
const identities=backgrounds.flatMap(backgroundId=>seeds.map(seed=>({backgroundId,seed,name:backgroundId+'-'+seed})))
function sourceFiles(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?sourceFiles(dir+'/'+d.name):d.name.endsWith('.ts')&&!d.name.includes('.test.')?[dir+'/'+d.name]:[])}
const paths=[...sourceFiles('src/core'),...sourceFiles('src/application'),...sourceFiles('src/content'),...sourceFiles('src/persistence'),'src/testing/normal-course-scenario.ts','src/testing/story-harness.ts','src/testing/course-matrix-prefix.ts','scripts/collect_course_prefix_evidence.ts','scripts/evidence-output.ts','scripts/video-shape-output.ts','package.json','package-lock.json','goal-1/evidence/t17-acceptance-05/prefix-policy-r3.md']
const sourceHashes=Object.fromEntries(paths.map(file=>[file,sha(readFileSync(join(root,file)))]))
save('registration.json',{scope:'T17 5b P1 six normal earned prerequisites only. Full 288 core + 90 critical branch matrix remains unexecuted by this tool.',baseCommit:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),identities,sourceHashes,policyFile:'goal-1/evidence/t17-acceptance-05/prefix-policy-r3.md',policyText:readFileSync(join(root,'goal-1/evidence/t17-acceptance-05/prefix-policy-r3.md'),'utf8'),fullMatrixRegistered:378,fullMatrixBranchesExecuted:0,fatalPolicy:'Preserve partial normal run and commands; mark later fixed identities unexecuted_due_to_fatal. Fix and rerun all in a fresh output, never substitute seeds.',notCovered:['all 378 course shape/critical branches','browser persistence or visuals','compatibility (currently prohibited)','human playtest','older original PNG bytes','whole 5b/T17/QX/goal completion']})
writeFileSync(join(output,'progress.jsonl'),'',{flag:'wx'})
const progress=(row:unknown)=>{appendFileSync(join(output,'progress.jsonl'),JSON.stringify(row)+'\n');console.log(JSON.stringify(row))}
const codec=createCampaignCodec();let stopped=false
const results:unknown[]=[]
for(const identity of identities){
 if(stopped){results.push({...identity,status:'unexecuted_due_to_fatal',actualCommands:0});continue}
 const folder=identity.name;mkdirSync(join(output,folder));progress({type:'prefix-start',...identity})
 let latest:GameRun|null=null,status='completed',error:string|null=null,policyDetail:unknown=null
 const milestones:{name:string;revision:number;date:string;file:string;bytes:number;sha256:string}[]=[],milestoneRaw=new Map<number,string>(),trace:unknown[]=[]
 const committed=(run:GameRun,kind:string)=>{
  latest=run;const business=run.operations!.businesses.find(b=>b.route==='ai_course'),company=business?accountPosition(run.economy.ledger,business.accountId):null
  trace.push({kind,revision:run.revision,date:run.timeline.cursor.date,personal:accountFunds(run.economy.ledger,'personal'),company,actionPoints:actionBudget(run.economy,run.timeline.cursor.date)})
  if(run.revision%10===0)progress({type:'actual-command',name:identity.name,revision:run.revision,date:run.timeline.cursor.date,kind})
 }
 try{
  const result=buildCourseMatrixPrefix(identity.backgroundId,identity.seed,{committed,milestone(name,run){const raw=codec.export(run),existing=milestoneRaw.get(run.revision);if(existing!==undefined&&existing!==raw)throw Error('MILESTONE_REVISION_CHANGED');milestoneRaw.set(run.revision,raw);milestones.push({name,revision:run.revision,date:run.timeline.cursor.date,...saveRaw(folder+'/'+name+'.json',raw)});progress({type:'actual-milestone',name:identity.name,milestone:name,revision:run.revision,date:run.timeline.cursor.date})}})
  latest=result.run
 }catch(caught){
  error=String(caught)
  if(caught instanceof CoursePrefixPolicyRefusal){status='policy_refused';policyDetail={code:caught.code,detail:caught.detail}}
  else if(error.includes('fixed normal strategy has not gained access')||error.includes('fixed normal strategy has insufficient actual learners')){status='policy_refused';policyDetail={source:'original replayNormalCourse finite policy',reason:error}}
  else{status='fatal';stopped=true}
 }
 // The callback retains the actual immutable partial run even if the normal helper throws.
 const actual=latest as GameRun|null
 if(!actual){status='fatal';stopped=true;const record={...identity,status,error:error??'NO_ACTUAL_NORMAL_COMMIT',actualCommands:0};save(folder+'/prefix-evidence.json',record);results.push(record);progress({type:'prefix-result',...record});continue}
 if(actual.origin!=='normal'||actual.seed!==identity.seed||actual.backgroundId!==identity.backgroundId)throw Error('NORMAL_FIXED_IDENTITY_REQUIRED')
 const raw=codec.export(actual),commands:CommandEnvelope[]=actual.receipts.slice(1).map(r=>({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore})),first=actual.receipts[0]!
 let replay=createCampaignRun({runId:actual.runId,actorId:actual.actorId,commandId:first.commandId,backgroundId:actual.backgroundId,seed:actual.seed,playerProfile:actual.playerProfile}),replayRaw=codec.export(replay),replayEqual=false
 const initial=saveRaw(folder+'/initial.json',replayRaw),final=saveRaw(folder+'/prefix-final.json',raw)
 try{
  for(const command of commands){
   const result=evaluateCommand(replay,command,codec.registry,replay.actorId);if(result.status!=='proposed')throw Error('PREFIX_CREATE_REPLAY_REJECTED:'+JSON.stringify({command,result}))
   replayRaw=codec.export(result.nextRun);replay=codec.import(replayRaw);if(codec.export(replay)!==replayRaw)throw Error('STRICT_PREFIX_CODEC_BYTES_CHANGED')
   const expected=milestoneRaw.get(replay.revision);if(expected!==undefined&&expected!==replayRaw)throw Error('ACTUAL_MILESTONE_CREATE_BYTES_MISMATCH:'+replay.revision)
  }
  if(replayRaw!==raw)throw Error('FINAL_PREFIX_CREATE_BYTES_MISMATCH');replayEqual=true
 }catch(caught){status='fatal';error=(error?error+'; ':'')+String(caught);stopped=true}
 const publicCourse=projectCourse(actual,campaignCourse),publicVideo=projectVideo(actual,campaignVideo),publicStory=projectStory(actual,campaignStory)
 const record={...identity,status,error,policyDetail,origin:actual.origin,revision:actual.revision,date:actual.timeline.cursor.date,initial,final,commands,milestones,trace,publicCourse,publicVideo,publicStory,actualSalaryPayments:actual.operations!.payroll.filter(p=>p.kind==='salary'&&p.amountFen>0).length,fullCreateAndMilestoneBytesEqual:replayEqual,scope:'One fixed normal identity and its earned/independently replayed prerequisites. This is not 48 branches or a browser/human run.'}
 save(folder+'/prefix-evidence.json',record);results.push(record);progress({type:'prefix-result',name:identity.name,status,error,revision:actual.revision,date:actual.timeline.cursor.date,commands:commands.length,fullCreateAndMilestoneBytesEqual:replayEqual})
}
for(const [file,hash]of Object.entries(sourceHashes))if(sha(readFileSync(join(root,file)))!==hash)throw Error('COURSE_PREFIX_SOURCE_DRIFT:'+file)
const rows=results as {status:string;fullCreateAndMilestoneBytesEqual?:boolean}[],summary={scope:'Only six fixed normal P1 prerequisites; actual commands/strict codec and independent full Create/milestone replay. Full course matrix remains pending.',registered:identities.length,recorded:rows.length,completed:rows.filter(r=>r.status==='completed').length,policyRefused:rows.filter(r=>r.status==='policy_refused').length,fatal:rows.filter(r=>r.status==='fatal').length,unexecutedDueToFatal:rows.filter(r=>r.status==='unexecuted_due_to_fatal').length,allExecutedBytesEqual:rows.filter(r=>r.status!=='unexecuted_due_to_fatal').every(r=>r.fullCreateAndMilestoneBytesEqual===true),fullMatrixRegistered:378,fullMatrixBranchesExecuted:0,sourceHashes,results}
save('course-prefix-results.json',summary);progress({type:'complete',registered:summary.registered,completed:summary.completed,policyRefused:summary.policyRefused,fatal:summary.fatal,unexecutedDueToFatal:summary.unexecutedDueToFatal,allExecutedBytesEqual:summary.allExecutedBytesEqual})
if(summary.fatal||summary.unexecutedDueToFatal||!summary.allExecutedBytesEqual||summary.completed===0)process.exitCode=1
