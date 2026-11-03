import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {performance} from 'node:perf_hooks'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',out=root+'/save-capacity-r471',meta=json(out+'/source.json'),candidate=json(out+'/snapshot472.json'),core=json(meta.originalCoreManifest),old=json(meta.originalCodecManifest),probe=json(out+'/capacity624-probe-result.json')
if(fs.existsSync(out+'/stopped.json') || fs.existsSync(out+'/actual472-result.json') || probe.status!=='same-format-stronger-compression-feasible') throw Error('FRESH_FEASIBLE_CANDIDATE_REQUIRED')
const exact=source=>source.files.every(row=>hash(fs.readFileSync(path.join(source.target,row.path)))===row.sha256),at=(source,name)=>import(pathToFileURL(path.join(source.target,'src',name)).href)
const put=(name,value)=>fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})
let phase='source';const measured=[]
function measure(name,fn){phase=name;console.log({phase:name,status:'start'});const start=performance.now(),cpu=process.cpuUsage(),value=fn(),used=process.cpuUsage(cpu);measured.push({phase:name,wallMs:performance.now()-start,cpuUserMs:used.user/1000,cpuSystemMs:used.system/1000});return value}
try {
  if(![candidate,core,old].every(exact)) throw Error('EXACT_FROZEN_SOURCES_REQUIRED')
  const [{createCampaignCodec},{RunCodec:OldCodec},{RunCodec:CandidateCodec},{canonicalJson},limits]=await Promise.all([at(core,'application/campaign.ts'),at(old,'persistence/codec.ts'),at(candidate,'persistence/codec.ts'),at(core,'core/identity.ts'),at(candidate,'persistence/save-limits.ts')])
  const registry=createCampaignCodec().registry,original=new OldCodec(registry,['technical_employee','content_employee']),codec=new CandidateCodec(registry,['technical_employee','content_employee'])
  const raw623=fs.readFileSync(meta.input623,'utf8')
  if(hash(raw623)!==meta.original623Sha256) throw Error('EXACT_ORIGINAL623_REQUIRED')
  function keepPreferred623(){
    const run=original.import(raw623),wire=codec.export(run)
    if(wire!==raw623) throw Error('ORIGINAL623_PREFERRED_WIRE_CHANGED')
    return{revision:623,bytes:Buffer.byteLength(wire),sha256:hash(wire),entireOriginalWireByteEqual:true}
  }
  const preserved623=measure('original623-preferred-wire-unchanged',keepPreferred623)
  function readOriginal624(){
    const raw=fs.readFileSync(meta.proposal624)
    if(hash(raw)!==meta.proposal624Sha256) throw Error('EXACT_ORIGINAL_UNWRITTEN624_REQUIRED')
    const run=JSON.parse(raw.toString())
    if(run.revision!==624 || run.runId!=='u6-board-capital-pilot-v1' || run.origin!=='normal' || hash(canonicalJson(run))!==probe.wholeOriginalProposalCanonicalSha256) throw Error('WHOLE_ORIGINAL_PROPOSAL_CHANGED')
    return run
  }
  const proposal=measure('read-original-unwritten624',readOriginal624),wire=measure('candidate-export624',()=>codec.export(proposal))
  if(Buffer.byteLength(wire)>limits.MAX_ENCODED_SAVE_BYTES) throw Error('UNCHANGED_ENCODED_LIMIT_EXCEEDED')
  if(wire!==fs.readFileSync(out+'/capacity624-level9-alternative.json','utf8')) throw Error('NEW_WRITER_DIFFERS_FROM_OLD_READER_VERIFIED_REFERENCE')
  put('candidate624.json',wire)
  const loaded=measure('candidate-import624',()=>codec.import(wire))
  measure('whole-original-proposal-GameRun-equality',()=>{if(canonicalJson(loaded)!==canonicalJson(proposal))throw Error('WHOLE_ORIGINAL_GAME_RUN_CHANGED')})
  const repeated=measure('candidate-export-own624-again',()=>codec.export(loaded))
  if(repeated!==wire) throw Error('SAME_TEXT_ENCODING_NOT_DETERMINISTIC')
  if(![candidate,core,old].every(exact)) throw Error('SOURCE_CHANGED')
  const report={at:new Date().toISOString(),source:472,sourceRows:candidate.files.length,sourceExact:true,preserved623,proposalRevision:624,proposalOriginalRawSha256:meta.proposal624Sha256,outputBytes:Buffer.byteLength(wire),outputSha256:hash(wire),withinOriginalEncodedLimit:true,encodedLimit:limits.MAX_ENCODED_SAVE_BYTES,logicalLimit:limits.MAX_LOGICAL_SAVE_BYTES,nodeLimit:limits.MAX_LOGICAL_SAVE_NODES,wholeOriginalProposalGameRunEqual:true,ownCodecImportExportWireDeterministic:true,oldReaderEvidenceReusedOnExactlySameReferenceWire:true,oldReaderProbe:'capacity624-probe-result.json',oldEncoderStillRejectsOriginalProposal:true,original624StillNotSaved:true,newLiveGameCommands:0,newNative:0,newIndexedDbWrites:0,mainChanged:false,measured,notFormalPerformancePass:true,wholeU6Complete:false,compatibility:0}
  put('actual472-result.json',report);console.log({phase:'candidate-actual-validation-complete',source:472,bytes:report.outputBytes,old623WireUnchanged:true,wholeOriginalProposalEqual:true,deterministic:true,original624StillNotSaved:true})
}catch(error){put('actual472-failure.json',{at:new Date().toISOString(),phase,error:String(error),stack:error.stack,measured,newLiveGameCommands:0,compatibility:0});throw error}
