import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {createCampaignCodec,campaignRuntime,campaignDeepseek,campaignOperations,campaignMarket} from '../../../../.delivery/t17-u6-runtime-r324/src/application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../../../../.delivery/t17-u6-runtime-r324/src/core/commands.ts'
import {projectDeepseek} from '../../../../.delivery/t17-u6-runtime-r324/src/core/deepseek-projection.ts'
import {projectWorkbench} from '../../../../.delivery/t17-u6-runtime-r324/src/application/workbench-projection.ts'
import {canonicalJson} from '../../../../.delivery/t17-u6-runtime-r324/src/core/identity.ts'
import type {CommandEnvelope} from '../../../../.delivery/t17-u6-runtime-r324/src/core/run-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'

const root='goal-1/evidence/t17-acceptance-40/equity-worker-r329'
const out=root+'/prelude-r1'
const input='goal-1/evidence/t17-acceptance-40/shared-native-r235/saved82-company-capital-added.json'
const snapshot=JSON.parse(fs.readFileSync('goal-1/evidence/t17-acceptance-40/normal-runtime-r322/snapshot324.json','utf8'))
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex')
const exact=()=>snapshot.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(snapshot.target,r.path)))===r.sha256)
const codec=createCampaignCodec(),initial=fs.readFileSync(input,'utf8'),started=Date.now()
if(!exact()||hash(initial)!=='7ac02e612798d3d677774f3d146e464e2c15c5aa49ab88efc19aace041a4bdcd')throw Error('EXACT_ORIGINAL82_REQUIRED')
let run=codec.import(initial),raw=initial,pending:CommandEnvelope|null=null,failure:string|null=null,ready=false
const log=fs.openSync(out+'/commands.jsonl','wx')
const put=(name:string,value:unknown)=>{guard(out);fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
const head=()=>{guard(out);fs.writeFileSync(out+'/head.next.json',raw,{flag:'wx'});fs.renameSync(out+'/head.next.json',out+'/head.current.json')}
const view=()=>projectRun(run)
const deepseek=()=>projectDeepseek(run,campaignDeepseek)!
const one=<T,>(rows:readonly T[])=>{if(rows.length!==1)throw Error('UNIQUE_CURRENT_PUBLIC_OBJECT_REQUIRED');return rows[0]!}
const companyId=one(deepseek().businesses.filter(b=>b.definitionId==='ecosystem-service'&&b.lifecycle!=='closed')).id
const command=(kind:string,payload:unknown):CommandEnvelope=>({runId:run.runId,actorId:run.actorId,commandId:'u6-worker-prelude-v1:'+String(run.revision+1),expectedRevision:run.revision,kind,payload})
const preview=(kind:string,payload:unknown)=>previewCommand(run,command(kind,payload),codec.registry,run.actorId)

function send(kind:string,payload:unknown){
 const c=command(kind,payload),p=previewCommand(run,c,codec.registry,run.actorId)
 if(!p.allowed){put('original-preview-refusal.json',{command:c,preview:p});throw Error('ORIGINAL_PREVIEW_REFUSED:'+p.reasonCodes.join(','))}
 pending=c
 const start=Date.now(),result=evaluateCommand(run,c,codec.registry,run.actorId)
 if(result.status!=='proposed'){put('original-execution-refusal.json',{command:c,result});throw Error('ORIGINAL_COMMAND_NOT_PROPOSED')}
 const next=codec.export(result.nextRun),loaded=codec.import(next)
 if(canonicalJson(loaded)!==canonicalJson(result.nextRun))throw Error('FULL_ROUNDTRIP_CHANGED')
 run=loaded;raw=next;head();guard(out)
 fs.writeSync(log,JSON.stringify({command:c,preview:p,revision:run.revision,date:view().date,bytes:Buffer.byteLength(raw),sha256:hash(raw),wallMs:Date.now()-start})+'\n')
 pending=null
 console.log(JSON.stringify({saved:run.revision,date:view().date,kind,budget:view().budget}))
}

function advance(target:string){
 for(let n=0;n<100;n++){
  const current=view(),publicClock=projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)
  if(publicClock.pause){
   if(publicClock.pause.reason!=='CONTENT_DECISION_PENDING')throw Error('ORIGINAL_PUBLIC_BARRIER:'+publicClock.pause.reason)
   const event=one(publicClock.events.filter(e=>e.isBlocking)),choice=one(event.choices.filter(c=>c.isDefault))
   send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue
  }
  if(current.date===target&&run.timeline.cursor.phase==='snapshot')return
  if(current.date>target)throw Error('ORIGINAL_TIME_TARGET_PASSED')
  send('AdvanceTime',{date:target})
 }
 throw Error('BOUNDED_ORIGINAL_CLOCK_LIMIT')
}

