import fs from 'node:fs'
import path from 'node:path'
import {isDeepStrictEqual} from 'node:util'
import {json,hash} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',phase=root+'/money-sum-r464',source=json(phase+'/snapshot469.json'),terminal=json(phase+'/replay613-process-terminal.json')
if(fs.existsSync(phase+'/stopped.json') || terminal.sessionId!==89899 || terminal.pid!==33943 || terminal.source!==469 || terminal.exitCode!==0) throw Error('ACTUAL_SUCCESSFUL_REPLAY_REQUIRED')
const capture=json(phase+'/capture613.json'),result=json(phase+'/replay613-result.json'),started=json(phase+'/replay613-started.json')
if(result.source!==469 || result.inputRevision!==612 || result.outputRevision!==613 || result.date!=='2024-08-10' || !result.preview.allowed || !result.wholeOriginal613WireByteEqual || !result.wholeCandidateGameRunRoundTripEqual || !isDeepStrictEqual(result.command,capture.originalCommand) || started.helperSha256!==hash(fs.readFileSync(root+'/money-replay613.mjs')) || fs.existsSync(phase+'/replay613-failure.json')) throw Error('EXACT_COMPLETE_ORIGINAL_COMMAND_RESULT_REQUIRED')
const input=fs.readFileSync(capture.input612),original=fs.readFileSync(root+'/fact-index-r462/original613.json'),candidate=fs.readFileSync(phase+'/candidate613.json')
if(hash(input)!==capture.input612Sha256 || hash(original)!==capture.sha256 || !candidate.equals(original) || hash(candidate)!==result.wholeOriginalWireSha256 || candidate.length!==result.wholeOriginalWireBytes) throw Error('WHOLE_ACTUAL_INPUT_AND_OUTPUT_BYTES_REQUIRED')
for(const row of source.files) if(hash(fs.readFileSync(path.join(source.target,row.path)))!==row.sha256) throw Error('FROZEN469_CHANGED')
for(const name of source.owned) if(hash(fs.readFileSync(name))!==source.files.find(row=>row.path===name)?.sha256) throw Error('OWNED_SOURCE_CHANGED')
const report={at:new Date().toISOString(),source:469,inputRevision:612,outputRevision:613,input612Sha256:hash(input),original613Sha256:hash(original),candidate613Sha256:hash(candidate),bytes:candidate.length,candidateMatchesActualOriginalRawBytes:true,wholeCandidateGameRunRoundTripReportedByCompletedPinnedProducer:true,sourceExact:true,actualProcessExitCode:terminal.exitCode,notNewIndependentNative:true,notFormalPerformancePass:true,newGameCommands:0,compatibility:0,wholeU6Complete:false}
fs.writeFileSync(phase+'/replay613-byte-readback.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log({source:469,wholeActualOriginal613WireByteEqual:true,bytes:candidate.length,sha256:hash(candidate),wholeU6Complete:false,compatibility:0})
