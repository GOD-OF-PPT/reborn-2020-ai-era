import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {performance} from 'node:perf_hooks'
import {isDeepStrictEqual} from 'node:util'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474'
const out=root+'/receipt-cache-r475'
const source=json(out+'/snapshot479.json')
const prepared=json(root+'/prepared-inputs.json')
const command=json(root+'/control623.json').nextOriginalCommand
const exact=()=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
const put=(name,value)=>{
  if(fs.existsSync(out+'/stopped.json')) throw Error('EVIDENCE_STOPPED')
  fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})
}
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/replay624-started.json') || !exact()) throw Error('FRESH_EXACT_SINGLE_REPLAY_REQUIRED')
for(const name of ['final-ledger-consumers','final-cache-budget479']){
  const tests=json(out+'/'+name+'.vitest.json')
  if(!tests.success || tests.numFailedTests || tests.numPendingTests) throw Error('FINAL_CONSUMER_CHECKS_REQUIRED')
}
for(const name of ['r479-type.result.json','r477-build.result.json']){
  const report=json(out+'/'+name)
  if(report.exitCode!==0 || !report.sourceExact) throw Error('FINAL_ENGINEERING_REQUIRED')
}
const equivalence=json(out+'/source-equivalence477-479.json')
if(!equivalence.allRuntimeConfigAssetFilesByteEqual || equivalence.onlyDifference.length!==1) throw Error('EXPLICIT_SAME_RUNTIME_EVIDENCE_REQUIRED')
const components=json(out+'/actual-components.json')
if(!components.sourceExact || !components.allFortyWholeLedgerPrefixesEqualToOriginal464 || components.actualReceiptOperations!==40) throw Error('REAL_COMPONENT_PREFIX_PROOF_REQUIRED')
const raw=fs.readFileSync(root+'/saved623.json','utf8')
if(hash(raw)!==prepared.inputSha256 || !isDeepStrictEqual(command,{runId:'u6-board-capital-pilot-v1',actorId:'player',commandId:'normal-capital-v2:624',expectedRevision:623,kind:'AdvanceTime',payload:{date:'2024-10-20'}})) throw Error('EXACT_ORIGINAL623_AND624_REQUIRED')
const log=fs.openSync(out+'/replay624.phases.jsonl','wx')
const measured=[]
let phase='imports'
const started=performance.now()
function measure(name,fn){
  phase=name
  const beginning={at:new Date().toISOString(),phase,status:'start'}
  fs.writeSync(log,JSON.stringify(beginning)+'\n');console.log(beginning)
  const start=performance.now(),cpu=process.cpuUsage(),value=fn(),used=process.cpuUsage(cpu)
  const row={phase,wallMs:performance.now()-start,cpuUserMs:used.user/1000,cpuSystemMs:used.system/1000}
  measured.push(row)
  fs.writeSync(log,JSON.stringify({...row,status:'end'})+'\n');console.log({...row,status:'end'})
  return value
}
put('replay624-started.json',{at:new Date().toISOString(),pid:process.pid,source:479,sourceRows:source.files.length,helperSha256:hash(fs.readFileSync(process.argv[1])),input623Sha256:hash(raw),command,independentVerification:true,newNormalSavedCommands:0,compatibility:0})
try {
  const at=name=>import(pathToFileURL(path.join(source.target,'src',name)).href)
  const [{createCampaignCodec},{evaluateCommand,previewCommand},{canonicalJson}]=await Promise.all([at('application/campaign.ts'),at('core/commands.ts'),at('core/identity.ts')])
  const codec=createCampaignCodec()
  const run=measure('candidate-import623',()=>codec.import(raw))
  if(run.revision!==623 || run.seed!=='normal-relay-s03-v1' || run.origin!=='normal') throw Error('SAME_NORMAL623_REQUIRED')
  const preview=measure('candidate-original624-preview',()=>previewCommand(run,command,codec.registry,run.actorId))
  if(!preview.allowed) throw Error('ORIGINAL624_PREVIEW_REFUSED')
  const result=measure('candidate-original624-evaluate',()=>evaluateCommand(run,command,codec.registry,run.actorId))
  if(result.status!=='proposed') throw Error('ORIGINAL624_NOT_PROPOSED')
  const actualHash=measure('whole-original624-proposal-identity',()=>hash(canonicalJson(result.nextRun)))
  if(actualHash!==prepared.goldenActualUnwritten624CanonicalSha256) throw Error('WHOLE_ORIGINAL_PROPOSAL_CHANGED')
  const wire=measure('candidate-export624',()=>codec.export(result.nextRun))
  if(hash(wire)!==prepared.golden473WireSha256 || Buffer.byteLength(wire)!==prepared.golden473WireBytes) throw Error('COMPLETE_KNOWN624_ENCODING_CHANGED')
  const loaded=measure('candidate-import-own624',()=>codec.import(wire))
  measure('whole-candidate-roundtrip',()=>{if(canonicalJson(loaded)!==canonicalJson(result.nextRun))throw Error('WHOLE_GAME_RUN_ROUNDTRIP_CHANGED')})
  const reference=fs.readFileSync('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/save-capacity-r471/candidate624.json','utf8')
  if(wire!==reference || !exact()) throw Error('ORIGINAL_WIRE_OR_SOURCE_CHANGED')
  put('candidate624.json',wire)
  const report={at:new Date().toISOString(),source:479,sourceRows:source.files.length,sourceExact:true,command,preview,inputRevision:623,outputRevision:624,date:loaded.timeline.cursor.date,wholeOriginalKernel624ProposalEqual:true,wholeOriginalProposalCanonicalSha256:actualHash,wholeValidated473WireByteEqual:true,wireBytes:Buffer.byteLength(wire),wireSha256:hash(wire),wholeCandidateGameRunRoundTripEqual:true,measured,totalWallMs:performance.now()-started,newNormalSavedCommands:0,newNative:0,newIndexedDbWrites:0,wholeU6Complete:false,compatibility:0,notFormalPerformancePass:true}
  put('replay624-result.json',report)
  console.log({phase:'whole-original624-verified',wireBytes:report.wireBytes,wholeOriginalProposalEqual:true,wholeWireEqual:true,totalWallMs:report.totalWallMs})
} catch(error){
  put('replay624-failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error.stack,measured,wallMs:performance.now()-started,newNormalSavedCommands:0,compatibility:0})
  throw error
} finally { fs.closeSync(log) }
