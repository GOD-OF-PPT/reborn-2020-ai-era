import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
const out='goal-1/evidence/t17-acceptance-40/save-cumulative-r349',base='goal-1/evidence/t17-acceptance-40/save-chain-r348'
const snapshot=JSON.parse(fs.readFileSync(out+'/snapshot351.json','utf8')),hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex')
const exact=()=>snapshot.files.every((r:{path:string;sha256:string})=>hash(fs.readFileSync(path.join(snapshot.target,r.path)))===r.sha256)
if(!exact()||fs.existsSync(out+'/stopped.json'))throw Error('ACTIVE_EXACT_SOURCE_REQUIRED')
const at=(p:string)=>import(pathToFileURL(path.join(snapshot.target,'src',p)).href)
const [{createCampaignCodec},{evaluateCommand},{canonicalJson}]=await Promise.all([at('application/campaign.ts'),at('core/commands.ts'),at('core/identity.ts')]),codec=createCampaignCodec(),reports:any[]=[],start=Date.now()
const record=(row:any)=>{reports.push(row);fs.appendFileSync(out+'/actual-progress.jsonl',JSON.stringify({at:new Date().toISOString(),...row})+'\n');console.log(JSON.stringify(row))}
const raw=fs.readFileSync(base+'/physical-backup304.json','utf8'),run=codec.import(raw),beforeHash=hash(canonicalJson(run))
if(run.revision!==304||codec.export(run)!==raw)throw Error('ORIGINAL304_CHANGED')
record({phase:'actual304-read',revision:run.revision,wireBytes:Buffer.byteLength(raw),sha256:hash(raw),exact:true})
const t=Date.now(),day=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'diagnostic-only-jun6-no-save',expectedRevision:304,kind:'AdvanceTime',payload:{date:'2022-06-06'}},codec.registry,run.actorId),dayKernelMs=Date.now()-t
if(day.status!=='proposed')throw Error('ACTUAL_DAY_NOT_PROPOSED')
const dayText=canonicalJson(codec.validateRun(day.nextRun)),oldDay=JSON.parse(fs.readFileSync(base+'/perf-probe-r1/baseline-result.json','utf8'))
if(hash(dayText)!==oldDay.canonicalGameRunSha256||Buffer.byteLength(dayText)!==oldDay.canonicalGameRunBytes)throw Error('ORIGINAL_DAY_CANONICAL_CHANGED')
record({phase:'original-one-day',dayKernelMs,originalHistoricalKernelMs:oldDay.kernelMs,canonicalBytes:Buffer.byteLength(dayText),canonicalSha256:hash(dayText),allCanonicalContentMatchesOriginalHashAndLength:true,comparisonScope:'Original identical command and complete canonical SHA/length; historical single-run timing, not controlled performance acceptance'})
const command={runId:run.runId,actorId:run.actorId,commandId:'normal-capital-v2:305',expectedRevision:304,kind:'AdvanceTime',payload:{date:'2022-06-30'}},batchAt=Date.now(),batch=evaluateCommand(run,command,codec.registry,run.actorId),batchKernelMs=Date.now()-batchAt
if(batch.status!=='proposed')throw Error('ORIGINAL_BATCH_NOT_PROPOSED')
const expected=fs.readFileSync(base+'/saved305.json','utf8'),actual=codec.export(batch.nextRun)
if(actual!==expected||hash(canonicalJson(run))!==beforeHash)throw Error('ORIGINAL_SAVED305_OR_INPUT_CHANGED')
record({phase:'original-batch305',batchKernelMs,allActualSaved305CanonicalWireBytesEqual:true,wireBytes:Buffer.byteLength(actual),sha256:hash(actual),input304Unchanged:true,newSavedCommands:0})
for(const name of ['saved305.json','native-r1/actual329-jun30-writer.json']){
 const text=fs.readFileSync(base+'/'+name,'utf8'),loaded=codec.import(text)
 if(codec.export(loaded)!==text)throw Error('ACTUAL_V3_BYTES_CHANGED:'+name)
 record({phase:'actual-v3-roundtrip',path:base+'/'+name,revision:loaded.revision,bytes:Buffer.byteLength(text),sha256:hash(text),allBytesEqual:true})
}
if(!exact())throw Error('SOURCE_DRIFT')
const result={at:new Date().toISOString(),source:snapshot.target,sourceRows:snapshot.files.length,sourceExact:true,reports,wallMs:Date.now()-start,maxRSSKiB:process.resourceUsage().maxRSS,newSavedCommands:0,newNativeCommands:0,scope:'Original304 and identical actual saved305 command; old actual canonical inputs, pure Core/codec replay only; not fresh Store, full Create, formal performance or human',compatibility:0,wholeU6Complete:false}
fs.writeFileSync(out+'/actual-result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:'complete',wallMs:result.wallMs,maxRSSKiB:result.maxRSSKiB}))
