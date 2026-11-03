import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {performance} from 'node:perf_hooks'
import {deflate} from 'pako'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/save-capacity-r471',meta=json(out+'/source.json'),core=json(meta.originalCoreManifest),oldSource=json(meta.originalCodecManifest)
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/capacity624-probe-result.json') || !json(out+'/audit623-result.json').entireOriginal623WireByteEqual) throw Error('FRESH_AUDITED_PROPOSAL_PROBE_REQUIRED')
const exact=source=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256)
const at=(source,name)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const put=(name,value)=>fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})
let phase='source';const measured=[]
function measure(name,fn){phase=name;console.log({phase:name,status:'start'});const start=performance.now(),cpu=process.cpuUsage(),value=fn(),used=process.cpuUsage(cpu);measured.push({phase:name,wallMs:performance.now()-start,cpuUserMs:used.user/1000,cpuSystemMs:used.system/1000});return value}
try {
  if(!exact(core) || !exact(oldSource)) throw Error('EXACT_ORIGINAL_SOURCES_REQUIRED')
  const [{createCampaignCodec},{RunCodec},{canonicalJson},{hashText,utf8Length},{encodeDictionaryJson},{inspectJsonInput},limits,{fingerprintCommand}]=await Promise.all([at(core,'application/campaign.ts'),at(oldSource,'persistence/codec.ts'),at(core,'core/identity.ts'),at(core,'core/hash.ts'),at(oldSource,'persistence/save-dictionary.ts'),at(core,'core/json-input.ts'),at(oldSource,'persistence/save-limits.ts'),at(core,'core/commands.ts')])
  const codec=new RunCodec(createCampaignCodec().registry,['technical_employee','content_employee'])
  const pending=json(root+'/ledger-prefix-post-commit-01/pending624.json')
  function loadValidated(){
    const bytes=fs.readFileSync(meta.proposal624)
    if(hash(bytes)!==meta.proposal624Sha256 || bytes.length!==meta.proposal624Bytes) throw Error('EXACT_UNWRITTEN_ORIGINAL624_REQUIRED')
    const original=JSON.parse(bytes.toString()),expectedHash=hash(canonicalJson(original))
    const state=codec.validateRun(original)
    if(hash(canonicalJson(state))!==expectedHash || state.revision!==624 || state.runId!=='u6-board-capital-pilot-v1' || state.origin!=='normal' || state.seed!=='normal-relay-s03-v1' || state.timeline.cursor.date!=='2024-10-20') throw Error('ACTUAL_FULL_ORIGINAL_PROPOSAL_CHANGED')
    return{state,expectedHash}
  }
  const {state,expectedHash}=measure('validate-original-unwritten624',loadValidated)
  const last=state.receipts.at(-1),fingerprint=fingerprintCommand(state,pending,codec.registry,state.actorId)
  if(last.commandId!==pending.commandId || last.payloadSignature!==fingerprint.signature || last.payloadHash!==fingerprint.hash) throw Error('EXACT_PENDING624_RECEIPT_REQUIRED')
  let oldError=null
  measure('repeat-original-encoder-rejection',()=>{try{codec.export(state)}catch(error){oldError={error:String(error),stack:error.stack}}})
  if(oldError?.error!=='RuleError: SAVE_TOO_LARGE' || !oldError.stack.includes('/save-packing.ts:57:')) throw Error('ORIGINAL_ENCODED_BUDGET_RED_MUST_REPRODUCE')
  put('capacity624-original-red.json',{at:new Date().toISOString(),...oldError,originalKernelProposalNotSaved:true,source:'original416-registry/459-codec',compatibility:0})

  // Independent reference for the existing logical-v1 checksum contract. The
  // state above was validated by the original RunCodec; no business fields vary.
  const body={saveVersion:1,...state.versions,runId:state.runId,revision:state.revision,state}
  const envelope={...body,checksum:measure('reference-v1-checksum',()=>hashText(canonicalJson(body)))}
  const logical=measure('reference-logical-text',()=>canonicalJson(envelope)),logicalBytes=utf8Length(logical)
  const nodes=inspectJsonInput(envelope,limits.MAX_LOGICAL_SAVE_NODES)
  if(logicalBytes>limits.MAX_LOGICAL_SAVE_BYTES) throw Error('LOGICAL_LIMIT_MUST_NOT_BE_RELAXED')
  const tokens=measure('original-dictionary-tokens',()=>encodeDictionaryJson(envelope,logicalBytes))
  const {state:omitted,saveVersion:omittedVersion,...metadata}=envelope,payloadHash=hashText(logical),attempts=[]
  let strongWire=null
  for(const level of [3,9]){
    const compressed=measure('dictionary-deflate-level'+level,()=>deflate(tokens,{level}))
    const document={...metadata,saveVersion:3,packing:'zlib-dictionary-v1',logicalBytes,packedBytes:tokens.length,payloadHash,payload:Buffer.from(compressed).toString('base64')}
    const wire=canonicalJson(document),wireBytes=utf8Length(wire),fits=wireBytes<=limits.MAX_ENCODED_SAVE_BYTES
    attempts.push({level,compressedBytes:compressed.length,base64Bytes:document.payload.length,completeWireBytes:wireBytes,encodedLimit:limits.MAX_ENCODED_SAVE_BYTES,fitsOriginalLimit:fits,logicalBytes,packedBytes:tokens.length})
    if(level===3 && fits) throw Error('REFERENCE_MUST_MATCH_ORIGINAL_CAPACITY_FAILURE')
    if(level===9 && fits){strongWire=wire;put('capacity624-level9-alternative.json',wire)}
    console.log({phase:'compression-observed',...attempts.at(-1)})
  }
  if(!strongWire){put('capacity624-probe-result.json',{at:new Date().toISOString(),status:'stronger-compression-still-too-large',attempts,measured,limits,newGameCommands:0,original624StillNotSaved:true,productChanges:0,compatibility:0});console.log({phase:'capacity-still-insufficient',productChanges:0})}
  else {
    const loaded=measure('original-old-reader-imports-level9',()=>codec.import(strongWire))
    if(hash(canonicalJson(loaded))!==expectedHash) throw Error('ORIGINAL_OLD_READER_CHANGED_WHOLE_GAME_RUN')
    if(!exact(core) || !exact(oldSource)) throw Error('FROZEN_SOURCE_CHANGED')
    put('capacity624-probe-result.json',{at:new Date().toISOString(),status:'same-format-stronger-compression-feasible',attempts,measured,limits,oldEncoderStillRejects:true,originalOldReaderAcceptedAlternative:true,entireOriginalProposalGameRunHashEqual:true,wholeOriginalProposalCanonicalSha256:expectedHash,alternativeWireBytes:Buffer.byteLength(strongWire),alternativeWireSha256:hash(strongWire),sourceExact:true,referenceLogicalEnvelopeOnlyNotNewProductWriter:true,original624StillNotSaved:true,newGameCommands:0,newNative:0,newIndexedDbWrites:0,productChanges:0,wholeStepPerformancePassed:false,wholeU6Complete:false,compatibility:0})
    console.log({phase:'capacity-feasible-old-reader-equal',wireBytes:Buffer.byteLength(strongWire),wholeOriginalProposalGameRunHashEqual:true,newGameCommands:0})
  }
} catch(error){put('capacity624-probe-failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error.stack,measured,productChanges:0,newGameCommands:0,compatibility:0});throw error}
