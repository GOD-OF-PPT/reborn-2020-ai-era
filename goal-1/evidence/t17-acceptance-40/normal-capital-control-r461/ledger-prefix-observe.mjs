import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {performance} from 'node:perf_hooks'
import {isDeepStrictEqual} from 'node:util'
import {Session} from 'node:inspector/promises'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461'
const out=root+'/ledger-prefix-r470'
const mode=process.argv[2],label=process.argv[3],gate=process.argv[4]
if(!['selftest','observe'].includes(mode) || !/^[-a-z0-9]+$/.test(label??'') || fs.existsSync(out+'/stopped.json')) throw Error('EXPLICIT_ACTIVE_MODE_AND_FRESH_LABEL_REQUIRED')
if(fs.existsSync(out+'/'+label+'.result.json') || fs.existsSync(out+'/'+label+'.failure.json')) throw Error('FRESH_LABEL_REQUIRED')
const helperSha256=hash(fs.readFileSync(process.argv[1]))
const keepAlive=setInterval(()=>{},1000)
let session,phase='initialization'
const put=(name,value)=>{
  if(fs.existsSync(out+'/stopped.json')) throw Error('EVIDENCE_ROOT_STOPPED')
  fs.writeFileSync(out+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
}
const moduleAt=(source,name)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const validProfile=profile=>Array.isArray(profile.nodes) && profile.nodes.length>0 && Array.isArray(profile.samples) && profile.samples.length>=2 && Array.isArray(profile.timeDeltas) && profile.timeDeltas.length===profile.samples.length && profile.endTime>profile.startTime
async function profilerStart(){
  session=new Session()
  session.connect()
  await session.post('Profiler.enable')
  await session.post('Profiler.setSamplingInterval',{interval:10000})
  await session.post('Profiler.start')
}
async function profilerStop(){
  const {profile}=await session.post('Profiler.stop')
  await session.post('Profiler.disable')
  session.disconnect();session=null
  if(!validProfile(profile)) throw Error('VALID_SELF_PROFILE_REQUIRED')
  return profile
}
function samplerExercise(){
  const start=performance.now();let n=0x18a73
  while(performance.now()-start<250) n=Math.imul(n^0x5a31,1664525)+1013904223|0
  return n
}

try {
  if(mode==='selftest'){
    phase='selftest-profiler'
    await profilerStart()
    const sink=samplerExercise(),profile=await profilerStop()
    put(label+'.cpuprofile',profile)
    const result={at:new Date().toISOString(),mode,label,node:process.version,pid:process.pid,helperSha256,selftestPassed:true,samples:profile.samples.length,nodes:profile.nodes.length,profileWindowUs:profile.endTime-profile.startTime,sink,profilerConnection:'own process Session.connect only',newGameCommands:0,compatibility:0}
    put(label+'.result.json',result)
    console.log(result)
  } else {
    phase='selftest-gate'
    if(!/^[-a-z0-9]+$/.test(gate??'')) throw Error('EXPLICIT_COMPLETED_SELFTEST_REQUIRED')
    const tested=json(out+'/'+gate+'.result.json'),terminal=json(out+'/'+gate+'.process-terminal.json')
    if(!tested.selftestPassed || tested.helperSha256!==helperSha256 || tested.node!==process.version || terminal.exitCode!==0 || terminal.pid!==tested.pid || terminal.helperSha256!==helperSha256) throw Error('SAME_HELPER_ACTUAL_EXIT_ZERO_SELFTEST_REQUIRED')
    const meta=json(out+'/source.json')
    if(hash(fs.readFileSync(meta.sourceManifest))!==meta.sourceManifestSha256) throw Error('PINNED_SOURCE_MANIFEST_REQUIRED')
    const candidate=json(meta.sourceManifest),control=json(meta.controlManifest),sources=[control,candidate]
    const exact=()=>sources.every(source=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256))
    if(!exact()) throw Error('EXACT_FROZEN_SOURCES_REQUIRED')
    if(hash(fs.readFileSync(root+'/run605.ts'))!==meta.originalDriverSha256) throw Error('ORIGINAL_DRIVER_CHANGED')
    put(label+'.started.json',{at:new Date().toISOString(),pid:process.pid,helperSha256,gate,control:464,candidate:469,newGameCommands:0,compatibility:0})
    console.log({phase:'actual-input-read',pid:process.pid,control:464,candidate:469})

    phase='actual-input-read'
    const cap=json(meta.capture),raw612=fs.readFileSync(cap.input612),raw613=fs.readFileSync(meta.actual613)
    if(hash(raw612)!==cap.input612Sha256 || hash(raw613)!==cap.sha256) throw Error('ACTUAL_ORIGINAL612_AND613_REQUIRED')
    const {unpackSave}=await moduleAt(candidate,'persistence/save-packing.ts')
    const {canonicalJson}=await moduleAt(candidate,'core/identity.ts')
    function originalInputs(){
      const before=JSON.parse(unpackSave(JSON.parse(raw612.toString())).text).state
      const after=JSON.parse(unpackSave(JSON.parse(raw613.toString())).text).state
      if(before.revision!==612 || after.revision!==613 || before.runId!=='u6-board-capital-pilot-v1' || after.runId!==before.runId || before.origin!=='normal' || after.origin!=='normal') throw Error('SAME_NORMAL_RUN_REQUIRED')
      const ledger=before.economy.ledger,originalNext=after.economy.ledger,baseCount=ledger.receipts.length
      if(!isDeepStrictEqual(originalNext.receipts.slice(0,baseCount),ledger.receipts)) throw Error('WHOLE_ORIGINAL_RECEIPT_PREFIX_REQUIRED')
      const added=originalNext.receipts.slice(baseCount)
      if(added.length<40) throw Error('FORTY_REAL_ADDED_RECEIPTS_REQUIRED')
      const operations=added.slice(0,40).map((receipt,index)=>{
        const operation=JSON.parse(receipt.signature)
        if(operation.id!==receipt.id || operation.kind!==receipt.kind || operation.accountId!==receipt.accountId || canonicalJson(operation)!==receipt.signature) throw Error('EXACT_ORIGINAL_OPERATION_SIGNATURE_REQUIRED:'+index)
        return{index,originalReceipt:receipt,operation}
      })
      return{ledger,operations,originalReceiptCount:baseCount,actualAddedReceipts:added.length}
    }
    const input=originalInputs(),base=input.ledger,baselineSha256=hash(canonicalJson(base))
    put(label+'.inputs.json',{at:new Date().toISOString(),input612Sha256:cap.input612Sha256,actual613Sha256:cap.sha256,originalReceiptCount:input.originalReceiptCount,actualAddedReceipts:input.actualAddedReceipts,selectedFirstActualReceipts:40,operations:input.operations,source:469,control:464,notNewGameCommands:true,compatibility:0})
    const oldLedger=await moduleAt(control,'core/ledger.ts'),newLedger=await moduleAt(candidate,'core/ledger.ts')
    const steps=[],oldHashes=[]
    function measureApply(implementation,state,row){
      const start=performance.now(),cpu=process.cpuUsage()
      const next=implementation.applyLedger(state,row.operation)
      const spent=process.cpuUsage(cpu)
      const timing={source:implementation.source,index:row.index,operationId:row.operation.id,kind:row.operation.kind,date:row.operation.date,wallMs:performance.now()-start,cpuUserMs:spent.user/1000,cpuSystemMs:spent.system/1000}
      if(next.receipts.length!==input.originalReceiptCount+row.index+1 || !isDeepStrictEqual(next.receipts.at(-1),row.originalReceipt)) throw Error('ORIGINAL_RECEIPT_RESULT_CHANGED:'+row.index)
      return{next,timing}
    }
    function prefixHashReadback(state){return hash(canonicalJson(state))}

    phase='control-prefix'
    oldLedger.assertLedger(base)
    let state=base
    const oldImplementation={applyLedger:oldLedger.applyLedger,source:464}
    for(const row of input.operations){
      const step=measureApply(oldImplementation,state,row);state=step.next
      const sha256=prefixHashReadback(state);oldHashes.push(sha256)
      steps.push({...step.timing,wholeCanonicalLedgerSha256:sha256,actualReceiptMatched:true})
    }
    if(prefixHashReadback(base)!==baselineSha256) throw Error('ORIGINAL_BASELINE_MUTATED')
    put(label+'.control-prefix.json',{source:464,steps:[...steps],baselineUnchanged:true,baselineSha256,compatibility:0})
    state=null
    console.log({phase:'control-prefix-complete',actualOperations:40,completeLedgerHashes:oldHashes.length})

    phase='candidate-prefix-profile'
    newLedger.assertLedger(base)
    const newImplementation={applyLedger:newLedger.applyLedger,source:469}
    state=base
    await profilerStart()
    for(const row of input.operations){
      const step=measureApply(newImplementation,state,row);state=step.next
      const sha256=prefixHashReadback(state)
      if(sha256!==oldHashes[row.index]) throw Error('WHOLE_LEDGER_PREFIX_CHANGED:'+row.index)
      steps.push({...step.timing,wholeCanonicalLedgerSha256:sha256,actualReceiptMatched:true,wholeLedgerMatchesControl:true})
    }
    const profile=await profilerStop()
    put(label+'.cpuprofile',profile)
    if(prefixHashReadback(base)!==baselineSha256 || !exact()) throw Error('BASELINE_OR_SOURCE_CHANGED')
    const result={at:new Date().toISOString(),mode,label,pid:process.pid,node:process.version,helperSha256,control:464,candidate:469,actualOperations:40,controlFullLedgerPrefixHashes:oldHashes,steps,allFortyCompleteLedgerPrefixesEqual:true,allActualReceiptResultsEqual:true,baselineUnchanged:true,baselineSha256,sourceExact:true,profile:{samples:profile.samples.length,nodes:profile.nodes.length,windowUs:profile.endTime-profile.startTime,includesPrefixHashReadbackOutsideApplyLedger:true},timingScope:'Only synchronous applyLedger measured per operation; inspector enabled for candidate only; baseline assert precedes each sequence',notFullGameRunReplay:true,notNewGameCommands:true,notFormalPerformancePass:true,compatibility:0,wholeU6Complete:false}
    put(label+'.result.json',result)
    console.log({phase:'actual-prefix-profile-complete',actualOperations:40,allFortyCompleteLedgerPrefixesEqual:true,samples:profile.samples.length,sourceExact:true,newGameCommands:0})
  }
} catch(error) {
  put(label+'.failure.json',{at:new Date().toISOString(),mode,label,phase,error:String(error),stack:error.stack,helperSha256,originalProcessNotTouched:true,newGameCommands:0,compatibility:0})
  console.error(String(error));process.exitCode=1
} finally {
  try{session?.disconnect()}finally{clearInterval(keepAlive)}
}
