import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/ledger-prefix-r470',meta=json(out+'/source.json'),source=json(meta.sourceManifest)
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/cache-witness.json')) throw Error('FRESH_ACTIVE_WITNESS_REQUIRED')
const exact=()=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
if(!exact()) throw Error('EXACT469_REQUIRED')
const ledgerText=fs.readFileSync(path.join(source.target,'src/core/ledger.ts'),'utf8')
if(!ledgerText.includes('const MAX_PARSED_RECEIPTS = 32768') || !ledgerText.includes('const MAX_PARSED_SIGNATURE_CHARS = 16 * 1024 * 1024') || !ledgerText.includes('const MAX_CACHED_SIGNATURE_CHARS = 8192')) throw Error('EXACT_OBSERVED_CACHE_LIMITS_REQUIRED')
const cap=json(meta.capture),raw=fs.readFileSync(cap.input612)
if(hash(raw)!==cap.input612Sha256) throw Error('PINNED_ORIGINAL612_REQUIRED')
const at=name=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const [{unpackSave},{canonicalJson},{assertLedger}]=await Promise.all([at('persistence/save-packing.ts'),at('core/identity.ts'),at('core/ledger.ts')])
function readLedger(){
  const run=JSON.parse(unpackSave(JSON.parse(raw.toString())).text).state
  if(run.revision!==612 || run.runId!=='u6-board-capital-pilot-v1' || run.origin!=='normal') throw Error('SAME_NORMAL612_REQUIRED')
  return run.economy.ledger
}
const ledger=readLedger(),before=hash(canonicalJson(ledger)),signatures=new Set(ledger.receipts.map(receipt=>receipt.signature)),nativeParse=JSON.parse
const eligible=ledger.receipts.filter(receipt=>typeof receipt.signature==='string' && receipt.signature.length<=8192)
let active=false,receiptCalls=0,otherCalls=0
function countingParse(...args){
  if(active){if(typeof args[0]==='string' && signatures.has(args[0])) receiptCalls++;else otherCalls++}
  return Reflect.apply(nativeParse,JSON,args)
}
try {
  JSON.parse=countingParse
  for(const text of ['null','42','true','"test"','[1,{"x":2}]']) if(!isDeepStrictEqual(JSON.parse(text),nativeParse(text))) throw Error('COUNTING_PARSE_CHANGED_VALUE')
  let actual,expected
  try{nativeParse('{')}catch(error){expected={name:error.name,message:error.message}}
  try{JSON.parse('{')}catch(error){actual={name:error.name,message:error.message}}
  if(!isDeepStrictEqual(actual,expected) || !actual) throw Error('COUNTING_PARSE_CHANGED_FAILURE')
} finally {JSON.parse=nativeParse}
const passes=[]
for(let index=0;index<3;index++){
  receiptCalls=0;otherCalls=0;active=true
  try {JSON.parse=countingParse;assertLedger(ledger)} finally {JSON.parse=nativeParse;active=false}
  if(hash(canonicalJson(ledger))!==before || JSON.parse!==nativeParse) throw Error('BASELINE_OR_BINDING_CHANGED')
  passes.push({index,label:index===0?'first validation':'same exact ledger repeated',receiptSignatureParseCalls:receiptCalls,otherParseCalls:otherCalls,validatorPassed:true,wholeLedgerUnchanged:true,nativeBindingRestored:true})
  console.log(passes.at(-1))
}
if(!exact() || hash(fs.readFileSync(root+'/run605.ts'))!==meta.originalDriverSha256) throw Error('SOURCE_OR_ORIGINAL_DRIVER_CHANGED')
const result={at:new Date().toISOString(),pid:process.pid,source:469,inputRevision:612,input612Sha256:cap.input612Sha256,ledgerReceiptCount:ledger.receipts.length,eligibleReceiptCount:eligible.length,eligibleSignatureChars:eligible.reduce((sum,r)=>sum+r.signature.length,0),cacheLimits:{entries:32768,signatureChars:16*1024*1024,singleSignatureChars:8192},nativeForwardingSelftestPassed:true,passes,wholeLedgerSha256:before,wholeLedgerUnchanged:true,nativeBindingRestored:JSON.parse===nativeParse,sourceExact:true,onlyOwnProcessInstrumented:true,countObservationOnlyNotTiming:true,newGameCommands:0,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(out+'/cache-witness.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log({receipts:result.ledgerReceiptCount,eligible:result.eligibleReceiptCount,parseCalls:passes.map(row=>row.receiptSignatureParseCalls),wholeLedgerUnchanged:true,newGameCommands:0})
