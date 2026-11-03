import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {performance} from 'node:perf_hooks'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-40/normal-capital-resume623-r474'
const out=root+'/receipt-cache-r475'
const reference='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/ledger-prefix-r470'
const source=json(out+'/snapshot477.json')
const capture=json('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/money-sum-r464/capture613.json')
const inputs=json(reference+'/observe-v1.inputs.json')
const expected=json(reference+'/observe-v1.result.json')
const exact=()=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
const at=name=>import(pathToFileURL(path.join(source.target,'src',name)).href)
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/actual-components.json') || !exact()) throw Error('FRESH_EXACT_COMPONENT_VERIFY_REQUIRED')

const [{unpackSave},{canonicalJson},{assertLedger,applyLedger}]=await Promise.all([at('persistence/save-packing.ts'),at('core/identity.ts'),at('core/ledger.ts')])
const bytes=fs.readFileSync(capture.input612)
if(hash(bytes)!==capture.input612Sha256 || inputs.input612Sha256!==capture.input612Sha256) throw Error('ORIGINAL612_REQUIRED')
function readOriginalLedger(){
  const run=JSON.parse(unpackSave(JSON.parse(bytes.toString())).text).state
  if(run.revision!==612 || run.origin!=='normal' || run.runId!=='u6-board-capital-pilot-v1') throw Error('SAME_NORMAL612_REQUIRED')
  return run.economy.ledger
}
const ledger=readOriginalLedger(),before=hash(canonicalJson(ledger)),nativeParse=JSON.parse,passes=[]
for(let index=0;index<3;index++){
  let parseCalls=0
  JSON.parse=(...args)=>{parseCalls++;return Reflect.apply(nativeParse,JSON,args)}
  try { assertLedger(ledger) } finally { JSON.parse=nativeParse }
  if(hash(canonicalJson(ledger))!==before) throw Error('BASELINE_CHANGED')
  passes.push({index,parseCalls,ledgerPassed:true,nativeBindingRestored:JSON.parse===nativeParse})
}
if(passes[0].parseCalls!==47156 || passes[1].parseCalls!==passes[2].parseCalls || passes[1].parseCalls>=47156/2 || passes[0].parseCalls-passes[1].parseCalls>32768) throw Error('ACTUAL_BOUNDED_REUSE_NOT_ESTABLISHED')

const steps=[]
let state=ledger
for(const row of inputs.operations){
  const start=performance.now(),cpu=process.cpuUsage()
  state=applyLedger(state,row.operation)
  const used=process.cpuUsage(cpu)
  const sha256=hash(canonicalJson(state))
  if(sha256!==expected.controlFullLedgerPrefixHashes[row.index] || !isDeepStrictEqual(state.receipts.at(-1),row.originalReceipt)) throw Error('WHOLE_ACTUAL_LEDGER_PREFIX_CHANGED:'+row.index)
  steps.push({index:row.index,id:row.operation.id,wallMs:performance.now()-start,cpuUserMs:used.user/1000,cpuSystemMs:used.system/1000,wholeCanonicalLedgerSha256:sha256,actualReceiptMatched:true})
}
if(steps.length!==40 || hash(canonicalJson(ledger))!==before || !exact()) throw Error('FULL_FORTY_AND_BASELINE_REQUIRED')
const report={at:new Date().toISOString(),source:477,input612Sha256:capture.input612Sha256,passes,oldSameLedgerParseCountsReused:[47156,47156,47156],baselineSha256:before,baselineUnchanged:true,sourceExact:true,actualReceiptOperations:40,allFortyWholeLedgerPrefixesEqualToOriginal464:true,steps,newGameCommands:0,newNative:0,newIndexedDbWrites:0,compatibility:0,timingNote:'Wall includes full-prefix canonical hash after apply. CPU counters captured before hashing. Independent once-only component observation.',wholeU6Complete:false}
fs.writeFileSync(out+'/actual-components.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log({phase:'actual-components-passed',source:477,parseCounts:passes.map(row=>row.parseCalls),completeActualLedgerPrefixes:40,sourceExact:true})
