import {readFileSync,writeFileSync,appendFileSync,mkdirSync,readdirSync,lstatSync} from 'node:fs'
import {resolve,dirname,join,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const project=fileURLToPath(new URL('../../../../',import.meta.url)),root=fileURLToPath(new URL('./',import.meta.url))
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const read=path=>readFileSync(resolve(project,path)),json=path=>JSON.parse(read(path).toString('utf8'))
function save(name,bytes){const path=resolve(root,name);if(!path.startsWith(root))throw Error('OUTPUT_PATH_OUTSIDE_FRESH_ROOT');assertBrowserEvidenceWritable(dirname(path));writeFileSync(path,bytes,{flag:'wx'});return {file:name,bytes:Buffer.byteLength(bytes),sha256:sha(bytes)}}
const saveJson=(name,value)=>save(name,JSON.stringify(value,null,2)+'\n')
function folder(name){assertBrowserEvidenceWritable(root);mkdirSync(resolve(root,name));assertBrowserEvidenceWritable(resolve(root,name))}
function progress(row){assertBrowserEvidenceWritable(root);appendFileSync(resolve(root,'progress.jsonl'),JSON.stringify(row)+'\n');process.stdout.write(JSON.stringify(row)+'\n')}
function sourcePaths(dir){return readdirSync(resolve(project,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?sourcePaths(dir+'/'+d.name):d.name.endsWith('.ts')&&!d.name.includes('.test.')?[dir+'/'+d.name]:[]).sort()}
const enginePaths=()=>['src/core','src/application','src/content','src/persistence'].flatMap(sourcePaths).sort()
const manifest=json('goal-1/evidence/t17-acceptance-23/normal-prefix-r1/source-before.json')
const bound=[...manifest.runtime,...manifest.protocol,...manifest.reference,...manifest.inputs]
function sourceCheck(){
 const files=bound.map(expected=>{const bytes=read(expected.path),actual={path:expected.path,bytes:bytes.length,sha256:sha(bytes)};return {expected,actual,same:expected.bytes===actual.bytes&&expected.sha256===actual.sha256}})
 const expectedPaths=manifest.runtime.map(f=>f.path).sort(),currentPaths=enginePaths()
 return {files,changed:files.filter(f=>!f.same).map(f=>f.expected.path),added:currentPaths.filter(p=>!expectedPaths.includes(p)),removed:expectedPaths.filter(p=>!currentPaths.includes(p))}
}
assertBrowserEvidenceWritable(root)
save('progress.jsonl','')
const sourceStart=sourceCheck();saveJson('source-check-start.json',sourceStart)
if(sourceStart.changed.length||sourceStart.added.length||sourceStart.removed.length)throw Error('BOUND_SOURCE_OR_INPUT_CHANGED_BEFORE_REPLAY')

const {createCampaignRun,createCampaignCodec}=await import('../../../../src/application/campaign.ts')
const {evaluateCommand,projectRun}=await import('../../../../src/core/commands.ts')
const {canonicalJson}=await import('../../../../src/core/identity.ts')
const codec=createCampaignCodec()
const originalInitialPath=manifest.inputs.find(f=>f.path.endsWith('/initial.json')).path
const originalEvidencePath=manifest.inputs.find(f=>f.path.endsWith('/prefix-evidence.json')).path
const original59Path=manifest.inputs.find(f=>f.path.endsWith('/normal-before-course-studio.json')).path
const originalInitialText=read(originalInitialPath).toString('utf8'),originalInitial=JSON.parse(originalInitialText)
const original59Text=read(original59Path).toString('utf8'),original59=JSON.parse(original59Text)
const evidence=json(originalEvidencePath),commands=evidence.commands.slice(0,58)
const first=originalInitial.state.receipts[0],creation=JSON.parse(first.payloadSignature)
if(creation.kind!=='CreateRun'||creation.payload.origin!=='normal'||creation.runId!=='normal-course-content_employee-453bb7c2'||creation.payload.backgroundId!=='content_employee'||creation.payload.seed!=='t16-campaign-2'||first.commandId!=='create')throw Error('ORIGINAL_CREATE_IDENTITY_MISMATCH')
if(Buffer.byteLength(original59Text)!==778801||sha(original59Text)!=='5abe6b6cdd1b1f09f07933c4ffe2a85ab22fd4d7be3a47c3ee55d0b8e04b39b7')throw Error('EXPECTED_ORIGINAL_REV59_BYTES_CHANGED')
if(commands.length!==58||commands.some((c,i)=>c.expectedRevision!==i+1||c.runId!==creation.runId||c.actorId!==creation.actorId)||commands[51].kind!=='DecideVideoProgram')throw Error('ORIGINAL_COMMAND_PREFIX_MISMATCH')
if(original59.state.receipts.length!==59||original59.state.receipts.slice(1).some((r,i)=>canonicalJson({...JSON.parse(r.payloadSignature),commandId:r.commandId,expectedRevision:r.revisionBefore})!==canonicalJson(commands[i])))throw Error('ORIGINAL_RAW_COMMAND_ENVELOPES_DO_NOT_MATCH_SOURCE')
folder('inputs')
const inputCopies=manifest.inputs.map((f,i)=>save('inputs/'+String(i+1).padStart(2,'0')+'-'+f.path.split('/').at(-1),read(f.path)))
saveJson('original-create.json',{authority:originalInitialPath,signature:first.payloadSignature,receipt:first,envelope:{...creation,commandId:first.commandId,expectedRevision:0},factoryInput:{runId:creation.runId,actorId:creation.actorId,commandId:first.commandId,backgroundId:creation.payload.backgroundId,seed:creation.payload.seed,playerProfile:creation.payload.playerProfile}})
saveJson('original-commands-58.json',commands)

function rawDifference(actual,expected){const a=Buffer.from(actual),b=Buffer.from(expected);let firstDifferenceByte=null;for(let i=0;i<Math.max(a.length,b.length);i++)if(a[i]!==b[i]){firstDifferenceByte=i;break}return {actualBytes:a.length,actualSha256:sha(a),expectedBytes:b.length,expectedSha256:sha(b),byteEqual:a.equals(b),firstDifferenceByte,detail:'No hidden-state snippets are displayed or used to choose commands.'}}
function publicProjection(run){
 const before=codec.export(run),view=projectRun(run),features=codec.registry.runtime.project(run)
 if(codec.export(run)!==before)throw Error('PUBLIC_PROJECTION_MUTATED_RUN')
 return {view,features}
}
function publicResources(run,projection){
 const {view,features}=projection,video=features.video
 return {runId:run.runId,origin:view.origin,backgroundId:view.backgroundId,seedIdentity:creation.payload.seed,revision:view.revision,date:view.date,budget:view.budget,accounts:view.accounts,quarter:features.workbench.quarter,pause:features.workbench.pause,requiresDelivery:features.workbench.progression.requiresDelivery,channels:video.channels.map(c=>({id:c.id,businessId:c.businessId,accountId:c.accountId,name:c.name,audience:c.audience,qualifiedInquiries:c.qualifiedInquiries,leads:c.leads,eligiblePrograms:c.eligiblePrograms})),applications:video.applications.map(a=>({id:a.id,channelId:a.channelId,program:a.program,appliedAt:a.appliedAt,resultRead:a.resultRead,approved:a.resultRead?a.approved:null,decidedAt:a.decidedAt,expiresAt:a.resultRead?a.expiresAt:null,job:a.job})),modes:video.modes,works:video.works,contracts:video.contracts,publications:video.publications,settlements:video.settlements,ongoingJobs:view.operations.jobs.filter(j=>['planned','running'].includes(j.status)),noAiWorks:video.works.every(w=>w.modeId==='manual'),noVideoContracts:video.contracts.length===0}
}
const firstPass={responses:[],milestones:{}},passes=[],rejections=[]
let partial=null
function replay(name,verifyAgainst){
 folder(name);assertBrowserEvidenceWritable(resolve(root,name));mkdirSync(resolve(root,name,'responses'));mkdirSync(resolve(root,name,'public'))
 const createInput={runId:creation.runId,actorId:creation.actorId,commandId:first.commandId,backgroundId:creation.payload.backgroundId,seed:creation.payload.seed,playerProfile:creation.payload.playerProfile}
 let run=createCampaignRun(createInput),raw=codec.export(run);run=codec.import(raw);partial={name,run,raw}
 const initial=save(name+'/initial.json',raw),initialDifference=rawDifference(raw,originalInitialText)
 saveJson(name+'/initial-comparison.json',initialDifference)
 const initialProjection=publicProjection(run);saveJson(name+'/public/rev-001.json',initialProjection)
 const pass={name,accepted:0,rejected:0,initial,initialHistoricalByteEqual:initialDifference.byteEqual,responses:[],milestones:{},commands:[]}
 passes.push(pass)
 progress({type:'create',pass:name,runId:run.runId,revision:run.revision,date:run.timeline.cursor.date,initialHistoricalByteEqual:initialDifference.byteEqual})
 for(let i=0;i<commands.length;i++){
  const command=commands[i],before=codec.export(run),result=evaluateCommand(run,command,codec.registry,run.actorId)
  if(codec.export(run)!==before)throw Error('COMMAND_MUTATED_PREVIOUS_COMMITTED_RUN:'+command.commandId)
  const responseText=JSON.stringify(result),responseIdentity={bytes:Buffer.byteLength(responseText),sha256:sha(responseText)}
  const originalResponse=verifyAgainst?.responses[i]
  const response=originalResponse&&originalResponse.sha256===responseIdentity.sha256&&originalResponse.bytes===responseIdentity.bytes?{...responseIdentity,file:originalResponse.file,reusedExactFirstPassResponse:true}:save(name+'/responses/'+String(command.expectedRevision+1).padStart(3,'0')+'-'+command.kind+'.json',responseText)
  pass.responses.push(response)
  if(!verifyAgainst)firstPass.responses.push(response)
  if(result.status!=='proposed'){
   pass.rejected++;rejections.push({pass:name,index:i,command,response,result})
   saveJson(name+'/rejection.json',{command,result,previousRaw:save(name+'/rejected-previous.json',before)})
   progress({type:'rejected',pass:name,commandId:command.commandId,kind:command.kind,status:result.status,reasonCodes:result.reasonCodes??[]})
   return {pass,run,raw:before,completed:false}
  }
  raw=codec.export(result.nextRun);run=codec.import(raw);partial={name,run,raw}
  const projection=publicProjection(run),publicFile=saveJson(name+'/public/rev-'+String(run.revision).padStart(3,'0')+'.json',projection)
  const row={pass:name,index:i,command,status:result.status,previousRevision:result.previousRevision,receipt:result.receipt,response,canonicalNext:{bytes:Buffer.byteLength(raw),sha256:sha(raw)},publicProjection:publicFile}
  pass.commands.push(row);pass.accepted++
  assertBrowserEvidenceWritable(root);appendFileSync(resolve(root,'commands.jsonl'),JSON.stringify(row)+'\n')
  if(run.revision===53||run.revision===59){
   const rawFile=save(name+'/rev-'+run.revision+'.json',raw),resources=publicResources(run,projection),publicResourcesFile=saveJson(name+'/resources-rev-'+run.revision+'.json',resources)
   const historical=run.revision===59?rawDifference(raw,original59Text):null
   if(historical)saveJson(name+'/original-rev59-comparison.json',historical)
   const firstMilestone=verifyAgainst?.milestones[run.revision]
   const independent=firstMilestone?{firstFile:firstMilestone.raw.file,byteEqual:raw===readFileSync(resolve(root,firstMilestone.raw.file),'utf8'),firstSha256:firstMilestone.raw.sha256,currentSha256:rawFile.sha256}:null
   const milestone={revision:run.revision,date:viewDate(projection),raw:rawFile,publicResources:publicResourcesFile,historicalComparison:historical,independentCreateReplay:independent,aiReady:resources.applications.some(a=>a.program==='image_rights'&&a.resultRead&&a.approved===true&&a.expiresAt>resources.date)&&resources.modes.find(m=>m.id==='image_assisted').reasonCodes.length===0,noAiWorks:resources.noAiWorks,noVideoContracts:resources.noVideoContracts}
   pass.milestones[run.revision]=milestone;if(!verifyAgainst)firstPass.milestones[run.revision]=milestone
   progress({type:'milestone',pass:name,revision:run.revision,date:resources.date,bytes:rawFile.bytes,sha256:rawFile.sha256,budget:resources.budget,accounts:resources.accounts,aiReady:milestone.aiReady,noAiWorks:milestone.noAiWorks,noVideoContracts:milestone.noVideoContracts,historicalByteEqual:historical?.byteEqual??null,independentByteEqual:independent?.byteEqual??null})
  }
  if(run.revision%10===0)progress({type:'accepted',pass:name,revision:run.revision,date:run.timeline.cursor.date,kind:command.kind})
 }
 return {pass,run,raw,completed:true}
}
const viewDate=projection=>projection.view.date
save('commands.jsonl','')
let completed=false,error=null
try{
 const earned=replay('earned',null)
 if(earned.completed){const verified=replay('create-replay',firstPass);completed=verified.completed&&Object.values(verified.pass.milestones).every(m=>m.independentCreateReplay?.byteEqual)&&Object.values(earned.pass.milestones).every(m=>m.aiReady&&m.noAiWorks&&m.noVideoContracts)}
}catch(caught){error=String(caught);if(partial){save('fatal-partial.json',partial.raw);saveJson('fatal-public.json',publicProjection(partial.run))}saveJson('fatal-error.json',{error,stack:caught?.stack??null,partial:partial?{pass:partial.name,revision:partial.run.revision,date:partial.run.timeline.cursor.date}:null});progress({type:'fatal',error})}
const end=sourceCheck();saveJson('source-after.json',end)
const unchanged=end.changed.length===0&&end.added.length===0&&end.removed.length===0
const report={scope:'One original normal identity, fresh Create -> original complete 52/58-command envelopes; independent full Create replay. Engine prehistory only, not native/browser or a new AI order.',completed:completed&&unchanged,error,rejections,passes,sourceUnchanged:unchanged,sourceDrift:{changed:end.changed,added:end.added,removed:end.removed},engineProtocolSourceCount:126,runtimeSourceCount:124,inputCopies,originalCreateIdentity:{runId:creation.runId,actorId:creation.actorId,commandId:first.commandId,backgroundId:creation.payload.backgroundId,seed:creation.payload.seed,playerProfile:creation.payload.playerProfile},versions:partial?.run.versions??null,uiFrozen:false,hiddenResultPolicy:'Only original commands were executed. Opaque full engine responses and raw saves are archived without inspecting hidden values to choose suffix actions; public projections/resources are separate.',browserExecuted:false,aiSuffixExecuted:false,gitExecuted:false,oldSourceOrEvidenceModified:false}
saveJson('result.json',report)
progress({type:'complete',completed:report.completed,error,rejections:rejections.length,passes:passes.map(p=>({name:p.name,accepted:p.accepted,rejected:p.rejected,milestones:p.milestones})),sourceUnchanged:unchanged})
process.exitCode=report.completed?0:1
