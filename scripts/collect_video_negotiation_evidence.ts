import {readFileSync,writeFileSync,readdirSync,realpathSync,openSync,writeSync,closeSync} from 'node:fs'
import {resolve,relative,join,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {evidenceDirectory} from './evidence-output.ts'
import {assertFreshVideoEvidencePath} from './video-shape-output.ts'
import {StoryHarness} from '../src/testing/story-harness.ts'
import {createCampaignRun,createCampaignCodec,campaignVideo} from '../src/application/campaign.ts'
import {projectVideo} from '../src/core/video-projection.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {actionBudget} from '../src/core/economy.ts'
import {accountFunds} from '../src/core/ledger.ts'
import {quarterLimit} from '../src/core/operations-calendar.ts'
import {addDays} from '../src/core/calendar.ts'
import type {GameRun,CommandEnvelope} from '../src/core/run-types.ts'

function check(v:unknown,message:string):asserts v{if(!v)throw Error(message)}
const root=fileURLToPath(new URL('../',import.meta.url)),inputArg=process.env.VIDEO_MATRIX_INPUT_DIRECTORY
check(inputArg,'EXPLICIT_VIDEO_MATRIX_INPUT_REQUIRED')
const input=realpathSync(resolve(root,inputArg))
check(relative(realpathSync(root),input).split('\\').join('/').startsWith('goal-1/evidence/'),'INPUT_SCOPE_REQUIRED')
function readInput(name:string){const file=realpathSync(resolve(input,name)),rel=relative(input,file);check(!rel.startsWith('..')&&!isAbsolute(rel),'INPUT_SYMLINK_ESCAPE');return readFileSync(file,'utf8')}
const matrix=JSON.parse(readInput('video-shape-results.json')) as {registered:number;recorded:number;fatal:number;sourceHashes:Record<string,string>;prefixes:{name:string;backgroundId:string;seed:string;prefix:{file:string;sha256:string};commands:CommandEnvelope[]}[]}
check(matrix.registered===252&&matrix.recorded===252&&matrix.fatal===0&&matrix.prefixes.length===6,'COMPLETE_ORIGINAL_MATRIX_REQUIRED')
const sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex')
function files(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):d.name.endsWith('.ts')?[dir+'/'+d.name]:[])}
const runtimeFiles=[...files('src/core'),...files('src/application'),...files('src/content'),...files('src/persistence'),'src/testing/story-harness.ts','package.json','package-lock.json']
for(const p of runtimeFiles)check(sha(readFileSync(join(root,p)))===matrix.sourceHashes[p],'ORIGINAL_RUNTIME_DRIFT:'+p)
const sourceHashes=Object.fromEntries([...runtimeFiles,'scripts/collect_video_negotiation_evidence.ts','scripts/video-shape-output.ts','scripts/evidence-output.ts'].map(p=>[p,sha(readFileSync(join(root,p)))]))
assertFreshVideoEvidencePath(root,process.argv.slice(2))
const output=evidenceDirectory(root,'normal-negotiation-results.json')
check(readdirSync(output).length===0,'FRESH_NEGOTIATION_DIRECTORY_REQUIRED')
const save=(name:string,value:unknown)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const rawSave=(name:string,raw:string)=>{writeFileSync(join(output,name),raw,{flag:'wx'});return {file:name,bytes:Buffer.byteLength(raw),sha256:sha(raw)}}
const codec=createCampaignCodec(),cadences=[1,2,3,4,5,6,7]
save('registration.json',{scope:'Additional fixed normal marketing cadences; 42 counterfactual branches of the original six normal prefixes, not independent players',input:relative(root,input),sourceHashes,cadences,total:42,policy:'Manual original commission after paid marketing. Only public feedback; negotiate price after included revision. Real rejection -> explicit protected-deposit exit. No next-year AP or additional employment.'})
const progress=openSync(join(output,'progress.jsonl'),'wx'),journal=(row:unknown)=>{const text=JSON.stringify(row)+'\n';writeSync(progress,text);console.log(text.trim())}
function replay(initial:GameRun,commands:readonly CommandEnvelope[],expected:string){let run=initial;for(const c of commands){const result=evaluateCommand(run,c,codec.registry,run.actorId);check(result.status==='proposed','NORMAL_REPLAY_REJECTED:'+JSON.stringify(result));run=codec.import(codec.export(result.nextRun))}check(codec.export(run)===expected,'EXACT_NORMAL_REPLAY_BYTES_REQUIRED');return run}
function view(h:StoryHarness){const v=projectVideo(h.run,campaignVideo);check(v,'VIDEO_REQUIRED');return v}
const at=(h:StoryHarness,date:string)=>h.at(date,{work:false})
function point(h:StoryHarness){if(actionBudget(h.run.economy,h.run.timeline.cursor.date).available>=1)return;const next=quarterLimit(h.run.timeline.cursor.date);check(next<='2025-12-31','NO_NEXT_YEAR_FREE_AP');at(h,next)}
function finance(h:StoryHarness){return {metrics:view(h).channels[0]!.metrics,funds:accountFunds(h.run.economy.ledger,'personal'),budget:actionBudget(h.run.economy,h.run.timeline.cursor.date)}}
function runCase(h:StoryHarness,count:number){
 const before=finance(h),channel=view(h).channels[0]!,assignment=()=>({resources:['player-production'],startAt:h.run.timeline.cursor.date})
 for(let n=0;n<count;n++){point(h);h.send('StartVideoMarketing',{channelId:channel.id,...assignment()});const m=view(h).marketing.at(-1)!;check(m.job,'MARKETING_JOB_REQUIRED');at(h,m.job.completeAt)}
 const lead=view(h).channels[0]!.leads[0];check(lead,'REAL_LEAD_REQUIRED');point(h)
 h.send('AcceptVideoCommission',{channelId:channel.id,cohortId:lead.cohortId,clientId:lead.personId,modeId:'manual',materialId:'original',...assignment()})
 const id=view(h).contracts.at(-1)!.id,workId=view(h).contracts.at(-1)!.workId,work=view(h).works.find(w=>w.id===workId)!
 check(work.production,'PRODUCTION_REQUIRED');at(h,work.production.completeAt);h.send('ReviewVideoOutput',{workId,disclosure:'manual'})
 for(let guard=0;guard<16;guard++){
  const c=view(h).contracts.find(c=>c.id===id)!
  if(c.status==='settled'||c.status==='cancelled'){
   const after=finance(h),paid=c.status==='settled',fee=paid?Math.floor(c.priceFen*c.feeBps/10000):0
   check(after.metrics.incomeFen-before.metrics.incomeFen===(paid?c.priceFen:0),'ACTUAL_INCOME_REQUIRED')
   check(after.metrics.costFen-before.metrics.costFen===count*60000+90000+c.revisions*30000+fee,'ACTUAL_MARKETING_PRODUCTION_REVISION_COST_REQUIRED')
   const balance=h.run.economy.ledger.contracts.find(x=>x.id===id)!;check(balance.prepaidFen===0,'PROTECTED_PREPAYMENT_NOT_RESOLVED')
   if(!paid)check(c.negotiationOutcome==='rejected'&&c.priceFen===view(h).catalog.commercial.priceFen,'REFUSAL_MUST_KEEP_ORIGINAL_TERMS')
   return {status:paid?'paid':'exited_after_actual_rejection',contract:c,before,after,costFen:after.metrics.costFen-before.metrics.costFen}
  }
  if(c.status==='delivered'){check(c.paymentAt,'PAYMENT_DATE_REQUIRED');at(h,c.paymentAt);continue}
  if(c.status==='revision'){
   if(c.revisions>=c.includedRevisions&&!c.negotiated){
    point(h);h.send('NegotiateVideoCommission',{contractId:id,proposal:'price',...assignment()});const jobId=view(h).contracts.find(c=>c.id===id)!.negotiationJobId,job=h.run.operations!.jobs.find(j=>j.id===jobId);check(job,'NEGOTIATION_JOB_REQUIRED');at(h,job.completeAt)
    if(view(h).contracts.find(c=>c.id===id)!.negotiationOutcome==='rejected')h.send('ExitVideoCommission',{contractId:id})
    continue
   }
   point(h);h.send('ReworkVideo',{workId,...assignment()});const correction=view(h).works.find(w=>w.id===workId)!.corrections.at(-1);check(correction,'CORRECTION_REQUIRED');at(h,correction.completeAt);h.send('ReviewVideoOutput',{workId,disclosure:'manual'})
  }
  h.send('SubmitVideoCommission',{contractId:id});const submitted=view(h).contracts.find(c=>c.id===id)!.submittedAt;check(submitted,'ACTUAL_SUBMISSION_REQUIRED');at(h,addDays(submitted,view(h).catalog.commercial.reviewDays))
 }
 throw Error('FINITE_PUBLIC_NEGOTIATION_POLICY_EXHAUSTED')
}
const results:unknown[]=[],prefixes:unknown[]=[]
try{
 for(const p of matrix.prefixes){
  journal({type:'prefix-start',name:p.name});check(/^[A-Za-z0-9_-]+$/.test(p.name),'SAFE_PREFIX_NAME_REQUIRED')
  const expected=readInput(p.prefix.file);check(sha(expected)===p.prefix.sha256,'INPUT_PREFIX_BYTES_CHANGED');const saved=codec.import(expected);check(saved.origin==='normal'&&saved.seed===p.seed&&saved.backgroundId===p.backgroundId,'ORIGINAL_NORMAL_IDENTITY_REQUIRED')
  const initial=createCampaignRun({runId:saved.runId,actorId:saved.actorId,commandId:saved.receipts[0]!.commandId,backgroundId:saved.backgroundId,seed:saved.seed,playerProfile:saved.playerProfile}),earned=replay(initial,p.commands,expected);prefixes.push({name:p.name,fullCreatePrefixByteEqual:true,sha256:sha(expected)})
  for(const count of cadences){
   const h=new StoryHarness({priorRun:earned}),start=h.commands.length;let observed:unknown,status='error',error:string|null=null
   try{observed=runCase(h,count);status=(observed as {status:string}).status}catch(e){error=String(e);observed={error}}
   const raw=codec.export(h.run),commands=h.commands.slice(start);let byteEqual=false
   try{replay(earned,commands,raw);byteEqual=true;check(codec.export(earned)===expected,'SHARED_PREFIX_MUTATED')}catch(e){status='error';error=(error??'')+String(e)}
   const name=p.name+'-marketing-'+count,record={name,backgroundId:p.backgroundId,seed:p.seed,marketingCount:count,status,error,observed,commands,final:rawSave(name+'-final.json',raw),fromValidatedCreatePrefixPlusSuffixByteEqual:byteEqual};results.push(record);save(name+'-evidence.json',record);journal({type:'case',name,status,error,byteEqual})
  }
 }
 for(const [file,hash]of Object.entries(sourceHashes))check(sha(readFileSync(join(root,file)))===hash,'SOURCE_DRIFT:'+file)
 const rows=results as {status:string;fromValidatedCreatePrefixPlusSuffixByteEqual:boolean}[],refused=rows.filter(r=>r.status==='exited_after_actual_rejection').length,fatal=rows.filter(r=>r.status==='error').length
 save('normal-negotiation-results.json',{scope:'Additional fixed marketing cadences of the same six earned normal prefixes. All 42 retained; no altered seed/parameters or independent-player claim.',sourceHashes,input:relative(root,input),registered:42,recorded:rows.length,paid:rows.filter(r=>r.status==='paid').length,actualNormalNegotiationRefusals:refused,fatal,allByteEqual:rows.every(r=>r.fromValidatedCreatePrefixPlusSuffixByteEqual),prefixes,results})
 journal({type:'complete',recorded:rows.length,actualNormalNegotiationRefusals:refused,fatal});if(rows.length!==42||fatal||!refused||!rows.every(r=>r.fromValidatedCreatePrefixPlusSuffixByteEqual))process.exitCode=1
}finally{closeSync(progress)}
