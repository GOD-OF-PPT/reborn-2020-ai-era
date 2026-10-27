import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
import {read,requireIdentity,identityEqual,validatePublicReadbackResult,guard,repo} from '../final-create-final-inputs-r1/audit-io.mjs'
import {correctionContext} from './correction-context-r2.candidate.mjs'

// Candidate only. This process can spawn exactly the registered pure-JSON
// replacement readback; there is no Create/replay/codec command in this wrapper.
if(process.argv.length!==4||process.argv[2]!=='--root-go')throw Error('EXPLICIT_CORRECTION_GO_REQUIRED')
const correction=correctionContext(process.argv[3],'runner'),{go,out,tracked,contract,contractData}=correction
const self=read(path.relative(repo,fileURLToPath(import.meta.url)).split(path.sep).join('/'))
if(!identityEqual(self.identity,go.correctionRunner))throw Error('EXACT_ROOT_GO_CORRECTION_RUNNER_REQUIRED')
guard(path.dirname(out));if(fs.existsSync(out))throw Error('FRESH_READBACK_CORRECTION_OUTPUT_REQUIRED');fs.mkdirSync(out);guard(out)
const put=(name,value)=>{if(path.basename(name)!==name)throw Error('OWNED_CORRECTION_FILENAME_REQUIRED');guard(out);fs.writeFileSync(path.join(out,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
const began=Date.now(),argv=['proxy','env','U4B_READBACK_CORRECTION_GO='+process.argv[3],process.execPath,'--experimental-strip-types',go.replacementScript.path]
put('correction-source-before.json',{files:tracked});put('correction-command.json',{at:new Date().toISOString(),argv:['rtk',...argv],go:correction.goData.identity,originalContract:contractData.identity,replacementScript:go.replacementScript,newCreateExecutions:0,onlyRepeatedWork:'The same 33 public JSON facts for clean replacement process/output closure; original green33 are not a new66.'})
let processTerminal=null,error=null,after=null,differences=null,result=null,readbackIdentity=null,wiringValid=false
try{
 const r=spawnSync('rtk',argv,{cwd:repo,encoding:'utf8',maxBuffer:64*1024*1024})
 processTerminal={at:new Date().toISOString(),argv:['rtk',...argv],exitCode:r.status,signal:r.signal,error:r.error?.message??null,wallMs:Date.now()-began}
 put('correction-process-stdout.log',r.stdout??'');put('correction-process-stderr.log',r.stderr??'')
 // Distinct from the unchanged child-owned readback-terminal.json.
 put('correction-process-terminal.json',processTerminal)
 const resultData=read(go.outputDirectory+'/readback-result.json');readbackIdentity=resultData.identity;result=JSON.parse(resultData.bytes.toString('utf8'));wiringValid=validatePublicReadbackResult(result,contract,contractData.identity)
 if(processTerminal.exitCode!==0||processTerminal.signal!==null||processTerminal.error!==null||result.checks!==33||result.passedChecks!==33||result.error!==null)throw Error('CORRECTION_PUBLIC_READBACK_PROCESS_OR33_FAILED')
}catch(failure){error={name:failure.name,message:failure.message,stack:failure.stack}}
try{correction.verify();after=tracked.map(r=>requireIdentity(r).identity);differences=tracked.filter((r,i)=>!identityEqual(r,after[i]));put('correction-source-after.json',{files:after,differences})}catch(failure){error??={name:failure.name,message:failure.message,stack:failure.stack}}
const passed=error===null&&processTerminal?.exitCode===0&&wiringValid&&result?.passed===true&&differences!==null&&differences.length===0
const final={at:new Date().toISOString(),passed,wallMs:Date.now()-began,operation:go.operation,originalAuditDirectory:correction.directory,originalContract:contractData.identity,rootGo:correction.goData.identity,independentReview:go.independentReview,replacementScript:go.replacementScript,processTerminal,publicReadback:readbackIdentity,publicReadbackWiringValid:wiringValid,checks:result?.checks??null,passedChecks:result?.passedChecks??null,differences,error,newCreateExecutions:0,newNativeCommands:0,originalOuterFailurePreserved:true,limits:'Readback-only packaging correction. Original green Create is reused, never rerun. Same33 facts recomputed once, not66 new checks; no Browser/visual/human/whole-goal acceptance.'}
put('correction-result.json',final);put('correction-wrapper-terminal.json',{at:final.at,passed,exitCode:passed?0:1,wallMs:final.wallMs});console.log(JSON.stringify(final));if(!passed)process.exitCode=1
