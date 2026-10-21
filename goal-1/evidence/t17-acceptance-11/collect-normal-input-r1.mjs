import {readFileSync,writeFileSync,appendFileSync,readdirSync,mkdirSync,lstatSync,statfsSync,existsSync} from 'node:fs'
import {resolve,join,dirname,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs'
import {replayNormalRelay} from '../../../src/testing/normal-relay-scenario.ts'
import {createCampaignCodec,campaignRelay} from '../../../src/application/campaign.ts'
import {projectRelay} from '../../../src/core/relay-projection.ts'
import {actionBudget} from '../../../src/core/economy.ts'
import {canonicalJson} from '../../../src/core/identity.ts'

const root=fileURLToPath(new URL('../../../',import.meta.url)),task=fileURLToPath(new URL('./',import.meta.url))
const required=resolve(task,'normal-input-r1'),sha=b=>createHash('sha256').update(b).digest('hex')
const check=(v,c)=>{if(!v)throw Error(c)}
check(process.argv.length===4&&process.argv[2]==='--output-dir'&&resolve(root,process.argv[3])===required,'FIXED_FRESH_NORMAL_INPUT_R1_REQUIRED')
check(!existsSync(required),'FRESH_NORMAL_INPUT_DIRECTORY_REQUIRED')
const output=evidenceDirectory(root,'normal-input-results.json',['source-index.json','startup.json','terminal.json','commands.json','requested-commands.json','sliceInitial.json','beforeService.json'])
check(output===required&&readdirSync(output).length===0,'EMPTY_FIXED_NORMAL_INPUT_REQUIRED')
const disk=statfsSync(output);check(disk.bavail*disk.bsize>=2*1024**3,'TWO_GIB_WRITABLE_SPACE_REQUIRED')
const rawDirectory=join(output,'chrome-normal-prefix-r1');mkdirSync(rawDirectory)
function read(name){const path=resolve(root,name);for(let p=path;;p=dirname(p)){check(!lstatSync(p).isSymbolicLink(),'SOURCE_OR_INPUT_LINK:'+name);if(p===resolve(root))break;check(dirname(p)!==p,'INPUT_OUTSIDE_REPOSITORY')}check(lstatSync(path).isFile(),'REGULAR_SOURCE_REQUIRED');return readFileSync(path)}
const ref=(name,b)=>({file:name,bytes:Buffer.byteLength(b),sha256:sha(b)})
function save(name,value){check(/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(name),'SINGLE_OWNED_OUTPUT_REQUIRED');assertBrowserEvidenceWritable(output);assertBrowserEvidenceWritable(dirname(join(output,name)));const b=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';writeFileSync(join(output,name),b,{flag:'wx'});check(readFileSync(join(output,name)).equals(Buffer.from(b)),'OUTPUT_READBACK_MISMATCH:'+name);return ref(name,b)}
save('progress.jsonl','')
function progress(value){assertBrowserEvidenceWritable(output);appendFileSync(join(output,'progress.jsonl'),JSON.stringify(value)+'\n');console.log(JSON.stringify(value))}
const sourceFiles=new Set()
function sources(directory){for(const d of readdirSync(join(root,directory),{withFileTypes:true})){const name=directory+'/'+d.name;if(d.isDirectory())sources(name);else if(d.isFile()&&name.endsWith('.ts')&&!name.includes('.test.'))sourceFiles.add(name)}}
for(const directory of ['src/core','src/application','src/content','src/persistence'])sources(directory)
const closureName='goal-1/evidence/t17-acceptance-10/coverage-r1/coverage-results.json',closureReport=JSON.parse(read(closureName)),closure=closureReport.actualRuntimeDependencyClosure.hashes
for(const name of Object.keys(closure))sourceFiles.add(name)
for(const name of ['src/testing/normal-relay-scenario.ts','scripts/evidence-output.ts','scripts/browser_evidence_guard.mjs',relative(root,fileURLToPath(import.meta.url)),relative(root,join(task,'normal-input-r1-plan.md'))])sourceFiles.add(name)
const sourceHashes=Object.fromEntries([...sourceFiles].sort().map(name=>{const b=read(name);return [name,{bytes:b.length,sha256:sha(b)}]}))
const c16Name='goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json',c16=JSON.parse(read(c16Name))
const oldComparison=Object.entries(closure).map(([name])=>({file:name,current:sourceHashes[name],oldC16Sha256:c16.sourceHashes[name]??null,sameOldC16:c16.sourceHashes[name]===sourceHashes[name].sha256}))
save('source-index.json',{scope:'Current bytes of original explicit runtime/type/config closure plus all four production directories and the actual normal input collector/helper/guards. No claim old C16 all-source equality.',sourceHashes,explicitRuntimeClosureFiles:Object.keys(closure),closurePathListSource:ref(closureName,read(closureName)),oldC16Source:ref(c16Name,read(c16Name)),oldC16Comparison:oldComparison})
const codec=createCampaignCodec(),started=new Date().toISOString(),committed=[],raws=[],seen=new Set()
save('startup.json',{startedUtc:started,pid:process.pid,node:process.version,execArgv:process.execArgv,argv:process.argv,head:execFileSync('rtk',['proxy','git','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),identity:{backgroundId:'technical_employee',seed:'t16-campaign-0'},options:{stopAfterServicePlan:true,onCommitted:'one actual committed run argument'},freeBytes:disk.bavail*disk.bsize,scope:'One real current normal prefix, no Chrome, no six-prefix/matrix or compatibility acceptance.'})
function storeRaw(run){check(!seen.has(run.revision),'DUPLICATE_CAPTURED_REVISION');const raw=codec.export(run),name='chrome-normal-prefix-r1/r'+String(run.revision).padStart(4,'0')+'.json';check(codec.export(codec.import(raw))===raw,'STRICT_CURRENT_CODEC_ROUNDTRIP');seen.add(run.revision);const file=save(name,raw);raws.push({...file,revision:run.revision,date:run.timeline.cursor.date});return raw}
function command(receipt){return {...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}}
function observe(run){const p=projectRelay(run,campaignRelay);return {revision:run.revision,date:run.timeline.cursor.date,origin:run.origin,phase:run.phase,publicRelay:p,budget:actionBudget(run.economy,run.timeline.cursor.date)}}
let result
try{
 result=replayNormalRelay('technical_employee',{seed:'t16-campaign-0',stopAfterServicePlan:true,onCommitted:run=>{const receipt=run.receipts.at(-1);check(receipt.revisionAfter===run.revision,'COMMITTED_RECEIPT_REVISION');committed.push(command(receipt));storeRaw(run);progress({stage:'committed',revision:run.revision,date:run.timeline.cursor.date,kind:receipt.kind})}})
 storeRaw(result.initial)
 check(result.run===result.beforeService&&result.run.timeline.cursor.date==='2025-01-27','ACTUAL_BEFORE_SERVICE_REQUIRED')
 check(result.run.origin==='normal'&&result.run.versions.schemaVersion===13&&result.run.versions.rulesVersion==='rules-t16-journey-v1','CURRENT_NORMAL_VERSION_REQUIRED')
 check(result.commands.length===committed.length&&committed.every((c,i)=>['runId','actorId','commandId','expectedRevision','kind'].every(k=>c[k]===result.commands[i][k])),'REQUESTED_AND_COMMITTED_COMMAND_IDENTITIES_DIFFER')
 save('commands.json',committed);save('requested-commands.json',result.commands)
 const initial=save('initial.json',codec.export(result.initial)),slice=save('sliceInitial.json',codec.export(result.sliceInitial)),before=save('beforeService.json',codec.export(result.beforeService))
 const observations=save('public-observations.json',{sliceInitial:observe(result.sliceInitial),beforeService:observe(result.beforeService)})
 const oldRecordName='goal-1/evidence/t16-epilogue/matrix-full-r2/relay-ecosystem-technical_employee-0-result.json',oldRecord=JSON.parse(read(oldRecordName)),oldPrefix=oldRecord.commands.slice(0,committed.length)
 const sameCreation=oldRecord.creation.payloadSignature===result.initial.receipts[0].payloadSignature&&oldRecord.creation.commandId===result.initial.receipts[0].commandId
 const samePrefix=canonicalJson(oldPrefix)===canonicalJson(committed)
 check(sameCreation&&samePrefix,'ORIGINAL_SAME_SEED_CREATE_OR_PREFIX_COMMANDS_DIFFER')
 const oldDefaultName='goal-1/evidence/t16-c16-final-a1/replay/relay/t12-s03-technical_employee-sliceInitial.json',oldDefaultRaw=read(oldDefaultName),oldDefault=JSON.parse(oldDefaultRaw)
 save('old-source-comparison.json',{sameSeedT16:{source:ref(oldRecordName,read(oldRecordName)),sameCreation,sameCommittedPrefixCommands:samePrefix,prefixCommands:committed.length,oldFullCreateReplayByteEqual:oldRecord.fullCreateReplayByteEqual,midpointRawAvailable:false,scope:'Only the existing original Create and public committed prefix commands compared. No invented historical midpoint raw.'},differentSeedC16:{source:ref(oldDefaultName,oldDefaultRaw),oldSeed:oldDefault.state.seed,currentSeed:result.seed,comparisonRequired:false,rawEndsWithLF:oldDefaultRaw.at(-1)===10,withoutSingleFinalLf:oldDefaultRaw.at(-1)===10?{bytes:oldDefaultRaw.length-1,sha256:sha(oldDefaultRaw.subarray(0,-1))}:null,scope:'Original file left untouched; no equality expected across distinct seeds. Current captured raw is canonical without added LF.'}})
 const sorted=raws.sort((a,b)=>a.revision-b.revision);check(sorted.length===committed.length+1&&sorted.every((r,i)=>r.revision===i+1),'ALL_CURRENT_COMPLETE_REVISIONS_REQUIRED')
 const exports=sorted.map(r=>({origin:'generated_normal_input',label:'normal-relay-technical0-r'+r.revision,file:r.file.split('/').at(-1),bytes:r.bytes,sha256:r.sha256,revision:r.revision,source:'Current replayNormalRelay technical_employee/t16-campaign-0 committed normal input. Generated engine input for later Chrome; not a captured browser export, six-prefix result or matrix.'}))
 save('chrome-normal-prefix-r1/exports.jsonl',exports.map(r=>JSON.stringify(r)).join('\n')+'\n')
 for(const [name,expected] of Object.entries(sourceHashes)){const b=read(name);check(b.length===expected.bytes&&sha(b)===expected.sha256,'FROZEN_SOURCE_CHANGED:'+name)}
 const summary={scope:'One technical_employee / t16-campaign-0 actual normal prefix only. No service/support completed, audit, Chrome or matrix execution.',startedUtc:started,finishedUtc:new Date().toISOString(),runId:result.run.runId,seed:result.seed,versions:result.run.versions,origin:result.run.origin,commands:committed.length,completeRawStates:sorted.length,initial,sliceInitial:slice,beforeService:before,observations,raws:sorted,sourceFiles:Object.keys(sourceHashes).length,sourceFrozenUnchanged:true,allRawStrictCodecRoundTrip:true,independentCreateReplay:'Pending separate existing normal-browser-export verifier; generated inputs remain explicitly labeled.'}
 save('normal-input-results.json',summary);save('terminal.json',{state:'terminal',exitCode:0,finishedUtc:summary.finishedUtc,commands:committed.length,completeRawStates:sorted.length,finalRevision:result.run.revision,finalDate:result.run.timeline.cursor.date,compatibilityTests:0});progress({stage:'terminal',exitCode:0,commands:committed.length,raws:sorted.length,revision:result.run.revision,date:result.run.timeline.cursor.date})
}catch(error){save('commands.partial.json',committed);save('terminal.json',{state:'terminal',exitCode:1,finishedUtc:new Date().toISOString(),error:String(error),commands:committed.length,completeRawStates:raws.length,compatibilityTests:0});throw error}