put('started.json',{at:new Date().toISOString(),input,inputSha256:hash(initial),source:snapshot.target,initialRevision:run.revision,runId:run.runId,seed:run.seed,planSha256:hash(fs.readFileSync(root+'/plan.md')),scope:'Normal82 original public preparation only, not Native or already stopped company',compatibility:0})
head()
try{
 if(run.origin!=='normal'||run.revision!==82)throw Error('NORMAL82_REQUIRED')
 send('StartEcosystemPreparation',{businessId:companyId,preparation:'materials',resources:['player-production'],startAt:'2025-01-20'})
 const material=one(deepseek().preparations.filter(p=>p.businessId===companyId&&p.kind==='materials'))
 if(!material.job)throw Error('PUBLIC_MATERIAL_JOB_REQUIRED')
 advance(material.job.completeAt)
 send('ActivateBusiness',{businessId:companyId})
 advance('2025-04-01')
 const hire={businessId:companyId,definitionId:'editor-lin'},hirePreview=preview('HireWorker',hire)
 if(!hirePreview.allowed&&hirePreview.reasonCodes.length===1&&hirePreview.reasonCodes[0]==='INSUFFICIENT_WAGE_BUDGET')send('FundBusiness',{businessId:companyId,amountFen:100000})
 send('HireWorker',hire)
 if(!view().operations?.businesses.some(b=>b.definitionId==='investment-plan'&&b.lifecycle!=='closed'))send('DiscoverBusiness',{definitionId:'investment-plan'})
 let investment=one(view().operations!.businesses.filter(b=>b.definitionId==='investment-plan'&&b.lifecycle!=='closed'))
 if(investment.lifecycle==='discovered')send('PrepareBusiness',{businessId:investment.id})
 investment=one(view().operations!.businesses.filter(b=>b.id===investment.id))
 if(investment.lifecycle==='preparing')send('ActivateBusiness',{businessId:investment.id})
 const worker=one(view().operations!.workers.filter(w=>w.sponsorBusinessId===companyId&&w.definitionId==='editor-lin'&&w.to===null))
 send('StartInternalJob',{businessId:investment.id,definitionId:'business-preparation',resources:[worker.id],startAt:'2025-04-01'})
 send('StartInternalJob',{businessId:companyId,definitionId:'service-maintenance',resources:['player-production'],startAt:'2025-04-03'})
 const current=view(),own=one(current.operations!.jobs.filter(j=>j.businessId===companyId&&j.status==='planned')),cross=one(current.operations!.jobs.filter(j=>j.businessId===investment.id&&j.status==='running'&&j.resources.includes(worker.id)))
 const proposal=preview('WindDownBusiness',{businessId:companyId})
 if(!proposal.allowed||current.budget.available!==1||current.budget.reserved!==1||current.budget.spent!==2)throw Error('ACTUAL_WINDDOWN_PRECONDITIONS_REQUIRED')
 guard(out);fs.writeFileSync(out+'/before-winddown.json',raw,{flag:'wx'})
 put('ready-public.json',{at:new Date().toISOString(),revision:run.revision,date:current.date,companyId,investmentId:investment.id,worker,own,cross,budget:current.budget,accounts:current.accounts,originalWinddownPreview:proposal,bytes:Buffer.byteLength(raw),sha256:hash(raw),newNative:0,normalBoard:false,scope:'Actual earned worker and two real original jobs before WindDown; no scope projection mutation'})
 ready=true
}catch(error){failure=String(error)}
head();fs.closeSync(log)
put('result.json',{at:new Date().toISOString(),ready,failure,pending,lastSaved:{revision:run.revision,date:view().date,bytes:Buffer.byteLength(raw),sha256:hash(raw)},sourceExact:exact(),wallMs:Date.now()-started,scope:'Normal original82 public-command preparation only; not Native winddown or fullCreate proof',compatibility:0,wholeU6Complete:false})
put('terminal.json',{at:new Date().toISOString(),stage:ready?'legal_before_winddown_ready':'preparation_stopped',failure,lastSavedRevision:run.revision})
put('stopped.json',{at:new Date().toISOString(),reason:'Author prelude terminal, parent329 continues Native; no append to this leaf'})
console.log(JSON.stringify({ready,failure,revision:run.revision,date:view().date,pending,wallMs:Date.now()-started}))
if(failure!==null)process.exitCode=1
